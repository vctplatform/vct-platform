---
name: vct-go-backend-quality-ops
description: Quality, security, and release-readiness workflow for VCT Platform backend in Go 1.26. Use when validating backend changes before merge, running test/vet/race and formatting gates, hardening auth and configuration behavior, or preparing Docker/runtime delivery with explicit risk reporting.
---

# VCT Go Backend Quality Ops

## Quick Start

1. Run `scripts/run_quality_checks.ps1 -BackendPath ./backend` from repository root.
2. Read `references/quality-gates.md` to interpret failures and acceptance criteria.
3. Apply fixes, re-run checks, and only finalize when all required gates pass.
4. Read `references/security-hardening.md` for auth/config hardening before release.

## Workflow

1. Execute automated gate script:
   - Go version visibility
   - `gofmt` verification
   - `go test ./...`
   - `go vet ./...`
   - Optional `go test -race ./...`
2. Triage failed checks by category:
   - Formatting
   - Correctness/test regression
   - Static analysis issues
   - Concurrency/data-race concerns
3. Re-run full gate after every fix batch.
4. Prepare release notes:
   - Mention env var changes
   - Mention route contract changes
   - Mention known limitations or skipped checks

## Output Requirements

- Report each gate result with pass/fail state.
- Report skipped checks and reason.
- Report remaining risks when any check cannot run.

## References

- Quality gate criteria: `references/quality-gates.md`
- Security hardening checklist: `references/security-hardening.md`
