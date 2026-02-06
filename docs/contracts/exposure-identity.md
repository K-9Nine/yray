# XRAY Watchtower — Exposure Identity & Canonicalization

**Status:** Draft v1.1  
**Last updated:** 2026-02-05  
**Applies to:** v1–v3

Related:
- scan profiles (ports/timeouts): `docs/spec/v1-scan-profiles.md`
- scan result schema + mapping: `docs/contracts/scan-result.md`

---

## 1. Purpose

Define how XRAY generates a **deterministic, stable identity** for each exposure so that:
- diffs are reliable (NEW/CHANGED/FIXED/UNRESPONSIVE),
- alert noise is minimized,
- proof-of-fix and drift/stability signals are trustworthy.

This contract defines:
- `identity_key` algorithm
- canonicalization rules (URLs, headers, TLS fields)
- per-risk-bucket fingerprint rules (RB1–RB7)
- material-change rules (what counts as CHANGED)

---

## 2. Definitions

- **Exposure:** a specific risky condition on a specific endpoint.
- **Fingerprint:** canonical string describing the exposure subtype.
- **identity_key:** sha256 hex digest of canonical identity components.
- **Material change:** evidence change that should yield `CHANGED` (not churn).

---

## 3. Identity versioning

Store with each exposure:
- `identity_version` (int) — starts at 1
- `fingerprint_version` (int) — starts at 1

Rules:
- changing fingerprint rules increments `fingerprint_version`
- breaking changes to identity component set increments `identity_version`

---

<!-- BEGIN:EXPOSURE_IDENTITY_AUTO -->
## Identity rules (auto-generated from `config/exposure_identity.yaml`)

### Identity key format
- identity_version: `1`
- fingerprint_version: `1`
- canonical identity string:
  - `v{identity_version}|tenant:{tenant_id}|asset:{asset_id}|host:{observed_host}|bucket:{risk_bucket}|proto:{proto}|port:{port}|fpv:{fingerprint_version}|fp:{fingerprint}`

### Canonicalization highlights (v1)
- host/domain: lowercase=true, strip_trailing_dot=true, idna=none
- url/query_handling: `drop` (v1 default to avoid identity churn)
- tls/cert_anchor_preference: `certificate.spki_sha256, certificate.cert_sha256, certificate.serial`

### RB1–RB7 fingerprint rules (deterministic)
| Bucket | Name | Proto | Port rule | Fingerprint rule | Material-change fields |
|---|---|---|---|---|---|
| RB1 | Exposed Remote Admin | tcp | observed open port | svc:{service_family} | port, service_family |
| RB2 | Exposed Web Panels | http/or/https | from observation | tpl:{template_id}|url:{canonical_url} | nuclei.template_id, canonical_url |
| RB3 | Weak Encryption | tls | observed open port | category_per_exposure: old_versions→`tls:old_versions`; weak_ciphers→`tls:weak_ciphers` | tls_versions_set, weak_cipher_class_toggle |
| RB4 | Certificate Issues | tls | observed open port | issue:{issue_type}|cert:{cert_anchor} | issue_type, cert_anchor, expiry_threshold_crossed |
| RB5 | Risky HTTP Security Headers | http/or/https | from observation | missing:{missing_headers}|url:{canonical_url_root} | missing_headers_set |
| RB6 | Unresponsive / Unknown Edge Service | tcp | observed open port | symptom:{symptom} | symptom |
| RB7 | DNS Email Spoofing Risk | dns | none (port=0) | record_per_exposure: spf→`record:spf`; dmarc→`record:dmarc`; dkim→`record:dkim|sel:{selector}` | dmarc_policy, spf_all_mechanism, dkim_selector_presence |

> Note: If this block conflicts with prose elsewhere in the contract, the YAML is the source of truth.
<!-- END:EXPOSURE_IDENTITY_AUTO -->



