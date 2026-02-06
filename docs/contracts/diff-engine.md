# XRAY Watchtower — Diff Engine Contract (NEW / CHANGED / FIXED / UNRESPONSIVE)

**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Applies to:** v1 baseline + verify scans (extends to v2/v3)  
**Inputs:** `docs/contracts/scan-result.md`, `docs/contracts/exposure-identity.md`

Related ADR (rationale):
- `docs/decisions/2026-02-05-0007-change-diff-engine-rules.md`

---

## 1. Purpose

Define the **exact, deterministic diff algorithm** that converts:
- current scan observations (worker payload)
- previous scan state

into exposure events:
- `NEW`
- `CHANGED`
- `FIXED`
- `UNRESPONSIVE`

This contract is the source of truth for:
- how exposures are deduped,
- how identities are created and compared,
- which changes count as material,
- how “unresponsive” is represented without creating noise.

Non-goals:
- Not the DB schema (but assumes persisted exposures and events).
- Not the scanning profiles or port allowlists (see v1 scan profiles doc).

---

## 2. Definitions

### 2.1 Scan
A single execution of the worker toolchain resulting in one payload.

### 2.2 Normalized exposure
A canonical internal representation built from the scan result payload.

Minimum normalized fields required for diff:
- `identity_key` (per `exposure-identity.md`)
- `tenant_id`
- `asset_id`
- `observed_host`
- `observed_ip`
- `risk_bucket` (`RB1`..`RB7`)
- `proto`, `port`
- `fingerprint` (debuggable string)
- `evidence` (JSON)
- `material_hash` (optional but recommended)

### 2.3 Exposure state row
A persisted row representing the latest known state of an exposure identity:
- open vs fixed vs suppressed/false_positive
- first_seen, last_seen
- last_evidence snapshot (or evidence hashes)
- last_change_type

### 2.4 Exposure event
An immutable record that something changed:
- `NEW`, `CHANGED`, `FIXED`, `UNRESPONSIVE`

---

## 3. Output guarantees

For a given scan, the diff engine MUST produce deterministic results:
- same inputs → same events (order-independent)
- no duplicate events for the same identity within the same scan
- no “flapping” due to unstable evidence fields (see material change rules)

---

## 4. Event definitions (authoritative)

### 4.1 `NEW`
Emit when:
- the exposure identity exists in the current scan normalized set
- and does not exist as **open** in the previous state snapshot

Notes:
- If the identity existed previously but was `FIXED`, treat reappearance as `NEW` again (and mark `reopened = true` in event metadata if you track it).

### 4.2 `CHANGED`
Emit when:
- the exposure identity exists in current scan
- and exists as open in previous state
- and the **material evidence** changed according to bucket-specific rules (see `exposure-identity.md` “Material change rules”)

### 4.3 `FIXED`
Emit when:
- the exposure identity was open in previous state
- and is NOT present in current scan normalized set
- and the current scan successfully executed enough checks to make absence meaningful

Notes:
- `FIXED` is only emitted when the scan is considered “authoritative for that identity”
  (see §6.3 “Authoritative absence rules”).

### 4.4 `UNRESPONSIVE`
Emit when:
- an endpoint is reachable enough to show an open port (or was previously reachable)
- but higher-level probing fails in a way that prevents classification or confirmation,
- OR the worker explicitly reports a symptom qualifying RB6.

In v1, `UNRESPONSIVE` is represented as:
- either:
  - an RB6 exposure identity (preferred, deterministic), **or**
  - a separate event type `UNRESPONSIVE` attached to a synthetic identity

**v1 rule (recommended):**  
Model unresponsive as RB6 exposures (bucket `RB6`) so identity_key remains consistent and diff logic stays simple.

---

## 5. Dedupe rules (within a scan)

### 5.1 Identity-level dedupe
Within a single scan, multiple observations may map to the same `identity_key`.  
The diff engine MUST emit at most **one normalized exposure per identity_key**.

### 5.2 Dedupe merge strategy (deterministic)
When merging duplicates:
- Prefer the exposure with **most complete evidence**, using this priority:
  1) has both `http` and `tls` evidence blocks (if applicable)
  2) has `nuclei` raw (for RB2/RB5)
  3) has certificate anchors (for RB4)
  4) otherwise, keep the first by deterministic ordering

Deterministic ordering for ties:
- sort by `(risk_bucket, observed_host, port, fingerprint, endpoint_id)` ascending
- take the first item

### 5.3 Dedupe across URLs (RB2/RB5)
RB2 identity includes canonical URL; therefore:
- two different URLs are distinct identities
- the same URL found multiple times → dedupe applies

---

## 6. Algorithm (exact pseudocode)

### 6.1 Inputs
- `scan_payload` (per `scan-result.md`)
- `previous_open_state` for the tenant + relevant assets:
  - map: `identity_key -> previous_state_record`
- `scan_metadata` (scan_id, tenant_id, kind, started_at, finished_at)

### 6.2 Core steps (pseudocode)

```pseudo
function process_scan(scan_payload):

  assert scan_payload.schema_version supported

  scan_id    = scan_payload.scan.scan_id
  tenant_id  = scan_payload.scan.tenant_id
  scan_kind  = scan_payload.scan.scan_kind
  profile    = scan_payload.scan.scan_profile

  # Step 1: normalize raw tool observations into candidate exposures
  candidates = normalize_to_exposures(scan_payload)

  # Step 2: compute identity_key + bucket-specific material fields
  for each e in candidates:
      e.identity_key = compute_identity_key(e)          # exposure-identity.md
      e.material_hash = compute_material_hash(e)        # optional but recommended

  # Step 3: dedupe within scan by identity_key (deterministic merge)
  current = dedupe_by_identity(candidates)

  # Step 4: load previous open state snapshot (open exposures only)
  prev_open = load_previous_open_state(tenant_id, scope=scan_payload.requested_asset_ids)
  # prev_open: map identity_key -> prev_record (includes last_material_hash and last_evidence subset)

  current_keys = set(keys(current))
  prev_keys    = set(keys(prev_open))

  events = []

  # Step 5: determine NEW / CHANGED for current exposures
  for each key in sort(current_keys):
      cur = current[key]
      prev = prev_open.get(key)

      if prev is null:
          events.append(make_event(type="NEW", cur=cur, prev=null))
          upsert_state_open(cur, scan_id)
          continue

      # prev exists and is open
      if is_material_change(prev, cur):
          events.append(make_event(type="CHANGED", cur=cur, prev=prev))
          upsert_state_open(cur, scan_id, changed=true)
      else:
          # still open, no event
          touch_last_seen(prev, scan_id, cur)

  # Step 6: determine FIXED for exposures absent now
  missing_keys = prev_keys - current_keys

  for each key in sort(missing_keys):
      prev = prev_open[key]

      if is_authoritative_absence(prev, scan_payload):
          events.append(make_event(type="FIXED", cur=null, prev=prev))
          mark_state_fixed(prev, scan_id)
      else:
          # do NOT mark fixed if scan wasn't authoritative for this identity
          # (e.g., scan failed early for that endpoint)
          touch_last_seen(prev, scan_id, prev)

  # Step 7: persist events (immutable) + update state tables
  persist_events(events)
  return events

6.3 Authoritative absence rules (FIXED gating)

To avoid false “FIXED” due to partial failures, FIXED is only emitted if:

The scan completed successfully (scan.finished_at exists and scan not failed), AND

The relevant endpoint was processed without endpoint-level fatal errors, AND

The tool required for that bucket ran for that endpoint:

Bucket requirements:

RB1: naabu ran for the endpoint and port allowlist includes the port

RB2: nuclei ran against the endpoint URL host/port (or at least httpx ran to confirm service)

RB3/RB4: tlsx ran for the endpoint port

RB5: httpx ran for the canonical URL root host/port

RB6: naabu ran; (RB6 disappears only when the port is no longer open or a known service is now identified)

RB7: DNS checks ran for the domain

If any requirement is not met:

do not emit FIXED

keep exposure open but update scan linkage / last_seen conservatively

7. Material change decision (exact rules)

Material change is bucket-specific and must match exposure-identity.md §8.
Implementation MUST use a stable “material field set” per bucket.

Recommended implementation:

material_hash = sha256(stable_json(material_fields))

is_material_change(prev, cur) = prev.material_hash != cur.material_hash

Material fields (v1):

RB1: (optional) stable banner class (if present); otherwise none → no CHANGED

RB2: (optional) extracted product/version (if present and stable); otherwise none

RB3: enabled old TLS versions set; weak cipher category

RB4: issue type; cert anchor; not_after bucket (expired vs near-expiry vs ok)

RB5: missing header set

RB6: symptom

RB7: DMARC policy; SPF all-mechanism; DKIM selector presence

If you do not implement RB1/RB2 material fields in v1:

RB1/RB2 should typically never emit CHANGED; they remain open until FIXED.

8. Required test cases (fixtures)

Each test case should have:

prev_open_state (map of identities with material_hash + evidence summary)

current_scan_normalized (list of exposures produced from payload)

expected events[] (types + identity_keys)

expected updated state outcomes

Test case 1 — RB1 NEW (SSH appears)

Prev: empty
Current: RB1 exposure: ssh on 203.0.113.10:22
Expect: NEW(RB1 ssh 22)
No FIXED/CHANGED

Test case 2 — RB1 FIXED (SSH disappears)

Prev: RB1 ssh 22 open
Current: no RB1 ssh 22 identity present
Scan authoritative: yes (naabu ran ok)
Expect: FIXED(RB1 ssh 22)

Test case 3 — RB4 NEW (near-expiry cert)

Prev: empty
Current: RB4 issue:near_expiry with cert anchor spki:X, port 443
Expect: NEW(RB4 near_expiry cert spki:X)

Test case 4 — RB4 CHANGED (near-expiry → expired)

Prev: RB4 near_expiry for cert spki:X
Current: RB4 expired for same cert spki:X
Expect: CHANGED(RB4 ... issue_type change)
State remains open with updated evidence

Test case 5 — RB4 CHANGED (cert rotation but still issue)

Prev: RB4 hostname_mismatch cert spki:OLD
Current: RB4 hostname_mismatch cert spki:NEW
Expect: CHANGED(RB4 ... cert anchor change)
(Indicates attempted fix/rotation but mismatch persists)

Test case 6 — RB5 NEW (missing headers set)

Prev: empty
Current: RB5 missing: csp,x-frame-options at https://example.com/
Expect: NEW(RB5 missing set + url root)

Test case 7 — RB5 CHANGED (missing set changes)

Prev: RB5 missing: csp,x-frame-options
Current: RB5 missing: csp only
Expect: CHANGED(RB5 missing set changed)

Test case 8 — RB6 NEW (port open but TLS handshake fails)

Prev: empty
Current: RB6 symptom:tls_handshake_fail on 203.0.113.10:443
Expect: NEW(RB6 tls_handshake_fail 443)

Test case 9 — RB6 FIXED via classification upgrade (RB6 disappears, RB2 appears)

Prev: RB6 tcp_open_no_banner on :8080
Current: RB2 nuclei panel match on http://host:8080/login

Expect:

FIXED(RB6 tcp_open_no_banner :8080) (authoritative naabu/httpx ok)

NEW(RB2 panel ...)

Test case 10 — No false FIXED on partial failure

Prev: RB1 ssh 22 open
Current: scan payload indicates endpoint/tool failure before naabu ran (or endpoint had fatal error)
Expect: no FIXED, no NEW/CHANGED; exposure remains open (last_seen not advanced or advanced conservatively)

9. Implementation notes (normative)

Sort keys before processing to guarantee deterministic event ordering.

Store material_hash for each exposure state to make CHANGED checks O(1).

Persist events immutably; update state separately.

Do not let unstable evidence fields influence material_hash.

::contentReference[oaicite:0]{index=0}
---
