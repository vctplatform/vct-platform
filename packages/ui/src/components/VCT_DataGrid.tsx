'use client'

import { useState, useMemo, useCallback, type ReactNode, type CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_DataGrid
 *  Enhanced data table with sorting, pagination,
 *  row selection, expandable rows, and sticky header.
 * ──────────────────────────────────────────── */

export interface ColumnDef<T> {
    /** Unique column key */
    key: string
    /** Column header label */
    header: string
    /** Width (CSS value) */
    width?: string | number
    /** Whether this column is sortable */
    sortable?: boolean
    /** Custom cell renderer */
    render?: (row: T, index: number) => ReactNode
    /** Text alignment */
    align?: 'left' | 'center' | 'right'
}

export interface SortConfig {
    key: string
    direction: 'asc' | 'desc'
}

export interface VCT_DataGridProps<T extends { id?: string;[key: string]: any }> {
    /** Data rows */
    data: T[]
    /** Column definitions */
    columns: ColumnDef<T>[]
    /** Row height in pixels */
    rowHeight?: number
    /** Row click handler */
    onRowClick?: (row: T) => void
    /** Selection change handler (returns selected IDs) */
    onSelectionChange?: (ids: string[]) => void
    /** Current sort config */
    sorting?: SortConfig
    /** Sort change handler */
    onSort?: (sort: SortConfig) => void
    /** Pagination config */
    pagination?: { page: number; pageSize: number; total: number }
    /** Page change handler */
    onPageChange?: (page: number) => void
    /** Loading skeleton state */
    loading?: boolean
    /** Custom empty state */
    emptyState?: ReactNode
    /** Expandable row content renderer */
    expandedRowRender?: (row: T) => ReactNode
    /** Sticky header on scroll */
    stickyHeader?: boolean
    /** Max height before vertical scroll */
    maxHeight?: number | string
}

export function VCT_DataGrid<T extends { id?: string;[key: string]: any }>({
    data,
    columns,
    rowHeight = 48,
    onRowClick,
    onSelectionChange,
    sorting,
    onSort,
    pagination,
    onPageChange,
    loading = false,
    emptyState,
    expandedRowRender,
    stickyHeader = false,
    maxHeight,
}: VCT_DataGridProps<T>) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

    const getRowId = useCallback((row: T, i: number) => row.id ?? String(i), [])

    const handleSelectAll = useCallback(() => {
        if (selectedIds.size === data.length) {
            setSelectedIds(new Set())
            onSelectionChange?.([])
        } else {
            const all = new Set(data.map((r, i) => getRowId(r, i)))
            setSelectedIds(all)
            onSelectionChange?.(Array.from(all))
        }
    }, [data, getRowId, selectedIds.size, onSelectionChange])

    const handleSelectRow = useCallback(
        (id: string) => {
            const next = new Set(selectedIds)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            setSelectedIds(next)
            onSelectionChange?.(Array.from(next))
        },
        [selectedIds, onSelectionChange],
    )

    const handleSort = (key: string) => {
        if (!onSort) return
        const dir = sorting?.key === key && sorting.direction === 'asc' ? 'desc' : 'asc'
        onSort({ key, direction: dir })
    }

    const toggleExpand = (id: string) => {
        const next = new Set(expandedIds)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        setExpandedIds(next)
    }

    const totalPages = pagination ? Math.ceil(pagination.total / pagination.pageSize) : 0

    const thStyle: CSSProperties = {
        padding: '0 12px',
        height: rowHeight,
        fontSize: 'var(--vct-font-xs)',
        fontWeight: 600,
        color: 'var(--vct-text-tertiary)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        borderBottom: '1px solid var(--vct-border-subtle)',
        background: 'var(--vct-bg-elevated)',
        whiteSpace: 'nowrap',
        userSelect: 'none',
        ...(stickyHeader ? { position: 'sticky', top: 0, zIndex: 2 } as CSSProperties : {}),
    }

    const cellStyle: CSSProperties = {
        padding: '0 12px',
        height: rowHeight,
        fontSize: 'var(--vct-font-sm)',
        color: 'var(--vct-text-primary)',
        borderBottom: '1px solid var(--vct-border-subtle)',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    }

    // Loading skeleton
    if (loading) {
        return (
            <div style={{ borderRadius: 'var(--vct-radius-md)', overflow: 'hidden', border: '1px solid var(--vct-border-subtle)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div
                        key={i}
                        className="vct-skeleton"
                        style={{ height: rowHeight, margin: i > 0 ? '1px 0 0' : undefined }}
                    />
                ))}
            </div>
        )
    }

    // Empty
    if (data.length === 0 && !loading) {
        return (
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '48px 24px',
                    color: 'var(--vct-text-tertiary)',
                    fontSize: 'var(--vct-font-sm)',
                    border: '1px solid var(--vct-border-subtle)',
                    borderRadius: 'var(--vct-radius-md)',
                    background: 'var(--vct-bg-elevated)',
                }}
            >
                {emptyState ?? 'Không có dữ liệu'}
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div
                className="vct-hide-scrollbar"
                style={{
                    overflowX: 'auto',
                    overflowY: maxHeight ? 'auto' : undefined,
                    maxHeight,
                    borderRadius: 'var(--vct-radius-md)',
                    border: '1px solid var(--vct-border-subtle)',
                    background: 'var(--vct-bg-elevated)',
                }}
            >
                <table
                    role="grid"
                    style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        tableLayout: 'fixed',
                    }}
                >
                    <thead>
                        <tr>
                            {/* Selection checkbox column */}
                            {onSelectionChange && (
                                <th style={{ ...thStyle, width: 44, textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.size === data.length && data.length > 0}
                                        onChange={handleSelectAll}
                                        aria-label="Chọn tất cả"
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--vct-accent-cyan)' }}
                                    />
                                </th>
                            )}
                            {/* Expand column */}
                            {expandedRowRender && (
                                <th style={{ ...thStyle, width: 40 }} />
                            )}
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        ...thStyle,
                                        width: col.width,
                                        textAlign: col.align ?? 'left',
                                        cursor: col.sortable ? 'pointer' : undefined,
                                    }}
                                    onClick={() => col.sortable && handleSort(col.key)}
                                    aria-sort={
                                        sorting?.key === col.key
                                            ? sorting.direction === 'asc'
                                                ? 'ascending'
                                                : 'descending'
                                            : undefined
                                    }
                                >
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        {col.header}
                                        {col.sortable && sorting?.key === col.key && (
                                            <span style={{ fontSize: 10, opacity: 0.8 }}>
                                                {sorting.direction === 'asc' ? '▲' : '▼'}
                                            </span>
                                        )}
                                    </span>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, ri) => {
                            const rid = getRowId(row, ri)
                            const isExpanded = expandedIds.has(rid)
                            return (
                                <tbody key={rid}>
                                    <tr
                                        onClick={() => onRowClick?.(row)}
                                        style={{
                                            cursor: onRowClick ? 'pointer' : undefined,
                                            background: selectedIds.has(rid)
                                                ? 'var(--vct-bg-hover)'
                                                : undefined,
                                            transition: 'background var(--vct-duration-fast) ease',
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!selectedIds.has(rid))
                                                e.currentTarget.style.background = 'var(--vct-bg-hover)'
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!selectedIds.has(rid))
                                                e.currentTarget.style.background = ''
                                        }}
                                    >
                                        {onSelectionChange && (
                                            <td style={{ ...cellStyle, textAlign: 'center', width: 44 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(rid)}
                                                    onChange={(e) => { e.stopPropagation(); handleSelectRow(rid) }}
                                                    onClick={(e) => e.stopPropagation()}
                                                    aria-label={`Chọn dòng ${ri + 1}`}
                                                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--vct-accent-cyan)' }}
                                                />
                                            </td>
                                        )}
                                        {expandedRowRender && (
                                            <td style={{ ...cellStyle, textAlign: 'center', width: 40 }}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(rid) }}
                                                    aria-label={isExpanded ? 'Thu gọn' : 'Mở rộng'}
                                                    aria-expanded={isExpanded}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        width: 24,
                                                        height: 24,
                                                        border: 'none',
                                                        background: 'transparent',
                                                        color: 'var(--vct-text-tertiary)',
                                                        cursor: 'pointer',
                                                        fontSize: 12,
                                                        borderRadius: 'var(--vct-radius-sm)',
                                                        transform: isExpanded ? 'rotate(90deg)' : undefined,
                                                        transition: 'transform var(--vct-duration-fast) ease',
                                                    }}
                                                >
                                                    ▶
                                                </button>
                                            </td>
                                        )}
                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                style={{
                                                    ...cellStyle,
                                                    textAlign: col.align ?? 'left',
                                                    width: col.width,
                                                }}
                                            >
                                                {col.render ? col.render(row, ri) : row[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                    {/* Expanded row */}
                                    {isExpanded && expandedRowRender && (
                                        <tr>
                                            <td
                                                colSpan={columns.length + (onSelectionChange ? 1 : 0) + 1}
                                                style={{
                                                    padding: '12px 16px',
                                                    background: 'var(--vct-bg-base)',
                                                    borderBottom: '1px solid var(--vct-border-subtle)',
                                                }}
                                            >
                                                {expandedRowRender(row)}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {pagination && totalPages > 1 && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        fontSize: 'var(--vct-font-sm)',
                        color: 'var(--vct-text-secondary)',
                    }}
                >
                    <span>
                        {pagination.total} kết quả · Trang {pagination.page} / {totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: 4 }}>
                        <PaginationBtn
                            label="Trước"
                            disabled={pagination.page <= 1}
                            onClick={() => onPageChange?.(pagination.page - 1)}
                        />
                        <PaginationBtn
                            label="Sau"
                            disabled={pagination.page >= totalPages}
                            onClick={() => onPageChange?.(pagination.page + 1)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

function PaginationBtn({ label, disabled, onClick }: { label: string; disabled: boolean; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            aria-label={label}
            style={{
                padding: '4px 12px',
                border: '1px solid var(--vct-border-subtle)',
                borderRadius: 'var(--vct-radius-sm)',
                background: 'var(--vct-bg-elevated)',
                color: disabled ? 'var(--vct-text-tertiary)' : 'var(--vct-text-primary)',
                fontSize: 'var(--vct-font-sm)',
                fontWeight: 500,
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.5 : 1,
                transition: 'all var(--vct-duration-fast) ease',
            }}
        >
            {label}
        </button>
    )
}
