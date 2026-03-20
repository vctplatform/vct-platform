.PHONY: dev dev-web dev-backend build lint typecheck test clean seed migrate quality-backend db-smoke-backend mobile-dev mobile-ios mobile-android mobile-build-dev mobile-build-preview mobile-build-prod mobile-ota mobile-test mobile-typecheck mobile-clean

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

db-up: ## Start PostgreSQL container
	docker compose up -d postgres

db-down: ## Stop PostgreSQL container
	docker compose stop postgres

db-reset: ## Reset database (drop volume + recreate)
	docker compose down -v && docker compose up -d postgres

db-backup: ## Backup database to ./backups/
	@mkdir -p backups
	docker exec vct-postgres pg_dump -U $${POSTGRES_USER:-vct_admin} -Fc vct_platform > backups/vct_platform_$$(date +%%Y%%m%%d_%%H%%M%%S).dump
	@echo "Backup saved to backups/"

db-restore: ## Restore database from backup (usage: make db-restore FILE=backups/xxx.dump)
	docker exec -i vct-postgres pg_restore -U $${POSTGRES_USER:-vct_admin} -d vct_platform --clean < $(FILE)

db-shell: ## Open psql shell to database
	docker exec -it vct-postgres psql -U $${POSTGRES_USER:-vct_admin} -d vct_platform

db-admin: ## Start pgAdmin web UI at http://localhost:5050
	docker compose --profile admin up -d pgadmin
	@echo "pgAdmin: http://localhost:5050 (admin@vct-platform.com / admin)"

db-pool-stats: ## Show PgBouncer connection pool stats
	docker exec vct-pgbouncer psql -h localhost -p 6432 -U $${POSTGRES_USER:-vct_admin} pgbouncer -c "SHOW POOLS;"

db-monitoring: ## Start monitoring stack (Prometheus + Grafana + Loki)
	docker compose -f docker-compose.prod.yml --profile monitoring up -d pg-exporter prometheus grafana loki promtail
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana:    http://localhost:3001 (admin/admin)"
	@echo "Loki:       http://localhost:3100"

db-healthcheck: ## Run comprehensive database health check
	bash infra/scripts/db-healthcheck.sh

db-logs: ## View aggregated logs via Loki (requires monitoring stack)
	@echo "Open Grafana → Explore → Select 'Loki' datasource"
	@echo "URL: http://localhost:3001/explore"

db-backup-verify: ## Verify integrity of latest backup
	bash infra/scripts/backup-verify.sh

proxy: ## Start Nginx reverse proxy with SSL
	docker compose -f docker-compose.prod.yml up -d nginx
	@echo "HTTP:  http://localhost"
	@echo "HTTPS: https://localhost"

ssl-gen: ## Generate self-signed SSL cert (for dev/staging)
	openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
		-keyout infra/docker/nginx/ssl/key.pem \
		-out infra/docker/nginx/ssl/cert.pem \
		-subj "/C=VN/ST=HCMC/L=HCMC/O=VCT Platform/CN=localhost"
	@echo "✅ Self-signed cert generated"

db-migrate: ## Run database migrations manually
	docker compose -f docker-compose.prod.yml run --rm migrate

# ── Helm / Kubernetes ─────────────────────────────────────────

helm-template: ## Render Helm templates (dry-run)
	helm template vct infra/helm/vct-platform

helm-staging: ## Deploy to staging with Helm
	helm upgrade --install vct infra/helm/vct-platform \
		-f infra/helm/vct-platform/values-staging.yaml \
		--namespace vct-staging --create-namespace

helm-production: ## Deploy to production with Helm
	helm upgrade --install vct infra/helm/vct-platform \
		--namespace vct-production --create-namespace

k8s-validate: ## Validate all Kubernetes manifests (dry-run)
	@echo "── Validating base manifests..."
	kubectl kustomize infra/k8s/base > /dev/null && echo "✅ base OK" || echo "❌ base FAILED"
	@echo "── Validating staging overlay..."
	kubectl kustomize infra/k8s/staging > /dev/null && echo "✅ staging OK" || echo "❌ staging FAILED"
	@echo "── Validating production overlay..."
	kubectl kustomize infra/k8s/production > /dev/null && echo "✅ production OK" || echo "❌ production FAILED"

k8s-diff: ## Show diff between cluster and desired state
	kubectl diff -k infra/k8s/production || true

infra-status: ## Show infrastructure component versions
	@echo "══════════════════════════════════"
	@echo "  VCT Platform — Infra Status"
	@echo "══════════════════════════════════"
	@echo ""
	@echo "── Runtime ──"
	@go version 2>/dev/null || echo "Go: not installed"
	@node --version 2>/dev/null || echo "Node: not installed"
	@docker --version 2>/dev/null || echo "Docker: not installed"
	@echo ""
	@echo "── IaC ──"
	@terraform version -json 2>/dev/null | head -1 || echo "Terraform: not installed"
	@helm version --short 2>/dev/null || echo "Helm: not installed"
	@kubectl version --client --short 2>/dev/null || echo "kubectl: not installed"
	@echo ""
	@echo "── Containers ──"
	@docker compose ps 2>/dev/null || echo "No containers running"

# ── Terraform ─────────────────────────────────────────────────

tf-init: ## Initialize Terraform
	cd infra/terraform && terraform init

tf-plan-staging: ## Plan staging infrastructure
	cd infra/terraform && terraform plan -var-file=environments/staging.tfvars

tf-plan-prod: ## Plan production infrastructure
	cd infra/terraform && terraform plan -var-file=environments/production.tfvars

tf-apply-staging: ## Apply staging infrastructure
	cd infra/terraform && terraform apply -var-file=environments/staging.tfvars

tf-apply-prod: ## Apply production infrastructure (requires approval)
	cd infra/terraform && terraform apply -var-file=environments/production.tfvars

# ── Observability ─────────────────────────────────────────────

obs-up: ## Start observability stack (OTel, Jaeger, Prometheus, Grafana, Loki)
	docker compose -f docker-compose.observability.yml up -d
	@echo "Jaeger:     http://localhost:16686"
	@echo "Prometheus: http://localhost:9090"
	@echo "Grafana:    http://localhost:3001 (admin/vct_grafana_secret)"
	@echo "Loki:       http://localhost:3100"

obs-down: ## Stop observability stack
	docker compose -f docker-compose.observability.yml down

# ── Load Testing & Benchmarks ─────────────────────────────────

k6-smoke: ## Run k6 smoke test (quick sanity check)
	k6 run tests/load/smoke.js

k6-load: ## Run k6 load test (sustained traffic)
	k6 run tests/load/load.js

k6-stress: ## Run k6 stress test (find breaking point)
	k6 run tests/load/stress.js

k6-ws: ## Run k6 WebSocket test
	k6 run tests/load/websocket.js

go-bench: ## Run Go benchmarks
	cd backend && go test -bench=. -benchmem -count=3 ./tests/benchmark/...

# ── Security ──────────────────────────────────────────────────

rotate-secrets: ## Rotate all secrets (GCP Secret Manager)
	bash infra/scripts/rotate-secrets.sh

rotate-secrets-dry: ## Dry-run secret rotation
	bash infra/scripts/rotate-secrets.sh --dry-run

security-scan: ## Run Go vulnerability + static checks
	cd backend && govulncheck ./... && staticcheck ./...

# ── Disaster Recovery ─────────────────────────────────────────

dr-drill: ## Run DR drill on staging
	bash infra/scripts/dr-drill.sh --target staging

dr-drill-production: ## Run DR drill on production (read-only verify)
	bash infra/scripts/dr-drill.sh --target production

# ── Canary / Rollouts ─────────────────────────────────────────

canary-status: ## Check Argo Rollout canary status
	kubectl argo rollouts get rollout vct-api-canary -n vct-production

canary-promote: ## Promote canary to next step
	kubectl argo rollouts promote vct-api-canary -n vct-production

canary-abort: ## Abort canary and rollback
	kubectl argo rollouts abort vct-api-canary -n vct-production

test-flags: ## Run feature flag unit tests
	cd backend && go test -v ./internal/featureflag/...


# ── Mobile (Expo) ─────────────────────────────────────────────

mobile-dev: ## Start Expo dev server
	cd apps/expo && npx expo start --clear

mobile-ios: ## Run on iOS simulator
	cd apps/expo && npx expo run:ios

mobile-android: ## Run on Android emulator
	cd apps/expo && npx expo run:android

mobile-build-dev: ## EAS development build (with devtools)
	cd apps/expo && eas build --profile development --platform all --non-interactive

mobile-build-preview: ## EAS preview build (internal testing)
	cd apps/expo && eas build --profile preview --platform all --non-interactive

mobile-build-prod: ## EAS production build (store submission)
	cd apps/expo && eas build --profile production --platform all --non-interactive

mobile-ota: ## Push OTA update (usage: make mobile-ota BRANCH=preview MSG="fix scoring")
	cd apps/expo && eas update --branch $(BRANCH) --message "$(MSG)" --non-interactive

mobile-test: ## Run mobile unit tests
	npx jest --testPathPattern="mobile.*test" --passWithNoTests

mobile-typecheck: ## TypeScript check for Expo app
	cd apps/expo && npx tsc --noEmit

mobile-clean: ## Clear Metro cache and build artifacts
	cd apps/expo && npx expo start --clear --no-dev
	@echo "Metro cache cleared"

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
