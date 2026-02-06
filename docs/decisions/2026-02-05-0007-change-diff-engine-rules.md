# ADR 0007: Diff engine rules (NEW/CHANGED/FIXED/UNRESPONSIVE)

## Context
We must keep signal high. “Changed” should mean “changed in a way that matters,” not noise.

## Decision
For each asset, compare current scan exposure set vs previous scan:
- NEW: identity exists now, not before
- FIXED: identity existed before, not now
- CHANGED: same identity exists, but material evidence changed
- UNRESPONSIVE: port appears open but application-level probe fails (classified as RB6)

Material-change definitions:
- RB4: cert expiry crossed thresholds, issuer changed, SAN set changed
- RB3: TLS version set changed or cipher posture materially changed
- RB5: header set changed (missing headers differs)
- RB2: matched URL moved or evidence content changed meaningfully

Default alerting:
- alert on NEW and “changed to worse”
- suppress noisy advisories by default (RB5/RB6 unless flagged)

## Alternatives considered
1) Treat any evidence change as CHANGED: too noisy.
2) No CHANGED category: loses important drift/hardening signals.

## Consequences
- ✅ Change dashboard stays actionable
- ✅ Drift index computations become meaningful
- ❌ Requires careful tests and fixtures (sample scan outputs)

## Revisit when
- we add richer fingerprints and want more nuanced CHANGED rules
