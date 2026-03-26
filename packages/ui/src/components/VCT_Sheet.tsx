'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { CSSProperties, FC, ReactNode } from 'react'
import { createPortal } from 'react-dom'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type SheetSide = 'left' | 'right' | 'bottom'

export interface VCTSheetProps {
    /** Whether the sheet is visible */
    isOpen: boolean
    /** Close handler */
    onClose: () => void
    /** Side to slide in from */
    side?: SheetSide
    /** Header title */
    title?: ReactNode
    /** Sheet body */
    children?: ReactNode
    /** Footer content (action buttons) */
    footer?: ReactNode
    /** Width for left/right sheets, height for bottom */
    size?: string | number
    /** Custom class */
    className?: string
    /** Custom style on the panel */
    style?: CSSProperties
}

/* ------------------------------------------------------------------ */
/*  Slide direction config                                             */
/* ------------------------------------------------------------------ */

const SLIDE_CONFIG: Record<
    SheetSide,
    {
        panelClass: string
        initial: Record<string, number | string>
        animate: Record<string, number | string>
        exit: Record<string, number | string>
        sizeStyle: (size: string | number) => CSSProperties
    }
> = {
    right: {
        panelClass: 'fixed inset-y-0 right-0',
        initial: { x: '100%' },
        animate: { x: 0 },
        exit: { x: '100%' },
        sizeStyle: (s) => ({ width: typeof s === 'number' ? `${s}px` : s }),
    },
    left: {
        panelClass: 'fixed inset-y-0 left-0',
        initial: { x: '-100%' },
        animate: { x: 0 },
        exit: { x: '-100%' },
        sizeStyle: (s) => ({ width: typeof s === 'number' ? `${s}px` : s }),
    },
    bottom: {
        panelClass: 'fixed inset-x-0 bottom-0',
        initial: { y: '100%' },
        animate: { y: 0 },
        exit: { y: '100%' },
        sizeStyle: (s) => ({
            height: typeof s === 'number' ? `${s}px` : s,
            maxHeight: '85vh',
        }),
    },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_Sheet = ({
    isOpen,
    onClose,
    side = 'right',
    title,
    children,
    footer,
    size = 420,
    className,
    style,
}: VCTSheetProps) => {
    const config = SLIDE_CONFIG[side]

    /* Escape key */
    React.useEffect(() => {
        if (!isOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [isOpen, onClose])

    /* Lock body scroll */
    React.useEffect(() => {
        if (!isOpen) return
        const prev = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = prev
        }
    }, [isOpen])

    if (typeof document === 'undefined') return null

    return createPortal(
        <AnimatePresence>
            {isOpen ? (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z- bg-black/50 backdrop-blur-sm"
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.aside
                        initial={config.initial}
                        animate={config.animate}
                        exit={config.exit}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className={cn(
                            config.panelClass,
                            'z- flex flex-col bg-vct-bg border-vct-border shadow-2xl',
                            side === 'bottom'
                                ? 'border-t rounded-t-2xl'
                                : side === 'left'
                                    ? 'border-r'
                                    : 'border-l',
                            className ?? ''
                        )}
                        style={{ ...config.sizeStyle(size), ...style }}
                        role="dialog"
                        aria-modal="true"
                    >
                        {/* Header */}
                        {title ? (
                            <div className="flex items-center justify-between border-b border-vct-border px-5 py-4">
                                <h2 className="text-base font-extrabold text-vct-text">
                                    {title}
                                </h2>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    aria-label="Đóng"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-vct-text-muted transition hover:bg-vct-input hover:text-vct-text"
                                >
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M4 4L12 12M12 4L4 12"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                </button>
                            </div>
                        ) : null}

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto px-5 py-4">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer ? (
                            <div className="border-t border-vct-border px-5 py-3">
                                {footer}
                            </div>
                        ) : null}
                    </motion.aside>
                </>
            ) : null}
        </AnimatePresence>,
        document.body
    )
}

export const VCTSheet = VCT_Sheet as FC<VCTSheetProps>
