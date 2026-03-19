'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Select,
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { useDebounce } from '../hooks/useDebounce'
import { exportToCSV } from './utils/adminExport'
import { usePagination } from '../hooks/usePagination'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'


// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Club {
    id: string; name: string; province: string; address: string
    head_coach: string; members: number; athletes: number
    established: string; phone: string; email: string
    status: 'active' | 'pending' | 'suspended'
    facilities: number; equipment_score: number
}

const STATUS_BADGE: Record<string, { label: string; type: string }> = {
    active: { label: 'Hoạt động', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    suspended: { label: 'Tạm ngưng', type: 'danger' },
}

const MOCK_CLUBS: Club[] = [
    { id: 'CLB-001', name: 'CLB Võ Cổ Truyền Bình Định', province: 'Bình Định', address: '123 Lê Lợi, Quy Nhơn', head_coach: 'Võ Đại Hùng', members: 120, athletes: 85, established: '1998-05-10', phone: '0256-3823456', email: 'binhdinh@vctclub.vn', status: 'active', facilities: 3, equipment_score: 92 },
    { id: 'CLB-002', name: 'CLB VCT Phú Thọ', province: 'TP.HCM', address: '58 Phú Thọ, Quận 11', head_coach: 'Nguyễn Thị Lan', members: 95, athletes: 68, established: '2001-03-15', phone: '028-38567890', email: 'phutho@vctclub.vn', status: 'active', facilities: 2, equipment_score: 88 },
    { id: 'CLB-003', name: 'CLB VCT Thanh Xuân', province: 'Hà Nội', address: '45 Nguyễn Trãi, Thanh Xuân', head_coach: 'Phạm Minh Trung', members: 75, athletes: 52, established: '2005-08-20', phone: '024-38678901', email: 'thanhxuan@vctclub.vn', status: 'active', facilities: 2, equipment_score: 85 },
    { id: 'CLB-004', name: 'CLB VCT Sơn Trà', province: 'Đà Nẵng', address: '12 Phạm Văn Đồng, Sơn Trà', head_coach: 'Lê Văn Phong', members: 45, athletes: 30, established: '2015-01-10', phone: '0236-3789012', email: 'sontra@vctclub.vn', status: 'pending', facilities: 1, equipment_score: 72 },
    { id: 'CLB-005', name: 'CLB VCT Bình Dương', province: 'Bình Dương', address: '88 Đại lộ BD, Thủ Dầu Một', head_coach: 'Trần Đức Thắng', members: 60, athletes: 42, established: '2010-06-15', phone: '0274-3890123', email: 'binhduong@vctclub.vn', status: 'active', facilities: 2, equipment_score: 80 },
    { id: 'CLB-006', name: 'CLB VCT Cần Thơ', province: 'Cần Thơ', address: '30 Trần Hưng Đạo, Ninh Kiều', head_coach: 'Ngô Thanh Tùng', members: 38, athletes: 25, established: '2018-09-01', phone: '0292-3901234', email: 'cantho@vctclub.vn', status: 'suspended', facilities: 1, equipment_score: 65 },
]


// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_clubs = () => (
    <AdminGuard>
        <Page_admin_clubs_Content />
    </AdminGuard>
)

const Page_admin_clubs_Content = () => {
    const { t } = useI18n()
    const { data: fetchedClubs, isLoading } = useAdminFetch<Club[]>('/admin/clubs', { mockData: MOCK_CLUBS })
    const [clubs, setClubs] = useState<Club[]>([])
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [filterStatus, setFilterStatus] = useState('all')
    const [selected, setSelected] = useState<Club | null>(null)
    const { showToast } = useShellToast()

    const [sortCol, setSortCol] = useState<string>('name')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    const { mutate: mutateApprove } = useAdminMutation('/admin/clubs/approve', { onSuccess: () => showToast('Đã duyệt CLB') })
    const { mutate: mutateSuspend } = useAdminMutation('/admin/clubs/suspend', { onSuccess: () => showToast('Đã tạm ngưng CLB', 'info') })

    React.useEffect(() => { if (fetchedClubs) setClubs(fetchedClubs) }, [fetchedClubs])

    const filtered = useMemo(() => {
        let data = clubs.filter(c => {
            const matchSearch = c.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.province.toLowerCase().includes(debouncedSearch.toLowerCase()) || c.head_coach.toLowerCase().includes(debouncedSearch.toLowerCase())
            const matchStatus = filterStatus === 'all' || c.status === filterStatus
            return matchSearch && matchStatus
        })

        data = [...data].sort((a, b) => {
            const valA = String((a as any)[sortCol] || '').toLowerCase()
            const valB = String((b as any)[sortCol] || '').toLowerCase()
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })

        return data
    }, [clubs, debouncedSearch, filterStatus, sortCol, sortDir])

    const pagination = usePagination(filtered, { pageSize: 10 })

    const totalMembers = clubs.reduce((a, c) => a + c.members, 0)
    const totalAthletes = clubs.reduce((a, c) => a + c.athletes, 0)

    const stats: StatItem[] = [
        { icon: <VCT_Icons.Home size={20} />, label: 'Tổng CLB', value: clubs.length, color: '#0ea5e9' },
        { icon: <VCT_Icons.Users size={20} />, label: 'Tổng thành viên', value: totalMembers, color: '#10b981' },
        { icon: <VCT_Icons.Award size={20} />, label: 'VĐV đang luyện', value: totalAthletes, color: '#94a3b8' },
        { icon: <VCT_Icons.Clock size={20} />, label: 'Chờ duyệt', value: clubs.filter(c => c.status === 'pending').length, color: '#f59e0b' },
    ]

    const handleSort = (key: string) => {
        if (sortCol === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortCol(key)
            setSortDir('asc')
        }
    }

    const handleApprove = async (id: string) => {
        await mutateApprove({ id })
        setClubs(prev => prev.map(c => c.id === id ? { ...c, status: 'active' as const } : c))
        setSelected(null)
    }

    const handleSuspend = async (id: string) => {
        await mutateSuspend({ id })
        setClubs(prev => prev.map(c => c.id === id ? { ...c, status: 'suspended' as const } : c))
    }

    const handleExportCSV = () => {
        exportToCSV({
            headers: ['ID', 'Tên CLB', 'Tỉnh/TP', 'HLV trưởng', 'Thành viên', 'VĐV', 'Thiết bị', 'Trạng thái', 'Email'],
            rows: filtered.map(c => [c.id, c.name, c.province, c.head_coach, String(c.members), String(c.athletes), `${c.equipment_score}%`, STATUS_BADGE[c.status]?.label ?? c.status, c.email]),
            filename: 'vct_clubs.csv',
        })
        showToast('Đã xuất danh sách CLB!')
    }

    return (
        <AdminPageShell
            title={t('admin.clubs.title')}
            subtitle="CLB, thành viên, cơ sở vật chất, và thiết bị"
            icon={<VCT_Icons.Home size={28} className="text-[#10b981]" />}
            stats={stats}
            actions={<VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={handleExportCSV}>Xuất CSV</VCT_Button>}
        >
            <div className="flex flex-wrap items-center gap-3 mb-6">
                <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm CLB..." className="flex-1 min-w-[220px]" />
                <VCT_Select value={filterStatus} onChange={setFilterStatus} options={[{ value: 'all', label: 'Tất cả' }, ...Object.entries(STATUS_BADGE).map(([k, v]) => ({ value: k, label: v.label }))]} />
            </div>

            {/* ── Table ── */}
            <AdminDataTable
                data={pagination.paginatedItems}
                isLoading={isLoading}
                sortBy={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                rowKey={c => c.id}
                emptyTitle="Không tìm thấy CLB"
                emptyIcon="🏰"
                className="mb-6"
                columns={[
                    { key: 'name', label: 'Tên CLB', sortable: true, render: c => <div className="font-bold text-(--vct-text-primary)">{c.name}</div> },
                    { key: 'province', label: 'Tỉnh/TP', sortable: true, render: c => <div className="text-(--vct-text-secondary)">{c.province}</div> },
                    { key: 'head_coach', label: 'HLV trưởng', sortable: true, render: c => <div className="text-(--vct-text-secondary)">{c.head_coach}</div> },
                    { key: 'members', label: 'Thành viên', sortable: true, align: 'right', render: c => <div className="font-mono text-sm">{c.members}</div> },
                    { key: 'athletes', label: 'VĐV', sortable: true, align: 'right', render: c => <div className="font-mono text-sm text-(--vct-accent-cyan)">{c.athletes}</div> },
                    { key: 'equipment_score', label: 'Thiết bị', sortable: true, align: 'right', render: c => <div className="font-mono text-sm opacity-80">{c.equipment_score}%</div> },
                    { key: 'status', label: 'Trạng thái', sortable: true, align: 'center', render: c => <VCT_Badge type={STATUS_BADGE[c.status]?.type ?? 'neutral'} text={STATUS_BADGE[c.status]?.label ?? c.status} /> },
                ]}
            />

            {/* ── Detail Drawer ── */}
            <VCT_Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} width={520}>
                {selected && (
                    <VCT_Stack gap={20}>
                        <div className="flex items-center gap-3">
                            <VCT_Badge type={STATUS_BADGE[selected.status]?.type ?? 'neutral'} text={STATUS_BADGE[selected.status]?.label ?? selected.status} />
                            <span className="text-xs text-(--vct-text-tertiary) font-mono">{selected.id}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Địa chỉ', value: selected.address },
                                { label: 'Tỉnh/TP', value: selected.province },
                                { label: 'HLV trưởng', value: selected.head_coach },
                                { label: 'Thành lập', value: selected.established },
                                { label: 'Thành viên', value: String(selected.members) },
                                { label: 'VĐV', value: String(selected.athletes) },
                                { label: 'Cơ sở vật chất', value: `${selected.facilities} phòng tập` },
                                { label: 'Điểm thiết bị', value: `${selected.equipment_score}/100` },
                                { label: 'SĐT', value: selected.phone },
                                { label: 'Email', value: selected.email },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Equipment score bar */}
                        <div>
                            <div className="text-xs text-(--vct-text-tertiary) font-bold mb-2">Chất lượng thiết bị</div>
                            <div className="w-full h-3 bg-(--vct-bg-base) rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${selected.equipment_score}%`, backgroundColor: selected.equipment_score >= 85 ? '#10b981' : selected.equipment_score >= 70 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                        </div>

                        <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle)">
                            {selected.status === 'pending' && <VCT_Button variant="primary" onClick={() => handleApprove(selected.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Duyệt CLB</VCT_Button>}
                            {selected.status === 'active' && <VCT_Button variant="ghost" onClick={() => { handleSuspend(selected.id); setSelected(null) }} icon={<VCT_Icons.Close size={14} />}>Tạm ngưng</VCT_Button>}
                        </VCT_Stack>
                    </VCT_Stack>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}
