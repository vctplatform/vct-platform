'use client'

import * as React from 'react'
import {
  VCT_AvatarLetter,
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
  BELT_EMOJI,
  BELT_LABEL,
  CLASS_SEED,
  MEMBER_ROLE_LABEL,
  MEMBER_SEED,
  MEMBER_STATUS_LABEL,
  type BeltRank,
  type ClubMember,
  type MemberRole,
  type MemberStatus,
  makeClubId,
  useClubStoredState,
} from './club-data'

type MemberFormState = {
  fullName: string
  gender: 'male' | 'female'
  dateOfBirth: string
  phone: string
  email: string
  beltRank: BeltRank
  role: MemberRole
  status: MemberStatus
  joinDate: string
  classIdsText: string
  note: string
}

const createInitialForm = (): MemberFormState => ({
  fullName: '',
  gender: 'male',
  dateOfBirth: '',
  phone: '',
  email: '',
  beltRank: 'white',
  role: 'athlete',
  status: 'pending',
  joinDate: new Date().toISOString().slice(0, 10),
  classIdsText: '',
  note: '',
})

export const Page_club_members = () => {
  const [members, setMembers] = useClubStoredState('members', MEMBER_SEED)
  const [classes] = useClubStoredState('classes', CLASS_SEED)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<MemberStatus | ''>('')
  const [roleFilter, setRoleFilter] = React.useState<MemberRole | ''>('')
  const [beltFilter, setBeltFilter] = React.useState<BeltRank | ''>('')
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [editingMember, setEditingMember] = React.useState<ClubMember | null>(null)
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubMember | null>(null)
  const [form, setForm] = React.useState<MemberFormState>(createInitialForm)
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

  const { can, requireAction } = useRouteActionGuard('/club/members', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const classNameById = React.useMemo(() => {
    const map = new Map<string, string>()
    classes.forEach((item) => map.set(item.id, item.name))
    return map
  }, [classes])

  const filteredMembers = React.useMemo(() => {
    let rows = members
    if (statusFilter) rows = rows.filter((item) => item.status === statusFilter)
    if (roleFilter) rows = rows.filter((item) => item.role === roleFilter)
    if (beltFilter) rows = rows.filter((item) => item.beltRank === beltFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.fullName.toLowerCase().includes(keyword) ||
          item.phone.toLowerCase().includes(keyword) ||
          item.email.toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [beltFilter, members, roleFilter, search, statusFilter])

  React.useEffect(() => {
    const next = new Set<string>()
    filteredMembers.forEach((item) => {
      if (selectedIds.has(item.id)) next.add(item.id)
    })
    if (next.size !== selectedIds.size) setSelectedIds(next)
  }, [filteredMembers, selectedIds])

  const toggleMemberSelection = (memberId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(memberId)) next.delete(memberId)
      else next.add(memberId)
      return next
    })
  }

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredMembers.map((item) => item.id)
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
    if (!requireAction('create', 'them thanh vien')) return
    setEditingMember(null)
    setForm(createInitialForm())
    setShowFormModal(true)
  }

  const openEditModal = (member: ClubMember) => {
    if (!requireAction('update', 'sua thanh vien')) return
    setEditingMember(member)
    setForm({
      fullName: member.fullName,
      gender: member.gender,
      dateOfBirth: member.dateOfBirth,
      phone: member.phone,
      email: member.email,
      beltRank: member.beltRank,
      role: member.role,
      status: member.status,
      joinDate: member.joinDate,
      classIdsText: member.classIds.join(', '),
      note: member.note ?? '',
    })
    setShowFormModal(true)
  }

  const saveForm = () => {
    if (!form.fullName.trim()) {
      showToast('Ten thanh vien la bat buoc', 'warning')
      return
    }
    if (!form.phone.trim()) {
      showToast('So dien thoai la bat buoc', 'warning')
      return
    }

    const classIds = form.classIdsText
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)

    if (editingMember) {
      setMembers((prev) =>
        prev.map((item) =>
          item.id === editingMember.id
            ? {
                ...item,
                fullName: form.fullName.trim(),
                gender: form.gender,
                dateOfBirth: form.dateOfBirth,
                phone: form.phone.trim(),
                email: form.email.trim(),
                beltRank: form.beltRank,
                role: form.role,
                status: form.status,
                joinDate: form.joinDate,
                classIds,
                note: form.note.trim() || undefined,
              }
            : item
        )
      )
      showToast('Da cap nhat thanh vien')
    } else {
      const nextMember: ClubMember = {
        id: makeClubId('MBR'),
        fullName: form.fullName.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        phone: form.phone.trim(),
        email: form.email.trim(),
        beltRank: form.beltRank,
        role: form.role,
        status: form.status,
        joinDate: form.joinDate,
        classIds,
        note: form.note.trim() || undefined,
      }
      setMembers((prev) => [nextMember, ...prev])
      showToast('Da them thanh vien moi')
    }

    setShowFormModal(false)
    setEditingMember(null)
  }

  const updateMemberStatus = (memberId: string, status: MemberStatus) => {
    if (!requireAction('approve', 'duyet trang thai thanh vien')) return
    setMembers((prev) =>
      prev.map((item) => (item.id === memberId ? { ...item, status } : item))
    )
    showToast('Da cap nhat trang thai')
  }

  const bulkSetStatus = (status: MemberStatus) => {
    if (!requireAction('update', 'cap nhat hang loat')) return
    if (selectedIds.size === 0) return
    setMembers((prev) =>
      prev.map((item) =>
        selectedIds.has(item.id) ? { ...item, status } : item
      )
    )
    showToast(`Da cap nhat ${selectedIds.size} thanh vien`)
    setSelectedIds(new Set())
  }

  const requestDelete = (member: ClubMember) => {
    if (!requireAction('delete', 'xoa thanh vien')) return
    setDeleteTarget(member)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setMembers((prev) => prev.filter((item) => item.id !== deleteTarget.id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteTarget.id)
      return next
    })
    showToast(`Da xoa thanh vien ${deleteTarget.fullName}`, 'info')
    setDeleteTarget(null)
  }

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (statusFilter) result.push({ key: 'status', label: 'Trang thai', value: MEMBER_STATUS_LABEL[statusFilter] })
    if (roleFilter) result.push({ key: 'role', label: 'Vai tro', value: MEMBER_ROLE_LABEL[roleFilter] })
    if (beltFilter) result.push({ key: 'belt', label: 'Dai', value: BELT_LABEL[beltFilter] })
    if (search) result.push({ key: 'search', label: 'Tim', value: search })
    return result
  }, [beltFilter, roleFilter, search, statusFilter])

  const removeFilter = (key: string) => {
    if (key === 'status') setStatusFilter('')
    if (key === 'role') setRoleFilter('')
    if (key === 'belt') setBeltFilter('')
    if (key === 'search') setSearch('')
  }

  const columns = [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredMembers.length > 0 &&
              filteredMembers.every((item) => selectedIds.has(item.id))
            }
            onChange={toggleSelectAllVisible}
          />
        ),
        render: (row: ClubMember) => (
          <input
            type="checkbox"
            checked={selectedIds.has(row.id)}
            onChange={() => toggleMemberSelection(row.id)}
          />
        ),
      },
      {
        key: 'member',
        label: 'Thanh vien',
        render: (row: ClubMember) => (
          <div className="flex items-center gap-2">
            <VCT_AvatarLetter name={row.fullName} size={34} />
            <div>
              <div className="text-sm font-semibold">{row.fullName}</div>
              <div className="text-xs text-(--vct-text-secondary)">{row.email || row.phone}</div>
            </div>
          </div>
        ),
      },
      {
        key: 'belt',
        label: 'Dai',
        render: (row: ClubMember) => (
          <span className="text-sm">
            {BELT_EMOJI[row.beltRank]} {BELT_LABEL[row.beltRank]}
          </span>
        ),
      },
      {
        key: 'role',
        label: 'Vai tro',
        render: (row: ClubMember) => MEMBER_ROLE_LABEL[row.role],
      },
      {
        key: 'classes',
        label: 'Lop',
        render: (row: ClubMember) => (
          <span className="text-xs text-(--vct-text-secondary)">
            {row.classIds.length === 0
              ? 'Chua xep lop'
              : row.classIds
                  .map((classId) => classNameById.get(classId) ?? classId)
                  .join(', ')}
          </span>
        ),
      },
      {
        key: 'status',
        label: 'Trang thai',
        render: (row: ClubMember) => {
          const tone =
            row.status === 'active'
              ? 'success'
              : row.status === 'pending'
                ? 'warning'
                : row.status === 'rejected'
                  ? 'danger'
                  : 'neutral'
          return <VCT_Badge text={MEMBER_STATUS_LABEL[row.status]} type={tone} />
        },
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubMember) => (
          <div className="flex justify-end gap-1">
            {row.status === 'pending' ? (
              <>
                <button
                  type="button"
                  onClick={() => updateMemberStatus(row.id, 'active')}
                  className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-500"
                >
                  Duyet
                </button>
                <button
                  type="button"
                  onClick={() => updateMemberStatus(row.id, 'rejected')}
                  className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500"
                >
                  Tu choi
                </button>
              </>
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

  const stats: StatItem[] = [
    {
      label: 'Tong thanh vien',
      value: members.length,
      icon: <VCT_Icons.Users size={18} />,
      color: '#0ea5e9',
    },
    {
      label: 'Dang hoat dong',
      value: members.filter((item) => item.status === 'active').length,
      icon: <VCT_Icons.Activity size={18} />,
      color: '#10b981',
    },
    {
      label: 'Cho duyet',
      value: members.filter((item) => item.status === 'pending').length,
      icon: <VCT_Icons.Clock size={18} />,
      color: '#f59e0b',
    },
    {
      label: 'HLV & tro giang',
      value:
        members.filter((item) => item.role === 'coach' || item.role === 'assistant')
          .length,
      icon: <VCT_Icons.Award size={18} />,
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
          Quan ly thanh vien CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Ho so vo sinh, HLV, tro giang va quy trinh duyet gia nhap.
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
            count: members.filter((item) => item.status === 'active').length,
          },
          {
            key: 'pending',
            label: 'Cho duyet',
            color: '#f59e0b',
            count: members.filter((item) => item.status === 'pending').length,
          },
          {
            key: 'inactive',
            label: 'Ngung HD',
            color: '#94a3b8',
            count: members.filter((item) => item.status === 'inactive').length,
          },
          {
            key: 'rejected',
            label: 'Tu choi',
            color: '#ef4444',
            count: members.filter((item) => item.status === 'rejected').length,
          },
        ]}
        activeStage={statusFilter || null}
        onStageClick={(key) => setStatusFilter((key as MemberStatus) ?? '')}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder="Tim ten, SDT, email..."
            />
          </div>
          <VCT_Select
            value={roleFilter}
            onChange={(value) => setRoleFilter((value as MemberRole) || '')}
            options={[
              { value: '', label: 'Tat ca vai tro' },
              { value: 'athlete', label: 'Vo sinh' },
              { value: 'coach', label: 'HLV' },
              { value: 'assistant', label: 'Tro giang' },
              { value: 'staff', label: 'Van hanh' },
            ]}
            className="min-w-[170px]"
          />
          <VCT_Select
            value={beltFilter}
            onChange={(value) => setBeltFilter((value as BeltRank) || '')}
            options={[
              { value: '', label: 'Tat ca dai' },
              { value: 'white', label: 'Trang' },
              { value: 'yellow', label: 'Vang' },
              { value: 'green', label: 'Xanh la' },
              { value: 'blue', label: 'Xanh duong' },
              { value: 'red', label: 'Do' },
              { value: 'black', label: 'Den' },
            ]}
            className="min-w-[160px]"
          />
        </div>
        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
          Them thanh vien
        </VCT_Button>
      </div>

      <VCT_FilterChips
        className="mb-4"
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={() => {
          setSearch('')
          setStatusFilter('')
          setRoleFilter('')
          setBeltFilter('')
        }}
      />

      {filteredMembers.length === 0 ? (
        <VCT_EmptyState
          icon="👥"
          title="Khong co thanh vien phu hop"
          description="Thu doi bo loc hoac them thanh vien moi."
          actionLabel={can('create') ? 'Them thanh vien' : undefined}
          onAction={can('create') ? openCreateModal : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredMembers} rowKey="id" />
        </div>
      )}

      <VCT_BulkActionsBar
        count={selectedIds.size}
        onClearSelection={() => setSelectedIds(new Set())}
        actions={[
          {
            label: 'Duyet',
            variant: 'primary',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => bulkSetStatus('active'),
          },
          {
            label: 'Tam ngung',
            variant: 'secondary',
            icon: <VCT_Icons.Pause size={14} />,
            onClick: () => bulkSetStatus('inactive'),
          },
          {
            label: 'Tu choi',
            variant: 'danger',
            icon: <VCT_Icons.X size={14} />,
            onClick: () => bulkSetStatus('rejected'),
          },
        ]}
      />

      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={editingMember ? 'Sua thanh vien' : 'Them thanh vien moi'}
        width={780}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveForm}>
              {editingMember ? 'Cap nhat' : 'Tao thanh vien'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Ho va ten">
            <VCT_Input
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Nguyen Van A"
            />
          </VCT_Field>
          <VCT_Field label="Gioi tinh">
            <VCT_Select
              value={form.gender}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, gender: value as 'male' | 'female' }))
              }
              options={[
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nu' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Ngay sinh">
            <VCT_Input
              type="date"
              value={form.dateOfBirth}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, dateOfBirth: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Ngay gia nhap">
            <VCT_Input
              type="date"
              value={form.joinDate}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, joinDate: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="So dien thoai">
            <VCT_Input
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              placeholder="090..."
            />
          </VCT_Field>
          <VCT_Field label="Email">
            <VCT_Input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="member@club.vn"
            />
          </VCT_Field>
          <VCT_Field label="Dai hien tai">
            <VCT_Select
              value={form.beltRank}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, beltRank: value as BeltRank }))
              }
              options={[
                { value: 'white', label: 'Trang' },
                { value: 'yellow', label: 'Vang' },
                { value: 'green', label: 'Xanh la' },
                { value: 'blue', label: 'Xanh duong' },
                { value: 'red', label: 'Do' },
                { value: 'black', label: 'Den' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Vai tro">
            <VCT_Select
              value={form.role}
              onChange={(value) => setForm((prev) => ({ ...prev, role: value as MemberRole }))}
              options={[
                { value: 'athlete', label: 'Vo sinh' },
                { value: 'coach', label: 'HLV' },
                { value: 'assistant', label: 'Tro giang' },
                { value: 'staff', label: 'Van hanh' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Trang thai">
            <VCT_Select
              value={form.status}
              onChange={(value) =>
                setForm((prev) => ({ ...prev, status: value as MemberStatus }))
              }
              options={[
                { value: 'pending', label: 'Cho duyet' },
                { value: 'active', label: 'Hoat dong' },
                { value: 'inactive', label: 'Ngung HD' },
                { value: 'rejected', label: 'Tu choi' },
              ]}
            />
          </VCT_Field>
          <div className="md:col-span-2">
            <VCT_Field label="Ma lop (phan tach dau phay)">
              <VCT_Input
                value={form.classIdsText}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, classIdsText: event.target.value }))
                }
                placeholder="CLS-001, CLS-003"
              />
            </VCT_Field>
          </div>
          <div className="md:col-span-2">
            <VCT_Field label="Ghi chu">
              <VCT_Input
                value={form.note}
                onChange={(event) => setForm((prev) => ({ ...prev, note: event.target.value }))}
                placeholder="Thong tin bo sung..."
              />
            </VCT_Field>
          </div>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xac nhan xoa thanh vien"
        message="Thao tac nay se xoa thanh vien khoi danh sach CLB."
        preview={deleteTarget ? `${deleteTarget.fullName} (${deleteTarget.id})` : undefined}
        confirmLabel="Xoa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
