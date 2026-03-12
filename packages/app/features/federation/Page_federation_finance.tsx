// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION FINANCE PAGE
// National-level financial overview with VCT design system.
// Falls back to seed data when API is unavailable.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState } from 'react';
import { useApiQuery } from '../hooks/useApiQuery';
import { VCT_PageContainer, VCT_PageHero } from '../components/VCT_PageContainer';
import { VCT_Icons } from '../components/vct-icons';
import { VCT_Button } from '../components/vct-ui';
import { VCT_Timeline } from '../components/VCT_Timeline';
import { exportToExcel } from '../../utils/exportUtils';

// ── Types ────────────────────────────────────────────────────

type Period = 'monthly' | 'quarterly' | 'yearly';

interface FinRow {
    label: string;
    category: string;
    income: number;
    expense: number;
}

interface FinSummary {
    period: string;
    rows: FinRow[];
}

// ── Fallback Seed ────────────────────────────────────────────

const SEED_ROWS: FinRow[] = [
    { label: 'Phí hội viên', category: 'membership', income: 2_400_000_000, expense: 0 },
    { label: 'Tài trợ doanh nghiệp', category: 'sponsorship', income: 1_800_000_000, expense: 0 },
    { label: 'Tổ chức Giải đấu', category: 'tournament', income: 960_000_000, expense: 720_000_000 },
    { label: 'Đào tạo & Thi thăng đai', category: 'training', income: 480_000_000, expense: 120_000_000 },
    { label: 'Chi lương nhân sự', category: 'salary', income: 0, expense: 1_200_000_000 },
    { label: 'Chi hoạt động văn phòng', category: 'office', income: 0, expense: 360_000_000 },
    { label: 'Chi đối ngoại quốc tế', category: 'international', income: 0, expense: 480_000_000 },
];

const FINANCE_AUDIT_LOGS = [
    { time: '10:30 Hôm nay', title: 'Xuất báo cáo tài chính', description: 'Kế toán trưởng Nguyễn Văn A xuất báo cáo Quý 1/2026', color: '#3b82f6', icon: '📊' },
    { time: '15:45 Hôm qua', title: 'Phê duyệt chi', description: 'Chủ tịch phê duyệt khoản chi 120,000,000đ cho Đào tạo', color: '#10b981', icon: '✅' },
    { time: '09:00 Hôm qua', title: 'Nhận tài trợ', description: 'Ghi nhận khoản tài trợ 500,000,000đ từ Công ty XYZ', color: '#8b5cf6', icon: '💰' },
    { time: '14:20 10/03/2026', title: 'Cập nhật ngân sách', description: 'Hệ thống tự động kết chuyển số dư đầu kỳ', color: '#64748b', icon: '⚙️' }
];

// ── Helpers ──────────────────────────────────────────────────

const fmt = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)} tỷ`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)} triệu`;
    return n.toLocaleString('vi-VN');
};

const CATEGORY_ICONS: Record<string, string> = {
    membership: '👥', sponsorship: '🤝', tournament: '🏆', training: '🥋',
    salary: '💼', office: '🏢', international: '🌐',
};

// ── Component ────────────────────────────────────────────────

export function Page_federation_finance() {
    const { data: apiData } = useApiQuery<FinSummary>('/api/v1/federation/finance/summary');
    const rows = apiData?.rows || SEED_ROWS;

    const [period, setPeriod] = useState<Period>('yearly');
    const totalIncome = rows.reduce((s, r) => s + r.income, 0);
    const totalExpense = rows.reduce((s, r) => s + r.expense, 0);
    const balance = totalIncome - totalExpense;

    const handleExportExcel = () => {
        const exportData = rows.map((r, idx) => ({
            'STT': idx + 1,
            'Khoản Mục': r.label,
            'Phân Loại': r.category,
            'Thu (VNĐ)': r.income,
            'Chi (VNĐ)': r.expense,
            'Cân Đối (VNĐ)': r.income - r.expense
        }));
        exportData.push({
            'STT': '',
            'Khoản Mục': 'TỔNG CỘNG',
            'Phân Loại': '',
            'Thu (VNĐ)': totalIncome,
            'Chi (VNĐ)': totalExpense,
            'Cân Đối (VNĐ)': balance
        } as any);
        exportToExcel(exportData, `bao_cao_tai_chinh_${period}`);
    };

    const kpis = [
        { label: 'Tổng Thu', value: fmt(totalIncome), color: '#10b981', icon: <VCT_Icons.TrendingUp size={18} /> },
        { label: 'Tổng Chi', value: fmt(totalExpense), color: '#ef4444', icon: <VCT_Icons.TrendingDown size={18} /> },
        { label: 'Kết dư', value: fmt(balance), color: balance >= 0 ? '#3b82f6' : '#ef4444', icon: <VCT_Icons.DollarSign size={18} /> },
    ];

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero
                title="Tài chính Tổng cục"
                subtitle="Năm tài chính 2026 • Tổng quan ngân sách Liên đoàn"
                icon={<VCT_Icons.DollarSign size={24} />}
                gradientFrom="rgba(16, 185, 129, 0.1)"
                gradientTo="rgba(245, 158, 11, 0.06)"
            />

            {/* KPI */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="rounded-2xl border border-vct-border bg-vct-elevated px-5 py-5">
                        <div className="flex items-center gap-2 text-xs text-vct-text-muted mb-1.5">
                            <span style={{ color: kpi.color }}>{kpi.icon}</span> {kpi.label}
                        </div>
                        <div className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Income/Expense Bar Visualization */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-5 mb-6">
                <h3 className="text-sm font-bold text-vct-text mb-3">📊 Cơ cấu Thu / Chi</h3>
                <div className="space-y-2">
                    {rows.filter(r => r.income > 0 || r.expense > 0).map(r => {
                        const barMax = Math.max(totalIncome, totalExpense) || 1;
                        return (
                            <div key={r.category}>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs">{CATEGORY_ICONS[r.category] ?? '📋'}</span>
                                    <span className="text-xs font-semibold text-vct-text flex-1">{r.label}</span>
                                    {r.income > 0 && <span className="text-[11px] font-bold text-emerald-400">+{fmt(r.income)}</span>}
                                    {r.expense > 0 && <span className="text-[11px] font-bold text-red-400">-{fmt(r.expense)}</span>}
                                </div>
                                <div className="flex gap-1 h-2">
                                    {r.income > 0 && (
                                        <div className="h-full rounded-full bg-emerald-500/70 transition-all"
                                            style={{ width: `${(r.income / barMax) * 100}%` }} />
                                    )}
                                    {r.expense > 0 && (
                                        <div className="h-full rounded-full bg-red-500/60 transition-all"
                                            style={{ width: `${(r.expense / barMax) * 100}%` }} />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Period Tabs & Export */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex gap-1 bg-vct-elevated p-1 rounded-2xl border border-vct-border w-fit">
                    {([
                        { key: 'monthly' as Period, label: 'Tháng' },
                        { key: 'quarterly' as Period, label: 'Quý' },
                        { key: 'yearly' as Period, label: 'Năm' },
                    ]).map(p => (
                        <button key={p.key} onClick={() => setPeriod(p.key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${period === p.key ? 'bg-indigo-500/15 text-indigo-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <VCT_Button variant="secondary" onClick={handleExportExcel}>
                    <VCT_Icons.Download size={16} className="mr-2" />
                    Xuất Excel
                </VCT_Button>
            </div>

            {/* Table */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b border-vct-border">
                            <th className="px-5 py-3 text-xs font-semibold text-vct-text-muted text-left">Khoản mục</th>
                            <th className="px-5 py-3 text-xs font-semibold text-vct-text-muted text-right">Thu</th>
                            <th className="px-5 py-3 text-xs font-semibold text-vct-text-muted text-right">Chi</th>
                            <th className="px-5 py-3 text-xs font-semibold text-vct-text-muted text-right">Cân đối</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(row => {
                            const net = row.income - row.expense;
                            return (
                                <tr key={row.category} className="border-b border-vct-border/50 hover:bg-vct-bg/30 transition-colors">
                                    <td className="px-5 py-3 text-sm font-medium text-vct-text">
                                        {CATEGORY_ICONS[row.category] ?? '📋'} {row.label}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-right font-semibold text-emerald-400">
                                        {row.income > 0 ? fmt(row.income) : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-right font-semibold text-red-400">
                                        {row.expense > 0 ? fmt(row.expense) : '—'}
                                    </td>
                                    <td className="px-5 py-3 text-sm text-right font-bold" style={{ color: net >= 0 ? '#3b82f6' : '#ef4444' }}>
                                        {net >= 0 ? '+' : ''}{fmt(net)}
                                    </td>
                                </tr>
                            );
                        })}
                        {/* Totals */}
                        <tr className="border-t-2 border-vct-border bg-vct-bg/30">
                            <td className="px-5 py-3.5 text-sm font-bold text-vct-text">TỔNG CỘNG</td>
                            <td className="px-5 py-3.5 text-sm text-right font-extrabold text-emerald-400">{fmt(totalIncome)}</td>
                            <td className="px-5 py-3.5 text-sm text-right font-extrabold text-red-400">{fmt(totalExpense)}</td>
                            <td className="px-5 py-3.5 text-sm text-right font-extrabold" style={{ color: balance >= 0 ? '#3b82f6' : '#ef4444' }}>
                                {balance >= 0 ? '+' : ''}{fmt(balance)}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            {/* Audit Trails */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-5 mt-6">
                <h3 className="text-sm font-bold text-vct-text mb-4">📜 Nhật ký Kế toán (Audit Trails)</h3>
                <VCT_Timeline events={FINANCE_AUDIT_LOGS} />
            </div>
        </VCT_PageContainer>
    );
}

export default Page_federation_finance;
