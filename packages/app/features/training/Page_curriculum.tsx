'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_EmptyState, VCT_FilterChips,
    VCT_BulkActionsBar, VCT_Tabs
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════

type BeltLevel = 'trang' | 'xanh' | 'vang' | 'do' | 'nau' | 'den' | 'den_1' | 'den_2'

interface Curriculum {
    id: string
    title: string
    code: string
    belt_level: BeltLevel
    estimated_months: number
    forms: string[] // Danh sách các bài quyền
    techniques_count: number
    status: 'draft' | 'published' | 'archived'
    last_updated: string
}

const BELT_MAP: Record<BeltLevel, { label: string; color: string; bg: string }> = {
    trang: { label: 'Đai Trắng (Nhập môn)', color: '#1e293b', bg: '#f1f5f9' },
    xanh: { label: 'Đai Xanh', color: '#fff', bg: '#3b82f6' },
    vang: { label: 'Đai Vàng', color: '#1e293b', bg: '#eab308' },
    do: { label: 'Đai Đỏ', color: '#fff', bg: '#ef4444' },
    nau: { label: 'Đai Nâu', color: '#fff', bg: '#78350f' },
    den: { label: 'Đai Đen', color: '#fff', bg: '#000000' },
    den_1: { label: 'Đai Đen 1 Đẳng', color: '#fff', bg: '#000000' },
    den_2: { label: 'Đai Đen 2 Đẳng', color: '#fff', bg: '#000000' },
}

const STATUS_MAP: Record<string, { label: string; type: any; color: string }> = {
    published: { label: 'Ban hành', type: 'success', color: '#10b981' },
    draft: { label: 'Bản nháp', type: 'warning', color: '#f59e0b' },
    archived: { label: 'Lưu trữ', type: 'neutral', color: '#94a3b8' }
}

const MOCK_CURRICULUMS: Curriculum[] = [
    {
        id: 'CUR-001', title: 'Căn bản Công (Cấp 1)', code: 'CB-1', belt_level: 'trang',
        estimated_months: 3, forms: ['Căn bản công tay không'], techniques_count: 21,
        status: 'published', last_updated: '2023-01-15'
    },
    {
        id: 'CUR-002', title: 'Danh sư môn đồ (Cấp 2)', code: 'CB-2', belt_level: 'xanh',
        estimated_months: 6, forms: ['Thập thế bát thức', 'Tứ trụ quyền'], techniques_count: 45,
        status: 'published', last_updated: '2023-02-10'
    },
    {
        id: 'CUR-003', title: 'Trung cấp (Cấp 3)', code: 'TC-1', belt_level: 'vang',
        estimated_months: 6, forms: ['Lão Mai', 'Ngọc Trản Ngân Đài'], techniques_count: 55,
        status: 'published', last_updated: '2023-05-20'
    },
    {
        id: 'CUR-004', title: 'Trung cấp (Cấp 4)', code: 'TC-2', belt_level: 'do',
        estimated_months: 12, forms: ['Thái Sơn', 'Bát Quái'], techniques_count: 70,
        status: 'draft', last_updated: '2024-01-05'
    }
]

const BLANK_FORM: Partial<Curriculum> = {
    title: '', code: '', belt_level: 'trang', estimated_months: 3, forms: [], techniques_count: 0
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_curriculum = () => {
    const [civs, setCivs] = useState<Curriculum[]>(MOCK_CURRICULUMS)
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editingCiv, setEditingCiv] = useState<Curriculum | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Curriculum | null>(null)
    const [form, setForm] = useState<any>({ ...BLANK_FORM, formInput: '' })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    // ── Computed ──
    const filtered = useMemo(() => {
        let data = civs
        if (statusFilter) data = data.filter(t => t.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
        }
        return data.sort((a, b) => {
            const belts = Object.keys(BELT_MAP)
            return belts.indexOf(a.belt_level) - belts.indexOf(b.belt_level)
        })
    }, [civs, statusFilter, search])

    const totalTechniques = civs.reduce((s, c) => s + c.techniques_count, 0)
    const totalForms = civs.reduce((s, c) => s + c.forms.length, 0)

    // ── Filters ──
    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [statusFilter, search])

    const removeFilter = (key: string) => {
        if (key === 'status') setStatusFilter(null)
        if (key === 'search') setSearch('')
    }

    // ── CRUD Operations ──
    const openAddModal = useCallback(() => {
        setEditingCiv(null)
        setForm({ ...BLANK_FORM, formInput: '' })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((civ: Curriculum) => {
        setEditingCiv(civ)
        setForm({ ...civ, formInput: civ.forms.join(', ') })
        setShowModal(true)
    }, [])

    const handleSave = () => {
        if (!form.title || !form.code) { showToast('Vui lòng nhập tên và mã giáo trình', 'error'); return }

        const formList = form.formInput ? form.formInput.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        const dataToSave = { ...form, forms: formList }
        delete dataToSave.formInput

        if (editingCiv) {
            setCivs(prev => prev.map(t => t.id === editingCiv.id ? { ...t, ...dataToSave, last_updated: new Date().toISOString().split('T')[0] } : t))
            showToast(`Đã cập nhật "${form.title}"`)
        } else {
            const newCiv: Curriculum = {
                ...dataToSave, id: `CUR-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                status: 'draft', last_updated: new Date().toISOString().split('T')[0]
            }
            setCivs(prev => [newCiv, ...prev])
            showToast(`Đã thêm giáo trình "${form.title}"`)
        }
        setShowModal(false)
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setCivs(prev => prev.filter(t => t.id !== deleteTarget.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
        showToast(`Đã xóa "${deleteTarget.title}"`, 'success')
        setDeleteTarget(null)
    }

    // Bulk actions
    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)))

    const bulkActions = useMemo(() => [
        {
            label: 'Ban hành',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => {
                setCivs(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, status: 'published' } : t))
                showToast(`Đã ban hành ${selectedIds.size} giáo trình`)
                setSelectedIds(new Set())
            },
            variant: 'primary'
        },
        {
            label: 'Xóa',
            icon: <VCT_Icons.Trash size={14} />,
            onClick: () => {
                setCivs(prev => prev.filter(t => !selectedIds.has(t.id)))
                showToast(`Đã xóa ${selectedIds.size} giáo trình`, 'error')
                setSelectedIds(new Set())
            },
            variant: 'danger'
        }
    ], [selectedIds, showToast])

    const columns = [
        {
            key: 'checkbox', label: <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />, align: 'center' as const,
            render: (r: Curriculum) => <input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: any) => e.stopPropagation()} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />
        },
        {
            key: 'title', label: 'Tên Giáo Trình', render: (r: Curriculum) => (
                <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--vct-text-primary)' }}>{r.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.6, fontFamily: 'monospace' }}>{r.code}</div>
                </div>
            )
        },
        {
            key: 'belt_level', label: 'Phân cấp (Đai)', render: (r: Curriculum) => (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: BELT_MAP[r.belt_level].bg, color: BELT_MAP[r.belt_level].color,
                    border: r.belt_level === 'trang' ? '1px solid #cbd5e1' : 'none'
                }}>
                    {BELT_MAP[r.belt_level].label}
                </div>
            )
        },
        {
            key: 'estimated_months', label: 'Thời gian', align: 'center' as const, render: (r: Curriculum) => (
                <div style={{ fontSize: 13, fontWeight: 600 }}>{r.estimated_months} <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 400 }}>tháng</span></div>
            )
        },
        {
            key: 'content', label: 'Nội dung', render: (r: Curriculum) => (
                <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--vct-accent-cyan)' }}>{r.forms.length} bài quyền</div>
                    <div style={{ fontSize: 11, opacity: 0.6 }}>{r.techniques_count} kỹ thuật</div>
                </div>
            )
        },
        {
            key: 'status', label: 'Trạng thái', align: 'center' as const, render: (r: Curriculum) => {
                const st = STATUS_MAP[r.status]
                if (!st) return <VCT_Badge text={r.status} type="neutral" />
                return <VCT_Badge text={st.label} type={st.type} />
            }
        },
        {
            key: 'actions', label: '', align: 'right' as const, render: (r: Curriculum) => (
                <VCT_Stack direction="row" gap={4} justify="flex-end">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: 4 }} aria-label={`Edit ${r.title}`}>
                        <VCT_Icons.Edit size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(r); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }} aria-label={`Delete ${r.title}`}>
                        <VCT_Icons.Trash size={16} />
                    </button>
                </VCT_Stack>
            )
        },
    ]

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Giáo trình & Bài quyền</h1>
                <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Xây dựng và quản lý chương trình huấn luyện, tiêu chuẩn chuyên môn các cấp.</p>
            </div>

            {/* ── KPI ROW ── */}
            <div className="vct-stagger mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <VCT_KpiCard label="Giáo trình hiện hành" value={civs.filter(c => c.status === 'published').length} icon={<VCT_Icons.Book size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Tổng Bài quyền" value={totalForms} icon={<VCT_Icons.Video size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Kỹ thuật cơ bản" value={totalTechniques} icon={<VCT_Icons.Activity size={24} />} color="#10b981" />
                <VCT_KpiCard label="Cấp đai quản lý" value={Object.keys(BELT_MAP).length} icon={<VCT_Icons.Award size={24} />} color="#8b5cf6" />
            </div>

            {/* ── FILTER CHIPS ── */}
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setStatusFilter(null); setSearch(''); }} />

            {/* ── TOOLBAR ── */}
            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm giáo trình, mã..." />
                    </div>
                </VCT_Stack>
                <VCT_Stack direction="row" gap={12} align="center">
                    <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary" onClick={() => showToast('Đang xuất Excel...', 'info')}>Xuất file</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm Giáo trình</VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {/* ── TABS ── */}
            <div className="mb-5">
                <VCT_Tabs
                    tabs={[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'published', label: 'Đã ban hành' },
                        { key: 'draft', label: 'Bản nháp' }
                    ]}
                    activeTab={statusFilter || 'all'}
                    onChange={(id) => setStatusFilter(id === 'all' ? null : id)}
                />
            </div>

            {/* ── TABLE ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có giáo trình nào" description={search || statusFilter ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.' : 'Chưa có dữ liệu. Bấm "Thêm Giáo trình" để bắt đầu.'} actionLabel="Thêm Giáo trình" onAction={openAddModal} icon="📖" />
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
                            {filtered.map((civ, idx) => {
                                const stColor = STATUS_MAP[civ.status]?.color || '#94a3b8'
                                return (
                                    <tr key={civ.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', background: selectedIds.has(civ.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', borderLeft: `3px solid ${stColor}` }}>
                                        {columns.map((col, ci) => (
                                            <td key={ci} style={{ padding: '14px 16px', fontSize: 13, textAlign: (col.align || 'left') as any }}>
                                                {col.render ? col.render(civ) : (civ as any)[col.key]}
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
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCiv ? 'Chỉnh sửa Giáo trình' : 'Soạn Giáo trình mới'} width="680px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingCiv ? 'Lưu cập nhật' : 'Khởi tạo'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên Giáo trình / Modules *"><VCT_Input value={form.title} onChange={(e: any) => setForm({ ...form, title: e.target.value })} placeholder="VD: Khởi quyền (Cấp 1)" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Mã định danh *" className="flex-1"><VCT_Input value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value })} placeholder="VD: KQ-1" /></VCT_Field>
                        <VCT_Field label="Áp dụng cho Cấp đai" className="flex-1"><VCT_Select options={Object.entries(BELT_MAP).map(([k, v]) => ({ value: k, label: v.label }))} value={form.belt_level} onChange={(v: any) => setForm({ ...form, belt_level: v })} /></VCT_Field>
                    </VCT_Stack>

                    <div className="h-px w-full bg-[var(--vct-border-subtle)] my-2"></div>
                    <div className="text-sm font-bold opacity-70">Nội dung chi tiết</div>

                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Thời gian đào tạo dự kiến (Tháng)" className="flex-1"><VCT_Input type="number" value={form.estimated_months} onChange={(e: any) => setForm({ ...form, estimated_months: parseInt(e.target.value) || 0 })} placeholder="Số tháng..." /></VCT_Field>
                        <VCT_Field label="Số lượng Kỹ thuật căn bản" className="flex-1"><VCT_Input type="number" value={form.techniques_count} onChange={(e: any) => setForm({ ...form, techniques_count: parseInt(e.target.value) || 0 })} placeholder="0" /></VCT_Field>
                    </VCT_Stack>

                    <VCT_Field label="Các bài Quyền yêu cầu (cách nhau dấu phẩy)">
                        <textarea
                            value={form.formInput}
                            onChange={(e: any) => setForm({ ...form, formInput: e.target.value })}
                            placeholder="VD: Căn bản công tay không, Thập thế bát thức..."
                            className="w-full bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] rounded-lg p-3 text-[var(--vct-text-primary)] text-sm outline-none focus:border-[var(--vct-accent-cyan)] transition-colors min-h-[80px] resize-y"
                        />
                    </VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa giáo trình "${deleteTarget?.title}"? Các CLB đang áp dụng giáo trình này sẽ bị ảnh hưởng.`}
                confirmLabel="Khẳng định xóa" />
        </div>
    )
}
