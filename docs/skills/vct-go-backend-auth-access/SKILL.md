---
name: vct-go-backend-auth-access
description: Authentication and authorization workflow for VCT Platform backend in Go 1.26. Use when implementing or refactoring JWT login/refresh/revoke flows, adding roles or permission checks, changing token claims, debugging auth middleware, or extending audit logging and session revocation behavior.
---

# VCT Go Backend Auth Access

## Quick Start

1. Read `references/auth-contract.md` to align request/response contracts.
2. Read `references/auth-invariants.md` before modifying token or session logic.
3. Classify request as endpoint, role policy, token lifecycle, or audit change.
4. Implement updates in `internal/auth/service.go` and route wiring in `internal/httpapi/server.go`.
5. Add tests in `internal/auth/service_test.go` and run `go test ./...`.

## Workflow

1. Apply contract-first edits:
   - Update request structs for payload changes.
   - Update handler decode/response logic.
2. Apply token lifecycle rules:
   - Keep `access` and `refresh` token uses separated.
   - Rotate refresh JTI on successful refresh.
   - Revoke session on refresh token reuse detection.
3. Apply authorization rules:
   - Extend `UserRole` constants if new roles are required.
   - Enforce permission checks in handlers using authenticated principal.
4. Apply audit rules:
   - Record both success and failure for critical auth events.
   - Include actionable details (`reason`, `sessionId`, `revokedCount`) in audit entries.
5. Validate thread safety:
   - Use service mutex for all shared map reads/writes.
   - Keep cleanup behavior bounded and predictable.

## Guardrails

- Reject invalid signature algorithms and malformed bearer tokens.
- Keep all auth/session timestamps in UTC.
- Return mapped auth errors (`ErrUnauthorized`, `ErrForbidden`, etc.) instead of leaking internals.
- Preserve compatibility for existing frontend fields: `accessToken`, `refreshToken`, `expiresAt`, `refreshExpiresAt`.

## References

- API contracts: `references/auth-contract.md`
- Security and lifecycle invariants: `references/auth-invariants.md`
