# XRAY Watchtower — Runtime Secrets & Environment Variables
**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Applies to:** v1 (Vercel UI + Clerk + Supabase + VPS scanner)

---

## 1. Purpose

Define the **complete set of secrets and runtime configuration**, where each secret lives, and what the security rules are.

This is the primary guard against:
- accidentally shipping service keys to the browser
- environment drift between dev/staging/prod
- undocumented “magic” configuration

---

## 2. Environments

XRAY runs across at least three environments:

- **local** (developer machine)
- **staging** (optional but recommended)
- **production**

Rule:
- Every environment MUST have its own Supabase project (or at minimum separate keys/db).
- Every environment MUST have its own Clerk instance/config (or separate keys).

---

## 3. Secret classes and where they live

### 3.1 Browser-allowed (safe-ish)
These can exist in Vercel env vars and be used client-side.

- Supabase **anon** key (public)
- Supabase project URL
- Clerk publishable key

> These are not “secrets” but are config values.

### 3.2 Server-only (must never be in browser)
These MUST only live on the VPS (or server-side only runtime), never in client code.

- Supabase **service role** key (root access, bypasses RLS)
- Scanner worker tokens (if you use them)
- SMTP/Email provider keys (if used by VPS)
- Any API keys for external enrichment (v2+)
- Any private signing keys (proof ledger signing if added)

### 3.3 Clerk server secrets
These should live in Vercel **server** env vars (for server actions / API routes), not shipped to client bundles.

- Clerk secret key
- Clerk JWT template config identifiers (if used)

---

## 4. Source-of-truth files

### 4.1 Machine-readable config (normative)
- `config/scan_profiles.yaml` is the source of truth for scan limits, ports, timeouts.
- (Optional but recommended) `config/exposure_identity.yaml` is the source of truth for identity rules.

Docs MUST explain intent; YAML MUST be treated as authoritative.

---

## 5. Required environment variables (v1)

## 5.1 Vercel (Frontend)
**Public (client)**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

**Server-only (if you use server routes/actions)**
- `CLERK_SECRET_KEY`  
- `CLERK_JWT_ISSUER` (only if required by your integration)

**Notes**
- Do not store Supabase service role key in Vercel env vars unless it is strictly server-only and never exposed to client bundles.
- Prefer keeping service role only on VPS to reduce risk.

---

## 5.2 VPS (Scanner/Orchestrator)
**Supabase privileged**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`  ← MUST NEVER be in browser
- `XRAY_ENV` (`local|staging|prod`)

**Scanning runtime**
- `XRAY_SCAN_PROFILES_PATH` (default: `config/scan_profiles.yaml`)
- `XRAY_EXPOSURE_IDENTITY_PATH` (default: `config/exposure_identity.yaml`, if used)

**Optional (artifacts)**
- `XRAY_ARTIFACT_BUCKET` (e.g. `xray-artifacts`)
- `XRAY_ARTIFACT_PREFIX_MODE` (must be tenant-namespaced)

**Optional (notifications)**
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `ALERT_FROM_EMAIL`

**Optional (hardening)**
- `XRAY_WORKER_ID` (stable identifier for logs)
- `XRAY_JOB_POLL_INTERVAL_SECONDS` (e.g. 5–30)

---

## 6. Hard rules (must not drift)

### 6.1 Service role handling (normative)
- `SUPABASE_SERVICE_ROLE_KEY` MUST:
  - never be committed
  - never be present in browser code
  - only exist on VPS (or private server runtime)

### 6.2 Logging and redaction (normative)
- Logs MUST NOT print:
  - service role keys
  - Clerk secret keys
  - raw JWTs
- If request payloads are logged, they MUST be scrubbed.

### 6.3 Rotation (recommended)
- Rotate service role key if a leak is suspected.
- Keep staging and production keys completely separate.

---

## 7. Minimal secret management practices (solo-friendly)

Recommended baseline:
- VPS uses `.env` files with strict file permissions, or a simple secrets manager.
- Vercel uses environment variables with separate sets for Preview/Production.
- No secrets in GitHub issues, PR comments, or screenshots.

---

## 8. Verification checklist (v1)

- [ ] Browser bundle contains no service role key (spot check build output/env usage)
- [ ] VPS has firewall enabled and minimal inbound ports open
- [ ] Supabase RLS enabled on all tenant-scoped tables
- [ ] `tenant_key` present on all business tables
- [ ] Artifact paths are tenant-namespaced: `{tenant_key}/{scan_id}/...`
- [ ] YAML config files are referenced in code and validated by tests

---
