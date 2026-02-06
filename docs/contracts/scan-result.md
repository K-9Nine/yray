# XRAY Watchtower — Scan Result Contract (Worker → API)

**Status:** Draft v1.1  
**Last updated:** 2026-02-05  
**Applies to:** v1 baseline/verify scans; extensible for v2/v3  
**Primary tools:** naabu, httpx, tlsx, nuclei (+ optional selective nmap)

Related:
- v1 scan profiles (ports/timeouts): `docs/spec/v1-scan-profiles.md`
- exposure identity rules: `docs/contracts/exposure-identity.md`

---

## 1. Purpose

Define a **stable, versioned payload** the scanner worker sends to the API ingestion endpoint.

Goals:
- Keep the payload shape stable across v1→v3 (only add fields).
- Carry enough evidence to:
  - normalize exposures (RB1–RB7),
  - generate deterministic identity keys,
  - compute diffs (NEW/CHANGED/FIXED/UNRESPONSIVE),
  - build proof-of-fix evidence packets.

Non-goals:
- This contract is **not** the internal DB schema.
- This contract is **not** a verbatim pass-through of each tool’s raw JSONL (optional).

---

## 2. Versioning rules

- `schema_version` uses SemVer: `MAJOR.MINOR`.
  - **MAJOR**: breaking changes (avoid).
  - **MINOR**: add optional fields (preferred).
- API ingestion must accept:
  - current version,
  - previous minor versions (at least 2).

---

## 3. Payload overview

### 3.1 Top-level shape (canonical)

```json
{
  "schema_version": "1.1",
  "scan": {
    "scan_id": "uuid",
    "tenant_id": "uuid",
    "scan_kind": "scheduled|on_demand|verify",
    "scan_profile": "baseline|verify|fast_recheck",
    "triggered_by_user_id": "uuid|null",
    "requested_asset_ids": ["uuid"],
    "started_at": "2026-02-05T10:00:00Z",
    "finished_at": "2026-02-05T10:04:12Z",
    "worker": {
      "worker_id": "string",
      "worker_version": "string",
      "host": "string|null",
      "ip": "string|null"
    }
  },
  "tool_versions": {
    "naabu": "2.x",
    "httpx": "1.x",
    "tlsx": "1.x",
    "nuclei": "3.x",
    "nmap": "7.x|null"
  },
  "limits": {
    "max_targets": 5000,
    "max_ports_per_host": 1000,
    "timeout_seconds": 900
  },
  "asset_results": [],
  "summary": {},
  "artifacts": [],
  "errors": []
}
```

## 4. asset_results[]
Each entry corresponds to one configured asset (IP/domain/CIDR) included in the scan request.

### 4.1 AssetResult
```json
{
  "asset": {
    "asset_id": "uuid",
    "asset_type": "ip|domain|cidr",
    "asset_value": "string",
    "tags": ["string"],
    "canonical_host": "string"
  },
  "resolution": {
    "resolved_at": "2026-02-05T10:00:05Z",
    "dns": {
      "a": ["203.0.113.10"],
      "aaaa": [],
      "cname_chain": ["example.net"],
      "errors": []
    }
  },
  "endpoints": []
}
```
**Notes:**

`canonical_host` is the “identity host” for the configured asset:

- domain asset ⇒ lowercase FQDN (no trailing dot)
- ip asset ⇒ IP string
- cidr asset ⇒ CIDR string, but identity is per endpoint IP (see exposure-identity)

## 5. endpoints[]
An endpoint is a concrete scan target derived from an asset.

### 5.1 Endpoint (canonical)
```json
{
  "endpoint_id": "string",
  "ip": "203.0.113.10",
  "domain_context": "example.com|null",
  "observed_host": "example.com|203.0.113.10",
  "ports": {
    "tcp": [],
    "udp": []
  },
  "http": [],
  "tls": [],
  "findings": {
    "nuclei": [],
    "nmap": []
  },
  "dns_email": {
    "domain": "example.com|null",
    "spf": {},
    "dmarc": {},
    "dkim": {},
    "errors": []
  },
  "timings": {
    "started_at": "2026-02-05T10:00:10Z",
    "finished_at": "2026-02-05T10:03:11Z"
  },
  "errors": []
}
```

**Required behaviors:**

`endpoint_id` must be stable within the payload. Recommended:

- "ip:203.0.113.10" for IP endpoints
- "ip:203.0.113.10|domain:example.com" for domain→IP endpoints

`observed_host`:

- if domain asset → the domain (canonical)
- else → the IP

For CIDR scanning, each endpoint must set `observed_host = ip`.

## 6. Tool observations (canonical shapes)

### 6.1 PortObservation (naabu)
```json
{
  "tool": "naabu",
  "protocol": "tcp",
  "port": 443,
  "state": "open|closed|filtered|unknown",
  "verified": true,
  "reason": "syn_ack|connect_success|timeout|null",
  "ttl": 54,
  "rtt_ms": 12
}
```

### 6.2 HttpObservation (httpx)
```json
{
  "tool": "httpx",
  "url": "https://example.com:443/login",
  "final_url": "https://example.com/login",
  "host": "example.com",
  "ip": "203.0.113.10",
  "port": 443,
  "scheme": "http|https",
  "status_code": 200,
  "title": "Admin Portal",
  "headers": {
    "server": "nginx",
    "content-type": "text/html"
  },
  "headers_hash": "sha256hex|null",
  "body_hash": "sha256hex|null",
  "body_simhash": "string|null",
  "favicon_hash": "mmh3hex|null",
  "technologies": ["string"],
  "cdn": "string|null",
  "waf": "string|null",
  "response_time_ms": 320,
  "content_length": 14213,
  "redirect_chain": ["string"],
  "tls": {
    "sni": "string|null",
    "jarm": "string|null"
  },
  "raw": {
    "httpx_json": {}
  }
}
```

### 6.3 TlsObservation (tlsx)
```json
{
  "tool": "tlsx",
  "host": "example.com|203.0.113.10",
  "ip": "203.0.113.10",
  "port": 443,
  "sni": "example.com|null",
  "tls_versions": ["TLS1.2", "TLS1.3"],
  "cipher": "string|null",
  "ja3": "string|null",
  "jarm": "string|null",
  "certificate": {
    "subject_cn": "string|null",
    "issuer_cn": "string|null",
    "serial": "string|null",
    "not_before": "2026-01-10T00:00:00Z|null",
    "not_after": "2026-04-10T23:59:59Z|null",
    "sans": ["string"],
    "is_self_signed": false,
    "spki_sha256": "sha256hex|null",
    "cert_sha256": "sha256hex|null"
  },
  "raw": {
    "tlsx_json": {}
  }
}
```

### 6.4 NucleiFinding (nuclei)
```json
{
  "tool": "nuclei",
  "template_id": "string",
  "template_path": "string|null",
  "severity": "info|low|medium|high|critical",
  "type": "http|dns|network",
  "matched_at": "string",
  "host": "string",
  "ip": "string|null",
  "port": 0,
  "timestamp": "2026-02-05T10:02:10Z",
  "matcher_name": "string|null",
  "extracted_results": ["string"],
  "metadata": {
    "name": "string|null",
    "description": "string|null",
    "tags": ["string"]
  },
  "raw": {
    "nuclei_json": {}
  }
}
```

### 6.5 NmapFinding (optional)
```json
{
  "tool": "nmap",
  "target": "203.0.113.10",
  "port": 22,
  "protocol": "tcp",
  "state": "open",
  "service": "string|null",
  "product": "string|null",
  "version": "string|null",
  "scripts": {
    "banner": "string|null",
    "ssl-cert": "string|null"
  },
  "raw": {
    "nmap_xml": "string|null",
    "nmap_text": "string|null"
  }
}
```

## 7. v1 RB1–RB7 mapping rules (authoritative)

These rules define how raw observations are normalized into XRAY exposures.

### 7.1 RB1 — Exposed Remote Admin

Create an RB1 exposure when:

`naabu` reports `state=open` for TCP port in `{22,2222,3389,5900,5901,5985,5986}`.

Evidence should include:

- ip, port, and naabu evidence.
- Optional: corroborating nmap service/banner (if collected).

### 7.2 RB2 — Exposed Web Panels

Create an RB2 exposure when:

`nuclei` matches a template in the panel/admin allowlist (your nuclei templates selection).

Evidence should include:

- `template_id`, `matched_at` (canonical URL), and any extracted results.

Identity uses:

- `template_id` + canonical URL (see exposure-identity).

### 7.3 RB3 — Weak Encryption

Create an RB3 exposure from `tlsx` when:

- `tls_versions` contains TLS1.0 or TLS1.1 → `tls:old_versions` (or per-version identities if you implement that variant).
- Optionally (v1+): weak cipher classes → `tls:weak_ciphers` (categorize; do not identity on full cipher list).

### 7.4 RB4 — Certificate Issues

Create RB4 exposures from `tlsx.certificate` when any condition is true:

- **expired**: `not_after < now`
- **near_expiry**: `0 <= (not_after - now) <= 30 days`
- **self_signed**: `is_self_signed == true`
- **hostname_mismatch**: when endpoint has a domain_context and that domain is not present in SANs and does not match `subject_cn` (canonicalized)

### 7.5 RB5 — Risky HTTP Security Headers (advisory)

Compute missing header set from `httpx.headers`.

v1 required header checks:

For HTTPS (`scheme=https`):
- `strict-transport-security` (HSTS)
- `content-security-policy` (CSP)
- `x-frame-options`
- `x-content-type-options`

For HTTP (`scheme=http`):
- `content-security-policy`
- `x-frame-options`
- `x-content-type-options`

If any are missing, create one RB5 exposure whose fingerprint is the sorted missing header set + canonical URL root.

### 7.6 RB6 — Unresponsive / Unknown Edge Service

Create RB6 when:

- `naabu` reports `state=open` for a port in the baseline allowlist and
- there is no successful `httpx` or `tlsx` observation for that port and
- the worker reports a symptom/error.

Symptom categories (use one):
- `tcp_open_no_banner`
- `http_timeout`
- `tls_handshake_fail`
- `protocol_mismatch`

### 7.7 RB7 — DNS Email Spoofing Risk

From `dns_email` posture, create exposures when:

- SPF assessment is missing or weak
- DMARC assessment is missing or weak (or `policy=none` treated as weak)
- DKIM assessment is missing or partial (depending on your v1 stance)

Identity uses:

- `record:spf`, `record:dmarc`, `record:dkim` (+ selector if used).

## 8. Errors
Top-level errors[] is scan-wide failures; endpoint-level errors[] is local failures.

```json
{
  "scope": "scan|asset|endpoint|tool",
  "tool": "httpx|tlsx|nuclei|naabu|nmap|null",
  "message": "string",
  "kind": "timeout|tool_exit|parse_error|rate_limited|dns_error|network_error",
  "details": {
    "exit_code": 1,
    "stderr": "string|null"
  }
}
```

## 9. DNS email block (RB7)
```json
{
  "domain": "example.com",
  "spf": {
    "present": true,
    "raw": "v=spf1 include:_spf.google.com -all",
    "assessment": "pass|weak|missing|error",
    "issues": ["softfail", "missing_all"]
  },
  "dmarc": {
    "present": true,
    "raw": "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com",
    "policy": "none|quarantine|reject",
    "alignment": {
      "aspf": "r|s|null",
      "adkim": "r|s|null"
    },
    "assessment": "pass|weak|missing|error",
    "issues": []
  },
  "dkim": {
    "checked_selectors": ["default", "selector1"],
    "present_selectors": ["selector1"],
    "assessment": "unknown|partial|ok|missing",
    "issues": ["no_selector_confirmed"]
  },
  "errors": []
}
```

## 10. Summary block (optional)
Useful for debugging and UI quick stats.

```json
{
  "targets_total": 12,
  "endpoints_total": 18,
  "ports_open_total": 46,
  "http_services_total": 15,
  "tls_services_total": 12,
  "nuclei_findings_total": 9,
  "errors_total": 1,
  "duration_ms": 242000
}
```

## 11. Artifacts block (optional)
Use when payloads get large; store raw JSONL / XML in object storage and reference it.

```json
{
  "type": "httpx_jsonl|tlsx_jsonl|nuclei_jsonl|nmap_xml",
  "path": "s3://bucket/tenant/scan/.../httpx.jsonl",
  "sha256": "sha256hex",
  "size_bytes": 123456
}
```



## 12. Ingestion guarantees
Worker must:

- include `schema_version` and `tool_versions`
- use UTC ISO8601 timestamps with `Z`
- ensure every endpoint has `ip` (or explicit error)
- only scan the allowed target scope

API ingestion must:

- validate schema
- tolerate missing optional fields
- be idempotent on repeated submissions for the same `scan_id`
