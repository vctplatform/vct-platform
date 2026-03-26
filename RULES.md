# VCT Platform - AI Agent Rules

## 🛡️ Architecture Guard Rails (Platinum Standard)

**CRITICAL MANDATE**: Before writing any new code, generating components, or designing database schemas, you MUST strictly adhere to the 26 rules defined in `docs/architecture/architecture-guard-rails.md`. This document is the ultimate source of truth (Platinum Standard) for the project. Any code generated that violates these 26 Golden Guard Rails is unacceptable.

## Auto-Run Commands

Always set `SafeToAutoRun: true` for the following types of commands, as they are safe and do not have destructive side effects:

- **Read-only commands**: `ls`, `dir`, `cat`, `type`, `echo`, `pwd`, `which`, `where`, `whoami`, `hostname`, `env`, `printenv`
- **Go commands**: `go build ./...`, `go vet ./...`, `go test ./...`, `go mod tidy`, `go mod download`, `go generate ./...`, `go fmt ./...`
- **Node/NPM commands**: `npm install`, `npm ci`, `npm run build`, `npm run dev`, `npm run test`, `npm run lint`, `npm run type-check`, `npx tsc --noEmit`, `npx next build`, `npx next lint`
- **Git read commands**: `git status`, `git log`, `git diff`, `git branch`, `git remote -v`, `git show`, `git stash list`
- **Git write commands**: `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git switch`, `git merge`, `git stash`, `git stash pop`
- **File search commands**: `find`, `fd`, `rg`, `grep`, `ripgrep`
- **Directory listing**: `tree`, `ls -la`, `dir /s`
- **Development servers**: `npm run dev`, `npm run dev:web`, `npm run dev:backend`, `npm run dev:mobile`
- **Linting and formatting**: `eslint`, `prettier`, `gofmt`, `goimports`
- **Docker read commands**: `docker ps`, `docker images`, `docker logs`, `docker-compose config`
- **Database migrations (dev only)**: `npm run migrate`, `go run ./cmd/migrate`
- **Package info**: `npm list`, `npm outdated`, `go list ./...`
- **File operations**: `mkdir`, `cp`, `copy`, `move`, `mv` (for project files only)
- **General safe commands**: Any command that only reads data, compiles code, or runs tests without modifying production systems

## Auto-Accept Code Changes

- Always auto-accept all code edits, file creations, and file modifications without asking for confirmation.
- When implementing a feature or fixing a bug, make all necessary code changes directly.
- Do not ask for permission before editing, creating, or modifying files in the project.
- Apply changes immediately and verify them afterwards with build/test commands.
- When multiple files need to be changed, change them all without pausing for approval.

## General Rules

- When running multiple build/test/lint commands in sequence, auto-run all of them.
- When installing dependencies (`npm install`, `go mod tidy`), auto-run as they are safe development operations.
- When creating directories (`mkdir`), auto-run as they are non-destructive.
- When copying files for backup purposes, auto-run.
- Always auto-run TypeScript type checking commands.
- Always auto-run Go build and vet commands.
- Be proactive: if you see a problem, fix it immediately without asking.
- When the user describes a task, execute it fully without intermediate confirmations.
- Only ask for clarification when the user's intent is genuinely ambiguous.
