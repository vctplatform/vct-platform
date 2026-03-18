import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFormValidation } from '../hooks/useFormValidation'

describe('useFormValidation', () => {
    it('validates required fields', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                name: { rules: [{ type: 'required' }] },
                email: { rules: [{ type: 'required', message: 'Email bắt buộc' }] },
            })
        )

        let isValid: boolean
        act(() => {
            isValid = result.current.validate({ name: '', email: '' })
        })
        expect(isValid!).toBe(false)
        expect(result.current.getFieldError('name')).toBe('Trường này là bắt buộc')
        expect(result.current.getFieldError('email')).toBe('Email bắt buộc')
    })

    it('validates minLength and maxLength', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                code: { rules: [{ type: 'minLength', value: 3 }, { type: 'maxLength', value: 10 }] },
            })
        )

        let isValid: boolean
        act(() => { isValid = result.current.validate({ code: 'AB' }) })
        expect(isValid!).toBe(false)
        expect(result.current.getFieldError('code')).toBe('Tối thiểu 3 ký tự')

        act(() => { isValid = result.current.validate({ code: 'ABCDEFGHIJK' }) })
        expect(isValid!).toBe(false)
        expect(result.current.getFieldError('code')).toBe('Tối đa 10 ký tự')

        act(() => { isValid = result.current.validate({ code: 'ABCDE' }) })
        expect(isValid!).toBe(true)
    })

    it('validates pattern', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                email: { rules: [{ type: 'pattern', value: /.+@.+\..+/, message: 'Email không hợp lệ' }] },
            })
        )

        let isValid: boolean
        act(() => { isValid = result.current.validate({ email: 'not-an-email' }) })
        expect(isValid!).toBe(false)
        expect(result.current.getFieldError('email')).toBe('Email không hợp lệ')

        act(() => { isValid = result.current.validate({ email: 'test@vct.vn' }) })
        expect(isValid!).toBe(true)
    })

    it('validates min and max for numbers', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                age: { rules: [{ type: 'min', value: 6 }, { type: 'max', value: 60 }] },
            })
        )

        let isValid: boolean
        act(() => { isValid = result.current.validate({ age: 3 }) })
        expect(isValid!).toBe(false)

        act(() => { isValid = result.current.validate({ age: 70 }) })
        expect(isValid!).toBe(false)

        act(() => { isValid = result.current.validate({ age: 25 }) })
        expect(isValid!).toBe(true)
    })

    it('validates custom rules', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                password: {
                    rules: [{
                        type: 'custom',
                        validate: (value) => {
                            const v = String(value)
                            if (v.length < 8) return 'Mật khẩu tối thiểu 8 ký tự'
                            if (!/[A-Z]/.test(v)) return 'Cần ít nhất 1 chữ hoa'
                            return null
                        }
                    }]
                },
            })
        )

        let isValid: boolean
        act(() => { isValid = result.current.validate({ password: 'short' }) })
        expect(isValid!).toBe(false)
        expect(result.current.getFieldError('password')).toBe('Mật khẩu tối thiểu 8 ký tự')

        act(() => { isValid = result.current.validate({ password: 'nocapshere' }) })
        expect(isValid!).toBe(false)
        expect(result.current.getFieldError('password')).toBe('Cần ít nhất 1 chữ hoa')

        act(() => { isValid = result.current.validate({ password: 'GoodPass1' }) })
        expect(isValid!).toBe(true)
    })

    it('clears errors', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                name: { rules: [{ type: 'required' }] },
            })
        )

        act(() => { result.current.validate({ name: '' }) })
        expect(result.current.hasErrors).toBe(true)

        act(() => { result.current.clearErrors() })
        expect(result.current.hasErrors).toBe(false)
    })

    it('clears field-level error', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                name: { rules: [{ type: 'required' }] },
                email: { rules: [{ type: 'required' }] },
            })
        )

        act(() => { result.current.validate({ name: '', email: '' }) })
        expect(result.current.getFieldError('name')).toBeTruthy()
        expect(result.current.getFieldError('email')).toBeTruthy()

        act(() => { result.current.clearFieldError('name') })
        expect(result.current.getFieldError('name')).toBeUndefined()
        expect(result.current.getFieldError('email')).toBeTruthy()
    })

    it('passes when all fields are valid', () => {
        const { result } = renderHook(() =>
            useFormValidation({
                code: { rules: [{ type: 'required' }, { type: 'minLength', value: 2 }] },
                name_vi: { rules: [{ type: 'required' }] },
            })
        )

        let isValid: boolean
        act(() => { isValid = result.current.validate({ code: 'BLACK_1', name_vi: 'Đai Đen 1 Đẳng' }) })
        expect(isValid!).toBe(true)
        expect(result.current.hasErrors).toBe(false)
    })
})
