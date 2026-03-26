---
name: vct-ui-ux
description: VCT Platform UI/UX design reference — delegates to docs/architecture/ui-architecture.md for design tokens, component catalog, theming, accessibility, animation, and visual quality standards.
---

# VCT Platform UI/UX Design System

> **When to activate**: Tasks involving UI design, styling, component creation, theming, layout, visual polish, or accessibility review.
>
> **📖 Primary Reference**: [`docs/architecture/ui-architecture.md`](file:///d:/VCT%20PLATFORM/vct-platform/docs/architecture/ui-architecture.md) — Design System & Visual Standards

---

## Scope

This skill covers **HOW THINGS LOOK** — the Design System:

| Topic | Document Section |
|-------|-----------------|
| Design Philosophy & Personas | §1–§2 |
| CSS Design Tokens | **§3** |
| Theme System (Dark/Light) | **§4** |
| Color System & Status Badges | **§5** |
| Typography & Font Scale | **§6** |
| Spacing, Radius, Z-Index | **§7** |
| Shadows & Effects | **§8** |
| Icon System (VCT_Icons) | **§9** |
| Component Library (59 VCT_*) | **§10** |
| Animation & Motion | **§11** |
| Responsive Breakpoints | **§12** |
| Accessibility (WCAG 2.1 AA) | **§13** |
| Overlays Decision Guide | **§14** |
| CSS Architecture | **§15–§16** |
| Visual Anti-Patterns | **§A** |
| Pre-Delivery Visual Checklist | **§B** |

## NOT in scope

Monorepo, routing, state, API, i18n, testing → see `vct-frontend` SKILL / `docs/architecture/frontend-architecture.md`

---

## Critical Rules (Quick Access)

| # | Rule |
|---|------|
| 1 | ❌ NEVER hardcode colors → `var(--vct-*)` tokens |
| 2 | ❌ NEVER `dark:` modifier → CSS vars auto-switch |
| 3 | ❌ NEVER `lucide-react` direct → `VCT_Icons` |
| 4 | ❌ NEVER without `VCT_` prefix |
| 5 | ❌ NEVER ship "basic/simple" UI |
| 6 | ✅ ALWAYS test both Light + Dark |
| 7 | ✅ ALWAYS responsive 375/768/1024/1440 |
| 8 | ✅ ALWAYS keyboard navigable + ARIA |
