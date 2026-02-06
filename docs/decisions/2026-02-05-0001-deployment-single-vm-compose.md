# ADR 0001: Deploy v1 on a single Linux VM using Docker Compose

## Context
We are building XRAY Watchtower solo. We need a deployment approach that:
- reliably supports external scanning tooling
- is simple to operate
- minimizes moving parts while iterating rapidly

## Decision
Deploy v1 on a single Ubuntu VM (or equivalent) using Docker Compose:
- API (FastAPI)
- Worker (scanner runner)
- Scheduler (Beat or polling)
- Postgres
- Redis
- Reverse proxy (Caddy)

## Alternatives considered
1) Cloud Run / serverless containers: higher operational simplicity but scanning tooling can be constrained and debugging is slower.
2) Kubernetes: too much operational overhead for a solo build.
3) Managed “scanner as a service” vendors: reduces control and increases costs; limits moat building.

## Consequences
- ✅ Highest reliability for scanner tooling + easiest debugging
- ✅ Cost predictable and low for v1
- ✅ Simple backups and monitoring
- ❌ Single machine is a single point of failure (acceptable at v1)
- ❌ Must handle OS updates and basic ops

## Revisit when
- >50 tenants or sustained scan concurrency needs scaling beyond a single host
- uptime/SLA requirements exceed what a single VM can provide
