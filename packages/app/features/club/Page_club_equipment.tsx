'use client'

import * as React from 'react'
import {
  VCT_Badge,
  VCT_Button,
  VCT_ConfirmDialog,
  VCT_EmptyState,
  VCT_Field,
  VCT_FilterChips,
  VCT_Input,
  VCT_Modal,
  VCT_SearchInput,
  VCT_Select,
  VCT_Table,
  VCT_Toast,
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useRouteActionGuard } from '../hooks/use-route-action-guard'
import {
  EQUIPMENT_CATEGORY_LABEL,
  EQUIPMENT_CONDITION_COLOR,
  EQUIPMENT_CONDITION_LABEL,
  EQUIPMENT_SEED,
  type ClubEquipment,
  type EquipmentCategory,
  type EquipmentCondition,
  makeClubId,
  useClubStoredState,
} from './club-data'

/* ── SVG Charts ───────────────────────────────────────────────── */

const EquipmentCategoryChart = ({ items }: { items: ClubEquipment[] }) => {
  const data = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of items) map[e.category] = (map[e.category] || 0) + e.quantity
    return Object.entries(map)
      .map(([key, value]) => ({ key, label: EQUIPMENT_CATEGORY_LABEL[key as EquipmentCategory] || key, value }))
      .sort((a, b) => b.value - a.value)
  }, [items])

  const max = Math.max(...data.map(d => d.value), 1)
  const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899']

  return (
    <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--vct-text-primary)]">Phân bố theo danh mục</h3>
      <div className="space-y-2">
        {data.map((d, i) => (
          <div key={d.key} className="flex items-center gap-2">
            <span className="w-[80px] shrink-0 text-xs text-[var(--vct-text-secondary)]">{d.label}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-[var(--vct-bg-input)]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(d.value / max) * 100}%`, backgroundColor: colors[i % colors.length] }}
              />
            </div>
            <span className="w-[32px] text-right text-xs font-semibold text-[var(--vct-text-primary)]">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const EquipmentConditionChart = ({ items }: { items: ClubEquipment[] }) => {
  const data = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of items) map[e.condition] = (map[e.condition] || 0) + e.quantity
    return Object.entries(map).map(([key, value]) => ({
      key,
      label: EQUIPMENT_CONDITION_LABEL[key as EquipmentCondition] || key,
      value,
      color: EQUIPMENT_CONDITION_COLOR[key as EquipmentCondition] || '#94a3b8',
    }))
  }, [items])

  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--vct-text-primary)]">Tình trạng thiết bị</h3>
      <svg viewBox="0 0 200 200" className="mx-auto" style={{ maxWidth: 140, maxHeight: 140 }}>
        {(() => {
          let offset = 0
          return data.map((d) => {
            const pct = d.value / total
            const dash = pct * 439.82 // 2πr for r=70
            const gap = 439.82 - dash
            const el = (
              <circle
                key={d.key}
                cx="100" cy="100" r="70"
                fill="none" strokeWidth="20"
                stroke={d.color}
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 100 100)"
              />
            )
            offset += dash
            return el
          })
        })()}
        <text x="100" y="96" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--vct-text-primary)">{total}</text>
        <text x="100" y="115" textAnchor="middle" fontSize="10" fill="var(--vct-text-secondary)">thiết bị</text>
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-1 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-[var(--vct-text-secondary)]">{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Form helpers ─────────────────────────────────────────────── */

type EquipmentFormState = {
  name: string
  category: EquipmentCategory
  quantity: string
  condition: EquipmentCondition
  purchaseDate: string
  unitValue: string
  supplier: string
  notes: string
}

type FormErrors = Partial<Record<keyof EquipmentFormState, string>>

const createInitialEquipmentForm = (): EquipmentFormState => ({
  name: '',
  category: 'other',
  quantity: '1',
  condition: 'new',
  purchaseDate: new Date().toISOString().slice(0, 10),
  unitValue: '0',
  supplier: '',
  notes: '',
})

const formFromEquipment = (e: ClubEquipment): EquipmentFormState => ({
  name: e.name,
  category: e.category,
  quantity: String(e.quantity),
  condition: e.condition,
  purchaseDate: e.purchaseDate,
  unitValue: String(e.unitValue),
  supplier: e.supplier,
  notes: e.notes || '',
})

const validateForm = (form: EquipmentFormState): FormErrors => {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = 'Tên thiết bị là bắt buộc'
  const qty = parseInt(form.quantity)
  if (isNaN(qty) || qty <= 0) errors.quantity = 'Số lượng phải lớn hơn 0'
  const uv = parseInt(form.unitValue)
  if (isNaN(uv) || uv < 0) errors.unitValue = 'Đơn giá không hợp lệ'
  return errors
}

const formatVND = (value: number) => value.toLocaleString('vi-VN') + ' đ'

/* ── CSV Export ────────────────────────────────────────────────── */

const exportCSV = (items: ClubEquipment[]) => {
  const header = 'Tên,Danh mục,Số lượng,Tình trạng,Đơn giá,Tổng giá trị,Ngày mua,NCC,Ghi chú\n'
  const rows = items.map(e =>
    `"${e.name}","${EQUIPMENT_CATEGORY_LABEL[e.category]}",${e.quantity},"${EQUIPMENT_CONDITION_LABEL[e.condition]}",${e.unitValue},${e.totalValue},"${e.purchaseDate}","${e.supplier}","${e.notes || ''}"`
  ).join('\n')
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `thiet-bi-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Main Component ───────────────────────────────────────────── */

export const Page_club_equipment = () => {
  const [items, setItems] = useClubStoredState('equipment', EQUIPMENT_SEED)
  const [search, setSearch] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<EquipmentCategory | ''>('')
  const [conditionFilter, setConditionFilter] = React.useState<EquipmentCondition | ''>('')
  const [editingItem, setEditingItem] = React.useState<ClubEquipment | null>(null)
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubEquipment | null>(null)
  const [form, setForm] = React.useState(createInitialEquipmentForm)
  const [formErrors, setFormErrors] = React.useState<FormErrors>({})
  const [toast, setToast] = React.useState({ show: false, msg: '', type: 'success' as 'success' | 'warning' | 'error' | 'info' })

  const showToast = React.useCallback((msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type })
  }, [])

  const { can, requireAction } = useRouteActionGuard('/club/equipment', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const filteredItems = React.useMemo(() => {
    let rows = items
    if (categoryFilter) rows = rows.filter((e) => e.category === categoryFilter)
    if (conditionFilter) rows = rows.filter((e) => e.condition === conditionFilter)
    if (search) {
      const kw = search.toLowerCase()
      rows = rows.filter((e) => e.name.toLowerCase().includes(kw) || e.supplier.toLowerCase().includes(kw))
    }
    return rows
  }, [items, categoryFilter, conditionFilter, search])

  const totalValue = React.useMemo(() => items.reduce((sum, e) => sum + e.totalValue, 0), [items])
  const totalQty = React.useMemo(() => items.reduce((sum, e) => sum + e.quantity, 0), [items])
  const needReplacement = React.useMemo(() => items.filter((e) => e.condition === 'damaged' || e.condition === 'retired').reduce((sum, e) => sum + e.quantity, 0), [items])

  const openCreateModal = () => {
    if (!requireAction('create', 'thêm thiết bị')) return
    setEditingItem(null)
    setForm(createInitialEquipmentForm())
    setFormErrors({})
    setShowFormModal(true)
  }

  const openEditModal = (item: ClubEquipment) => {
    if (!requireAction('update', 'sửa thiết bị')) return
    setEditingItem(item)
    setForm(formFromEquipment(item))
    setFormErrors({})
    setShowFormModal(true)
  }

  const saveForm = () => {
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      showToast('Vui lòng kiểm tra lại thông tin', 'warning')
      return
    }
    const qty = parseInt(form.quantity) || 1
    const uv = parseInt(form.unitValue) || 0

    if (editingItem) {
      setItems((prev) => prev.map((item) => item.id === editingItem.id ? {
        ...item, name: form.name.trim(), category: form.category, quantity: qty, condition: form.condition,
        purchaseDate: form.purchaseDate, unitValue: uv, totalValue: qty * uv, supplier: form.supplier.trim(), notes: form.notes.trim() || undefined,
      } : item))
      showToast('Đã cập nhật thiết bị')
    } else {
      const next: ClubEquipment = {
        id: makeClubId('EQP'), clubId: 'CLB-001', name: form.name.trim(), category: form.category, quantity: qty,
        condition: form.condition, purchaseDate: form.purchaseDate, unitValue: uv, totalValue: qty * uv, supplier: form.supplier.trim(), notes: form.notes.trim() || undefined,
      }
      setItems((prev) => [next, ...prev])
      showToast('Đã thêm thiết bị mới')
    }
    setShowFormModal(false)
    setEditingItem(null)
  }

  const requestDelete = (item: ClubEquipment) => {
    if (!requireAction('delete', 'xóa thiết bị')) return
    setDeleteTarget(item)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((e) => e.id !== deleteTarget.id))
    showToast(`Đã xóa ${deleteTarget.name}`, 'info')
    setDeleteTarget(null)
  }

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (categoryFilter) result.push({ key: 'category', label: 'Loại', value: EQUIPMENT_CATEGORY_LABEL[categoryFilter] })
    if (conditionFilter) result.push({ key: 'condition', label: 'Tình trạng', value: EQUIPMENT_CONDITION_LABEL[conditionFilter] })
    if (search) result.push({ key: 'search', label: 'Tìm', value: search })
    return result
  }, [categoryFilter, conditionFilter, search])

  const removeFilter = (key: string) => {
    if (key === 'category') setCategoryFilter('')
    if (key === 'condition') setConditionFilter('')
    if (key === 'search') setSearch('')
  }

  const stats: StatItem[] = [
    { label: 'Tổng số lượng', value: totalQty, icon: <VCT_Icons.Layers size={18} />, color: '#0ea5e9' },
    { label: 'Tổng giá trị', value: formatVND(totalValue), icon: <VCT_Icons.DollarSign size={18} />, color: '#10b981' },
    { label: 'Loại thiết bị', value: items.length, icon: <VCT_Icons.List size={18} />, color: '#8b5cf6' },
    { label: 'Cần thay thế', value: needReplacement, icon: <VCT_Icons.AlertTriangle size={18} />, color: needReplacement > 0 ? '#ef4444' : '#94a3b8' },
  ]

  const columns = [
    {
      key: 'name',
      label: 'Thiết bị',
      render: (row: ClubEquipment) => (
        <div>
          <div className="text-sm font-semibold">{row.name}</div>
          <div className="text-xs text-[var(--vct-text-secondary)]">{EQUIPMENT_CATEGORY_LABEL[row.category]}</div>
        </div>
      ),
    },
    { key: 'quantity', label: 'SL', render: (row: ClubEquipment) => <span className="text-sm font-semibold">{row.quantity}</span> },
    {
      key: 'condition',
      label: 'Tình trạng',
      render: (row: ClubEquipment) => {
        const tone = row.condition === 'new' || row.condition === 'good' ? 'success' : row.condition === 'worn' ? 'warning' : 'danger'
        return <VCT_Badge text={EQUIPMENT_CONDITION_LABEL[row.condition]} type={tone} />
      },
    },
    { key: 'totalValue', label: 'Giá trị', render: (row: ClubEquipment) => <span className="text-sm">{formatVND(row.totalValue)}</span> },
    { key: 'supplier', label: 'NCC', render: (row: ClubEquipment) => <span className="text-xs text-[var(--vct-text-secondary)]">{row.supplier || '—'}</span> },
    { key: 'purchaseDate', label: 'Ngày mua', render: (row: ClubEquipment) => <span className="text-xs">{row.purchaseDate}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (row: ClubEquipment) => (
        <div className="flex justify-end gap-1">
          {can('update') ? <button type="button" onClick={() => openEditModal(row)} className="rounded-md bg-[var(--vct-bg-input)] px-2 py-1 text-xs font-semibold">Sửa</button> : null}
          {can('delete') ? <button type="button" onClick={() => requestDelete(row)} className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500">Xóa</button> : null}
        </div>
      ),
    },
  ]

  return (
    <VCT_PageContainer size="wide" animated>
      <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Trang thiết bị</h1>
        <p className="mt-1 text-sm text-[var(--vct-text-secondary)]">Quản lý, kiểm kê trang thiết bị, bảo hộ, binh khí, võ phục.</p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <EquipmentCategoryChart items={items} />
        <EquipmentConditionChart items={items} />
      </div>

      {/* Replacement alert */}
      {needReplacement > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3">
          <VCT_Icons.AlertTriangle size={18} className="text-red-500" />
          <span className="text-sm font-medium text-red-400">
            Có {needReplacement} thiết bị cần thay thế hoặc thanh lý
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm thiết bị, NCC..." />
          </div>
          <VCT_Select
            value={categoryFilter}
            onChange={(v) => setCategoryFilter((v as EquipmentCategory) || '')}
            options={[
              { value: '', label: 'Tất cả loại' },
              { value: 'protective', label: 'Bảo hộ' },
              { value: 'training', label: 'Tập luyện' },
              { value: 'weapon', label: 'Binh khí' },
              { value: 'uniform', label: 'Võ phục' },
              { value: 'medical', label: 'Y tế' },
              { value: 'other', label: 'Khác' },
            ]}
            className="min-w-[150px]"
          />
          <VCT_Select
            value={conditionFilter}
            onChange={(v) => setConditionFilter((v as EquipmentCondition) || '')}
            options={[
              { value: '', label: 'Tất cả TT' },
              { value: 'new', label: 'Mới' },
              { value: 'good', label: 'Tốt' },
              { value: 'worn', label: 'Cũ' },
              { value: 'damaged', label: 'Hư hỏng' },
              { value: 'retired', label: 'Thanh lý' },
            ]}
            className="min-w-[140px]"
          />
        </div>
        <div className="flex gap-2">
          {can('export') && (
            <VCT_Button variant="ghost" icon={<VCT_Icons.Download size={16} />} onClick={() => exportCSV(filteredItems)}>
              Xuất CSV
            </VCT_Button>
          )}
          <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
            Thêm thiết bị
          </VCT_Button>
        </div>
      </div>

      <VCT_FilterChips className="mb-4" filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setSearch(''); setCategoryFilter(''); setConditionFilter('') }} />

      {filteredItems.length === 0 ? (
        <VCT_EmptyState icon="🛡️" title="Không có thiết bị" description="Thử đổi bộ lọc hoặc thêm thiết bị mới." actionLabel={can('create') ? 'Thêm thiết bị' : undefined} onAction={can('create') ? openCreateModal : undefined} />
      ) : (
        <div className="rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)] p-2">
          <VCT_Table columns={columns} data={filteredItems} rowKey="id" />
        </div>
      )}

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingItem ? 'Sửa thiết bị' : 'Thêm thiết bị mới'}
        width={700}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>Hủy</VCT_Button>
            <VCT_Button onClick={saveForm}>{editingItem ? 'Cập nhật' : 'Thêm'}</VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Tên thiết bị *" error={formErrors.name}><VCT_Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Giáp thân, Bao cát..." /></VCT_Field>
          <VCT_Field label="Phân loại">
            <VCT_Select value={form.category} onChange={(v) => setForm((prev) => ({ ...prev, category: v as EquipmentCategory }))} options={[
              { value: 'protective', label: 'Bảo hộ' }, { value: 'training', label: 'Tập luyện' }, { value: 'weapon', label: 'Binh khí' },
              { value: 'uniform', label: 'Võ phục' }, { value: 'medical', label: 'Y tế' }, { value: 'other', label: 'Khác' },
            ]} />
          </VCT_Field>
          <VCT_Field label="Số lượng *" error={formErrors.quantity}><VCT_Input type="number" value={form.quantity} onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))} /></VCT_Field>
          <VCT_Field label="Tình trạng">
            <VCT_Select value={form.condition} onChange={(v) => setForm((prev) => ({ ...prev, condition: v as EquipmentCondition }))} options={[
              { value: 'new', label: 'Mới' }, { value: 'good', label: 'Tốt' }, { value: 'worn', label: 'Cũ' },
              { value: 'damaged', label: 'Hư hỏng' }, { value: 'retired', label: 'Thanh lý' },
            ]} />
          </VCT_Field>
          <VCT_Field label="Đơn giá (VND) *" error={formErrors.unitValue}><VCT_Input type="number" value={form.unitValue} onChange={(e) => setForm((prev) => ({ ...prev, unitValue: e.target.value }))} /></VCT_Field>
          <VCT_Field label="Ngày mua"><VCT_Input type="date" value={form.purchaseDate} onChange={(e) => setForm((prev) => ({ ...prev, purchaseDate: e.target.value }))} /></VCT_Field>
          <VCT_Field label="Nhà cung cấp"><VCT_Input value={form.supplier} onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))} placeholder="VN Sport, Thai Boxing..." /></VCT_Field>
          <VCT_Field label="Ghi chú"><VCT_Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Ghi chú thêm..." /></VCT_Field>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Thiết bị sẽ bị xóa khỏi danh sách kiểm kê."
        preview={deleteTarget ? `${deleteTarget.name} (SL: ${deleteTarget.quantity})` : undefined}
        confirmLabel="Xóa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
