'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Tabs, VCT_PageContainer, VCT_StatRow,
    VCT_ConfirmDialog, VCT_EmptyState
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface FeatureFlag {
    id: string
    key: string
    name: string
    description: string
    module: string
    status: 'enabled' | 'disabled' | 'partial'
    rollout_pct: number
    scope: 'global' | 'federation' | 'club' | 'user'
    updated_at: string
    updated_by: string
}

const MOCK_FLAGS: FeatureFlag[] = [
    { id: 'FF-001', key: 'offline_scoring', name: 'Chấm điểm Offline', description: 'Cho phép chấm điểm khi mất kết nối mạng, đồng bộ khi có mạng', module: 'Chấm điểm', status: 'enabled', rollout_pct: 100, scope: 'global', updated_at: '10/03/2024 08:00', updated_by: 'admin@vct.vn' },
    { id: 'FF-002', key: 'video_review', name: 'Video Review (VAR)', description: 'Hỗ trợ xem lại video khi có khiếu nại', module: 'Giải đấu', status: 'partial', rollout_pct: 50, scope: 'federation', updated_at: '09/03/2024 14:30', updated_by: 'admin@vct.vn' },
    { id: 'FF-003', key: 'elearning_module', name: 'Module E-Learning', description: 'Nền tảng học trực tuyến với video courses và quiz', module: 'Đào tạo', status: 'disabled', rollout_pct: 0, scope: 'global', updated_at: '05/03/2024 10:00', updated_by: 'admin@vct.vn' },
    { id: 'FF-004', key: 'ai_coach', name: 'AI Coach Assistant', description: 'Phân tích video bằng AI, gợi ý kế hoạch tập luyện', module: 'Đào tạo', status: 'disabled', rollout_pct: 0, scope: 'global', updated_at: '01/03/2024 09:00', updated_by: 'admin@vct.vn' },
    { id: 'FF-005', key: 'marketplace', name: 'Marketplace', description: 'Mua bán trang phục, dụng cụ tập luyện', module: 'Cộng đồng', status: 'partial', rollout_pct: 20, scope: 'club', updated_at: '08/03/2024 16:45', updated_by: 'admin@vct.vn' },
    { id: 'FF-006', key: 'live_streaming', name: 'Live Streaming', description: 'Phát trực tiếp giải đấu', module: 'Giải đấu', status: 'disabled', rollout_pct: 0, scope: 'federation', updated_at: '01/03/2024 12:00', updated_by: 'admin@vct.vn' },
    { id: 'FF-007', key: 'qr_attendance', name: 'QR Code Điểm Danh', description: 'Điểm danh bằng quét mã QR', module: 'Đào tạo', status: 'enabled', rollout_pct: 100, scope: 'club', updated_at: '07/03/2024 11:00', updated_by: 'admin@vct.vn' },
    { id: 'FF-008', key: 'heritage_lineage', name: 'Cây Gia Phả Tương Tác', description: 'Hiển thị cây phả hệ bằng D3.js, tương tác', module: 'Di sản', status: 'enabled', rollout_pct: 100, scope: 'global', updated_at: '06/03/2024 15:20', updated_by: 'admin@vct.vn' },
    { id: 'FF-009', key: 'push_notifications', name: 'Push Notifications', description: 'Thông báo đẩy qua FCM', module: 'Hệ thống', status: 'partial', rollout_pct: 75, scope: 'user', updated_at: '09/03/2024 09:30', updated_by: 'admin@vct.vn' },
    { id: 'FF-010', key: 'dark_mode', name: 'Chế độ tối', description: 'Giao diện dark mode cho mắt nhìn thoải mái', module: 'Hệ thống', status: 'enabled', rollout_pct: 100, scope: 'user', updated_at: '01/02/2024 10:00', updated_by: 'admin@vct.vn' },
]

const MODULE_FILTERS = ['Tất cả', 'Chấm điểm', 'Giải đấu', 'Đào tạo', 'Cộng đồng', 'Di sản', 'Hệ thống']

const STATUS_STYLES: Record<string, { label: string; color: string; bgColor: string }> = {
    enabled: { label: 'Đang bật', color: '#10b981', bgColor: '#10b98115' },
    disabled: { label: 'Đang tắt', color: '#94a3b8', bgColor: '#94a3b815' },
    partial: { label: 'Rollout', color: '#f59e0b', bgColor: '#f59e0b15' },
}

// ════════════════════════════════════════
// SKELETON COMPONENT
// ════════════════════════════════════════
const SkeletonFlagCard = () => (
    <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-40 bg-[var(--vct-bg-card)] rounded" />
                    <div className="h-4 w-24 bg-[var(--vct-bg-card)] rounded" />
                </div>
                <div className="h-4 w-3/4 bg-[var(--vct-bg-card)] rounded" />
                <div className="flex gap-4">
                    <div className="h-3 w-20 bg-[var(--vct-bg-card)] rounded" />
                    <div className="h-3 w-28 bg-[var(--vct-bg-card)] rounded" />
                    <div className="h-3 w-24 bg-[var(--vct-bg-card)] rounded" />
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className="h-5 w-[120px] bg-[var(--vct-bg-card)] rounded" />
                <div className="h-7 w-14 bg-[var(--vct-bg-card)] rounded-full" />
            </div>
        </div>
        <div className="mt-3 h-1 rounded-full bg-[var(--vct-border-strong)]" />
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_feature_flags = () => {
    const [flags, setFlags] = useState<FeatureFlag[]>(MOCK_FLAGS)
    const [search, setSearch] = useState('')
    const [moduleFilter, setModuleFilter] = useState('Tất cả')
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [isLoading, setIsLoading] = useState(true)
    const [confirmToggle, setConfirmToggle] = useState<FeatureFlag | null>(null)

    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    const filtered = useMemo(() => {
        let data = flags
        if (moduleFilter !== 'Tất cả') data = data.filter(f => f.module === moduleFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(f => f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
        }
        return data
    }, [flags, moduleFilter, search])

    const doToggle = (flag: FeatureFlag) => {
        setFlags(prev => prev.map(f => {
            if (f.id !== flag.id) return f
            const newStatus = f.status === 'enabled' ? 'disabled' : 'enabled'
            return { ...f, status: newStatus, rollout_pct: newStatus === 'enabled' ? 100 : 0, updated_at: new Date().toLocaleString('vi-VN'), updated_by: 'admin@vct.vn' }
        }))
        showToast(`${flag.name}: ${flag.status === 'enabled' ? 'Đã tắt' : 'Đã bật'}`, flag.status === 'enabled' ? 'warning' : 'success')
    }

    const toggleFlag = (flag: FeatureFlag) => {
        // Confirm if toggling an enabled critical feature
        if (flag.status === 'enabled' && flag.scope === 'global') {
            setConfirmToggle(flag)
            return
        }
        doToggle(flag)
    }

    const updateRollout = (id: string, pct: number) => {
        setFlags(prev => prev.map(f => {
            if (f.id !== id) return f
            const status = pct === 0 ? 'disabled' : pct === 100 ? 'enabled' : 'partial'
            return { ...f, rollout_pct: pct, status: status as any, updated_at: new Date().toLocaleString('vi-VN') }
        }))
    }

    const handleExportCSV = () => {
        const header = 'ID,Key,Tên,Module,Trạng thái,Rollout %,Scope,Cập nhật,Bởi'
        const csv = [header, ...flags.map(f => `${f.id},${f.key},"${f.name}",${f.module},${STATUS_STYLES[f.status]?.label},${f.rollout_pct}%,${f.scope},${f.updated_at},${f.updated_by}`)].join('\n')
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a'); a.href = url; a.download = `vct_feature_flags_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
        URL.revokeObjectURL(url)
        showToast('Đã xuất danh sách feature flags!')
    }

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Feature Flags</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Bật/tắt tính năng, kiểm soát rollout theo phần trăm hoặc phạm vi.</p>
                </div>
                <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={handleExportCSV}>Xuất CSV</VCT_Button>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Features', value: flags.length, icon: <VCT_Icons.Flag size={18} />, color: '#8b5cf6' },
                { label: 'Đang bật', value: flags.filter(f => f.status === 'enabled').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                { label: 'Rollout', value: flags.filter(f => f.status === 'partial').length, icon: <VCT_Icons.Activity size={18} />, color: '#f59e0b' },
                { label: 'Đang tắt', value: flags.filter(f => f.status === 'disabled').length, icon: <VCT_Icons.x size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-8" />

            {/* ── FILTER ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--vct-border-subtle)] pb-4">
                <VCT_Tabs
                    tabs={MODULE_FILTERS.map(m => ({ key: m, label: m }))}
                    activeTab={moduleFilter}
                    onChange={setModuleFilter}
                />
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm theo tên, key..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── FLAG CARDS ── */}
            <div className="space-y-3">
                {isLoading ? (
                    [...Array(4)].map((_, i) => <SkeletonFlagCard key={i} />)
                ) : filtered.length === 0 ? (
                    <VCT_EmptyState title="Không tìm thấy feature flag" description="Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm." icon="🚩" />
                ) : (
                    filtered.map(flag => {
                        const st = STATUS_STYLES[flag.status] || STATUS_STYLES.disabled!
                        return (
                            <div key={flag.id} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5 hover:border-[var(--vct-accent-cyan)] transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-[var(--vct-text-primary)]">{flag.name}</span>
                                            <span className="font-mono text-[10px] text-[var(--vct-accent-cyan)] bg-[var(--vct-accent-cyan)]/10 px-2 py-0.5 rounded">{flag.key}</span>
                                            <VCT_Badge text={flag.module} type="info" />
                                        </div>
                                        <p className="text-sm text-[var(--vct-text-secondary)] mb-3">{flag.description}</p>
                                        <div className="flex items-center gap-4 text-[11px] text-[var(--vct-text-tertiary)]">
                                            <span className="flex items-center gap-1"><VCT_Icons.Layers size={10} /> Scope: {flag.scope}</span>
                                            <span className="flex items-center gap-1"><VCT_Icons.Clock size={10} /> {flag.updated_at}</span>
                                            <span className="flex items-center gap-1"><VCT_Icons.User size={10} /> {flag.updated_by}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        {/* Rollout slider */}
                                        <div className="flex flex-col items-center gap-1 w-[120px]">
                                            <div className="text-[11px] font-bold" style={{ color: st.color }}>{flag.rollout_pct}%</div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={flag.rollout_pct}
                                                onChange={(e) => updateRollout(flag.id, parseInt(e.target.value))}
                                                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                                                style={{ accentColor: st.color, background: `linear-gradient(to right, ${st.color} ${flag.rollout_pct}%, var(--vct-border-strong) ${flag.rollout_pct}%)` }}
                                            />
                                        </div>

                                        {/* Toggle */}
                                        <button onClick={() => toggleFlag(flag)}
                                            className={`relative w-14 h-7 rounded-full transition-all duration-300 ${flag.status !== 'disabled' ? 'bg-[#10b981] shadow-[0_0_12px_#10b98140]' : 'bg-[var(--vct-border-strong)]'
                                                }`}>
                                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${flag.status !== 'disabled' ? 'left-8' : 'left-1'
                                                }`}></div>
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3 h-1 rounded-full bg-[var(--vct-border-strong)] overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${flag.rollout_pct}%`, background: st.color }}></div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

            {/* ── CONFIRM TOGGLE DIALOG ── */}
            <VCT_ConfirmDialog
                isOpen={!!confirmToggle}
                onClose={() => setConfirmToggle(null)}
                onConfirm={() => { if (confirmToggle) doToggle(confirmToggle); setConfirmToggle(null) }}
                title="Tắt tính năng toàn hệ thống"
                message={`Bạn có chắc muốn tắt "${confirmToggle?.name}"? Tính năng này đang hoạt động trên toàn hệ thống (scope: global).`}
                confirmLabel="Tắt tính năng"
            />
        </VCT_PageContainer>
    )
}
