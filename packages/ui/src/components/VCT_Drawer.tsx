'use client'

import { useRef, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ────────────────────────────────────────────
 *  VCT_Drawer
 *  Side panel overlay with focus trap, backdrop dismiss,
 *  Escape-to-close, and slide animation.
 * ──────────────────────────────────────────── */

export interface VCT_DrawerProps {
    /** Whether the drawer is open */
    isOpen: boolean
    /** Close handler */
    onClose: () => void
    /** Optional header title */
    title?: ReactNode
    /** Drawer body content */
    children: ReactNode
    /** Slide-in direction */
    position?: 'left' | 'right'
    /** Panel width */
    width?: string | number
    /** Optional footer content */
    footer?: ReactNode
}

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'

export function VCT_Drawer({
    isOpen,
    onClose,
    title,
    children,
    position = 'right',
    width = 480,
    footer,
}: VCT_DrawerProps) {
    const drawerRef = useRef<HTMLDivElement>(null)

    // Focus trap
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose()
                return
            }
            if (e.key !== 'Tab') return
            const el = drawerRef.current
            if (!el) return
            const focusable = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE))
            if (focusable.length === 0) return
            const first = focusable[0]!
            const last = focusable[focusable.length - 1]!
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last.focus() }
            } else {
                if (document.activeElement === last) { e.preventDefault(); first.focus() }
            }
        },
        [onClose],
    )

    useEffect(() => {
        if (!isOpen) return
        document.addEventListener('keydown', handleKeyDown)
        // Focus first focusable element
        requestAnimationFrame(() => {
            const el = drawerRef.current
            if (el) {
                const first = el.querySelector<HTMLElement>(FOCUSABLE)
                first?.focus()
            }
        })
        // Prevent body scroll
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = prev
        }
    }, [isOpen, handleKeyDown])

    const slideX = position === 'right' ? '100%' : '-100%'
    const panelWidth = typeof width === 'number' ? `${width}px` : width

    const panelStyle: CSSProperties = {
        position: 'fixed',
        top: 0,
        bottom: 0,
        [position]: 0,
        width: panelWidth,
        maxWidth: '100vw',
        zIndex: 300,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--vct-bg-elevated)',
        borderLeft: position === 'right' ? '1px solid var(--vct-border-subtle)' : undefined,
        borderRight: position === 'left' ? '1px solid var(--vct-border-subtle)' : undefined,
        boxShadow: 'var(--vct-shadow-xl)',
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        key="drawer-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={onClose}
                        aria-hidden="true"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 300,
                            background: 'rgba(0,0,0,0.45)',
                        }}
                    />
                    {/* Panel */}
                    <motion.div
                        key="drawer-panel"
                        ref={drawerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={typeof title === 'string' ? title : 'Drawer'}
                        initial={{ x: slideX }}
                        animate={{ x: 0 }}
                        exit={{ x: slideX }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        style={panelStyle}
                    >
                        {/* Header */}
                        {title && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--vct-border-subtle)',
                                    flexShrink: 0,
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 'var(--vct-font-lg)',
                                        fontWeight: 700,
                                        color: 'var(--vct-text-primary)',
                                    }}
                                >
                                    {title}
                                </span>
                                <button
                                    onClick={onClose}
                                    aria-label="Đóng"
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 36,
                                        height: 36,
                                        border: 'none',
                                        borderRadius: 'var(--vct-radius-sm)',
                                        background: 'transparent',
                                        color: 'var(--vct-text-tertiary)',
                                        cursor: 'pointer',
                                        fontSize: 20,
                                        transition: 'background var(--vct-duration-fast) ease',
                                    }}
                                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vct-bg-hover)' }}
                                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                        {/* Body */}
                        <div
                            className="vct-hide-scrollbar"
                            style={{ flex: 1, overflowY: 'auto', padding: '20px' }}
                        >
                            {children}
                        </div>
                        {/* Footer */}
                        {footer && (
                            <div
                                style={{
                                    padding: '12px 20px',
                                    borderTop: '1px solid var(--vct-border-subtle)',
                                    flexShrink: 0,
                                }}
                            >
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
