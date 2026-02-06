# User Journeys (v1)

Audience: MSP operators (primary) + customer admins (secondary).

---

## Journey 1 — Watchtower loop (Change-first)

**Goal:** Operator sees what changed since last scan, acts quickly.

**Steps**
1) User lands on **Dashboard**
2) User sees counts:
   - NEW, CHANGED, FIXED, UNRESPONSIVE
3) User clicks into a **NEW** item
4) User reviews:
   - summary (what/where/severity)
   - evidence (ports/http/tls/nuclei)
   - recommended fix guidance (v1 can be simple templated)
5) User either:
   - marks “Fix in progress” (assign owner + note), or
   - snoozes/suppresses (optional), or
   - leaves it open

**Success criteria**
- Dashboard loads in <2s for typical tenant sizes.
- Operator can get from Dashboard → evidence in ≤2 clicks.
- NEW and “CHANGED to worse” are visually dominant.

---

## Journey 2 — Fix loop (Closure + Proof)

**Goal:** Operator verifies remediation and produces proof.

**Steps**
1) From Exposure Detail, user clicks **Fix in progress**
2) Assign owner (optional), add remediation note
3) After fix, user clicks **Verify fix**
4) UI shows verification status:
   - queued → running → completed
5) System outcome:
   - **CONFIRMED_FIXED**: stores before/after evidence packet
   - **STILL_OPEN**: shows “what’s still detected” + next steps
6) User opens **Proof / Export**:
   - prints/downloads proof packet (PDF/HTML view)

**Success criteria**
- Verify fix is a single obvious CTA.
- Evidence packet clearly shows:
  - before evidence (timestamp)
  - after evidence (timestamp)
  - actor
  - scan ids
- If verify fails, UI shows delta vs before.

---

## Journey 3 — Onboarding loop (First value in 5 minutes)

**Goal:** New tenant runs first scan and sees actionable changes.

**Steps**
1) User signs in and selects org (Clerk)
2) UI checks if assets exist
3) If none:
   - show onboarding empty state:
     - “Add your first asset (domain or public IP)”
4) User adds an asset
5) CTA: **Run first scan**
6) User sees scan progress
7) Dashboard populates with:
   - exposures grouped by RB1–RB7 buckets
   - change states (first scan: treat as NEW)

**Success criteria**
- First scan request is discoverable from empty states.
- System makes it clear scanning is “authorized external monitoring”.

---

## Journey 4 — Triage session (Optional but common)

**Goal:** Operator works through a list and clears it.

**Steps**
1) Dashboard → click “NEW (High)” filter
2) Bulk review list:
   - open each in new tab OR inline drawer
3) For each:
   - assign owner
   - add note
   - schedule verify (later)

**Success criteria**
- Filters are fast and sticky (query params).
- List supports keyboard nav or quick-open patterns (optional).

---
