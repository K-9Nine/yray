# ADR 0002: Scanner toolchain = naabu + httpx + tlsx + nuclei, with selective nmap

## Context
We need fast, structured, external-only evidence collection with low noise. Nmap is excellent but can be slow for broad sweeps. ProjectDiscovery tools provide JSONL outputs and speed.

## Decision
Use the following toolchain:
- naabu: fast port discovery
- httpx: HTTP probing + fingerprints (title, headers, tech, hashes)
- tlsx: TLS/certificate posture
- nuclei: curated templates for panels/misconfig/TLS/headers
- nmap: used selectively to improve evidence quality (verify RB1/RB6, tricky services)

## Alternatives considered
1) Nmap-only: slower at scale; harder to produce consistent structured evidence for web/TLS.
2) Masscan + Nmap: very fast but more operational risk/false positives and more care needed.
3) Commercial scanners: less control, more cost, less moat.

## Consequences
- ✅ Speed + structured outputs
- ✅ Easy to normalize into stable evidence objects
- ✅ Two-phase scanning becomes natural (sweep → deepen)
- ❌ Must pin versions and manage tool output drift
- ❌ Need careful template curation for nuclei to avoid noisy findings

## Revisit when
- we need deeper protocol coverage beyond what these tools provide
- we see consistent false positives in specific environments requiring new probes
