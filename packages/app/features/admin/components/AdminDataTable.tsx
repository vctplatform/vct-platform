'use client'

import * as React from 'react'
import { VCT_Icons } from '../../components/vct-icons'
import { VCT_EmptyState } from '../../components/vct-ui'

// ════════════════════════════════════════
// AdminDataTable — Generic reusable admin table
// ════════════════════════════════════════

export interface AdminColumn<T> {
    /** Unique key for the column */
    key: string
    /** Display header label */
    label: string
    /** Render cell content */
    render: (row: T, index: number) => React.ReactNode
    /** Column width (CSS value) */
    width?: string
    /** Text alignment */
    align?: 'left' | 'center' | 'right'
    /** Whether column is sortable */
    sortable?: boolean
    /** Hide on mobile */
    hideMobile?: boolean
}

interface AdminDataTableProps<T> {
    columns: AdminColumn<T>[]
    data: T[]
    /** Loading state — shows skeleton rows */
    isLoading?: boolean
    /** Number of skeleton rows to show when loading */
    skeletonRows?: number
    /** Current sort column key */
    sortBy?: string
    /** Sort direction */
    sortDir?: 'asc' | 'desc'
    /** Sort change handler */
    onSort?: (key: string) => void
    /** Row click handler */
    onRowClick?: (row: T) => void
    /** Empty state config */
    emptyTitle?: string
    emptyDescription?: string
    emptyIcon?: string
    /** Unique key extractor for each row */
    rowKey: (row: T) => string
    /** Extra CSS class on table wrapper */
    className?: string
    /** Sticky header */
    stickyHeader?: boolean
}

// ── Skeleton Row ──
const SkeletonCell = ({ align }: { align?: string }) => (
    <td className={`p-4 ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : ''}`}>
        <div className={`h-4 bg-(--vct-bg-card) rounded animate-pulse ${align === 'center' ? 'mx-auto w-16' : 'w-3/4'}`} />
    </td>
)

/**
 * Generic admin data table with sort, loading skeleton, empty state.
 *
 * @example
 * ```tsx
 * <AdminDataTable
 *     rowKey={(item) => item.id}
 *     columns={[
 *         { key: 'name', label: 'Tên', render: (r) => r.name, sortable: true },
 *         { key: 'status', label: 'Trạng thái', render: (r) => <Badge text={r.status} />, align: 'center' },
 *     ]}
 *     data={filteredItems}
 *     isLoading={isLoading}
 *     sortBy={sortBy}
 *     sortDir={sortDir}
 *     onSort={handleSort}
 *     onRowClick={(row) => setSelected(row)}
 * />
 * ```
 */
export function AdminDataTable<T>({
    columns,
    data,
    isLoading = false,
    skeletonRows = 5,
    sortBy,
    sortDir = 'asc',
    onSort,
    onRowClick,
    emptyTitle = 'Không có dữ liệu',
    emptyDescription = 'Thử thay đổi bộ lọc hoặc thêm mục mới.',
    emptyIcon = '📋',
    rowKey,
    className = '',
    stickyHeader = false,
}: AdminDataTableProps<T>) {

    const handleHeaderClick = (col: AdminColumn<T>) => {
        if (col.sortable && onSort) {
            onSort(col.key)
        }
    }

    return (
        <div className={`overflow-x-auto rounded-2xl border border-(--vct-border-strong) bg-(--vct-bg-elevated) ${className}`}>
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className={`border-b border-(--vct-border-strong) bg-(--vct-bg-elevated) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
                        {columns.map(col => (
                            <th
                                key={col.key}
                                className={`p-4 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.width ? '' : ''} ${col.sortable ? 'cursor-pointer select-none hover:text-(--vct-text-secondary) transition-colors' : ''} ${col.hideMobile ? 'hidden md:table-cell' : ''}`}
                                style={col.width ? { width: col.width } : undefined}
                                onClick={() => handleHeaderClick(col)}
                            >
                                <span className="inline-flex items-center gap-1">
                                    {col.label}
                                    {col.sortable && sortBy === col.key && (
                                        <span className="text-(--vct-accent-cyan)">
                                            {sortDir === 'asc'
                                                ? <VCT_Icons.ChevronDown size={12} className="rotate-180" />
                                                : <VCT_Icons.ChevronDown size={12} />
                                            }
                                        </span>
                                    )}
                                </span>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-(--vct-border-subtle)">
                    {isLoading ? (
                        [...Array(skeletonRows)].map((_, i) => (
                            <tr key={`skel-${i}`} className="animate-pulse">
                                {columns.map(col => (
                                    <SkeletonCell key={col.key} align={col.align} />
                                ))}
                            </tr>
                        ))
                    ) : data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} className="p-8">
                                <VCT_EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
                            </td>
                        </tr>
                    ) : (
                        data.map((row, idx) => (
                            <tr
                                key={rowKey(row)}
                                className={`hover:bg-white/5 transition-colors group ${onRowClick ? 'cursor-pointer' : ''}`}
                                onClick={() => onRowClick?.(row)}
                            >
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`p-4 ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : ''} ${col.hideMobile ? 'hidden md:table-cell' : ''}`}
                                    >
                                        {col.render(row, idx)}
                                    </td>
                                ))}
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    )
}
