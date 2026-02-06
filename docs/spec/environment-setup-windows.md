# XRAY — Environment Setup (Windows) — v1

**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Applies to:** Solo v1 on Windows + PowerShell  
**UI:** Next.js + Tailwind + shadcn/ui (Vercel)  
**DB:** Supabase (local + hosted)  
**Auth:** Clerk  
**Worker:** VPS scanner/orchestrator (optional stub locally)

---

## 1. Required installs

### 1.1 Core tooling
- **Git for Windows**  
  Used for source control. Recommended: enable long paths.
- **Node.js (LTS)**  
  Required for Next.js. Use the current LTS version.
- **Package manager**  
  Choose one:
  - **pnpm** (recommended), or
  - **npm** (fine for v1)
- **Docker Desktop (Windows)**  
  Required for Supabase local stack. Use WSL2 backend.
- **Supabase CLI**  
  Used to run Supabase locally and manage migrations.

### 1.2 Optional but useful
- **VS Code** (+ Tailwind / ESLint extensions)
- **WSL2** (Ubuntu recommended)  
  Not required, but often makes Docker + CLI smoother.

---

## 2. Repo conventions (Windows-safe)

- Prefer **LF** line endings in repo. Avoid mixed endings.
- Keep secrets out of git:
  - `.env.local` for web
  - `.env.worker` for worker (never committed)
- Ensure `.gitattributes` includes:
  - `* text=auto eol=lf` (recommended)

---

## 3. Running locally (web + Supabase)

### 3.1 Start Supabase local
From repo root:

1) Ensure Docker Desktop is running.
2) Start Supabase:

```powershell
supabase start
```
Expected outcome:
- Local Postgres + Auth + Storage + Studio start successfully.
- Supabase Studio is accessible (local URL output by CLI).

### 3.2 Apply migrations / seed data
If using Supabase migrations:

```powershell
supabase db reset
```
Notes:
- `db reset` recreates the local DB and applies migrations.
- Use it whenever you change schema/policies early in v1.

### 3.3 Start Next.js web app
From `apps/web` (or your web folder):

```powershell
pnpm install
pnpm dev
```
or npm:

```powershell
npm install
npm run dev
```
Expected outcome:
- Next.js dev server runs on `http://localhost:3000`.

---

## 4. Optional: run a local worker stub
For docs-first validation, a stub worker can:
- insert a `scan_jobs` row,
- write a fake scan result payload,
- create example exposures/events for UI wiring.

### 4.1 Recommended stub behavior
1) Read a single queued job for the tenant
2) Write:
   - `scans` row status transitions
   - `exposure_events` (NEW)
   - `exposures_current` rows
3) The real VPS worker will replace this stub later.

---

## 5. Common Windows gotchas

### 5.1 Ports
Common conflicts:
- 5432 (Postgres)
- 3000 (Next.js)
- 8000/8080 (other local services)

Fix:
- Stop conflicting services or change ports in `.env.local`.

### 5.2 Docker Desktop + WSL2
Symptoms:
- Supabase start fails
- Containers don’t boot / networking issues

Fix checklist:
- Docker Desktop → Settings:
  - Enable "Use the WSL 2 based engine"
- Ensure WSL2 installed and updated
- Restart Docker Desktop after changes

### 5.3 Environment variables in PowerShell
Common issue:
- Setting env vars in one shell doesn’t apply elsewhere.

Rule:
- Use `.env.local` for Next.js (preferred)
- Avoid relying on `setx` unless you understand persistence

### 5.4 Line endings (CRLF vs LF)
Symptoms:
- scripts fail in containers
- unexpected diffs

Fix:
- `.gitattributes` enforce LF
- Configure Git:
  - disable auto CRLF conversion if you see churn

### 5.5 Long paths
Symptoms:
- Git checkout errors / node_modules path issues

Fix:
- Enable long paths (Git + Windows policy)
- Prefer shorter repo root paths (e.g., `C:\dev\xray`)

---

## 6. Minimum “it works” checklist
- [ ] `supabase start` succeeds
- [ ] `supabase db reset` applies migrations without errors
- [ ] Next.js runs at `localhost:3000`
- [ ] Clerk login works locally
- [ ] Supabase queries from browser are enforced by RLS
- [ ] (Optional) worker stub can create exposures visible in UI

---
