'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select, VCT_Toast
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'
import { usePagination } from '../hooks/usePagination'
import { AdminSkeletonRow } from './components/AdminSkeletonRow'
import { AdminPaginationBar } from './components/AdminPaginationBar'
import { useAdminFetch } from './hooks/useAdminAPI'

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface DQScore {
    table: string
    overall: number
    completeness: number
    accuracy: number
    consistency: number
    timeliness: number
}

interface DQRule {
    id: string
    rule_name: string
    table: string
    type: string
    severity: string
    status: string
    violations: number
    total: number
    rate: number
}

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
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_data_quality = () => {
    const { data: fetchedScores, isLoading: loadingScores } = useAdminFetch<DQScore[]>('/admin/data-quality/scores')
    const { data: fetchedRules, isLoading: loadingRules } = useAdminFetch<DQRule[]>('/admin/data-quality/rules')
    const isLoading = loadingScores || loadingRules
    const scores = useMemo(() => fetchedScores ?? [], [fetchedScores])
    const rules = useMemo(() => fetchedRules ?? [], [fetchedRules])
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    const filteredRules = useMemo(() => {
        let v = rules
        if (typeFilter !== 'all') v = v.filter(r => r.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(r => r.rule_name.toLowerCase().includes(q) || r.table.toLowerCase().includes(q))
        }
        return v
    }, [rules, search, typeFilter])

    const pagination = usePagination(filteredRules, { pageSize: 5 })

    const avgScore = useMemo(() => {
        if (scores.length === 0) return '0.0'
        const total = scores.reduce((acc, s) => acc + s.overall, 0)
        return (total / scores.length).toFixed(1)
    }, [scores])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Chất Lượng Dữ Liệu</h1>
                    <p className="text-sm text-(--vct-text-secondary) mt-1">Giám sát chất lượng dữ liệu theo 7 chiều: Completeness, Accuracy, Consistency, Timeliness, Uniqueness, Referential, Custom.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Refresh size={16} />} onClick={() => showToast('Đang chạy kiểm tra chất lượng dữ liệu...')}>Chạy kiểm tra</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                        const header = 'Bảng,Overall,Completeness,Accuracy,Consistency,Timeliness'
                        const csv = [header, ...scores.map(s => `${s.table},${s.overall},${s.completeness},${s.accuracy},${s.consistency},${s.timeliness}`)].join('\n')
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
                {scores.map(s => (
                    <div key={s.table} className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl p-4 text-center">
                        <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-2">{s.table}</div>
                        <div className="text-3xl font-bold" style={{ color: getScoreColor(s.overall) }}>{s.overall}%</div>
                        <div className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-(--vct-text-tertiary)">
                            <span>Complete: {s.completeness}%</span>
                            <span>Accuracy: {s.accuracy}%</span>
                            <span>Consist: {s.consistency}%</span>
                            <span>Timely: {s.timeliness}%</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── AVERAGE SCORE BANNER ── */}
            <div className="bg-linear-to-r from-(--vct-accent-blue,#3b82f6)/10 to-(--vct-accent-cyan,#06b6d4)/10 border border-(--vct-border-strong) rounded-2xl p-6 mb-8 flex items-center justify-between">
                <div>
                    <div className="text-sm font-semibold text-(--vct-text-primary)">Điểm Chất Lượng Trung Bình Toàn Hệ Thống</div>
                    <div className="text-[11px] text-(--vct-text-secondary) mt-1">Dựa trên {scores.length} bảng dữ liệu chính</div>
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
            <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 w-20">Trạng thái</th>
                            <th className="p-4">Rule Name</th>
                            <th className="p-4 w-32">Bảng</th>
                            <th className="p-4 w-32">Loại</th>
                            <th className="p-4 w-24 text-right">Vi phạm</th>
                            <th className="p-4 w-24 text-right">Tổng</th>
                            <th className="p-4 w-24 text-right">Tỷ lệ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--vct-border-subtle)">
                        {isLoading ? (
                            [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={7} />)
                        ) : pagination.paginatedItems.length === 0 ? (
                            <tr><td colSpan={7} className="p-12 text-center text-(--vct-text-tertiary)">Không tìm thấy rule nào</td></tr>
                        ) : (
                            pagination.paginatedItems.map(rule => (
                                <tr key={rule.id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4"><VCT_Badge type={STATUS_MAP[rule.status]?.type || 'info'} text={rule.status} /></td>
                                    <td className="p-4 font-mono text-[12px] text-(--vct-text-primary)">{rule.rule_name}</td>
                                    <td className="p-4 text-(--vct-text-secondary)">{rule.table}</td>
                                    <td className="p-4">
                                        <span className="bg-(--vct-bg-base) border border-(--vct-border-subtle) px-2 py-0.5 rounded text-[10px] font-bold text-(--vct-text-primary) uppercase">{rule.type}</span>
                                    </td>
                                    <td className="p-4 text-right font-mono text-[12px]" style={{ color: rule.violations > 0 ? 'var(--vct-accent-red,#ef4444)' : 'var(--vct-accent-green,#22c55e)' }}>{rule.violations.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-(--vct-text-secondary)">{rule.total.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-(--vct-text-secondary)">{rule.rate}%</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
                {!isLoading && <AdminPaginationBar {...pagination} />}
            </div>
        </div>
    )
}
