# XRAY Watchtower — v1 Scan Profiles (Ports, Timeouts, Safety)

**Status:** Draft v1.0  
**Last updated:** 2026-02-05  
**Applies to:** v1 baseline + verify scans  
**Toolchain:** naabu → httpx → tlsx → nuclei (+ optional selective nmap)

## Source of truth (avoid drift)

**`config/scan_profiles.yaml` is the source of truth** for ports, timeouts, limits, and concurrency.
This document explains the intent and rationale, but **implementation MUST read from the YAML** (or be generated from it).
If the YAML and this doc disagree, **the YAML wins**.

---

## 1. Purpose

Freeze the **exact v1 scanning surface** (ports + timeouts + limits) so that:
- scan results are stable,
- exposure identities are deterministic,
- the diff engine behaves predictably from day one.

This doc is the source of truth for:
- what ports are scanned in v1 baseline scans,
- what ports/timeouts are used in verify scans,
- safety constraints (no destructive actions, no brute force).

---

<!-- BEGIN:SCAN_PROFILES_AUTO -->
## v1 scan profiles (auto-generated from `config/scan_profiles.yaml`)

### Baseline port allowlist (TCP)
- 22, 80, 443, 2082, 2083, 2086, 2087, 2095, 2096, 2222, 3000, 3389, 5000, 5601, 5900, 5901, 5985, 5986, 8000, 8008, 8080, 8081, 8086, 8088, 8089, 8181, 8443, 8888, 9000, 9001, 9090, 9200, 9443, 10000, 10443, 15672

### HTTP candidates (httpx)
- 80, 2082, 2086, 2095, 3000, 5000, 5601, 8000, 8008, 8080, 8081, 8086, 8088, 8089, 8181, 8888, 9000, 9001, 9090, 9200, 10000, 15672

### HTTPS candidates (httpx)
- 443, 2083, 2087, 2096, 8443, 9443, 10443

### TLS candidates (tlsx)
- 443, 2083, 2087, 2096, 8443, 9443, 10443

### Timeouts / retries
- DNS: timeout=2s retries=1 budget/domain=8s
- naabu: connect_timeout=800ms retries=1 host_timeout=60s
- httpx: timeout=8s retries=1 max_redirects=5 max_bytes=262144
- tlsx: timeout=6s retries=1
- nuclei: timeout=10s retries=1

### Limits / caps
- max_total_runtime_seconds=900
- max_runtime_seconds_per_endpoint=180
- max_total_endpoints_per_scan=2000
- max_endpoints_per_asset(domain)=20
- max_endpoints_per_asset(cidr)=256

### Concurrency
- naabu_rate_pps=500
- httpx_concurrency=50
- tlsx_concurrency=50
- nuclei_concurrency=25
- nuclei_rate_limit_rps=50
- per_host_concurrency_cap=4
<!-- END:SCAN_PROFILES_AUTO -->





## 5. v1 Scan flow per profile

### 5.1 Baseline flow (daily / on-demand)
1) Resolve domains (A/AAAA, CNAME chain) and construct endpoint list
2) naabu scans **XRAY_V1_TCP_PORTS_BASELINE** for each endpoint IP
3) httpx runs only on ports in the HTTP candidate set:
   - `HTTP_PORTS = {80, 8000, 8008, 8080, 8081, 8088, 8181, 8888, 9000, 9001, 9090, 9200, 10000, 15672, 2082, 2086, 2095, 3000, 5000, 5601, 8086, 8089}`
   - `HTTPS_PORTS = {443, 8443, 9443, 10443, 2083, 2087, 2096}`
4) tlsx runs only on ports in:
   - `TLS_PORTS = {443, 8443, 9443, 10443, 2083, 2087, 2096}`
5) nuclei runs against the set of httpx-discovered URLs (final URLs), with safe template allowlist for:
   - exposed web panels (RB2)
   - HTTP security header checks (RB5, advisory)
   - TLS/cert related checks (RB3/RB4 where applicable)
6) RB7 DNS checks for each configured domain asset:
   - SPF / DMARC / DKIM posture

### 5.2 Verify flow (“Verify fix”)
Given one exposure:
- RB1/RB6: naabu scan only that port on that endpoint IP; optionally tlsx/httpx if relevant
- RB2: httpx on the exposure URL host/port, then nuclei rerun for the matching template category (or template_id if you keep it)
- RB3/RB4: tlsx on the exposure port (+ optional httpx for supporting evidence)
- RB5: httpx on canonical URL root; recompute missing header set
- RB7: rerun DNS posture checks for that domain

---

## 6. Change control

Any change to:
- port allowlist,
- tool timeouts,
- template allowlist,
- safety constraints

must update this doc and bump the doc’s “Last updated” date.

---

## 7. Database Definitions

### scan_jobs.status
Values: `queued` | `claimed` | `running` | `completed` | `failed`

### scan_jobs.scan_profile
Values: `baseline` | `verify`
