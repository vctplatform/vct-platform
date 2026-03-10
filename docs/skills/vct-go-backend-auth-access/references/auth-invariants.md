# Auth Invariants and Extension Rules

## Token Invariants

- Sign tokens with `HS256` only.
- Validate issuer and token-use (`access` vs `refresh`) on parse.
- Keep access and refresh TTL independent.
- Keep `sessionId` and token `jti` claims present.

## Session Invariants

- Store active refresh session by `sessionId`.
- Replace `CurrentRefreshJTI` on every successful refresh.
- Revoke session when token reuse is detected.
- Revoke access token IDs in `revokedAccessJTIs` until expiration.

## Audit Invariants

- Record login success/failure.
- Record refresh success/failure and reason.
- Record logout and revoke operations.
- Enforce bounded audit length (`AuditLimit`).

## Role Extension Procedure

1. Add role constant in `UserRole`.
2. Update credential-role allow list if static credentials remain in use.
3. Apply permission checks in handlers that require role gating.
4. Add tests for allowed and forbidden scenarios.

## Safe Refactor Boundaries

- Keep mutex protection around mutable state maps.
- Keep cleanup interval behavior deterministic.
- Keep response field names stable for frontend adapters.
