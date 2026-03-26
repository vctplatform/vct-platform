# VCT Platform DevOps & SRE Architecture

This document defines the strictly enforced rules for DevOps, Site Reliability Engineering (SRE), and Infrastructure for the VCT Platform. All servers, automations, and deployments MUST strictly adhere to this document.

## 1. Core Philosophy: The 12-Factor App
We strictly enforce the "12-Factor App" methodology for cloud-native applications.
- **Stateless Compute**: Every Go and Node.js process MUST be completely stateless. A server can be randomly destroyed at any time without losing data.
- **No Local State**: Uploads, logs, or sessions MUST NEVER be stored on the local filesystem. Use MinIO/S3 for files, Redis for sessions, and Datadog/Sentry for logs.
- **Port Binding**: Apps must be completely self-contained. The Go backend must spin up its own HTTP server on its designated `PORT`.

## 2. Infrastructure as Code (IaC)
Manual "click-ops" in cloud provider dashboards (AWS, Render, Vercel) are **BANNED**.
- All infrastructure MUST be codified and version-controlled.
- Acceptable formats: `render.yaml`, `vercel.json`, `docker-compose.yml`, or Terraform `.tf` files.
- If a server crashes, deploying a new one must require exactly zero manual configuration.

## 3. Strict Secrets Management
- **The `.env` Ban**: Committing `.env` files containing actual passwords, API keys, or JWT secrets to Git is a critical security violation.
- **KMS Injection**: All operational secrets MUST be stored securely in a Key Management System (e.g., Doppler, AWS Secrets Manager, Vercel Environment UI, Render Env Groups) and injected into the container's RAM exclusively at runtime.

## 4. CI/CD Pipeline Gates
Code MUST NEVER reach production without mathematically proven validation.
- **Continuous Integration (CI)**: `main` branch is protected. No PR can be merged unless:
  1. `npm run lint:arch` passes (proving no UI boundary violations).
  2. `go test -race ./...` passes (proving no backend logic/goroutine breaks).
- **Continuous Deployment (CD)**: 
  - `main` branch pushes automatically deploy to **Staging** for UAT.
  - **Production** deployments are gated by explicit Git Tags (e.g., `git tag v1.0.0`) triggered by the Release Manager.

## 5. Zero-Downtime Deployments
Updating the application MUST NOT drop a single user request.
- **Rolling Updates / Blue-Green**: The infrastructure MUST boot the new version completely, wait for the `/healthz` probe to return `200 OK`, explicitly shift load-balancer traffic to the new version, and finally send `SIGTERM` to gracefully drain connections from the old version over a 30-second window.
- **Distroless Docker Images**: Final production Docker images MUST use Alpine or Distroless. They must contain exactly the compiled binary and zero build tools to minimize the vulnerability attack surface.

## 6. Observability & SRE Alerting
- **Centralized Telemetry**: All services must output structured JSON logs (via `slog` for Go, `pino` for Next.js) pushing to a centralized aggregator.
- **Actionable Alerts Only**: PagerDuty / Slack alerts are strictly reserved for critical P1 anomalies:
  - Database Unavailable.
  - HTTP 5xx Error Spike > 1%.
  - Payment Webhook Failures.
- **No Alert Fatigue**: CPU warnings or minor 404s MUST be routed to silent dashboards, never pinging the on-call engineer in the middle of the night.

## 7. Disaster Recovery (DR) Strategy
- **RTO (Recovery Time Objective)**: The platform must be capable of spinning up from scratch in a completely new AWS/Cloud region within **15 minutes** of a complete Data Center outage using the IaC manifests.
- **RPO (Recovery Point Objective)**: Database snapshots MUST guarantee data loss in the event of hardware failure is no greater than **24 hours** (Daily automated backups pushed to physically isolated off-site cold storage).

---

## 8. Ultra-SRE Peak Resilience (Đỉnh Cao Bất Tử)
To elevate the VCT Platform from "Enterprise" to "Unicorn-Tier" stability, the following 4 absolute SRE laws are enforced:

### 8.1 Pets vs Cattle (Gia Súc, Không Đi Sửa Chữa)
- **Rule**: Manual SSH access to production servers to run "hot-patches" or manual `npm install` is **BANNED**. 
- **Solution**: Servers are ephemeral "cattle". If a Node/Container misbehaves or memory leaks, the orchestrator (Kubernetes/Cloud) MUST instantly kill (Terminate) the instance and spin up a fresh pristine image.

### 8.2 Chaos Engineering (Kỹ Thuật Hỗn Mang)
- **Rule**: Auto-healing mechanisms MUST be proven, not assumed.
- **Solution**: The Staging environment must undergo periodic "Chaos Monkey" tests where processes (Go API, Redis) are intentionally killed to verify that health checks `/healthz` instantly re-route traffic and deploy new containers without dropping simulated user flows.

### 8.3 Graceful Degradation (Trang Chờ Tĩnh Cuối Điểm)
- **Rule**: Users MUST NEVER see generic HTTP `502 Bad Gateway` or `503 Service Unavailable` raw text pages.
- **Solution**: The Edge/CDN layer (Vercel/Cloudflare) must catch `5xx` errors from the Origin Backend and instantly serve a beautifully designed, branded "Under Maintenance / Đang Bảo Trì" static HTML page.

### 8.4 WAF & Edge Rate Limiting (Phòng Thủ Vành Đai Layer 7)
- **Rule**: Business Logic Servers (Go) MUST NOT waste CPU cycles processing DDoS volumetric attacks, Spam, or Credential Stuffing bots.
- **Solution**: A Web Application Firewall (WAF) MUST sit at the extreme edge (e.g., Cloudflare, Vercel Edge). Strict Rate Limits (e.g., `Max 100 req/min/IP`) must instantly HTTP `429 Too Many Requests` malicious traffic before it ever touches the Go backend.
