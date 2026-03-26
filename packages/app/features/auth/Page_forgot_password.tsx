'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Forgot Password Page
// Password recovery flow with email verification
// ════════════════════════════════════════════════════════════════

import * as React from 'react'
import { useState } from 'react'
import { VCT_Toast } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

type Step = 'email' | 'verify' | 'reset' | 'done'

const INPUT_CLASS = 'w-full rounded-xl border border-vct-border bg-vct-elevated px-3 py-2.5 text-sm text-vct-text outline-none transition focus:border-vct-accent'

export function Page_forgot_password() {
    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState(['', '', '', '', '', ''])
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, msg: '', type: 'success' })

    const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3000)
    }

    const handleEmail = (e: React.FormEvent) => {
        e.preventDefault()
        if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError('Vui lòng nhập email hợp lệ')
            return
        }
        setError('')
        setStep('verify')
        showToast('Mã xác thực đã được gửi đến email của bạn.', 'info')
    }

    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const next = [...otp]
        next[index] = value.slice(-1)
        setOtp(next)
        if (value && index < 5) document.getElementById(`fp-otp-${index + 1}`)?.focus()
    }

    const handleVerify = () => {
        if (otp.join('').length !== 6) { showToast('Nhập đủ 6 chữ số OTP.', 'warning'); return }
        setStep('reset')
    }

    const handleReset = (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword.length < 8) { setError('Mật khẩu tối thiểu 8 ký tự'); return }
        if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return }
        setError('')
        setStep('done')
    }

    const STEPS: { step: Step; label: string }[] = [
        { step: 'email', label: 'Email' },
        { step: 'verify', label: 'Xác thực' },
        { step: 'reset', label: 'Đổi mật khẩu' },
        { step: 'done', label: 'Hoàn tất' },
    ]
    const currentIdx = STEPS.findIndex(s => s.step === step)

    return (
        <main className="relative min-h-dvh overflow-hidden bg-vct-bg text-vct-text" style={{ backgroundImage: 'radial-gradient(circle at 12% 80%, var(--vct-accent-muted, rgba(59,130,246,0.08)), transparent 38%), radial-gradient(circle at 88% 14%, var(--vct-danger-muted), transparent 42%)' }}>
            <div className="flex min-h-dvh items-center justify-center px-4 py-8">
                <div className="w-full max-w-[480px] rounded-3xl border border-vct-border bg-vct-elevated/95 p-6 shadow-(--vct-shadow-xl) tablet:p-8">
                    {/* Logo */}
                    <div className="mb-6 flex items-center gap-3">
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-700 to-emerald-700 text-white">
                            <VCT_Icons.Shield size={20} />
                        </span>
                        <span className="text-sm font-black uppercase tracking-wide">VCT Ecosystem</span>
                    </div>

                    {/* Step indicator */}
                    <div className="mb-6 flex items-center gap-1">
                        {STEPS.map((s, i) => (
                            <React.Fragment key={s.step}>
                                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${i <= currentIdx ? 'bg-vct-accent text-white' : 'bg-vct-input text-vct-text-muted'}`}>{i + 1}</div>
                                <span className={`text-[10px] font-bold ${i <= currentIdx ? 'text-vct-text' : 'text-vct-text-muted'}`}>{s.label}</span>
                                {i < 3 && <div className={`h-px flex-1 ${i < currentIdx ? 'bg-vct-accent' : 'bg-vct-border'}`} />}
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Step: Email */}
                    {step === 'email' && (
                        <form onSubmit={handleEmail} className="grid gap-4">
                            <div>
                                <h2 className="m-0 text-xl font-black">Quên mật khẩu?</h2>
                                <p className="mt-1 text-sm text-vct-text-muted">Nhập email đã đăng ký, chúng tôi sẽ gửi mã xác thực.</p>
                            </div>
                            <div className="grid gap-1.5">
                                <label htmlFor="fp-email" className="text-sm font-bold">Email <span className="text-red-500">*</span></label>
                                <input id="fp-email" type="email" value={email} onChange={e => { setEmail(e.target.value); setError('') }}
                                    placeholder="email@vct.vn" autoFocus className={`${INPUT_CLASS} ${error ? 'border-red-500' : ''}`} />
                                {error && <span className="text-xs text-red-500">{error}</span>}
                            </div>
                            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vct-accent px-3 py-2.5 text-sm font-extrabold text-white transition hover:brightness-105">
                                <VCT_Icons.Mail size={16} /> Gửi mã xác thực
                            </button>
                            <p className="text-center text-xs text-vct-text-muted">
                                Nhớ mật khẩu? <a href="/login" className="font-bold text-vct-accent">Đăng nhập</a>
                            </p>
                        </form>
                    )}

                    {/* Step: OTP Verify */}
                    {step === 'verify' && (
                        <div className="grid gap-5 text-center">
                            <div>
                                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-vct-accent/15">
                                    <VCT_Icons.Mail size={28} className="text-vct-accent" />
                                </div>
                                <h2 className="m-0 text-xl font-black">Nhập mã OTP</h2>
                                <p className="mt-1 text-sm text-vct-text-muted">Đã gửi đến <strong className="text-vct-text">{email}</strong></p>
                            </div>
                            <div className="flex justify-center gap-3">
                                {otp.map((d, i) => (
                                    <input key={i} id={`fp-otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                                        value={d} onChange={e => handleOtpChange(i, e.target.value)}
                                        className="h-12 w-11 rounded-xl border border-vct-border bg-vct-input text-center text-xl font-black outline-none focus:border-vct-accent" />
                                ))}
                            </div>
                            <button onClick={handleVerify} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vct-accent px-3 py-2.5 text-sm font-extrabold text-white hover:brightness-105">
                                <VCT_Icons.CheckCircle size={16} /> Xác nhận
                            </button>
                            <button onClick={() => setStep('email')} className="text-sm text-vct-text-muted hover:text-vct-accent">← Quay lại</button>
                        </div>
                    )}

                    {/* Step: Reset Password */}
                    {step === 'reset' && (
                        <form onSubmit={handleReset} className="grid gap-4">
                            <div>
                                <h2 className="m-0 text-xl font-black">Đặt mật khẩu mới</h2>
                                <p className="mt-1 text-sm text-vct-text-muted">Mật khẩu mới cần tối thiểu 8 ký tự.</p>
                            </div>
                            <div className="grid gap-1.5">
                                <label htmlFor="fp-new-pw" className="text-sm font-bold">Mật khẩu mới</label>
                                <input id="fp-new-pw" type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); setError('') }}
                                    autoComplete="new-password"
                                    placeholder="Tối thiểu 8 ký tự" className={INPUT_CLASS} />
                            </div>
                            <div className="grid gap-1.5">
                                <label htmlFor="fp-confirm-pw" className="text-sm font-bold">Xác nhận mật khẩu</label>
                                <input id="fp-confirm-pw" type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                                    autoComplete="new-password"
                                    placeholder="Nhập lại mật khẩu" className={INPUT_CLASS} />
                            </div>
                            {error && <span className="text-xs text-red-500">{error}</span>}
                            <button type="submit" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vct-accent px-3 py-2.5 text-sm font-extrabold text-white hover:brightness-105">
                                <VCT_Icons.CheckCircle size={16} /> Đổi mật khẩu
                            </button>
                        </form>
                    )}

                    {/* Step: Done */}
                    {step === 'done' && (
                        <div className="text-center">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
                                <VCT_Icons.CheckCircle size={40} className="text-emerald-500" />
                            </div>
                            <h2 className="m-0 text-xl font-black text-emerald-500">Đổi mật khẩu thành công!</h2>
                            <p className="mt-3 text-sm text-vct-text-muted">Bạn có thể đăng nhập bằng mật khẩu mới.</p>
                            <a href="/login" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-vct-accent px-6 py-2.5 text-sm font-extrabold text-white hover:brightness-105">
                                <VCT_Icons.ArrowUpRight size={16} /> Đăng nhập
                            </a>
                        </div>
                    )}
                </div>
            </div>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
        </main>
    )
}
