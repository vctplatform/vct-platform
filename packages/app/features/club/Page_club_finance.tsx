'use client'

import * as React from 'react'
import {
  VCT_Badge,
  VCT_BulkActionsBar,
  VCT_Button,
  VCT_ConfirmDialog,
  VCT_EmptyState,
  VCT_Field,
  VCT_FilterChips,
  VCT_Input,
  VCT_Modal,
  VCT_SearchInput,
  VCT_Select,
  VCT_StatusPipeline,
  VCT_Table,
  VCT_Toast,
} from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useRouteActionGuard } from '../hooks/use-route-action-guard'
import {
  FINANCE_ENTRY_SEED,
  FINANCE_TYPE_LABEL,
  calculateFinanceSummary,
  type ClubFinanceEntry,
  type FinanceMethod,
  type FinanceStatus,
  type FinanceType,
  makeClubId,
  useClubStoredState,
  useMonthlyNetByMonth,
} from './club-data'

type FinanceFormState = {
  type: FinanceType
  category: string
  amount: string
  date: string
  description: string
  recordedBy: string
  method: FinanceMethod
  status: FinanceStatus
}

const METHOD_LABEL: Record<FinanceMethod, string> = {
  cash: 'Tien mat',
  bank: 'Chuyen khoan',
  qr: 'QR',
}

const STATUS_LABEL: Record<FinanceStatus, string> = {
  posted: 'Da ghi so',
  pending: 'Cho doi',
}

const STATUS_TONE: Record<FinanceStatus, 'success' | 'warning'> = {
  posted: 'success',
  pending: 'warning',
}

const TYPE_ICON: Record<FinanceType, string> = {
  income: '📈',
  expense: '📉',
}

const createInitialForm = (): FinanceFormState => ({
  type: 'income',
  category: '',
  amount: '0',
  date: new Date().toISOString().slice(0, 10),
  description: '',
  recordedBy: '',
  method: 'bank',
  status: 'pending',
})

const toFormState = (entry: ClubFinanceEntry): FinanceFormState => ({
  type: entry.type,
  category: entry.category,
  amount: `${entry.amount}`,
  date: entry.date,
  description: entry.description,
  recordedBy: entry.recordedBy,
  method: entry.method,
  status: entry.status,
})

const money = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`

const parsePositiveInt = (value: string, fallback = 0) => {
  const normalized = Number.parseInt(value, 10)
  if (!Number.isFinite(normalized) || normalized < 0) return fallback
  return normalized
}

export const Page_club_finance = () => {
  const [entries, setEntries] = useClubStoredState('finance', FINANCE_ENTRY_SEED)
  const [search, setSearch] = React.useState('')
  const [typeFilter, setTypeFilter] = React.useState<FinanceType | ''>('')
  const [statusFilter, setStatusFilter] = React.useState<FinanceStatus | ''>('')
  const [methodFilter, setMethodFilter] = React.useState<FinanceMethod | ''>('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [editingEntry, setEditingEntry] = React.useState<ClubFinanceEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubFinanceEntry | null>(null)
  const [form, setForm] = React.useState<FinanceFormState>(createInitialForm())
  const [toast, setToast] = React.useState({
    show: false,
    msg: '',
    type: 'success' as 'success' | 'warning' | 'error' | 'info',
  })

  const showToast = React.useCallback(
    (msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
      setToast({ show: true, msg, type })
    },
    []
  )

  const { can, requireAction } = useRouteActionGuard('/club/finance', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const summary = React.useMemo(() => calculateFinanceSummary(entries), [entries])
  const monthlyNet = useMonthlyNetByMonth(entries)

  const filteredEntries = React.useMemo(() => {
    let rows = entries
    if (typeFilter) rows = rows.filter((item) => item.type === typeFilter)
    if (statusFilter) rows = rows.filter((item) => item.status === statusFilter)
    if (methodFilter) rows = rows.filter((item) => item.method === methodFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.description.toLowerCase().includes(keyword) ||
          item.category.toLowerCase().includes(keyword) ||
          item.recordedBy.toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [entries, methodFilter, search, statusFilter, typeFilter])

  React.useEffect(() => {
    const next = new Set<string>()
    filteredEntries.forEach((item) => {
      if (selectedIds.has(item.id)) next.add(item.id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [filteredEntries, selectedIds])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredEntries.map((item) => item.id)
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openCreateModal = () => {
    if (!requireAction('create', 'tao giao dich')) return
    setEditingEntry(null)
    setForm(createInitialForm())
    setShowFormModal(true)
  }

  const openEditModal = (entry: ClubFinanceEntry) => {
    if (!requireAction('update', 'cap nhat giao dich')) return
    setEditingEntry(entry)
    setForm(toFormState(entry))
    setShowFormModal(true)
  }

  const saveForm = () => {
    const category = form.category.trim()
    const description = form.description.trim()
    const recordedBy = form.recordedBy.trim()
    const amount = parsePositiveInt(form.amount, 0)

    if (!category) {
      showToast('Danh muc giao dich la bat buoc', 'warning')
      return
    }
    if (!form.date) {
      showToast('Ngay giao dich la bat buoc', 'warning')
      return
    }
    if (!description) {
      showToast('Mo ta giao dich la bat buoc', 'warning')
      return
    }
    if (!recordedBy) {
      showToast('Nguoi ghi nhan la bat buoc', 'warning')
      return
    }
    if (amount <= 0) {
      showToast('So tien phai lon hon 0', 'warning')
      return
    }

    const payload: ClubFinanceEntry = {
      id: editingEntry?.id ?? makeClubId('FIN'),
      type: form.type,
      category,
      amount,
      date: form.date,
      description,
      recordedBy,
      method: form.method,
      status: form.status,
    }

    if (editingEntry) {
      setEntries((prev) =>
        prev.map((item) => (item.id === editingEntry.id ? payload : item))
      )
      showToast('Da cap nhat giao dich')
    } else {
      setEntries((prev) => [payload, ...prev])
      showToast('Da tao giao dich moi')
    }

    setShowFormModal(false)
    setEditingEntry(null)
  }

  const requestDelete = (entry: ClubFinanceEntry) => {
    if (!requireAction('delete', 'xoa giao dich')) return
    setDeleteTarget(entry)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setEntries((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    showToast('Da xoa giao dich', 'info')
    setDeleteTarget(null)
  }

  const setEntryStatus = (id: string, status: FinanceStatus) => {
    if (!requireAction('update', 'cap nhat trang thai giao dich')) return
    setEntries((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    )
    showToast('Da cap nhat trang thai giao dich')
  }

  const bulkSetStatus = (status: FinanceStatus) => {
    if (!requireAction('update', 'cap nhat hang loat giao dich')) return
    if (selectedIds.size === 0) return
    setEntries((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status } : item
      )
    )
    showToast(`Da cap nhat ${selectedIds.size} giao dich`)
    setSelectedIds(new Set())
  }

  const columns = [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredEntries.length > 0 &&
              filteredEntries.every((item) => selectedIds.has(item.id))
            }
            onChange={toggleSelectAllVisible}
          />
        ),
        render: (row: ClubFinanceEntry) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelection(row.id)}
          />
        ),
      },
      {
        key: 'type',
        label: 'Loai',
        render: (row: ClubFinanceEntry) => (
          <span className="text-sm">
            {TYPE_ICON[row.type]}{' '}
            <span
              className={row.type === 'income' ? 'text-emerald-500' : 'text-red-500'}
            >
              {FINANCE_TYPE_LABEL[row.type]}
            </span>
          </span>
        ),
      },
      {
        key: 'detail',
        label: 'Noi dung',
        render: (row: ClubFinanceEntry) => (
          <div>
            <div className="text-sm font-semibold">{row.description}</div>
            <div className="text-xs text-(--vct-text-secondary)">
              {row.category} • {row.date}
            </div>
          </div>
        ),
      },
      {
        key: 'amount',
        label: 'So tien',
        align: 'right' as const,
        render: (row: ClubFinanceEntry) => (
          <span
            className={
              row.type === 'income'
                ? 'font-semibold text-emerald-500'
                : 'font-semibold text-red-500'
            }
          >
            {row.type === 'income' ? '+' : '-'}
            {money(row.amount)}
          </span>
        ),
      },
      {
        key: 'method',
        label: 'Hinh thuc',
        render: (row: ClubFinanceEntry) => METHOD_LABEL[row.method],
      },
      {
        key: 'recordedBy',
        label: 'Nguoi ghi',
        render: (row: ClubFinanceEntry) => row.recordedBy,
      },
      {
        key: 'status',
        label: 'Trang thai',
        render: (row: ClubFinanceEntry) => (
          <VCT_Badge text={STATUS_LABEL[row.status]} type={STATUS_TONE[row.status]} />
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubFinanceEntry) => (
          <div className="flex justify-end gap-1">
            {row.status !== 'posted' ? (
              <button
                type="button"
                onClick={() => setEntryStatus(row.id, 'posted')}
                className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-500"
              >
                Ghi so
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setEntryStatus(row.id, 'pending')}
                className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-500"
              >
                Cho doi
              </button>
            )}
            {can('update') ? (
              <button
                type="button"
                onClick={() => openEditModal(row)}
                className="rounded-md bg-(--vct-bg-input) px-2 py-1 text-xs font-semibold"
              >
                Sua
              </button>
            ) : null}
            {can('delete') ? (
              <button
                type="button"
                onClick={() => requestDelete(row)}
                className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500"
              >
                Xoa
              </button>
            ) : null}
          </div>
        ),
      },
    ]

  const stats: StatItem[] = [
    {
      label: 'Tong thu',
      value: money(summary.totalIncome),
      icon: <VCT_Icons.TrendingUp size={18} />,
      color: 'var(--vct-success)',
    },
    {
      label: 'Tong chi',
      value: money(summary.totalExpense),
      icon: <VCT_Icons.TrendingDown size={18} />,
      color: 'var(--vct-danger)',
    },
    {
      label: 'So du hien tai',
      value: money(summary.balance),
      icon: <VCT_Icons.DollarSign size={18} />,
      color: summary.balance < 0 ? 'var(--vct-danger)' : 'var(--vct-accent-cyan)',
      sub: `Cho doi: ${money(summary.pending)}`,
    },
    {
      label: 'So giao dich',
      value: entries.length,
      icon: <VCT_Icons.FileText size={18} />,
      color: 'var(--vct-info)',
    },
  ]

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (search) result.push({ key: 'search', label: 'Tim', value: search })
    if (typeFilter) {
      result.push({
        key: 'type',
        label: 'Loai',
        value: FINANCE_TYPE_LABEL[typeFilter],
      })
    }
    if (statusFilter) {
      result.push({ key: 'status', label: 'Trang thai', value: STATUS_LABEL[statusFilter] })
    }
    if (methodFilter) {
      result.push({ key: 'method', label: 'Hinh thuc', value: METHOD_LABEL[methodFilter] })
    }
    return result
  }, [methodFilter, search, statusFilter, typeFilter])

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('')
    if (key === 'type') setTypeFilter('')
    if (key === 'status') setStatusFilter('')
    if (key === 'method') setMethodFilter('')
  }

  const maxAbsMonthly = Math.max(
    1,
    ...monthlyNet.map((item) => Math.abs(item.value))
  )

  return (
    <VCT_PageContainer size="wide" animated>
      <VCT_Toast
        isVisible={toast.show}
        message={toast.msg}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, show: false }))}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">
          Quan ly tai chinh CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          So thu chi, cong no giao dich va tong quan dong tien theo thang.
        </p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      <VCT_StatusPipeline
        className="mb-4"
        stages={[
          {
            key: 'posted',
            label: 'Da ghi so',
            color: 'var(--vct-success)',
            count: entries.filter((item) => item.status === 'posted').length,
          },
          {
            key: 'pending',
            label: 'Cho doi',
            color: 'var(--vct-warning)',
            count: entries.filter((item) => item.status === 'pending').length,
          },
        ]}
        activeStage={statusFilter || null}
        onStageClick={(key) => setStatusFilter((key as FinanceStatus) ?? '')}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Tim mo ta, danh muc, nguoi ghi..."
            />
          </div>
          <VCT_Select
            value={typeFilter}
            onChange={(value) => setTypeFilter((value as FinanceType) || '')}
            options={[
              { value: '', label: 'Tat ca loai' },
              { value: 'income', label: 'Thu' },
              { value: 'expense', label: 'Chi' },
            ]}
            className="min-w-[140px]"
          />
          <VCT_Select
            value={methodFilter}
            onChange={(value) => setMethodFilter((value as FinanceMethod) || '')}
            options={[
              { value: '', label: 'Tat ca hinh thuc' },
              { value: 'bank', label: 'Chuyen khoan' },
              { value: 'cash', label: 'Tien mat' },
              { value: 'qr', label: 'QR' },
            ]}
            className="min-w-[160px]"
          />
        </div>
        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
          Ghi thu/chi
        </VCT_Button>
      </div>

      <VCT_FilterChips
        className="mb-4"
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={() => {
          setSearch('')
          setTypeFilter('')
          setStatusFilter('')
          setMethodFilter('')
        }}
      />

      <div className="mb-4 rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
        <div className="mb-3 text-sm font-semibold text-(--vct-text-primary)">
          Dong tien theo thang
        </div>
        {monthlyNet.length === 0 ? (
          <div className="text-xs text-(--vct-text-secondary)">Chua co du lieu.</div>
        ) : (
          <div className="flex items-end gap-2 overflow-x-auto">
            {monthlyNet.map((item) => {
              const normalized = Math.max(8, Math.round((Math.abs(item.value) / maxAbsMonthly) * 110))
              const positive = item.value >= 0
              return (
                <div key={item.month} className="flex min-w-[78px] flex-col items-center gap-1">
                  <div
                    className={`w-8 rounded-t-md ${positive ? 'bg-emerald-500/70' : 'bg-red-500/70'}`}
                    style={{ height: `${normalized}px` }}
                    title={`${item.month}: ${money(item.value)}`}
                  />
                  <div className="text-[11px] text-(--vct-text-secondary)">{item.month}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {filteredEntries.length === 0 ? (
        <VCT_EmptyState
          icon="💰"
          title="Khong co giao dich phu hop"
          description="Thu doi bo loc hoac them giao dich moi."
          actionLabel={can('create') ? 'Ghi thu/chi' : undefined}
          onAction={can('create') ? openCreateModal : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredEntries} rowKey="id" />
        </div>
      )}

      <VCT_BulkActionsBar
        count={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Ghi so',
            variant: 'primary',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => bulkSetStatus('posted'),
          },
          {
            label: 'Cho doi',
            variant: 'secondary',
            icon: <VCT_Icons.Clock size={14} />,
            onClick: () => bulkSetStatus('pending'),
          },
        ]}
      />

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingEntry ? 'Cap nhat giao dich' : 'Tao giao dich moi'}
        width={820}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveForm}>
              {editingEntry ? 'Luu thay doi' : 'Tao giao dich'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Loai giao dich">
            <VCT_Select
              value={form.type}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, type: value as FinanceType }))
              }
              options={[
                { value: 'income', label: 'Thu' },
                { value: 'expense', label: 'Chi' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Trang thai">
            <VCT_Select
              value={form.status}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as FinanceStatus }))
              }
              options={[
                { value: 'pending', label: 'Cho doi' },
                { value: 'posted', label: 'Da ghi so' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Danh muc">
            <VCT_Input
              value={form.category}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, category: event.target.value }))
              }
              placeholder="Hoc phi / Trang thiet bi / Thue mat bang..."
            />
          </VCT_Field>
          <VCT_Field label="Hinh thuc">
            <VCT_Select
              value={form.method}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, method: value as FinanceMethod }))
              }
              options={[
                { value: 'bank', label: 'Chuyen khoan' },
                { value: 'cash', label: 'Tien mat' },
                { value: 'qr', label: 'QR' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="So tien">
            <VCT_Input
              type="number"
              min={1}
              value={form.amount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, amount: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Ngay giao dich">
            <VCT_Input
              type="date"
              value={form.date}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, date: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Nguoi ghi nhan">
            <VCT_Input
              value={form.recordedBy}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, recordedBy: event.target.value }))
              }
              placeholder="Nguyen Van Phu"
            />
          </VCT_Field>
          <div className="md:col-span-2">
            <VCT_Field label="Mo ta">
              <VCT_Input
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Noi dung thu/chi..."
              />
            </VCT_Field>
          </div>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xac nhan xoa giao dich"
        message="Thao tac nay se xoa giao dich khoi so thu chi CLB."
        preview={
          deleteTarget
            ? `${FINANCE_TYPE_LABEL[deleteTarget.type]} • ${money(deleteTarget.amount)}`
            : undefined
        }
        confirmLabel="Xoa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
