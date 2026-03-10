'use client'

import * as React from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_AvatarLetter, VCT_EmptyState, VCT_FilterChips,
    VCT_BulkActionsBar
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
type OrganizationType = 'national' | 'regional' | 'provincial' | 'district'

interface Organization {
    id: string
    name: string
    code: string
    type: OrganizationType
    headquarter: string
    established_year: number
    president: string
    phone: string
    email: string
    status: 'active' | 'inactive' | 'pending'
    member_clubs_count: number
    total_members: number
}

const TYPE_MAP: Record<OrganizationType, string> = {
    national: 'Liên đoàn Quốc gia',
    regional: 'Liên đoàn Khu vực',
    provincial: 'Hội/Liên đoàn Tỉnh',
    district: 'Hội/Liên đoàn Quận/Huyện'
}

const STATUS_MAP: Record<string, { label: string; type: any; color: string }> = {
    active: { label: 'Đang hoạt động', type: 'success', color: '#10b981' },
    inactive: { label: 'Tạm ngưng', type: 'neutral', color: '#94a3b8' },
    pending: { label: 'Chờ duyệt', type: 'warning', color: '#f59e0b' }
}

const MOCK_ORGANIZATIONS: Organization[] = [
    {
        id: 'ORG-001', name: 'Liên đoàn Võ thuật Á Châu', code: 'VAF', type: 'regional',
        headquarter: 'Hồ Chí Minh', established_year: 2010, president: 'Nguyễn Văn A',
        phone: '0901234567', email: 'vaf@example.com', status: 'active',
        member_clubs_count: 150, total_members: 12000
    },
    {
        id: 'ORG-002', name: 'Liên đoàn VCT Việt Nam', code: 'VOC', type: 'national',
        headquarter: 'Hà Nội', established_year: 1991, president: 'Trần Thị B',
        phone: '0902345678', email: 'voc@example.com', status: 'active',
        member_clubs_count: 320, total_members: 45000
    },
    {
        id: 'ORG-003', name: 'Hội VCT Tỉnh Bình Định', code: 'BDC', type: 'provincial',
        headquarter: 'Quy Nhơn', established_year: 1985, president: 'Lê Văn C',
        phone: '0903456789', email: 'bdc@example.com', status: 'active',
        member_clubs_count: 45, total_members: 5600
    },
    {
        id: 'ORG-004', name: 'Hội VCT Quận 7', code: 'Q7C', type: 'district',
        headquarter: 'Quận 7, TP.HCM', established_year: 2015, president: 'Hoàng Văn D',
        phone: '0904567890', email: 'q7c@example.com', status: 'pending',
        member_clubs_count: 8, total_members: 450
    }
]

const BLANK_FORM: Partial<Organization> = {
    name: '', code: '', type: 'provincial', headquarter: '', president: '', phone: '', email: ''
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_organizations = () => {
    const [orgs, setOrgs] = useState<Organization[]>(MOCK_ORGANIZATIONS)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [typeFilter, setTypeFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Organization | null>(null)
    const [form, setForm] = useState<any>({ ...BLANK_FORM })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    // ── Computed ──
    const filtered = useMemo(() => {
        let data = orgs
        if (statusFilter) data = data.filter(t => t.status === statusFilter)
        if (typeFilter) data = data.filter(t => t.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(t => t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.president.toLowerCase().includes(q))
        }
        return data
    }, [orgs, statusFilter, typeFilter, search])

    const totalClubs = orgs.reduce((s, o) => s + o.member_clubs_count, 0)
    const totalMembers = orgs.reduce((s, o) => s + o.total_members, 0)

    // ── Filters ──
    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (typeFilter) f.push({ key: 'type', label: 'Cấp độ', value: TYPE_MAP[typeFilter as OrganizationType] || typeFilter })
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
        setEditingOrg(null)
        setForm({ ...BLANK_FORM, established_year: new Date().getFullYear() })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((org: Organization) => {
        setEditingOrg(org)
        setForm({ ...org })
        setShowModal(true)
    }, [])

    const handleSave = () => {
        if (!form.name || !form.code) { showToast('Vui lòng nhập tên và mã tổ chức', 'error'); return }
        if (editingOrg) {
            setOrgs(prev => prev.map(t => t.id === editingOrg.id ? { ...t, ...form } : t))
            showToast(`Đã cập nhật "${form.name}"`)
        } else {
            const newOrg: Organization = {
                ...form, id: `ORG-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                status: 'pending', member_clubs_count: 0, total_members: 0,
            }
            setOrgs(prev => [newOrg, ...prev])
            showToast(`Đã thêm tổ chức "${form.name}"`)
        }
        setShowModal(false)
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setOrgs(prev => prev.filter(t => t.id !== deleteTarget.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
        showToast(`Đã xóa "${deleteTarget.name}"`, 'success')
        setDeleteTarget(null)
    }

    // Bulk actions
    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)))

    const bulkActions = useMemo(() => [
        {
            label: 'Duyệt hoạt động',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => {
                setOrgs(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'active' } : t))
                showToast(`Đã duyệt ${selectedIds.size} tổ chức`)
                setSelectedIds(new Set())
            },
            variant: 'primary'
        },
        {
            label: 'Tạm ngưng',
            icon: <VCT_Icons.x size={14} />,
            onClick: () => {
                setOrgs(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'inactive' } : t))
                showToast(`Đã tạm ngưng ${selectedIds.size} tổ chức`, 'warning')
                setSelectedIds(new Set())
            },
            variant: 'secondary'
        }
    ], [selectedIds, showToast])

    const columns = [
        {
            key: 'checkbox', label: <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />, align: 'center' as const,
            render: (r: Organization) => <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: any) => e.stopPropagation()} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />
        },
        {
            key: 'name', label: 'Tổ chức', render: (r: Organization) => (
                <VCT_Stack direction="row" gap={10} align="center">
                    <VCT_AvatarLetter name={r.name} size={36} />
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--vct-text-primary)' }}>{r.name}</div>
                        <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>{r.code} • {TYPE_MAP[r.type]}</div>
                    </div>
                </VCT_Stack>
            )
        },
        {
            key: 'president', label: 'Liên hệ', render: (r: Organization) => (
                <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{r.president}</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{r.phone}</div>
                </div>
            )
        },
        {
            key: 'stats', label: 'Quy mô', align: 'center' as const, render: (r: Organization) => (
                <div className="text-center">
                    <div style={{ fontWeight: 800, color: 'var(--vct-accent-cyan)', fontSize: 13 }}>{r.member_clubs_count} CLB</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{r.total_members.toLocaleString('vi-VN')} hội viên</div>
                </div>
            )
        },
        {
            key: 'status', label: 'Trạng thái', align: 'center' as const, render: (r: Organization) => {
                const st = STATUS_MAP[r.status]
                if (!st) return <VCT_Badge text={r.status} type={'neutral'} />
                return <VCT_Badge text={st.label} type={st.type} />
            }
        },
        {
            key: 'actions', label: '', align: 'right' as const, render: (r: Organization) => (
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
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Liên đoàn & Hội nhóm</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý cơ cấu tổ chức, liên đoàn các cấp và mạng lưới hội viên.</p>
            </div>

            {/* ── KPI ROW ── */}
            <VCT_StatRow items={[
                { label: 'Tổng tổ chức', value: orgs.length, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
                { label: 'CLB trực thuộc', value: totalClubs, icon: <VCT_Icons.Building2 size={18} />, color: '#f59e0b' },
                { label: 'Hội viên', value: totalMembers.toLocaleString('vi-VN'), icon: <VCT_Icons.Users size={18} />, color: '#10b981' },
                { label: 'Đang hoạt động', value: orgs.filter(o => o.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            {/* ── FILTER CHIPS ── */}
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setStatusFilter(null); setTypeFilter(null); setSearch(''); }} />

            {/* ── TOOLBAR ── */}
            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm tổ chức, mã, người liên hệ..." />
                    </div>
                    <select
                        value={typeFilter || ''}
                        onChange={(e) => setTypeFilter(e.target.value || null)}
                        className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] text-[var(--vct-text-primary)] text-sm rounded-lg px-3 py-2 outline-none focus:border-[var(--vct-accent-cyan)] transition-colors"
                    >
                        <option value="">Tất cả cấp độ</option>
                        {Object.entries(TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Stack direction="row" gap={12} align="center">
                    <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary" onClick={() => showToast('Đang xuất Excel...', 'info')}>Xuất file</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm Tổ Chức</VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {/* ── TABLE ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có tổ chức nào" description={search || statusFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Hệ thống chưa có tổ chức nào được ghi nhận. Bấm "Thêm Tổ Chức" để bắt đầu.'} actionLabel="Thêm Tổ Chức" onAction={openAddModal} icon="🏢" />
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
                            {filtered.map((org, idx) => {
                                const stColor = STATUS_MAP[org.status]?.color || '#94a3b8'
                                return (
                                    <tr key={org.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', background: selectedIds.has(org.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', borderLeft: `3px solid ${stColor}` }}>
                                        {columns.map((col, ci) => (
                                            <td key={ci} style={{ padding: '14px 16px', fontSize: 13, textAlign: (col.align || 'left') as any }}>
                                                {col.render ? col.render(org) : (org as any)[col.key]}
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
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingOrg ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'} width="680px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingOrg ? 'Cập nhật' : 'Lưu & Khởi tạo'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên tổ chức / Liên đoàn *"><VCT_Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="VD: Liên đoàn Võ thuật cổ truyền Việt Nam" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Mã định danh *" className="flex-1"><VCT_Input value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} placeholder="VD: VOC" /></VCT_Field>
                        <VCT_Field label="Cấp độ quản lý" className="flex-1"><VCT_Select options={Object.entries(TYPE_MAP).map(([k, v]) => ({ value: k, label: v }))} value={form.type} onChange={(v: any) => setForm({ ...form, type: v })} /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Năm thành lập" className="flex-1"><VCT_Input type="number" value={form.established_year} onChange={(e: any) => setForm({ ...form, established_year: parseInt(e.target.value) || 0 })} placeholder="YYYY" /></VCT_Field>
                        <VCT_Field label="Trụ sở (Tỉnh/TP)" className="flex-1"><VCT_Input value={form.headquarter} onChange={(e: any) => setForm({ ...form, headquarter: e.target.value })} placeholder="VD: Hà Nội" /></VCT_Field>
                    </VCT_Stack>

                    <div className="h-px w-full bg-[var(--vct-border-subtle)] my-2"></div>
                    <div className="text-sm font-bold opacity-70">Người đại diện / Ban chấp hành</div>

                    <VCT_Field label="Họ tên người đại diện"><VCT_Input value={form.president} onChange={(e: any) => setForm({ ...form, president: e.target.value })} placeholder="Chủ tịch / Trưởng ban" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Số điện thoại" className="flex-1"><VCT_Input value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="0901 234 567" /></VCT_Field>
                        <VCT_Field label="Email liên hệ" className="flex-1"><VCT_Input value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="contact@example.com" /></VCT_Field>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa tổ chức "${deleteTarget?.name}"? Hệ thống sẽ ẩn tổ chức này thay vì xóa hoàn toàn để giữ toàn vẹn dữ liệu lịch sử.`}
                confirmLabel="Xóa" />
        </VCT_PageContainer>
    )
}
