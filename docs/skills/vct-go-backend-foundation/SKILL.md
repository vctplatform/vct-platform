---
name: vct-go-backend-foundation
description: Foundation workflow for building and refactoring VCT Platform backend services in Go 1.26. Use when creating new backend modules, organizing code under backend/cmd and backend/internal, wiring HTTP server startup and middleware, adding environment-based configuration, or aligning new features with current backend conventions before implementation.
---

# VCT Go Backend Foundation

## Quick Start

1. Confirm target scope in `backend/` and keep compatibility with Go 1.26.
2. Read `references/backend-architecture.md` for package ownership and dependency direction.
3. Read `references/foundation-checklist.md` and execute the checklist in order.
4. Implement changes in small patches, preserving existing API contracts unless explicitly changed.
5. Run `go test ./...` inside `backend` before finalizing.

## Workflow

1. Classify the request as one of: scaffolding, refactor, configuration, or runtime wiring.
2. Map each change to the correct package boundary:
   - Entry point and process lifecycle: `backend/cmd/server`
   - Environment and runtime settings: `backend/internal/config`
   - Transport/routing composition: `backend/internal/httpapi`
   - Domain logic: `backend/internal/<domain>`
3. Maintain dependency direction:
   - `cmd` imports `internal/*`
   - `httpapi` coordinates dependencies but does not host deep business logic
   - Domain packages avoid importing `cmd`
4. Make configuration explicit:
   - Add new env variables in `config.Load()` with safe defaults
   - Parse via helper functions (`parseDuration`, `parseInt`, CSV split)
   - Mirror every new variable in `backend/.env.example` and `backend/README.md`
5. Add or update tests near modified code.
6. Verify startup path (`main.go`) and graceful shutdown behavior remain intact.

## Output Requirements

1. Report each changed file and why it changed.
2. Report behavior impact (new env vars, route changes, defaults, compatibility risks).
3. Report exact verification commands and pass/fail status.

## References

- Architecture map: `references/backend-architecture.md`
- Implementation checklist: `references/foundation-checklist.md`
