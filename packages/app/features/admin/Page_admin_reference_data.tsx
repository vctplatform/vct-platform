'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Tabs,
    VCT_ConfirmDialog, VCT_EmptyState
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { usePagination } from '../hooks/usePagination'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { useFormValidation } from './hooks/useFormValidation'
import { AdminGuard } from './components/AdminGuard'


interface RefItem {
    id: string; code: string; name_vi: string; name_en: string
    sort_order: number; is_active: boolean; metadata: string
}
interface RefTable { key: string; label: string; description: string; items: RefItem[] }

const MOCK_REF_TABLES: RefTable[] = [
    { key: 'belt_ranks', label: 'Cấp đai', description: 'Hệ thống cấp bậc đai võ cổ truyền', items: [
        { id:'BR-01', code:'WHITE', name_vi:'Đai Trắng', name_en:'White Belt', sort_order:1, is_active:true, metadata:'{}' },
        { id:'BR-02', code:'YELLOW', name_vi:'Đai Vàng', name_en:'Yellow Belt', sort_order:2, is_active:true, metadata:'{}' },
        { id:'BR-03', code:'GREEN', name_vi:'Đai Xanh Lá', name_en:'Green Belt', sort_order:3, is_active:true, metadata:'{}' },
        { id:'BR-04', code:'BLUE', name_vi:'Đai Xanh Dương', name_en:'Blue Belt', sort_order:4, is_active:true, metadata:'{}' },
        { id:'BR-05', code:'RED', name_vi:'Đai Đỏ', name_en:'Red Belt', sort_order:5, is_active:true, metadata:'{}' },
        { id:'BR-06', code:'BLACK_1', name_vi:'Đai Đen 1 Đẳng', name_en:'Black Belt 1st Dan', sort_order:6, is_active:true, metadata:'{}' },
        { id:'BR-07', code:'BLACK_2', name_vi:'Đai Đen 2 Đẳng', name_en:'Black Belt 2nd Dan', sort_order:7, is_active:true, metadata:'{}' },
        { id:'BR-08', code:'BLACK_3', name_vi:'Đai Đen 3 Đẳng', name_en:'Black Belt 3rd Dan', sort_order:8, is_active:true, metadata:'{}' },
        { id:'BR-09', code:'HONG_1', name_vi:'Chuẩn Hồng Đai', name_en:'Pre-Red Grand Belt', sort_order:9, is_active:true, metadata:'{}' },
        { id:'BR-10', code:'HONG_2', name_vi:'Hồng Đai', name_en:'Red Grand Belt', sort_order:10, is_active:true, metadata:'{}' },
    ]},
    { key: 'weight_classes', label: 'Hạng cân', description: 'Phân loại hạng cân thi đấu đối kháng', items: [
        { id:'WC-01', code:'M_48', name_vi:'Nam dưới 48kg', name_en:'Male U48', sort_order:1, is_active:true, metadata:'{"gender":"male","max_kg":48}' },
        { id:'WC-02', code:'M_52', name_vi:'Nam 48-52kg', name_en:'Male 48-52', sort_order:2, is_active:true, metadata:'{"gender":"male","min_kg":48,"max_kg":52}' },
        { id:'WC-03', code:'M_56', name_vi:'Nam 52-56kg', name_en:'Male 52-56', sort_order:3, is_active:true, metadata:'{"gender":"male","min_kg":52,"max_kg":56}' },
        { id:'WC-04', code:'M_60', name_vi:'Nam 56-60kg', name_en:'Male 56-60', sort_order:4, is_active:true, metadata:'{"gender":"male","min_kg":56,"max_kg":60}' },
        { id:'WC-05', code:'F_48', name_vi:'Nữ dưới 48kg', name_en:'Female U48', sort_order:5, is_active:true, metadata:'{"gender":"female","max_kg":48}' },
        { id:'WC-06', code:'F_52', name_vi:'Nữ 48-52kg', name_en:'Female 48-52', sort_order:6, is_active:true, metadata:'{"gender":"female","min_kg":48,"max_kg":52}' },
    ]},
    { key: 'scoring_criteria', label: 'Tiêu chí chấm điểm', description: 'Tiêu chí chấm điểm quyền thuật', items: [
        { id:'SC-01', code:'ACCURACY', name_vi:'Độ chính xác', name_en:'Accuracy', sort_order:1, is_active:true, metadata:'{"max_score":10,"weight":0.3}' },
        { id:'SC-02', code:'POWER', name_vi:'Lực đòn', name_en:'Power', sort_order:2, is_active:true, metadata:'{"max_score":10,"weight":0.25}' },
        { id:'SC-03', code:'SPEED', name_vi:'Tốc độ', name_en:'Speed', sort_order:3, is_active:true, metadata:'{"max_score":10,"weight":0.2}' },
        { id:'SC-04', code:'PRESENTATION', name_vi:'Tác phong', name_en:'Presentation', sort_order:4, is_active:true, metadata:'{"max_score":10,"weight":0.25}' },
    ]},
    { key: 'age_categories', label: 'Lứa tuổi', description: 'Phân loại lứa tuổi thi đấu', items: [
        { id:'AC-01', code:'U12', name_vi:'Thiếu nhi (<12)', name_en:'Under 12', sort_order:1, is_active:true, metadata:'{"max_age":11}' },
        { id:'AC-02', code:'U15', name_vi:'Thiếu niên (12-15)', name_en:'Under 15', sort_order:2, is_active:true, metadata:'{"min_age":12,"max_age":14}' },
        { id:'AC-03', code:'U18', name_vi:'Thanh TN (15-18)', name_en:'Under 18', sort_order:3, is_active:true, metadata:'{"min_age":15,"max_age":17}' },
        { id:'AC-04', code:'SENIOR', name_vi:'Tuyển (18+)', name_en:'Senior', sort_order:4, is_active:true, metadata:'{"min_age":18}' },
    ]},
    { key: 'penalty_types', label: 'Loại phạt', description: 'Các hình thức phạt trong thi đấu', items: [
        { id:'PT-01', code:'WARNING', name_vi:'Nhắc nhở', name_en:'Warning', sort_order:1, is_active:true, metadata:'{"points_deducted":0}' },
        { id:'PT-02', code:'MINOR_FOUL', name_vi:'Lỗi nhẹ', name_en:'Minor Foul', sort_order:2, is_active:true, metadata:'{"points_deducted":1}' },
        { id:'PT-03', code:'MAJOR_FOUL', name_vi:'Lỗi nặng', name_en:'Major Foul', sort_order:3, is_active:true, metadata:'{"points_deducted":2}' },
        { id:'PT-04', code:'DISQUALIFY', name_vi:'Truất quyền', name_en:'Disqualification', sort_order:4, is_active:true, metadata:'{"points_deducted":-1}' },
    ]},
]

const SkeletonRow = () => (<tr className="animate-pulse"><td className="p-4"><div className="h-4 w-6 bg-(--vct-bg-card) rounded mx-auto" /></td><td className="p-4"><div className="h-5 w-16 bg-(--vct-bg-card) rounded" /></td><td className="p-4"><div className="h-4 w-28 bg-(--vct-bg-card) rounded" /></td><td className="p-4"><div className="h-4 w-24 bg-(--vct-bg-card) rounded" /></td><td className="p-4"><div className="h-5 w-16 bg-(--vct-bg-card) rounded mx-auto" /></td><td className="p-4"><div className="h-4 w-12 bg-(--vct-bg-card) rounded mx-auto" /></td></tr>)

export const Page_admin_reference_data = () => (
    <AdminGuard>
        <Page_admin_reference_data_Content />
    </AdminGuard>
)

const Page_admin_reference_data_Content = () => {
    const { data: fetchedTables, isLoading } = useAdminFetch<RefTable[]>('/admin/reference-data', { mockData: MOCK_REF_TABLES })
    const [tables, setTables] = useState<RefTable[]>([])
    const [activeTable, setActiveTable] = useState(MOCK_REF_TABLES[0]?.key || '')
    const [search, setSearch] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [editingItem, setEditingItem] = useState<RefItem | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<RefItem | null>(null)
    const [form, setForm] = useState({ code: '', name_vi: '', name_en: '', sort_order: 0, metadata: '{}' })
    const { showToast } = useShellToast()

    React.useEffect(() => { if (fetchedTables) setTables(fetchedTables) }, [fetchedTables])

    const currentTable = useMemo(() => tables.find(t => t.key === activeTable), [tables, activeTable])

    const filteredItems = useMemo(() => {
        if (!currentTable) return []
        let items = currentTable.items
        if (search) {
            const q = search.toLowerCase()
            items = items.filter(it => it.name_vi.toLowerCase().includes(q) || it.name_en.toLowerCase().includes(q) || it.code.toLowerCase().includes(q))
        }
        return items.sort((a, b) => a.sort_order - b.sort_order)
    }, [currentTable, search])

    const { paginatedItems, currentPage, totalPages, goToPage, next, prev } = usePagination<RefItem>(filteredItems, { pageSize: 8 })
    const totalItems = tables.reduce((s, t) => s + t.items.length, 0)

    const openAdd = () => { setEditingItem(null); setForm({ code: '', name_vi: '', name_en: '', sort_order: (currentTable?.items.length || 0) + 1, metadata: '{}' }); setShowModal(true) }
    const openEdit = (item: RefItem) => { setEditingItem(item); setForm({ code: item.code, name_vi: item.name_vi, name_en: item.name_en, sort_order: item.sort_order, metadata: item.metadata }); setShowModal(true) }

    const { mutate: mutateSave, isSubmitting: _isSaving } = useAdminMutation<RefItem, Partial<RefItem>>(
        `/admin/reference-data/${activeTable}`,
        {
            method: editingItem ? 'PUT' : 'POST',
            onError: () => showToast('Lỗi khi lưu, đã cập nhật cục bộ', 'warning'),
        }
    )
    const { mutate: mutateDelete, isSubmitting: _isDeleting } = useAdminMutation<void, { id: string }>(
        `/admin/reference-data/${activeTable}`,
        {
            method: 'DELETE',
            onError: () => showToast('Lỗi khi xóa, đã cập nhật cục bộ', 'warning'),
        }
    )

    const { validate, getFieldError, clearErrors } = useFormValidation({
        code: { rules: [{ type: 'required', message: 'Mã là bắt buộc' }, { type: 'maxLength', value: 30 }] },
        name_vi: { rules: [{ type: 'required', message: 'Tên tiếng Việt là bắt buộc' }, { type: 'maxLength', value: 100 }] },
    })

    const handleSave = async () => {
        if (!validate({ code: form.code, name_vi: form.name_vi })) return
        // Attempt API call (will fail gracefully with mock backend)
        await mutateSave({ ...form, id: editingItem?.id } as Partial<RefItem>)
        // Always update local state for immediate UX
        setTables(prev => prev.map(t => {
            if (t.key !== activeTable) return t
            if (editingItem) return { ...t, items: t.items.map(it => it.id === editingItem.id ? { ...it, ...form, is_active: true } : it) }
            return { ...t, items: [...t.items, { ...form, id: `${activeTable.toUpperCase()}-${Math.floor(Math.random()*100).toString().padStart(2,'0')}`, is_active: true }] }
        }))
        showToast(editingItem ? `Đã cập nhật "${form.name_vi}"` : `Đã thêm "${form.name_vi}"`); setShowModal(false)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        await mutateDelete({ id: deleteTarget.id })
        setTables(prev => prev.map(t => { if (t.key !== activeTable) return t; return { ...t, items: t.items.map(it => it.id === deleteTarget.id ? { ...it, is_active: false } : it) } }))
        showToast(`Đã ẩn "${deleteTarget.name_vi}"`); setDeleteTarget(null)
    }

    const stats: StatItem[] = [
        { label: 'Bảng TC', value: tables.length, icon: <VCT_Icons.Layers size={18} />, color: '#8b5cf6' },
        { label: 'Tổng mục', value: totalItems, icon: <VCT_Icons.List size={18} />, color: '#0ea5e9' },
        { label: 'Hoạt động', value: tables.reduce((s,t) => s + t.items.filter(i => i.is_active).length, 0), icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
        { label: 'Đã ẩn', value: tables.reduce((s,t) => s + t.items.filter(i => !i.is_active).length, 0), icon: <VCT_Icons.Eye size={18} />, color: '#f59e0b' },
    ]

    return (
        <AdminPageShell
            title="Dữ Liệu Tham Chiếu"
            subtitle="Quản lý bảng lookup: cấp đai, hạng cân, tiêu chí, lứa tuổi..."
            icon={<VCT_Icons.Layers size={28} className="text-[#8b5cf6]" />}
            stats={stats}
            actions={
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAdd}>Thêm mục mới</VCT_Button>
            }
        >

            <div className="mb-6 border-b border-(--vct-border-subtle) pb-4 flex flex-wrap items-center justify-between gap-4">
                <VCT_Tabs tabs={tables.map(t => ({ key: t.key, label: `${t.label} (${t.items.length})` }))} activeTab={activeTable} onChange={setActiveTable} />
                <div className="w-full md:w-[300px]"><VCT_SearchInput placeholder="Tìm theo tên, mã..." value={search} onChange={setSearch} onClear={() => setSearch('')} /></div>
            </div>

            {currentTable && <div className="mb-4 p-3 bg-(--vct-bg-elevated) rounded-xl border border-(--vct-border-subtle) flex items-center gap-3"><VCT_Icons.Info size={16} className="text-(--vct-accent-cyan) shrink-0" /><span className="text-sm text-(--vct-text-secondary)">{currentTable.description}</span></div>}

            <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                        <th className="p-4 w-16 text-center">#</th><th className="p-4 w-28">Mã</th><th className="p-4">Tên (VI)</th><th className="p-4">Tên (EN)</th><th className="p-4 w-28 text-center">Trạng thái</th><th className="p-4 w-20 text-center"></th>
                    </tr></thead>
                    <tbody className="divide-y divide-(--vct-border-subtle)">
                        {isLoading ? [...Array(5)].map((_,i) => <SkeletonRow key={i} />) : paginatedItems.length === 0 ? (
                            <tr><td colSpan={6} className="p-8"><VCT_EmptyState title="Không có dữ liệu" description="Thử thay đổi bộ lọc hoặc thêm mục mới." icon="📋" /></td></tr>
                        ) : paginatedItems.map(item => (
                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 text-center font-mono text-sm text-(--vct-text-tertiary)">{item.sort_order}</td>
                                <td className="p-4"><span className="font-mono text-xs font-bold text-(--vct-accent-cyan) bg-(--vct-accent-cyan)/10 px-2 py-1 rounded">{item.code}</span></td>
                                <td className="p-4 font-semibold text-sm text-(--vct-text-primary)">{item.name_vi}</td>
                                <td className="p-4 text-sm text-(--vct-text-secondary)">{item.name_en}</td>
                                <td className="p-4 text-center"><VCT_Badge text={item.is_active ? 'Hoạt động' : 'Đã ẩn'} type={item.is_active ? 'success' : 'neutral'} /></td>
                                <td className="p-4 text-center"><VCT_Stack direction="row" gap={4} justify="center">
                                    <button onClick={() => openEdit(item)} aria-label={`Sửa ${item.name_vi}`} className="p-1.5 text-(--vct-text-tertiary) hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/10"><VCT_Icons.Edit size={14} /></button>
                                    <button onClick={() => setDeleteTarget(item)} aria-label={`Xóa ${item.name_vi}`} className="p-1.5 text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-[#ef444420]"><VCT_Icons.Trash size={14} /></button>
                                </VCT_Stack></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 text-sm text-(--vct-text-secondary)">
                    <span>Trang {currentPage}/{totalPages} · {filteredItems.length} mục</span>
                    <div className="flex gap-1">
                        <button onClick={prev} disabled={currentPage===1} className="px-3 py-1.5 rounded-lg border border-(--vct-border-subtle) hover:bg-white/5 disabled:opacity-30 transition-all">←</button>
                        {[...Array(totalPages)].map((_,i) => <button key={i} onClick={() => goToPage(i+1)} className={`px-3 py-1.5 rounded-lg border transition-all ${currentPage===i+1 ? 'bg-(--vct-accent-cyan) text-white border-transparent' : 'border-(--vct-border-subtle) hover:bg-white/5'}`}>{i+1}</button>)}
                        <button onClick={next} disabled={currentPage===totalPages} className="px-3 py-1.5 rounded-lg border border-(--vct-border-subtle) hover:bg-white/5 disabled:opacity-30 transition-all">→</button>
                    </div>
                </div>
            )}

            <VCT_Modal isOpen={showModal} onClose={() => { setShowModal(false); clearErrors() }} title={editingItem ? 'Chỉnh sửa' : 'Thêm mục mới'} width="550px" footer={<><VCT_Button variant="secondary" onClick={() => { setShowModal(false); clearErrors() }}>Hủy</VCT_Button><VCT_Button onClick={handleSave}>{editingItem ? 'Cập nhật' : 'Thêm'}</VCT_Button></>}>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Mã (code) *" error={getFieldError('code')}><VCT_Input value={form.code} onChange={(e:any) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="VD: BLACK_1" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Tên Tiếng Việt *" className="flex-1" error={getFieldError('name_vi')}><VCT_Input value={form.name_vi} onChange={(e:any) => setForm({...form, name_vi: e.target.value})} placeholder="VD: Đai Đen 1 Đẳng" /></VCT_Field>
                        <VCT_Field label="Tên English" className="flex-1"><VCT_Input value={form.name_en} onChange={(e:any) => setForm({...form, name_en: e.target.value})} placeholder="VD: Black Belt 1st Dan" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Field label="Thứ tự"><VCT_Input type="number" value={form.sort_order} onChange={(e:any) => setForm({...form, sort_order: parseInt(e.target.value)||0})} /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Ẩn mục tham chiếu" message={`Ẩn "${deleteTarget?.name_vi}"? Mục sẽ không bị xóa, chỉ ẩn khỏi danh sách.`} confirmLabel="Ẩn mục này" />
        </AdminPageShell>
    )
}
