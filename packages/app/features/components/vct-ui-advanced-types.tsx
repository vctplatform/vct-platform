'use client'

// ════════════════════════════════════════
// BARREL EXPORT: Advanced Components (Phase 2)
// ════════════════════════════════════════
// Re-exports all advanced components with their full type definitions.

export {
  // Hooks
  usePrefersReducedMotion,

  // Components
  VCT_Tooltip,
  VCT_Drawer,
  VCT_Pagination,
  VCT_Combobox,
  VCT_DatePicker,
  VCT_TimePicker,
  VCT_Checkbox,
  VCT_RadioGroup,
  VCT_FileUpload,
  VCT_Alert,
} from './vct-ui-advanced'

// Types
export type {
  VCTTooltipProps,
  VCTDrawerProps,
  VCTPaginationProps,
  ComboboxOption,
  VCTComboboxProps,
  VCTDatePickerProps,
  VCTTimePickerProps,
  VCTCheckboxProps,
  RadioOption,
  VCTRadioGroupProps,
  VCTFileUploadProps,
  VCTAlertProps,
} from './vct-ui-advanced'
