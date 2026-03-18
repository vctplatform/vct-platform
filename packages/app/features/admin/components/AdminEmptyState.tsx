import React from 'react'
import { VCT_Icons } from '../../components/vct-icons'
import { VCT_Button } from '../../components/vct-ui'

interface AdminEmptyStateProps {
    icon?: React.ReactNode
    title?: string
    description?: string
    actionLabel?: string
    onAction?: () => void
}

/**
 * Empty state placeholder for admin tables/lists when no data or no results after filter.
 * Provides a consistent look across all admin pages.
 */
export const AdminEmptyState: React.FC<AdminEmptyStateProps> = ({
    icon,
    title = 'Không có dữ liệu',
    description = 'Thử thay đổi bộ lọc hoặc thêm mới',
    actionLabel,
    onAction,
}) => (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center animate-in fade-in duration-300">
        <div className="mb-4 text-(--vct-text-tertiary) opacity-40">
            {icon || <VCT_Icons.Search size={48} />}
        </div>
        <h3 className="text-lg font-bold text-(--vct-text-primary) mb-1">{title}</h3>
        <p className="text-sm text-(--vct-text-tertiary) max-w-xs">{description}</p>
        {actionLabel && onAction && (
            <VCT_Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={onAction}
                icon={<VCT_Icons.Plus size={14} />}
            >
                {actionLabel}
            </VCT_Button>
        )}
    </div>
)
