'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Select, VCT_Tabs,
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Drawer } from '@vct/ui'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { useDebounce } from '../hooks/useDebounce'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'


// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface FederationUnit {
    id: string; name: string; type: 'national' | 'provincial' | 'sub_association'
    province?: string; president: string; members: number
    clubs: number; athletes: number
    status: 'active' | 'pending' | 'suspended'
    established: string; phone: string; email: string
}

interface Personnel {
    id: string; name: string; role: string; department: string
    federation: string; status: 'active' | 'inactive'; phone: string
}

const STATUS_BADGE: Record<string, { label: string; type: string }> = {
    active: { label: 'Hoạt động', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    suspended: { label: 'Tạm ngưng', type: 'danger' },
    inactive: { label: 'Không hoạt động', type: 'neutral' },
}

const TYPE_BADGE: Record<string, { label: string; type: string }> = {
    national: { label: 'Quốc gia', type: 'danger' },
    provincial: { label: 'Tỉnh/TP', type: 'info' },
    sub_association: { label: 'Chi hội', type: 'success' },
}

const MOCK_UNITS: FederationUnit[] = [
    { id: 'FED-001', name: 'Liên đoàn Võ Cổ Truyền Việt Nam', type: 'national', president: 'Nguyễn Văn Quốc', members: 45, clubs: 320, athletes: 15000, status: 'active', established: '1991-01-15', phone: '028-38123456', email: 'info@vct.vn' },
    { id: 'FED-002', name: 'Liên đoàn VCT TP. Hồ Chí Minh', type: 'provincial', province: 'TP.HCM', president: 'Trần Minh Thắng', members: 12, clubs: 45, athletes: 2500, status: 'active', established: '1995-06-20', phone: '028-38234567', email: 'hcm@vct.vn' },
    { id: 'FED-003', name: 'Liên đoàn VCT Bình Định', type: 'provincial', province: 'Bình Định', president: 'Lê Đức Võ', members: 8, clubs: 30, athletes: 1800, status: 'active', established: '1993-03-10', phone: '0256-3823456', email: 'binhdinh@vct.vn' },
    { id: 'FED-004', name: 'Liên đoàn VCT Hà Nội', type: 'provincial', province: 'Hà Nội', president: 'Phạm Văn Hà', members: 10, clubs: 38, athletes: 2200, status: 'active', established: '1994-08-05', phone: '024-38345678', email: 'hanoi@vct.vn' },
    { id: 'FED-005', name: 'Liên đoàn VCT Đà Nẵng', type: 'provincial', province: 'Đà Nẵng', president: 'Ngô Thanh Hải', members: 6, clubs: 18, athletes: 900, status: 'pending', established: '2020-01-15', phone: '0236-3845678', email: 'danang@vct.vn' },
    { id: 'FED-006', name: 'Chi hội VCT Quận 1', type: 'sub_association', province: 'TP.HCM', president: 'Võ Minh Tuấn', members: 4, clubs: 8, athletes: 350, status: 'active', established: '2000-05-20', phone: '028-38456789', email: 'q1@vct-hcm.vn' },
]

const MOCK_PERSONNEL: Personnel[] = [
    { id: 'PER-001', name: 'Nguyễn Văn Quốc', role: 'Chủ tịch', department: 'Ban Chấp hành', federation: 'FED-001', status: 'active', phone: '0901111111' },
    { id: 'PER-002', name: 'Lê Thanh Sơn', role: 'Phó Chủ tịch', department: 'Ban Chấp hành', federation: 'FED-001', status: 'active', phone: '0902222222' },
    { id: 'PER-003', name: 'Trần Thị Hoa', role: 'Tổng Thư ký', department: 'Ban Thư ký', federation: 'FED-001', status: 'active', phone: '0903333333' },
    { id: 'PER-004', name: 'Phạm Đức Phong', role: 'Trưởng ban Chuyên môn', department: 'Ban Chuyên môn', federation: 'FED-001', status: 'active', phone: '0904444444' },
    { id: 'PER-005', name: 'Võ Thị Mai', role: 'Trưởng ban Tài chính', department: 'Ban Tài chính', federation: 'FED-001', status: 'active', phone: '0905555555' },
]



// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_federation = () => (
    <AdminGuard>
        <Page_admin_federation_Content />
    </AdminGuard>
)

const Page_admin_federation_Content = () => {
    const { t } = useI18n()
    const { data: fetchedUnits, isLoading } = useAdminFetch<FederationUnit[]>('/admin/federation/units', { mockData: MOCK_UNITS })
    const [tab, setTab] = useState<'units' | 'personnel'>('units')
    const [units, setUnits] = useState<FederationUnit[]>([])
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [filterType, setFilterType] = useState('all')
    const [selected, setSelected] = useState<FederationUnit | null>(null)
    const [sortColUnits, setSortColUnits] = useState('name')
    const [sortDirUnits, setSortDirUnits] = useState<'asc' | 'desc'>('asc')
    
    const [sortColPersonnel, setSortColPersonnel] = useState('name')
    const [sortDirPersonnel, setSortDirPersonnel] = useState<'asc' | 'desc'>('asc')

    const { showToast } = useShellToast()
    const { mutate: mutateApprove } = useAdminMutation('/admin/federation/approve', { onSuccess: () => showToast('Đã duyệt tổ chức') })

    React.useEffect(() => { if (fetchedUnits) setUnits(fetchedUnits) }, [fetchedUnits])

    const filtered = useMemo(() => {
        let data = units.filter(u => {
            const matchSearch = u.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || u.president.toLowerCase().includes(debouncedSearch.toLowerCase())
            const matchType = filterType === 'all' || u.type === filterType
            return matchSearch && matchType
        })

        data = [...data].sort((a, b) => {
            const valA = String((a as any)[sortColUnits] || '').toLowerCase()
            const valB = String((b as any)[sortColUnits] || '').toLowerCase()
            if (sortColUnits === 'athletes' || sortColUnits === 'clubs') {
                return sortDirUnits === 'asc' ? Number(a[sortColUnits]) - Number(b[sortColUnits]) : Number(b[sortColUnits]) - Number(a[sortColUnits])
            }
            return sortDirUnits === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })

        return data
    }, [units, debouncedSearch, filterType, sortColUnits, sortDirUnits])

    const filteredPersonnel = useMemo(() => {
        return [...MOCK_PERSONNEL].sort((a, b) => {
            const valA = String((a as any)[sortColPersonnel] || '').toLowerCase()
            const valB = String((b as any)[sortColPersonnel] || '').toLowerCase()
            return sortDirPersonnel === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })
    }, [sortColPersonnel, sortDirPersonnel])

    const handleSortUnits = (key: string) => {
        if (sortColUnits === key) setSortDirUnits(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColUnits(key); setSortDirUnits('asc') }
    }

    const handleSortPersonnel = (key: string) => {
        if (sortColPersonnel === key) setSortDirPersonnel(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortColPersonnel(key); setSortDirPersonnel('asc') }
    }

    const totalAthletes = units.reduce((a, u) => a + u.athletes, 0)
    const totalClubs = units.reduce((a, u) => a + u.clubs, 0)

    const stats: StatItem[] = [
        { icon: <VCT_Icons.Building size={20} />, label: 'Tổ chức', value: units.length, color: 'var(--vct-accent-cyan)' },
        { icon: <VCT_Icons.MapPin size={20} />, label: 'Liên đoàn tỉnh', value: units.filter(u => u.type === 'provincial').length, color: 'var(--vct-text-tertiary)' },
        { icon: <VCT_Icons.Users size={20} />, label: 'Tổng VĐV', value: totalAthletes.toLocaleString(), color: 'var(--vct-success)' },
        { icon: <VCT_Icons.Home size={20} />, label: 'Tổng CLB', value: totalClubs, color: 'var(--vct-warning)' },
    ]

    const handleApprove = async (id: string) => {
        await mutateApprove({ id })
        setUnits(prev => prev.map(u => u.id === id ? { ...u, status: 'active' as const } : u))
        setSelected(null)
    }

    const tabItems = [
        { value: 'units', label: `Tổ chức (${units.length})` },
        { value: 'personnel', label: `Nhân sự (${MOCK_PERSONNEL.length})` },
    ]

    return (
        <AdminPageShell
            title={t('admin.federation.title')}
            subtitle="Tổ chức, nhân sự, và cơ cấu Liên đoàn VCT các cấp"
            icon={<VCT_Icons.Building size={28} className="text-(--vct-info)" />}
            stats={stats}
        >
            <VCT_Tabs tabs={tabItems} activeTab={tab} onChange={v => setTab(v as typeof tab)} className="mb-6" />

            {tab === 'units' && (
                <>
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm tổ chức..." className="flex-1 min-w-[220px]" />
                        <VCT_Select value={filterType} onChange={setFilterType} options={[{ value: 'all', label: 'Tất cả cấp' }, ...Object.entries(TYPE_BADGE).map(([k, v]) => ({ value: k, label: v.label }))]} />
                    </div>
                    <AdminDataTable
                        data={filtered}
                        isLoading={isLoading}
                        sortBy={sortColUnits}
                        sortDir={sortDirUnits}
                        onSort={handleSortUnits}
                        rowKey={u => u.id}
                        emptyTitle="Không tìm thấy tổ chức"
                        emptyDescription="Thử thay đổi bộ lọc tìm kiếm"
                        emptyIcon="🏛️"
                        columns={[
                            {
                                key: 'name',
                                label: 'Tên',
                                sortable: true,
                                render: (u) => (
                                    <div>
                                        <div className="font-bold text-(--vct-text-primary)">{u.name}</div>
                                        {u.province && <div className="text-xs text-(--vct-text-tertiary)">{u.province}</div>}
                                    </div>
                                )
                            },
                            {
                                key: 'type',
                                label: 'Cấp',
                                sortable: true,
                                hideMobile: true,
                                render: (u) => <VCT_Badge type={TYPE_BADGE[u.type]?.type ?? 'neutral'} text={TYPE_BADGE[u.type]?.label ?? u.type} />
                            },
                            {
                                key: 'president',
                                label: 'Chủ tịch',
                                sortable: true,
                                hideMobile: true,
                                render: (u) => <div className="text-(--vct-text-secondary)">{u.president}</div>
                            },
                            {
                                key: 'clubs',
                                label: 'CLB',
                                sortable: true,
                                align: 'center',
                                render: (u) => <div className="font-bold text-(--vct-text-primary)">{u.clubs}</div>
                            },
                            {
                                key: 'athletes',
                                label: 'VĐV',
                                sortable: true,
                                align: 'center',
                                render: (u) => <div className="font-bold text-(--vct-text-primary)">{u.athletes.toLocaleString()}</div>
                            },
                            {
                                key: 'status',
                                label: 'Trạng thái',
                                sortable: true,
                                align: 'center',
                                render: (u) => <VCT_Badge type={STATUS_BADGE[u.status]?.type ?? 'neutral'} text={STATUS_BADGE[u.status]?.label ?? u.status} />
                            },
                            {
                                key: '_actions',
                                label: 'Thao tác',
                                align: 'center',
                                sortable: false,
                                render: (u) => (
                                    <div onClick={e => e.stopPropagation()}>
                                        {u.status === 'pending' && <VCT_Button size="sm" variant="ghost" onClick={() => handleApprove(u.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Duyệt</VCT_Button>}
                                    </div>
                                )
                            }
                        ]}
                        onRowClick={(item) => setSelected(item)}
                    />
                </>
            )}

            {tab === 'personnel' && (
                <AdminDataTable
                    data={filteredPersonnel}
                    isLoading={false}
                    sortBy={sortColPersonnel}
                    sortDir={sortDirPersonnel}
                    onSort={handleSortPersonnel}
                    rowKey={p => p.id}
                    emptyTitle="Không có nhân sự"
                    columns={[
                        {
                            key: 'name',
                            label: 'Họ tên',
                            sortable: true,
                            render: (p) => <div className="font-bold text-(--vct-text-primary)">{p.name}</div>
                        },
                        {
                            key: 'role',
                            label: 'Chức vụ',
                            sortable: true,
                            render: (p) => <div className="text-(--vct-text-secondary)">{p.role}</div>
                        },
                        {
                            key: 'department',
                            label: 'Ban',
                            sortable: true,
                            hideMobile: true,
                            render: (p) => <div className="text-(--vct-text-secondary)">{p.department}</div>
                        },
                        {
                            key: 'phone',
                            label: 'SĐT',
                            sortable: true,
                            hideMobile: true,
                            render: (p) => <div className="text-(--vct-text-tertiary)">{p.phone}</div>
                        },
                        {
                            key: 'status',
                            label: 'Trạng thái',
                            sortable: true,
                            align: 'center',
                            render: (p) => <VCT_Badge type={STATUS_BADGE[p.status]?.type ?? 'neutral'} text={STATUS_BADGE[p.status]?.label ?? p.status} />
                        }
                    ]}
                />
            )}

            {/* ── Detail Drawer ── */}
            <VCT_Drawer isOpen={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ''} width={520}>
                {selected && (
                    <VCT_Stack gap={20}>
                        <div className="flex items-center gap-3">
                            <VCT_Badge type={TYPE_BADGE[selected.type]?.type} text={TYPE_BADGE[selected.type]?.label} />
                            <VCT_Badge type={STATUS_BADGE[selected.status]?.type} text={STATUS_BADGE[selected.status]?.label} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Chủ tịch', value: selected.president },
                                { label: 'Thành lập', value: selected.established },
                                { label: 'CLB trực thuộc', value: String(selected.clubs) },
                                { label: 'VĐV', value: selected.athletes.toLocaleString() },
                                { label: 'Nhân sự', value: String(selected.members) },
                                { label: 'Liên hệ', value: `${selected.phone}\n${selected.email}` },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                    <div className="font-bold text-sm text-(--vct-text-primary) whitespace-pre-line">{item.value}</div>
                                </div>
                            ))}
                        </div>
                        {selected.status === 'pending' && (
                            <VCT_Button variant="primary" onClick={() => handleApprove(selected.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Duyệt tổ chức</VCT_Button>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}
