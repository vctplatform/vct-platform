'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type PopoverPlacement = 'top' | 'bottom' | 'left' | 'right'

export interface VCTPopoverProps {
    /** Trigger element (wrapped in a container) */
    trigger: ReactNode
    /** Popover body */
    content: ReactNode
    /** Preferred placement relative to trigger */
    placement?: PopoverPlacement
    /** Controlled open state */
    isOpen?: boolean
    /** Callback when requesting close */
    onClose?: () => void
    /** Open on click instead of controlled mode */
    openOnClick?: boolean
    /** Width of the popover panel */
    width?: string | number
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Placement helpers                                                  */
/* ------------------------------------------------------------------ */

const PLACEMENT_CLASS: Record<PopoverPlacement, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const MOTION_ORIGIN: Record<PopoverPlacement, { x: number; y: number }> = {
    top: { x: 0, y: 6 },
    bottom: { x: 0, y: -6 },
    left: { x: 6, y: 0 },
    right: { x: -6, y: 0 },
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_Popover = ({
    trigger,
    content,
    placement = 'bottom',
    isOpen: controlledOpen,
    onClose,
    openOnClick = true,
    width = 'auto',
    className,
}: VCTPopoverProps) => {
    const [internalOpen, setInternalOpen] = React.useState(false)
    const containerRef = React.useRef<HTMLDivElement>(null)

    const isControlled = controlledOpen !== undefined
    const isOpen = isControlled ? controlledOpen : internalOpen

    /* Click-outside detection */
    React.useEffect(() => {
        if (!isOpen) return
        const handler = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                if (isControlled) {
                    onClose?.()
                } else {
                    setInternalOpen(false)
                }
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [isOpen, isControlled, onClose])

    /* Escape key */
    React.useEffect(() => {
        if (!isOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (isControlled) {
                    onClose?.()
                } else {
                    setInternalOpen(false)
                }
            }
        }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [isOpen, isControlled, onClose])

    const handleToggle = () => {
        if (!openOnClick) return
        if (isControlled) {
            if (isOpen) onClose?.()
        } else {
            setInternalOpen((prev) => !prev)
        }
    }

    const origin = MOTION_ORIGIN[placement]

    return (
        <div ref={containerRef} className={cn('relative inline-flex', className ?? '')}>
            {/* Trigger */}
            <div
                onClick={handleToggle}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleToggle()
                    }
                }}
                className="inline-flex"
            >
                {trigger}
            </div>

            {/* Popover panel */}
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ opacity: 0, x: origin.x, y: origin.y, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: origin.x, y: origin.y, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className={cn(
                            'absolute z-50',
                            PLACEMENT_CLASS[placement]
                        )}
                        style={{ width }}
                    >
                        <div className="rounded-xl border border-vct-border bg-vct-elevated shadow-xl ring-1 ring-black/5">
                            {content}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>
        </div>
    )
}

export const VCTPopover = VCT_Popover as FC<VCTPopoverProps>
