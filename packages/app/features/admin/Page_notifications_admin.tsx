'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA — Notification Management
// ════════════════════════════════════════
const MOCK_TEMPLATES = [
    { id: 'TPL-001', category: 'MATCH_CALL', channel: 'push', locale: 'vi-VN', title: '{{athlete_name}} lên thảm {{tatami_number}}', variables: ['athlete_name', 'tatami_number', 'match_time'], version: 1, is_active: true },
    { id: 'TPL-002', category: 'RESULT_ANNOUNCEMENT', channel: 'push', locale: 'vi-VN', title: 'Kết quả: {{category_name}}', variables: ['category_name', 'gold_name', 'silver_name'], version: 1, is_active: true },
    { id: 'TPL-003', category: 'SCHEDULE_CHANGE', channel: 'sms', locale: 'vi-VN', title: 'Thay đổi lịch thi đấu', variables: ['tournament_name', 'old_time', 'new_time'], version: 2, is_active: true },
    { id: 'TPL-004', category: 'REGISTRATION_UPDATE', channel: 'email', locale: 'vi-VN', title: 'Cập nhật đăng ký: {{tournament_name}}', variables: ['tournament_name', 'status', 'note'], version: 1, is_active: true },
    { id: 'TPL-005', category: 'MATCH_CALL', channel: 'sms', locale: 'vi-VN', title: 'VDV {{athlete_name}} chuẩn bị thi đấu', variables: ['athlete_name', 'tatami_number'], version: 1, is_active: false },
    { id: 'TPL-006', category: 'SYSTEM_ALERT', channel: 'push', locale: 'vi-VN', title: 'Cảnh báo hệ thống: {{alert_type}}', variables: ['alert_type', 'details'], version: 1, is_active: true },
]

const MOCK_STATS = [
    { category: 'MATCH_CALL', total: 1250, delivered: 1230, failed: 20, read: 980, rate: 98.4 },
    { category: 'RESULT_ANNOUNCEMENT', total: 340, delivered: 335, failed: 5, read: 280, rate: 98.5 },
    { category: 'SCHEDULE_CHANGE', total: 45, delivered: 44, failed: 1, read: 38, rate: 97.8 },
    { category: 'REGISTRATION_UPDATE', total: 890, delivered: 870, failed: 20, read: 650, rate: 97.8 },
    { category: 'SYSTEM_ALERT', total: 15, delivered: 15, failed: 0, read: 12, rate: 100 },
]

const CATEGORY_LABELS: Record<string, string> = {
    MATCH_CALL: 'Gọi thi đấu',
    RESULT_ANNOUNCEMENT: 'Thông báo kết quả',
    SCHEDULE_CHANGE: 'Thay đổi lịch',
    REGISTRATION_UPDATE: 'Cập nhật đăng ký',
    SYSTEM_ALERT: 'Cảnh báo hệ thống',
    MARKETING: 'Marketing',
}

const CHANNEL_LABELS: Record<string, string> = {
    push: '📱 Push',
    sms: '💬 SMS',
    email: '📧 Email',
    zalo: '💙 Zalo',
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_notifications_admin = () => {
    const [search, setSearch] = useState('')
    const [channelFilter, setChannelFilter] = useState('all')
    const [tab, setTab] = useState<'templates' | 'stats'>('templates')

    const filteredTemplates = useMemo(() => {
        let v = MOCK_TEMPLATES
        if (channelFilter !== 'all') v = v.filter(t => t.channel === channelFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q))
        }
        return v
    }, [search, channelFilter])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản Lý Thông Báo</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý mẫu thông báo, theo dõi delivery, cấu hình multi-channel.</p>
                </div>
                <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />}>Thêm mẫu</VCT_Button>
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('templates')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'templates' ? 'bg-[var(--vct-accent-blue,#3b82f6)] text-white' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] hover:text-[var(--vct-text-primary)]'}`}
                >Mẫu thông báo</button>
                <button
                    onClick={() => setTab('stats')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'stats' ? 'bg-[var(--vct-accent-blue,#3b82f6)] text-white' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] hover:text-[var(--vct-text-primary)]'}`}
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
                                { value: 'push', label: '📱 Push' },
                                { value: 'sms', label: '💬 SMS' },
                                { value: 'email', label: '📧 Email' },
                                { value: 'zalo', label: '💙 Zalo' },
                            ]}
                        />
                    </div>

                    {/* ── TEMPLATES TABLE ── */}
                    <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                                    <th className="p-4 w-20">Trạng thái</th>
                                    <th className="p-4 w-36">Category</th>
                                    <th className="p-4 w-24">Kênh</th>
                                    <th className="p-4">Tiêu đề mẫu</th>
                                    <th className="p-4 w-20 text-center">Version</th>
                                    <th className="p-4 w-40">Variables</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                                {filteredTemplates.map(tpl => (
                                    <tr key={tpl.id} className="hover:bg-white/5 transition-colors text-sm">
                                        <td className="p-4"><VCT_Badge type={tpl.is_active ? 'success' : 'neutral'} text={tpl.is_active ? 'Active' : 'Inactive'} /></td>
                                        <td className="p-4 text-[var(--vct-text-primary)]">{CATEGORY_LABELS[tpl.category] || tpl.category}</td>
                                        <td className="p-4">{CHANNEL_LABELS[tpl.channel] || tpl.channel}</td>
                                        <td className="p-4 font-mono text-[12px] text-[var(--vct-accent-cyan)]">{tpl.title}</td>
                                        <td className="p-4 text-center text-[var(--vct-text-tertiary)]">v{tpl.version}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {tpl.variables.map(v => (
                                                    <span key={v} className="bg-[var(--vct-bg-base)] border border-[var(--vct-border-subtle)] px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--vct-text-tertiary)]">{v}</span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : (
                /* ── STATS TABLE ── */
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                                <th className="p-4">Category</th>
                                <th className="p-4 text-right w-28">Tổng gửi</th>
                                <th className="p-4 text-right w-28">Đã giao</th>
                                <th className="p-4 text-right w-28">Thất bại</th>
                                <th className="p-4 text-right w-28">Đã đọc</th>
                                <th className="p-4 text-right w-28">Tỷ lệ giao</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                            {MOCK_STATS.map(stat => (
                                <tr key={stat.category} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4 font-semibold text-[var(--vct-text-primary)]">{CATEGORY_LABELS[stat.category] || stat.category}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-[var(--vct-text-secondary)]">{stat.total.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px]" style={{ color: 'var(--vct-accent-green,#22c55e)' }}>{stat.delivered.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px]" style={{ color: stat.failed > 0 ? 'var(--vct-accent-red,#ef4444)' : 'var(--vct-accent-green,#22c55e)' }}>{stat.failed}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-[var(--vct-text-secondary)]">{stat.read.toLocaleString()}</td>
                                    <td className="p-4 text-right font-mono text-[12px] font-bold" style={{ color: stat.rate >= 98 ? 'var(--vct-accent-green,#22c55e)' : 'var(--vct-accent-yellow,#eab308)' }}>{stat.rate}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
