'use client'

import * as React from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { z } from 'zod'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_EmptyState, VCT_FilterChips,
    VCT_BulkActionsBar, VCT_Tabs
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { 
    useCurriculums, 
    useCreateCurriculum, 
    useUpdateCurriculum, 
    useDeleteCurriculum,
    type Curriculum 
} from '../hooks/useTrainingAPI'
import { useAnalytics } from '../mobile/useAnalytics'

// ════════════════════════════════════════
// TYPES, SCHEMAS & CONSTANTS
// ════════════════════════════════════════

type BeltLevel = 'trang' | 'xanh' | 'vang' | 'do' | 'nau' | 'den' | 'den_1' | 'den_2'

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

const STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'neutral'; color: string }> = {
    published: { label: 'Ban hành', type: 'success', color: '#10b981' },
    draft: { label: 'Bản nháp', type: 'warning', color: '#f59e0b' },
    archived: { label: 'Lưu trữ', type: 'neutral', color: '#94a3b8' }
}

const BLANK_FORM: Partial<Curriculum> = {
    title: '', code: '', belt_level: 'trang', estimated_months: 3, forms: [], techniques_count: 0
}

// Zod Validation Schema
const CurriculumSchema = z.object({
    title: z.string().min(1, 'Vui lòng nhập tên giáo trình / modules'),
    code: z.string().min(1, 'Vui lòng nhập mã định danh'),
    belt_level: z.enum(['trang', 'xanh', 'vang', 'do', 'nau', 'den', 'den_1', 'den_2']),
    estimated_months: z.number().min(1, 'Thời gian đào tạo nhỏ nhất là 1 tháng'),
    techniques_count: z.number().min(0, 'Số lượng kỹ thuật căn bản không được âm'),
})

// Custom Hook: Debounce
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])
    return debouncedValue
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_curriculum = () => {
    // ── Analytics ──
    const analytics = useAnalytics('CurriculumManager')

    // ── API & Data ──
    const { data: apiCurriculums, refetch: refetchCurriculums } = useCurriculums()
    const civs = useMemo(() => apiCurriculums || [], [apiCurriculums])
    
    // Mutations
    const { mutate: createApiCurriculum, isLoading: isCreating } = useCreateCurriculum()
    const [updateId, setUpdateId] = useState<string>('')
    const { mutate: updateApiCurriculum, isLoading: isUpdating } = useUpdateCurriculum(updateId)
    const [deleteId, setDeleteId] = useState<string>('')
    const { mutate: deleteApiCurriculum, isLoading: isDeleting } = useDeleteCurriculum(deleteId)

    // ── Local State ──
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    
    // UI State
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editingCiv, setEditingCiv] = useState<Curriculum | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Curriculum | null>(null)
    const [form, setForm] = useState<Partial<Curriculum> & { formInput: string }>({ ...BLANK_FORM, formInput: '' })
    const [formErrors, setFormErrors] = useState<Record<string, string>>({})

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    // ── Computed ──
    const filtered = useMemo(() => {
        let data = civs
        if (statusFilter) data = data.filter(t => t.status === statusFilter)
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            data = data.filter(t => t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q))
        }
        return data.sort((a, b) => {
            const belts = Object.keys(BELT_MAP)
            return belts.indexOf(a.belt_level) - belts.indexOf(b.belt_level)
        })
    }, [civs, statusFilter, debouncedSearch])

    const totalTechniques = civs.reduce((s, c) => s + c.techniques_count, 0)
    const totalForms = civs.reduce((s, c) => s + c.forms.length, 0)

    // ── Filters ──
    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (debouncedSearch) f.push({ key: 'search', label: 'Tìm kiếm', value: debouncedSearch })
        return f
    }, [statusFilter, debouncedSearch])

    const removeFilter = (key: string) => {
        if (key === 'status') setStatusFilter(null)
        if (key === 'search') setSearch('')
    }

    // ── CRUD Operations ──
    const openAddModal = useCallback(() => {
        setEditingCiv(null)
        setUpdateId('')
        setForm({ ...BLANK_FORM, formInput: '' })
        setFormErrors({})
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((civ: Curriculum) => {
        setEditingCiv(civ)
        setUpdateId(civ.id)
        setForm({ ...civ, formInput: (civ.forms || []).join(', ') })
        setFormErrors({})
        setShowModal(true)
    }, [])

    const handleSave = async () => {
        setFormErrors({})
        
        // Zod validation
        const validationResult = CurriculumSchema.safeParse(form)
        if (!validationResult.success) {
            const errors: Record<string, string> = {}
            validationResult.error.issues.forEach(issue => {
                const path = issue.path[0] as string
                errors[path] = issue.message
            });
            setFormErrors(errors)
            showToast('Vui lòng kiểm tra lại thông tin biểu mẫu', 'error')
            return
        }

        const { formInput: _formInput, ...dataToSave } = form
        const formList = _formInput ? _formInput.split(',').map((s: string) => s.trim()).filter(Boolean) : []
        const saveCiv = { ...dataToSave, forms: formList }

        try {
            if (editingCiv) {
                await updateApiCurriculum(saveCiv)
                showToast(`Đã cập nhật "${form.title}"`)
                analytics.trackAction('curriculum_updated', { id: editingCiv.id })
            } else {
                await createApiCurriculum({ ...saveCiv, status: 'draft' })
                showToast(`Đã thêm giáo trình "${form.title}"`)
                analytics.trackAction('curriculum_created', { belt: saveCiv.belt_level || '' })
            }
            refetchCurriculums()
            setShowModal(false)
        } catch (error) {
            showToast('Đã có lỗi xảy ra khi lưu trữ dữ liệu.', 'error')
            analytics.trackError('curriculum_save_failed', String(error))
        }
    }

    const handleDeleteTarget = (civ: Curriculum) => {
        setDeleteTarget(civ)
        setDeleteId(civ.id)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        
        try {
            await deleteApiCurriculum(deleteId as any) // ignore typing void input
            showToast(`Đã xóa "${deleteTarget.title}"`, 'success')
            analytics.trackAction('curriculum_deleted', { id: deleteTarget.id })
            
            setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
            refetchCurriculums()
        } catch (error) {
            showToast('Xóa giáo trình thất bại.', 'error')
            analytics.trackError('curriculum_delete_failed', String(error))
        } finally {
            setDeleteTarget(null)
        }
    }

    // Bulk actions
    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(t => t.id)))

    const bulkActions = useMemo(() => [
        {
            label: 'Ban hành',
            icon: <VCT_Icons.Check size={14} />,
            onClick: async () => {
                // In a real app we would use a bulkUpdate hook or loop updates.
                showToast(`Tính năng ban hành hàng loạt đang phát triển.`)
                analytics.trackAction('bulk_action_published', { count: selectedIds.size })
                setSelectedIds(new Set())
            },
            variant: 'primary'
        },
        {
            label: 'Xóa',
            icon: <VCT_Icons.Trash size={14} />,
            onClick: () => {
                showToast(`Tính năng xóa hàng loạt đang phát triển.`, 'warning')
                analytics.trackAction('bulk_action_deleted', { count: selectedIds.size })
                setSelectedIds(new Set())
            },
            variant: 'danger'
        }
    ], [selectedIds, showToast, analytics])

    const columns = [
        {
            key: 'checkbox', label: <input type="checkbox" aria-label="Chọn tất cả giáo trình" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} {...{ style: { width: 16, height: 16, accentColor: '#22d3ee' } }} />, align: 'center' as const,
            render: (r: Curriculum) => <input type="checkbox" aria-label={`Chọn giáo trình ${r.title}`} checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={(e: React.MouseEvent) => e.stopPropagation()} {...{ style: { width: 16, height: 16, accentColor: '#22d3ee' } }} />
        },
        {
            key: 'title', label: 'Tên Giáo Trình', render: (r: Curriculum) => (
                <div>
                    <div {...{ style: { fontWeight: 700, fontSize: 13, color: 'var(--vct-text-primary)' } }}>{r.title}</div>
                    <div {...{ style: { fontSize: 11, opacity: 0.6, fontFamily: 'monospace' } }}>{r.code}</div>
                </div>
            )
        },
        {
            key: 'belt_level', label: 'Phân cấp (Đai)', render: (r: Curriculum) => (
                <div {...{ style: {
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                    background: BELT_MAP[r.belt_level as BeltLevel]?.bg || '#ccc', 
                    color: BELT_MAP[r.belt_level as BeltLevel]?.color || '#000',
                    border: r.belt_level === 'trang' ? '1px solid #cbd5e1' : 'none'
                } }}>
                    {BELT_MAP[r.belt_level as BeltLevel]?.label || r.belt_level}
                </div>
            )
        },
        {
            key: 'estimated_months', label: 'Thời gian', align: 'center' as const, render: (r: Curriculum) => (
                <div {...{ style: { fontSize: 13, fontWeight: 600 } }}>{r.estimated_months} <span {...{ style: { fontSize: 11, opacity: 0.6, fontWeight: 400 } }}>tháng</span></div>
            )
        },
        {
            key: 'content', label: 'Nội dung', render: (r: Curriculum) => (
                <div>
                    <div {...{ style: { fontSize: 13, fontWeight: 600, color: 'var(--vct-accent-cyan)' } }}>{(r.forms || []).length} bài quyền</div>
                    <div {...{ style: { fontSize: 11, opacity: 0.6 } }}>{r.techniques_count} kỹ thuật</div>
                </div>
            )
        },
        {
            key: 'status', label: 'Trạng thái', align: 'center' as const, render: (r: Curriculum) => {
                const st = STATUS_MAP[r.status]
                if (!st) return <VCT_Badge text={r.status} type="neutral" />
                return <VCT_Badge text={st.label} type={st.type as any} />
            }
        },
        {
            key: 'actions', label: '', align: 'right' as const, render: (r: Curriculum) => (
                <VCT_Stack direction="row" gap={4} justify="flex-end" aria-label="Hành động">
                    <button onClick={(e) => { e.stopPropagation(); openEditModal(r); }} {...{ style: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: 4 } }} aria-label={`Sửa giáo trình ${r.title}`}>
                        <VCT_Icons.Edit size={16} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTarget(r); }} {...{ style: { background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 } }} aria-label={`Xóa giáo trình ${r.title}`}>
                        <VCT_Icons.Trash size={16} />
                    </button>
                </VCT_Stack>
            )
        },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type as any} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <VCT_PageHero
                icon={<VCT_Icons.Book size={24} />}
                title="Giáo trình & Bài quyền"
                subtitle="Xây dựng và quản lý chương trình huấn luyện, tiêu chuẩn chuyên môn các cấp."
                gradientFrom="rgba(14, 165, 233, 0.08)"
                gradientTo="rgba(245, 158, 11, 0.06)"
            />

            <VCT_StatRow items={[
                { label: 'Hiện hành', value: civs.filter(c => c.status === 'published').length, icon: <VCT_Icons.Book size={18} />, color: '#0ea5e9' },
                { label: 'Bài quyền', value: totalForms, icon: <VCT_Icons.Video size={18} />, color: '#f59e0b' },
                { label: 'Kỹ thuật', value: totalTechniques, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Cấp đai', value: Object.keys(BELT_MAP).length, icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            {/* ── FILTER CHIPS ── */}
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setStatusFilter(null); setSearch(''); }} />

            {/* ── TOOLBAR ── */}
            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]" role="search">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm giáo trình, mã..." />
                    </div>
                </VCT_Stack>
                <VCT_Stack direction="row" gap={12} align="center" role="toolbar" aria-label="Công cụ quản lý">
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
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)" role="region" aria-label="Danh sách giáo trình">
                    <table className="w-full border-collapse" aria-label="bảng dữ liệu giáo trình">
                        <thead>
                            <tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {columns.map((col, i) => (
                                    <th key={i} scope="col" {...{ style: { padding: '14px 16px', textAlign: (col.align || 'left') as React.CSSProperties['textAlign'], fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, position: 'sticky', top: 0, background: 'var(--vct-bg-card)', zIndex: 2 } }}>
                                        {col.label}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((civ, idx) => {
                                const stColor = STATUS_MAP[civ.status]?.color || '#94a3b8'
                                return (
                                    <tr key={civ.id} {...{ style: { borderBottom: '1px solid var(--vct-border-subtle)', background: selectedIds.has(civ.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)', borderLeft: `3px solid ${stColor}` } }}>
                                        {columns.map((col, ci) => (
                                            <td key={ci} {...{ style: { padding: '14px 16px', fontSize: 13, textAlign: (col.align || 'left') as React.CSSProperties['textAlign'] } }}>
                                                {col.render ? col.render(civ) : (civ as unknown as Record<string, React.ReactNode>)[col.key]}
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
                    <VCT_Button loading={isCreating || isUpdating} onClick={handleSave}>{editingCiv ? 'Lưu cập nhật' : 'Khởi tạo'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên Giáo trình / Modules *" error={formErrors.title}>
                        <VCT_Input value={form.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })} placeholder="VD: Khởi quyền (Cấp 1)" aria-invalid={!!formErrors.title} />
                    </VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Mã định danh *" className="flex-1" error={formErrors.code}>
                            <VCT_Input value={form.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, code: e.target.value })} placeholder="VD: KQ-1" aria-invalid={!!formErrors.code} />
                        </VCT_Field>
                        <VCT_Field label="Áp dụng cho Cấp đai" className="flex-1" error={formErrors.belt_level}>
                            <VCT_Select options={Object.entries(BELT_MAP).map(([k, v]) => ({ value: k, label: v.label }))} value={form.belt_level} onChange={(v: string) => setForm({ ...form, belt_level: v as BeltLevel })} />
                        </VCT_Field>
                    </VCT_Stack>

                    <div className="h-px w-full bg-(--vct-border-subtle) my-2"></div>
                    <div className="text-sm font-bold opacity-70">Nội dung chi tiết</div>

                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Thời gian đào tạo dự kiến (Tháng)" className="flex-1" error={formErrors.estimated_months}>
                            <VCT_Input type="number" value={String(form.estimated_months || '')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, estimated_months: parseInt(e.target.value) || 0 })} placeholder="Số tháng..." aria-invalid={!!formErrors.estimated_months} />
                        </VCT_Field>
                        <VCT_Field label="Số lượng Kỹ thuật căn bản" className="flex-1" error={formErrors.techniques_count}>
                            <VCT_Input type="number" value={String(form.techniques_count || '')} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, techniques_count: parseInt(e.target.value) || 0 })} placeholder="0" aria-invalid={!!formErrors.techniques_count} />
                        </VCT_Field>
                    </VCT_Stack>

                    <VCT_Field label="Các bài Quyền yêu cầu (cách nhau dấu phẩy)">
                        <textarea
                            value={form.formInput}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, formInput: e.target.value })}
                            placeholder="VD: Căn bản công tay không, Thập thế bát thức..."
                            className="w-full bg-(--vct-bg-elevated) border border-(--vct-border-subtle) rounded-lg p-3 text-(--vct-text-primary) text-sm outline-none focus:border-(--vct-accent-cyan) transition-colors min-h-[80px] resize-y"
                            aria-label="Các bài quyền yêu cầu"
                        />
                    </VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa giáo trình"${deleteTarget?.title}"? Các CLB đang áp dụng giáo trình này sẽ bị ảnh hưởng.`}
                confirmLabel={isDeleting ? 'Đang xóa...' : 'Khẳng định xóa'} />
        </VCT_PageContainer>
    )
}
