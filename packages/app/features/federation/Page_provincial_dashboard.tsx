'use client'

import * as React from 'react'
import { VCT_Stack } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// PROVINCIAL ADMIN — DASHBOARD
// ════════════════════════════════════════

const QUICK_ACTIONS = [
    { label: 'Đăng ký CLB mới', icon: '🏢', color: '#10b981', path: '/province/clubs' },
    { label: 'Cập nhật VĐV', icon: '🥋', color: '#0ea5e9', path: '/province/athletes' },
    { label: 'Đề xuất giải đấu', icon: '🏆', color: '#f59e0b', path: '/province/tournaments' },
    { label: 'Gửi báo cáo', icon: '📊', color: '#8b5cf6', path: '/province/reports' },
]

const RECENT_ACTIVITIES = [
    { id: 1, text: 'CLB Tần Long cập nhật danh sách VĐV', time: '2 giờ trước', type: 'info' },
    { id: 2, text: 'Đăng ký CLB Phong Vũ chờ duyệt', time: '5 giờ trước', type: 'warning' },
    { id: 3, text: 'Giải cấp tỉnh 2026 đã được phê duyệt', time: '1 ngày trước', type: 'success' },
    { id: 4, text: 'HLV Nguyễn Văn A gia hạn chứng chỉ', time: '2 ngày trước', type: 'info' },
]

export const Page_provincial_dashboard = () => {
    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Bảng điều khiển — LĐ Tỉnh/TP</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Tổng quan hoạt động Liên đoàn Võ cổ truyền địa phương.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'CLB trực thuộc', value: 22, icon: <VCT_Icons.Home size={18} />, color: '#10b981' },
                { label: 'VĐV đăng ký', value: 650, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
                { label: 'HLV', value: 40, icon: <VCT_Icons.Award size={18} />, color: '#f59e0b' },
                { label: 'Giải trong năm', value: 3, icon: <VCT_Icons.Trophy size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {/* Quick Actions */}
                <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5">
                    <h2 className="font-bold text-sm text-(--vct-text-primary) mb-4">Thao tác nhanh</h2>
                    <div className="grid grid-cols-2 gap-3">
                        {QUICK_ACTIONS.map(a => (
                            <button key={a.label} className="flex items-center gap-3 p-3 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) hover:border-(--vct-accent-cyan) transition-colors cursor-pointer text-left">
                                <span className="text-2xl">{a.icon}</span>
                                <span className="text-sm font-bold text-(--vct-text-primary)">{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5">
                    <h2 className="font-bold text-sm text-(--vct-text-primary) mb-4">Hoạt động gần đây</h2>
                    <div className="space-y-3">
                        {RECENT_ACTIVITIES.map(a => (
                            <div key={a.id} className="flex items-start gap-3 p-3 rounded-xl bg-(--vct-bg-glass)">
                                <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: a.type === 'success' ? '#10b981' : a.type === 'warning' ? '#f59e0b' : '#0ea5e9' }} />
                                <div>
                                    <div className="text-sm text-(--vct-text-primary)">{a.text}</div>
                                    <div className="text-xs opacity-50 mt-0.5">{a.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
