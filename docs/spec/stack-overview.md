# XRAY Watchtower — Stack Overview (Vercel + Clerk + Supabase + VPS Scanner)
**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Applies to:** v1 (solo build), extensible to v2/v3

---

## 1. Purpose

Describe the **end-to-end system architecture** and **data flows** for XRAY Watchtower using:

- **Vercel** for the frontend UI
- **Clerk** for authentication + organizations (tenancy)
- **Supabase** for Postgres + RLS + Storage
- **VPS** for scanner/orchestrator (naabu/httpx/tlsx/nuclei + optional nmap)

This doc is the “how the whole system fits together” reference.  
Detailed behavioral rules are defined in:
- `docs/spec/auth-clerk-supabase-rls.md`
- `docs/contracts/*`

---

## 2. Components

### 2.1 Frontend (Vercel)
**Responsibilities**
- UI: assets, scans, exposures, proof-of-fix, alerts settings (v1 scope)
- Creates scan requests (writes a `scan_jobs` row)
- Reads data directly from Supabase (Postgres + Storage) using RLS

**Key properties**
- Runs in the browser
- Uses Supabase **anon key** only
- Uses the **Clerk session token** for authenticated requests to Supabase

### 2.2 Authentication & Tenancy (Clerk)
**Responsibilities**
- User authentication (login/session)
- Organization (Org) management
- Role management within orgs (admin/operator/viewer as desired)

**Tenancy mapping**
- XRAY tenant = **Clerk Organization**
- `tenant_key` in DB = Clerk org id, e.g. `org_...`

### 2.3 Database & Storage (Supabase)
**Responsibilities**
- System-of-record for v1:
  - tenants (optional metadata)
  - assets
  - scan_jobs
  - scans
  - exposures_current
  - exposure_events
  - exposure_actions
  - proof ledger tables (v1.1+)
- Artifact storage for raw scan outputs / evidence packets (optional in v1)

**Enforcement**
- Supabase **RLS is the primary security boundary** for browser-originated reads/writes.
- VPS uses the **service role key** (bypasses RLS) and must be treated as privileged root.

### 2.4 VPS Scanner/Orchestrator
**Responsibilities**
- Poll/claim scan jobs
- Execute external-only scanning:
  - naabu (ports)
  - httpx (HTTP probes)
  - tlsx (TLS posture/certs)
  - nuclei (detections)
  - optional selective nmap (RB1/RB6 strengthening)
- Upload artifacts (optional) to Supabase Storage
- Post/Write scan result payloads into Supabase DB
- Trigger diff engine logic via DB writes (or via API service if you introduce one)

**Key properties**
- Long-running processes are NOT suitable for Vercel/serverless; VPS is the right place.
- Holds the Supabase **service role key** (never in browser).

---

## 3. Trust boundaries

### 3.1 Browser boundary
Browser can only:
- use Clerk session token
- use Supabase anon key
- read/write only what RLS allows

Browser must never:
- possess Supabase service role key
- run scanner tools
- write system-truth tables directly (e.g., exposures_current)

### 3.2 VPS boundary
VPS can:
- bypass RLS (service role)
- write scan results, exposures, events, artifacts
- run scanners

VPS must:
- be locked down (firewall, minimal inbound ports)
- keep secrets in environment/secret manager
- log privileged actions

---

## 4. Data model (high-level)

**Tenant scoping**
- All business tables include `tenant_key text not null`
- `tenant_key` equals Clerk org id (`org_...`)

**Core entities**
- `assets`: the allowed scanning scope for a tenant
- `scan_jobs`: requests to perform a scan (created by UI)
- `scans`: execution record (created/updated by VPS)
- `exposures_current`: current truth view of exposures (written by VPS/diff engine)
- `exposure_events`: immutable history of NEW/CHANGED/FIXED/UNRESPONSIVE transitions
- `exposure_actions`: user workflow actions (fix in progress, verify fix, notes)
- `artifacts`: optionally stored in Supabase Storage, path namespaced by tenant

---

## 5. Primary flows

### 5.1 Sign-in and tenancy selection
1) User signs in via Clerk
2) User selects active org (tenant)
3) Frontend queries Supabase using Clerk session token
4) Supabase RLS scopes all reads/writes by `tenant_key`

### 5.2 Asset management
1) User creates/updates assets (domain/ip/cidr)
2) RLS ensures user can only touch rows matching their `tenant_key`
3) Assets become the only allowed scope for scan jobs

### 5.3 Requesting a scan (UI → scan_jobs)
1) User clicks “Scan now”
2) UI inserts a `scan_jobs` row with:
   - tenant_key
   - job kind: scheduled/on_demand/verify
   - scan_profile: baseline/verify/fast_recheck (v1)
   - target asset_ids or “all”
3) RLS allows insert only for the user’s tenant

### 5.4 Executing a scan (VPS)
1) VPS polls `scan_jobs` and claims one (service role)
2) VPS creates a `scans` row (or updates scan_jobs → running)
3) VPS runs tools and collects outputs
4) VPS generates a canonical **scan result payload** (see `docs/contracts/scan-result.md`)
5) VPS writes:
   - scan status and timings
   - artifacts (optional)
   - normalized exposures + events using diff engine rules

### 5.5 Diff + exposure updates (deterministic)
1) VPS normalizes tool output into candidate exposures
2) VPS computes identity keys (see `docs/contracts/exposure-identity.md`)
3) VPS computes diff vs previous scan state (see `docs/contracts/diff-engine.md`)
4) VPS writes:
   - `exposures_current` (current state)
   - `exposure_events` (append-only transitions)
5) UI shows “Change-first” dashboard (NEW/CHANGED/FIXED/UNRESPONSIVE)

### 5.6 Proof-of-fix (v1)
1) User marks exposure “Fix in progress” (writes `exposure_actions`)
2) User requests “Verify fix” (creates a verify scan job)
3) VPS runs verify scan, diff detects FIXED or STILL_OPEN
4) Evidence packet stored (DB and/or Storage)
5) Export from UI (PDF/HTML) uses stored evidence

---

## 6. Operational characteristics

### 6.1 Scaling (v1 solo)
- One VPS is enough initially.
- Run scanner jobs sequentially or with small concurrency (2–4) to avoid resource spikes.

### 6.2 Observability (minimum)
- VPS logs tool execution and job state transitions
- DB tables allow audit of: who requested scans, when, and what changed

---

## 7. Future evolution notes (v2/v3)
- v2 discovery engine adds asset discovery methods that insert “candidate assets”
- v3 adds attack graph store (Neo4j) and path analysis services
- The trust boundaries remain: UI is unprivileged; scanner/orchestrator is privileged

---
