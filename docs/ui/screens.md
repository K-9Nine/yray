# Screen Contracts (v1)

Each screen defines: purpose, primary actions, required data, and states.

---

## 1) Dashboard (Change-first) — `/dashboard`

### Purpose
Primary operational view: “What changed since last scan?”

### Primary actions
- Filter by change state: NEW / CHANGED / FIXED / UNRESPONSIVE
- Filter by severity (v1) or bucket
- Open Exposure Detail
- Run scan now (shortcut)

### Required data
- Latest scan timestamp per tenant
- Exposure event rollup counts (since last scan or last 24h):
  - counts by change_type
- Lists for each change_type:
  - exposure id
  - bucket (RB1–RB7)
  - severity
  - asset display (domain/ip)
  - first_seen / last_seen
  - short title

### States
- Loading skeleton
- Empty: “No changes since last scan” with link to Exposures (All)
- Error: show retry + basic troubleshooting text

### Notes
- Default view shows only NEW + CHANGED (worse) unless user expands.

---

## 2) Exposures (All current) — `/exposures`

### Purpose
Canonical list of current “open” exposures, filterable and searchable.

### Primary actions
- Search (domain/ip/title/template)
- Filter:
  - bucket RB1–RB7
  - severity
  - status (open / fixed / confirmed_fixed / false_positive)
  - tags (optional)
- Sort:
  - severity desc, last_seen desc
- Open Exposure Detail

### Required data
- `exposures_current` list:
  - id, bucket, severity, status
  - observed_host / ip / port
  - identity_key (optional display)
  - first_seen / last_seen
  - short summary title

### States
- Loading skeleton
- Empty: “No exposures found” with filter reset
- Error: retry

---

## 3) Exposure Detail — `/exposures/:exposureId`

### Purpose
Single exposure truth + evidence + actions + history.

### Primary actions
- Mark “Fix in progress”
- Add note
- Assign owner (optional v1)
- Verify fix (creates verify scan job)
- Export proof (when available)
- Mark false positive (optional v1; be careful)

### Required data
- Exposure core:
  - bucket, severity, status
  - first_seen, last_seen
  - observed_host, ip, port, protocol
- Evidence:
  - ports (naabu)
  - http (httpx)
  - tls (tlsx)
  - nuclei findings (templates)
  - raw links to artifacts (optional)
- History:
  - `exposure_events` for this exposure (NEW/CHANGED/FIXED etc.)
  - `exposure_actions` (notes, verify requests)

### States
- Loading skeleton
- Error state with retry
- Verify states:
  - queued / running / completed / failed

### Layout (recommended)
- Header: title + badges (bucket, severity, status)
- Left: Summary + Why it matters + How to fix
- Right: Evidence panel (tabs)
- Bottom: History timeline

---

## 4) Assets — `/assets`

### Purpose
Manage authorized scope: domain/IP/CIDR.

### Primary actions
- Add asset
- Edit tags/labels
- Remove asset (admin-only recommended)
- Run scan on selected assets (optional)

### Required data
- assets list:
  - asset_type, asset_value, tags
  - last_scan_at (optional derived)
  - exposure counts (optional derived)

### States
- Empty state with CTA “Add your first asset”
- Validation:
  - domain format
  - IP format
  - CIDR format

### Notes
- Keep it hard to accidentally add huge CIDRs in v1 (guardrails).

---

## 5) Scans — `/scans`

### Purpose
See scan history and run scans.

### Primary actions
- Run scan now (all assets or selected)
- See recent scan statuses
- Drill into scan detail (optional v1)

### Required data
- scans list:
  - started_at, finished_at
  - status
  - scan_kind (scheduled/on_demand/verify)
  - scan_profile
  - counts summary (optional)

### States
- Loading
- Empty: “No scans yet” + CTA “Run first scan”
- Error

---

## 6) Proof / Exports — `/proof`

### Purpose
Find and export evidence packets (proof-of-fix).

### Primary actions
- Search by asset/exposure
- Download/print evidence packet
- View verification details

### Required data
- evidence packets list (from DB or derived):
  - exposure id
  - fixed at
  - verified by
  - before/after references
  - hash chain verification fields (v1.1+)

### States
- Empty: “No proof packets yet” + link to exposures
- Loading / error

---

## 7) Settings (Minimal v1)

### `/settings/notifications`
- configure email alerts & digest
- quiet hours (optional)

### `/settings/team`
- link to Clerk org membership (invite/remove handled by Clerk UI if preferred)

### `/settings/scanning`
- default schedule
- scan profile defaults (baseline/verify)
- guardrails (max assets scanned per run)

---
