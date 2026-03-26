'use client'

import { useState, useRef, useEffect, type ReactNode, type CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_Tooltip
 *  Lightweight tooltip with position variants + arrow.
 *  Pure CSS animations, no external deps.
 * ──────────────────────────────────────────── */

export interface VCT_TooltipProps {
    /** The content shown inside the tooltip bubble */
    content: ReactNode
    /** The trigger element that the tooltip wraps */
    children: ReactNode
    /** Tooltip placement */
    position?: 'top' | 'bottom' | 'left' | 'right'
    /** Delay before showing (ms) */
    delay?: number
    /** Additional class */
    className?: string
}

export function VCT_Tooltip({
    content,
    children,
    position = 'top',
    delay = 200,
    className,
}: VCT_TooltipProps) {
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const show = () => {
        timerRef.current = setTimeout(() => setVisible(true), delay)
    }
    const hide = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setVisible(false)
    }

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

    const positionStyles: Record<string, CSSProperties> = {
        top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: 8 },
        bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: 8 },
        left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: 8 },
        right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: 8 },
    }

    return (
        <span
            className={className}
            style={{ position: 'relative', display: 'inline-flex' }}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
        >
            {children}
            {visible && (
                <span
                    role="tooltip"
                    style={{
                        position: 'absolute',
                        ...positionStyles[position],
                        zIndex: 600,
                        padding: '6px 10px',
                        borderRadius: 'var(--vct-radius-sm)',
                        background: 'var(--vct-bg-elevated)',
                        color: 'var(--vct-text-primary)',
                        fontSize: 'var(--vct-font-xs)',
                        fontWeight: 500,
                        boxShadow: 'var(--vct-shadow-lg)',
                        border: '1px solid var(--vct-border-subtle)',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        animation: 'vct-scale-in 0.15s var(--vct-ease-out) both',
                    }}
                >
                    {content}
                </span>
            )}
        </span>
    )
}
