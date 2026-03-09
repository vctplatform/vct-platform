.PHONY: dev dev-web dev-backend build lint typecheck test clean seed migrate quality-backend db-smoke-backend

# ════════════════════════════════════════════════════════════════
# VCT PLATFORM — Makefile
# ════════════════════════════════════════════════════════════════

# ── Development ────────────────────────────────────────────────

dev: ## Start all services
	@echo "Starting VCT Platform..."
	$(MAKE) dev-web &
	$(MAKE) dev-backend &
	wait

dev-web: ## Start Next.js frontend
	npm run dev --workspace next-app

dev-backend: ## Start Go backend
	go -C backend run ./cmd/server

dev-infra: ## Start infrastructure services (Docker)
	docker compose up -d

# ── Build ──────────────────────────────────────────────────────

build: ## Build all packages
	npm run build

build-backend: ## Build Go backend binary
	go -C backend build -o ./backend/bin/vct-backend ./cmd/server

# ── Quality ────────────────────────────────────────────────────

lint: ## Run linters
	npm run lint

typecheck: ## Run TypeScript type checking
	npx tsc -p tsconfig.json --noEmit

test: ## Run all tests
	node scripts/run-tests.mjs

test-e2e: ## Run end-to-end tests
	npx playwright test --config=playwright.config.mjs

test-backend: ## Run Go tests
	cd backend && go test ./...

quality-backend: ## Run backend quality gates (gofmt/test/vet)
	powershell -ExecutionPolicy Bypass -File scripts/run_quality_checks.ps1 -BackendPath ./backend

# ── Database ───────────────────────────────────────────────────

migrate: ## Run database migrations
	cd backend && go run ./cmd/migrate up

migrate-down: ## Rollback last migration
	cd backend && go run ./cmd/migrate down

seed: ## Seed database with reference data
	cd backend && go run ./cmd/migrate seed

db-smoke-backend: ## Run backend DB smoke flow (migrate/seed/down/up)
	node scripts/run-backend-db-smoke.mjs

# ── Code Generation ───────────────────────────────────────────

generate: ## Run all code generators
	cd backend && sqlc generate
	npm run authz:sync

# ── Docker ─────────────────────────────────────────────────────

docker-up: ## Start all Docker services
	docker compose up -d

docker-down: ## Stop all Docker services
	docker compose down

docker-logs: ## View Docker logs
	docker compose logs -f

# ── Cleanup ────────────────────────────────────────────────────

clean: ## Clean build artifacts
	rm -rf apps/next/.next
	rm -rf backend/bin
	rm -rf node_modules/.cache

# ── Help ───────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
