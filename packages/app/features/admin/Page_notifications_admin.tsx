'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select,
    VCT_Modal, VCT_Input, VCT_Field, VCT_Toast, VCT_ConfirmDialog,
    VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { usePagination } from '../hooks/usePagination'
import { AdminPaginationBar } from './components/AdminPaginationBar'
import { AdminSkeletonRow } from './components/AdminSkeletonRow'
import { useAdminToast } from './hooks/useAdminToast'
import { exportToCSV, exportToJSON } from './utils/adminExport'
import { useAdminFetch } from './hooks/useAdminAPI'

// ════════════════════════════════════════
// MOCK DATA — Notification Management
// ════════════════════════════════════════
const INITIAL_TEMPLATES = [
    { id: 'TPL-001', category: 'MATCH_CALL', channel: 'push', locale: 'vi-VN', title: '{{athlete_name}} lên thảm {{tatami_number}}', variables: ['athlete_name', 'tatami_number', 'match_time'], version: 1, is_active: true },
    { id: 'TPL-002', category: 'RESULT_ANNOUNCEMENT', channel: 'push', locale: 'vi-VN', title: 'Kết quả: {{category_name}}', variables: ['category_name', 'gold_name', 'silver_name'], version: 1, is_active: true },
    { id: 'TPL-003', category: 'SCHEDULE_CHANGE', channel: 'sms', locale: 'vi-VN', title: 'Thay đổi lịch thi đấu', variables: ['tournament_name', 'old_time', 'new_time'], version: 2, is_active: true },
    { id: 'TPL-004', category: 'REGISTRATION_UPDATE', channel: 'email', locale: 'vi-VN', title: 'Cập nhật đăng ký: {{tournament_name}}', variables: ['tournament_name', 'status', 'note'], version: 1, is_active: true },
    { id: 'TPL-005', category: 'MATCH_CALL', channel: 'sms', locale: 'vi-VN', title: 'VDV {{athlete_name}} chuẩn bị thi đấu', variables: ['athlete_name', 'tatami_number'], version: 1, is_active: false },
    { id: 'TPL-006', category: 'SYSTEM_ALERT', channel: 'push', locale: 'vi-VN', title: 'Cảnh báo hệ thống: {{alert_type}}', variables: ['alert_type', 'details'], version: 1, is_active: true },
]

interface NotifStat {
    category: string
    total: number
    delivered: number
    failed: number
    read: number
    rate: number
}

const CATEGORY_OPTIONS = [
    { value: 'MATCH_CALL', label: 'Gọi thi đấu' },
    { value: 'RESULT_ANNOUNCEMENT', label: 'Thông báo kết quả' },
    { value: 'SCHEDULE_CHANGE', label: 'Thay đổi lịch' },
    { value: 'REGISTRATION_UPDATE', label: 'Cập nhật đăng ký' },
    { value: 'SYSTEM_ALERT', label: 'Cảnh báo hệ thống' },
    { value: 'MARKETING', label: 'Marketing' },
]

const CATEGORY_LABELS: Record<string, string> = CATEGORY_OPTIONS.reduce<Record<string, string>>((acc, o) => {
    acc[o.value] = o.label
    return acc
}, {})

const CHANNEL_OPTIONS = [
    { value: 'push', label: '📱 Push' },
    { value: 'sms', label: '💬 SMS' },
    { value: 'email', label: '📧 Email' },
    { value: 'zalo', label: '💙 Zalo' },
]

const CHANNEL_LABELS: Record<string, string> = CHANNEL_OPTIONS.reduce<Record<string, string>>((acc, o) => {
    acc[o.value] = o.label
    return acc
}, {})

const BLANK_NOTIF = { category: 'MATCH_CALL', channel: 'push', locale: 'vi-VN', title: '', variablesText: '', is_active: true }

// Skeleton and Pagination components are now shared from ./components/

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_notifications_admin = () => {
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
    const { data: fetchedStats } = useAdminFetch<NotifStat[]>('/admin/notifications/stats')
    const stats = useMemo(() => fetchedStats ?? [], [fetchedStats])
    const [search, setSearch] = useState('')
    const [channelFilter, setChannelFilter] = useState('all')
    const [tab, setTab] = useState<'templates' | 'stats'>('templates')
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState(BLANK_NOTIF)
    const { toast, showToast, dismiss } = useAdminToast()
    const [drawerTpl, setDrawerTpl] = useState<typeof INITIAL_TEMPLATES[0] | null>(null)
    const [confirmToggle, setConfirmToggle] = useState<typeof INITIAL_TEMPLATES[0] | null>(null)

    // Simulate initial loading
    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    const filteredTemplates = useMemo(() => {
        let v = templates
        if (channelFilter !== 'all') v = v.filter(t => t.channel === channelFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
        }
        return v
    }, [search, channelFilter, templates])

    const tplPagination = usePagination(filteredTemplates, { pageSize: 5 })



    const handleSubmitTemplate = useCallback(() => {
        if (!form.title.trim()) return
        const newTpl = {
            id: `TPL-${String(templates.length + 1).padStart(3, '0')}`,
            category: form.category,
            channel: form.channel,
            locale: form.locale,
            title: form.title.trim(),
            variables: form.variablesText.split(',').map(v => v.trim()).filter(Boolean),
            version: 1,
            is_active: form.is_active,
        }
        setTemplates(prev => [newTpl, ...prev])
        setShowAddModal(false)
        setForm(BLANK_NOTIF)
        showToast(`Đã tạo mẫu thông báo "${newTpl.title}" thành công!`)
    }, [form, templates.length, showToast])

    const notifStats = useMemo(() => ({
        totalTemplates: templates.length,
        activeTemplates: templates.filter(t => t.is_active).length,
        totalSent: stats.reduce((s, st) => s + st.total, 0),
        avgDelivery: stats.length > 0 ? (stats.reduce((s, st) => s + st.rate, 0) / stats.length).toFixed(1) : '0.0',
    }), [templates, stats])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={dismiss} />

            <div className="mb-6 flex flex-col sm:flex-row sm:flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-(--vct-text-primary)">Quản Lý Thông Báo</h1>
                    <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý mẫu thông báo, theo dõi delivery, cấu hình multi-channel.</p>
                </div>
                <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />} onClick={() => setShowAddModal(true)}>Thêm mẫu</VCT_Button>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Mẫu TB', value: notifStats.totalTemplates, icon: <VCT_Icons.Mail size={18} />, color: '#8b5cf6' },
                { label: 'Active', value: notifStats.activeTemplates, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                { label: 'Tổng gửi', value: notifStats.totalSent.toLocaleString(), icon: <VCT_Icons.TrendingUp size={18} />, color: '#0ea5e9' },
                { label: 'Delivery', value: `${notifStats.avgDelivery}%`, icon: <VCT_Icons.Activity size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-8" />

            {/* ── BULK EXPORT (Stats) ── */}
            {tab === 'stats' && (
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-(--vct-bg-elevated) rounded-xl border border-(--vct-border-subtle)">
                    <span className="text-xs text-(--vct-text-tertiary)">
                        📊 {stats.length} categories • {stats.reduce((s, st) => s + st.total, 0).toLocaleString()} thông báo
                    </span>
                    <div className="flex flex-wrap gap-2">
                        <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Download size={14} />} onClick={() => {
                            exportToCSV({
                                headers: ['Category', 'Tổng gửi', 'Đã giao', 'Thất bại', 'Đã đọc', 'Tỷ lệ giao'],
                                rows: stats.map(s => [CATEGORY_LABELS[s.category] || s.category, String(s.total), String(s.delivered), String(s.failed), String(s.read), `${s.rate}%`]),
                                filename: `vct_notification_stats_${new Date().toISOString().slice(0, 10)}.csv`,
                            })
                            showToast('Đã xuất file CSV thống kê delivery!')
                        }}>Xuất CSV</VCT_Button>
                        <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Download size={14} />} onClick={() => {
                            exportToJSON({
                                data: {
                                    exported_at: new Date().toISOString(),
                                    summary: {
                                        total_categories: stats.length,
                                        total_sent: stats.reduce((s, st) => s + st.total, 0),
                                        total_delivered: stats.reduce((s, st) => s + st.delivered, 0),
                                        total_failed: stats.reduce((s, st) => s + st.failed, 0),
                                        avg_delivery_rate: stats.length > 0 ? (stats.reduce((s, st) => s + st.rate, 0) / stats.length).toFixed(1) + '%' : '0%',
                                    },
                                    categories: stats.map(s => ({ ...s, label: CATEGORY_LABELS[s.category] || s.category })),
                                    templates: templates.map(t => ({ id: t.id, category: t.category, channel: t.channel, title: t.title, is_active: t.is_active, version: t.version })),
                                },
                                filename: `vct_notifications_export_${new Date().toISOString().slice(0, 10)}.json`,
                            })
                            showToast('Đã xuất file JSON đầy đủ (stats + templates)!')
                        }}>Xuất JSON</VCT_Button>
                    </div>
                </div>
            )}

            {/* ── TABS ── */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('templates')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'templates' ? 'bg-(--vct-accent-blue,#3b82f6) text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:text-(--vct-text-primary)'}`}
                >Mẫu thông báo</button>
                <button
                    onClick={() => setTab('stats')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'stats' ? 'bg-(--vct-accent-blue,#3b82f6) text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:text-(--vct-text-primary)'}`}
                >Thống kê delivery</button>
            </div>

            {tab === 'templates' ? (
                <>
                    {/* ── FILTERS ── */}
                    <div className="flex flex-wrap gap-4 mb-6">
                        <div className="flex-1 min-w-[200px]">
                            <VCT_SearchInput placeholder="Tìm theo tiêu đề hoặc category..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                        </div>
                        <VCT_Select
                            value={channelFilter}
                            onChange={setChannelFilter}
                            options={[
                                { value: 'all', label: 'Tất cả kênh' },
                                ...CHANNEL_OPTIONS,
                            ]}
                        />
                    </div>

                    {/* ── TEMPLATES TABLE ── */}
                    <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                                    <th className="p-4 w-20">Trạng thái</th>
                                    <th className="p-4 w-36">Category</th>
                                    <th className="p-4 w-24">Kênh</th>
                                    <th className="p-4">Tiêu đề mẫu</th>
                                    <th className="p-4 w-20 text-center">Version</th>
                                    <th className="p-4 w-40">Variables</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-(--vct-border-subtle)">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={6} />)
                                ) : tplPagination.paginatedItems.length === 0 ? (
                                    <tr><td colSpan={6} className="p-12 text-center text-(--vct-text-tertiary)">Không tìm thấy mẫu thông báo nào</td></tr>
                                ) : (
                                    tplPagination.paginatedItems.map(tpl => (
                                        <tr key={tpl.id} className="hover:bg-white/5 transition-colors text-sm cursor-pointer" onClick={() => setDrawerTpl(tpl)}>
                                            <td className="p-4"><VCT_Badge type={tpl.is_active ? 'success' : 'neutral'} text={tpl.is_active ? 'Active' : 'Inactive'} /></td>
                                            <td className="p-4 text-(--vct-text-primary)">{CATEGORY_LABELS[tpl.category] || tpl.category}</td>
                                            <td className="p-4">{CHANNEL_LABELS[tpl.channel] || tpl.channel}</td>
                                            <td className="p-4 font-mono text-[12px] text-(--vct-accent-cyan)">{tpl.title}</td>
                                            <td className="p-4 text-center text-(--vct-text-tertiary)">v{tpl.version}</td>
                                            <td className="p-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {tpl.variables.map(v => (
                                                        <span key={v} className="bg-(--vct-bg-base) border border-(--vct-border-subtle) px-1.5 py-0.5 rounded text-[9px] font-mono text-(--vct-text-tertiary)">{v}</span>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        {!isLoading && <AdminPaginationBar {...tplPagination} />}
                    </div>
                </>
            ) : (
                /* ── STATS TABLE ── */
                <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right w-28">Tổng gửi</th>
                                <th className="p-4 text-right w-28">Đã giao</th>
                                <th className="p-4 text-right w-28">Thất bại</th>
                                <th className="p-4 text-right w-28">Đã đọc</th>
                                <th className="p-4 text-right w-28">Tỷ lệ giao</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={6} />)
                            ) : (
                                stats.map(stat => (
                                    <tr key={stat.category} className="hover:bg-white/5 transition-colors text-sm">
                                        <td className="p-4 font-semibold text-(--vct-text-primary)">{CATEGORY_LABELS[stat.category] || stat.category}</td>
                                        <td className="p-4 text-right font-mono text-[12px] text-(--vct-text-secondary)">{stat.total.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono text-[12px] text-(--vct-accent-green,#22c55e)">{stat.delivered.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono text-[12px]" style={{ color: stat.failed > 0 ? 'var(--vct-accent-red,#ef4444)' : 'var(--vct-accent-green,#22c55e)' }}>{stat.failed}</td>
                                        <td className="p-4 text-right font-mono text-[12px] text-(--vct-text-secondary)">{stat.read.toLocaleString()}</td>
                                        <td className="p-4 text-right font-mono text-[12px] font-bold" style={{ color: stat.rate >= 98 ? 'var(--vct-accent-green,#22c55e)' : 'var(--vct-accent-yellow,#eab308)' }}>{stat.rate}%</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── TEMPLATE DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerTpl} onClose={() => setDrawerTpl(null)} title="Chi tiết mẫu thông báo" width={520}>
                {drawerTpl && (
                    <div className="space-y-5">
                        <div className="flex items-center justify-between pb-4 border-b border-(--vct-border-subtle)">
                            <VCT_Badge type={drawerTpl.is_active ? 'success' : 'neutral'} text={drawerTpl.is_active ? 'Active' : 'Inactive'} />
                            <span className="font-mono text-xs text-(--vct-text-tertiary)">{drawerTpl.id} • v{drawerTpl.version}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Category</div><div className="font-semibold text-(--vct-text-primary)">{CATEGORY_LABELS[drawerTpl.category] || drawerTpl.category}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Kênh gửi</div><div className="font-semibold text-(--vct-text-primary)">{CHANNEL_LABELS[drawerTpl.channel] || drawerTpl.channel}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Ngôn ngữ</div><div className="text-(--vct-text-primary)">{drawerTpl.locale}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Version</div><div className="text-(--vct-text-primary)">v{drawerTpl.version}</div></div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Preview — Live</div>

                            {/* Channel-specific preview wrapper */}
                            {drawerTpl.channel === 'push' ? (
                                <div className="p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-[#0ea5e9] flex items-center justify-center text-white text-[10px] font-bold">V</div>
                                        <span className="text-[10px] text-(--vct-text-tertiary) font-semibold uppercase">VCT Platform · Bây giờ</span>
                                    </div>
                                    <div className="font-semibold text-sm text-(--vct-text-primary)">
                                        {drawerTpl.title.replace(/\{\{(\w+)\}\}/g, (_, v: string) => {
                                            const samples: Record<string, string> = {
                                                athlete_name: 'Nguyễn Văn A', tatami_number: '3', match_time: '14:30',
                                                category_name: 'Đối kháng Nam 65kg', gold_name: 'Trần B', silver_name: 'Lê C',
                                                tournament_name: 'Giải VĐ QG 2024', old_time: '09:00', new_time: '10:30',
                                                status: 'Đã duyệt', note: 'Kiểm tra hồ sơ', alert_type: 'Maintenance', details: 'DB backup',
                                            }
                                            return samples[v] || v
                                        })}
                                    </div>
                                </div>
                            ) : drawerTpl.channel === 'email' ? (
                                <div className="bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) overflow-hidden">
                                    <div className="px-4 py-2 bg-[#0ea5e910] border-b border-(--vct-border-subtle) flex items-center gap-2">
                                        <VCT_Icons.Mail size={14} className="text-[#0ea5e9]" />
                                        <span className="text-[10px] text-(--vct-text-tertiary) font-semibold">noreply@vct.vn</span>
                                    </div>
                                    <div className="p-4">
                                        <div className="font-semibold text-sm text-(--vct-text-primary)">
                                            {drawerTpl.title.replace(/\{\{(\w+)\}\}/g, (_, v: string) => {
                                                const samples: Record<string, string> = {
                                                    athlete_name: 'Nguyễn Văn A', category_name: 'Đối kháng Nam 65kg',
                                                    tournament_name: 'Giải VĐ QG 2024', status: 'Đã duyệt', alert_type: 'Maintenance',
                                                }
                                                return samples[v] || v
                                            })}
                                        </div>
                                        <div className="text-xs text-(--vct-text-tertiary) mt-2">Nội dung email sẽ hiển thị ở đây...</div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="inline-block bg-[#0ea5e9] text-white text-sm px-3 py-2 rounded-xl rounded-bl-none max-w-[80%]">
                                        {drawerTpl.title.replace(/\{\{(\w+)\}\}/g, (_, v: string) => {
                                            const samples: Record<string, string> = {
                                                athlete_name: 'Nguyễn Văn A', tatami_number: '3',
                                                tournament_name: 'Giải VĐ QG 2024', old_time: '09:00', new_time: '10:30',
                                            }
                                            return samples[v] || v
                                        })}
                                    </div>
                                    <div className="text-[10px] text-(--vct-text-tertiary) mt-1">{drawerTpl.channel === 'sms' ? 'SMS Preview' : 'Zalo Preview'}</div>
                                </div>
                            )}

                            {/* Raw template */}
                            <div className="mt-2 p-2 bg-(--vct-bg-base) rounded-lg border border-dashed border-(--vct-border-subtle)">
                                <div className="text-[9px] text-(--vct-text-tertiary) mb-1 uppercase font-bold">Raw Template</div>
                                <code className="font-mono text-[11px] text-(--vct-accent-cyan)">{drawerTpl.title}</code>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Variables & Sample Data</div>
                            <div className="grid grid-cols-1 gap-1.5">
                                {drawerTpl.variables.map(v => {
                                    const sampleValues: Record<string, string> = {
                                        athlete_name: 'Nguyễn Văn A', tatami_number: '3', match_time: '14:30',
                                        category_name: 'Đối kháng Nam 65kg', gold_name: 'Trần B', silver_name: 'Lê C',
                                        tournament_name: 'Giải VĐ QG 2024', old_time: '09:00', new_time: '10:30',
                                        status: 'Đã duyệt', note: 'Kiểm tra hồ sơ', alert_type: 'Maintenance', details: 'DB backup',
                                    }
                                    return (
                                        <div key={v} className="flex items-center justify-between p-2 bg-(--vct-bg-base) rounded-lg border border-(--vct-border-subtle) text-xs">
                                            <code className="font-mono text-(--vct-accent-cyan)">{`{{${v}}}`}</code>
                                            <span className="text-(--vct-text-secondary)">{sampleValues[v] || '—'}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                        {(() => {
                            const stat = stats.find(s => s.category === drawerTpl.category)
                            return stat ? (
                                <div>
                                    <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Thống kê delivery</div>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                            <div className="text-xl font-bold text-(--vct-text-primary)">{stat.total.toLocaleString()}</div>
                                            <div className="text-[9px] text-(--vct-text-tertiary) uppercase">Tổng gửi</div>
                                        </div>
                                        <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                            <div className="text-xl font-bold text-[#10b981]">{stat.rate}%</div>
                                            <div className="text-[9px] text-(--vct-text-tertiary) uppercase">Tỷ lệ giao</div>
                                        </div>
                                        <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                            <div className={`text-xl font-bold ${stat.failed > 0 ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>{stat.failed}</div>
                                            <div className="text-[9px] text-(--vct-text-tertiary) uppercase">Thất bại</div>
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        })()}
                        <div className="flex gap-3 pt-4 border-t border-(--vct-border-subtle)">
                            <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Edit size={14} />} onClick={() => { setDrawerTpl(null); showToast('Mở chỉnh sửa template (mock)') }}>Chỉnh sửa</VCT_Button>
                            <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Mail size={14} />} onClick={() => {
                                showToast(`Đã gửi thử "${drawerTpl.title}" đến admin@vct.vn qua ${drawerTpl.channel}`)
                            }}>Gửi thử</VCT_Button>
                            <VCT_Button variant={drawerTpl.is_active ? 'secondary' : 'primary'} size="sm" onClick={() => { setDrawerTpl(null); setConfirmToggle(drawerTpl) }}>
                                {drawerTpl.is_active ? 'Tắt' : 'Bật'}
                            </VCT_Button>
                        </div>
                    </div>
                )}
            </VCT_Drawer>

            {/* ── CONFIRM TOGGLE ── */}
            <VCT_ConfirmDialog
                isOpen={!!confirmToggle}
                onClose={() => setConfirmToggle(null)}
                onConfirm={() => {
                    if (confirmToggle) {
                        setTemplates(prev => prev.map(t => t.id === confirmToggle.id ? { ...t, is_active: !t.is_active } : t))
                        showToast(`Đã ${confirmToggle.is_active ? 'tắt' : 'bật'} mẫu "${confirmToggle.title}"`)
                    }
                    setConfirmToggle(null)
                }}
                title={confirmToggle?.is_active ? 'Tắt mẫu thông báo' : 'Bật mẫu thông báo'}
                message={`${confirmToggle?.is_active ? 'Tắt' : 'Bật'} mẫu "${confirmToggle?.title}"? Thay đổi sẽ ảnh hưởng ngay đến việc gửi thông báo.`}
                confirmLabel={confirmToggle?.is_active ? 'Tắt' : 'Bật'}
            />

            {/* ── ADD NOTIFICATION TEMPLATE MODAL ── */}
            <VCT_Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm mẫu thông báo mới">
                <VCT_Stack gap={16}>
                    <VCT_Field label="Category" required>
                        <VCT_Select value={form.category} onChange={(v: string) => setForm(f => ({ ...f, category: v }))} options={CATEGORY_OPTIONS} />
                    </VCT_Field>
                    <VCT_Field label="Kênh gửi" required>
                        <VCT_Select value={form.channel} onChange={(v: string) => setForm(f => ({ ...f, channel: v }))} options={CHANNEL_OPTIONS} />
                    </VCT_Field>
                    <VCT_Field label="Ngôn ngữ">
                        <VCT_Select value={form.locale} onChange={(v: string) => setForm(f => ({ ...f, locale: v }))} options={[
                            { value: 'vi-VN', label: '🇻🇳 Tiếng Việt' },
                            { value: 'en-US', label: '🇺🇸 English' },
                        ]} />
                    </VCT_Field>
                    <VCT_Field label="Tiêu đề mẫu" required hint="Sử dụng {{variable}} cho phần động, VD: {{athlete_name}} lên thảm {{tatami_number}}">
                        <VCT_Input placeholder="{{athlete_name}} lên thảm {{tatami_number}}" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
                    </VCT_Field>
                    <VCT_Field label="Variables" hint="Phân cách bằng dấu phẩy, VD: athlete_name, tatami_number">
                        <VCT_Input placeholder="athlete_name, tatami_number, match_time" value={form.variablesText} onChange={(e) => setForm(f => ({ ...f, variablesText: e.target.value }))} />
                    </VCT_Field>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox" id="notif-active" checked={form.is_active}
                            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                            className="w-4 h-4 accent-(--vct-accent-blue,#3b82f6)"
                        />
                        <label htmlFor="notif-active" className="text-sm text-(--vct-text-secondary)">Kích hoạt ngay</label>
                    </div>
                </VCT_Stack>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-(--vct-border-subtle)">
                    <VCT_Button variant="ghost" onClick={() => setShowAddModal(false)}>Hủy</VCT_Button>
                    <VCT_Button variant="primary" onClick={handleSubmitTemplate} disabled={!form.title.trim()}>Tạo mẫu</VCT_Button>
                </div>
            </VCT_Modal>
        </VCT_PageContainer>
    )
}
