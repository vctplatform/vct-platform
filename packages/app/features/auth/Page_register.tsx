'use client'
import * as React from 'react'
import { useEffect, useState } from 'react'
import Image from 'next/image'
import { VCT_Toast } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { useI18n } from '../i18n'

type Step = 'info' | 'verify' | 'complete'

interface FormData {
  hoTen: string; email: string; soDienThoai: string
  matKhau: string; xacNhanMatKhau: string
  chuaDoc: boolean
}

const INITIAL_FORM: FormData = {
  hoTen: '', email: '', soDienThoai: '',
  matKhau: '', xacNhanMatKhau: '',
  chuaDoc: false,
}

export function Page_register() {
  const { lang, setLang, t: _t } = useI18n()
  const t = (key: string) => _t(`auth.reg.${key}`)
  const tAuth = (key: string) => _t(`auth.${key}`)

  const [step, setStep] = useState<Step>('info')
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [showPw, setShowPw] = useState(false)
  const [showPw2, setShowPw2] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, msg: '', type: 'success' })
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [focusField, setFocusField] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Theme
  const [isDark, setIsDark] = useState(true)
  useEffect(() => {
    const saved = localStorage.getItem('vct-theme')
    if (saved === 'light') setIsDark(false)
    else if (saved === 'dark') setIsDark(true)
    else if (window.matchMedia?.('(prefers-color-scheme: light)').matches) setIsDark(false)
  }, [])
  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem('vct-theme', next ? 'dark' : 'light')
    if (next) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }

  const flash = (msg: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast(p => ({ ...p, show: false })), 3200)
  }

  const handleField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
    setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormData, string>> = {}
    if (!form.hoTen.trim()) errs.hoTen = t('errName')
    if (!form.email.trim()) errs.email = t('errEmail')
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = t('errEmailInvalid')
    if (!form.soDienThoai.trim()) errs.soDienThoai = t('errPhone')
    else if (!/^(0|\+84)\d{9,10}$/.test(form.soDienThoai.replace(/\s/g, ''))) errs.soDienThoai = t('errPhoneInvalid')
    if (!form.matKhau) errs.matKhau = t('errPw')
    else if (form.matKhau.length < 8) errs.matKhau = t('errPwShort')
    if (form.matKhau !== form.xacNhanMatKhau) errs.xacNhanMatKhau = t('errPwMatch')
    if (!form.chuaDoc) errs.chuaDoc = t('errTerms')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmitInfo = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          displayName: form.hoTen,
          phone: form.soDienThoai,
          password: form.matKhau,
          role: 'athlete',
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        flash(data.error || data.message || 'Gửi OTP thất bại', 'error')
        return
      }
      setStep('verify')
      setResendCooldown(60)
      flash(t('otpInfo'), 'info')
    } catch {
      flash('Lỗi kết nối server', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          displayName: form.hoTen,
          phone: form.soDienThoai,
          password: form.matKhau,
          role: 'athlete',
        }),
      })
      if (res.ok) {
        setResendCooldown(60)
        setOtp(['', '', '', '', '', ''])
        flash('Đã gửi lại mã OTP', 'success')
      } else {
        const data = await res.json()
        flash(data.error || 'Gửi lại OTP thất bại', 'error')
      }
    } catch {
      flash('Lỗi kết nối server', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length !== 6) { flash(t('otpWarn'), 'warning'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        flash(data.error || data.message || 'Xác thực thất bại', 'error')
        return
      }
      // Save tokens
      if (data.accessToken) {
        localStorage.setItem('vct-token', data.accessToken)
        if (data.refreshToken) localStorage.setItem('vct-refresh-token', data.refreshToken)
      }
      setStep('complete')
    } catch {
      flash('Lỗi kết nối server', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return
    const next = [...otp]
    next[index] = value.slice(-1)
    setOtp(next)
    if (value && index < 5) document.getElementById(`otp-${index + 1}`)?.focus()
  }

  const steps = [
    { key: 'step1', icon: <VCT_Icons.User size={13} /> },
    { key: 'step2', icon: <VCT_Icons.Mail size={13} /> },
    { key: 'step3', icon: <VCT_Icons.CheckCircle size={13} /> },
  ]
  const stepIndex = step === 'info' ? 0 : step === 'verify' ? 1 : 2

  return (
    <>
      <style>{CSS}</style>
      <div className={`v ${isDark ? 'v--d' : 'v--l'}`}>
        {/* ── Animated background ── */}
        <div className="v-bg" aria-hidden="true">
          <div className="v-bg__aurora" />
          <div className="v-bg__aurora v-bg__aurora--2" />
          <div className="v-bg__aurora v-bg__aurora--3" />
          <div className="v-bg__noise" />
          <div className="v-bg__grid" />
          <div className="v-bg__vignette" />
        </div>

        {/* ── Nav ── */}
        <nav className="v-nav">
          <div className="v-nav__l">
            <div className="v-nav__logo-w">
              <Image src="/logo-vct.png" alt="VCT" width={28} height={28} style={{ borderRadius: 7, objectFit: 'contain' }} />
            </div>
            <span className="v-nav__brand">VCT Platform</span>
          </div>
          <div className="v-nav__r">
            <button className="v-pill" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
              <span className={`v-pill__o ${lang === 'vi' ? 'v-pill__o--a' : ''}`}>VI</span>
              <span className={`v-pill__o ${lang === 'en' ? 'v-pill__o--a' : ''}`}>EN</span>
            </button>
            <button className="v-tb" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <VCT_Icons.Sun size={14} /> : <VCT_Icons.Moon size={14} />}
            </button>
          </div>
        </nav>

        {/* ── Center ── */}
        <main className="v-center">
          <div className="v-card-wrap">
            <div className="v-card__border" />
            <div className="v-card">
              {/* Header */}
              <div className="v-card__top">
                <div className="v-logo">
                  <div className="v-logo__ring" />
                  <div className="v-logo__ring v-logo__ring--2" />
                  <Image src="/logo-vct.png" alt="VCT" width={56} height={56} className="v-logo__img" priority />
                </div>
                <h1 className="v-card__title">
                  {t('heroTitle1')} <span className="v-card__accent">{t('heroTitle2')}</span> <span className="v-card__dim">{t('heroTitle3')}</span>
                </h1>
                <p className="v-card__sub">{t('heroDesc')}</p>
              </div>

              {/* Step indicator */}
              <div className="rg-steps">
                {steps.map((s, i) => (
                  <React.Fragment key={s.key}>
                    {i > 0 && <div className={`rg-steps__line ${i <= stepIndex ? 'rg-steps__line--on' : ''}`} />}
                    <div className={`rg-steps__dot ${i <= stepIndex ? 'rg-steps__dot--on' : ''} ${i === stepIndex ? 'rg-steps__dot--cur' : ''}`}>
                      {i < stepIndex ? <VCT_Icons.Check size={11} /> : s.icon}
                    </div>
                    <span className={`rg-steps__lbl ${i <= stepIndex ? 'rg-steps__lbl--on' : ''}`}>{t(s.key)}</span>
                  </React.Fragment>
                ))}
              </div>

              {/* ── STEP 1: Info ── */}
              {step === 'info' && (
                <form onSubmit={handleSubmitInfo} className="v-form">
                  {/* Full name */}
                  <div className={`v-inp ${focusField === 'name' ? 'v-inp--focus' : ''} ${errors.hoTen ? 'v-inp--err' : ''}`}>
                    <label htmlFor="rg-name">{t('fullName')} <span className="v-req">*</span></label>
                    <div className="v-inp__w">
                      <VCT_Icons.User size={15} className="v-inp__ic" />
                      <input id="rg-name" value={form.hoTen} onChange={e => handleField('hoTen', e.target.value)}
                        onFocus={() => setFocusField('name')} onBlur={() => setFocusField(null)}
                        autoFocus placeholder={t('fullNamePh')} />
                    </div>
                    {errors.hoTen && <span className="v-err">{errors.hoTen}</span>}
                  </div>

                  {/* Email + Phone row */}
                  <div className="v-row">
                    <div className={`v-inp ${focusField === 'email' ? 'v-inp--focus' : ''} ${errors.email ? 'v-inp--err' : ''}`}>
                      <label htmlFor="rg-email">{t('email')} <span className="v-req">*</span></label>
                      <div className="v-inp__w">
                        <VCT_Icons.Mail size={15} className="v-inp__ic" />
                        <input id="rg-email" type="email" value={form.email} onChange={e => handleField('email', e.target.value)}
                          onFocus={() => setFocusField('email')} onBlur={() => setFocusField(null)}
                          placeholder={t('emailPh')} />
                      </div>
                      {errors.email && <span className="v-err">{errors.email}</span>}
                    </div>
                    <div className={`v-inp ${focusField === 'phone' ? 'v-inp--focus' : ''} ${errors.soDienThoai ? 'v-inp--err' : ''}`}>
                      <label htmlFor="rg-phone">{t('phone')} <span className="v-req">*</span></label>
                      <div className="v-inp__w">
                        <VCT_Icons.Phone size={15} className="v-inp__ic" />
                        <input id="rg-phone" type="tel" value={form.soDienThoai} onChange={e => handleField('soDienThoai', e.target.value)}
                          onFocus={() => setFocusField('phone')} onBlur={() => setFocusField(null)}
                          placeholder={t('phonePh')} />
                      </div>
                      {errors.soDienThoai && <span className="v-err">{errors.soDienThoai}</span>}
                    </div>
                  </div>

                  {/* Password row */}
                  <div className="v-row">
                    <div className={`v-inp ${focusField === 'pw' ? 'v-inp--focus' : ''} ${errors.matKhau ? 'v-inp--err' : ''}`}>
                      <label htmlFor="rg-pw">{t('password')} <span className="v-req">*</span></label>
                      <div className="v-inp__w">
                        <VCT_Icons.Lock size={15} className="v-inp__ic" />
                        <input id="rg-pw" type={showPw ? 'text' : 'password'} value={form.matKhau}
                          onChange={e => handleField('matKhau', e.target.value)}
                          onFocus={() => setFocusField('pw')} onBlur={() => setFocusField(null)}
                          autoComplete="new-password"
                          placeholder={t('passwordPh')} />
                        <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)} className="v-inp__eye">
                          {showPw ? <VCT_Icons.EyeOff size={13} /> : <VCT_Icons.Eye size={13} />}
                        </button>
                      </div>
                      {errors.matKhau && <span className="v-err">{errors.matKhau}</span>}
                    </div>
                    <div className={`v-inp ${focusField === 'pw2' ? 'v-inp--focus' : ''} ${errors.xacNhanMatKhau ? 'v-inp--err' : ''}`}>
                      <label htmlFor="rg-pw2">{t('confirmPw')} <span className="v-req">*</span></label>
                      <div className="v-inp__w">
                        <VCT_Icons.Lock size={15} className="v-inp__ic" />
                        <input id="rg-pw2" type={showPw2 ? 'text' : 'password'} value={form.xacNhanMatKhau}
                          onChange={e => handleField('xacNhanMatKhau', e.target.value)}
                          onFocus={() => setFocusField('pw2')} onBlur={() => setFocusField(null)}
                          autoComplete="new-password"
                          placeholder={t('confirmPwPh')} />
                        <button type="button" tabIndex={-1} onClick={() => setShowPw2(!showPw2)} className="v-inp__eye">
                          {showPw2 ? <VCT_Icons.EyeOff size={13} /> : <VCT_Icons.Eye size={13} />}
                        </button>
                      </div>
                      {errors.xacNhanMatKhau && <span className="v-err">{errors.xacNhanMatKhau}</span>}
                    </div>
                  </div>

                  {/* Terms */}
                  <label className="v-ck">
                    <input type="checkbox" checked={form.chuaDoc} onChange={e => handleField('chuaDoc', e.target.checked)} />
                    <span className="v-ck__box"><VCT_Icons.Check size={10} /></span>
                    <span>{t('terms')} <a href="#" className="v-link">{t('termsLink')}</a> {t('and')} <a href="#" className="v-link">{t('privacyLink')}</a></span>
                  </label>
                  {errors.chuaDoc && <span className="v-err">{errors.chuaDoc}</span>}

                  <button type="submit" className="v-btn" disabled={loading}>
                    <span className="v-btn__shimmer" />
                    <span className="v-btn__content">
                      {loading ? 'Đang gửi...' : t('submit')}
                      {!loading && <VCT_Icons.ArrowRight size={16} />}
                    </span>
                  </button>

                  <p className="v-foot">{t('hasAccount')} <a href="/login">{t('loginLink')}</a></p>
                </form>
              )}

              {/* ── STEP 2: OTP ── */}
              {step === 'verify' && (
                <div className="rg-mid">
                  <div className="rg-otp">
                    <div className="rg-otp__icon"><VCT_Icons.Mail size={28} /></div>
                    <h2 className="rg-otp__title">{t('otpTitle')}</h2>
                    <p className="rg-otp__sub">{t('otpSent')} <strong>{form.email}</strong></p>
                    <div className="rg-otp__grid">
                      {otp.map((digit, i) => (
                        <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1}
                          aria-label={`Mã OTP số ${i + 1}`} placeholder="·"
                          value={digit} onChange={e => handleOtpChange(i, e.target.value)}
                          className="rg-otp__inp" />
                      ))}
                    </div>
                    <button onClick={handleVerify} className="v-btn" disabled={loading}>
                      <span className="v-btn__shimmer" />
                      <span className="v-btn__content"><VCT_Icons.CheckCircle size={16} /> {loading ? 'Đang xác thực...' : t('otpVerify')}</span>
                    </button>
                    <div className="rg-otp__actions">
                      <button onClick={() => setStep('info')} className="rg-back">{t('otpBack')}</button>
                      <button onClick={handleResendOTP} className="rg-back" disabled={resendCooldown > 0 || loading}>
                        {resendCooldown > 0 ? `Gửi lại (${resendCooldown}s)` : 'Gửi lại mã'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Success ── */}
              {step === 'complete' && (
                <div className="rg-mid">
                  <div className="rg-ok">
                    <div className="rg-ok__ic"><VCT_Icons.CheckCircle size={44} /></div>
                    <h2 className="rg-ok__t">{t('successTitle')}</h2>
                    <p className="rg-ok__s">{t('successMsg')}</p>
                    <a href="/login" className="v-btn v-btn--link">
                      <span className="v-btn__shimmer" />
                      <span className="v-btn__content"><VCT_Icons.ArrowRight size={16} /> {t('goLogin')}</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="v-stats">
            <a href="/public/provinces" className="v-st v-st--link"><strong>{tAuth('stat1v')}</strong><span>{tAuth('stat1l')}</span></a>
            <div className="v-st__d" />
            <a href="/public/clubs" className="v-st v-st--link"><strong>{tAuth('stat2v')}</strong><span>{tAuth('stat2l')}</span></a>
            <div className="v-st__d" />
            <a href="/public/members" className="v-st v-st--link"><strong>{tAuth('stat3v')}</strong><span>{tAuth('stat3l')}</span></a>
          </div>
        </main>

        <footer className="v-copy">© 2026 VCT Platform — Liên đoàn Võ cổ truyền Việt Nam</footer>
        <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
      </div>
    </>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* ══════ TOKENS ══════ */
.v--d {
  --bg: #07090f;
  --tx: #94a3b8; --tx-s: #e2e8f0; --tx-m: #475569;
  --glass: rgba(255,255,255,0.03); --glass2: rgba(255,255,255,0.05); --glass-h: rgba(255,255,255,0.07);
  --brd: rgba(255,255,255,0.06); --brd-h: rgba(16,185,129,0.3);
  --card-bg: rgba(10,16,30,0.7); --card-brd: rgba(255,255,255,0.08); --card-glow: rgba(16,185,129,0.04);
  --inp-bg: rgba(255,255,255,0.04); --inp-brd: rgba(255,255,255,0.08);
  --inp-f: rgba(16,185,129,0.5); --inp-ring: rgba(16,185,129,0.08); --inp-tx: #f1f5f9;
  --ph: rgba(148,163,184,0.35);
  --aurora-1: rgba(16,185,129,0.07); --aurora-2: rgba(56,189,248,0.05); --aurora-3: rgba(168,85,247,0.04);
  --nav-bg: rgba(7,9,15,0.6);
}
.v--l {
  --bg: #f0f2f5;
  --tx: #64748b; --tx-s: #0f172a; --tx-m: #94a3b8;
  --glass: rgba(255,255,255,0.5); --glass2: rgba(255,255,255,0.6); --glass-h: rgba(255,255,255,0.8);
  --brd: rgba(15,23,42,0.06); --brd-h: rgba(16,185,129,0.25);
  --card-bg: rgba(255,255,255,0.7); --card-brd: rgba(15,23,42,0.06); --card-glow: rgba(16,185,129,0.02);
  --inp-bg: rgba(255,255,255,0.9); --inp-brd: #e2e8f0;
  --inp-f: #10b981; --inp-ring: rgba(16,185,129,0.12); --inp-tx: #0f172a;
  --ph: #94a3b8;
  --aurora-1: rgba(16,185,129,0.06); --aurora-2: rgba(59,130,246,0.04); --aurora-3: rgba(168,85,247,0.03);
  --nav-bg: rgba(240,242,245,0.65);
}

/* ══════ ROOT ══════ */
.v {
  position: relative; display: flex; flex-direction: column;
  min-height: 100dvh; width: 100%; overflow-x: hidden;
  background: var(--bg); color: var(--tx);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* ══════ BG ══════ */
.v-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.v-bg__aurora { position: absolute; border-radius: 50%; filter: blur(120px); will-change: transform; animation: aur 25s ease-in-out infinite; }
.v-bg__aurora:first-child { width: 60vw; height: 60vh; top: -20%; left: -10%; background: var(--aurora-1); }
.v-bg__aurora--2 { width: 50vw; height: 50vh; bottom: -15%; right: -5%; background: var(--aurora-2); animation-delay: -8s; animation-duration: 30s; }
.v-bg__aurora--3 { width: 40vw; height: 40vh; top: 30%; right: 20%; background: var(--aurora-3); animation-delay: -15s; animation-duration: 22s; }
@keyframes aur { 0%,100% { transform: translate(0,0) rotate(0deg) scale(1); } 33% { transform: translate(30px,-40px) rotate(5deg) scale(1.08); } 66% { transform: translate(-20px,25px) rotate(-3deg) scale(0.95); } }
.v-bg__noise { position: absolute; inset: 0; opacity: 0.025; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); background-size: 200px; }
.v--l .v-bg__noise { opacity: 0.015; }
.v-bg__grid { position: absolute; inset: 0; background-image: linear-gradient(var(--brd) 1px, transparent 1px), linear-gradient(90deg, var(--brd) 1px, transparent 1px); background-size: 60px 60px; mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black, transparent 70%); -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black, transparent 70%); opacity: 0.4; }
.v-bg__vignette { position: absolute; inset: 0; background: radial-gradient(ellipse at center, transparent 50%, var(--bg) 100%); }

/* ══════ NAV ══════ */
.v-nav { position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between; padding: 12px 28px; background: var(--nav-bg); backdrop-filter: blur(20px) saturate(1.3); -webkit-backdrop-filter: blur(20px) saturate(1.3); border-bottom: 1px solid var(--brd); }
.v-nav__l { display: flex; align-items: center; gap: 10px; }
.v-nav__logo-w { display: flex; padding: 2px; border-radius: 8px; background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(56,189,248,0.15)); }
.v-nav__brand { font-size: 14px; font-weight: 800; color: var(--tx-s); letter-spacing: -0.03em; }
.v-nav__r { display: flex; align-items: center; gap: 6px; }
.v-pill { display: flex; border-radius: 9px; overflow: hidden; border: 1px solid var(--brd); background: var(--glass); cursor: pointer; padding: 0; transition: border-color 0.3s; }
.v-pill:hover { border-color: var(--brd-h); }
.v-pill__o { padding: 6px 11px; font-size: 10.5px; font-weight: 700; letter-spacing: 0.06em; color: var(--tx-m); transition: all 0.25s; }
.v-pill__o--a { color: var(--tx-s); background: rgba(16,185,129,0.12); }
.v--l .v-pill__o--a { color: #059669; }
.v-tb { display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; border-radius: 9px; border: 1px solid var(--brd); background: var(--glass); color: var(--tx-m); cursor: pointer; transition: all 0.25s; }
.v-tb:hover { border-color: var(--brd-h); color: var(--tx-s); background: var(--glass-h); }

/* ══════ CENTER ══════ */
.v-center { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 24px 20px 12px; gap: 20px; }

/* ══════ CARD ══════ */
.v-card-wrap { position: relative; width: 100%; max-width: 520px; animation: cardIn 0.6s ease-out 0.1s both; }
.v-card__border { position: absolute; inset: -1px; border-radius: 25px; background: conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.3) 10%, transparent 20%, rgba(56,189,248,0.2) 40%, transparent 50%, rgba(168,85,247,0.2) 70%, transparent 80%, rgba(16,185,129,0.3) 100%); animation: bSpin 8s linear infinite; opacity: 0.5; mask-image: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000); mask-composite: xor; -webkit-mask-composite: xor; padding: 1px; }
.v--l .v-card__border { opacity: 0.35; }
@keyframes bSpin { to { transform: rotate(360deg); } }
.v-card { position: relative; display: flex; flex-direction: column; gap: 0; border-radius: 24px; background: var(--card-bg); backdrop-filter: blur(40px) saturate(1.5); -webkit-backdrop-filter: blur(40px) saturate(1.5); box-shadow: 0 0 60px -20px var(--card-glow), 0 25px 60px -15px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.06); overflow: hidden; transition: box-shadow 0.4s ease, transform 0.4s ease; }
.v-card:hover { box-shadow: 0 0 80px -10px rgba(16,185,129,0.15), 0 30px 80px -15px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08); transform: translateY(-2px); }
.v--l .v-card { box-shadow: 0 0 60px -20px var(--card-glow), 0 25px 60px -15px rgba(0,0,0,0.05), inset 0 1px 0 rgba(255,255,255,0.5); }
.v--l .v-card:hover { box-shadow: 0 0 80px -10px rgba(16,185,129,0.1), 0 30px 80px -15px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.6); }
@keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* Card header */
.v-card__top { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 28px 28px 0; gap: 8px; }
.v-logo { position: relative; width: 56px; height: 56px; }
.v-logo__ring { position: absolute; inset: -10px; border-radius: 50%; border: 1px solid rgba(16,185,129,0.15); animation: ringP 4s ease-in-out infinite; }
.v-logo__ring--2 { inset: -20px; border-color: rgba(16,185,129,0.08); animation-delay: -2s; }
@keyframes ringP { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }
.v-logo__img { position: relative; z-index: 1; border-radius: 14px; object-fit: contain; filter: drop-shadow(0 0 24px rgba(16,185,129,0.2)); }
.v-card__title { margin: 0; font-size: clamp(1.1rem, 2.2vw, 1.4rem); font-weight: 900; line-height: 1.25; letter-spacing: -0.03em; color: var(--tx-s); }
.v-card__accent { background: linear-gradient(135deg, #10b981 0%, #22d3ee 50%, #818cf8 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: shT 4s linear infinite; }
@keyframes shT { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
.v-card__dim { color: var(--tx-m); font-weight: 700; }
.v-card__sub { margin: 0; font-size: 12px; line-height: 1.7; color: var(--tx); max-width: 400px; }

/* ══════ STEPS ══════ */
.rg-steps { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 18px 28px 4px; }
.rg-steps__dot { display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: var(--glass); border: 1px solid var(--brd); color: var(--tx-m); transition: all 0.3s; flex-shrink: 0; }
.rg-steps__dot--on { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #10b981; }
.rg-steps__dot--cur { box-shadow: 0 0 0 3px rgba(16,185,129,0.1); }
.rg-steps__line { flex: 1; max-width: 40px; height: 2px; background: var(--brd); border-radius: 1px; transition: background 0.3s; }
.rg-steps__line--on { background: rgba(16,185,129,0.35); }
.rg-steps__lbl { font-size: 10px; font-weight: 700; color: var(--tx-m); transition: color 0.3s; }
.rg-steps__lbl--on { color: var(--tx-s); }

/* ══════ FORM ══════ */
.v-form { display: flex; flex-direction: column; gap: 12px; padding: 20px 28px 28px; }
.v-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
@media (max-width: 540px) { .v-row { grid-template-columns: 1fr; } }

/* Inputs */
.v-inp { display: flex; flex-direction: column; gap: 4px; transition: all 0.3s; }
.v-inp label { font-size: 11px; font-weight: 650; color: var(--tx); transition: color 0.3s; }
.v-inp--focus label { color: #10b981; }
.v-inp--err label { color: #ef4444; }
.v-inp__w { position: relative; display: flex; align-items: center; }
.v-inp__ic { position: absolute; left: 12px; color: var(--tx-m); pointer-events: none; z-index: 2; transition: color 0.3s; }
.v-inp--focus .v-inp__ic { color: #10b981; }
.v-inp__w input { width: 100%; padding: 10px 14px 10px 36px; border-radius: 12px; border: 1px solid var(--inp-brd); background: var(--inp-bg); color: var(--inp-tx); font-family: inherit; font-size: 13px; font-weight: 500; outline: none; transition: all 0.3s ease; }
.v-inp__w input::placeholder { color: var(--ph); }
.v-inp__w input:focus { border-color: var(--inp-f); box-shadow: 0 0 0 3px var(--inp-ring), 0 4px 16px -4px rgba(16,185,129,0.1); background: var(--glass-h); }
.v-inp--err .v-inp__w input { border-color: rgba(239,68,68,0.5); }
.v-inp__eye { position: absolute; right: 8px; z-index: 2; display: flex; background: none; border: none; color: var(--tx-m); cursor: pointer; padding: 5px; border-radius: 8px; transition: all 0.2s; }
.v-inp__eye:hover { color: var(--tx-s); background: var(--glass-h); }
.v-req { color: #ef4444; }
.v-err { font-size: 10.5px; color: #ef4444; font-weight: 500; }
.v-link { font-weight: 600; color: #10b981; text-decoration: none; }
.v-link:hover { color: #34d399; text-decoration: underline; }

/* Checkbox */
.v-ck { display: flex; align-items: flex-start; gap: 8px; cursor: pointer; user-select: none; font-size: 11.5px; color: var(--tx); line-height: 1.5; }
.v-ck input { position: absolute; opacity: 0; width: 0; height: 0; }
.v-ck__box { display: flex; align-items: center; justify-content: center; width: 16px; height: 16px; min-width: 16px; border-radius: 5px; border: 1.5px solid var(--inp-brd); background: var(--inp-bg); color: transparent; transition: all 0.25s; margin-top: 1px; }
.v-ck input:checked + .v-ck__box { background: linear-gradient(135deg, #10b981, #0d9488); border-color: #10b981; color: #fff; }

/* Button */
.v-btn { position: relative; overflow: hidden; display: flex; align-items: center; justify-content: center; width: 100%; padding: 11px 20px; border-radius: 14px; border: none; background: linear-gradient(135deg, #059669 0%, #0d9488 40%, #0284c7 80%, #6366f1 100%); background-size: 200% auto; color: #fff; font-family: inherit; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: all 0.4s ease; box-shadow: 0 4px 24px -4px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.15); }
.v-btn__shimmer { position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent); animation: shim 3s ease-in-out infinite; }
@keyframes shim { 0% { left: -100%; } 50%,100% { left: 100%; } }
.v-btn__content { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; }
.v-btn:hover { background-position: right center; transform: translateY(-2px); box-shadow: 0 8px 32px -6px rgba(5,150,105,0.45), inset 0 1px 0 rgba(255,255,255,0.2); }
.v-btn:active { transform: translateY(0); }

.v-foot { margin: 0; text-align: center; font-size: 12px; color: var(--tx); }
.v-foot a { font-weight: 700; color: #10b981; text-decoration: none; }
.v-foot a:hover { color: #34d399; text-decoration: underline; }

/* ══════ OTP ══════ */
.rg-mid { padding: 24px 28px 28px; display: flex; align-items: center; justify-content: center; }
.rg-otp, .rg-ok { display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; max-width: 380px; width: 100%; }
.rg-otp__icon { width: 56px; height: 56px; border-radius: 16px; background: rgba(16,185,129,0.1); display: flex; align-items: center; justify-content: center; color: #10b981; }
.rg-otp__title { margin: 0; font-size: 20px; font-weight: 800; color: var(--tx-s); }
.rg-otp__sub { margin: 0; font-size: 12.5px; color: var(--tx); }
.rg-otp__sub strong { color: var(--tx-s); }
.rg-otp__grid { display: flex; gap: 8px; justify-content: center; }
.rg-otp__inp { width: 44px; height: 52px; border-radius: 12px; border: 1px solid var(--inp-brd); background: var(--inp-bg); color: var(--inp-tx); font-family: inherit; font-size: 22px; font-weight: 800; text-align: center; outline: none; transition: all 0.25s; }
.rg-otp__inp:focus { border-color: var(--inp-f); box-shadow: 0 0 0 3px var(--inp-ring); }
.rg-back { background: none; border: none; font-family: inherit; font-size: 12px; font-weight: 600; color: var(--tx); cursor: pointer; }
.rg-back:hover { color: #10b981; }
.rg-otp__actions { display: flex; gap: 12px; align-items: center; justify-content: center; }
.v-btn--link { text-decoration: none; display: inline-flex; }
.v-st--link { text-decoration: none; }

/* ══════ SUCCESS ══════ */
.rg-ok__ic { width: 72px; height: 72px; border-radius: 50%; background: rgba(16,185,129,0.1); display: flex; align-items: center; justify-content: center; color: #10b981; animation: scIn 0.5s ease-out; }
@keyframes scIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
.rg-ok__t { margin: 0; font-size: 22px; font-weight: 800; color: #10b981; }
.rg-ok__s { margin: 0; font-size: 13px; color: var(--tx); }

/* ══════ STATS ══════ */
.v-stats { display: flex; align-items: center; gap: 20px; padding: 12px 24px; border-radius: 14px; background: var(--glass); border: 1px solid var(--brd); backdrop-filter: blur(12px); animation: up 0.5s ease-out 0.3s both; }
.v-st { text-align: center; color: var(--tx-s); transition: transform 0.2s; display: block; }
.v-st:hover { transform: scale(1.05); }
.v-st strong { display: block; font-size: 16px; font-weight: 900; color: inherit; letter-spacing: -0.03em; }
.v-st span { display: block; font-size: 9px; color: var(--tx-m); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; font-weight: 600; }
.v-st__d { width: 1px; height: 20px; background: var(--brd); }

/* Footer */
.v-copy { position: relative; z-index: 1; text-align: center; padding: 8px 20px 12px; font-size: 10.5px; color: var(--tx-m); }

/* Animations */
@keyframes up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

/* ══════ RESPONSIVE ══════ */
@media (max-width: 540px) {
  .v-card-wrap { max-width: 100%; }
  .v-card { border-radius: 20px; }
  .v-card__top { padding: 22px 20px 0; }
  .v-form { padding: 16px 20px 22px; }
  .v-logo { width: 44px; height: 44px; }
  .v-logo__img { width: 44px !important; height: 44px !important; }
  .rg-mid { padding: 20px 20px 22px; }
  .rg-otp__inp { width: 38px; height: 46px; font-size: 18px; }
}
`
