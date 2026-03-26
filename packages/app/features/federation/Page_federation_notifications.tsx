'use client'

import React, { useState, useMemo } from 'react'
import { VCT_PageContainer, VCT_PageHero } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Badge, VCT_Button, VCT_EmptyState } from '@vct/ui'

// ════════════════════════════════════════
// FEDERATION — CÀI ĐẶT THÔNG BÁO
// ════════════════════════════════════════

interface NotifChannel {
    id: string; name: string; type: 'email' | 'sms' | 'push' | 'in_app'
    enabled: boolean; description: string
}

interface NotifRule {
    id: string; event: string; description: string
    channels: string[]; recipients: string; is_active: boolean
}

const CHANNELS: NotifChannel[] = [
    { id: 'email', name: 'Email', type: 'email', enabled: true, description: 'Thông báo qua email chính thức' },
    { id: 'sms', name: 'SMS', type: 'sms', enabled: true, description: 'Tin nhắn SMS qua đầu số brandname' },
    { id: 'push', name: 'Push Notification', type: 'push', enabled: true, description: 'Thông báo đẩy trên app mobile' },
    { id: 'in_app', name: 'Trong ứng dụng', type: 'in_app', enabled: true, description: 'Thông báo trên giao diện web/app' },
]

const RULES: NotifRule[] = [
    { id: '1', event: 'approval_submitted', description: 'Khi có hồ sơ mới gửi lên phê duyệt', channels: ['email', 'in_app', 'push'], recipients: 'Người phê duyệt cấp 1', is_active: true },
    { id: '2', event: 'approval_decided', description: 'Khi hồ sơ được duyệt hoặc từ chối', channels: ['email', 'in_app'], recipients: 'Người nộp hồ sơ', is_active: true },
    { id: '3', event: 'cert_expiring', description: 'Chứng chỉ sắp hết hạn (30 ngày)', channels: ['email', 'sms'], recipients: 'Người giữ chứng chỉ', is_active: true },
    { id: '4', event: 'tournament_announced', description: 'Giải đấu mới được công bố', channels: ['email', 'in_app', 'push'], recipients: 'Tất cả CLB thành viên', is_active: true },
    { id: '5', event: 'discipline_case', description: 'Vụ kỷ luật mới được tạo', channels: ['email', 'in_app'], recipients: 'Ban Kỷ luật', is_active: true },
    { id: '6', event: 'finance_overdue', description: 'Hóa đơn quá hạn thanh toán', channels: ['email', 'sms'], recipients: 'Đơn vị liên quan + Kế toán', is_active: false },
    { id: '7', event: 'personnel_change', description: 'Thay đổi nhân sự BCH', channels: ['email', 'in_app'], recipients: 'Toàn bộ BCH', is_active: true },
    { id: '8', event: 'document_published', description: 'Văn bản pháp quy mới ban hành', channels: ['email', 'push', 'in_app'], recipients: 'Tất cả đơn vị thành viên', is_active: true },
]

const CHANNEL_ICONS: Record<string, string> = {
    email: '📧', sms: '💬', push: '🔔', in_app: '💻',
}

export function Page_federation_notifications() {
    const [rules, setRules] = useState(RULES)
    const [channels, setChannels] = useState(CHANNELS)

    const activeRules = rules.filter(r => r.is_active).length
    const activeChannels = channels.filter(c => c.enabled).length

    const toggleRule = (id: string) => {
        setRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r))
    }

    const toggleChannel = (id: string) => {
        setChannels(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c))
    }

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero title="Cài đặt Thông báo" subtitle="Cấu hình kênh thông báo và quy tắc gửi thông báo tự động"
                icon={<VCT_Icons.Bell size={24} />} gradientFrom="rgba(99, 102, 241, 0.1)" gradientTo="rgba(236, 72, 153, 0.06)" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {[
                    { label: 'Kênh thông báo', value: channels.length, color: 'var(--vct-info)' },
                    { label: 'Kênh hoạt động', value: activeChannels, color: 'var(--vct-success)' },
                    { label: 'Quy tắc', value: rules.length, color: 'var(--vct-info)' },
                    { label: 'Quy tắc bật', value: activeRules, color: 'var(--vct-warning)' },
                ].map(kpi => (
                    <div key={kpi.label} className="rounded-2xl border border-vct-border bg-vct-elevated px-4 py-4">
                        <div className="text-xs text-vct-text-muted mb-1">{kpi.label}</div>
                        <div className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Channels */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-5 mb-6">
                <h3 className="text-sm font-bold text-vct-text mb-4 uppercase tracking-wide">📡 Kênh Thông báo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {channels.map(ch => (
                        <div key={ch.id} className={`rounded-xl border p-4 cursor-pointer transition-all ${ch.enabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-vct-border bg-vct-bg opacity-60'}`}
                            onClick={() => toggleChannel(ch.id)}>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xl">{CHANNEL_ICONS[ch.type]}</span>
                                <span className="text-sm font-bold text-vct-text">{ch.name}</span>
                            </div>
                            <div className="text-xs text-vct-text-muted mb-2">{ch.description}</div>
                            <VCT_Badge text={ch.enabled ? 'Bật' : 'Tắt'} type={ch.enabled ? 'success' : 'neutral'} />
                        </div>
                    ))}
                </div>
            </div>

            {/* Notification Rules */}
            <div className="rounded-2xl border border-vct-border bg-vct-elevated p-5">
                <h3 className="text-sm font-bold text-vct-text mb-4 uppercase tracking-wide">⚙️ Quy tắc Thông báo</h3>
                <div className="space-y-3">
                    {rules.map(rule => (
                        <div key={rule.id} className={`rounded-xl border p-4 transition-all ${rule.is_active ? 'border-vct-border' : 'border-vct-border/50 opacity-50'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex-1">
                                    <div className="text-sm font-bold text-vct-text">{rule.description}</div>
                                    <div className="text-xs text-vct-text-muted mt-0.5">
                                        Sự kiện: <code className="px-1 py-0.5 rounded bg-vct-bg text-[11px]">{rule.event}</code> • 👥 {rule.recipients}
                                    </div>
                                </div>
                                <button onClick={() => toggleRule(rule.id)}
                                    className={`w-12 h-7 rounded-full transition-colors relative ${rule.is_active ? 'bg-emerald-500' : 'bg-vct-bg'}`}>
                                    <div className={`w-5 h-5 rounded-full bg-white shadow-md absolute top-1 transition-all ${rule.is_active ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            <div className="flex gap-2 mt-2">
                                {rule.channels.map(ch => (
                                    <span key={ch} className="text-xs px-2 py-0.5 rounded-lg bg-vct-bg text-vct-text-muted">
                                        {CHANNEL_ICONS[ch]} {ch}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </VCT_PageContainer>
    )
}

export default Page_federation_notifications
