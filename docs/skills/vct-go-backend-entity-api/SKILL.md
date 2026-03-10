---
name: vct-go-backend-entity-api
description: Entity API implementation workflow for VCT Platform backend in Go 1.26. Use when adding or refactoring `/api/v1/{entity}` CRUD routes, bulk/import/export handlers, allow-listed entities, store behavior, or payload compatibility with frontend EntityRepository and ApiAdapter contracts.
---

# VCT Go Backend Entity API

## Quick Start

1. Read `references/entity-route-contract.md` to confirm route and payload shape.
2. Read `references/store-semantics.md` before changing in-memory entity behavior.
3. Determine whether request affects route mapping, allow-list, validation, or import/export semantics.
4. Implement updates in `internal/httpapi/server.go` and `internal/store/store.go`.
5. Add tests in `internal/httpapi/server_test.go` and store tests when logic changes.

## Workflow

1. For new entity support:
   - Add entity key to `defaultEntitySet()` in sorted order.
   - Seed initial data only when needed by tests or local development.
2. For CRUD behavior changes:
   - Preserve route shape and HTTP methods.
   - Keep ID requirement strict (`id` must be non-empty string).
3. For bulk/import/export changes:
   - Keep `PUT /bulk` replacing full collection atomically.
   - Keep `POST /import` returning imported/rejected report.
   - Keep `GET /export` supporting `json` and `csv` only.
4. For auth gating changes:
   - Respect `VCT_DISABLE_AUTH_FOR_DATA` toggle in route path.
5. For response consistency:
   - Use shared `success`, `badRequest`, and `methodNotAllowed` helpers.

## Guardrails

- Return `404` for unknown entities and unsupported deep paths.
- Avoid schema-specific branching in generic handlers unless explicitly requested.
- Preserve existing frontend compatibility for list/get/create/update/delete and import/export flows.
- Keep collection ordering deterministic when returning list output.

## References

- Route and entity contract: `references/entity-route-contract.md`
- Store behavior and data rules: `references/store-semantics.md`
