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
  VCT_ProgressBar,
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
  CLASS_LEVEL_LABEL,
  CLASS_SEED,
  CLASS_STATUS_LABEL,
  DAY_LABEL,
  MEMBER_SEED,
  type ClassLevel,
  type ClassStatus,
  type ClubClass,
  type ClubClassSchedule,
  makeClubId,
  useClubStoredState,
} from './club-data'

type ClassFormState = {
  name: string
  level: ClassLevel
  coachName: string
  assistantName: string
  maxStudents: string
  currentStudents: string
  monthlyFee: string
  location: string
  status: ClassStatus
  focusText: string
  sessions: ClubClassSchedule[]
}

const createInitialForm = (): ClassFormState => ({
  name: '',
  level: 'beginner',
  coachName: '',
  assistantName: '',
  maxStudents: '20',
  currentStudents: '0',
  monthlyFee: '500000',
  location: '',
  status: 'draft',
  focusText: '',
  sessions: [{ dayOfWeek: 2, startTime: '18:00', endTime: '19:30' }],
})

const createFormFromClass = (item: ClubClass): ClassFormState => ({
  name: item.name,
  level: item.level,
  coachName: item.coachName,
  assistantName: item.assistantName ?? '',
  maxStudents: `${item.maxStudents}`,
  currentStudents: `${item.currentStudents}`,
  monthlyFee: `${item.monthlyFee}`,
  location: item.location,
  status: item.status,
  focusText: item.focus.join(', '),
  sessions: item.sessions.map((session) => ({ ...session })),
})

const parsePositiveInt = (value: string, fallback = 0) => {
  const normalized = Number.parseInt(value, 10)
  if (!Number.isFinite(normalized) || normalized < 0) return fallback
  return normalized
}

const money = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`

const STATUS_TONE: Record<ClassStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  paused: 'warning',
  draft: 'neutral',
}

export const Page_club_classes = () => {
  const [classes, setClasses] = useClubStoredState('classes', CLASS_SEED)
  const [, setMembers] = useClubStoredState('members', MEMBER_SEED)
  const [search, setSearch] = React.useState('')
  const [levelFilter, setLevelFilter] = React.useState<ClassLevel | ''>('')
  const [statusFilter, setStatusFilter] = React.useState<ClassStatus | ''>('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [editingClass, setEditingClass] = React.useState<ClubClass | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubClass | null>(null)
  const [form, setForm] = React.useState<ClassFormState>(createInitialForm())
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

  const { can, requireAction } = useRouteActionGuard('/club/classes', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const filteredClasses = React.useMemo(() => {
    let rows = classes
    if (levelFilter) rows = rows.filter((item) => item.level === levelFilter)
    if (statusFilter) rows = rows.filter((item) => item.status === statusFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.coachName.toLowerCase().includes(keyword) ||
          item.location.toLowerCase().includes(keyword) ||
          item.focus.join(' ').toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [classes, levelFilter, search, statusFilter])

  React.useEffect(() => {
    const next = new Set<string>()
    filteredClasses.forEach((item) => {
      if (selectedIds.has(item.id)) next.add(item.id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [filteredClasses, selectedIds])

  const toggleClassSelection = (classId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(classId)) next.delete(classId)
      else next.add(classId)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredClasses.map((item) => item.id)
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const openCreateModal = () => {
    if (!requireAction('create', 'tao lop hoc')) return
    setEditingClass(null)
    setForm(createInitialForm())
    setShowFormModal(true)
  }

  const openEditModal = (item: ClubClass) => {
    if (!requireAction('update', 'cap nhat lop hoc')) return
    setEditingClass(item)
    setForm(createFormFromClass(item))
    setShowFormModal(true)
  }

  const saveForm = () => {
    const name = form.name.trim()
    const coachName = form.coachName.trim()
    const location = form.location.trim()
    const maxStudents = parsePositiveInt(form.maxStudents, 0)
    const currentStudents = parsePositiveInt(form.currentStudents, 0)
    const monthlyFee = parsePositiveInt(form.monthlyFee, 0)
    const sessions = form.sessions.filter(
      (session) =>
        Number.isFinite(session.dayOfWeek) &&
        session.dayOfWeek >= 1 &&
        session.dayOfWeek <= 7 &&
        session.startTime.trim().length > 0 &&
        session.endTime.trim().length > 0
    )

    if (!name) {
      showToast('Ten lop hoc la bat buoc', 'warning')
      return
    }
    if (!coachName) {
      showToast('HLV phu trach la bat buoc', 'warning')
      return
    }
    if (!location) {
      showToast('Dia diem tap la bat buoc', 'warning')
      return
    }
    if (maxStudents <= 0) {
      showToast('Si so toi da phai lon hon 0', 'warning')
      return
    }
    if (currentStudents > maxStudents) {
      showToast('Si so hien tai khong duoc vuot qua si so toi da', 'warning')
      return
    }
    if (sessions.length === 0) {
      showToast('Can it nhat 1 buoi hoc hop le', 'warning')
      return
    }

    const focus = form.focusText
      .split(',')
      .map((token) => token.trim())
      .filter(Boolean)

    const payload: ClubClass = {
      id: editingClass?.id ?? makeClubId('CLS'),
      name,
      level: form.level,
      coachName,
      assistantName: form.assistantName.trim() || undefined,
      maxStudents,
      currentStudents,
      monthlyFee,
      location,
      status: form.status,
      focus,
      sessions,
    }

    if (editingClass) {
      setClasses((prev) =>
        prev.map((item) => (item.id === editingClass.id ? payload : item))
      )
      showToast('Da cap nhat lop hoc')
    } else {
      setClasses((prev) => [payload, ...prev])
      showToast('Da tao lop hoc moi')
    }

    setShowFormModal(false)
    setEditingClass(null)
  }

  const updateClassStatus = (classId: string, status: ClassStatus) => {
    if (!requireAction('update', 'cap nhat trang thai lop hoc')) return
    setClasses((prev) =>
      prev.map((item) => (item.id === classId ? { ...item, status } : item))
    )
    showToast('Da cap nhat trang thai lop')
  }

  const bulkSetStatus = (status: ClassStatus) => {
    if (!requireAction('update', 'cap nhat hang loat')) return
    if (selectedIds.size === 0) return
    setClasses((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status } : item
      )
    )
    showToast(`Da cap nhat ${selectedIds.size} lop hoc`)
    setSelectedIds(new Set())
  }

  const requestDelete = (item: ClubClass) => {
    if (!requireAction('delete', 'xoa lop hoc')) return
    setDeleteTarget(item)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return

    setClasses((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setMembers((prev) =>
      prev.map((member) => ({
        ...member,
        classIds: member.classIds.filter((classId) => classId !== deleteTarget.id),
      }))
    )
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    showToast(`Da xoa lop ${deleteTarget.name}`, 'info')
    setDeleteTarget(null)
  }

  const updateSession = (
    index: number,
    patch: Partial<ClubClassSchedule>
  ) => {
    setForm((prev) => {
      const next = prev.sessions.map((session, sessionIndex) =>
        sessionIndex === index ? { ...session, ...patch } : session
      )
      return { ...prev, sessions: next }
    })
  }

  const removeSession = (index: number) => {
    setForm((prev) => {
      const next = prev.sessions.filter((_, sessionIndex) => sessionIndex !== index)
      return {
        ...prev,
        sessions: next.length > 0 ? next : prev.sessions,
      }
    })
  }

  const addSession = () => {
    setForm((prev) => ({
      ...prev,
      sessions: [
        ...prev.sessions,
        { dayOfWeek: 2, startTime: '18:00', endTime: '19:30' },
      ],
    }))
  }

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (search) result.push({ key: 'search', label: 'Tim', value: search })
    if (levelFilter) {
      result.push({
        key: 'level',
        label: 'Cap lop',
        value: CLASS_LEVEL_LABEL[levelFilter],
      })
    }
    if (statusFilter) {
      result.push({
        key: 'status',
        label: 'Trang thai',
        value: CLASS_STATUS_LABEL[statusFilter],
      })
    }
    return result
  }, [levelFilter, search, statusFilter])

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('')
    if (key === 'level') setLevelFilter('')
    if (key === 'status') setStatusFilter('')
  }

  const columns = [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredClasses.length > 0 &&
              filteredClasses.every((item) => selectedIds.has(item.id))
            }
            onChange={toggleSelectAllVisible}
          />
        ),
        render: (row: ClubClass) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleClassSelection(row.id)}
          />
        ),
      },
      {
        key: 'class',
        label: 'Lop hoc',
        render: (row: ClubClass) => (
          <div>
            <div className="text-sm font-semibold">{row.name}</div>
            <div className="text-xs text-(--vct-text-secondary)">
              {row.location}
            </div>
          </div>
        ),
      },
      {
        key: 'level',
        label: 'Cap do',
        render: (row: ClubClass) => CLASS_LEVEL_LABEL[row.level],
      },
      {
        key: 'coach',
        label: 'Phu trach',
        render: (row: ClubClass) => (
          <div>
            <div className="text-sm">{row.coachName}</div>
            <div className="text-xs text-(--vct-text-secondary)">
              {row.assistantName ? `Tro giang: ${row.assistantName}` : 'Khong co tro giang'}
            </div>
          </div>
        ),
      },
      {
        key: 'sessions',
        label: 'Lich hoc',
        render: (row: ClubClass) => (
          <div className="flex max-w-[260px] flex-wrap gap-1">
            {row.sessions.map((session, index) => (
              <span
                key={`${row.id}-${index}`}
                className="rounded-md bg-(--vct-bg-card) px-2 py-1 text-[11px] text-(--vct-text-secondary)"
              >
                {DAY_LABEL(session.dayOfWeek)} {session.startTime}-{session.endTime}
              </span>
            ))}
          </div>
        ),
      },
      {
        key: 'capacity',
        label: 'Si so',
        render: (row: ClubClass) => (
          <div className="min-w-[120px]">
            <VCT_ProgressBar value={row.currentStudents} max={row.maxStudents} />
            <div className="mt-1 text-[11px] text-(--vct-text-secondary)">
              {row.currentStudents}/{row.maxStudents}
            </div>
          </div>
        ),
      },
      {
        key: 'fee',
        label: 'Hoc phi',
        align: 'right' as const,
        render: (row: ClubClass) => (
          <span className="font-semibold text-(--vct-accent-cyan)">
            {money(row.monthlyFee)}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Trang thai',
        render: (row: ClubClass) => (
          <VCT_Badge text={CLASS_STATUS_LABEL[row.status]} type={STATUS_TONE[row.status]} />
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubClass) => (
          <div className="flex justify-end gap-1">
            {row.status !== 'active' ? (
              <button
                type="button"
                onClick={() => updateClassStatus(row.id, 'active')}
                className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-500"
              >
                Kich hoat
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateClassStatus(row.id, 'paused')}
                className="rounded-md bg-amber-500/15 px-2 py-1 text-xs font-semibold text-amber-500"
              >
                Tam dung
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

  const totalStudents = classes.reduce((sum, item) => sum + item.currentStudents, 0)
  const totalCapacity = classes.reduce((sum, item) => sum + item.maxStudents, 0)
  const fillRate = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0
  const projectedRevenue = classes.reduce(
    (sum, item) =>
      item.status === 'active' ? sum + item.currentStudents * item.monthlyFee : sum,
    0
  )

  const stats: StatItem[] = [
    {
      label: 'Tong lop hoc',
      value: classes.length,
      icon: <VCT_Icons.Book size={18} />,
      color: '#0ea5e9',
    },
    {
      label: 'Lop hoat dong',
      value: classes.filter((item) => item.status === 'active').length,
      icon: <VCT_Icons.Activity size={18} />,
      color: '#10b981',
    },
    {
      label: 'Lap day trung binh',
      value: `${fillRate}%`,
      icon: <VCT_Icons.Users size={18} />,
      color: '#f59e0b',
      sub: `${totalStudents}/${totalCapacity} hoc vien`,
    },
    {
      label: 'Du bao hoc phi',
      value: money(projectedRevenue),
      icon: <VCT_Icons.DollarSign size={18} />,
      color: '#8b5cf6',
    },
  ]

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
          Quan ly lop hoc CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Quan ly lich hoc, si so, hoc phi va HLV phu trach tung lop.
        </p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      <VCT_StatusPipeline
        className="mb-4"
        stages={[
          {
            key: 'active',
            label: 'Hoat dong',
            color: '#10b981',
            count: classes.filter((item) => item.status === 'active').length,
          },
          {
            key: 'paused',
            label: 'Tam nghi',
            color: '#f59e0b',
            count: classes.filter((item) => item.status === 'paused').length,
          },
          {
            key: 'draft',
            label: 'Nhap',
            color: '#94a3b8',
            count: classes.filter((item) => item.status === 'draft').length,
          },
        ]}
        activeStage={statusFilter || null}
        onStageClick={(key) => setStatusFilter((key as ClassStatus) ?? '')}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Tim ten lop, HLV, dia diem..."
            />
          </div>
          <VCT_Select
            value={levelFilter}
            onChange={(value) => setLevelFilter((value as ClassLevel) || '')}
            options={[
              { value: '', label: 'Tat ca cap lop' },
              { value: 'beginner', label: 'Co ban' },
              { value: 'intermediate', label: 'Trung cap' },
              { value: 'advanced', label: 'Nang cao' },
              { value: 'competition', label: 'Thi dau' },
              { value: 'kids', label: 'Thieu nhi' },
            ]}
            className="min-w-[170px]"
          />
        </div>
        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
          Tao lop hoc
        </VCT_Button>
      </div>

      <VCT_FilterChips
        className="mb-4"
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={() => {
          setSearch('')
          setStatusFilter('')
          setLevelFilter('')
        }}
      />

      {filteredClasses.length === 0 ? (
        <VCT_EmptyState
          icon="📚"
          title="Khong co lop hoc phu hop"
          description="Thu doi bo loc hoac tao lop moi."
          actionLabel={can('create') ? 'Tao lop hoc' : undefined}
          onAction={can('create') ? openCreateModal : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredClasses} rowKey="id" />
        </div>
      )}

      <VCT_BulkActionsBar
        count={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Kich hoat',
            variant: 'primary',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => bulkSetStatus('active'),
          },
          {
            label: 'Tam dung',
            variant: 'secondary',
            icon: <VCT_Icons.Pause size={14} />,
            onClick: () => bulkSetStatus('paused'),
          },
          {
            label: 'Nhap',
            variant: 'secondary',
            icon: <VCT_Icons.Edit size={14} />,
            onClick: () => bulkSetStatus('draft'),
          },
        ]}
      />

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingClass ? 'Cap nhat lop hoc' : 'Tao lop hoc moi'}
        width={860}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveForm}>
              {editingClass ? 'Luu thay doi' : 'Tao lop'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Ten lop hoc">
            <VCT_Input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Co ban thieu nhi"
            />
          </VCT_Field>
          <VCT_Field label="Cap lop">
            <VCT_Select
              value={form.level}
              onChange={(value) => setForm((prev) => ({ ...prev, level: value as ClassLevel }))}
              options={[
                { value: 'beginner', label: 'Co ban' },
                { value: 'intermediate', label: 'Trung cap' },
                { value: 'advanced', label: 'Nang cao' },
                { value: 'competition', label: 'Thi dau' },
                { value: 'kids', label: 'Thieu nhi' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="HLV phu trach">
            <VCT_Input
              value={form.coachName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, coachName: event.target.value }))
              }
              placeholder="Le Quang Huy"
            />
          </VCT_Field>
          <VCT_Field label="Tro giang">
            <VCT_Input
              value={form.assistantName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, assistantName: event.target.value }))
              }
              placeholder="Do Thi Thao"
            />
          </VCT_Field>
          <VCT_Field label="Trang thai">
            <VCT_Select
              value={form.status}
              onChange={(value) => setForm((prev) => ({ ...prev, status: value as ClassStatus }))}
              options={[
                { value: 'draft', label: 'Nhap' },
                { value: 'active', label: 'Hoat dong' },
                { value: 'paused', label: 'Tam nghi' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Dia diem tap">
            <VCT_Input
              value={form.location}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, location: event.target.value }))
              }
              placeholder="Phong tap A"
            />
          </VCT_Field>
          <VCT_Field label="Si so toi da">
            <VCT_Input
              type="number"
              min={1}
              value={form.maxStudents}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, maxStudents: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Si so hien tai">
            <VCT_Input
              type="number"
              min={0}
              value={form.currentStudents}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, currentStudents: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Hoc phi (VND/thang)">
            <VCT_Input
              type="number"
              min={0}
              value={form.monthlyFee}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, monthlyFee: event.target.value }))
              }
            />
          </VCT_Field>
          <div className="md:col-span-2">
            <VCT_Field label="Nhom noi dung (phan tach dau phay)">
              <VCT_Input
                value={form.focusText}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, focusText: event.target.value }))
                }
                placeholder="Can ban cong phap, than phap, doi khang"
              />
            </VCT_Field>
          </div>
          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm font-semibold text-(--vct-text-primary)">
                Cac buoi hoc
              </div>
              <VCT_Button size="small" variant="secondary" onClick={addSession}>
                Them buoi
              </VCT_Button>
            </div>
            <div className="space-y-2">
              {form.sessions.map((session, index) => (
                <div
                  key={`session-${index}`}
                  className="grid grid-cols-1 gap-2 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-3 md:grid-cols-[140px_1fr_1fr_auto]"
                >
                  <VCT_Select
                    value={`${session.dayOfWeek}`}
                    onChange={(value) =>
                      updateSession(index, { dayOfWeek: parsePositiveInt(value, 2) })
                    }
                    options={[
                      { value: '1', label: 'Thu 2' },
                      { value: '2', label: 'Thu 3' },
                      { value: '3', label: 'Thu 4' },
                      { value: '4', label: 'Thu 5' },
                      { value: '5', label: 'Thu 6' },
                      { value: '6', label: 'Thu 7' },
                      { value: '7', label: 'Chu nhat' },
                    ]}
                  />
                  <VCT_Input
                    type="time"
                    value={session.startTime}
                    onChange={(event) =>
                      updateSession(index, { startTime: event.target.value })
                    }
                  />
                  <VCT_Input
                    type="time"
                    value={session.endTime}
                    onChange={(event) =>
                      updateSession(index, { endTime: event.target.value })
                    }
                  />
                  <VCT_Button
                    size="small"
                    variant="ghost"
                    onClick={() => removeSession(index)}
                    disabled={form.sessions.length <= 1}
                  >
                    Xoa
                  </VCT_Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xac nhan xoa lop hoc"
        message="Thao tac nay se xoa lop va huy lien ket lop trong danh sach thanh vien."
        preview={deleteTarget ? `${deleteTarget.name} (${deleteTarget.id})` : undefined}
        confirmLabel="Xoa lop"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
