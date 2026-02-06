# ADR 0010: XRAY Risk Score: instrument now, calibrate later

## Context
Public scores (CVSS/EPSS) are commoditized. Our moat comes from learning:
- what MSPs actually fix
- what stays fixed
- what reopens
But v1 must ship without ML complexity.

## Decision
Stage XRAY Risk Score:
- v1: compute xray_score_v0 (rules/formula) and log outcomes/actions
- v2: display XRAY 0–100 as primary ordering + explainable breakdown
- v3: calibrate weights using a simple model trained on our outcomes

Positioning:
- “Operational Priority Score for MSPs” (not absolute exploit likelihood)

Guardrails:
- RB1/RB2 remain high unless explicitly suppressed
- expose “why this score?” top factors

## Alternatives considered
1) Use CVSS/EPSS only: not differentiated.
2) Full ML from day 1: too risky and slow for solo build.

## Consequences
- ✅ Strong compounding moat with minimal early cost
- ✅ Improves prioritisation without overclaiming
- ❌ Must avoid biasing toward “easy fixes” without constraints

## Revisit when
- we have enough outcome data (thousands of exposures with closure history)
- we see systematic mis-ranking that requires feature additions
