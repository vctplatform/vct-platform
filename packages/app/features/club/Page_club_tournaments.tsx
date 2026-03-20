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
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useRouteActionGuard } from '../hooks/use-route-action-guard'
import {
  TOURNAMENT_SEED,
  TOURNAMENT_STATUS_LABEL,
  TOURNAMENT_STATUS_TONE,
  type ClubTournament,
  type TournamentStatus,
  makeClubId,
  useClubStoredState,
} from './club-data'

type TournamentFormState = {
  name: string
  startDate: string
  endDate: string
  location: string
  status: TournamentStatus
  registeredAthletes: string
  events: string
  leadCoach: string
  gold: string
  silver: string
  bronze: string
}

const createInitialForm = (): TournamentFormState => ({
  name: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  location: '',
  status: 'registration',
  registeredAthletes: '0',
  events: '1',
  leadCoach: '',
  gold: '0',
  silver: '0',
  bronze: '0',
})

const parsePositiveInt = (value: string, fallback = 0) => {
  const normalized = Number.parseInt(value, 10)
  if (!Number.isFinite(normalized) || normalized < 0) return fallback
  return normalized
}

const toFormState = (item: ClubTournament): TournamentFormState => ({
  name: item.name,
  startDate: item.startDate,
  endDate: item.endDate,
  location: item.location,
  status: item.status,
  registeredAthletes: `${item.registeredAthletes}`,
  events: `${item.events}`,
  leadCoach: item.leadCoach,
  gold: `${item.medals.gold}`,
  silver: `${item.medals.silver}`,
  bronze: `${item.medals.bronze}`,
})

export const Page_club_tournaments = () => {
  const [tournaments, setTournaments] = useClubStoredState('tournaments', TOURNAMENT_SEED)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<TournamentStatus | ''>('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [editingTournament, setEditingTournament] = React.useState<ClubTournament | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubTournament | null>(null)
  const [form, setForm] = React.useState<TournamentFormState>(createInitialForm())
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

  const { can, requireAction } = useRouteActionGuard('/club/tournaments', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const filteredTournaments = React.useMemo(() => {
    let rows = tournaments
    if (statusFilter) rows = rows.filter((item) => item.status === statusFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.location.toLowerCase().includes(keyword) ||
          item.leadCoach.toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [search, statusFilter, tournaments])

  React.useEffect(() => {
    const next = new Set<string>()
    filteredTournaments.forEach((item) => {
      if (selectedIds.has(item.id)) next.add(item.id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [filteredTournaments, selectedIds])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredTournaments.map((item) => item.id)
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openCreateModal = () => {
    if (!requireAction('create', 'tao giai dau')) return
    setEditingTournament(null)
    setForm(createInitialForm())
    setShowFormModal(true)
  }

  const openEditModal = (item: ClubTournament) => {
    if (!requireAction('update', 'cap nhat giai dau')) return
    setEditingTournament(item)
    setForm(toFormState(item))
    setShowFormModal(true)
  }

  const saveForm = () => {
    const name = form.name.trim()
    const location = form.location.trim()
    const leadCoach = form.leadCoach.trim()
    const registeredAthletes = parsePositiveInt(form.registeredAthletes, 0)
    const events = parsePositiveInt(form.events, 0)
    const gold = parsePositiveInt(form.gold, 0)
    const silver = parsePositiveInt(form.silver, 0)
    const bronze = parsePositiveInt(form.bronze, 0)

    if (!name) {
      showToast('Ten giai dau la bat buoc', 'warning')
      return
    }
    if (!form.startDate || !form.endDate) {
      showToast('Ngay bat dau va ket thuc la bat buoc', 'warning')
      return
    }
    if (form.endDate < form.startDate) {
      showToast('Ngay ket thuc khong duoc som hon ngay bat dau', 'warning')
      return
    }
    if (!location) {
      showToast('Dia diem thi dau la bat buoc', 'warning')
      return
    }
    if (!leadCoach) {
      showToast('HLV phu trach la bat buoc', 'warning')
      return
    }

    const payload: ClubTournament = {
      id: editingTournament?.id ?? makeClubId('TRM'),
      name,
      startDate: form.startDate,
      endDate: form.endDate,
      location,
      status: form.status,
      registeredAthletes,
      events,
      leadCoach,
      medals: { gold, silver, bronze },
    }

    if (editingTournament) {
      setTournaments((prev) =>
        prev.map((item) => (item.id === editingTournament.id ? payload : item))
      )
      showToast('Da cap nhat giai dau')
    } else {
      setTournaments((prev) => [payload, ...prev])
      showToast('Da tao giai dau moi')
    }

    setShowFormModal(false)
    setEditingTournament(null)
  }

  const requestDelete = (item: ClubTournament) => {
    if (!requireAction('delete', 'xoa giai dau')) return
    setDeleteTarget(item)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setTournaments((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    showToast(`Da xoa giai ${deleteTarget.name}`, 'info')
    setDeleteTarget(null)
  }

  const setTournamentStatus = (id: string, status: TournamentStatus) => {
    if (!requireAction('update', 'cap nhat trang thai giai dau')) return
    setTournaments((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    )
    showToast('Da cap nhat trang thai giai dau')
  }

  const bulkSetStatus = (status: TournamentStatus) => {
    if (!requireAction('update', 'cap nhat hang loat')) return
    if (selectedIds.size === 0) return
    setTournaments((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status } : item
      )
    )
    showToast(`Da cap nhat ${selectedIds.size} giai dau`)
    setSelectedIds(new Set())
  }

  const columns = [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredTournaments.length > 0 &&
              filteredTournaments.every((item) => selectedIds.has(item.id))
            }
            onChange={toggleSelectAllVisible}
          />
        ),
        render: (row: ClubTournament) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelection(row.id)}
          />
        ),
      },
      {
        key: 'name',
        label: 'Giai dau',
        render: (row: ClubTournament) => (
          <div>
            <div className="text-sm font-semibold">{row.name}</div>
            <div className="text-xs text-(--vct-text-secondary)">
              {row.location}
            </div>
          </div>
        ),
      },
      {
        key: 'period',
        label: 'Thoi gian',
        render: (row: ClubTournament) => (
          <div className="text-xs text-(--vct-text-secondary)">
            <div>{row.startDate}</div>
            <div>{row.endDate}</div>
          </div>
        ),
      },
      {
        key: 'registration',
        label: 'Dang ky',
        render: (row: ClubTournament) => (
          <span className="text-sm">
            {row.registeredAthletes} VDV • {row.events} noi dung
          </span>
        ),
      },
      {
        key: 'coach',
        label: 'HLV phu trach',
        render: (row: ClubTournament) => row.leadCoach,
      },
      {
        key: 'medals',
        label: 'Huy chuong',
        render: (row: ClubTournament) => (
          <span className="text-xs text-(--vct-text-secondary)">
            🥇{row.medals.gold} • 🥈{row.medals.silver} • 🥉{row.medals.bronze}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Trang thai',
        render: (row: ClubTournament) => (
          <VCT_Badge
            text={TOURNAMENT_STATUS_LABEL[row.status]}
            type={TOURNAMENT_STATUS_TONE[row.status]}
          />
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubTournament) => (
          <div className="flex justify-end gap-1">
            {row.status === 'registration' ? (
              <button
                type="button"
                onClick={() => setTournamentStatus(row.id, 'upcoming')}
                className="rounded-md bg-sky-500/15 px-2 py-1 text-xs font-semibold text-sky-500"
              >
                Chot dang ky
              </button>
            ) : row.status === 'upcoming' ? (
              <button
                type="button"
                onClick={() => setTournamentStatus(row.id, 'ongoing')}
                className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-500"
              >
                Bat dau
              </button>
            ) : row.status === 'ongoing' ? (
              <button
                type="button"
                onClick={() => setTournamentStatus(row.id, 'completed')}
                className="rounded-md bg-violet-500/15 px-2 py-1 text-xs font-semibold text-violet-500"
              >
                Hoan tat
              </button>
            ) : null}
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

  const totalRegisteredAthletes = tournaments.reduce(
    (sum, item) => sum + item.registeredAthletes,
    0
  )
  const medalSummary = tournaments.reduce(
    (acc, item) => ({
      gold: acc.gold + item.medals.gold,
      silver: acc.silver + item.medals.silver,
      bronze: acc.bronze + item.medals.bronze,
    }),
    { gold: 0, silver: 0, bronze: 0 }
  )

  const stats: StatItem[] = [
    {
      label: 'Tong giai dau',
      value: tournaments.length,
      icon: <VCT_Icons.Trophy size={18} />,
      color: '#0ea5e9',
    },
    {
      label: 'Dang mo/chu bi',
      value: tournaments.filter(
        (item) => item.status === 'registration' || item.status === 'upcoming'
      ).length,
      icon: <VCT_Icons.Calendar size={18} />,
      color: '#10b981',
    },
    {
      label: 'Tong VDV dang ky',
      value: totalRegisteredAthletes,
      icon: <VCT_Icons.Users size={18} />,
      color: '#f59e0b',
    },
    {
      label: 'Tong huy chuong',
      value: medalSummary.gold + medalSummary.silver + medalSummary.bronze,
      icon: <VCT_Icons.Medal size={18} />,
      color: '#8b5cf6',
      sub: `G:${medalSummary.gold} S:${medalSummary.silver} B:${medalSummary.bronze}`,
    },
  ]

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (search) result.push({ key: 'search', label: 'Tim', value: search })
    if (statusFilter) {
      result.push({
        key: 'status',
        label: 'Trang thai',
        value: TOURNAMENT_STATUS_LABEL[statusFilter],
      })
    }
    return result
  }, [search, statusFilter])

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('')
    if (key === 'status') setStatusFilter('')
  }

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
          Quan ly giai dau CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Theo doi cac giai tham gia, dang ky VDV va tong ket huy chuong.
        </p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      <VCT_StatusPipeline
        className="mb-4"
        stages={[
          {
            key: 'registration',
            label: 'Dang ky',
            color: '#f59e0b',
            count: tournaments.filter((item) => item.status === 'registration').length,
          },
          {
            key: 'upcoming',
            label: 'Sap toi',
            color: '#0ea5e9',
            count: tournaments.filter((item) => item.status === 'upcoming').length,
          },
          {
            key: 'ongoing',
            label: 'Dang thi',
            color: '#10b981',
            count: tournaments.filter((item) => item.status === 'ongoing').length,
          },
          {
            key: 'completed',
            label: 'Da xong',
            color: '#94a3b8',
            count: tournaments.filter((item) => item.status === 'completed').length,
          },
        ]}
        activeStage={statusFilter || null}
        onStageClick={(key) => setStatusFilter((key as TournamentStatus) ?? '')}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Tim ten giai, dia diem, HLV..."
            />
          </div>
        </div>
        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
          Tao giai dau
        </VCT_Button>
      </div>

      <VCT_FilterChips
        className="mb-4"
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={() => {
          setSearch('')
          setStatusFilter('')
        }}
      />

      {filteredTournaments.length === 0 ? (
        <VCT_EmptyState
          icon="🏆"
          title="Khong co giai dau phu hop"
          description="Thu doi bo loc hoac tao giai dau moi."
          actionLabel={can('create') ? 'Tao giai dau' : undefined}
          onAction={can('create') ? openCreateModal : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredTournaments} rowKey="id" />
        </div>
      )}

      <VCT_BulkActionsBar
        count={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Mo dang ky',
            variant: 'secondary',
            icon: <VCT_Icons.Edit size={14} />,
            onClick: () => bulkSetStatus('registration'),
          },
          {
            label: 'Sap toi',
            variant: 'primary',
            icon: <VCT_Icons.Calendar size={14} />,
            onClick: () => bulkSetStatus('upcoming'),
          },
          {
            label: 'Hoan tat',
            variant: 'secondary',
            icon: <VCT_Icons.CheckCircle size={14} />,
            onClick: () => bulkSetStatus('completed'),
          },
        ]}
      />

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingTournament ? 'Cap nhat giai dau' : 'Tao giai dau moi'}
        width={860}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveForm}>
              {editingTournament ? 'Luu thay doi' : 'Tao giai'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <VCT_Field label="Ten giai dau">
              <VCT_Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Giai tre thanh pho 2026"
              />
            </VCT_Field>
          </div>
          <VCT_Field label="Ngay bat dau">
            <VCT_Input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, startDate: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Ngay ket thuc">
            <VCT_Input
              type="date"
              value={form.endDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, endDate: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Dia diem">
            <VCT_Input
              value={form.location}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
              placeholder="Nha thi dau Phu Tho"
            />
          </VCT_Field>
          <VCT_Field label="Trang thai">
            <VCT_Select
              value={form.status}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as TournamentStatus }))
              }
              options={[
                { value: 'registration', label: 'Dang dang ky' },
                { value: 'upcoming', label: 'Sap dien ra' },
                { value: 'ongoing', label: 'Dang thi dau' },
                { value: 'completed', label: 'Da ket thuc' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="HLV phu trach">
            <VCT_Input
              value={form.leadCoach}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, leadCoach: event.target.value }))
              }
              placeholder="Le Quang Huy"
            />
          </VCT_Field>
          <VCT_Field label="VDV dang ky">
            <VCT_Input
              type="number"
              min={0}
              value={form.registeredAthletes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, registeredAthletes: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Noi dung thi dau">
            <VCT_Input
              type="number"
              min={1}
              value={form.events}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, events: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Huy chuong vang">
            <VCT_Input
              type="number"
              min={0}
              value={form.gold}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, gold: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Huy chuong bac">
            <VCT_Input
              type="number"
              min={0}
              value={form.silver}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, silver: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Huy chuong dong">
            <VCT_Input
              type="number"
              min={0}
              value={form.bronze}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, bronze: event.target.value }))
              }
            />
          </VCT_Field>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xac nhan xoa giai dau"
        message="Thao tac nay se xoa giai dau khoi danh sach theo doi cua CLB."
        preview={deleteTarget ? `${deleteTarget.name} (${deleteTarget.id})` : undefined}
        confirmLabel="Xoa giai"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
