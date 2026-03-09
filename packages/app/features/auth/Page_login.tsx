'use client'
import * as React from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { VCT_Alert, VCT_Toast } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { useAuth } from './AuthProvider'
import type { LoginInput, UserRole } from './types'

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'admin', label: 'Quản trị hệ thống' },
  { value: 'btc', label: 'Ban tổ chức' },
  { value: 'referee_manager', label: 'Điều phối trọng tài' },
  { value: 'referee', label: 'Trọng tài' },
  { value: 'delegate', label: 'Cán bộ đoàn' },
]

const QUICK_ACCOUNTS: Array<{
  username: string
  password: string
  role: UserRole
  label: string
}> = [
    { username: 'admin', password: 'Admin@123', role: 'admin', label: 'Admin' },
    { username: 'btc', password: 'Btc@123', role: 'btc', label: 'Ban tổ chức' },
    {
      username: 'ref-manager',
      password: 'Ref@123',
      role: 'referee_manager',
      label: 'Điều phối trọng tài',
    },
    { username: 'delegate', password: 'Delegate@123', role: 'delegate', label: 'Cán bộ đoàn' },
  ]

const SHIFT_OPTIONS = [
  { value: 'sang', label: 'Ca sáng (06:00 - 12:00)' },
  { value: 'chieu', label: 'Ca chiều (12:00 - 18:00)' },
  { value: 'toi', label: 'Ca tối (18:00 - 22:00)' },
]

const INITIAL_FORM: LoginInput = {
  username: 'admin',
  password: 'Admin@123',
  role: 'admin',
  tournamentCode: 'VCT-2026',
  operationShift: 'sang',
}

const INPUT_CLASS =
  'w-full rounded-xl border border-vct-border bg-vct-elevated px-3 py-2.5 text-sm text-vct-text outline-none transition focus:border-vct-accent'

export const Page_login = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/'

  const { login, isAuthenticated, isHydrating } = useAuth()

  const [form, setForm] = useState<LoginInput>(INITIAL_FORM)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    show: boolean
    msg: string
    type: 'success' | 'error' | 'warning' | 'info'
  }>({ show: false, msg: '', type: 'success' })

  useEffect(() => {
    if (!isHydrating && isAuthenticated) {
      router.replace(redirectTarget)
    }
  }, [isAuthenticated, isHydrating, redirectTarget, router])

  const handleField = <K extends keyof LoginInput>(key: K, value: LoginInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const tips = useMemo(
    () => [
      'Đồng bộ vai trò để phân quyền chính xác theo module.',
      'Mỗi ca điều hành tương ứng tổ trực ban kỹ thuật.',
      'Sử dụng mã giải để tách dữ liệu theo mùa giải.',
    ],
    []
  )

  const showToast = (msg: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ show: true, msg, type })
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }))
    }, 3200)
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!form.username.trim() || !form.password.trim()) {
      showToast('Vui lòng nhập đủ tài khoản và mật khẩu.', 'warning')
      return
    }
    if (!form.tournamentCode.trim()) {
      showToast('Mã giải là bắt buộc để khóa phạm vi dữ liệu.', 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      await login({
        ...form,
        username: form.username.trim(),
        password: form.password.trim(),
        tournamentCode: form.tournamentCode.trim().toUpperCase(),
      })
      showToast('Đăng nhập thành công. Đang chuyển vào hệ điều hành giải...', 'success')
      router.replace(redirectTarget)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Không thể kết nối máy chủ xác thực'
      showToast(message, 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-vct-bg text-vct-text" style={{ backgroundImage: 'radial-gradient(circle at 12% 16%, var(--vct-success-muted), transparent 38%), radial-gradient(circle at 88% 14%, var(--vct-danger-muted), transparent 42%)' }}>
      <div className="mx-auto grid min-h-dvh w-full max-w-[1480px] desktop:grid-cols-[1.1fr_0.9fr]">
        <section className="flex flex-col justify-between border-b border-vct-border px-4 py-6 tablet:px-8 tablet:py-10 desktop:border-b-0 desktop:border-r desktop:px-14">
          <div>
            <div className="mb-5 inline-flex items-center gap-3 rounded-2xl border border-vct-border bg-vct-elevated px-3 py-2 shadow-sm">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-red-700 to-emerald-700 text-white">
                <VCT_Icons.Shield size={20} />
              </span>
              <span>
                <span className="block text-sm font-black uppercase tracking-wide">
                  VCT Tournament Command
                </span>
                <span className="block text-xs text-vct-text-muted">
                  Trung tâm vận hành giải võ cổ truyền
                </span>
              </span>
            </div>

            <h1 className="m-0 text-[clamp(2rem,5.5vw,3.8rem)] font-black uppercase leading-[0.96] tracking-[-0.03em] text-vct-text">
              Điều hành giải
              <br />
              chuẩn thi đấu
            </h1>
            <p className="mb-0 mt-4 max-w-[560px] text-sm leading-7 text-[var(--vct-text-secondary)] tablet:text-[15px]">
              Đăng nhập để quản lý danh sách đoàn, cân ký, bốc thăm, phân công trọng tài, nhập
              kết quả và công bố huy chương theo thời gian thực.
            </p>
          </div>

          <div className="mt-7 grid gap-3 tablet:grid-cols-2 desktop:grid-cols-3">
            {tips.map((tip, index) => (
              <article
                key={tip}
                className="rounded-xl border border-vct-border bg-vct-elevated/75 px-3 py-3 shadow-[var(--vct-shadow-sm)]"
              >
                <div
                  className={`mb-2 inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-black text-white ${index === 1 ? 'bg-emerald-700' : 'bg-red-700'
                    }`}
                >
                  {index + 1}
                </div>
                <p className="m-0 text-xs leading-5 text-[var(--vct-text-secondary)]">{tip}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="flex items-center justify-center px-4 py-6 tablet:px-8 tablet:py-10 desktop:px-10">
          <form
            onSubmit={handleSubmit}
            aria-label="Đăng nhập hệ thống giải võ cổ truyền"
            className="w-full max-w-[560px] rounded-3xl border border-vct-border bg-vct-elevated/95 p-5 shadow-[var(--vct-shadow-xl)] tablet:p-7"
          >
            <div className="grid gap-4">
              <div>
                <h2 className="m-0 text-xl font-black text-vct-text">Đăng nhập tài khoản điều hành</h2>
                <p className="mb-0 mt-1 text-xs text-vct-text-muted">Phiên bản backend: Go 1.26 API</p>
              </div>

              <VCT_Alert
                tone="info"
                title="Phiên truy cập"
                description={`Sau khi đăng nhập, hệ thống sẽ chuyển đến: ${redirectTarget}`}
              />

              <div className="grid gap-1.5">
                <label htmlFor="login-username" className="text-sm font-bold">
                  Tài khoản
                </label>
                <input
                  id="login-username"
                  value={form.username}
                  onChange={(event) => handleField('username', event.target.value)}
                  autoFocus
                  required
                  autoComplete="username"
                  placeholder="admin / btc / referee..."
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="login-password" className="text-sm font-bold">
                  Mật khẩu
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={form.password}
                  onChange={(event) => handleField('password', event.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="grid gap-3 tablet:grid-cols-2">
                <div className="grid gap-1.5">
                  <label htmlFor="login-role" className="text-sm font-bold">
                    Vai trò
                  </label>
                  <select
                    id="login-role"
                    value={form.role}
                    onChange={(event) => handleField('role', event.target.value as UserRole)}
                    className={INPUT_CLASS}
                  >
                    {ROLE_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="login-shift" className="text-sm font-bold">
                    Ca điều hành
                  </label>
                  <select
                    id="login-shift"
                    value={form.operationShift}
                    onChange={(event) =>
                      handleField('operationShift', event.target.value as LoginInput['operationShift'])
                    }
                    className={INPUT_CLASS}
                  >
                    {SHIFT_OPTIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <label htmlFor="login-tournament-code" className="text-sm font-bold">
                  Mã giải
                </label>
                <input
                  id="login-tournament-code"
                  value={form.tournamentCode}
                  onChange={(event) => handleField('tournamentCode', event.target.value)}
                  required
                  placeholder="VCT-2026"
                  className={INPUT_CLASS}
                />
              </div>

              <fieldset className="grid gap-2">
                <legend className="text-xs font-extrabold uppercase tracking-wide text-vct-text-muted">
                  Tài khoản mẫu nhanh
                </legend>
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACCOUNTS.map((item) => (
                    <button
                      key={item.username}
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          username: item.username,
                          password: item.password,
                          role: item.role,
                        }))
                      }
                      className="rounded-full border border-vct-border bg-vct-elevated px-3 py-1.5 text-xs font-bold text-vct-text transition hover:bg-vct-input"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-vct-accent px-3 py-2.5 text-sm font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-white/90 border-r-transparent" />
                ) : (
                  <VCT_Icons.CheckCircle size={16} />
                )}
                Vào hệ thống điều hành
              </button>
            </div>
          </form>
        </section>
      </div>

      <VCT_Toast
        isVisible={toast.show}
        message={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />
    </main>
  )
}
