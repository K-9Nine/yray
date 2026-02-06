# docs/contracts/README.md
# Contracts

Contracts define **stable, implementation-binding rules** between XRAY components.
If a contract and the code disagree, **the contract wins** until the contract is updated in the same PR.

**Rule:** Any change that affects payload shape, identity generation, or diff behavior MUST update the relevant contract(s) in the same commit/PR.

---

## Start here (v1 core contracts)

1) **Scan Result Contract (Worker → API)**  
   Defines the canonical JSON payload the worker produces.  
   - `scan-result.md`

2) **Exposure Identity & Canonicalization**  
   Defines how `identity_key` is computed and what counts as “material.”  
   - `exposure-identity.md`

3) **Diff Engine Contract**  
   Defines the exact algorithm for NEW / CHANGED / FIXED / UNRESPONSIVE, dedupe, and authoritative absence rules.  
   - `diff-engine.md`

---

## How these fit together

- The worker emits **Scan Results** → ingestion normalizes them into exposures.
- Identity rules turn normalized exposures into deterministic `identity_key`.
- The diff engine compares current identities to previous state and emits events.

Implementation order for v1:
1) `scan-result.md`
2) `exposure-identity.md`
3) `diff-engine.md`

---

## Testing expectation

Fixtures should live in:
- `fixtures/scan_samples/`

Minimum expectation:
- at least one fixture per RB bucket you support in v1
- unit tests asserting identity stability and diff outputs for those fixtures

