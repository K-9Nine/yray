# XRAY — Auth + Tenancy + Data Access (Clerk + Supabase + VPS Scanner)
**Status:** v1 recommended architecture  
**Last updated:** 2026-02-05  
**Applies to:** v1–v3 (same auth/data boundary)

---

## 1) Goal

Use **Clerk** for authentication + org tenancy, while using **Supabase Postgres + RLS** as the hard authorization boundary for all customer data. Run scanning workloads on a **separate VPS** using a **Supabase service role key** (server-only).

This design gives:
- fast UI iteration on Vercel,
- strict tenant isolation enforced in Postgres (RLS),
- a safe place to run long scans (VPS), without serverless timeouts.

Supabase supports **Clerk as a first-class third-party auth provider**, so Supabase can accept Clerk session tokens for Data API, Storage, Realtime, etc. :contentReference[oaicite:0]{index=0}

---

## 2) High-level architecture

**Vercel (Frontend / BFF)**
- Next.js UI
- Uses Clerk for login + org switching
- Reads/writes to Supabase using the Clerk session token (RLS enforced)

**Supabase (Source of truth)**
- Postgres (tables, RLS policies)
- Storage (raw artifacts, evidence bundles)
- Optional: Realtime (UI live updates)

**VPS (Scanner + Ingestion)**
- Docker container runs naabu/httpx/tlsx/nuclei (+ selective nmap)
- Uses Supabase **service role** key (bypasses RLS) to:
  - claim jobs
  - write scan results
  - upload artifacts
  - write exposures + events

---

## 3) Recommended tenancy model

### 3.1 XRAY Tenant = Clerk Organization
Model each customer tenant as a **Clerk Organization**. This maps naturally to MSP/customer tenancy and supports roles/permissions. :contentReference[oaicite:1]{index=1}

### 3.2 JWT claims to use in Supabase RLS
Clerk session tokens commonly contain:
- `sub` → Clerk user id
- `o.id` → active org id (when an org is selected)
- `o.rol` (or `org_role`) → role within the org, depending on token shape

Clerk’s multi-tenancy examples show extracting `o.id` using `auth.jwt()` and falling back via `coalesce(...)`. :contentReference[oaicite:2]{index=2}

### 3.3 Role claim requirement
Supabase third-party auth expects a `role` claim (typically `authenticated`) so policies work under the correct Postgres role. Supabase explicitly calls out adding the `role` claim for Clerk third-party auth. :contentReference[oaicite:3]{index=3}

---

## 4) Frontend → Supabase: use Clerk token directly

### 4.1 Pattern
The frontend obtains a **Clerk session token** and passes it to the Supabase client as the access token. Supabase will accept Clerk-signed tokens via its third-party auth integration. :contentReference[oaicite:4]{index=4}

### 4.2 Implementation guidance
- Browser/client calls Supabase with:
  - `supabaseUrl`
  - `supabaseAnonKey`
  - `Authorization: Bearer <clerk_session_token>`
- RLS policies enforce tenant isolation.

> Note: exact SDK calls depend on your framework version, but the principle is constant:
> **Clerk session token → Supabase access token**.

---

## 5) VPS Scanner + Ingestion: service role only

### 5.1 What the VPS uses service role for
The VPS uses the Supabase **service role key** (server-only) to:
- claim scan jobs
- write scan metadata/results
- upload artifacts to Storage
- write exposures + events (bypassing RLS)

### 5.2 Security rules (non-negotiable)
Because service role bypasses RLS:
- never expose it to the browser
- store only on the VPS (env var / secret manager)
- firewall the VPS (only needed inbound ports)
- protect any VPS endpoints with strong auth (shared secret and/or mTLS)
- log every service-role action (audit log table)

---

## 6) Standardize now (avoid regret later)

### A) Add a DB helper function for “current tenant key”
To avoid repeating JWT parsing logic across policies, create a helper that returns:
- org id if present
- else user id (personal mode / dev)

**SQL**
```sql
create schema if not exists xray;

create or replace function xray.requesting_tenant_key()
returns text
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'o' ->> 'id')::text,
    (auth.jwt() ->> 'sub')::text
  );
$$;
```

This pattern matches Clerk’s recommended approach for org-aware RLS using auth.jwt() + coalesce.
