# XRAY — Data Access Patterns (Next.js + Supabase + Clerk) — v1

**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Applies to:** Vercel-hosted Next.js app + Supabase Postgres with RLS  
**Decision:** Browser reads/writes are enforced by RLS; service role is not used in Vercel.

---

## 1. Purpose

Define how the frontend accesses Supabase safely and consistently, so:
- RLS remains the enforcement boundary,
- we avoid service-role leakage,
- UI queries remain predictable and reusable.

---

## 2. Principles (normative)

1) **Browser data access MUST be via Supabase RLS**
- The web app uses Supabase **anon** key + Clerk session token.
- All reads/writes from the UI must pass RLS policies.

2) **Service role MUST NOT be used in Vercel**
- No service role key in frontend code (server or client).
- Background writes belong to the VPS worker/orchestrator only.

3) **Prefer stable views/functions for UI**
- UI should query stable table-like interfaces:
  - `exposures_current`
  - `exposure_events`
  - `exposure_actions`
- Use views to hide joins and keep UI simple.

4) **UI should treat system-derived tables as read-only**
- v1 UI may write:
  - `assets`
  - `scans` (request a scan)
  - `scan_jobs` (enqueue scan job)
  - `exposure_actions` (workflow actions)
- v1 UI must NOT write:
  - `exposures_current`
  - `exposure_events`
  - scan execution state transitions (unless explicitly allowed)

---

## 3. Next.js patterns

### 3.1 Server Components and Server Actions
Use Server Components / Server Actions for:
- initial page loads that benefit from server rendering
- privileged coordination logic (but still **not** service role)
- passing the Clerk token into Supabase server client

Rules:
- Server Actions can insert scan requests (`scans`, `scan_jobs`) because RLS protects them.
- Server Actions must not bypass RLS.

### 3.2 Client Components
Use client components for:
- interactive filtering/sorting
- optimistic UI for actions (notes, status changes)
- real-time subscriptions (optional)

Rules:
- Client components must use the Clerk session token and Supabase anon key.
- Avoid duplicating query logic between server and client; centralize query helpers.

---

## 4. “Read via RLS” rules

### 4.1 Tenant scoping
All queries must implicitly scope to the current tenant via:
- `tenant_key = xray.requesting_tenant_key()` in RLS policies

The UI should not attempt to “filter by tenant_key” manually as a security measure.
- It can include tenant_key for debugging, but security is enforced by RLS.

### 4.2 Prefer read models
For UI queries, prefer:
- `exposures_current` (current truth)
- `exposure_events` (history / changes)
- `exposure_actions` (user workflow)
- `assets` (scope)

Avoid querying raw scan artifacts directly unless needed.

---

## 5. Where service-role usage is allowed

**Allowed:**
- VPS worker/orchestrator only

**Not allowed:**
- Next.js client code (never)
- Next.js server code on Vercel (recommended never for v1)

Reason:
- Service role bypasses RLS and becomes a catastrophic blast radius if leaked.

---

## 6. Naming conventions (tables/views/functions)

### 6.1 Tables
- `assets`
- `scans`
- `scan_jobs`
- `exposures_current`
- `exposure_events`
- `exposure_actions`
- `audit_log`

### 6.2 Views (recommended)
- Prefix UI views with `ui_` only if needed, otherwise keep stable nouns:
  - `exposures_current` can be a table or view (treat as “read model”)

### 6.3 Functions
- Helper functions under `xray.*` schema:
  - `xray.requesting_tenant_key()`
  - `xray.is_org_admin()`

### 6.4 Columns
- Use consistent timestamp names:
  - `created_at`, `updated_at`
  - `first_seen`, `last_seen`
- Use consistent identifiers:
  - `tenant_key` (TEXT)
  - `id` (UUID or TEXT; be consistent per table)

---

## 7. Realtime (optional v1)
If using Supabase Realtime:
- Subscribe to:
  - `scan_jobs` status changes (queued → running → completed)
  - `exposure_events` inserts (NEW/CHANGED/FIXED)

Rule:
- Realtime is UX sugar; the system must work without it.

---

## 8. Testing expectations
- UI should be tested against RLS:
  - a user from org A must never read org B’s rows
- Add simple integration tests for:
  - creating an asset
  - enqueueing a scan job
  - reading exposures_current

---
