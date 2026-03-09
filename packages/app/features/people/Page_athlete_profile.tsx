'use client'

import React, { useState, useMemo } from 'react'
import { Search, Plus, User, Award, Activity, Heart, Clock, ChevronRight, Edit, MoreHorizontal, TrendingUp, Calendar, Scale, Ruler } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────

interface AthleteProfile {
    id: string
    ho_ten: string
    gioi_tinh: 'nam' | 'nu'
    ngay_sinh: string
    can_nang: number
    chieu_cao: number
    doan_ten: string
    tinh: string
    dai: string
    dai_color: string
    so_nam_tap: number
    trang_thai: string
    avatar_url?: string
    // Stats
    total_matches: number
    wins: number
    losses: number
    medals: { gold: number; silver: number; bronze: number }
    elo_rating: number
    // Timeline
    achievements: { year: number; event: string; result: string }[]
    belt_history: { date: string; belt: string; color: string }[]
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_ATHLETE: AthleteProfile = {
    id: 'vdv-001',
    ho_ten: 'Nguyễn Thành Long',
    gioi_tinh: 'nam',
    ngay_sinh: '2000-05-15',
    can_nang: 68.5,
    chieu_cao: 175,
    doan_ten: 'Bình Định',
    tinh: 'Bình Định',
    dai: 'Đai đen',
    dai_color: '#000000',
    so_nam_tap: 12,
    trang_thai: 'du_dieu_kien',
    total_matches: 45,
    wins: 32,
    losses: 13,
    medals: { gold: 8, silver: 5, bronze: 3 },
    elo_rating: 1823,
    achievements: [
        { year: 2025, event: 'Giải Vô địch Quốc gia', result: 'HCV Đối kháng 68kg' },
        { year: 2024, event: 'Giải Các CLB Mạnh', result: 'HCB Quyền thuật' },
        { year: 2024, event: 'Đại hội TDTT Quốc gia', result: 'HCV Đối kháng 65kg' },
        { year: 2023, event: 'Giải Vô địch Quốc gia', result: 'HCĐ Đối kháng 65kg' },
        { year: 2022, event: 'Giải Trẻ Quốc gia', result: 'HCV Đối kháng 60kg' },
    ],
    belt_history: [
        { date: '2025-01', belt: 'Đai đen', color: '#000000' },
        { date: '2023-06', belt: 'Đai đỏ', color: '#dc2626' },
        { date: '2021-03', belt: 'Đai xanh dương', color: '#2563eb' },
        { date: '2019-09', belt: 'Đai xanh lá', color: '#16a34a' },
        { date: '2017-01', belt: 'Đai vàng', color: '#eab308' },
        { date: '2014-06', belt: 'Đai trắng', color: '#d1d5db' },
    ]
}

// ── Tab Component ────────────────────────────────────────────

const TABS = [
    { id: 'info', label: 'Thông tin', icon: User },
    { id: 'stats', label: 'Thành tích', icon: TrendingUp },
    { id: 'timeline', label: 'Lịch sử', icon: Clock },
    { id: 'medical', label: 'Y tế', icon: Heart },
    { id: 'belt', label: 'Đai', icon: Award },
] as const

type TabId = typeof TABS[number]['id']

// ── Main Component ───────────────────────────────────────────

export default function Page_athlete_profile() {
    const [activeTab, setActiveTab] = useState<TabId>('info')
    const athlete = MOCK_ATHLETE

    const winRate = athlete.total_matches > 0 ? Math.round((athlete.wins / athlete.total_matches) * 100) : 0

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            {/* Profile Header */}
            <div style={{ background: 'linear-gradient(135deg, #991b1b 0%, #dc2626 100%)', borderRadius: 16, padding: 32, color: '#fff', marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                    {/* Avatar */}
                    <div style={{ width: 100, height: 100, borderRadius: 20, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 700, flexShrink: 0 }}>
                        {athlete.ho_ten.split(' ').pop()?.[0]}
                    </div>
                    {/* Info */}
                    <div style={{ flex: 1 }}>
                        <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, lineHeight: 1.2 }}>{athlete.ho_ten}</h1>
                        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, opacity: 0.9 }}>
                                <Award size={16} /> {athlete.dai}
                            </span>
                            <span style={{ fontSize: 14, opacity: 0.9 }}>
                                📍 {athlete.doan_ten}
                            </span>
                            <span style={{ fontSize: 14, opacity: 0.9 }}>
                                {athlete.gioi_tinh === 'nam' ? '♂' : '♀'} {new Date().getFullYear() - new Date(athlete.ngay_sinh).getFullYear()} tuổi
                            </span>
                        </div>
                    </div>
                    {/* Quick Stats */}
                    <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{athlete.elo_rating}</div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>ELO</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>{winRate}%</div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>Tỉ lệ thắng</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '12px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: 12 }}>
                            <div style={{ fontSize: 24, fontWeight: 700 }}>🥇{athlete.medals.gold} 🥈{athlete.medals.silver} 🥉{athlete.medals.bronze}</div>
                            <div style={{ fontSize: 11, opacity: 0.8 }}>Huy chương</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #f3f4f6', paddingBottom: 0 }}>
                {TABS.map(tab => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '12px 20px',
                                fontSize: 14, fontWeight: activeTab === tab.id ? 600 : 400,
                                color: activeTab === tab.id ? '#dc2626' : '#6b7280',
                                background: 'none', border: 'none', cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid #dc2626' : '2px solid transparent',
                                marginBottom: -2,
                                transition: 'all 0.15s',
                            }}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    )
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'info' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' }}>Thông tin cá nhân</h3>
                        <div style={{ display: 'grid', gap: 16 }}>
                            {[
                                { icon: Calendar, label: 'Ngày sinh', value: new Date(athlete.ngay_sinh).toLocaleDateString('vi-VN') },
                                { icon: User, label: 'Giới tính', value: athlete.gioi_tinh === 'nam' ? 'Nam' : 'Nữ' },
                                { icon: Scale, label: 'Cân nặng', value: `${athlete.can_nang} kg` },
                                { icon: Ruler, label: 'Chiều cao', value: `${athlete.chieu_cao} cm` },
                                { icon: Clock, label: 'Số năm tập', value: `${athlete.so_nam_tap} năm` },
                            ].map(item => (
                                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <item.icon size={16} style={{ color: '#6b7280' }} />
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 12, color: '#9ca3af' }}>{item.label}</div>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{item.value}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' }}>Thống kê thi đấu</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#f9fafb' }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#111827' }}>{athlete.total_matches}</div>
                                <div style={{ fontSize: 13, color: '#6b7280' }}>Tổng trận</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#f0fdf4' }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#16a34a' }}>{athlete.wins}</div>
                                <div style={{ fontSize: 13, color: '#6b7280' }}>Thắng</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#fef2f2' }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#dc2626' }}>{athlete.losses}</div>
                                <div style={{ fontSize: 13, color: '#6b7280' }}>Thua</div>
                            </div>
                            <div style={{ textAlign: 'center', padding: 16, borderRadius: 12, background: '#fffbeb' }}>
                                <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>{winRate}%</div>
                                <div style={{ fontSize: 13, color: '#6b7280' }}>Tỉ lệ thắng</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'stats' && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' }}>Thành tích thi đấu</h3>
                    <div style={{ display: 'grid', gap: 8 }}>
                        {athlete.achievements.map((a, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 16px', borderRadius: 10, background: i % 2 === 0 ? '#fafafa' : '#fff', border: '1px solid #f3f4f6' }}>
                                <div style={{ width: 48, height: 48, borderRadius: 12, background: a.result.includes('HCV') ? '#fef3c7' : a.result.includes('HCB') ? '#e5e7eb' : '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                                    {a.result.includes('HCV') ? '🥇' : a.result.includes('HCB') ? '🥈' : '🥉'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{a.event}</div>
                                    <div style={{ fontSize: 13, color: '#6b7280' }}>{a.result}</div>
                                </div>
                                <span style={{ fontSize: 14, fontWeight: 500, color: '#9ca3af' }}>{a.year}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'belt' && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' }}>Lịch sử Đai</h3>
                    <div style={{ position: 'relative', paddingLeft: 32 }}>
                        {/* Timeline line */}
                        <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: '#e5e7eb' }} />
                        {athlete.belt_history.map((b, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -24, width: 24, height: 24, borderRadius: '50%', background: b.color, border: '3px solid #fff', boxShadow: '0 0 0 2px ' + b.color + '40', zIndex: 1 }} />
                                <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#fafafa', border: '1px solid #f3f4f6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{b.belt}</span>
                                        <span style={{ fontSize: 13, color: '#9ca3af' }}>{b.date}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'medical' && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24, textAlign: 'center' }}>
                    <Heart size={48} style={{ color: '#d1d5db', margin: '32px 0 16px' }} />
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151' }}>Hồ sơ Y tế</h3>
                    <p style={{ fontSize: 14, color: '#9ca3af' }}>Chưa có hồ sơ y tế nào được ghi nhận</p>
                </div>
            )}

            {activeTab === 'timeline' && (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: '0 0 16px' }}>Dòng thời gian</h3>
                    <div style={{ position: 'relative', paddingLeft: 32 }}>
                        <div style={{ position: 'absolute', left: 11, top: 8, bottom: 8, width: 2, background: '#e5e7eb' }} />
                        {[...athlete.achievements, ...athlete.belt_history.map(b => ({ year: parseInt(b.date.split('-')[0] || ''), event: 'Thăng đai', result: b.belt }))].sort((a, b) => b.year - a.year).map((item, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -24, width: 20, height: 20, borderRadius: '50%', background: item.event === 'Thăng đai' ? '#f59e0b' : '#dc2626', border: '3px solid #fff', zIndex: 1 }} />
                                <div style={{ flex: 1, padding: '12px 16px', borderRadius: 10, background: '#fafafa', border: '1px solid #f3f4f6' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{item.event}</div>
                                            <div style={{ fontSize: 13, color: '#6b7280' }}>{item.result}</div>
                                        </div>
                                        <span style={{ fontSize: 13, color: '#9ca3af' }}>{item.year}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
