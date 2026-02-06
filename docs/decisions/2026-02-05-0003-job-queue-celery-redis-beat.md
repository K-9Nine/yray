# ADR 0003: Background jobs use Celery + Redis + Celery Beat

## Context
We need reliable background execution for:
- scheduled scans
- on-demand scans
- verify-fix scans
We want retries, backoff, concurrency control, and visibility.

## Decision
Use:
- Redis as broker/backing store
- Celery workers to execute scan jobs
- Celery Beat for scheduled “enqueue due scans” task

## Alternatives considered
1) Custom Redis list queue: simpler initially but reinvents retries, dedupe, visibility.
2) Postgres job table + polling: simple but grows messy with concurrency/retries.
3) Pub/Sub: adds cloud dependency and complexity for v1.

## Consequences
- ✅ Built-in retries, rate limiting patterns, scheduling
- ✅ Clear mental model for “job types”
- ✅ Easy to scale workers later
- ❌ Slightly more setup than a DIY loop

## Revisit when
- we move off single VM and need managed queue primitives
- we require per-tenant scheduling precision beyond “due scan poll”
