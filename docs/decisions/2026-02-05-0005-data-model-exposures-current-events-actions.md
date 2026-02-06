# ADR 0005: Data model: exposures current + events + actions

## Context
We need:
- a fast “current exposures” view
- a reliable change feed for NEW/CHANGED/FIXED
- a workflow audit trail (assign, verify, urgent, snooze)

## Decision
Use three layers:
1) exposures: current state (one row per identity_key per asset)
2) exposure_events: append-only event stream (one row per scan change)
3) exposure_actions: append-only operator actions (workflow telemetry)

## Alternatives considered
1) Events-only: expensive to query “current state” repeatedly.
2) Current-only: loses history needed for drift, proof-of-fix, and moat signals.
3) Over-normalized models: slows development and complicates queries.

## Consequences
- ✅ Fast dashboard queries
- ✅ Strong basis for drift/stability and XRAY score calibration later
- ✅ Clean audit trail
- ❌ Need to keep “current” and “events” consistent (tested diff engine)

## Revisit when
- storage costs require archiving events
- we move to event sourcing fully (unlikely needed for v1–v3)
