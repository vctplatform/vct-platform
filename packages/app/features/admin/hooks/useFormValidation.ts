import { useState, useCallback, useMemo } from 'react'

// ════════════════════════════════════════
// useFormValidation — Admin form validation hook
// ════════════════════════════════════════

type ValidationRule =
    | { type: 'required'; message?: string }
    | { type: 'minLength'; value: number; message?: string }
    | { type: 'maxLength'; value: number; message?: string }
    | { type: 'pattern'; value: RegExp; message?: string }
    | { type: 'min'; value: number; message?: string }
    | { type: 'max'; value: number; message?: string }
    | { type: 'custom'; validate: (value: unknown) => string | null }

interface FieldConfig {
    rules: ValidationRule[]
}

type FieldErrors<T extends string> = Partial<Record<T, string>>

/**
 * Generic form validation hook for admin forms.
 *
 * @example
 * ```tsx
 * const { errors, validate, clearErrors, getFieldError } = useFormValidation({
 *     code: { rules: [{ type: 'required' }, { type: 'maxLength', value: 20 }] },
 *     name_vi: { rules: [{ type: 'required', message: 'Tên tiếng Việt là bắt buộc' }] },
 * })
 *
 * const handleSave = () => {
 *     if (!validate({ code: form.code, name_vi: form.name_vi })) return
 *     // proceed with save...
 * }
 * ```
 */
export function useFormValidation<T extends string>(
    schema: Record<T, FieldConfig>
) {
    const [errors, setErrors] = useState<FieldErrors<T>>({})

    const validateField = useCallback((field: T, value: unknown): string | null => {
        const config = schema[field]
        if (!config) return null

        for (const rule of config.rules) {
            switch (rule.type) {
                case 'required': {
                    const v = typeof value === 'string' ? value.trim() : value
                    if (v === '' || v === null || v === undefined) {
                        return rule.message || 'Trường này là bắt buộc'
                    }
                    break
                }
                case 'minLength': {
                    if (typeof value === 'string' && value.trim().length < rule.value) {
                        return rule.message || `Tối thiểu ${rule.value} ký tự`
                    }
                    break
                }
                case 'maxLength': {
                    if (typeof value === 'string' && value.length > rule.value) {
                        return rule.message || `Tối đa ${rule.value} ký tự`
                    }
                    break
                }
                case 'pattern': {
                    if (typeof value === 'string' && !rule.value.test(value)) {
                        return rule.message || 'Định dạng không hợp lệ'
                    }
                    break
                }
                case 'min': {
                    const num = Number(value)
                    if (isNaN(num) || num < rule.value) {
                        return rule.message || `Giá trị tối thiểu: ${rule.value}`
                    }
                    break
                }
                case 'max': {
                    const num = Number(value)
                    if (isNaN(num) || num > rule.value) {
                        return rule.message || `Giá trị tối đa: ${rule.value}`
                    }
                    break
                }
                case 'custom': {
                    const msg = rule.validate(value)
                    if (msg) return msg
                    break
                }
            }
        }
        return null
    }, [schema])

    const validate = useCallback((values: Partial<Record<T, unknown>>): boolean => {
        const newErrors: FieldErrors<T> = {}
        let isValid = true
        for (const field of Object.keys(schema) as T[]) {
            const err = validateField(field, values[field])
            if (err) {
                newErrors[field] = err
                isValid = false
            }
        }
        setErrors(newErrors)
        return isValid
    }, [schema, validateField])

    const clearErrors = useCallback(() => setErrors({}), [])
    const clearFieldError = useCallback((field: T) => {
        setErrors(prev => {
            const next = { ...prev }
            delete next[field]
            return next
        })
    }, [])

    const getFieldError = useCallback((field: T): string | undefined => errors[field], [errors])

    const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors])

    return { errors, validate, clearErrors, clearFieldError, getFieldError, hasErrors }
}
