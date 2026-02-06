# XRAY Watchtower — Documentation Index

This folder contains the authoritative documentation for XRAY Watchtower.

Use this page as the **starting point** for development decisions and implementation.

---

## 1) Contracts (authoritative “do this exactly”)

Contracts define **stable interfaces and deterministic rules** that the code must follow.

- **[Scan Result Contract (Worker → API)](contracts/scan-result.md)**
- **[Exposure Identity & Canonicalization (identity_key rules)](contracts/exposure-identity.md)**
- **[Diff Engine Contract (NEW / CHANGED / FIXED / UNRESPONSIVE)](contracts/diff-engine.md)**

Contracts index:
- [Contracts Index](contracts/README.md)

---

## 2) Specs (product/engineering intent for v1)

Specs define **what we intend to build and how it behaves**, without being tied to internal schema.

- **[v1 Scan Profiles (ports, timeouts, safety, limits)](spec/v1-scan-profiles.md)**
- **[Auth + Tenancy + Data Access (Clerk + Supabase + VPS)](spec/auth-clerk-supabase.md)**
- **[Auth + Tenancy + Data Access (Clerk + Supabase + VPS)](spec/auth-clerk-supabase.md)**
- **[Auth, Tenancy, RLS (Normative Spec)](spec/auth-clerk-supabase-rls.md)**
- **[Stack Overview (Vercel + Clerk + Supabase + VPS)](spec/stack-overview.md)**
- **[Runtime Secrets & Env Vars (Normative)](spec/runtime-secrets.md)**

---

- **[Runtime Secrets & Env Vars (Normative)](spec/runtime-secrets.md)**

---

## 3) Decisions (ADRs: rationale + trade-offs)

Decisions explain **why** we chose an approach. The contracts/specs define **what** to implement.

- Decisions index:
  [Decisions Index (ADRs)](decisions/README.md)

---

## 4) UI Documentation

- **[Information Architecture (Navigation, URLs, Flows)](ui/ia.md)**
- **[User Journeys (v1)](ui/user-journeys.md)**
- **[Screen Contracts (v1)](ui/screens.md)**
- **[UI Components & Patterns (v1)](ui/components.md)**
- **[Copy & Terminology (v1)](ui/copy-and-terminology.md)**
- **[UI → Data Surface Map (v1)](ui/api-surface.md)**

---

## 5) Reference docs

- [Glossary](glossary.md)
- [Risks & Mitigations](risks.md)
- [Roadmap](roadmap.md)

---

## 6) Developer Guide

- **[Environment Setup (Windows)](spec/environment-setup-windows.md)**
- **[Data Access Patterns (Next.js + Supabase + Clerk)](spec/data-access-patterns.md)**

---

## 5) Fixtures and spikes (supporting material)

- [Fixtures (sample scan payloads)](../fixtures/scan_samples/)
- [Spikes](../spikes/)

---
