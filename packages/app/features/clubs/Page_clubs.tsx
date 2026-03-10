'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_AvatarLetter, VCT_EmptyState, VCT_FilterChips,
    VCT_BulkActionsBar, VCT_PageContainer, VCT_PageHeader, VCT_PageToolbar,
    VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
type ClubType = 'phan_duong' | 'vo_duong' | 'clb'

interface Club {
    id: string
    name: string
    code: string
    org_id: string // Liên đoàn trực thuộc
    type: ClubType
    founded_date: string
    master_name: string
    phone: string
    address: string
    status: 'active' | 'suspended' | 'closed'
    total_members: number
    active_classes: number
}

const TYPE_MAP: Record<ClubType, string> = {
    phan_duong: 'Phân đường',
    vo_duong: 'Võ đường',
    clb: 'Câu lạc bộ'
}

const STATUS_MAP: Record<string, { label: string; type: any; color: string }> = {
    active: { label: 'Đang hoạt động', type: 'success', color: '#10b981' },
    suspended: { label: 'Tạm đình chỉ', type: 'warning', color: '#f59e0b' },
    closed: { label: 'Đã đóng cửa', type: 'error', color: '#ef4444' }
}

const MOCK_ORGS = [
    { id: 'ORG-001', name: 'Liên đoàn VCT Việt Nam' },
    { id: 'ORG-002', name: 'Hội VCT Tỉnh Bình Định' },
    { id: 'ORG-003', name: 'Hội VCT Quận 7' },
]

const MOCK_CLUBS: Club[] = [
    {
        id: 'CLB-001', name: 'Võ đường Trần Quang Diệu', code: 'TQD', org_id: 'ORG-002',
        type: 'vo_duong', founded_date: '2005-04-12', master_name: 'Võ sư Nguyễn B',
        phone: '0901112233', address: 'Tây Sơn, Bình Định', status: 'active',
        total_members: 120, active_classes: 4
    },
    {
        id: 'CLB-002', name: 'CLB VCT Trường ĐH Tôn Đức Thắng', code: 'TDT', org_id: 'ORG-003',
        type: 'clb', founded_date: '2018-09-05', master_name: 'HLV Lê C',
        phone: '0902223344', address: 'Quận 7, TP.HCM', status: 'active',
        total_members: 85, active_classes: 2
    },
    {
        id: 'CLB-003', name: 'Phân đường Bình Định Gia - Miền Bắc', code: 'BDG-MB', org_id: 'ORG-001',
        type: 'phan_duong', founded_date: '1995-12-20', master_name: 'Võ sư Trần D',
        phone: '0903334455', address: 'Cầu Giấy, Hà Nội', status: 'active',
        total_members: 450, active_classes: 12
    },
    {
        id: 'CLB-004', name: 'CLB Võ thuật Nhà văn hóa TN', code: 'NVHTN', org_id: 'ORG-001',
        type: 'clb', founded_date: '2010-06-01', master_name: 'HLV Phạm E',
        phone: '0904445566', address: 'Quận 1, TP.HCM', status: 'suspended',
        total_members: 55, active_classes: 1
    }
]

const BLANK_FORM: Partial<Club> = {
    name: '', code: '', org_id: '', type: 'clb', founded_date: '', master_name: '', phone: '', address: ''
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_clubs = () => {
    const [clubs, setClubs] = useState<Club[]>(MOCK_CLUBS)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editingClub, setEditingClub] = useState<Club | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)
    const [form, setForm] = useState<any>({ ...BLANK_FORM })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    // ── Computed ──
    const filtered = useMemo(() => {
        let data = clubs
        if (statusFilter) data = data.filter(t => t.status === statusFilter)
        if (typeFilter) data = data.filter(t => t.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.master_name.toLowerCase().includes(q))
        }
        return data
    }, [clubs, statusFilter, typeFilter, search])

    const totalMembers = clubs.reduce((s, c) => s + c.total_members, 0)
    const totalClasses = clubs.reduce((s, c) => s + c.active_classes, 0)

    // ── Filters ──
    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (typeFilter) f.push({ key: 'type', label: 'Mô hình', value: TYPE_MAP[typeFilter as ClubType] || typeFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [statusFilter, typeFilter, search])

    const removeFilter = (key: string) => {
        if (key === 'status') setStatusFilter(null)
        if (key === 'type') setTypeFilter(null)
        if (key === 'search') setSearch('')
    }

    // ── CRUD Operations ──
    const openAddModal = useCallback(() => {
        setEditingClub(null)
        setForm({ ...BLANK_FORM, founded_date: new Date().toISOString().split('T')[0], org_id: MOCK_ORGS[0]?.id || '' })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((club: Club) => {
        setEditingClub(club)
        setForm({ ...club })
        setShowModal(true)
    }, [])

    const handleSave = () => {
        if (!form.name || !form.code) { showToast('Vui lòng nhập tên và mã CLB', 'error'); return }
        if (editingClub) {
            setClubs(prev => prev.map(t => t.id === editingClub.id ? { ...t, ...form } : t))
            showToast(`Đã cập nhật "${form.name}"`)
        } else {
            const newClub: Club = {
                ...form, id: `CLB-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                status: 'active', total_members: 0, active_classes: 0,
            }
            setClubs(prev => [newClub, ...prev])
            showToast(`Đã thêm CLB "${form.name}"`)
        }
        setShowModal(false)
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setClubs(prev => prev.filter(t => t.id !== deleteTarget.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
        showToast(`Đã xóa "${deleteTarget.name}"`, 'success')
        setDeleteTarget(null)
    }

    // Bulk actions
    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)))

    const bulkActions = useMemo(() => [
        {
            label: 'Đóng cửa (Giải thể)',
            icon: <VCT_Icons.x size={14} />,
            onClick: () => {
                setClubs(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'closed' } : t))
                showToast(`Đã đóng cửa ${selectedIds.size} CLB`, 'error')
                setSelectedIds(new Set())
            },
            variant: 'danger'
        }
    ], [selectedIds, showToast])

    const columns = [
        {
            key: 'checkbox', label: <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />, align: 'center' as const,
            render: (r: Club) => <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: any) => e.stopPropagation()} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />
        },
        {
            key: 'name', label: 'Câu lạc bộ/Võ đường', render: (r: Club) => (
                <VCT_Stack direction="row" gap={10} align="center">
                    <VCT_AvatarLetter name={r.name} size={36} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--vct-text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>{r.code} • {MOCK_ORGS.find(o => o.id === r.org_id)?.name || 'Chưa trực thuộc'}</div>
                    </div>
                </VCT_Stack>
            )
        },
        {
            key: 'type', label: 'Mô hình', render: (r: Club) => (
                <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--vct-accent-cyan)' }}>{TYPE_MAP[r.type]}</div>
            )
        },
        {
            key: 'master_name', label: 'Chủ nhiệm / Võ sư', render: (r: Club) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.master_name}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{r.phone}</div>
                </div>
            )
        },
        {
            key: 'stats', label: 'Quy mô', align: 'center' as const, render: (r: Club) => (
                <div className="text-center">
                    <div style={{ fontWeight: 800, color: 'var(--vct-accent-cyan)', fontSize: 13 }}>{r.active_classes} lớp</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{r.total_members.toLocaleString('vi-VN')} võ sinh</div>
                </div>
            )
        },
        {
            key: 'status', label: 'Trạng thái', align: 'center' as const, render: (r: Club) => {
                const st = STATUS_MAP[r.status] || { label: 'Không rõ', type: 'info', color: '#94a3b8' }
                return <VCT_Badge text={st.label} type={st.type} />
            }
        },
        {
            key: 'actions', label: '', align: 'right' as const, render: (r: Club) => (
                <VCT_Stack direction="row" gap={4} justify="flex-end">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: 4 }} aria-label={`Edit ${r.name}`}>
                        <VCT_Icons.Edit size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }} aria-label={`Delete ${r.name}`}>
                        <VCT_Icons.Trash size={16} />
                    </button>
                </VCT_Stack>
            )
        },
    ]

    return (
        <VCT_PageContainer size="wide">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <VCT_PageHeader
                title="Câu lạc bộ & Võ đường"
                description="Nơi quản lý các đơn vị huấn luyện cơ sở, các phân đường và võ đường trực thuộc."
            />

            {/* ── KPI ROW ── */}
            <VCT_StatRow items={[
                { label: 'CLB/Võ đường', value: clubs.length, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
                { label: 'Lớp đang mở', value: totalClasses, icon: <VCT_Icons.Users size={18} />, color: '#f59e0b' },
                { label: 'Võ sinh', value: totalMembers.toLocaleString('vi-VN'), icon: <VCT_Icons.User size={18} />, color: '#10b981' },
                { label: 'Đình chỉ/Đóng', value: clubs.filter(c => c.status !== 'active').length, icon: <VCT_Icons.Alert size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            {/* ── FILTER CHIPS ── */}
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setStatusFilter(null); setTypeFilter(null); setSearch(''); }} />

            {/* ── TOOLBAR ── */}
            <VCT_PageToolbar
                actions={
                    <>
                        <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary" onClick={() => showToast('Đang xuất Excel...', 'info')}>Xuất file</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm CLB</VCT_Button>
                    </>
                }
            >
                <div className="w-full max-w-[300px]">
                    <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm CLB, mã, chủ nhiệm..." />
                </div>
                <select
                    value={typeFilter || ''}
                    onChange={(e) => setTypeFilter(e.target.value || null)}
                    className="bg-vct-elevated border border-vct-border text-vct-text text-sm rounded-lg px-3 py-2 outline-none focus:border-vct-accent transition-colors"
                >
                    <option value="">Tất cả mô hình</option>
                    {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </VCT_PageToolbar>

            {/* ── TABLE ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có câu lạc bộ nào" description={search || statusFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Chưa có dữ liệu. Bấm "Thêm CLB" để bắt đầu.'} actionLabel="Thêm CLB" onAction={openAddModal} icon="🏠" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                                {columns.map((col, i) => (
                                    <th key={i} style={{ padding: '14px 16px', textAlign: (col.align || 'left') as any, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, position: 'sticky', top: 0, background: 'var(--vct-bg-card)', zIndex: 2 }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((club, idx) => {
                                const stColor = STATUS_MAP[club.status]?.color || '#94a3b8'
                                return (
                                    <tr key={club.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', background: selectedIds.has(club.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', borderLeft: `3px solid ${stColor}` }}>
                                        {columns.map((col, ci) => (
                                            <td key={ci} style={{ padding: '14px 16px', fontSize: 13, textAlign: (col.align || 'left') as any }}>
                                                {col.render ? col.render(club) : (club as any)[col.key]}
                                            </td>
                                        ))}
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── BULK ACTIONS ── */}
            <AnimatePresence>
                <VCT_BulkActionsBar count={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} actions={bulkActions} />
            </AnimatePresence>

            {/* ── ADD/EDIT MODAL ── */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingClub ? 'Chỉnh sửa CLB/Võ đường' : 'Thêm CLB/Võ đường'} width="680px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingClub ? 'Cập nhật' : 'Khởi tạo CLB'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên CLB / Võ đường *"><VCT_Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="VD: Võ đường Tây Sơn" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Mã CLB *" className="flex-1"><VCT_Input value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} placeholder="VD: TSO" /></VCT_Field>
                        <VCT_Field label="Mô hình hoạt động" className="flex-1"><VCT_Select options={Object.entries(TYPE_MAP).map(([k, v]) => ({ value: k, label: v }))} value={form.type} onChange={(v: any) => setForm({ ...form, type: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Liên đoàn/Hội trực thuộc *">
                        <VCT_Select options={MOCK_ORGS.map(o => ({ value: o.id, label: o.name }))} value={form.org_id} onChange={(v: any) => setForm({ ...form, org_id: v })} />
                    </VCT_Field>

                    <div className="h-px w-full bg-[var(--vct-border-subtle)] my-2"></div>
                    <div className="text-sm font-bold opacity-70">Chủ nhiệm / Quản lý</div>

                    <VCT_Field label="Họ tên Chủ nhiệm / Võ sư"><VCT_Input value={form.master_name} onChange={(e: any) => setForm({ ...form, master_name: e.target.value })} placeholder="VD: Nguyễn Văn A" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Số điện thoại" className="flex-1"><VCT_Input value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="090..." /></VCT_Field>
                        <VCT_Field label="Ngày thành lập" className="flex-1"><VCT_Input type="date" value={form.founded_date} onChange={(e: any) => setForm({ ...form, founded_date: e.target.value })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Địa chỉ tập luyện"><VCT_Input value={form.address} onChange={(e: any) => setForm({ ...form, address: e.target.value })} placeholder="Địa chỉ chi tiết..." /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa CLB "${deleteTarget?.name}"? Hệ thống khuyến khích đóng cửa (giải thể) thay vì xóa hoàn toàn.`}
                confirmLabel="Xóa vĩnh viễn" />
        </VCT_PageContainer>
    )
}
