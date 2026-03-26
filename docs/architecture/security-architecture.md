# VCT Platform Security & Compliance Architecture

The VCT Platform handles highly sensitive personal data (Athletes' identities, competition records) and financial subscriptions. This document defines the absolute, FAANG-level security laws that protect the platform from unauthorized access, data breaches, and insider threats.

Any pull request violating these rules will be considered a critical failure and must be immediately reverted.

## 1. Zero Trust & Network Boundaries
- **Content Security Policy (CSP)**: Next.js must define a strict CSP. Inline scripts (`unsafe-inline`) and `eval()` are categorically banned to eradicate Cross-Site Scripting (XSS).
- **CORS Blacklisting**: `Access-Control-Allow-Origin: *` is banned in the Go Backend. Only explicitly verified domains (e.g., `https://*.vctplatform.com`) are allowed via precise regex matching.
- **Edge Mitigations**: Rate Limiting and Web Application Firewalls (WAF) must be configured at the Edge (Vercel/Cloudflare). Sustained 4xx/5xx errors from the same IP will trigger automatic temporary bans.

## 2. Authentication, Identity, & Cryptography
- **Argon2id Hashing**: The use of MD5, SHA-1, SHA-256, and bcrypt for password hashing is banned. `argon2id` is the mandatory algorithm for storing user credentials.
- **Sliding JWT Sessions**: JWT lifetimes must be no longer than 15-60 minutes. Continuous user activity seamlessly requests new tokens via secure HTTP-Only Refresh Cookies.
- **Instant Invalidation**: Upon password change, 2FA toggle, or logout, all associated Refresh Tokens must be synchronously burned in the database, severing all live sessions globally.
- **Token-Bound RBAC**: Role-Based Access Control parameters (e.g., `role: federation_admin`) must be read exclusively from the cryptographically verified JWT claims by the Go Middleware. Never trust client-provided payloads like `{"role": "admin"}`.

## 3. Threat Vulnerability Defense (OWASP Top 10)
- **SQL Injection (SQLi)**: String concatenation for database queries (`"SELECT * FROM users WHERE id = '" + req.ID + "'"` ) is absolutely forbidden. The Go `database/sql` package must be used exclusively with Parameterized Queries (`$1`, `?`), or a secure ORM equivalent.
- **IDOR Eradication**: Insecure Direct Object Reference is the #1 API vulnerability. Every data mutation (Update/Delete) or sensitive fetch query MUST append a secondary validation layer asserting ownership: `WHERE id = $1 AND tenant_id = $2`. Accessing an ID indiscriminately is an automatic architecture violation.
- **CSRF Mutations**: All non-GET requests modifying state must be protected either by Same-Site `strict` cookies combined with custom Authorization Headers, verifying the request originated specifically from our interface.

## 4. Secret Management & IaC
- **The `.env` Ban**: Hardcoding real secrets, database passwords, or JWT sign keys into Git-tracked `.env` files is a terminable offense.
- **Vault Injection**: Production secrets exist solely within the Cloud Provider's Secret Manager (e.g., Vercel Secrets, Hashicorp Vault, AWS KMS). Applications pull these secrets strictly at runtime via environment variables passed down by the container orchestrator.

## 5. Data Privacy & Log Masking
- **TLS 1.3 Strict**: All traffic is encrypted in transit using the highest available TLS protocol. Traffic attempting HTTP or outdated TLS 1.0/1.1 is forcefully dropped.
- **PII / PHI Obfuscation**: Passwords, Social Security Numbers (CCCD), Emails, and Phone Numbers MUST NOT appear in server logs or Sentry error reports. A middleware masking interceptor must scrub these fields (e.g., replacing with `***`) before any payload is stringified.
- **Data Minimization**: The API must never return wildcard responses (`SELECT *` mapped directly to JSON). Only explicitly modeled fields specifically required by the UI can be returned to the client payload.

## 6. Supply Chain & Dependency Security
- **CI Dependency Gates**: `npm audit` and `govulncheck` must run on every CI pipeline. If any dependency introduces a CVE (Common Vulnerabilities and Exposures) score $>=$ 5.0 (High/Critical), the PR status is marked `Failing` permanently until the dependency is patched or replaced.
