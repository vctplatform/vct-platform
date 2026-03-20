'use client'

/**
 * Legacy barrel re-export for backward compatibility.
 *
 * All overlay components now live in domain-split files:
 *   - vct-ui-overlay.tsx  → Modal, Toast, ConfirmDialog, LoadingOverlay
 *   - vct-ui-layout.tsx   → Button, Card, Grid, Stack
 *   - vct-ui-form.tsx     → Input, Select, etc.
 *
 * This file exists so that older test assertions and any remaining
 * imports continue to resolve without breaking CI.
 */

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'

/* ── Re-exports ───────────────────────────────────────────────── */

export {
    VCT_LoadingOverlay,
    VCT_ConfirmDialog,
    VCTLoadingOverlay,
    VCTConfirmDialog,
} from './vct-ui-overlay'

export type {
    VCTModalProps,
    VCTToastProps,
    VCTLoadingOverlayProps,
    VCTConfirmDialogProps,
} from './vct-ui-overlay'

/* ── Legacy Modal Wrapper ─────────────────────────────────────── */

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: React.ReactNode
    children?: React.ReactNode
    footer?: React.ReactNode
    width?: string | number
}

/**
 * Legacy Modal component — wraps VCT_Modal with backward-compatible API.
 */
export function VCT_Modal({ isOpen, onClose, title, children, footer, width = '600px' }: ModalProps) {
    const titleId = React.useId()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => { setMounted(true) }, [])

    React.useEffect(() => {
        if (!isOpen) return
        const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
        window.addEventListener('keydown', h)
        return () => window.removeEventListener('keydown', h)
    }, [isOpen, onClose])

    if (!mounted) return null

    return createPortal(
        <AnimatePresence>
            {isOpen ? (
                <>
                    <motion.button
                        type="button" aria-label="Close" onClick={onClose}
                        className="fixed inset-0 z- border-none bg-slate-950/50"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    />
                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={title ? titleId : undefined}
                        className="fixed left-1/2 top-1/2 z- w-[calc(100vw-24px)] max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-vct-border bg-vct-elevated shadow-(--vct-shadow-xl)"
                        style={{ maxWidth: width }}
                        initial={{ opacity: 0, scale: 0.97, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.97, y: 12 }}
                        transition={{ duration: 0.2 }}
                    >
                        <header className="flex items-center justify-between border-b border-vct-border px-4 py-3">
                            <h3 id={titleId} className="m-0 text-base font-black text-vct-text">{title}</h3>
                            <button type="button" onClick={onClose} className="rounded-md px-2 py-1 text-sm font-bold text-vct-text-muted hover:bg-vct-input hover:text-vct-text">×</button>
                        </header>
                        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-4 py-4">{children}</div>
                        {footer ? <footer className="border-t border-vct-border px-4 py-3">{footer}</footer> : null}
                    </motion.div>
                </>
            ) : null}
        </AnimatePresence>,
        document.body,
    )
}

/* ── Legacy Toast Wrapper ─────────────────────────────────────── */

interface ToastProps {
    isVisible: boolean
    message: React.ReactNode
    type?: 'success' | 'warning' | 'error' | 'info'
    onClose?: () => void
    durationMs?: number
}

const TONE: Record<string, string> = {
    success: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-600',
    warning: 'border-amber-500/35 bg-amber-500/10 text-amber-600',
    error: 'border-red-500/35 bg-red-500/10 text-red-600',
    info: 'border-sky-500/35 bg-sky-500/10 text-sky-600',
}

export function VCT_Toast({ isVisible, message, type = 'success', onClose, durationMs = 3200 }: ToastProps) {
    React.useEffect(() => {
        if (!isVisible || !onClose || durationMs <= 0) return
        const t = window.setTimeout(onClose, durationMs)
        return () => window.clearTimeout(t)
    }, [durationMs, isVisible, onClose])

    return (
        <AnimatePresence>
            {isVisible ? (
                <motion.div
                    role="status"
                    aria-live="polite"
                    className={`fixed bottom-4 right-4 z- max-w-[420px] rounded-xl border px-3 py-2 text-sm font-semibold shadow-(--vct-shadow-lg) ${TONE[type] || TONE.success}`}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                >
                    <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-current" />
                        <div className="flex-1">{message}</div>
                        {onClose ? (
                            <button type="button" aria-label="Close toast" onClick={onClose} className="rounded px-1.5 py-0.5 text-xs font-black hover:bg-black/5">×</button>
                        ) : null}
                    </div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    )
}

/* ── Aliases for backward compat ──────────────────────────────── */
export const VCTModal = VCT_Modal
export const VCTToast = VCT_Toast
