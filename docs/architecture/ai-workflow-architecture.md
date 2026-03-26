# 18. AI Agent & Workflow Architecture

**Core Principle**: "AI is a team of specialists, not a solo magician. Workflows must be explicitly orchestrated, transparently planned, meticulously validated, and rigorously constrained by Human-in-the-Loop interventions for destructive operations."

---

## 1. The Meta-Orchestrator Pattern

The VCT Platform is maintained by an ecosystem of 20+ specialized AI Agents. To prevent chaotic or overlapping changes, we enforce **The Meta-Orchestrator Pattern**:

### 1.1 Strict Command Hierarchy
- **No Rogue Agents:** Specialist agents (e.g., `vct-frontend`, `vct-dba`, `vct-backend-go`) **MUST NOT** operate in isolation when tackling complex, multi-module feature requests. 
- **The Orchestrator First:** All significant feature requests, architecture changes, and bug triage must begin with the `vct-orchestrator` agent. The Orchestrator analyzes the prompt, determines the execution sequence, and delegates tasks sequentially.

### 1.2 Sequence of Operations (The Flow)
1. **Analyze (BA/PO):** Understand business requirements and translate them into domain models.
2. **Architect (SA):** Produce the database schema and API contract.
3. **Data Layer (DBA):** Write and validate migrations (`up.sql` / `down.sql`).
4. **Backend (Go):** Implement the API endpoints using Clean Architecture.
5. **Frontend (Next.js/React Native):** Connect the API to the UI using predefined `@vct/ui` components.
6. **Verify (QA):** Run automated tests and write the walkthrough.

---

## 2. Artifact & Workflow Lifecycle

### 2.1 Implementation Plans are Mandatory
Any complex workflow initiated by a slash command (e.g., `/add-module`, `/new-feature`, `/refactor`) **MUST** begin by generating an `implementation_plan.md` artifact.
- **Rule:** AI Agents are explicitly **BANNED** from immediately modifying source code or terminal commands for complex tasks.
- **Plan Format:** The plan must explicitly state what files will be modified, what new code will look like, and what tests will be written.

### 2.2 Strict Approval Gate
- **Rule:** The AI **MUST** halt execution and await user confirmation (`LGTM` or explicitly approved) before executing the Implementation Plan.
- **No Code-Golfing:** The AI must not autonomously guess the user's intent through trial-and-error code execution.

### 2.3 The Walkthrough Requirement
- Upon completing an Execution phase, the AI **MUST** summarize the specific Git diffs, operations performed, and verification steps in a `walkthrough.md` artifact. This provides a clear audit trail of the AI's actions.

---

## 3. Human-In-The-Loop (HITL) Triggers

While AI agents are encouraged to operate autonomously for routine or boilerplate activities, **Destructive or Critical Operations** require a hard halt and explicit human confirmation.

### 3.1 Mandatory Pause Points
AI Agents will **PAUSE and REQUEST `--force` or explicit approval** before executing any of the following:

1. **Database Migrations:** Any `up.sql` that contains `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN TYPE` operations that could lead to data loss.
2. **Production Deployments:** Any command that pushes code directly to production branches (e.g., `main`), executes production build scripts, or initiates Vercel/Render production deployments.
3. **Financial Ledgers:** Any modification to foundational finance code (`hooks/finance`, `internal/domain/invoices`, or billing webhooks). Financial arithmetic is zero-trust.
4. **Security Overrides:** Altering RLS (Row Level Security) policies to bypass tenant isolation, or modifying Argon2id hashing algorithms.

---

## 4. Skill Evolution Integrity (`vct-skill-evolver`)

The VCT Platform employs a `vct-skill-evolver` agent responsible for scanning the industry and upgrading other agents' skills. However, this evolution is strictly bounded.

### 4.1 Immutability of the 18 Pillars
- **The DNA of the Platform:** The 18 `.md` files residing in `docs/architecture/` represent the unchangeable core rules of the VCT Platform.
- **Rule:** The `vct-skill-evolver` agent is **ABSOLUTELY FORBIDDEN** from deleting, rewriting, or removing dependencies on these 18 architectural pillars, regardless of new industry trends (unless explicitly commanded by the CTO).
- **Compliance Linkage:** Whenever the Evolver upgrades a skill file (`SKILL.md`), it must ensure that the skill retains explicit references and compliance mandates to its corresponding `.md` pillar document in `docs/architecture/`.
