'use client'

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
    size = 18,
    className = '',
}: VCT_NotificationBellProps) {
    return (
        <button
            className={`group relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-vct-border bg-vct-elevated text-vct-text-muted transition hover:border-vct-accent hover:text-vct-text ${className}`}
            onClick={onClick}
            aria-label={`Thông báo${count > 0 ? ` (${count} chưa đọc)` : ''}`}
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
                <span className="absolute -right-1 -top-1 flex min-w-[18px] items-center justify-center rounded-full bg-(--vct-danger) px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_0_2px_var(--vct-bg-elevated)] animate-pulse">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </button>
    )
}
