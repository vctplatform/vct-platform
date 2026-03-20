'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Stack, VCT_SearchInput,
    VCT_EmptyState, VCT_PageContainer, VCT_StatRow, VCT_Button
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { exportToExcel } from '../../utils/exportUtils'
import { VCT_Timeline } from '../components/VCT_Timeline'
import { useFederationPersonnel, type PersonnelAssignment } from '../hooks/useFederationAPI'

// ════════════════════════════════════════
// FEDERATION — NHÂN SỰ BAN CHẤP HÀNH (API-WIRED)
// ════════════════════════════════════════

const FALLBACK_PERSONNEL: PersonnelAssignment[] = [
    { id: '1', user_id: 'u1', user_name: '', name: 'Nguyễn Văn Minh', position: 'Chủ tịch', unit_id: 'bch', unit_name: 'LĐ VCT Việt Nam', role_code: 'federation_president', start_date: '2022-01-15', is_active: true },
    { id: '2', user_id: 'u2', user_name: '', name: 'Trần Thị Hạnh', position: 'Phó Chủ tịch', unit_id: 'bch', unit_name: 'LĐ VCT Việt Nam', role_code: 'federation_secretary', start_date: '2022-01-15', is_active: true },
    { id: '3', user_id: 'u3', user_name: '', name: 'Lê Hoàng Nam', position: 'Tổng Thư ký', unit_id: 'bch', unit_name: 'LĐ VCT Việt Nam', role_code: 'federation_secretary', start_date: '2022-03-01', is_active: true },
    { id: '4', user_id: 'u4', user_name: '', name: 'Phạm Quốc Hùng', position: 'Trưởng ban Kỹ thuật', unit_id: 'bkt', unit_name: 'Ban Kỹ thuật', role_code: 'national_coach', start_date: '2022-06-10', is_active: true },
    { id: '5', user_id: 'u5', user_name: '', name: 'Võ Minh Tuấn', position: 'Trưởng ban Trọng tài', unit_id: 'btt', unit_name: 'Ban Trọng tài', role_code: 'national_referee', start_date: '2023-01-01', is_active: true },
    { id: '6', user_id: 'u6', user_name: '', name: 'Đỗ Thị Lan', position: 'Phó ban Đào tạo', unit_id: 'bdt', unit_name: 'Ban Đào tạo', role_code: 'national_coach', start_date: '2023-03-15', is_active: true },
    { id: '7', user_id: 'u7', user_name: '', name: 'Hoàng Đức Anh', position: 'Ủy viên', unit_id: 'bch', unit_name: 'BCH Liên đoàn', role_code: 'federation_secretary', start_date: '2022-01-15', is_active: true },
    { id: '8', user_id: 'u8', user_name: '', name: 'Bùi Văn Thắng', position: 'Ủy viên', unit_id: 'bch', unit_name: 'BCH Liên đoàn', role_code: 'federation_secretary', start_date: '2020-01-01', is_active: false },
] as unknown as PersonnelAssignment[]

const PERSONNEL_AUDIT_LOGS = [
    { time: '08:15 Hôm nay', title: 'Bổ nhiệm mới', description: 'Thêm ông Trần Văn C vào Ban Kỹ thuật', color: '#10b981', icon: '👤' },
    { time: '16:30 Hôm qua', title: 'Cập nhật hồ sơ', description: 'Trần Thị Hạnh cập nhật thông tin liên lạc', color: '#3b82f6', icon: '📝' },
    { time: '10:00 10/03/2026', title: 'Miễn nhiệm', description: 'Ông Bùi Văn Thắng thôi giữ chức vụ Ủy viên BCH do hết nhiệm kỳ', color: '#ef4444', icon: '⚠️' }
];

const ROLE_LABELS: Record<string, { label: string; type: 'highlight' | 'info' | 'success' | 'warning' | 'neutral' }> = {
    federation_president: { label: 'Chủ tịch', type: 'highlight' },
    federation_secretary: { label: 'Thư ký/UV', type: 'info' },
    national_coach: { label: 'HLV', type: 'success' },
    national_referee: { label: 'Trọng tài', type: 'warning' },
}

export function Page_federation_personnel() {
    const [search, setSearch] = useState('')
    const [unitFilter, setUnitFilter] = useState('')

    // Wire to API
    const { data: apiData, isLoading } = useFederationPersonnel(unitFilter || undefined)

    const personnel = useMemo(() => {
        if (apiData && Array.isArray(apiData)) return apiData
        if (apiData && typeof apiData === 'object' && 'items' in apiData) return (apiData as { items: PersonnelAssignment[] }).items
        return FALLBACK_PERSONNEL
    }, [apiData])

    const units = useMemo(() => Array.from(new Set(personnel.map((p: PersonnelAssignment) => p.unit_name))), [personnel])

    const filtered = useMemo(() => {
        let data = personnel as PersonnelAssignment[]
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(p =>
                (p.user_name || (p as unknown as Record<string, string>).name || '').toLowerCase().includes(q) ||
                p.position.toLowerCase().includes(q)
            )
        }
        return data
    }, [personnel, search])

    const activeCount = (personnel as PersonnelAssignment[]).filter(p => p.is_active).length

    const handleExportExcel = () => {
        const exportData = filtered.map((p: PersonnelAssignment, idx) => ({
            'STT': idx + 1,
            'Họ Tên': p.user_name || (p as unknown as Record<string, string>).name || 'N/A',
            'Chức Vụ': p.position,
            'Đơn Vị': p.unit_name,
            'Vai Trò Hệ Thống': p.role_code,
            'Ngày Bắt Đầu': p.start_date,
            'Trạng Thái': p.is_active ? 'Đang hoạt động' : 'Hết nhiệm kỳ'
        }));
        exportToExcel(exportData, 'danh_sach_nhan_su_lien_doan');
    };

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
                    Nhân sự Ban chấp hành
                    {isLoading && <span className="ml-2 text-sm font-normal text-(--vct-accent-cyan)">Đang tải...</span>}
                </h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">
                    Quản lý nhân sự BCH liên đoàn — bổ nhiệm, nhiệm kỳ, phân công chức vụ.
                </p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng nhân sự', value: (personnel as PersonnelAssignment[]).length, icon: <VCT_Icons.Users size={18} />, color: '#8b5cf6' },
                { label: 'Đang hoạt động', value: activeCount, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Đơn vị', value: units.length, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
                { label: 'Hết nhiệm kỳ', value: (personnel as PersonnelAssignment[]).length - activeCount, icon: <VCT_Icons.AlertTriangle size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={12} align="center" className="mb-5">
                <div className="w-full max-w-[300px]">
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm nhân sự..." />
                </div>
                <select value={unitFilter} onChange={(e) => setUnitFilter(e.target.value)}
                    className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none focus:border-(--vct-accent-cyan)">
                    <option value="">Tất cả đơn vị</option>
                    {units.map(u => <option key={u as string} value={u as string}>{u as string}</option>)}
                </select>
                <div className="flex-1" />
                <VCT_Button variant="secondary" onClick={handleExportExcel}>
                    <VCT_Icons.Download size={16} className="mr-2" />
                    Xuất Excel
                </VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy nhân sự" description="Thử thay đổi bộ lọc." icon="👤" />
            ) : (
                <div className="space-y-3">
                    {filtered.map((p: PersonnelAssignment) => {
                        const displayName = p.user_name || (p as unknown as Record<string, string>).name || 'N/A'
                        return (
                            <div key={p.id} className="flex items-center gap-4 p-4 rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) hover:border-(--vct-accent-cyan) transition-colors cursor-pointer">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6d28d9] flex items-center justify-center text-white font-bold text-sm">
                                    {displayName.split(' ').map((w: string) => w[0]).slice(-2).join('')}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{displayName}</div>
                                    <div className="text-xs text-(--vct-text-secondary)">{p.position} — {p.unit_name}</div>
                                </div>
                                <VCT_Badge text={ROLE_LABELS[p.role_code]?.label || p.role_code} type={ROLE_LABELS[p.role_code]?.type || 'neutral'} />
                                <VCT_Badge text={p.is_active ? 'Đang nhiệm' : 'Hết NK'} type={p.is_active ? 'success' : 'neutral'} />
                                <span className="text-xs text-(--vct-text-secondary) hidden sm:block">{p.start_date}</span>
                            </div>
                        )
                    })}
                </div>
            )}
            
            {/* Audit Trails */}
            <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5 mt-6">
                <h3 className="text-sm font-bold text-(--vct-text-primary) mb-4">📜 Lịch sử thay đổi nhân sự (Audit Trails)</h3>
                <VCT_Timeline events={PERSONNEL_AUDIT_LOGS} />
            </div>
        </VCT_PageContainer>
    )
}
