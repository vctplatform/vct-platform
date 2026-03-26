'use client'
import * as React from 'react'
import { useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { VCT_Toast } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useAuth } from './AuthProvider'
import { useI18n } from '../i18n'
import type { LoginInput } from './types'

const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
const DEMO_ACCOUNTS: Array<{ username: string; password: string; label: string }> = [
  { username: 'admin', password: 'Admin@123', label: 'Admin' },
  { username: 'btc', password: 'Btc@123', label: 'BTC' },
  { username: 'ref-manager', password: 'Ref@123', label: 'Trọng tài' },
  { username: 'delegate', password: 'Delegate@123', label: 'Đoàn' },
]
const INITIAL_FORM: LoginInput = { username: '', password: '', rememberMe: false }

export const Page_login = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTarget = searchParams.get('redirect') || '/'
  const { login, isAuthenticated, isHydrating } = useAuth()
  const { lang, setLang, t: _t } = useI18n()
  const t = (key: string) => _t(`auth.${key}`)

  const [form, setForm] = useState<LoginInput>(INITIAL_FORM)
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'error' | 'warning' | 'info' }>({ show: false, msg: '', type: 'success' })
  const [focusField, setFocusField] = useState<string | null>(null)

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

  useEffect(() => {
    if (!isHydrating && isAuthenticated) router.replace(redirectTarget)
  }, [isAuthenticated, isHydrating, redirectTarget, router])

  const set = <K extends keyof LoginInput>(k: K, v: LoginInput[K]) => setForm((p) => ({ ...p, [k]: v }))
  const flash = (msg: string, type: 'success' | 'error' | 'warning' | 'info') => {
    setToast({ show: true, msg, type })
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3200)
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.username.trim() || !form.password.trim()) return flash(t('errEmpty'), 'warning')
    setLoading(true)
    try {
      await login({ username: form.username.trim(), password: form.password.trim(), rememberMe: form.rememberMe })
      flash(t('ok'), 'success')
      router.replace(redirectTarget)
    } catch (err) {
      flash(err instanceof Error ? err.message : t('errServer'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: <VCT_Icons.Building size={15} />, label: t('feat1'), c: 'var(--vct-success)', href: '/federation' },
    { icon: <VCT_Icons.Trophy size={15} />, label: t('feat2'), c: 'var(--vct-info)', href: '/tournament' },
    { icon: <VCT_Icons.BarChart2 size={15} />, label: t('feat3'), c: '#a855f7', href: '/rankings' },
    { icon: <VCT_Icons.Book size={15} />, label: t('feat4'), c: 'var(--vct-warning)', href: '/training' },
  ]

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
            <span className="v-nav__badge">{t('platformSub')}</span>
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
          <div className="v-hero">
            {/* Glowing logo */}
            <div className="v-logo">
              <div className="v-logo__ring" />
              <div className="v-logo__ring v-logo__ring--2" />
              <Image src="/logo-vct.png" alt="VCT Platform" width={72} height={72} className="v-logo__img" priority />
            </div>

            <h1 className="v-h1">
              {t('heroTitle1')}{' '}
              <span className="v-h1__glow">{t('heroTitle2')}</span>
              <br />
              <span className="v-h1__dim">{t('heroTitle3')}</span>
            </h1>
            <p className="v-desc">{t('heroDesc')}</p>

            {/* Feature pills */}
            <div className="v-tags">
              {features.map((f, i) => (
                <a href={f.href} key={i} className="v-tag" style={{ '--tag-c': f.c, textDecoration: 'none' } as React.CSSProperties}>
                  <span className="v-tag__ic">{f.icon}</span>
                  {f.label}
                </a>
              ))}
            </div>
          </div>

          {/* ═══ THE CARD ═══ */}
          <div className="v-card-wrap">
            <div className="v-card__border" />
            <form onSubmit={onSubmit} className="v-card">
              <div className="v-card__head">
                <h2>{t('loginTitle')}</h2>
                <p>{t('loginSub')}</p>
              </div>

              {/* Username */}
              <div className={`v-inp ${focusField === 'user' ? 'v-inp--focus' : ''}`}>
                <label htmlFor="v-user">{t('username')}</label>
                <div className="v-inp__w">
                  <VCT_Icons.User size={15} className="v-inp__ic" />
                  <input
                    id="v-user" value={form.username}
                    onChange={(e) => set('username', e.target.value)}
                    onFocus={() => setFocusField('user')} onBlur={() => setFocusField(null)}
                    autoFocus required autoComplete="username" placeholder={t('usernamePh')}
                  />
                </div>
              </div>

              {/* Password */}
              <div className={`v-inp ${focusField === 'pw' ? 'v-inp--focus' : ''}`}>
                <div className="v-inp__r">
                  <label htmlFor="v-pw">{t('password')}</label>
                  <a href="/forgot-password" className="v-inp__link">{t('forgot')}</a>
                </div>
                <div className="v-inp__w">
                  <VCT_Icons.Lock size={15} className="v-inp__ic" />
                  <input
                    id="v-pw" type={showPw ? 'text' : 'password'} value={form.password}
                    onChange={(e) => set('password', e.target.value)}
                    onFocus={() => setFocusField('pw')} onBlur={() => setFocusField(null)}
                    required autoComplete="current-password" placeholder={t('passwordPh')}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPw(!showPw)} className="v-inp__eye" aria-label="Toggle">
                    {showPw ? <VCT_Icons.EyeOff size={13} /> : <VCT_Icons.Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="v-ck">
                <input type="checkbox" checked={form.rememberMe ?? false} onChange={(e) => set('rememberMe', e.target.checked)} />
                <span className="v-ck__box"><VCT_Icons.Check size={10} /></span>
                <span>{t('remember')}</span>
              </label>

              {/* Submit */}
              <button type="submit" disabled={loading} className="v-btn">
                <span className="v-btn__shimmer" />
                <span className="v-btn__content">
                  {loading && <span className="v-btn__spin" />}
                  {t('submit')}
                  {!loading && <VCT_Icons.ArrowRight size={16} />}
                </span>
              </button>

              {/* Demo */}
              {IS_DEMO_MODE && (
                <div className="v-demo">
                  {DEMO_ACCOUNTS.map((a) => (
                    <button key={a.username} type="button" onClick={() => setForm((p) => ({ ...p, username: a.username, password: a.password }))} className="v-demo__b">{a.label}</button>
                  ))}
                </div>
              )}

              <p className="v-foot">{t('register')} <a href="/register">{t('registerLink')}</a></p>
            </form>
          </div>

          {/* Stats bar */}
          <div className="v-stats">
            <a href="/public/provinces" className="v-st" style={{ textDecoration: 'none' }}><strong>{t('stat1v')}</strong><span>{t('stat1l')}</span></a>
            <div className="v-st__d" />
            <a href="/public/clubs" className="v-st" style={{ textDecoration: 'none' }}><strong>{t('stat2v')}</strong><span>{t('stat2l')}</span></a>
            <div className="v-st__d" />
            <a href="/public/members" className="v-st" style={{ textDecoration: 'none' }}><strong>{t('stat3v')}</strong><span>{t('stat3l')}</span></a>
          </div>
        </main>

        <footer className="v-copy">© 2026 VCT Platform</footer>
        <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast((p) => ({ ...p, show: false }))} />
      </div>
    </>
  )
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

/* ══════ TOKENS ══════ */
.v--d {
  --bg: #07090f;
  --tx: #94a3b8;
  --tx-s: #e2e8f0;
  --tx-m: #475569;
  --glass: rgba(255,255,255,0.03);
  --glass2: rgba(255,255,255,0.05);
  --glass-h: rgba(255,255,255,0.07);
  --brd: rgba(255,255,255,0.06);
  --brd-h: rgba(16,185,129,0.3);
  --card-bg: rgba(10,16,30,0.7);
  --card-brd: rgba(255,255,255,0.08);
  --card-glow: rgba(16,185,129,0.04);
  --inp-bg: rgba(255,255,255,0.04);
  --inp-brd: rgba(255,255,255,0.08);
  --inp-f: rgba(16,185,129,0.5);
  --inp-ring: rgba(16,185,129,0.08);
  --inp-tx: #f1f5f9;
  --ph: rgba(148,163,184,0.35);
  --aurora-1: rgba(16,185,129,0.07);
  --aurora-2: rgba(56,189,248,0.05);
  --aurora-3: rgba(168,85,247,0.04);
  --nav-bg: rgba(7,9,15,0.6);
}
.v--l {
  --bg: #f0f2f5;
  --tx: #64748b;
  --tx-s: #0f172a;
  --tx-m: #94a3b8;
  --glass: rgba(255,255,255,0.5);
  --glass2: rgba(255,255,255,0.6);
  --glass-h: rgba(255,255,255,0.8);
  --brd: rgba(15,23,42,0.06);
  --brd-h: rgba(16,185,129,0.25);
  --card-bg: rgba(255,255,255,0.7);
  --card-brd: rgba(15,23,42,0.06);
  --card-glow: rgba(16,185,129,0.02);
  --inp-bg: rgba(255,255,255,0.9);
  --inp-brd: #e2e8f0;
  --inp-f: #10b981;
  --inp-ring: rgba(16,185,129,0.12);
  --inp-tx: #0f172a;
  --ph: #94a3b8;
  --aurora-1: rgba(16,185,129,0.06);
  --aurora-2: rgba(59,130,246,0.04);
  --aurora-3: rgba(168,85,247,0.03);
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

/* ══════ ANIMATED BG ══════ */
.v-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
.v-bg__aurora {
  position: absolute; border-radius: 50%; filter: blur(120px);
  will-change: transform; animation: aurora 25s ease-in-out infinite;
}
.v-bg__aurora:first-child {
  width: 60vw; height: 60vh; top: -20%; left: -10%;
  background: var(--aurora-1);
}
.v-bg__aurora--2 {
  width: 50vw; height: 50vh; bottom: -15%; right: -5%;
  background: var(--aurora-2);
  animation-delay: -8s; animation-duration: 30s;
}
.v-bg__aurora--3 {
  width: 40vw; height: 40vh; top: 30%; right: 20%;
  background: var(--aurora-3);
  animation-delay: -15s; animation-duration: 22s;
}
@keyframes aurora {
  0%,100% { transform: translate(0,0) rotate(0deg) scale(1); }
  33% { transform: translate(30px,-40px) rotate(5deg) scale(1.08); }
  66% { transform: translate(-20px,25px) rotate(-3deg) scale(0.95); }
}
.v-bg__noise {
  position: absolute; inset: 0; opacity: 0.025;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E");
  background-size: 200px;
}
.v--l .v-bg__noise { opacity: 0.015; }
.v-bg__grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(var(--brd) 1px, transparent 1px), linear-gradient(90deg, var(--brd) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 50% 50% at 50% 50%, black, transparent 70%);
  opacity: 0.4;
}
.v-bg__vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 50%, var(--bg) 100%);
}

/* ══════ NAV ══════ */
.v-nav {
  position: relative; z-index: 10;
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 28px; background: var(--nav-bg);
  backdrop-filter: blur(20px) saturate(1.3);
  -webkit-backdrop-filter: blur(20px) saturate(1.3);
  border-bottom: 1px solid var(--brd);
}
.v-nav__l { display: flex; align-items: center; gap: 10px; }
.v-nav__logo-w {
  display: flex; padding: 2px; border-radius: 8px;
  background: linear-gradient(135deg, rgba(16,185,129,0.2), rgba(56,189,248,0.15));
}
.v-nav__brand { font-size: 14px; font-weight: 800; color: var(--tx-s); letter-spacing: -0.03em; }
.v-nav__badge {
  font-size: 10px; font-weight: 600; color: var(--tx-m);
  padding: 3px 8px; border-radius: 6px;
  background: var(--glass); border: 1px solid var(--brd);
  display: none;
}
@media (min-width: 768px) { .v-nav__badge { display: inline-flex; } }
.v-nav__r { display: flex; align-items: center; gap: 6px; }

.v-pill {
  display: flex; border-radius: 9px; overflow: hidden;
  border: 1px solid var(--brd); background: var(--glass);
  cursor: pointer; padding: 0; transition: border-color 0.3s;
}
.v-pill:hover { border-color: var(--brd-h); }
.v-pill__o {
  padding: 6px 11px; font-size: 10.5px; font-weight: 700;
  letter-spacing: 0.06em; color: var(--tx-m); transition: all 0.25s;
}
.v-pill__o--a { color: var(--tx-s); background: rgba(16,185,129,0.12); }
.v--l .v-pill__o--a { color: #059669; }

.v-tb {
  display: flex; align-items: center; justify-content: center;
  width: 32px; height: 32px; border-radius: 9px;
  border: 1px solid var(--brd); background: var(--glass);
  color: var(--tx-m); cursor: pointer; transition: all 0.25s;
}
.v-tb:hover { border-color: var(--brd-h); color: var(--tx-s); background: var(--glass-h); }

/* ══════ CENTER ══════ */
.v-center {
  position: relative; z-index: 1; flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 32px 20px 16px; gap: 28px;
}
@media (min-width: 960px) {
  .v-center {
    flex-direction: row; gap: 56px;
    padding: 24px 48px 16px;
  }
}

/* ══════ HERO ══════ */
.v-hero {
  display: flex; flex-direction: column;
  align-items: center; text-align: center;
  gap: 16px; max-width: 420px;
  animation: up 0.5s ease-out both;
}
@media (min-width: 960px) {
  .v-hero { align-items: flex-start; text-align: left; }
}

/* Logo with rings */
.v-logo { position: relative; width: 72px; height: 72px; }
.v-logo__ring {
  position: absolute; inset: -12px; border-radius: 50%;
  border: 1px solid rgba(16,185,129,0.15);
  animation: ringPulse 4s ease-in-out infinite;
}
.v-logo__ring--2 {
  inset: -24px;
  border-color: rgba(16,185,129,0.08);
  animation-delay: -2s;
}
@keyframes ringPulse {
  0%,100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.06); }
}
.v-logo__img {
  position: relative; z-index: 1;
  border-radius: 16px; object-fit: contain;
  filter: drop-shadow(0 0 30px rgba(16,185,129,0.2));
}

.v-h1 {
  margin: 0; font-size: clamp(1.5rem, 3vw, 2.2rem);
  font-weight: 900; line-height: 1.15; letter-spacing: -0.04em;
  color: var(--tx-s);
}
.v-h1__glow {
  background: linear-gradient(135deg, #10b981 0%, #22d3ee 50%, #818cf8 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
  background-size: 200% auto;
  animation: shimText 4s linear infinite;
}
@keyframes shimText {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}
.v-h1__dim { color: var(--tx-m); font-weight: 700; }
.v-desc {
  margin: 0; font-size: 13px; line-height: 1.75; color: var(--tx);
  max-width: 380px;
  animation: up 0.5s ease-out 0.1s both;
}

/* Tags */
.v-tags {
  display: flex; flex-wrap: wrap; gap: 6px;
  animation: up 0.5s ease-out 0.2s both;
}
.v-tag {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 20px;
  font-size: 11px; font-weight: 600; color: var(--tx-s);
  background: var(--glass2); border: 1px solid var(--brd);
  transition: all 0.3s;
}
.v-tag:hover { border-color: var(--brd-h); background: var(--glass-h); transform: translateY(-1px); }
.v-tag__ic { display: flex; color: var(--tag-c); }

/* ══════ CARD ══════ */
.v-card-wrap {
  position: relative; width: 100%; max-width: 400px;
  animation: cardIn 0.6s ease-out 0.15s both;
}

/* Animated gradient border */
.v-card__border {
  position: absolute; inset: -1px; border-radius: 25px;
  background: conic-gradient(from 0deg, transparent 0%, rgba(16,185,129,0.3) 10%, transparent 20%, rgba(56,189,248,0.2) 40%, transparent 50%, rgba(168,85,247,0.2) 70%, transparent 80%, rgba(16,185,129,0.3) 100%);
  animation: borderSpin 8s linear infinite;
  opacity: 0.5;
  mask-image: linear-gradient(#000, #000) content-box, linear-gradient(#000, #000);
  mask-composite: xor; -webkit-mask-composite: xor;
  padding: 1px;
}
.v--l .v-card__border { opacity: 0.35; }
@keyframes borderSpin { to { transform: rotate(360deg); } }

.v-card {
  position: relative;
  display: flex; flex-direction: column; gap: 16px;
  padding: 32px 28px;
  border-radius: 24px;
  background: var(--card-bg);
  backdrop-filter: blur(40px) saturate(1.5);
  -webkit-backdrop-filter: blur(40px) saturate(1.5);
  box-shadow:
    0 0 60px -20px var(--card-glow),
    0 25px 60px -15px rgba(0,0,0,0.2),
    inset 0 1px 0 rgba(255,255,255,0.06);
  transition: box-shadow 0.4s ease, transform 0.4s ease;
}
.v-card:hover {
  box-shadow:
    0 0 80px -10px rgba(16,185,129,0.15),
    0 30px 80px -15px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.08);
  transform: translateY(-2px);
}
.v--l .v-card {
  box-shadow:
    0 0 60px -20px var(--card-glow),
    0 25px 60px -15px rgba(0,0,0,0.05),
    inset 0 1px 0 rgba(255,255,255,0.5);
}
.v--l .v-card:hover {
  box-shadow:
    0 0 80px -10px rgba(16,185,129,0.1),
    0 30px 80px -15px rgba(0,0,0,0.1),
    inset 0 1px 0 rgba(255,255,255,0.6);
}

.v-card__head h2 { margin: 0; font-size: 22px; font-weight: 800; color: var(--tx-s); letter-spacing: -0.03em; }
.v-card__head p { margin: 4px 0 0; font-size: 12.5px; color: var(--tx); }

/* ── Inputs ── */
.v-inp { display: flex; flex-direction: column; gap: 5px; transition: all 0.3s; }
.v-inp label { font-size: 11.5px; font-weight: 650; color: var(--tx); transition: color 0.3s; }
.v-inp--focus label { color: var(--vct-success); }
.v-inp__r { display: flex; justify-content: space-between; align-items: center; }
.v-inp__link { font-size: 10.5px; font-weight: 600; color: var(--vct-success); text-decoration: none; }
.v-inp__link:hover { color: var(--vct-success); }
.v-inp__w { position: relative; display: flex; align-items: center; }
.v-inp__ic { position: absolute; left: 13px; color: var(--tx-m); pointer-events: none; z-index: 2; transition: color 0.3s; }
.v-inp--focus .v-inp__ic { color: var(--vct-success); }
.v-inp__w input {
  width: 100%; padding: 11px 14px 11px 38px;
  border-radius: 14px;
  border: 1px solid var(--inp-brd);
  background: var(--inp-bg);
  color: var(--inp-tx);
  font-family: inherit; font-size: 13.5px; font-weight: 500;
  outline: none; transition: all 0.3s ease;
}
.v-inp__w input::placeholder { color: var(--ph); }
.v-inp__w input:focus {
  border-color: var(--inp-f);
  box-shadow: 0 0 0 3px var(--inp-ring), 0 4px 16px -4px rgba(16,185,129,0.1);
  background: var(--glass-h);
}
.v-inp__eye {
  position: absolute; right: 10px; z-index: 2;
  display: flex; background: none; border: none;
  color: var(--tx-m); cursor: pointer;
  padding: 5px; border-radius: 8px; transition: all 0.2s;
}
.v-inp__eye:hover { color: var(--tx-s); background: var(--glass-h); }

/* ── Checkbox ── */
.v-ck {
  display: flex; align-items: center; gap: 8px;
  cursor: pointer; user-select: none;
  font-size: 12px; color: var(--tx);
}
.v-ck input { position: absolute; opacity: 0; width: 0; height: 0; }
.v-ck__box {
  display: flex; align-items: center; justify-content: center;
  width: 16px; height: 16px; border-radius: 5px;
  border: 1.5px solid var(--inp-brd);
  background: var(--inp-bg);
  color: transparent; transition: all 0.25s;
}
.v-ck input:checked + .v-ck__box {
  background: linear-gradient(135deg, #10b981, #0d9488);
  border-color: var(--vct-success); color: var(--vct-bg-elevated);
}

/* ── Submit ── */
.v-btn {
  position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  width: 100%; padding: 12px 20px;
  border-radius: 14px; border: none;
  background: linear-gradient(135deg, #059669 0%, #0d9488 40%, #0284c7 80%, #6366f1 100%);
  background-size: 200% auto;
  color: var(--vct-bg-elevated); font-family: inherit;
  font-size: 14px; font-weight: 700; letter-spacing: -0.01em;
  cursor: pointer; transition: all 0.4s ease;
  box-shadow: 0 4px 24px -4px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.15);
}
.v-btn__shimmer {
  position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
  animation: shimmer 3s ease-in-out infinite;
}
@keyframes shimmer {
  0% { left: -100%; }
  50%,100% { left: 100%; }
}
.v-btn__content { position: relative; z-index: 1; display: flex; align-items: center; gap: 8px; }
.v-btn:hover {
  background-position: right center;
  transform: translateY(-2px);
  box-shadow: 0 8px 32px -6px rgba(5,150,105,0.45), inset 0 1px 0 rgba(255,255,255,0.2);
}
.v-btn:active { transform: translateY(0); }
.v-btn:disabled { cursor: not-allowed; opacity: 0.5; transform: none !important; }
.v-btn__spin {
  width: 15px; height: 15px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: var(--vct-bg-elevated); border-radius: 50%;
  animation: spin 0.55s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Demo */
.v-demo {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding: 8px; border-radius: 12px;
  border: 1px solid rgba(245,158,11,0.15); background: rgba(245,158,11,0.03);
}
.v-demo__b {
  flex: 1; min-width: 55px; padding: 6px; border-radius: 8px;
  border: 1px solid var(--brd); background: var(--glass);
  color: var(--tx-s); font-family: inherit; font-size: 10.5px; font-weight: 600;
  cursor: pointer; transition: all 0.2s;
}
.v-demo__b:hover { background: var(--glass-h); border-color: rgba(245,158,11,0.25); }

.v-foot { margin: 0; text-align: center; font-size: 12px; color: var(--tx); }
.v-foot a { font-weight: 700; color: var(--vct-success); text-decoration: none; }
.v-foot a:hover { color: var(--vct-success); text-decoration: underline; }

/* ── Stats ── */
.v-stats {
  display: flex; align-items: center; gap: 20px;
  padding: 14px 28px; border-radius: 16px;
  background: var(--glass); border: 1px solid var(--brd);
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
  animation: up 0.5s ease-out 0.35s both;
}
.v-st { text-align: center; color: var(--tx-s); transition: transform 0.2s; display: block; }
.v-st:hover { transform: scale(1.05); }
.v-st strong { display: block; font-size: 17px; font-weight: 900; color: inherit; letter-spacing: -0.03em; }
.v-st span { display: block; font-size: 9px; color: var(--tx-m); text-transform: uppercase; letter-spacing: 0.08em; margin-top: 2px; font-weight: 600; }
.v-st__d { width: 1px; height: 22px; background: var(--brd); }

/* ── Footer ── */
.v-copy {
  position: relative; z-index: 1;
  text-align: center; padding: 8px 20px 14px;
  font-size: 10.5px; color: var(--tx-m); letter-spacing: 0.01em;
}

/* ── Animations ── */
@keyframes up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
@keyframes cardIn { from { opacity: 0; transform: translateY(16px) scale(0.97); } to { opacity: 1; transform: translateY(0) scale(1); } }

/* ══════ RESPONSIVE ══════ */
@media (max-width: 959px) {
  .v-center { padding: 20px 16px 8px; gap: 20px; }
  .v-hero { gap: 12px; }
  .v-logo { width: 56px; height: 56px; }
  .v-logo__img { width: 56px !important; height: 56px !important; }
  .v-logo__ring { inset: -8px; }
  .v-logo__ring--2 { inset: -16px; }
  .v-h1 { font-size: 1.35rem; }
  .v-card-wrap { max-width: 420px; }
  .v-card { padding: 24px 20px; }
}
@media (max-width: 480px) {
  .v-tags { justify-content: center; }
  .v-stats { gap: 14px; padding: 10px 20px; }
}
`
