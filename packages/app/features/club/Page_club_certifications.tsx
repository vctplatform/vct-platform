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
  VCT_Table,
  VCT_Toast,
} from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useRouteActionGuard } from '../hooks/use-route-action-guard'
import {
  BELT_EMOJI,
  BELT_EXAM_SEED,
  BELT_LABEL,
  CERTIFICATION_SEED,
  MEMBER_SEED,
  type BeltRank,
  type ClubCertificationRecord,
  makeClubId,
  useClubStoredState,
} from './club-data'

type CertResult = 'pass' | 'fail'

type CertificationFormState = {
  memberId: string
  memberName: string
  fromRank: BeltRank
  toRank: BeltRank
  examDate: string
  examCode: string
  result: CertResult
  issuedBy: string
}

const RESULT_LABEL: Record<CertResult, string> = {
  pass: 'Dat',
  fail: 'Khong dat',
}

const RESULT_TONE: Record<CertResult, 'success' | 'danger'> = {
  pass: 'success',
  fail: 'danger',
}

const BELT_ORDER: BeltRank[] = ['white', 'yellow', 'green', 'blue', 'red', 'black']

const createInitialForm = (): CertificationFormState => ({
  memberId: '',
  memberName: '',
  fromRank: 'white',
  toRank: 'yellow',
  examDate: new Date().toISOString().slice(0, 10),
  examCode: '',
  result: 'pass',
  issuedBy: '',
})

const toFormState = (record: ClubCertificationRecord): CertificationFormState => ({
  memberId: '',
  memberName: record.memberName,
  fromRank: record.fromRank,
  toRank: record.toRank,
  examDate: record.examDate,
  examCode: record.examCode,
  result: record.result,
  issuedBy: record.issuedBy,
})

const beltLabel = (rank: BeltRank) => `${BELT_EMOJI[rank]} ${BELT_LABEL[rank]}`

const getNextBeltRank = (rank: BeltRank): BeltRank => {
  const index = BELT_ORDER.indexOf(rank)
  if (index < 0) return rank
  return BELT_ORDER[Math.min(index + 1, BELT_ORDER.length - 1)] ?? rank
}

export const Page_club_certifications = () => {
  const [records, setRecords] = useClubStoredState('certifications', CERTIFICATION_SEED)
  const [members, setMembers] = useClubStoredState('members', MEMBER_SEED)
  const [beltExams] = useClubStoredState('belt-exams', BELT_EXAM_SEED)
  const [search, setSearch] = React.useState('')
  const [resultFilter, setResultFilter] = React.useState<CertResult | ''>('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [editingRecord, setEditingRecord] = React.useState<ClubCertificationRecord | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubCertificationRecord | null>(null)
  const [form, setForm] = React.useState<CertificationFormState>(createInitialForm())
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

  const { can, requireAction } = useRouteActionGuard('/club/certifications', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const memberById = React.useMemo(() => {
    const map = new Map<string, (typeof members)[number]>()
    members.forEach((member) => map.set(member.id, member))
    return map
  }, [members])

  const filteredRecords = React.useMemo(() => {
    let rows = records
    if (resultFilter) rows = rows.filter((item) => item.result === resultFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.memberName.toLowerCase().includes(keyword) ||
          item.examCode.toLowerCase().includes(keyword) ||
          item.issuedBy.toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [records, resultFilter, search])

  React.useEffect(() => {
    const next = new Set<string>()
    filteredRecords.forEach((item) => {
      if (selectedIds.has(item.id)) next.add(item.id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [filteredRecords, selectedIds])

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredRecords.map((item) => item.id)
    const allSelected = visibleIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openCreateModal = () => {
    if (!requireAction('create', 'tao ho so chung nhan')) return
    setEditingRecord(null)
    setForm(createInitialForm())
    setShowFormModal(true)
  }

  const openEditModal = (record: ClubCertificationRecord) => {
    if (!requireAction('update', 'cap nhat ho so chung nhan')) return
    const member = members.find((item) => item.fullName === record.memberName)
    setEditingRecord(record)
    setForm({
      ...toFormState(record),
      memberId: member?.id ?? '',
    })
    setShowFormModal(true)
  }

  const onMemberSelect = (memberId: string) => {
    const member = memberById.get(memberId)
    setForm((prev) => ({
      ...prev,
      memberId,
      memberName: member?.fullName ?? prev.memberName,
      fromRank: member?.beltRank ?? prev.fromRank,
      toRank: member ? getNextBeltRank(member.beltRank) : prev.toRank,
    }))
  }

  const saveForm = () => {
    const memberName = form.memberName.trim()
    const examCode = form.examCode.trim()
    const issuedBy = form.issuedBy.trim()

    if (!memberName) {
      showToast('Ten vo sinh la bat buoc', 'warning')
      return
    }
    if (!form.examDate) {
      showToast('Ngay thi la bat buoc', 'warning')
      return
    }
    if (!examCode) {
      showToast('Ma ky thi la bat buoc', 'warning')
      return
    }
    if (!issuedBy) {
      showToast('Noi cap/nguoi cap la bat buoc', 'warning')
      return
    }
    if (form.fromRank === form.toRank && form.result === 'pass') {
      showToast('Dai moi phai khac dai hien tai khi ket qua la dat', 'warning')
      return
    }

    const payload: ClubCertificationRecord = {
      id: editingRecord?.id ?? makeClubId('CRT'),
      memberName,
      fromRank: form.fromRank,
      toRank: form.toRank,
      examDate: form.examDate,
      examCode,
      result: form.result,
      issuedBy,
    }

    if (editingRecord) {
      setRecords((prev) =>
        prev.map((item) => (item.id === editingRecord.id ? payload : item))
      )
      showToast('Da cap nhat ho so chung nhan')
    } else {
      setRecords((prev) => [payload, ...prev])
      showToast('Da tao ho so chung nhan moi')
    }

    if (payload.result === 'pass' && form.memberId) {
      setMembers((prev) =>
        prev.map((member) =>
          member.id === form.memberId ? { ...member, beltRank: payload.toRank } : member
        )
      )
    }

    setShowFormModal(false)
    setEditingRecord(null)
  }

  const requestDelete = (record: ClubCertificationRecord) => {
    if (!requireAction('delete', 'xoa ho so chung nhan')) return
    setDeleteTarget(record)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setRecords((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    showToast('Da xoa ho so chung nhan', 'info')
    setDeleteTarget(null)
  }

  const bulkSetResult = (result: CertResult) => {
    if (!requireAction('update', 'cap nhat hang loat ket qua')) return
    if (selectedIds.size === 0) return
    setRecords((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, result } : item
      )
    )
    showToast(`Da cap nhat ${selectedIds.size} ho so`)
    setSelectedIds(new Set())
  }

  const columns = [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredRecords.length > 0 &&
              filteredRecords.every((item) => selectedIds.has(item.id))
            }
            onChange={toggleSelectAllVisible}
          />
        ),
        render: (row: ClubCertificationRecord) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleSelection(row.id)}
          />
        ),
      },
      {
        key: 'member',
        label: 'Vo sinh',
        render: (row: ClubCertificationRecord) => (
          <div>
            <div className="text-sm font-semibold">{row.memberName}</div>
            <div className="text-xs text-(--vct-text-secondary)">{row.examCode}</div>
          </div>
        ),
      },
      {
        key: 'rank',
        label: 'Thang dang',
        render: (row: ClubCertificationRecord) => (
          <span className="text-sm">
            {beltLabel(row.fromRank)} → {beltLabel(row.toRank)}
          </span>
        ),
      },
      {
        key: 'examDate',
        label: 'Ngay thi',
        render: (row: ClubCertificationRecord) => row.examDate,
      },
      {
        key: 'issuedBy',
        label: 'Noi cap',
        render: (row: ClubCertificationRecord) => row.issuedBy,
      },
      {
        key: 'result',
        label: 'Ket qua',
        render: (row: ClubCertificationRecord) => (
          <VCT_Badge text={RESULT_LABEL[row.result]} type={RESULT_TONE[row.result]} />
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubCertificationRecord) => (
          <div className="flex justify-end gap-1">
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

  const beltDistribution = React.useMemo(() => {
    const map = new Map<BeltRank, number>()
    BELT_ORDER.forEach((rank) => map.set(rank, 0))
    members.forEach((member) => {
      map.set(member.beltRank, (map.get(member.beltRank) ?? 0) + 1)
    })
    return BELT_ORDER.map((rank) => ({
      rank,
      count: map.get(rank) ?? 0,
    }))
  }, [members])

  const totalMembers = members.length
  const totalPass = records.filter((item) => item.result === 'pass').length
  const passRate = records.length > 0 ? Math.round((totalPass / records.length) * 100) : 0

  const stats: StatItem[] = [
    {
      label: 'Tong ho so',
      value: records.length,
      icon: <VCT_Icons.FileText size={18} />,
      color: 'var(--vct-accent-cyan)',
    },
    {
      label: 'Ty le dat',
      value: `${passRate}%`,
      icon: <VCT_Icons.TrendingUp size={18} />,
      color: 'var(--vct-success)',
      sub: `${totalPass}/${records.length} ket qua`,
    },
    {
      label: 'Vo sinh dai den',
      value: members.filter((item) => item.beltRank === 'black').length,
      icon: <VCT_Icons.Award size={18} />,
      color: 'var(--vct-bg-input)',
    },
    {
      label: 'Ky thi sap toi',
      value: beltExams.filter((item) => item.status === 'upcoming').length,
      icon: <VCT_Icons.Calendar size={18} />,
      color: 'var(--vct-info)',
    },
  ]

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (search) result.push({ key: 'search', label: 'Tim', value: search })
    if (resultFilter) {
      result.push({
        key: 'result',
        label: 'Ket qua',
        value: RESULT_LABEL[resultFilter],
      })
    }
    return result
  }, [resultFilter, search])

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('')
    if (key === 'result') setResultFilter('')
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
          Quan ly chung nhan va dang cap
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Theo doi lich su thang dai, ket qua ky thi va phan bo dang cap CLB.
        </p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {beltDistribution.map((item) => {
          const percent = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0
          return (
            <div
              key={item.rank}
              className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-3 text-center"
            >
              <div className="text-2xl">{BELT_EMOJI[item.rank]}</div>
              <div className="mt-1 text-lg font-bold text-(--vct-text-primary)">
                {item.count}
              </div>
              <div className="text-xs text-(--vct-text-secondary)">{BELT_LABEL[item.rank]}</div>
              <div className="mt-1 text-[10px] text-(--vct-text-secondary)">{percent}%</div>
            </div>
          )
        })}
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Tim vo sinh, ma ky thi, noi cap..."
            />
          </div>
          <VCT_Select
            value={resultFilter}
            onChange={(value) => setResultFilter((value as CertResult) || '')}
            options={[
              { value: '', label: 'Tat ca ket qua' },
              { value: 'pass', label: 'Dat' },
              { value: 'fail', label: 'Khong dat' },
            ]}
            className="min-w-[160px]"
          />
        </div>
        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
          Tao chung nhan
        </VCT_Button>
      </div>

      <VCT_FilterChips
        className="mb-4"
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={() => {
          setSearch('')
          setResultFilter('')
        }}
      />

      {filteredRecords.length === 0 ? (
        <VCT_EmptyState
          icon="🎖️"
          title="Khong co ho so chung nhan phu hop"
          description="Thu doi bo loc hoac tao ho so moi."
          actionLabel={can('create') ? 'Tao chung nhan' : undefined}
          onAction={can('create') ? openCreateModal : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredRecords} rowKey="id" />
        </div>
      )}

      <VCT_BulkActionsBar
        count={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Dat',
            variant: 'primary',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => bulkSetResult('pass'),
          },
          {
            label: 'Khong dat',
            variant: 'danger',
            icon: <VCT_Icons.X size={14} />,
            onClick: () => bulkSetResult('fail'),
          },
        ]}
      />

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingRecord ? 'Cap nhat chung nhan' : 'Tao chung nhan moi'}
        width={840}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveForm}>
              {editingRecord ? 'Luu thay doi' : 'Tao chung nhan'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Vo sinh trong CLB">
            <VCT_Select
              value={form.memberId}
              onChange={onMemberSelect}
              options={[
                { value: '', label: '-- Chon vo sinh --' },
                ...members.map((member) => ({
                  value: member.id,
                  label: `${member.fullName} (${beltLabel(member.beltRank)})`,
                })),
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Ten vo sinh">
            <VCT_Input
              value={form.memberName}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, memberName: event.target.value }))
              }
              placeholder="Nguyen Van A"
            />
          </VCT_Field>
          <VCT_Field label="Tu dai">
            <VCT_Select
              value={form.fromRank}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, fromRank: value as BeltRank }))
              }
              options={BELT_ORDER.map((rank) => ({ value: rank, label: beltLabel(rank) }))}
            />
          </VCT_Field>
          <VCT_Field label="Len dai">
            <VCT_Select
              value={form.toRank}
              onChange={(value) => setForm((prev) => ({ ...prev, toRank: value as BeltRank }))}
              options={BELT_ORDER.map((rank) => ({ value: rank, label: beltLabel(rank) }))}
            />
          </VCT_Field>
          <VCT_Field label="Ngay thi">
            <VCT_Input
              type="date"
              value={form.examDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, examDate: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Ma ky thi">
            <VCT_Input
              value={form.examCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, examCode: event.target.value }))
              }
              placeholder="EXM-2026-Q2"
            />
          </VCT_Field>
          <VCT_Field label="Ket qua">
            <VCT_Select
              value={form.result}
              onChange={(value) => setForm((prev) => ({ ...prev, result: value as CertResult }))}
              options={[
                { value: 'pass', label: 'Dat' },
                { value: 'fail', label: 'Khong dat' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Noi cap/nguoi cap">
            <VCT_Input
              value={form.issuedBy}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, issuedBy: event.target.value }))
              }
              placeholder="Hoi dong chuyen mon CLB"
            />
          </VCT_Field>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xac nhan xoa chung nhan"
        message="Thao tac nay se xoa ho so chung nhan khoi lich su thang dang."
        preview={deleteTarget ? `${deleteTarget.memberName} • ${deleteTarget.examCode}` : undefined}
        confirmLabel="Xoa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
