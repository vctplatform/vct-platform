'use client'

import * as React from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_AvatarLetter, VCT_EmptyState, VCT_FilterChips,
    VCT_BulkActionsBar, VCT_PageContainer, VCT_PageHeader, VCT_PageToolbar,
    VCT_StatRow
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import {
    useClubs,
    useCreateClub,
    useUpdateClub,
    useDeleteClub,
} from '../hooks/useCommunityAPI'

// ════════════════════════════════════════
// TYPES
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

const STATUS_MAP: Record<string, { label: string; type: any; borderClass: string }> = {
    active: { label: 'Đang hoạt động', type: 'success', borderClass: 'border-(--vct-success)' },
    suspended: { label: 'Tạm đình chỉ', type: 'warning', borderClass: 'border-(--vct-warning)' },
    closed: { label: 'Đã đóng cửa', type: 'error', borderClass: 'border-(--vct-danger)' }
}

const MOCK_ORGS = [
    { id: 'ORG-001', name: 'Liên đoàn VCT Việt Nam' },
    { id: 'ORG-002', name: 'Hội VCT Tỉnh Bình Định' },
    { id: 'ORG-003', name: 'Hội VCT Quận 7' },
]

const toLocalClub = (c: any): Club => ({
    id: c.id,
    name: c.name || '',
    code: c.code || '',
    org_id: c.org_id || '',
    type: (c.type || 'clb') as ClubType,
    founded_date: c.founded_date || '',
    master_name: c.master_name || c.leader_name || '',
    phone: c.phone || '',
    address: c.address || '',
    status: (c.status || 'active') as Club['status'],
    total_members: c.total_members || c.member_count || 0,
    active_classes: c.active_classes || 0,
})

const BLANK_FORM: Partial<Club> = {
    name: '', code: '', org_id: '', type: 'clb', founded_date: '', master_name: '', phone: '', address: ''
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_clubs = () => {
    // ── Real API data ──
    const { data: apiClubs } = useClubs()
    const createClub = useCreateClub()
    const updateClub = useUpdateClub()
    const deleteClub = useDeleteClub()
    const [clubs, setClubs] = useState<Club[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (!apiClubs) return
        setClubs(apiClubs.map(toLocalClub))
    }, [apiClubs])
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editingClub, setEditingClub] = useState<Club | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Club | null>(null)
    const [form, setForm] = useState<any>({ ...BLANK_FORM })
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

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
        setForm({ ...BLANK_FORM, founded_date: new Date().toISOString().split('T')[0]!, org_id: MOCK_ORGS[0]?.id || '' })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((club: Club) => {
        setEditingClub(club)
        setForm({ ...club })
        setShowModal(true)
    }, [])

    const handleSave = async () => {
        if (!form.name || !form.code) {
            showToast('Vui lòng nhập tên và mã CLB', 'error')
            return
        }
        setIsSaving(true)
        try {
            if (editingClub) {
                const updated = await updateClub(editingClub.id, {
                    name: form.name,
                    address: form.address,
                    phone: form.phone,
                    master_name: form.master_name,
                    status: form.status,
                })
                const next = {
                    ...editingClub,
                    ...form,
                    ...toLocalClub(updated),
                }
                setClubs((prev) =>
                    prev.map((club) => (club.id === editingClub.id ? next : club))
                )
                showToast(`Đã cập nhật "${form.name}"`)
            } else {
                const created = await createClub({
                    name: form.name,
                    address: form.address,
                    phone: form.phone,
                    master_name: form.master_name,
                    status: 'active',
                })
                const next: Club = {
                    ...toLocalClub(created),
                    code: form.code || created.code || '',
                    type: (form.type || 'clb') as ClubType,
                    org_id: form.org_id || '',
                    founded_date: form.founded_date || '',
                    active_classes: 0,
                    total_members: created.total_members || 0,
                }
                setClubs((prev) => [next, ...prev])
                showToast(`Đã thêm CLB "${form.name}"`)
            }
            setShowModal(false)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể lưu dữ liệu'
            showToast(message, 'error')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            await deleteClub(deleteTarget.id)
            setClubs(prev => prev.filter(t => t.id !== deleteTarget.id))
            setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
            showToast(`Đã xóa "${deleteTarget.name}"`, 'success')
            setDeleteTarget(null)
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Không thể xóa dữ liệu'
            showToast(message, 'error')
        } finally {
            setIsDeleting(false)
        }
    }

    // Bulk actions
    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)))

    const bulkActions = useMemo(() => [
        {
            label: 'Đóng cửa (Giải thể)',
            icon: <VCT_Icons.x size={14} />,
            onClick: async () => {
                try {
                    await Promise.all(
                        Array.from(selectedIds).map((id) =>
                            updateClub(id, { status: 'closed' })
                        )
                    )
                    setClubs(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'closed' } : t))
                    showToast(`Đã đóng cửa ${selectedIds.size} CLB`, 'error')
                } catch (error) {
                    const message = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái'
                    showToast(message, 'error')
                }
                setSelectedIds(new Set())
            },
            variant: 'danger'
        }
    ], [selectedIds, showToast, updateClub])

    const columns = [
        {
            key: 'checkbox', label: <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} aria-label="Chọn tất cả" title="Chọn tất cả" className="vct-checkbox" />, align: 'center' as const,
            render: (r: Club) => <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: any) => e.stopPropagation()} aria-label={`Chọn ${r.name}`} title={`Chọn ${r.name}`} className="vct-checkbox" />
        },
        {
            key: 'name', label: 'Câu lạc bộ/Võ đường', render: (r: Club) => (
                <VCT_Stack direction="row" gap={10} align="center">
                    <VCT_AvatarLetter name={r.name} size={36} />
                    <div>
                        <div className="vct-cell-primary">{r.name}</div>
                        <div className="vct-cell-secondary">{r.code} • {MOCK_ORGS.find(o => o.id === r.org_id)?.name || 'Chưa trực thuộc'}</div>
                    </div>
                </VCT_Stack>
            )
        },
        {
            key: 'type', label: 'Mô hình', render: (r: Club) => (
                <div className="vct-cell-accent">{TYPE_MAP[r.type]}</div>
            )
        },
        {
            key: 'master_name', label: 'Chủ nhiệm / Võ sư', render: (r: Club) => (
                <div>
                    <div className="vct-cell-semibold">{r.master_name}</div>
                    <div className="vct-cell-secondary">{r.phone}</div>
                </div>
            )
        },
        {
            key: 'stats', label: 'Quy mô', align: 'center' as const, render: (r: Club) => (
                <div className="text-center">
                    <div className="vct-cell-stat">{r.active_classes} lớp</div>
                    <div className="vct-cell-secondary">{r.total_members.toLocaleString('vi-VN')} võ sinh</div>
                </div>
            )
        },
        {
            key: 'status', label: 'Trạng thái', align: 'center' as const, render: (r: Club) => {
                const st = STATUS_MAP[r.status] || { label: 'Không rõ', type: 'info', color: 'var(--vct-text-tertiary)' }
                return <VCT_Badge text={st.label} type={st.type} />
            }
        },
        {
            key: 'actions', label: '', align: 'right' as const, render: (r: Club) => (
                <VCT_Stack direction="row" gap={4} justify="flex-end">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} className="vct-icon-btn" aria-label={`Edit ${r.name}`}>
                        <VCT_Icons.Edit size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} className="vct-icon-btn-danger" aria-label={`Delete ${r.name}`}>
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
                { label: 'CLB/Võ đường', value: clubs.length, icon: <VCT_Icons.Building2 size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Lớp đang mở', value: totalClasses, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-warning)' },
                { label: 'Võ sinh', value: totalMembers.toLocaleString('vi-VN'), icon: <VCT_Icons.User size={18} />, color: 'var(--vct-success)' },
                { label: 'Đình chỉ/Đóng', value: clubs.filter(c => c.status !== 'active').length, icon: <VCT_Icons.Alert size={18} />, color: 'var(--vct-danger)' },
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
                    title="Lọc theo mô hình"
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
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {columns.map((col, i) => (
                                    <th key={i} className={`vct-th ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((club, idx) => {
                                const borderClass = STATUS_MAP[club.status]?.borderClass || 'border-(--vct-text-tertiary)'
                                return (
                                    <tr key={club.id} className={`border-b border-(--vct-border-subtle) border-l-[3px] ${borderClass} ${selectedIds.has(club.id) ? 'bg-[rgba(34,211,238,0.05)]' : idx % 2 === 0 ? 'bg-transparent' : 'bg-[rgba(128,128,128,0.02)]'}`}>
                                        {columns.map((col, ci) => (
                                            <td key={ci} className={`vct-td ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}>
                                                {col.render ? col.render(club) : (club as unknown as Record<string, React.ReactNode>)[col.key]}
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
                    <VCT_Button loading={isSaving} onClick={() => void handleSave()}>
                        {editingClub ? 'Cập nhật' : 'Khởi tạo CLB'}
                    </VCT_Button>
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

                    <div className="h-px w-full bg-(--vct-border-subtle) my-2"></div>
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
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => void handleDelete()} loading={isDeleting}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa CLB "${deleteTarget?.name}"? Hệ thống khuyến khích đóng cửa (giải thể) thay vì xóa hoàn toàn.`}
                confirmLabel="Xóa vĩnh viễn" />
        </VCT_PageContainer>
    )
}
