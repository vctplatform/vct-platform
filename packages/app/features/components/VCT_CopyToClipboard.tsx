'use client'
import * as React from 'react'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface VCTCopyToClipboardProps {
    /** Text to copy */
    text: string
    /** What shows to the user (defaults to the text itself) */
    children?: ReactNode
    /** Label for the "copied" feedback */
    copiedLabel?: string
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_CopyToClipboard = ({
    text,
    children,
    copiedLabel = 'Đã sao chép!',
    className,
}: VCTCopyToClipboardProps) => {
    const [copied, setCopied] = React.useState(false)
    const timerRef = React.useRef<number | undefined>()

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            window.clearTimeout(timerRef.current)
            timerRef.current = window.setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback for older browsers
            const el = document.createElement('textarea')
            el.value = text
            el.style.position = 'fixed'
            el.style.opacity = '0'
            document.body.appendChild(el)
            el.select()
            document.execCommand('copy')
            document.body.removeChild(el)
            setCopied(true)
            window.clearTimeout(timerRef.current)
            timerRef.current = window.setTimeout(() => setCopied(false), 2000)
        }
    }

    React.useEffect(() => () => window.clearTimeout(timerRef.current), [])

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={copied ? copiedLabel : `Sao chép: ${text}`}
            className={cn(
                'group inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-semibold transition',
                'text-vct-text hover:bg-vct-input active:scale-95',
                className ?? ''
            )}
        >
            {children ?? (
                <span className="truncate max-w-[240px] font-mono text-xs">
                    {text}
                </span>
            )}

            {/* Icon */}
            {copied ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-emerald-500 shrink-0">
                    <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            ) : (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-vct-text-muted group-hover:text-vct-text shrink-0 transition">
                    <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 11V3.5C3 2.67 3.67 2 4.5 2H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
            )}

            {/* Copied tooltip */}
            {copied ? (
                <span className="absolute -top-7 left-1/2 -translate-x-1/2 rounded-md bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg whitespace-nowrap">
                    {copiedLabel}
                </span>
            ) : null}
        </button>
    )
}

export const VCTCopyToClipboard = VCT_CopyToClipboard as FC<VCTCopyToClipboardProps>
