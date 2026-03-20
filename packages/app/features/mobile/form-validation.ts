// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Form Validation
// Vietnamese-aware validation rules, composable validators,
// and React hook for mobile forms.
// ═══════════════════════════════════════════════════════════════

import { useState, useCallback, useRef } from 'react'

// ── Types ────────────────────────────────────────────────────

export type ValidationResult = string | null // null = valid, string = error message

export type Validator<T = string> = (value: T) => ValidationResult

export interface FieldState {
  value: string
  error: string | null
  touched: boolean
  dirty: boolean
}

export interface FormState<T extends Record<string, string>> {
  fields: Record<keyof T, FieldState>
  isValid: boolean
  isDirty: boolean
  errors: Partial<Record<keyof T, string>>
}

// ── Built-in Validators ──────────────────────────────────────

export const validators = {
  /** Field is required. */
  required(message = 'Trường này là bắt buộc'): Validator {
    return (value) => (value.trim().length > 0 ? null : message)
  },

  /** Minimum length. */
  minLength(min: number, message?: string): Validator {
    return (value) =>
      value.length >= min ? null : (message ?? `Tối thiểu ${min} ký tự`)
  },

  /** Maximum length. */
  maxLength(max: number, message?: string): Validator {
    return (value) =>
      value.length <= max ? null : (message ?? `Tối đa ${max} ký tự`)
  },

  /** Valid email format. */
  email(message = 'Email không hợp lệ'): Validator {
    return (value) =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : message
  },

  /** Vietnamese phone number (10 digits starting with 0). */
  phoneVN(message = 'Số điện thoại không hợp lệ'): Validator {
    return (value) => {
      const cleaned = value.replace(/[\s-]/g, '')
      return /^0\d{9}$/.test(cleaned) ? null : message
    }
  },

  /** Vietnamese ID card (CCCD: 12 digits). */
  cccd(message = 'Số CCCD không hợp lệ (12 chữ số)'): Validator {
    return (value) =>
      /^\d{12}$/.test(value.replace(/\s/g, '')) ? null : message
  },

  /** Vietnamese full name (at least 2 words, Vietnamese characters). */
  fullNameVN(message = 'Họ tên phải có ít nhất 2 từ'): Validator {
    return (value) => {
      const words = value.trim().split(/\s+/)
      return words.length >= 2 ? null : message
    }
  },

  /** Date in DD/MM/YYYY format. */
  dateVN(message = 'Ngày không hợp lệ (DD/MM/YYYY)'): Validator {
    return (value) => {
      const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
      if (!match) return message
      const [, d, m, y] = match
      const date = new Date(+y!, +m! - 1, +d!)
      return date.getDate() === +d! && date.getMonth() === +m! - 1
        ? null
        : message
    }
  },

  /** Weight (positive number, max 200kg). */
  weight(message = 'Cân nặng không hợp lệ'): Validator {
    return (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num > 0 && num <= 200 ? null : message
    }
  },

  /** Height (positive number, 50-250cm). */
  height(message = 'Chiều cao không hợp lệ'): Validator {
    return (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num >= 50 && num <= 250 ? null : message
    }
  },

  /** Custom regex pattern. */
  pattern(regex: RegExp, message = 'Giá trị không hợp lệ'): Validator {
    return (value) => (regex.test(value) ? null : message)
  },

  /** Value must match another field. */
  matches(matchValue: string, message = 'Giá trị không khớp'): Validator {
    return (value) => (value === matchValue ? null : message)
  },

  /** Number range. */
  range(min: number, max: number, message?: string): Validator {
    return (value) => {
      const num = parseFloat(value)
      return !isNaN(num) && num >= min && num <= max
        ? null
        : (message ?? `Giá trị phải từ ${min} đến ${max}`)
    }
  },
}

// ── Compose Validators ───────────────────────────────────────

/**
 * Compose multiple validators. Returns first error or null.
 *
 * @example
 * ```ts
 * const emailValidator = compose(
 *   validators.required(),
 *   validators.email(),
 *   validators.maxLength(50),
 * )
 * ```
 */
export function compose(...fns: Validator[]): Validator {
  return (value) => {
    for (const fn of fns) {
      const error = fn(value)
      if (error) return error
    }
    return null
  }
}

// ── React Hook ───────────────────────────────────────────────

/**
 * Form validation hook for mobile forms.
 *
 * @example
 * ```tsx
 * function RegisterForm() {
 *   const form = useFormValidation({
 *     fullName: [validators.required(), validators.fullNameVN()],
 *     phone:    [validators.required(), validators.phoneVN()],
 *     email:    [validators.required(), validators.email()],
 *     weight:   [validators.required(), validators.weight()],
 *   })
 *
 *   return (
 *     <>
 *       <TextInput
 *         value={form.getValue('fullName')}
 *         onChangeText={(v) => form.setValue('fullName', v)}
 *         onBlur={() => form.touch('fullName')}
 *       />
 *       {form.getError('fullName') && (
 *         <Text style={{ color: 'red' }}>{form.getError('fullName')}</Text>
 *       )}
 *
 *       <Button
 *         title="Đăng ký"
 *         disabled={!form.isValid}
 *         onPress={() => {
 *           if (form.validate()) handleSubmit(form.getValues())
 *         }}
 *       />
 *     </>
 *   )
 * }
 * ```
 */
export function useFormValidation<T extends Record<string, string>>(
  rules: Record<keyof T, Validator[]>,
  initialValues?: Partial<T>,
) {
  const fields = Object.keys(rules) as Array<keyof T>

  const [state, setState] = useState<Record<keyof T, FieldState>>(() => {
    const init = {} as Record<keyof T, FieldState>
    for (const field of fields) {
      init[field] = {
        value: (initialValues?.[field] as string) ?? '',
        error: null,
        touched: false,
        dirty: false,
      }
    }
    return init
  })

  const validateField = useCallback(
    (field: keyof T, value: string): string | null => {
      const fieldRules = rules[field]
      if (!fieldRules) return null
      const composed = compose(...fieldRules)
      return composed(value)
    },
    [rules],
  )

  const setValue = useCallback(
    (field: keyof T, value: string) => {
      setState((prev) => ({
        ...prev,
        [field]: {
          ...prev[field],
          value,
          dirty: true,
          error: prev[field].touched ? validateField(field, value) : null,
        },
      }))
    },
    [validateField],
  )

  const touch = useCallback(
    (field: keyof T) => {
      setState((prev) => {
        const error = validateField(field, prev[field].value)
        return {
          ...prev,
          [field]: { ...prev[field], touched: true, error },
        }
      })
    },
    [validateField],
  )

  const validate = useCallback((): boolean => {
    let valid = true
    setState((prev) => {
      const next = { ...prev }
      for (const field of fields) {
        const error = validateField(field, prev[field].value)
        next[field] = { ...prev[field], touched: true, error }
        if (error) valid = false
      }
      return next
    })
    return valid
  }, [fields, validateField])

  const getValue = useCallback(
    (field: keyof T): string => state[field]?.value ?? '',
    [state],
  )

  const getError = useCallback(
    (field: keyof T): string | null =>
      state[field]?.touched ? state[field]?.error : null,
    [state],
  )

  const getValues = useCallback((): Record<keyof T, string> => {
    const values = {} as Record<keyof T, string>
    for (const field of fields) {
      values[field] = state[field].value
    }
    return values
  }, [state, fields])

  const reset = useCallback((values?: Partial<T>) => {
    setState((prev) => {
      const next = { ...prev }
      for (const field of fields) {
        next[field] = {
          value: (values?.[field] as string) ?? '',
          error: null,
          touched: false,
          dirty: false,
        }
      }
      return next
    })
  }, [fields])

  const isValid = fields.every((f) => validateField(f, state[f].value) === null)
  const isDirty = fields.some((f) => state[f].dirty)

  const errors: Partial<Record<keyof T, string>> = {}
  for (const field of fields) {
    if (state[field].error) errors[field] = state[field].error!
  }

  return {
    setValue,
    getValue,
    getError,
    getValues,
    touch,
    validate,
    reset,
    isValid,
    isDirty,
    errors,
    fields: state,
  }
}
