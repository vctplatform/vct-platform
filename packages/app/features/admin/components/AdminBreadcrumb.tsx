'use client'

import * as React from 'react'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════
// AdminBreadcrumb — Navigation breadcrumbs for admin
// ════════════════════════════════════════

export interface BreadcrumbItem {
    label: string
    href?: string
    icon?: React.ReactNode
}

interface AdminBreadcrumbProps {
    items: BreadcrumbItem[]
}

/**
 * Admin breadcrumb navigation.
 *
 * @example
 * ```tsx
 * <AdminBreadcrumb items={[
 *     { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
 *     { label: 'Người dùng', href: '/admin/users' },
 *     { label: 'Nguyễn Văn A' },
 * ]} />
 * ```
 */
export function AdminBreadcrumb({ items }: AdminBreadcrumbProps) {
    return (
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-(--vct-text-tertiary) mb-4">
            {items.map((item, i) => {
                const isLast = i === items.length - 1
                return (
                    <React.Fragment key={`${item.label}-${i}`}>
                        {i > 0 && (
                            <VCT_Icons.ChevronRight size={12} className="text-(--vct-text-tertiary) opacity-50" />
                        )}
                        {isLast ? (
                            <span className="font-semibold text-(--vct-text-secondary) flex items-center gap-1">
                                {item.icon}
                                {item.label}
                            </span>
                        ) : item.href ? (
                            <a
                                href={item.href}
                                className="hover:text-(--vct-accent-cyan) transition-colors flex items-center gap-1 no-underline"
                            >
                                {item.icon}
                                {item.label}
                            </a>
                        ) : (
                            <span className="flex items-center gap-1">
                                {item.icon}
                                {item.label}
                            </span>
                        )}
                    </React.Fragment>
                )
            })}
        </nav>
    )
}
