# ADR 0008: Proof-of-fix ledger uses an append-only hash chain (tamper-evident)

## Context
MSPs need audit-grade proof. PDFs can be edited; screenshots can be forged.
We want a simple, defensible “trust moat” without heavy infrastructure.

## Decision
On CONFIRMED_FIXED, create a ledger entry:
- payload: canonical evidence packet (before/after, actor, timestamps, notes)
- prev_hash: prior ledger hash for the tenant (or global)
- entry_hash: sha256(canonical_json(payload + prev_hash + metadata))

Exports include:
- entry_hash
- prev_hash
- verification endpoint reference

Ledger is append-only (app enforces; DB permissions reinforce).

## Alternatives considered
1) No ledger: evidence less trustworthy.
2) Blockchain/public notarization: complexity and cost; not needed for v1.1.

## Consequences
- ✅ Tamper-evident audit trail becomes a product differentiator
- ✅ Cheap to build and maintain
- ❌ Must keep canonicalization stable forever (or version it)

## Revisit when
- enterprise customers require third-party timestamping/notarization
- we introduce multi-region replication and need chain strategy
