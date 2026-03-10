# Security Hardening Checklist

## Auth and Session

- Enforce bearer token presence and format.
- Enforce token issuer and signing method constraints.
- Separate access and refresh token usage checks.
- Keep refresh token rotation and revoke-on-reuse behavior.
- Keep role checks explicit for privileged routes.

## Configuration

- Avoid empty JWT secret in production-like environments.
- Keep TTL values bounded and validated.
- Keep CORS origins allow-listed and explicit.
- Keep insecure dev toggles (`VCT_DISABLE_AUTH_FOR_DATA`) defaulting to safe values.

## Transport and Error Handling

- Keep strict JSON decoding with unknown-field rejection.
- Avoid leaking internal stack traces or secret values in API errors.
- Keep consistent HTTP status mapping for auth failures.

## Operational Hygiene

- Keep audit retention bounded by `AuditLimit`.
- Ensure graceful shutdown path remains functional.
- Document security-impacting changes in release notes.
