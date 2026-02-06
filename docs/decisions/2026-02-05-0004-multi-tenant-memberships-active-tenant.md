# ADR 0004: Multi-tenant model uses memberships + explicit active tenant context

## Context
MSPs need one user to manage multiple tenants. We must avoid the “user has one tenant_id” shortcut.

## Decision
Store:
- tenants
- users
- tenant_memberships (user_id, tenant_id, role)

Each API request resolves an “active tenant” via:
- required header `X-Tenant-ID` (validated against memberships), OR
- JWT claim `active_tenant_id` (set via a “switch tenant” endpoint)

v1 uses `X-Tenant-ID` for simplicity.

## Alternatives considered
1) Single-tenant per user: breaks MSP use case.
2) Separate login per tenant: poor UX, harder to operate.
3) Rely purely on frontend state: unsafe.

## Consequences
- ✅ Correct MSP multi-tenant behavior
- ✅ Clear authorization boundary per request
- ✅ Easy to add RBAC per tenant role
- ❌ Slightly more boilerplate (middleware / dependency)

## Revisit when
- we add external IdP (Clerk/Auth0/WorkOS) and want tenant switching in JWT
