# XRAY — Auth, Tenancy, and RLS (Clerk + Supabase) — v1 Spec
**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Decision:** Option 1 — `tenant_key TEXT` everywhere (Clerk org id)

---

## 1. Purpose

Define the **authoritative tenancy and authorization model** for XRAY when using:
- **Clerk** for authentication and organization tenancy
- **Supabase Postgres** as the system-of-record database
- **Row Level Security (RLS)** as the enforcement boundary
- **VPS scanner/orchestrator** using Supabase service role for background writes

This document is normative for:
- how tenant isolation is enforced,
- what JWT claims are expected,
- how tables must be shaped,
- what RLS policies must exist.

This document is not:
- a deployment guide,
- a complete schema definition for all tables (see docs/spec + migrations).

---

## 2. Model

### 2.1 Tenancy mapping (normative)
- XRAY **tenant** MUST map 1:1 to a **Clerk Organization**.
- `tenant_key` MUST be stored as TEXT and MUST equal the Clerk org id (e.g. `org_...`).
- All multi-tenant business tables MUST include `tenant_key text not null`.

### 2.2 Access boundary (normative)
- **Supabase RLS MUST be the enforcement boundary** for all browser-originated reads/writes.
- The browser MUST only use the Supabase **anon** key plus a **Clerk session token**.
- The VPS scanner/orchestrator MUST use the Supabase **service role key** and MUST be treated as root access (bypasses RLS).

---

## 3. JWT claim expectations (Clerk → Supabase)

### 3.1 Required identity claims (normative)
Supabase RLS evaluation MUST be able to derive:
- user id: `sub`
- org id: either `org_id` OR `o.id` (token shape-dependent)
- org role: either `org_role` OR `o.rol`

### 3.2 Role claim requirement (normative)
Clerk session tokens MUST include a `role` claim set to `authenticated` to map requests to the authenticated Postgres role in Supabase.

---

## 4. Tenant key resolution

### 4.1 Tenant resolution rule (normative)
XRAY MUST resolve a “requesting tenant key” as:

1) if a Clerk org is active: use org id (`org_id` or `o.id`)  
2) else (dev/personal mode only): fall back to user id (`sub`)

> If XRAY chooses “org-required mode”, step (2) MUST be removed and requests without an org MUST be denied.

### 4.2 DB helper functions (recommended)
To avoid policy duplication, XRAY SHOULD implement DB helper functions to derive:
- org id
- tenant key
- org role
- “is admin” convenience boolean

#### Reference implementation (non-normative)
```sql
create schema if not exists xray;

create or replace function xray.requesting_org_id()
returns text language sql stable as $$
  select coalesce(
    auth.jwt() ->> 'org_id',
    auth.jwt() -> 'o' ->> 'id'
  )::text;
$$;

create or replace function xray.requesting_tenant_key()
returns text language sql stable as $$
  select coalesce(
    xray.requesting_org_id(),
    auth.jwt() ->> 'sub'
  )::text;
$$;

create or replace function xray.requesting_org_role()
returns text language sql stable as $$
  select coalesce(
    auth.jwt() ->> 'org_role',
    auth.jwt() -> 'o' ->> 'rol'
  )::text;
$$;

create or replace function xray.is_org_admin()
returns boolean language sql stable as $$
  select xray.requesting_org_role() in ('admin', 'owner');
$$;
```
