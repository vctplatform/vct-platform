'use client'

import * as React from 'react'
import { useState, useEffect, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_EmptyState } from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

const API = '/api/v1/provincial'

interface FinanceEntry { id: string; type: string; category: string; amount: number; description: string; date: string; ref?: string }
interface FinanceSummary { total_income: number; total_expense: number; balance: number; entry_count: number }

const formatVND = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

export const Page_provincial_finance = () => {
    const [entries, setEntries] = useState<FinanceEntry[]>([])
    const [summary, setSummary] = useState<FinanceSummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const [entriesRes, summaryRes] = await Promise.all([
                    fetch(`${API}/finance?province_id=PROV-HCM`, { headers }),
                    fetch(`${API}/finance/summary?province_id=PROV-HCM`, { headers }),
                ])
                if (entriesRes.ok) { const d = await entriesRes.json(); setEntries((d.data?.entries || d.entries) || []) }
                if (summaryRes.ok) { const d = await summaryRes.json(); setSummary(d.data || d) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const kpi: StatItem[] = summary ? [
        { label: 'Tổng thu', value: formatVND(summary.total_income), icon: <VCT_Icons.TrendingUp size={18} />, color: 'var(--vct-success)' },
        { label: 'Tổng chi', value: formatVND(summary.total_expense), icon: <VCT_Icons.TrendingDown size={18} />, color: 'var(--vct-danger)' },
        { label: 'Số dư', value: formatVND(summary.balance), icon: <VCT_Icons.DollarSign size={18} />, color: summary.balance >= 0 ? 'var(--vct-accent-cyan)' : 'var(--vct-danger)' },
        { label: 'Số bút toán', value: summary.entry_count, icon: <VCT_Icons.FileText size={18} />, color: 'var(--vct-info)' },
    ] : [
        { label: 'Tổng thu', value: '—', icon: <VCT_Icons.TrendingUp size={18} />, color: 'var(--vct-success)' },
        { label: 'Tổng chi', value: '—', icon: <VCT_Icons.TrendingDown size={18} />, color: 'var(--vct-danger)' },
        { label: 'Số dư', value: '—', icon: <VCT_Icons.DollarSign size={18} />, color: 'var(--vct-accent-cyan)' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">💰 Tài Chính Liên Đoàn</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý thu chi, hội phí, ngân sách liên đoàn tỉnh</p>
            </div>

            <VCT_StatRow items={kpi} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <h2 className="text-lg font-bold text-(--vct-text-primary)">Sổ Thu Chi</h2>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Download size={16} />} onClick={() => showToast('Đang xuất báo cáo...', 'info')}>Xuất Excel</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng đang phát triển', 'info')}>Tạo Phiếu</VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {entries.length === 0 ? (
                <VCT_EmptyState title="Chưa có bút toán nào" description={loading ? 'Đang tải...' : 'Chưa có giao dịch thu chi.'} icon="💰" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                            {['Ngày', 'Loại', 'Danh mục', 'Nội dung', 'Số tiền', 'Số phiếu'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                        </tr></thead>
                        <tbody>
                            {entries.map(e => (
                                <tr key={e.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                    <td className="px-4 py-3 text-sm">{e.date}</td>
                                    <td className="px-4 py-3">
                                        <VCT_Badge text={e.type === 'income' ? 'Thu' : 'Chi'} type={e.type === 'income' ? 'success' : 'error'} />
                                    </td>
                                    <td className="px-4 py-3 text-sm font-semibold">{e.category}</td>
                                    <td className="px-4 py-3 text-sm">{e.description}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-right" style={{ color: e.type === 'income' ? 'var(--vct-success)' : 'var(--vct-danger)' }}>
                                        {e.type === 'income' ? '+' : '-'}{formatVND(e.amount)}
                                    </td>
                                    <td className="px-4 py-3 text-xs font-mono opacity-50">{e.ref || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}
