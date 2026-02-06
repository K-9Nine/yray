# docs/decisions/README.md
# Architecture Decision Records (ADRs)

ADRs capture decisions that are **expensive to rediscover**.
They explain **why** we chose something.

**Contracts/specs define what to implement.**  
If an ADR conflicts with a contract/spec, the contract/spec is the source of truth.

---

## ADR format (standard)

Each ADR should include:
- Context
- Decision
- Alternatives considered
- Consequences
- Revisit when

---

## How to use ADRs

- Read ADRs when you want the **rationale** and trade-offs.
- Implement using:
  - `docs/contracts/*` (deterministic rules)
  - `docs/spec/*` (product + engineering intent)
  - `config/*` (machine-readable source of truth)

---

## Index (chronological)

### Foundation
- **0001** Deployment: Single VM + Docker Compose  
- **0002** Scanner Toolchain: naabu/httpx/tlsx/nuclei + selective nmap  
- **0003** Jobs: Celery + Redis + Beat  

### Core data + determinism
- **0004** Multi-tenant: memberships + active tenant context  
- **0005** Data model: exposures current + events + actions  
- **0006** Exposure identity_key canonicalization rules  
- **0007** Diff engine rules (NEW/CHANGED/FIXED/UNRESPONSIVE)  

### Moats (post-v1 foundations)
- **0008** Proof-of-fix ledger (tamper-evident hash chain)  
- **0009** Drift/Stability index derivation + usage  
- **0010** XRAY Risk Score: instrument now, calibrate later  

---

## Recommended reading order (solo onboarding)

1) Deployment + jobs: **0001 → 0003**  
2) Multi-tenant + data model: **0004 → 0005**  
3) Determinism core: **0006 → 0007**  
4) Moats: **0008 → 0010**

