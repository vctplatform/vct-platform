'use client'

import * as React from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_Button } from '@vct/ui'

interface AdminErrorStateProps {
    message?: string
    detail?: string
    onRetry?: () => void
}

/**
 * Error state component for admin pages.
 * Displays when data fetching fails, with optional retry button.
 */
export const AdminErrorState: React.FC<AdminErrorStateProps> = ({
    message = 'Không thể tải dữ liệu',
    detail,
    onRetry,
}) => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-[#ef444415] flex items-center justify-center mb-4">
            <VCT_Icons.AlertTriangle size={32} className="text-(--vct-danger)" />
        </div>
        <h3 className="text-lg font-bold text-(--vct-text-primary) mb-1">{message}</h3>
        {detail && (
            <p className="text-sm text-(--vct-text-secondary) mb-4 max-w-md text-center">{detail}</p>
        )}
        {onRetry && (
            <VCT_Button variant="outline" icon={<VCT_Icons.RotateCcw size={14} />} onClick={onRetry}>
                Thử lại
            </VCT_Button>
        )}
    </div>
)
