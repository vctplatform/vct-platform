'use client';
'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button,
    VCT_SearchInput, VCT_Tabs,
    VCT_ConfirmDialog, VCT_EmptyState
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { exportToCSV } from './utils/adminExport'

import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'
import './admin.module.css'

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



const MODULE_FILTERS = ['Tất cả', 'Chấm điểm', 'Giải đấu', 'Đào tạo', 'Cộng đồng', 'Di sản', 'Hệ thống']

const STATUS_STYLES: Record<string, { label: string; color: string; bgColor: string }> = {
    enabled: { label: 'Đang bật', color: 'emerald', bgColor: '#10b98115' },
    disabled: { label: 'Đang tắt', color: 'slate', bgColor: '#94a3b815' },
    partial: { label: 'Rollout', color: 'amber', bgColor: '#f59e0b15' },
}

// ════════════════════════════════════════
// SKELETON COMPONENT
// ════════════════════════════════════════
const SkeletonFlagCard = () => (
    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 animate-pulse">
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="h-5 w-40 bg-(--vct-bg-card) rounded" />
                    <div className="h-4 w-24 bg-(--vct-bg-card) rounded" />
                </div>
                <div className="h-4 w-3/4 bg-(--vct-bg-card) rounded" />
                <div className="flex gap-4">
                    <div className="h-3 w-20 bg-(--vct-bg-card) rounded" />
                    <div className="h-3 w-28 bg-(--vct-bg-card) rounded" />
                    <div className="h-3 w-24 bg-(--vct-bg-card) rounded" />
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className="h-5 w-[120px] bg-(--vct-bg-card) rounded" />
                <div className="h-7 w-14 bg-(--vct-bg-card) rounded-full" />
            </div>
        </div>
        <div className="mt-3 h-1 rounded-full bg-(--vct-border-strong)" />
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_feature_flags = () => (
    <AdminGuard>
        <Page_admin_feature_flags_Content />
    </AdminGuard>
)

const Page_admin_feature_flags_Content = () => {
    const { t } = useI18n()
    const { data: fetchedFlags, isLoading } = useAdminFetch<FeatureFlag[]>('/admin/feature-flags')
    const [flags, setFlags] = useState<FeatureFlag[]>([])
    const [search, setSearch] = useState('')
    const [moduleFilter, setModuleFilter] = useState('Tất cả')
    const { showToast } = useShellToast()
    const [confirmToggle, setConfirmToggle] = useState<FeatureFlag | null>(null)

    React.useEffect(() => { if (fetchedFlags) setFlags(fetchedFlags) }, [fetchedFlags])

    const filtered = useMemo(() => {
        let data = flags
        if (moduleFilter !== 'Tất cả') data = data.filter(f => f.module === moduleFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(f => f.name.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) || f.description.toLowerCase().includes(q))
        }
        return data
    }, [flags, moduleFilter, search])

    const { mutate: mutateToggle } = useAdminMutation<FeatureFlag, { id: string; status: string; rollout_pct: number }>(
        '/admin/feature-flags',
        { method: 'PATCH', onError: () => showToast('Lỗi API, đã cập nhật cục bộ', 'warning') }
    )

    const doToggle = async (flag: FeatureFlag) => {
        const newStatus = flag.status === 'enabled' ? 'disabled' : 'enabled'
        const newPct = newStatus === 'enabled' ? 100 : 0
        await mutateToggle({ id: flag.id, status: newStatus, rollout_pct: newPct })
        setFlags(prev => prev.map(f => {
            if (f.id !== flag.id) return f
            return { ...f, status: newStatus, rollout_pct: newPct, updated_at: new Date().toLocaleString('vi-VN'), updated_by: 'admin@vct.vn' }
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

    const updateRollout = async (id: string, pct: number) => {
        await mutateToggle({ id, status: pct === 0 ? 'disabled' : pct === 100 ? 'enabled' : 'partial', rollout_pct: pct })
        setFlags(prev => prev.map(f => {
            if (f.id !== id) return f
            const status: FeatureFlag['status'] = pct === 0 ? 'disabled' : pct === 100 ? 'enabled' : 'partial'
            return { ...f, rollout_pct: pct, status, updated_at: new Date().toLocaleString('vi-VN') }
        }))
    }

    const handleExportCSV = () => {
        exportToCSV({
            headers: ['ID', 'Key', 'Tên', 'Module', 'Trạng thái', 'Rollout %', 'Scope', 'Cập nhật', 'Bởi'],
            rows: flags.map(f => [f.id, f.key, f.name, f.module, STATUS_STYLES[f.status]?.label ?? '', `${f.rollout_pct}%`, f.scope, f.updated_at, f.updated_by]),
            filename: `vct_feature_flags_${new Date().toISOString().slice(0, 10)}.csv`,
        })
        showToast('Đã xuất danh sách feature flags!')
    }

    const stats: StatItem[] = [
        { label: 'Features', value: flags.length, icon: <VCT_Icons.Flag size={18} />, color: '#8b5cf6' },
        { label: t('admin.flags.enabled'), value: flags.filter(f => f.status === 'enabled').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
        { label: t('admin.flags.rollout'), value: flags.filter(f => f.status === 'partial').length, icon: <VCT_Icons.Activity size={18} />, color: '#f59e0b' },
        { label: t('admin.flags.disabled'), value: flags.filter(f => f.status === 'disabled').length, icon: <VCT_Icons.x size={18} />, color: '#ef4444' },
    ]

    return (
        <AdminPageShell
            title={t('admin.flags.title')}
            subtitle={t('admin.flags.subtitle')}
            icon={<VCT_Icons.Flag size={28} className="text-[#8b5cf6]" />}
            breadcrumbs={[
                { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
                { label: 'Feature Flags' },
            ]}
            stats={stats}
            actions={
                <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={handleExportCSV}>Xuất CSV</VCT_Button>
            }
        >

            {/* ── FILTER ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-(--vct-border-subtle) pb-4">
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
                            <div key={flag.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 hover:border-(--vct-accent-cyan) transition-all">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <span className="font-bold text-(--vct-text-primary)">{flag.name}</span>
                                            <span className="font-mono text-[10px] text-(--vct-accent-cyan) bg-(--vct-accent-cyan)/10 px-2 py-0.5 rounded">{flag.key}</span>
                                            <VCT_Badge text={flag.module} type="info" />
                                        </div>
                                        <p className="text-sm text-(--vct-text-secondary) mb-3">{flag.description}</p>
                                        <div className="flex items-center gap-4 text-[11px] text-(--vct-text-tertiary)">
                                            <span className="flex items-center gap-1"><VCT_Icons.Layers size={10} /> Scope: {flag.scope}</span>
                                            <span className="flex items-center gap-1"><VCT_Icons.Clock size={10} /> {flag.updated_at}</span>
                                            <span className="flex items-center gap-1"><VCT_Icons.User size={10} /> {flag.updated_by}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 shrink-0">
                                        {/* Rollout slider */}
                                        <div className="flex flex-col items-center gap-1 w-[120px]">
                                            <div className="admin-colored-label" data-color={st.color}>{flag.rollout_pct}%</div>
                                            <input
                                                type="range" min="0" max="100" step="5"
                                                value={flag.rollout_pct}
                                                onChange={(e) => updateRollout(flag.id, parseInt(e.target.value))}
                                                aria-label={`Rollout ${flag.name}`}
                                                className="admin-rollout-slider"
                                                data-color={st.color}
                                                style={{ '--_slider-pct': `${flag.rollout_pct}%` } as React.CSSProperties}
                                            />
                                        </div>

                                        {/* Toggle */}
                                        <button
                                            onClick={() => toggleFlag(flag)}
                                            aria-label={`${flag.status !== 'disabled' ? 'Tắt' : 'Bật'} ${flag.name}`}
                                            role="switch"
                                            aria-checked={flag.status !== 'disabled' ? true : false}
                                            className={`relative w-14 h-7 rounded-full transition-all duration-300 cursor-pointer ${flag.status !== 'disabled' ? 'bg-[#10b981] shadow-[0_0_12px_#10b98140]' : 'bg-(--vct-border-strong)'
                                                }`}>
                                            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${flag.status !== 'disabled' ? 'left-8' : 'left-1'
                                                }`}></div>
                                        </button>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-3 h-1 rounded-full bg-(--vct-border-strong) overflow-hidden">
                                    <div className="admin-progress-bar__fill" data-color={st.color} style={{ '--_fill-width': `${flag.rollout_pct}%` } as React.CSSProperties}></div>
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
        </AdminPageShell>
    )
}
