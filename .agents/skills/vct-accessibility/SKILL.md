---
name: vct-accessibility
description: Web accessibility (WCAG 2.1 AA) compliance for VCT Platform — ARIA patterns, keyboard navigation, screen reader support, color contrast, focus management, and automated testing with axe-core.
---

# VCT Platform Accessibility (a11y)

> **When to activate**: Creating new UI components, reviewing pages for WCAG compliance, fixing accessibility issues, or adding screen reader support.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. WCAG 2.1 AA Requirements

| Principle | Requirement | VCT Implementation |
|-----------|-------------|---------------------|
| **Perceivable** | Text alternatives | `alt` on images, `aria-label` on icons |
| **Perceivable** | Color contrast | 4.5:1 text, 3:1 large/UI (use VCT tokens) |
| **Operable** | Keyboard access | All actions via Tab/Enter/Escape |
| **Operable** | Focus visible | `:focus-visible` ring on interactive elements |
| **Understandable** | Labels | Form inputs MUST have labels (not just placeholder) |
| **Robust** | Valid ARIA | Correct `role`, `aria-*` attributes |

---

## 2. Component ARIA Patterns

### VCT_Modal / VCT_Dialog
```tsx
<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <h2 id="modal-title">{title}</h2>
  {/* Focus trap: Tab cycles within modal */}
  {/* Escape key closes modal */}
  {/* Return focus to trigger element on close */}
</div>
```

### VCT_Tabs
```tsx
<div role="tablist" aria-label={label}>
  <button role="tab" aria-selected={active} aria-controls={panelId} tabIndex={active ? 0 : -1}>
    {tabLabel}
  </button>
</div>
<div role="tabpanel" id={panelId} aria-labelledby={tabId} tabIndex={0}>
  {content}
</div>
```

### VCT_DataGrid / VCT_ResponsiveTable
```tsx
<table role="grid" aria-label={t('table.athletes')}>
  <thead>
    <tr>
      <th scope="col" aria-sort={sortDir}>{header}</th>
    </tr>
  </thead>
  <tbody>
    <tr aria-rowindex={index}>
      <td>{data}</td>
    </tr>
  </tbody>
</table>
```

### VCT_Sidebar Navigation
```tsx
<nav aria-label={t('nav.main')}>
  <ul role="menubar">
    <li role="none">
      <a role="menuitem" aria-current={isActive ? "page" : undefined}>
        {link}
      </a>
    </li>
  </ul>
</nav>
```

### Status Badges
```tsx
<VCT_Badge aria-label={`Trạng thái: ${statusLabel}`}>
  {statusLabel}
</VCT_Badge>
```

---

## 3. Keyboard Navigation

| Component | Keys | Action |
|-----------|------|--------|
| All interactive | `Tab` | Move focus forward |
| All interactive | `Shift+Tab` | Move focus backward |
| Buttons, Links | `Enter` | Activate |
| Modal | `Escape` | Close |
| Tabs | `Arrow Left/Right` | Switch tab |
| Dropdown | `Arrow Up/Down` | Navigate items |
| Dropdown | `Escape` | Close dropdown |
| DataGrid | `Arrow keys` | Navigate cells |
| Search | `Ctrl+K` | Open command palette |

### Skip Navigation Link
```tsx
// First element in AppShell
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-4 focus:bg-vct-accent focus:text-white">
  {t('a11y.skip_to_content')}
</a>

// Main content area
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

---

## 4. Color Contrast

### Using VCT Design Tokens Safely
| Token Pair | Contrast | Passes |
|-----------|----------|--------|
| `--vct-text` on `--vct-bg` | ~15:1 | ✅ AAA |
| `--vct-text-secondary` on `--vct-bg` | ~7:1 | ✅ AA |
| `--vct-text-muted` on `--vct-bg` | ~4.5:1 | ✅ AA |
| `--vct-accent` on `--vct-bg` (dark) | ~5:1 | ✅ AA |

### Rules
- Never use color alone to convey information (add icons/text)
- Status badges: include icon + text, not just color
- Error states: red border + error icon + error text
- Links: underline or distinct style, not just color change

---

## 5. Screen Reader Considerations

```tsx
// Announce dynamic content changes
<div role="status" aria-live="polite">
  {loadingMessage && <span>{t('loading...')}</span>}
</div>

// Announce form errors
<div role="alert" aria-live="assertive">
  {error && <span>{error}</span>}
</div>

// Hide decorative elements
<VCT_Icons.ChevronRight aria-hidden="true" />

// Visible labels over aria-label when possible
<label htmlFor="athlete-name">{t('athlete.name')}</label>
<VCT_Input id="athlete-name" />
```

---

## 6. Focus Management

```tsx
// After navigation: focus main heading
useEffect(() => {
  document.getElementById('page-heading')?.focus()
}, [pathname])

// After modal close: return focus to trigger
const triggerRef = useRef<HTMLButtonElement>(null)
const handleClose = () => {
  setOpen(false)
  triggerRef.current?.focus()
}

// After form submit error: focus first error field
const firstErrorField = Object.keys(errors)[0]
document.getElementById(firstErrorField)?.focus()
```

---

## 7. Testing Checklist

```
□ Automated: axe-core / @axe-core/playwright on every page
□ Keyboard: Navigate entire flow with keyboard only (Tab, Enter, Escape)
□ Screen reader: Test with NVDA (Windows) or VoiceOver (Mac)
□ Zoom: Content readable at 200% zoom
□ Motion: Respect prefers-reduced-motion (disable animations)
□ High contrast: Test with forced-colors media query
□ Touch: All targets ≥ 44×44px on mobile
```

---

## 8. Anti-Patterns

1. ❌ **NEVER** use `div` or `span` as buttons — use `<button>` or `<a>`
2. ❌ **NEVER** remove focus outlines — customize them with `focus-visible`
3. ❌ **NEVER** use `tabindex > 0` — only `0` or `-1`
4. ❌ **NEVER** rely on color alone — combine with text/icon
5. ❌ **NEVER** skip `aria-label` on icon-only buttons
6. ❌ **NEVER** use `aria-hidden="true"` on interactive elements
7. ❌ **NEVER** auto-play audio/video without user control
