'use client'
import type { ReactNode, CSSProperties } from 'react'

// ════════════════════════════════════════════════════════════════
// VCT PAGE TOOLBAR
// Standardized search + filter + action toolbar for list pages
// ════════════════════════════════════════════════════════════════

interface PageToolbarProps {
    /** Left-side slot: search input, filter controls */
    children: ReactNode
    /** Right-side slot: action buttons (export, add, etc.) */
    actions?: ReactNode
    /** Extra CSS className */
    className?: string
    style?: CSSProperties
}

export const VCT_PageToolbar = ({
    children,
    actions,
    className = '',
    style,
}: PageToolbarProps) => (
    <div
        className={`mb-5 flex flex-wrap items-center justify-between gap-3 ${className}`}
        style={style}
    >
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            {children}
        </div>
        {actions && (
            <div className="flex shrink-0 items-center gap-2">
                {actions}
            </div>
        )}
    </div>
)
