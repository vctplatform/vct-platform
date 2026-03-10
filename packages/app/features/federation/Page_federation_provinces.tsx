'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_EmptyState
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — PROVINCES
// ════════════════════════════════════════

interface Province {
    id: string; code: string; name: string; region: string
    has_fed: boolean; club_count: number; vdv_count: number; coach_count: number
    status: 'active' | 'inactive' | 'pending'
}

const REGION_MAP: Record<string, string> = {
    north: 'Miền Bắc', central: 'Miền Trung', south: 'Miền Nam', highland: 'Tây Nguyên'
}

const MOCK_PROVINCES: Province[] = [
    { id: 'HCM', code: 'HCM', name: 'TP Hồ Chí Minh', region: 'south', has_fed: true, club_count: 45, vdv_count: 1200, coach_count: 85, status: 'active' },
    { id: 'HN', code: 'HN', name: 'Hà Nội', region: 'north', has_fed: true, club_count: 38, vdv_count: 980, coach_count: 72, status: 'active' },
    { id: 'BD', code: 'BD', name: 'Bình Dương', region: 'south', has_fed: true, club_count: 22, vdv_count: 650, coach_count: 40, status: 'active' },
    { id: 'DN', code: 'DN', name: 'Đà Nẵng', region: 'central', has_fed: true, club_count: 15, vdv_count: 420, coach_count: 28, status: 'active' },
    { id: 'BDI', code: 'BDI', name: 'Bình Định', region: 'central', has_fed: true, club_count: 35, vdv_count: 900, coach_count: 60, status: 'active' },
    { id: 'NA', code: 'NA', name: 'Nghệ An', region: 'north', has_fed: false, club_count: 8, vdv_count: 200, coach_count: 12, status: 'pending' },
    { id: 'GL', code: 'GL', name: 'Gia Lai', region: 'highland', has_fed: false, club_count: 5, vdv_count: 120, coach_count: 8, status: 'inactive' },
    { id: 'TH', code: 'TH', name: 'Thanh Hóa', region: 'north', has_fed: true, club_count: 18, vdv_count: 500, coach_count: 35, status: 'active' },
]

const STATUS_COLOR: Record<string, { label: string; type: any }> = {
    active: { label: 'Hoạt động', type: 'success' },
    inactive: { label: 'Chưa kích hoạt', type: 'neutral' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
}

export const Page_federation_provinces = () => {
    const [search, setSearch] = useState('')
    const [regionFilter, setRegionFilter] = useState<string>('')

    const filtered = useMemo(() => {
        let data = MOCK_PROVINCES
        if (regionFilter) data = data.filter(p => p.region === regionFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
        }
        return data
    }, [search, regionFilter])

    const totalClubs = MOCK_PROVINCES.reduce((s, p) => s + p.club_count, 0)
    const totalVDV = MOCK_PROVINCES.reduce((s, p) => s + p.vdv_count, 0)
    const activeProvinces = MOCK_PROVINCES.filter(p => p.has_fed).length

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản lý Tỉnh / Thành phố</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Tổng quan 63 tỉnh/thành — theo dõi tổ chức liên đoàn địa phương, CLB và VĐV.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tỉnh/TP', value: MOCK_PROVINCES.length, icon: <VCT_Icons.MapPin size={18} />, color: '#8b5cf6' },
                { label: 'Có Liên đoàn', value: activeProvinces, icon: <VCT_Icons.Building2 size={18} />, color: '#10b981' },
                { label: 'Tổng CLB', value: totalClubs, icon: <VCT_Icons.Home size={18} />, color: '#f59e0b' },
                { label: 'Tổng VĐV', value: totalVDV.toLocaleString('vi-VN'), icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm tỉnh/thành phố..." />
                    </div>
                    <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
                        className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] text-[var(--vct-text-primary)] text-sm rounded-lg px-3 py-2 outline-none focus:border-[var(--vct-accent-cyan)]">
                        <option value="">Tất cả vùng</option>
                        {Object.entries(REGION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary" onClick={() => { }}>Xuất file</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy tỉnh/thành" description="Thử thay đổi bộ lọc." icon="🗺️" />
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                    {filtered.map(p => (
                        <div key={p.id} className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-5 hover:border-[var(--vct-accent-cyan)] transition-colors cursor-pointer">
                            <VCT_Stack direction="row" justify="space-between" align="center" className="mb-3">
                                <VCT_Stack direction="row" gap={10} align="center">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-white font-bold text-sm">{p.code}</div>
                                    <div>
                                        <div className="font-bold text-sm text-[var(--vct-text-primary)]">{p.name}</div>
                                        <div className="text-xs opacity-60">{REGION_MAP[p.region]}</div>
                                    </div>
                                </VCT_Stack>
                                <VCT_Badge text={STATUS_COLOR[p.status]?.label || p.status} type={STATUS_COLOR[p.status]?.type || 'neutral'} />
                            </VCT_Stack>
                            <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-[var(--vct-border-subtle)]">
                                <div className="text-center">
                                    <div className="text-lg font-bold text-[var(--vct-accent-cyan)]">{p.club_count}</div>
                                    <div className="text-[10px] opacity-50 uppercase font-bold">CLB</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-[#f59e0b]">{p.vdv_count}</div>
                                    <div className="text-[10px] opacity-50 uppercase font-bold">VĐV</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-lg font-bold text-[#10b981]">{p.coach_count}</div>
                                    <div className="text-[10px] opacity-50 uppercase font-bold">HLV</div>
                                </div>
                            </div>
                            {p.has_fed && (
                                <div className="mt-3 flex items-center gap-2 text-xs text-[#10b981]">
                                    <VCT_Icons.Check size={14} /> Có Liên đoàn cấp tỉnh
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </VCT_PageContainer>
    )
}
