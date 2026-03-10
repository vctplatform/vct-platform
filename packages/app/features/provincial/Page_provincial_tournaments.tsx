'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

interface Tournament {
    id: string; name: string; year: number; type: string; start_date: string; end_date: string
    venue: string; status: string; max_teams: number; registered_teams: number; total_athletes: number
    categories: string[]
}

const STATUS_MAP: Record<string, { label: string; type: any; color: string }> = {
    draft: { label: 'Bản nháp', type: 'neutral', color: '#94a3b8' },
    open: { label: 'Mở đăng ký', type: 'info', color: '#3b82f6' },
    in_progress: { label: 'Đang diễn ra', type: 'success', color: '#10b981' },
    completed: { label: 'Đã kết thúc', type: 'warning', color: '#f59e0b' },
    cancelled: { label: 'Đã hủy', type: 'error', color: '#ef4444' },
}

export const Page_provincial_tournaments = () => {
    const [tournaments, setTournaments] = useState<Tournament[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    useEffect(() => {
        (async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {}
                const res = await fetch(`${API}/tournaments?province_id=PROV-HCM`, { headers })
                if (res.ok) { const d = await res.json(); setTournaments((d.data?.tournaments || d.tournaments) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [])

    const filtered = useMemo(() => {
        if (!search) return tournaments
        const q = search.toLowerCase()
        return tournaments.filter(t => t.name.toLowerCase().includes(q) || t.venue?.toLowerCase().includes(q))
    }, [tournaments, search])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">🏆 Giải Đấu Cấp Tỉnh</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý giải đấu, đăng ký đội, kết quả thi đấu</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng giải đấu', value: tournaments.length, icon: <VCT_Icons.Award size={18} />, color: '#0ea5e9' },
                { label: 'Đang diễn ra', value: tournaments.filter(t => t.status === 'in_progress').length, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Mở đăng ký', value: tournaments.filter(t => t.status === 'open').length, icon: <VCT_Icons.FileText size={18} />, color: '#3b82f6' },
                { label: 'Tổng VĐV', value: tournaments.reduce((s, t) => s + (t.total_athletes || 0), 0), icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                <div className="w-full max-w-[340px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm giải đấu..." /></div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng tạo giải đấu đang phát triển', 'info')}>Tạo Giải Đấu</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Chưa có giải đấu" description={loading ? 'Đang tải...' : 'Không tìm thấy giải đấu.'} icon="🏆" />
            ) : (
                <div className="grid gap-5 grid-cols-1 lg:grid-cols-2">
                    {filtered.map(t => {
                        const st = STATUS_MAP[t.status] || { label: t.status, type: 'neutral', color: '#94a3b8' }
                        return (
                            <div key={t.id} className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5 hover:border-[var(--vct-accent-cyan)] transition-all" style={{ borderLeftWidth: 4, borderLeftColor: st.color }}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <div className="font-bold text-base text-[var(--vct-text-primary)]">{t.name}</div>
                                        <div className="text-xs text-[var(--vct-text-secondary)] mt-1">
                                            📍 {t.venue} • 📅 {t.start_date} → {t.end_date}
                                        </div>
                                    </div>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </div>
                                <div className="flex gap-6 mt-4 text-xs">
                                    <div><span className="font-bold text-lg" style={{ color: '#22d3ee' }}>{t.registered_teams}</span><span className="opacity-60">/{t.max_teams} đội</span></div>
                                    <div><span className="font-bold text-lg" style={{ color: '#8b5cf6' }}>{t.total_athletes}</span><span className="opacity-60"> VĐV</span></div>
                                </div>
                                {t.categories && t.categories.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {t.categories.map(c => <span key={c} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] border border-[var(--vct-border-subtle)]">{c}</span>)}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
