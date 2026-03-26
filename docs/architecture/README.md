# VCT Platform Architecture Hub

This directory is the central source of truth for all architectural decisions, engineering standards, and design guidelines for the VCT Platform. 

## Documentation Structure

### 1. [Frontend Engineering Architecture](./frontend-architecture.md)
*Formerly `FRONTEND_RULES.md`*
- **Scope**: "How things are built" on the client side.
- **Topics**: Monorepo boundaries (`apps/*` vs `packages/*`), Next.js App Router rules, state management (Zustand), API integration hooks, forms, internationalization, and testing strategy.
- **Target Audience**: Frontend Engineers, Full-stack Developers.

### 2. [UI Design System Architecture](./ui-architecture.md)
*Formerly `ui-architecture-rules.md`*
- **Scope**: "How things look" and behave visually.
- **Topics**: CSS variables/tokens (`globals.css`), component catalog (`@vct/ui`), dark/light mode, accessibility (WCAG 2.1 AA), typography, animations, and CSS utilities.
- **Target Audience**: UI/UX Designers, Frontend Engineers.

### 3. [Backend Engineering Architecture](./backend-architecture.md)
*Formerly Guard Rails + DB Scripts*
- **Scope**: "How things are processed" on the server side (Go 1.26).
- **Topics**: Clean Architecture (Domain->Adapter), Standard HTTP patterns, Auth, Postgres/Raw SQL integration, Dual Storage Pattern, Context Propagation, and Graceful Shutdown.
- **Target Audience**: Backend Engineers, Platform Architects.

### 4. [Database Architecture](./database-architecture.md)
- **Scope**: "How data is structured and stored" at scale (Postgres 15+).
- **Topics**: Multi-Tenancy Isolation, Zero-Downtime Migrations, Pooling ports (5432 vs 6543), Keyset Pagination, Soft Deletion, and PII Masking.
- **Target Audience**: Database Administrators, Backend Engineers.

### 5. [DevOps & SRE Architecture](./devops-architecture.md)
- **Scope**: "How code runs in reality" (Servers, Databases, CI/CD).
- **Topics**: 12-Factor App, Infrastructure as Code, CI/CD Gates, Zero-Downtime Deployments, SRE Alerting, and Disaster Recovery.
- **Target Audience**: DevOps Engineers, Release Managers, SRE/Incident Managers.

### 6. [Full-Stack Architecture Guard Rails](./architecture-guard-rails.md)
- **Scope**: High-level, absolute rules for the entire project.
- **Topics**: Strict domain separation, CQRS concepts, database interaction limits, security boundaries.
- **Target Audience**: Tech Leads, Solution Architects, All Developers.

### 7. [QA & Testing Architecture](./qa-testing-architecture.md)
- **Scope**: "How code quality is enforced" (Go Backend, React Frontend, Mobile, E2E).
- **Topics**: Testing Pyramid (70/20/10), Go Table-Driven Tests, Mocking Interfaces, Playwright/Maestro Automation, Unbreakable Locators, Code Coverage Gates (80%), and Zero Flakes Policy.
- **Target Audience**: QA Engineers, Tech Leads, Automations Engineers, SDETs.

### 8. [Security & Compliance Architecture](./security-architecture.md)
- **Scope**: "How the platform is protected" (Zero Trust, Data Privacy, OWASP Prevention).
- **Topics**: JWT Sliding Sessions, Argon2id, CSP/CORS, Preventing SQLi/IDOR, PII Masking, Secret Management (No `.env`), and CI Supply Chain Scanning.
- **Target Audience**: Security Engineers, Backend Engineers, DevOps, Platform Architects.

### 9. [Mobile App Architecture](./mobile-architecture.md)
- **Scope**: "How the Expo/React Native app is built and delivered".
- **Topics**: Expo Router, Offline-First (Local Sync Queues), FAANG-Level list performance (FlashList), expo-image caching, Reanimated UI thread usage, and EAS (OTA) Build Automation.
- **Target Audience**: Mobile App Leads, Mobile QA, React Native Devs.

### 10. [Business Analytics & Telemetry Architecture](./analytics-architecture.md)
- **Scope**: "How data is tracked, visualized, and calculated for business success".
- **Topics**: Zero-DB Telemetry (PostHog), OLAP vs OLTP separation, Materialized Views, Domain vs Analytics Events, Ranking Algorithms (ELO/Glicko), and Funnel tracking.
- **Target Audience**: Data Analysts, Business Analysts, Product Owners, Data Engineers.

### 11. [Legal & Compliance Architecture](./legal-architecture.md)
- **Scope**: "How the platform complies with laws, manages financial/tax integrity, and protects user rights".
- **Topics**: Explicit Consent Auditing, Minors & Parental Guardianship (COPPA), GDPR/PDPA Right to be Forgotten (Anonymization), Immutable Federal Documents, and Accounting strictness.
- **Target Audience**: Tech Leads, Business Analysts, Solution Architects, Domain Experts.

### 12. [Finance & Billing Architecture](./finance-architecture.md)
- **Scope**: "How the platform handles payments, ledgers, and subscriptions with absolute precision."
- **Topics**: Strict integer arithmetic (No Floats), Idempotency enforcement, Zero-Trust webhooks, and Append-Only immutable ledgers.
- **Target Audience**: CTO, Solution Architects, Business Analysts.

### 13. [Dashboard & Portal Architecture](./dashboard-architecture.md)
- **Scope**: "How complex, data-heavy B2B administrative interfaces are built."
- **Topics**: URL-Driven State (Deep Linking), Severe pagination rules, Role-Based Access Control UI patterns, and Asynchronous Skeleton screens.
- **Target Audience**: Frontend Engineers, Design Leads, Tech Leads.

### 14. [File Storage & Media Architecture](./file-storage-architecture.md)
- **Scope**: "How binary assets, images, and documents are securely processed and stored."
- **Topics**: Presigned URLs, Zero-binary backend rules, MinIO/S3 Bucket Strategies, Edge Compression, and Public vs Private access control.
- **Target Audience**: Backend Engineers, Tech Leads, Application Developers.

### 15. [Event-Driven & Async Architecture](./async-architecture.md)
- **Scope**: "How heavy background operations are decoupled from HTTP request loops."
- **Topics**: The 2-Second HTTP Ban, NATS Pub/Sub, Worker Queue Idempotency, and Dead Letter Queues (DLQ) protection.
- **Target Audience**: Backend Engineers, DevOps, Solution Architects.

### 16. [Search & Indexing Architecture](./search-architecture.md)
- **Scope**: "How advanced full-text search and filtering are separated from primary OLTP databases."
- **Topics**: Banning Wildcard ILIKE scans, Meilisearch CDC Syncing, Search Rate Limiting, and Vietnamese Typo Tolerance.
- **Target Audience**: Backend Engineers, Data Analysts, Solution Architects.

### 17. [Time, i18n & Localization Architecture](./i18n-time-architecture.md)
- **Scope**: "How the platform manages multiple timezones, languages, and regional formatting constraints."
- **Topics**: The Absolute UTC-0 PostgreSQL Rule, Client-size ISO-8601 formatting, i18n dictionaries, and Currency formatters.
- **Target Audience**: Frontend Engineers, Mobile Engineers, Backend Engineers, i18n Managers.

### 18. [AI Agent & Workflow Architecture](./ai-workflow-architecture.md)
- **Scope**: "How the suite of 20+ specialized AI Agents interact, plan, and operate."
- **Topics**: The Meta-Orchestrator Pattern, Mandatory Implementation Plans, Human-In-The-Loop Triggers, and Skill Evolver Constraints.
- **Target Audience**: All AI Agents, Tech Leads, Application Developers.

### 19. [Reporting & Export Architecture](./report-architecture.md)
- **Scope**: "How large datasets (Excel/CSV) and visual templates (PDF) are generated and delivered."
- **Topics**: The 500-Row Async Limit, Streaming vs. Buffering, Headless HTML-to-PDF, and Export Watermarking.
- **Target Audience**: Data Analysts, Backend Engineers, Solution Architects.

## Enforcement
These documents are not just guidelines; they are **enforced rules**.
- Monorepo package boundaries are enforced via `eslint-plugin-boundaries` (`npm run lint:arch`).
- AI coding agents are strictly instructed to read these files before making any codebase changes via their dedicated skills (`vct-frontend`, `vct-ui-ux`, etc.).
