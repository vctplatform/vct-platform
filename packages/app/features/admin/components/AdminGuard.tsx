'use client'

import * as React from 'react'
import { VCT_Icons } from '../../components/vct-icons'
import { VCT_Button } from '../../components/vct-ui'
import { useI18n } from '../../i18n'
import { AdminErrorBoundary } from './AdminErrorBoundary'
import { AdminCommandPalette } from './AdminCommandPalette'
import { useAdminShortcuts } from '../hooks/useAdminShortcuts'
import { useAuth } from '../../auth/AuthProvider'

// ════════════════════════════════════════
// AdminGuard — Route protection + RBAC for admin pages
// ════════════════════════════════════════

/** Roles that can access admin pages (mapped to UserRole values from auth/types) */
const ADMIN_ROLES = ['admin', 'federation_president', 'federation_secretary', 'provincial_admin'] as const

interface AdminGuardProps {
    /** Required roles (any match grants access). If empty, any admin role is accepted. */
    requiredRoles?: string[]
    /** Page content to render when authorized */
    children?: React.ReactNode
    /** Fallback content when unauthorized (default: built-in permission denied UI) */
    fallback?: React.ReactNode
}

/**
 * Wraps admin pages with auth + RBAC checks.
 *
 * Usage:
 * ```tsx
 * <AdminGuard requiredRoles={['SYSTEM_ADMIN']}>
 *     <Page_admin_users />
 * </AdminGuard>
 * ```
 */
export const AdminGuard: React.FC<AdminGuardProps> = ({
    requiredRoles = [],
    children,
    fallback,
}) => {
    const { isAuthenticated, isHydrating, currentUser } = useAuth()
    const { t } = useI18n()
    const [showPalette, setShowPalette] = React.useState(false)

    useAdminShortcuts({
        onCommandPalette: () => setShowPalette(v => !v),
    })

    // ── Loading state ──
    if (isHydrating) {
        return (
            <div className="flex items-center justify-center h-[60vh]" role="status" aria-label={t('common.loading')}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-3 border-(--vct-accent-cyan) border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-(--vct-text-tertiary)">{t('common.loading')}</span>
                </div>
            </div>
        )
    }

    // ── Not authenticated ──
    if (!isAuthenticated || !currentUser || currentUser.id === 'guest') {
        return fallback ?? (
            <PermissionDenied
                title={t('shell.accessDeniedTitle')}
                description="Vui lòng đăng nhập để truy cập trang quản trị."
                icon={<VCT_Icons.Lock size={48} />}
            />
        )
    }

    // ── RBAC check ──
    const allowedRoles = requiredRoles.length > 0
        ? requiredRoles
        : ADMIN_ROLES as unknown as string[]

    if (!allowedRoles.includes(currentUser.role)) {
        return fallback ?? (
            <PermissionDenied
                title={t('shell.accessDeniedTitle')}
                description={t('shell.accessDeniedDesc')}
                icon={<VCT_Icons.Shield size={48} />}
                currentRole={currentUser.role}
            />
        )
    }

    return (
        <AdminErrorBoundary>
            {children}
            <AdminCommandPalette open={showPalette} onClose={() => setShowPalette(false)} />
        </AdminErrorBoundary>
    )
}

// ── Permission Denied UI ──
interface PermissionDeniedProps {
    title: string
    description: string
    icon: React.ReactNode
    currentRole?: string
}

const PermissionDenied: React.FC<PermissionDeniedProps> = ({
    title, description, icon, currentRole,
}) => {
    const { t } = useI18n()
    return (
        <div className="flex items-center justify-center h-[60vh]" role="alert">
            <div className="text-center max-w-md mx-auto px-6">
                <div className="w-20 h-20 rounded-full bg-[#ef444415] flex items-center justify-center mx-auto mb-5 text-[#ef4444]">
                    {icon}
                </div>
                <h2 className="text-xl font-bold text-(--vct-text-primary) mb-2">{title}</h2>
                <p className="text-sm text-(--vct-text-secondary) mb-4">{description}</p>
                {currentRole && (
                    <p className="text-xs text-(--vct-text-tertiary) mb-6">
                        {t('shell.accessDeniedRole')}: <span className="font-bold">{currentRole}</span>
                    </p>
                )}
                <VCT_Button
                    variant="outline"
                    onClick={() => window.history.back()}
                    icon={<VCT_Icons.ChevronLeft size={14} />}
                    aria-label={t('shell.accessDeniedBack')}
                >
                    {t('shell.accessDeniedBack')}
                </VCT_Button>
            </div>
        </div>
    )
}
