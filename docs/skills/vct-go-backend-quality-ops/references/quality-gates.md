# Quality Gates

## Required Gates

1. Formatting gate
   - No unformatted `.go` file from `gofmt -l`.
2. Unit/integration gate
   - `go test ./...` passes.
3. Static analysis gate
   - `go vet ./...` passes.

## Recommended Gate

1. Race gate
   - `go test -race ./...` passes.
   - Allow skip for environments without race support, but report skip reason.

## Typical Fix Mapping

- `gofmt` failure: run `gofmt -w <files>` and re-check.
- `go test` failure: fix behavior regression and update tests only when contract changes.
- `go vet` failure: fix suspicious constructs, unreachable code, wrong format verbs, or mutex misuse.
- `-race` failure: fix shared mutable state with proper synchronization.

## Minimum Merge Readiness

- Required gates pass.
- No unresolved auth/security TODOs in changed files.
- New env variables documented in `.env.example` and backend README.
