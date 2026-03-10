# Foundation Checklist

## 1. Scope the Change

- Identify whether the request changes transport, domain logic, config, or startup lifecycle.
- Limit edits to required packages.

## 2. Place Code in the Right Package

- Add entrypoint/process wiring only in `cmd/server`.
- Add env parsing and defaults only in `internal/config`.
- Add route orchestration in `internal/httpapi`.
- Add business logic in dedicated `internal/<domain>` package.

## 3. Keep Configuration Coherent

- Add env key with fallback in `config.Load()`.
- Validate parse rules and fallback semantics.
- Document env var in `backend/.env.example` and `backend/README.md`.

## 4. Preserve API Stability

- Keep existing routes and payload schema unless explicitly requested to break compatibility.
- Reuse common response helpers for consistency.

## 5. Cover with Tests

- Extend package-level tests (`*_test.go`) near modified code.
- Include success path and failure path for each behavior change.

## 6. Verify Before Delivery

- Run from `backend/`:
  - `go test ./...`
  - `go vet ./...` for non-trivial refactors
- Report any skipped checks.
