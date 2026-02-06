# ADR 0006: Exposure identity_key is deterministic via canonical evidence fingerprinting

## Context
Change-first UX only works if the same exposure gets the same identity across scans.
If identity_key drifts, the UI becomes noisy (false NEW/FIXED churn).

## Decision
Define identity_key as SHA-256 over canonical fields:
tenant_id | asset_id | risk_bucket | protocol | port | fingerprint

Fingerprint rules by bucket:
- RB1: port + service family (ssh/rdp/vnc/winrm)
- RB2: nuclei_template_id + matched_url (normalized)
- RB3: tls_versions + cipher_summary (canonical ordering)
- RB4: cert_serial + issuer + san_hash
- RB5: missing_headers_sorted + normalized_url
- RB6: port + probe_type + observed symptom
- RB7: domain + record_type + selector(if applicable)

Canonicalization rules:
- normalize URLs (scheme/host/lowercase, strip default ports, stable path handling)
- sort sets (headers, SANs, cipher lists)
- stable JSON key ordering when hashing

## Alternatives considered
1) Use DB auto IDs: not stable across recompute.
2) “Best effort” identity: causes churn and alert noise.

## Consequences
- ✅ Deterministic diff engine outputs
- ✅ Moat features (change graph, drift) become reliable
- ❌ Must be careful when evolving fingerprint rules (version them)

## Revisit when
- a bucket needs a better fingerprint to reduce collisions
- we introduce discovery where asset_id may change (need mapping strategy)
