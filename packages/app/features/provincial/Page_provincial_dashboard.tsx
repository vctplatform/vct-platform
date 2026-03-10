'use client'

import * as React from 'react'
import { useState, useEffect, useMemo } from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_EmptyState, VCT_FilterChips,
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// PROVINCIAL DASHBOARD — Tổng quan LĐ Tỉnh
// ════════════════════════════════════════

const API = '/api/v1/provincial'

interface DashboardStats {
    province_id: string
    province_name: string
    total_associations: number
    active_associations: number
    total_sub_associations: number
    total_clubs: number
    active_clubs: number
    total_athletes: number
    total_coaches: number
    total_referees: number
    total_committee: number
    pending_clubs: number
    pending_associations: number
    pending_transfers: number
}

interface Club {
    id: string
    name: string
    short_name: string
    district: string
    leader_name: string
    status: string
    athlete_count: number
    coach_count: number
}

const STATUS_MAP: Record<string, { label: string; type: any }> = {
    active: { label: 'Hoạt động', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    suspended: { label: 'Đình chỉ', type: 'error' },
    inactive: { label: 'Ngưng HĐ', type: 'neutral' },
}

export const Page_provincial_dashboard = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [clubs, setClubs] = useState<Club[]>([])
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    const showToast = (msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}

                const [statsRes, clubsRes] = await Promise.all([
                    fetch(`${API}/dashboard?province_id=PROV-HCM`, { headers }),
                    fetch(`${API}/clubs?province_id=PROV-HCM`, { headers }),
                ])

                if (statsRes.ok) {
                    const d = await statsRes.json()
                    setStats(d.data || d)
                }
                if (clubsRes.ok) {
                    const d = await clubsRes.json()
                    setClubs((d.data?.clubs || d.clubs) || [])
                }
            } catch (err) {
                console.error('Provincial dashboard fetch error:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const kpiItems: StatItem[] = stats ? [
        { label: 'Hội Q/H', value: stats.total_associations || 0, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
        { label: 'Chi hội P/X', value: stats.total_sub_associations || 0, icon: <VCT_Icons.MapPin size={18} />, color: '#06b6d4' },
        { label: 'Tổng CLB', value: stats.total_clubs, icon: <VCT_Icons.Home size={18} />, color: '#10b981' },
        { label: 'CLB hoạt động', value: stats.active_clubs, icon: <VCT_Icons.Activity size={18} />, color: '#22c55e' },
        { label: 'Vận động viên', value: stats.total_athletes, icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
        { label: 'HLV', value: stats.total_coaches, icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6' },
        { label: 'Trọng tài', value: stats.total_referees, icon: <VCT_Icons.Shield size={18} />, color: '#ef4444' },
        { label: 'BCH', value: stats.total_committee, icon: <VCT_Icons.Star size={18} />, color: '#ec4899' },
    ] : [
        { label: 'Hội Q/H', value: '—', icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
        { label: 'Chi hội P/X', value: '—', icon: <VCT_Icons.MapPin size={18} />, color: '#06b6d4' },
        { label: 'Tổng CLB', value: '—', icon: <VCT_Icons.Home size={18} />, color: '#10b981' },
        { label: 'Vận động viên', value: '—', icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">
                    🏛️ Liên đoàn VCT TP. Hồ Chí Minh
                </h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">
                    Tổng quan hoạt động liên đoàn cấp tỉnh/thành phố
                </p>
            </div>

            {/* ── KPI ROW ── */}
            <VCT_StatRow items={kpiItems} className="mb-6" />

            {/* ── Pending Alerts ── */}
            {stats && (stats.pending_clubs > 0 || stats.pending_transfers > 0) && (
                <div className="mb-6 p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                    <VCT_Stack direction="row" gap={24} align="center">
                        <VCT_Icons.AlertTriangle size={20} color="#f59e0b" />
                        <VCT_Stack gap={4}>
                            <span className="text-sm font-semibold text-[var(--vct-text-primary)]">
                                Cần xử lý
                            </span>
                            <span className="text-xs text-[var(--vct-text-secondary)]">
                                {stats.pending_clubs > 0 && `${stats.pending_clubs} CLB chờ duyệt`}
                                {stats.pending_clubs > 0 && stats.pending_transfers > 0 && ' • '}
                                {stats.pending_transfers > 0 && `${stats.pending_transfers} yêu cầu chuyển CLB`}
                            </span>
                        </VCT_Stack>
                    </VCT_Stack>
                </div>
            )}

            {/* ── Club Summary Table ── */}
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--vct-text-primary)]">
                    Danh sách CLB
                </h2>
                <VCT_Badge text={`${clubs.length} CLB`} type="info" />
            </div>

            {clubs.length === 0 ? (
                <VCT_EmptyState
                    title="Chưa có dữ liệu CLB"
                    description={loading ? 'Đang tải dữ liệu...' : 'Liên đoàn chưa có CLB trực thuộc.'}
                    icon="🏠"
                />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                                {['CLB', 'Quận/Huyện', 'Trưởng CLB', 'VĐV', 'HLV', 'Trạng thái'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {clubs.map((c, i) => {
                                const st = STATUS_MAP[c.status] || { label: c.status, type: 'neutral' }
                                return (
                                    <tr key={c.id} className="border-b border-[var(--vct-border-subtle)] hover:bg-[var(--vct-bg-hover)] transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="font-semibold text-sm">{c.name}</div>
                                            <div className="text-xs opacity-50">{c.short_name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{c.district}</td>
                                        <td className="px-4 py-3 text-sm">{c.leader_name}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: '#22d3ee' }}>{c.athlete_count}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-center" style={{ color: '#8b5cf6' }}>{c.coach_count}</td>
                                        <td className="px-4 py-3 text-center">
                                            <VCT_Badge text={st.label} type={st.type} />
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    )
}
