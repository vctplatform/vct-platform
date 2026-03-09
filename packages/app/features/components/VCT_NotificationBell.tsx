'use client'

import type { CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_NotificationBell
 *  Header bell icon with unread badge count
 *  and pulse animation when count > 0.
 * ──────────────────────────────────────────── */

export interface VCT_NotificationBellProps {
    /** Number of unread notifications */
    count: number
    /** Click handler (opens notification drawer) */
    onClick: () => void
    /** Custom icon size */
    size?: number
    className?: string
}

export function VCT_NotificationBell({
    count,
    onClick,
    size = 20,
    className,
}: VCT_NotificationBellProps) {
    const badgeStyle: CSSProperties = {
        position: 'absolute',
        top: -4,
        right: -4,
        minWidth: 18,
        height: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 'var(--vct-radius-full)',
        background: 'var(--vct-danger)',
        color: '#fff',
        fontSize: 10,
        fontWeight: 700,
        padding: '0 4px',
        lineHeight: 1,
        boxShadow: '0 0 0 2px var(--vct-bg-elevated)',
        animation: count > 0 ? 'vct-pulse 2s infinite' : undefined,
    }

    return (
        <button
            className={className}
            onClick={onClick}
            aria-label={`Thông báo${count > 0 ? ` (${count} chưa đọc)` : ''}`}
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 'var(--vct-radius-md)',
                border: 'none',
                background: 'transparent',
                color: 'var(--vct-text-secondary)',
                cursor: 'pointer',
                transition: 'background var(--vct-duration-fast) ease, color var(--vct-duration-fast) ease',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--vct-bg-hover)'
                e.currentTarget.style.color = 'var(--vct-text-primary)'
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = 'var(--vct-text-secondary)'
            }}
        >
            {/* Bell SVG (Lucide bell) */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>

            {/* Badge */}
            {count > 0 && (
                <span style={badgeStyle}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    )
}
