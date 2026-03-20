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
  FACILITY_SEED,
  FACILITY_STATUS_COLOR,
  FACILITY_STATUS_LABEL,
  FACILITY_TYPE_LABEL,
  type ClubFacility,
  type FacilityStatus,
  type FacilityType,
  makeClubId,
  useClubStoredState,
} from './club-data'

/* ── SVG Donut Chart ──────────────────────────────────────────── */

const FacilityStatusChart = ({ items }: { items: ClubFacility[] }) => {
  const data = React.useMemo(() => {
    const map: Record<string, number> = {}
    for (const f of items) map[f.status] = (map[f.status] || 0) + 1
    return Object.entries(map).map(([key, value]) => ({
      key,
      label: FACILITY_STATUS_LABEL[key as FacilityStatus] || key,
      value,
      color: FACILITY_STATUS_COLOR[key as FacilityStatus] || '#94a3b8',
    }))
  }, [items])

  const total = data.reduce((s, d) => s + d.value, 0) || 1

  return (
    <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
      <h3 className="mb-3 text-sm font-semibold text-(--vct-text-primary)">Trạng thái cơ sở</h3>
      <svg viewBox="0 0 200 200" className="mx-auto" style={{ maxWidth: 140, maxHeight: 140 }}>
        {(() => {
          let offset = 0
          return data.map((d) => {
            const pct = d.value / total
            const dash = pct * 439.82
            const gap = 439.82 - dash
            const el = (
              <circle key={d.key} cx="100" cy="100" r="70" fill="none" strokeWidth="20" stroke={d.color}
                strokeDasharray={`${dash} ${gap}`} strokeDashoffset={-offset} transform="rotate(-90 100 100)" />
            )
            offset += dash
            return el
          })
        })()}
        <text x="100" y="96" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--vct-text-primary)">{total}</text>
        <text x="100" y="115" textAnchor="middle" fontSize="10" fill="var(--vct-text-secondary)">cơ sở</text>
      </svg>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        {data.map((d) => (
          <div key={d.key} className="flex items-center gap-1 text-xs">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
            <span className="text-(--vct-text-secondary)">{d.label}: {d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const FacilityAreaChart = ({ items }: { items: ClubFacility[] }) => {
  const sorted = React.useMemo(() => [...items].sort((a, b) => b.areaSqm - a.areaSqm), [items])
  const max = sorted.length > 0 ? sorted[0]!.areaSqm : 1
  const colors = ['#0ea5e9', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6']

  return (
    <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
      <h3 className="mb-3 text-sm font-semibold text-(--vct-text-primary)">Diện tích theo cơ sở</h3>
      <div className="space-y-2">
        {sorted.map((f, i) => (
          <div key={f.id} className="flex items-center gap-2">
            <span className="w-[100px] shrink-0 truncate text-xs text-(--vct-text-secondary)">{f.name}</span>
            <div className="relative h-5 flex-1 overflow-hidden rounded-full bg-(--vct-bg-input)">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(f.areaSqm / max) * 100}%`, backgroundColor: colors[i % colors.length] }} />
            </div>
            <span className="w-[48px] text-right text-xs font-semibold text-(--vct-text-primary)">{f.areaSqm}m²</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Form helpers ─────────────────────────────────────────────── */

type FacilityFormState = {
  name: string
  type: FacilityType
  areaSqm: string
  capacity: string
  status: FacilityStatus
  address: string
  monthlyRent: string
  nextMaintenanceDate: string
  notes: string
}

type FormErrors = Partial<Record<keyof FacilityFormState, string>>

const createInitialFacilityForm = (): FacilityFormState => ({
  name: '',
  type: 'training_hall',
  areaSqm: '0',
  capacity: '0',
  status: 'active',
  address: '',
  monthlyRent: '0',
  nextMaintenanceDate: '',
  notes: '',
})

const formFromFacility = (f: ClubFacility): FacilityFormState => ({
  name: f.name,
  type: f.type,
  areaSqm: String(f.areaSqm),
  capacity: String(f.capacity),
  status: f.status,
  address: f.address || '',
  monthlyRent: String(f.monthlyRent),
  nextMaintenanceDate: f.nextMaintenanceDate || '',
  notes: f.notes || '',
})

const validateForm = (form: FacilityFormState): FormErrors => {
  const errors: FormErrors = {}
  if (!form.name.trim()) errors.name = 'Tên cơ sở là bắt buộc'
  const area = parseFloat(form.areaSqm)
  if (isNaN(area) || area <= 0) errors.areaSqm = 'Diện tích phải lớn hơn 0'
  const cap = parseInt(form.capacity)
  if (isNaN(cap) || cap < 0) errors.capacity = 'Sức chứa không hợp lệ'
  return errors
}

const formatVND = (value: number) => value.toLocaleString('vi-VN') + ' đ'

/* ── CSV Export ────────────────────────────────────────────────── */

const exportCSV = (items: ClubFacility[]) => {
  const header = 'Tên,Loại,Diện tích (m²),Sức chứa,Trạng thái,Thuê/tháng,Bảo trì tiếp,Địa chỉ,Ghi chú\n'
  const rows = items.map(f =>
    `"${f.name}","${FACILITY_TYPE_LABEL[f.type]}",${f.areaSqm},${f.capacity},"${FACILITY_STATUS_LABEL[f.status]}",${f.monthlyRent},"${f.nextMaintenanceDate || ''}","${f.address || ''}","${f.notes || ''}"`
  ).join('\n')
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `csvc-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Maintenance alert helper ──────────────────────────────────── */

const getOverdueFacilities = (items: ClubFacility[]) => {
  const today = new Date().toISOString().slice(0, 10)
  return items.filter(f => f.nextMaintenanceDate && f.nextMaintenanceDate <= today)
}

/* ── Main Component ───────────────────────────────────────────── */

export const Page_club_facilities = () => {
  const [items, setItems] = useClubStoredState('facilities', FACILITY_SEED)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<FacilityType | ''>('')
  const [statusFilter, setStatusFilter] = React.useState<FacilityStatus | ''>('')
  const [editingItem, setEditingItem] = React.useState<ClubFacility | null>(null)
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubFacility | null>(null)
  const [form, setForm] = React.useState(createInitialFacilityForm)
  const [formErrors, setFormErrors] = React.useState<FormErrors>({})
  const [toast, setToast] = React.useState({ show: false, msg: '', type: 'success' as 'success' | 'warning' | 'error' | 'info' })

  const showToast = React.useCallback((msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type })
  }, [])

  const { can, requireAction } = useRouteActionGuard('/club/facilities', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const filteredItems = React.useMemo(() => {
    let rows = items
    if (typeFilter) rows = rows.filter((f) => f.type === typeFilter)
    if (statusFilter) rows = rows.filter((f) => f.status === statusFilter)
    if (search) {
      const kw = search.toLowerCase()
      rows = rows.filter((f) => f.name.toLowerCase().includes(kw))
    }
    return rows
  }, [items, typeFilter, statusFilter, search])

  const totalArea = React.useMemo(() => items.reduce((sum, f) => sum + f.areaSqm, 0), [items])
  const totalCapacity = React.useMemo(() => items.reduce((sum, f) => sum + f.capacity, 0), [items])
  const totalRent = React.useMemo(() => items.reduce((sum, f) => sum + f.monthlyRent, 0), [items])
  const maintenanceCount = React.useMemo(() => items.filter((f) => f.status === 'maintenance').length, [items])
  const overdueFacilities = React.useMemo(() => getOverdueFacilities(items), [items])

  const openCreateModal = () => {
    if (!requireAction('create', 'thêm cơ sở')) return
    setEditingItem(null)
    setForm(createInitialFacilityForm())
    setFormErrors({})
    setShowFormModal(true)
  }

  const openEditModal = (item: ClubFacility) => {
    if (!requireAction('update', 'sửa cơ sở')) return
    setEditingItem(item)
    setForm(formFromFacility(item))
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

    if (editingItem) {
      setItems((prev) => prev.map((item) => item.id === editingItem.id ? {
        ...item, name: form.name.trim(), type: form.type, areaSqm: parseFloat(form.areaSqm) || 0,
        capacity: parseInt(form.capacity) || 0, status: form.status, address: form.address.trim() || undefined,
        monthlyRent: parseFloat(form.monthlyRent) || 0, nextMaintenanceDate: form.nextMaintenanceDate || undefined,
        notes: form.notes.trim() || undefined,
      } : item))
      showToast('Đã cập nhật cơ sở')
    } else {
      const next: ClubFacility = {
        id: makeClubId('FAC'), clubId: 'CLB-001', name: form.name.trim(), type: form.type,
        areaSqm: parseFloat(form.areaSqm) || 0, capacity: parseInt(form.capacity) || 0, status: form.status,
        address: form.address.trim() || undefined, monthlyRent: parseFloat(form.monthlyRent) || 0,
        nextMaintenanceDate: form.nextMaintenanceDate || undefined, notes: form.notes.trim() || undefined,
      }
      setItems((prev) => [next, ...prev])
      showToast('Đã thêm cơ sở mới')
    }
    setShowFormModal(false)
    setEditingItem(null)
  }

  const requestDelete = (item: ClubFacility) => {
    if (!requireAction('delete', 'xóa cơ sở')) return
    setDeleteTarget(item)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setItems((prev) => prev.filter((f) => f.id !== deleteTarget.id))
    showToast(`Đã xóa ${deleteTarget.name}`, 'info')
    setDeleteTarget(null)
  }

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (typeFilter) result.push({ key: 'type', label: 'Loại', value: FACILITY_TYPE_LABEL[typeFilter] })
    if (statusFilter) result.push({ key: 'status', label: 'Trạng thái', value: FACILITY_STATUS_LABEL[statusFilter] })
    if (search) result.push({ key: 'search', label: 'Tìm', value: search })
    return result
  }, [typeFilter, statusFilter, search])

  const removeFilter = (key: string) => {
    if (key === 'type') setTypeFilter('')
    if (key === 'status') setStatusFilter('')
    if (key === 'search') setSearch('')
  }

  const stats: StatItem[] = [
    { label: 'Tổng cơ sở', value: items.length, icon: <VCT_Icons.Building size={18} />, color: '#0ea5e9' },
    { label: 'Tổng diện tích', value: `${totalArea} m²`, icon: <VCT_Icons.Layout size={18} />, color: '#10b981' },
    { label: 'Sức chứa', value: totalCapacity, icon: <VCT_Icons.Users size={18} />, color: '#8b5cf6' },
    { label: 'Đang bảo trì', value: maintenanceCount, icon: <VCT_Icons.Wrench size={18} />, color: '#f59e0b' },
  ]

  const columns = [
    {
      key: 'name',
      label: 'Cơ sở',
      render: (row: ClubFacility) => (
        <div>
          <div className="text-sm font-semibold">{row.name}</div>
          <div className="text-xs text-(--vct-text-secondary)">{FACILITY_TYPE_LABEL[row.type]}</div>
        </div>
      ),
    },
    { key: 'area', label: 'Diện tích', render: (row: ClubFacility) => <span className="text-sm">{row.areaSqm} m²</span> },
    { key: 'capacity', label: 'Sức chứa', render: (row: ClubFacility) => <span className="text-sm">{row.capacity || '—'}</span> },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row: ClubFacility) => {
        const tone = row.status === 'active' ? 'success' : row.status === 'maintenance' ? 'warning' : 'danger'
        return <VCT_Badge text={FACILITY_STATUS_LABEL[row.status]} type={tone} />
      },
    },
    { key: 'rent', label: 'Thuê/tháng', render: (row: ClubFacility) => <span className="text-sm">{row.monthlyRent > 0 ? formatVND(row.monthlyRent) : '—'}</span> },
    {
      key: 'maintenance',
      label: 'Bảo trì tiếp',
      render: (row: ClubFacility) => {
        const isOverdue = row.nextMaintenanceDate && row.nextMaintenanceDate <= new Date().toISOString().slice(0, 10)
        return (
          <span className={`text-xs ${isOverdue ? 'font-semibold text-red-500' : 'text-(--vct-text-secondary)'}`}>
            {row.nextMaintenanceDate || '—'} {isOverdue ? '⚠️' : ''}
          </span>
        )
      },
    },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (row: ClubFacility) => (
        <div className="flex justify-end gap-1">
          {can('update') ? <button type="button" onClick={() => openEditModal(row)} className="rounded-md bg-(--vct-bg-input) px-2 py-1 text-xs font-semibold">Sửa</button> : null}
          {can('delete') ? <button type="button" onClick={() => requestDelete(row)} className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500">Xóa</button> : null}
        </div>
      ),
    },
  ]

  return (
    <VCT_PageContainer size="wide" animated>
      <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Cơ sở vật chất</h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">Quản lý phòng tập, sân đấu, kho thiết bị và các tiện ích của CLB.</p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      {/* Charts */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <FacilityStatusChart items={items} />
        <FacilityAreaChart items={items} />
      </div>

      {/* Maintenance overdue alert */}
      {overdueFacilities.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 mb-2">
            <VCT_Icons.AlertTriangle size={18} className="text-amber-500" />
            <span className="text-sm font-semibold text-amber-400">
              {overdueFacilities.length} cơ sở quá hạn bảo trì
            </span>
          </div>
          <div className="space-y-1">
            {overdueFacilities.map(f => (
              <div key={f.id} className="flex items-center gap-2 text-xs text-(--vct-text-secondary)">
                <span>•</span>
                <span className="font-medium text-(--vct-text-primary)">{f.name}</span>
                <span>— hạn: {f.nextMaintenanceDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Monthly rent summary */}
      {totalRent > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-3">
          <VCT_Icons.DollarSign size={18} className="text-emerald-500" />
          <span className="text-sm text-(--vct-text-secondary)">
            Tổng chi phí thuê: <span className="font-semibold text-(--vct-text-primary)">{formatVND(totalRent)}/tháng</span>
          </span>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm cơ sở..." />
          </div>
          <VCT_Select
            value={typeFilter}
            onChange={(v) => setTypeFilter((v as FacilityType) || '')}
            options={[
              { value: '', label: 'Tất cả loại' },
              { value: 'training_hall', label: 'Phòng tập' },
              { value: 'arena', label: 'Sân đối kháng' },
              { value: 'gym', label: 'Phòng gym' },
              { value: 'storage', label: 'Kho' },
              { value: 'office', label: 'Văn phòng' },
              { value: 'changing_room', label: 'Phòng thay đồ' },
              { value: 'other', label: 'Khác' },
            ]}
            className="min-w-[160px]"
          />
          <VCT_Select
            value={statusFilter}
            onChange={(v) => setStatusFilter((v as FacilityStatus) || '')}
            options={[
              { value: '', label: 'Tất cả TT' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'maintenance', label: 'Bảo trì' },
              { value: 'closed', label: 'Đóng cửa' },
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
            Thêm cơ sở
          </VCT_Button>
        </div>
      </div>

      <VCT_FilterChips className="mb-4" filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setSearch(''); setTypeFilter(''); setStatusFilter('') }} />

      {filteredItems.length === 0 ? (
        <VCT_EmptyState icon="🏢" title="Không có cơ sở" description="Thử đổi bộ lọc hoặc thêm cơ sở mới." actionLabel={can('create') ? 'Thêm cơ sở' : undefined} onAction={can('create') ? openCreateModal : undefined} />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredItems} rowKey="id" />
        </div>
      )}

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingItem ? 'Sửa cơ sở' : 'Thêm cơ sở mới'}
        width={700}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>Hủy</VCT_Button>
            <VCT_Button onClick={saveForm}>{editingItem ? 'Cập nhật' : 'Thêm'}</VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Tên cơ sở *" error={formErrors.name}><VCT_Input value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="Phòng tập A" /></VCT_Field>
          <VCT_Field label="Loại">
            <VCT_Select value={form.type} onChange={(v) => setForm((prev) => ({ ...prev, type: v as FacilityType }))} options={[
              { value: 'training_hall', label: 'Phòng tập' }, { value: 'arena', label: 'Sân đối kháng' }, { value: 'gym', label: 'Phòng gym' },
              { value: 'storage', label: 'Kho' }, { value: 'office', label: 'Văn phòng' }, { value: 'changing_room', label: 'Phòng thay đồ' }, { value: 'other', label: 'Khác' },
            ]} />
          </VCT_Field>
          <VCT_Field label="Diện tích (m²) *" error={formErrors.areaSqm}><VCT_Input type="number" value={form.areaSqm} onChange={(e) => setForm((prev) => ({ ...prev, areaSqm: e.target.value }))} /></VCT_Field>
          <VCT_Field label="Sức chứa" error={formErrors.capacity}><VCT_Input type="number" value={form.capacity} onChange={(e) => setForm((prev) => ({ ...prev, capacity: e.target.value }))} /></VCT_Field>
          <VCT_Field label="Trạng thái">
            <VCT_Select value={form.status} onChange={(v) => setForm((prev) => ({ ...prev, status: v as FacilityStatus }))} options={[
              { value: 'active', label: 'Hoạt động' }, { value: 'maintenance', label: 'Bảo trì' }, { value: 'closed', label: 'Đóng cửa' },
            ]} />
          </VCT_Field>
          <VCT_Field label="Tiền thuê / tháng (VND)"><VCT_Input type="number" value={form.monthlyRent} onChange={(e) => setForm((prev) => ({ ...prev, monthlyRent: e.target.value }))} /></VCT_Field>
          <VCT_Field label="Địa chỉ"><VCT_Input value={form.address} onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))} placeholder="Nếu khác trụ sở chính" /></VCT_Field>
          <VCT_Field label="Bảo trì kế tiếp"><VCT_Input type="date" value={form.nextMaintenanceDate} onChange={(e) => setForm((prev) => ({ ...prev, nextMaintenanceDate: e.target.value }))} /></VCT_Field>
          <div className="md:col-span-2">
            <VCT_Field label="Ghi chú"><VCT_Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Ghi chú thêm..." /></VCT_Field>
          </div>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Cơ sở sẽ bị xóa khỏi danh sách."
        preview={deleteTarget ? `${deleteTarget.name} (${FACILITY_TYPE_LABEL[deleteTarget.type]})` : undefined}
        confirmLabel="Xóa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
