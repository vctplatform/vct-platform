'use client'

import * as React from 'react'
import { VCT_PageContainer, VCT_StatRow, VCT_Toast } from '../../components/vct-ui'
import type { StatItem } from '../../components/VCT_StatRow'
import { useAdminToast } from '../hooks/useAdminToast'
import { AdminBreadcrumb } from './AdminBreadcrumb'
import type { BreadcrumbItem } from './AdminBreadcrumb'

// ════════════════════════════════════════
// AdminPageShell — Consistent layout wrapper for all admin pages
// ════════════════════════════════════════

interface AdminPageShellProps {
    /** Page title (h1) */
    title: string
    /** Page subtitle/description */
    subtitle?: string
    /** Title icon element */
    icon?: React.ReactNode
    /** Action buttons displayed in header */
    actions?: React.ReactNode
    /** Status indicators displayed in header */
    statusBar?: React.ReactNode
    /** Statistical summary items */
    stats?: StatItem[]
    /** Breadcrumb navigation items */
    breadcrumbs?: BreadcrumbItem[]
    /** Page content */
    children: React.ReactNode
    /** Additional class for the container */
    className?: string
}

/**
 * Shared admin page shell. Provides:
 * - Breadcrumb navigation (optional)
 * - Consistent header (title + icon + subtitle + actions)
 * - Optional status bar (alerts, live indicators)
 * - Optional stat row
 * - Toast notification integration
 * - VCT_PageContainer with "wide" size + animation
 */
export const AdminPageShell: React.FC<AdminPageShellProps> = ({
    title,
    subtitle,
    icon,
    actions,
    statusBar,
    stats,
    breadcrumbs,
    children,
    className = '',
}) => {
    const { toast, showToast, dismiss } = useAdminToast()

    return (
        <AdminPageShellContext.Provider value={{ showToast }}>
            <VCT_PageContainer size="wide" animated>
                {/* ── Breadcrumbs ── */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <AdminBreadcrumb items={breadcrumbs} />
                )}

                {/* ── Header Row ── */}
                <div className={`mb-6 ${className}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary) flex items-center gap-3">
                                {icon}
                                {title}
                            </h1>
                            {subtitle && (
                                <p className="text-sm text-(--vct-text-secondary) mt-1">{subtitle}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {statusBar}
                            {actions}
                        </div>
                    </div>
                </div>

                {/* ── Toast ── */}
                <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={dismiss} />

                {/* ── Stats ── */}
                {stats && stats.length > 0 && (
                    <VCT_StatRow items={stats} className="mb-6" />
                )}

                {/* ── Content ── */}
                {children}
            </VCT_PageContainer>
        </AdminPageShellContext.Provider>
    )
}

// ── Context for child components to access showToast ──
interface AdminPageShellContextValue {
    showToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void
}

const AdminPageShellContext = React.createContext<AdminPageShellContextValue>({
    showToast: () => {},
})

/** Hook to access the AdminPageShell toast function from child components */
export const useShellToast = () => React.useContext(AdminPageShellContext)
