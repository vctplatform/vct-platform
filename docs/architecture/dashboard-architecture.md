# VCT Platform Dashboard & Portal Architecture

This document establishes the unbreakable rules for building B2B Administrative Portals, Club Dashboards, and Referee Interfaces within the VCT Platform. 
While `frontend-architecture.md` governs the framework (Next.js) and `ui-architecture.md` governs individual components, this document dictates **how complex data-heavy interfaces are composed**.

## 1. URL-Driven State (The Deep-Link Rule)
- **Mandatory Linkability**: All vital dashboard states MUST be synchronized with the URL Search Params (`useSearchParams()`). This includes:
  - Active tabs (`?tab=settings`)
  - Search queries (`?q=Nguyen+Van+A`)
  - Pagination (`?page=2`)
  - Filters (`?status=active&province=HN`)
- **Ban on Opaque Local State**: You are FORBIDDEN from using `useState` for filter/pagination state. An administrator must be able to copy the URL, paste it in Slack, and have their colleague see the exact same filtered table view.

## 2. Standardized Data Grids & Pagination
- **Server-Side Bias**: Administrative tables containing potentially unlimited rows (e.g., Athletes, Matches, Clubs) MUST use server-side pagination, sorting, and filtering. Client-side filtering is ONLY permitted for small, fixed-size dictionaries (e.g., Province List, Belt Colors).
- **Infinite Scroll vs. Pagination**: Infinite scroll is structurally banned for B2B Dashboards. All data grids MUST use strict numeric pagination to allow accurate cross-referencing and auditing.

## 3. Role-Based Access Control (RBAC) in the UI
- **Zero-Trust UI**: The UI must adapt to permissions by hiding actionable buttons (e.g., `Create`, `Delete`) based on the JWT claims/context. However, the UI is explicitly treated as insecure. Missing buttons are a UX feature, not a security mechanism.
- **Graceful Degradation**: If a user navigates directly to a URL they lack permissions for, the system MUST render the standardized `VCT_UnauthorizedState` component. It must not crash the layout or render a blank screen.

## 4. Asynchronous Loading & Skeleton Screens
- **Ban on Global Spinners**: Banned the use of full-page blocking spinners (`<div>Loading...</div>`) during minor data fetches.
- **Skeleton Standardization**: Every dashboard widget and data table MUST implement a matching `Skeleton` variant. When data is fetching or paginating, show skeletons ONLY within the specific widget rather than blocking the entire screen.

## 5. Data Visualization Consistency
- **Design System Integration**: All charts (Bar, Line, Pie) MUST consume official VCT CSS variables (e.g., `var(--vct-color-primary)`) to ensure automatic, seamless switching between Light and Dark mode themes.
- **Accessibility (a11y)**: Data visualizations must not rely *solely* on color differences to convey meaning. Tooltips, varied textures/patterns, and clear legends are mandatory for WCAG compliance.
