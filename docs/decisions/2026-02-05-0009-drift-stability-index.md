# ADR 0009: Compute drift/stability signals from exposure_events

## Context
We want a signal moat: “how edges evolve” and “what keeps coming back.”
This also improves prioritisation for MSPs.

## Decision
Compute nightly derived stats per (tenant, asset, bucket):
- churn rate (opens/fixes/changes per 30 days)
- recurrence interval (median days between reopen events)
- stability probability (stays fixed 60 days)
- drift_index (0..1) derived from churn + recurrence

Store in an aggregated table (e.g., asset_bucket_stats) and surface in UI.

## Alternatives considered
1) Compute on the fly: slow and expensive.
2) Only show raw events: hard for MSPs to interpret.

## Consequences
- ✅ Stable UI insights: “recurs every ~X days”
- ✅ Enables smarter scan frequency (adaptive scanning)
- ✅ Feeds XRAY scoring later
- ❌ Requires careful definition to avoid misleading metrics

## Revisit when
- we add discovery and want drift at “asset family” or “cluster” level
