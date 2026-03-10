'use client'
import * as React from 'react'
import { usePermission } from './usePermission'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — Permission-Gated UI Components
// Declarative components for showing/hiding UI based on UUID permissions.
// ════════════════════════════════════════════════════════════════

interface PermissionGateProps {
    /** Resource to check, e.g. "tournament" */
    resource: string
    /** Action to check, e.g. "create" */
    action: string
    /** Content shown when permission is granted */
    children: React.ReactNode
    /**
     * What to show when permission is denied.
     * - 'hidden' (default): renders nothing
     * - 'disabled': renders children in a disabled/muted wrapper
     * - ReactNode: renders custom fallback
     */
    fallback?: 'hidden' | 'disabled' | React.ReactNode
}

/**
 * Declarative permission gate.
 * 
 * @example
 * ```tsx
 * <PermissionGate resource="tournament" action="create">
 *   <Button>Tạo giải mới</Button>
 * </PermissionGate>
 * 
 * <PermissionGate resource="athlete" action="delete" fallback="disabled">
 *   <Button variant="danger">Xóa VĐV</Button>
 * </PermissionGate>
 * ```
 */
export function PermissionGate({
    resource,
    action,
    children,
    fallback = 'hidden',
}: PermissionGateProps) {
    const { can } = usePermission()

    if (can(resource, action)) {
        return React.createElement(React.Fragment, null, children)
    }

    if (fallback === 'hidden') return null

    if (fallback === 'disabled') {
        return React.createElement(
            'div',
            {
                className: 'vct-permission-disabled',
                title: `Bạn cần quyền "${resource}.${action}" để thực hiện`,
                style: {
                    opacity: 0.45,
                    pointerEvents: 'none' as const,
                    position: 'relative' as const,
                    cursor: 'not-allowed',
                },
            },
            children,
            React.createElement(
                'div',
                {
                    className: 'vct-permission-lock-overlay',
                    style: {
                        position: 'absolute' as const,
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 'inherit',
                    },
                },
                React.createElement(VCT_Icons.Lock, { size: 14, className: 'text-[var(--vct-text-tertiary)]' })
            )
        )
    }

    // Custom fallback
    return React.createElement(React.Fragment, null, fallback)
}

// ── Multi-permission variant ──

interface PermissionGateAllProps {
    /** All permissions required */
    checks: Array<[resource: string, action: string]>
    children: React.ReactNode
    fallback?: 'hidden' | 'disabled' | React.ReactNode
}

/**
 * Gate that requires ALL permissions.
 */
export function PermissionGateAll({
    checks,
    children,
    fallback = 'hidden',
}: PermissionGateAllProps) {
    const { canAll } = usePermission()

    if (canAll(checks)) {
        return React.createElement(React.Fragment, null, children)
    }

    if (fallback === 'hidden') return null
    if (fallback === 'disabled') {
        return React.createElement(
            'div',
            {
                className: 'vct-permission-disabled',
                title: 'Bạn chưa đủ quyền để thực hiện chức năng này',
                style: {
                    opacity: 0.45,
                    pointerEvents: 'none' as const,
                    cursor: 'not-allowed',
                },
            },
            children
        )
    }

    return React.createElement(React.Fragment, null, fallback)
}

interface PermissionGateAnyProps {
    /** Any of these permissions suffices */
    checks: Array<[resource: string, action: string]>
    children: React.ReactNode
    fallback?: 'hidden' | 'disabled' | React.ReactNode
}

/**
 * Gate that requires ANY ONE of the permissions.
 */
export function PermissionGateAny({
    checks,
    children,
    fallback = 'hidden',
}: PermissionGateAnyProps) {
    const { canAny } = usePermission()

    if (canAny(checks)) {
        return React.createElement(React.Fragment, null, children)
    }

    if (fallback === 'hidden') return null
    if (fallback === 'disabled') {
        return React.createElement(
            'div',
            {
                className: 'vct-permission-disabled',
                title: 'Bạn chưa đủ quyền để thực hiện chức năng này',
                style: {
                    opacity: 0.45,
                    pointerEvents: 'none' as const,
                    cursor: 'not-allowed',
                },
            },
            children
        )
    }

    return React.createElement(React.Fragment, null, fallback)
}
