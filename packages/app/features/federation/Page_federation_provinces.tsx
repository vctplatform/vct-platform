'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_EmptyState,
    VCT_PageContainer, VCT_StatRow
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useFederationProvinces, type Province } from '../hooks/useFederationAPI'

// ════════════════════════════════════════
// FEDERATION — PROVINCES (API-WIRED + PAGINATION)
// ════════════════════════════════════════

const REGION_MAP: Record<string, string> = {
    north: 'Miền Bắc', central: 'Miền Trung', south: 'Miền Nam',
}

const STATUS_COLOR: Record<string, { label: string; type: any }> = {
    active: { label: 'Hoạt động', type: 'success' },
    inactive: { label: 'Chưa kích hoạt', type: 'neutral' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
}

// ── Fallback seed data ──
const FALLBACK_PROVINCES: Province[] = [
    // ── Miền Bắc (15) ──
    { id: 'HN',  code: 'HN',  name: 'TP Hà Nội',      region: 'north',   has_fed: true,  club_count: 60, vdv_count: 1500, coach_count: 110 },
    { id: 'HP',  code: 'HP',  name: 'TP Hải Phòng',    region: 'north',   has_fed: true,  club_count: 30, vdv_count: 700,  coach_count: 45 },
    { id: 'QN',  code: 'QN',  name: 'Quảng Ninh',      region: 'north',   has_fed: true,  club_count: 15, vdv_count: 300,  coach_count: 20 },
    { id: 'BN',  code: 'BN',  name: 'Bắc Ninh',        region: 'north',   has_fed: true,  club_count: 20, vdv_count: 400,  coach_count: 25 },
    { id: 'HY',  code: 'HY',  name: 'Hưng Yên',        region: 'north',   has_fed: true,  club_count: 15, vdv_count: 250,  coach_count: 18 },
    { id: 'NB',  code: 'NB',  name: 'Ninh Bình',       region: 'north',   has_fed: true,  club_count: 25, vdv_count: 550,  coach_count: 35 },
    { id: 'PT',  code: 'PT',  name: 'Phú Thọ',         region: 'north',   has_fed: true,  club_count: 18, vdv_count: 400,  coach_count: 28 },
    { id: 'TN',  code: 'TN',  name: 'Thái Nguyên',     region: 'north',   has_fed: true,  club_count: 12, vdv_count: 200,  coach_count: 15 },
    { id: 'TQ',  code: 'TQ',  name: 'Tuyên Quang',     region: 'north',   has_fed: false, club_count: 8,  vdv_count: 120,  coach_count: 8 },
    { id: 'LCI', code: 'LCI', name: 'Lào Cai',         region: 'north',   has_fed: true,  club_count: 9,  vdv_count: 150,  coach_count: 10 },
    { id: 'CB',  code: 'CB',  name: 'Cao Bằng',        region: 'north',   has_fed: false, club_count: 5,  vdv_count: 80,   coach_count: 5 },
    { id: 'LS',  code: 'LS',  name: 'Lạng Sơn',        region: 'north',   has_fed: false, club_count: 6,  vdv_count: 90,   coach_count: 6 },
    { id: 'SL',  code: 'SL',  name: 'Sơn La',          region: 'north',   has_fed: false, club_count: 7,  vdv_count: 100,  coach_count: 8 },
    { id: 'DB',  code: 'DB',  name: 'Điện Biên',       region: 'north',   has_fed: false, club_count: 4,  vdv_count: 60,   coach_count: 4 },
    { id: 'LC',  code: 'LC',  name: 'Lai Châu',        region: 'north',   has_fed: false, club_count: 3,  vdv_count: 40,   coach_count: 3 },
    // ── Miền Trung & Tây Nguyên (11) ──
    { id: 'TH',  code: 'TH',  name: 'Thanh Hóa',       region: 'central', has_fed: true,  club_count: 30, vdv_count: 800,  coach_count: 50 },
    { id: 'NA',  code: 'NA',  name: 'Nghệ An',         region: 'central', has_fed: true,  club_count: 25, vdv_count: 600,  coach_count: 40 },
    { id: 'HT',  code: 'HT',  name: 'Hà Tĩnh',        region: 'central', has_fed: true,  club_count: 15, vdv_count: 300,  coach_count: 20 },
    { id: 'HUE', code: 'HUE', name: 'TP Huế',          region: 'central', has_fed: true,  club_count: 20, vdv_count: 450,  coach_count: 30 },
    { id: 'DN',  code: 'DN',  name: 'TP Đà Nẵng',      region: 'central', has_fed: true,  club_count: 25, vdv_count: 650,  coach_count: 45 },
    { id: 'QT',  code: 'QT',  name: 'Quảng Trị',       region: 'central', has_fed: true,  club_count: 12, vdv_count: 250,  coach_count: 15 },
    { id: 'QNG', code: 'QNG', name: 'Quảng Ngãi',      region: 'central', has_fed: true,  club_count: 18, vdv_count: 400,  coach_count: 25 },
    { id: 'KH',  code: 'KH',  name: 'Khánh Hòa',       region: 'central', has_fed: true,  club_count: 20, vdv_count: 450,  coach_count: 30 },
    { id: 'GL',  code: 'GL',  name: 'Gia Lai',         region: 'central', has_fed: true,  club_count: 14, vdv_count: 300,  coach_count: 20 },
    { id: 'DL',  code: 'DL',  name: 'Đắk Lắk',        region: 'central', has_fed: true,  club_count: 22, vdv_count: 500,  coach_count: 35 },
    { id: 'LDO', code: 'LDO', name: 'Lâm Đồng',       region: 'central', has_fed: true,  club_count: 20, vdv_count: 450,  coach_count: 30 },
    // ── Miền Nam (8) ──
    { id: 'HCM', code: 'HCM', name: 'TP Hồ Chí Minh', region: 'south',   has_fed: true,  club_count: 80, vdv_count: 2500, coach_count: 180 },
    { id: 'CT',  code: 'CT',  name: 'TP Cần Thơ',      region: 'south',   has_fed: true,  club_count: 25, vdv_count: 650,  coach_count: 40 },
    { id: 'DNI', code: 'DNI', name: 'Đồng Nai',        region: 'south',   has_fed: true,  club_count: 40, vdv_count: 1100, coach_count: 75 },
    { id: 'AG',  code: 'AG',  name: 'An Giang',        region: 'south',   has_fed: true,  club_count: 20, vdv_count: 500,  coach_count: 35 },
    { id: 'CM',  code: 'CM',  name: 'Cà Mau',          region: 'south',   has_fed: true,  club_count: 15, vdv_count: 350,  coach_count: 22 },
    { id: 'DT',  code: 'DT',  name: 'Đồng Tháp',      region: 'south',   has_fed: true,  club_count: 18, vdv_count: 400,  coach_count: 28 },
    { id: 'TNI', code: 'TNI', name: 'Tây Ninh',        region: 'south',   has_fed: true,  club_count: 12, vdv_count: 250,  coach_count: 15 },
    { id: 'VL',  code: 'VL',  name: 'Vĩnh Long',       region: 'south',   has_fed: true,  club_count: 8,  vdv_count: 180,  coach_count: 12 },
]

export const Page_federation_provinces = () => {
    const [search, setSearch] = useState('')
    const [regionFilter, setRegionFilter] = useState<string>('')
    const [page, setPage] = useState(1)
    const pageSize = 20

    // Wire to API with pagination
    const { data: apiData, isLoading } = useFederationProvinces({
        page, limit: pageSize, search: search || undefined,
    })

    // Use API data with fallback
    const allProvinces: Province[] = useMemo(() => {
        if (apiData && Array.isArray(apiData)) return apiData
        // Handle paginated response shape
        if (apiData && typeof apiData === 'object' && 'items' in apiData) return (apiData as { items: Province[] }).items
        return FALLBACK_PROVINCES
    }, [apiData])

    const filtered = useMemo(() => {
        let data = allProvinces
        if (regionFilter) data = data.filter(p => p.region === regionFilter)
        // If API doesn't handle search, do client-side
        if (search && !apiData) {
            const q = search.toLowerCase()
            data = data.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
        }
        return data
    }, [allProvinces, regionFilter, search, apiData])

    const totalClubs = allProvinces.reduce((s, p) => s + p.club_count, 0)
    const totalVDV = allProvinces.reduce((s, p) => s + p.vdv_count, 0)
    const activeProvinces = allProvinces.filter(p => p.has_fed).length
    const totalPages = apiData && typeof apiData === 'object' && 'total_pages' in apiData ? (apiData as { total_pages: number }).total_pages : 1

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
                    Quản lý Tỉnh / Thành phố
                    {isLoading && <span className="ml-2 text-sm font-normal text-(--vct-accent-cyan)">Đang tải...</span>}
                </h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Tổng quan 34 tỉnh/thành (sau sáp nhập 2025) — theo dõi tổ chức liên đoàn địa phương, CLB và VĐV.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tỉnh/TP', value: allProvinces.length, icon: <VCT_Icons.MapPin size={18} />, color: 'var(--vct-info)' },
                { label: 'Có Liên đoàn', value: activeProvinces, icon: <VCT_Icons.Building2 size={18} />, color: 'var(--vct-success)' },
                { label: 'Tổng CLB', value: totalClubs, icon: <VCT_Icons.Home size={18} />, color: 'var(--vct-warning)' },
                { label: 'Tổng VĐV', value: totalVDV.toLocaleString('vi-VN'), icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-accent-cyan)' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm tỉnh/thành phố..." />
                    </div>
                    <select title="Lọc theo vùng miền" value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
                        className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none focus:border-(--vct-accent-cyan)">
                        <option value="">Tất cả vùng</option>
                        {Object.entries(REGION_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary" onClick={() => { }}>Xuất file</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy tỉnh/thành" description="Thử thay đổi bộ lọc." icon="🗺️" />
            ) : (
                <>
                    <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                        {filtered.map(p => (
                            <div key={p.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer">
                                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-3">
                                    <VCT_Stack direction="row" gap={10} align="center">
                                        <div className="w-10 h-10 rounded-xl bg-linear-to-br from-(--vct-info) to-[#6d28d9] flex items-center justify-center text-white font-bold text-sm">{p.code}</div>
                                        <div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{p.name}</div>
                                            <div className="text-xs opacity-60">{REGION_MAP[p.region] || p.region}</div>
                                        </div>
                                    </VCT_Stack>
                                    <VCT_Badge text={p.has_fed ? 'Hoạt động' : 'Chưa có LĐ'} type={p.has_fed ? 'success' : 'neutral'} />
                                </VCT_Stack>
                                <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-(--vct-border-subtle)">
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-(--vct-accent-cyan)">{p.club_count}</div>
                                        <div className="text-[10px] opacity-50 uppercase font-bold">CLB</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-(--vct-warning)">{p.vdv_count}</div>
                                        <div className="text-[10px] opacity-50 uppercase font-bold">VĐV</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-lg font-bold text-(--vct-success)">{p.coach_count}</div>
                                        <div className="text-[10px] opacity-50 uppercase font-bold">HLV</div>
                                    </div>
                                </div>
                                {p.has_fed && (
                                    <div className="mt-3 flex items-center gap-2 text-xs text-(--vct-success)">
                                        <VCT_Icons.Check size={14} /> Có Liên đoàn cấp tỉnh
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* ── Pagination Controls ── */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-6">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                                className="px-3 py-2 text-sm rounded-lg bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) disabled:opacity-30 hover:bg-(--vct-bg-hover) transition-colors">
                                ← Trước
                            </button>
                            <span className="text-sm text-(--vct-text-secondary)">
                                Trang {page} / {totalPages}
                            </span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                                className="px-3 py-2 text-sm rounded-lg bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) disabled:opacity-30 hover:bg-(--vct-bg-hover) transition-colors">
                                Sau →
                            </button>
                        </div>
                    )}
                </>
            )}
        </VCT_PageContainer>
    )
}
