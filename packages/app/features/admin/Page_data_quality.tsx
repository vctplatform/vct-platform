'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select, VCT_Toast
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { usePagination } from '../hooks/usePagination'

// ════════════════════════════════════════
// MOCK DATA — Data Quality Dashboard
// ════════════════════════════════════════
const MOCK_SCORES = [
    { table: 'athletes', overall: 94.2, completeness: 96.0, accuracy: 98.5, consistency: 91.0, timeliness: 91.3 },
    { table: 'tournaments', overall: 97.5, completeness: 99.0, accuracy: 98.0, consistency: 96.0, timeliness: 97.0 },
    { table: 'combat_matches', overall: 88.1, completeness: 85.0, accuracy: 97.0, consistency: 82.4, timeliness: 88.0 },
    { table: 'registrations', overall: 91.8, completeness: 90.5, accuracy: 96.0, consistency: 88.7, timeliness: 92.0 },
    { table: 'referees', overall: 95.0, completeness: 97.0, accuracy: 98.0, consistency: 93.0, timeliness: 92.0 },
    { table: 'teams', overall: 89.5, completeness: 88.0, accuracy: 95.0, consistency: 84.0, timeliness: 91.0 },
]

const MOCK_RULES = [
    { id: 'DQ-001', rule_name: 'athletes_date_of_birth', table: 'athletes', type: 'COMPLETENESS', severity: 'critical', status: 'CRITICAL', violations: 142, total: 4500, rate: 3.16 },
    { id: 'DQ-002', rule_name: 'match_events_integrity', table: 'combat_matches', type: 'CONSISTENCY', severity: 'warning', status: 'WARNING', violations: 85, total: 12000, rate: 0.71 },
    { id: 'DQ-003', rule_name: 'registrations_duplicate', table: 'registrations', type: 'UNIQUENESS', severity: 'warning', status: 'PASS', violations: 0, total: 3200, rate: 0 },
    { id: 'DQ-004', rule_name: 'athletes_weight_range', table: 'athletes', type: 'ACCURACY', severity: 'info', status: 'WARNING', violations: 23, total: 4500, rate: 0.51 },
    { id: 'DQ-005', rule_name: 'tournaments_config_valid', table: 'tournaments', type: 'CUSTOM', severity: 'critical', status: 'PASS', violations: 0, total: 45, rate: 0 },
    { id: 'DQ-006', rule_name: 'referee_soft_fk', table: 'referees', type: 'REFERENTIAL', severity: 'warning', status: 'PASS', violations: 2, total: 230, rate: 0.87 },
]

const STATUS_MAP: Record<string, { color: string; type: 'success' | 'warning' | 'danger' }> = {
    PASS: { color: 'green', type: 'success' },
    WARNING: { color: 'orange', type: 'warning' },
    CRITICAL: { color: 'red', type: 'danger' },
}

function getScoreColor(score: number): string {
    if (score >= 95) return 'var(--vct-accent-green, #22c55e)'
    if (score >= 85) return 'var(--vct-accent-yellow, #eab308)'
    return 'var(--vct-accent-red, #ef4444)'
}

// ════════════════════════════════════════
// SKELETON + PAGINATION BAR
// ════════════════════════════════════════
const SkeletonRow = ({ cols = 7 }: { cols?: number }) => (
    <tr>
        {[...Array(cols)].map((_, i) => (
            <td key={i} className="p-4">
                <div className="h-4 bg-[var(--vct-bg-elevated)] rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
            </td>
        ))}
    </tr>
)

const PaginationBar = ({ currentPage, totalPages, totalItems, pageSize, hasPrev, hasNext, prev, next }: {
    currentPage: number; totalPages: number; totalItems: number; pageSize: number
    hasPrev: boolean; hasNext: boolean; prev: () => void; next: () => void
}) => totalPages <= 1 ? null : (
    <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--vct-border-subtle)]">
        <span className="text-xs text-[var(--vct-text-tertiary)]">
            Hiển thị {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)} / {totalItems}
        </span>
        <div className="flex gap-2">
            <button onClick={prev} disabled={!hasPrev} className="px-3 py-1 text-xs rounded-lg bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] disabled:opacity-30 hover:bg-[var(--vct-bg-base)] transition-colors">← Trước</button>
            <span className="px-3 py-1 text-xs text-[var(--vct-text-tertiary)]">{currentPage}/{totalPages}</span>
            <button onClick={next} disabled={!hasNext} className="px-3 py-1 text-xs rounded-lg bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] disabled:opacity-30 hover:bg-[var(--vct-bg-base)] transition-colors">Sau →</button>
        </div>
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_data_quality = () => {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [isLoading, setIsLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    const filteredRules = useMemo(() => {
        let v = MOCK_RULES
        if (typeFilter !== 'all') v = v.filter(r => r.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(r => r.rule_name.toLowerCase().includes(q) || r.table.toLowerCase().includes(q))
        }
        return v
    }, [search, typeFilter])

    const pagination = usePagination(filteredRules, { pageSize: 5 })

    const avgScore = useMemo(() => {
        const total = MOCK_SCORES.reduce((acc, s) => acc + s.overall, 0)
        return (total / MOCK_SCORES.length).toFixed(1)
    }, [])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Chất Lượng Dữ Liệu</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Giám sát chất lượng dữ liệu theo 7 chiều: Completeness, Accuracy, Consistency, Timeliness, Uniqueness, Referential, Custom.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Refresh size={16} />} onClick={() => showToast('Đang chạy kiểm tra chất lượng dữ liệu...')}>Chạy kiểm tra</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                        const header = 'Bảng,Overall,Completeness,Accuracy,Consistency,Timeliness'
                        const csv = [header, ...MOCK_SCORES.map(s => `${s.table},${s.overall},${s.completeness},${s.accuracy},${s.consistency},${s.timeliness}`)].join('\n')
                        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `vct_data_quality_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
                        URL.revokeObjectURL(url)
                        showToast('Đã xuất báo cáo chất lượng dữ liệu!')
                    }}>Xuất báo cáo</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── SCORE CARDS ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                {MOCK_SCORES.map(s => (
                    <div key={s.table} className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-2">{s.table}</div>
                        <div className="text-3xl font-bold" style={{ color: getScoreColor(s.overall) }}>{s.overall}%</div>
                        <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-[var(--vct-text-tertiary)]">
                            <span>Complete: {s.completeness}%</span>
                            <span>Accuracy: {s.accuracy}%</span>
                            <span>Consist: {s.consistency}%</span>
                            <span>Timely: {s.timeliness}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── AVERAGE SCORE BANNER ── */}
            <div className="bg-gradient-to-r from-[var(--vct-accent-blue,#3b82f6)]/10 to-[var(--vct-accent-cyan,#06b6d4)]/10 border border-[var(--vct-border-strong)] rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-[var(--vct-text-primary)]">Điểm Chất Lượng Trung Bình Toàn Hệ Thống</div>
                    <div className="text-[11px] text-[var(--vct-text-secondary)] mt-1">Dựa trên {MOCK_SCORES.length} bảng dữ liệu chính</div>
                </div>
                <div className="text-4xl font-bold" style={{ color: getScoreColor(parseFloat(avgScore)) }}>{avgScore}%</div>
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <VCT_SearchInput placeholder="Tìm theo tên rule hoặc bảng..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
                <VCT_Select
                    value={typeFilter}
                    onChange={setTypeFilter}
                    options={[
                        { value: 'all', label: 'Tất cả loại' },
                        { value: 'COMPLETENESS', label: 'Completeness' },
                        { value: 'ACCURACY', label: 'Accuracy' },
                        { value: 'CONSISTENCY', label: 'Consistency' },
                        { value: 'UNIQUENESS', label: 'Uniqueness' },
                        { value: 'REFERENTIAL', label: 'Referential' },
                        { value: 'CUSTOM', label: 'Custom' },
                    ]}
                />
            </div>

            {/* ── RULES TABLE ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                            <th className="p-4 w-20">Trạng thái</th>
                            <th className="p-4">Rule Name</th>
                            <th className="p-4 w-32">Bảng</th>
                            <th className="p-4 w-32">Loại</th>
                            <th className="p-4 w-24 text-right">Vi phạm</th>
                            <th className="p-4 w-24 text-right">Tổng</th>
                            <th className="p-4 w-24 text-right">Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
                        ) : pagination.paginatedItems.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-[var(--vct-text-tertiary)]">Không tìm thấy rule nào</td></tr>
                        ) : (
                            pagination.paginatedItems.map(rule => (
                                <tr key={rule.id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4"><VCT_Badge type={STATUS_MAP[rule.status]?.type || 'info'} text={rule.status} /></td>
                                    <td className="p-4 font-mono text-[12px] text-[var(--vct-text-primary)]">{rule.rule_name}</td>
                                    <td className="p-4 text-[var(--vct-text-secondary)]">{rule.table}</td>
                                    <td className="p-4">
                                        <span className="bg-[var(--vct-bg-base)] border border-[var(--vct-border-subtle)] px-2 py-0.5 rounded text-[10px] font-bold text-[var(--vct-text-primary)] uppercase">{rule.type}</span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-[12px]" style={{ color: rule.violations > 0 ? 'var(--vct-accent-red,#ef4444)' : 'var(--vct-accent-green,#22c55e)' }}>{rule.violations.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-[var(--vct-text-secondary)]">{rule.total.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-[var(--vct-text-secondary)]">{rule.rate}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && <PaginationBar {...pagination} />}
            </div>
        </div>
    )
}
