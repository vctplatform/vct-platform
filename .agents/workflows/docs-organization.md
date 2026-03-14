---
description: How to organize documentation files (.md) in the project
---

# Documentation Organization Convention

All `.md` documentation files created by the AI agent MUST be placed inside the `docs/` directory at the project root (`d:\VCT PLATFORM\vct-platform\docs\`).

## Directory Structure

```
docs/
├── api/                  # API documentation
├── architecture/         # Architecture & system design docs
├── audit/                # Audit reports, code review results
├── business-analysis/    # Business analysis, evaluations, audits
├── deployment/           # Deployment guides & configs
├── guides/               # How-to guides, tutorials, onboarding
├── infrastructure/       # CI/CD, DevOps, cloud infra docs
├── plans/                # Implementation plans, roadmaps
├── prompts/              # AI prompts and templates
├── regulations/          # Rules, regulations, compliance docs
├── reports/              # Analysis reports, critique reports, status reports
├── skills/               # AI agent skill definitions
├── tasks/                # Task tracking, checklists
├── walkthroughs/         # Feature walkthroughs, proof-of-work docs
└── *.html                # Pitch decks, presentations
```

## Rules

// turbo-all

1. **Never** place `.md` files at the project root or in random directories.
2. **Always** choose the appropriate subdirectory under `docs/` based on the content type.
3. If no existing subdirectory fits, create a new descriptive subdirectory under `docs/`.
4. Use kebab-case for file and directory names (e.g., `tournament-workflow.md`).
5. Backend-specific docs go in `backend/docs/`.

## AI Artifacts Rule

> [!IMPORTANT]
> **All AI-generated artifacts** (implementation plans, walkthroughs, task lists, analysis reports, critiques, etc.) related to vct-platform **MUST be saved directly in `docs/`** — NOT in the Antigravity brain directory (`~/.gemini/antigravity/brain/`).

When creating artifacts during a conversation:
- **Implementation plans** → `docs/plans/<descriptive-name>.md`
- **Walkthroughs** → `docs/walkthroughs/<descriptive-name>.md`
- **Task checklists** → `docs/tasks/<descriptive-name>.md`
- **Audit/critique reports** → `docs/reports/<descriptive-name>.md`
- **Architecture decisions** → `docs/architecture/<descriptive-name>.md`
- **Business analysis** → `docs/business-analysis/<descriptive-name>.md`

This ensures all project knowledge stays **inside the repository** and is accessible to all team members, not locked in AI agent local storage.

## When Creating New Documentation

1. Determine the content category (API, architecture, business, guide, infrastructure, etc.)
2. Place the file in the matching `docs/<category>/` subdirectory.
3. If the category doesn't exist yet, create it with a clear, descriptive name.
4. Use a descriptive filename: `docs/<category>/<descriptive-name>.md`

## Examples

| Content Type | Location |
|---|---|
| Business analysis report | `docs/business-analysis/admin-processes.md` |
| API endpoint docs | `docs/api/tournament-endpoints.md` |
| Deployment guide | `docs/deployment/fly-io-deployment.md` |
| System architecture | `docs/architecture/rbac-design.md` |
| Feature walkthrough | `docs/walkthroughs/tournament-setup.md` |
| Regulation rules | `docs/regulations/vo-co-truyen-rules.md` |
| AI critique/analysis | `docs/reports/mobile-athlete-critique.md` |
| Implementation plan | `docs/plans/realtime-scoring-plan.md` |
| Task checklist | `docs/tasks/sprint-3-tasks.md` |
| Audit report | `docs/audit/security-audit-2026.md` |
