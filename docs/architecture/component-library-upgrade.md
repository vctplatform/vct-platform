# VCT Component Library Upgrade

## Scope

This upgrade standardizes the project component library around four core modules:

- `vct-ui-layout`
- `vct-ui-form`
- `vct-ui-data-display`
- `vct-ui-overlay`

All modules now provide direct implementations instead of typed wrappers over
`vct-ui.legacy`.

## Design goals

- Preserve existing public API names (`VCT_*`) to avoid page-level breakage.
- Improve type safety for component props.
- Keep accessibility defaults in core interactions:
  - `dialog` semantics for modal
  - `aria-live` for toast
  - `role="switch"` for toggles
  - `progressbar` semantics for progress
- Keep style tokens aligned with global VCT theme variables.

## Package structure

The shared package entrypoint `@vct/ui` now re-exports modules by capability:

- Layout primitives
- Form controls
- Data display blocks
- Overlay/feedback components
- Navigation and feature components

This allows incremental migration toward direct `@vct/ui` imports.

## Compatibility notes

- Existing imports from `app/features/components/vct-ui` remain valid.
- Backward-compatibility aliases are supported for common legacy props:
  - Switch: `checked/onChange` and `isOn/onToggle`
  - Loading overlay: `show` and `open`
  - ScorePad: `onScore` and `onAdd/onSub`

## Next migration steps

1. Move feature pages from `../components/vct-ui` to `@vct/ui`.
2. Deprecate `vct-ui.legacy` exports in phases.
3. Add visual regression tests for `VCT_Table`, `VCT_Modal`, `VCT_Toast`.
4. Add Storybook snapshots for all exported primitives.
