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
  VCT_StatusPipeline,
  VCT_Table,
  VCT_Toast,
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useRouteActionGuard } from '../hooks/use-route-action-guard'
import {
  ATTENDANCE_SEED,
  ATTENDANCE_STATUS_COLOR,
  ATTENDANCE_STATUS_LABEL,
  CLASS_SEED,
  type AttendanceStatus,
  type ClubAttendance,
  makeClubId,
  useClubStoredState,
} from './club-data'

/* ── Inline SVG Bar Chart ─────────────────────────────────────── */

const AttendanceChart = ({ records }: { records: ClubAttendance[] }) => {
  const counts = React.useMemo(() => {
    const map: Record<string, number> = { present: 0, late: 0, excused: 0, absent: 0 }
    for (const r of records) map[r.status] = (map[r.status] || 0) + 1
    return map
  }, [records])

  const max = Math.max(...Object.values(counts), 1)
  const bars: { key: string; label: string; value: number; color: string }[] = [
    { key: 'present', label: 'Có mặt', value: counts.present ?? 0, color: '#10b981' },
    { key: 'late', label: 'Trễ', value: counts.late ?? 0, color: '#f59e0b' },
    { key: 'excused', label: 'Có phép', value: counts.excused ?? 0, color: '#6366f1' },
    { key: 'absent', label: 'Vắng', value: counts.absent ?? 0, color: '#ef4444' },
  ]

  return (
    <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
      <h3 className="mb-3 text-sm font-semibold text-(--vct-text-primary)">Phân bố trạng thái</h3>
      <svg viewBox="0 0 300 120" className="w-full" style={{ maxHeight: 120 }}>
        {bars.map((bar, i) => {
          const barW = 50
          const gap = (300 - bars.length * barW) / (bars.length + 1)
          const x = gap + i * (barW + gap)
          const h = max > 0 ? (bar.value / max) * 80 : 0
          return (
            <g key={bar.key}>
              <rect x={x} y={90 - h} width={barW} height={h} rx={6} fill={bar.color} opacity={0.85} />
              <text x={x + barW / 2} y={90 - h - 4} textAnchor="middle" fontSize="11" fill="var(--vct-text-primary)" fontWeight="600">{bar.value}</text>
              <text x={x + barW / 2} y={108} textAnchor="middle" fontSize="9" fill="var(--vct-text-secondary)">{bar.label}</text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/* ── Form helpers ─────────────────────────────────────────────── */

type AttendanceFormState = {
  classId: string
  className: string
  memberId: string
  memberName: string
  date: string
  status: AttendanceStatus
  notes: string
}

type FormErrors = Partial<Record<keyof AttendanceFormState, string>>

const createInitialAttendanceForm = (): AttendanceFormState => ({
  classId: '',
  className: '',
  memberId: '',
  memberName: '',
  date: new Date().toISOString().slice(0, 10),
  status: 'present',
  notes: '',
})

const validateForm = (form: AttendanceFormState): FormErrors => {
  const errors: FormErrors = {}
  if (!form.memberName.trim()) errors.memberName = 'Tên thành viên là bắt buộc'
  if (!form.className.trim() && !form.classId) errors.className = 'Vui lòng chọn lớp'
  if (!form.date) errors.date = 'Ngày là bắt buộc'
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(form.date)) errors.date = 'Ngày không hợp lệ'
  return errors
}

/* ── CSV Export ────────────────────────────────────────────────── */

const exportCSV = (records: ClubAttendance[]) => {
  const header = 'Thành viên,Lớp,Ngày,Trạng thái,Ghi chú,Người ghi\n'
  const rows = records.map(r =>
    `"${r.memberName}","${r.className}","${r.date}","${ATTENDANCE_STATUS_LABEL[r.status]}","${r.notes || ''}","${r.recordedBy}"`
  ).join('\n')
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `diem-danh-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/* ── Main Component ───────────────────────────────────────────── */

export const Page_club_attendance = () => {
  const [records, setRecords] = useClubStoredState('attendance', ATTENDANCE_SEED)
  const [classes] = useClubStoredState('classes', CLASS_SEED)
  const [search, setSearch] = React.useState('')
  const [statusFilter, setStatusFilter] = React.useState<AttendanceStatus | ''>('')
  const [classFilter, setClassFilter] = React.useState('')
  const [dateFilter, setDateFilter] = React.useState('')
  const [showFormModal, setShowFormModal] = React.useState(false)
  const [deleteTarget, setDeleteTarget] = React.useState<ClubAttendance | null>(null)
  const [form, setForm] = React.useState(createInitialAttendanceForm)
  const [formErrors, setFormErrors] = React.useState<FormErrors>({})
  const [toast, setToast] = React.useState({ show: false, msg: '', type: 'success' as 'success' | 'warning' | 'error' | 'info' })

  // Bulk mode
  const [bulkMode, setBulkMode] = React.useState(false)
  const [bulkDate, setBulkDate] = React.useState(new Date().toISOString().slice(0, 10))
  const [bulkClassId, setBulkClassId] = React.useState('')
  const [bulkStatuses, setBulkStatuses] = React.useState<Record<string, AttendanceStatus>>({})

  const showToast = React.useCallback((msg: string, type: 'success' | 'warning' | 'error' | 'info' = 'success') => {
    setToast({ show: true, msg, type })
  }, [])

  const { can, requireAction } = useRouteActionGuard('/club/attendance', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const filteredRecords = React.useMemo(() => {
    let rows = records
    if (statusFilter) rows = rows.filter((r) => r.status === statusFilter)
    if (classFilter) rows = rows.filter((r) => r.classId === classFilter)
    if (dateFilter) rows = rows.filter((r) => r.date === dateFilter)
    if (search) {
      const kw = search.toLowerCase()
      rows = rows.filter((r) => r.memberName.toLowerCase().includes(kw) || r.className.toLowerCase().includes(kw))
    }
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [records, statusFilter, classFilter, dateFilter, search])

  const attendanceRate = React.useMemo(() => {
    if (records.length === 0) return 0
    const presentLate = records.filter((r) => r.status === 'present' || r.status === 'late').length
    return Math.round((presentLate / records.length) * 100)
  }, [records])

  const openCreateModal = () => {
    if (!requireAction('create', 'ghi nhan diem danh')) return
    setForm(createInitialAttendanceForm())
    setFormErrors({})
    setShowFormModal(true)
  }

  const saveForm = () => {
    const errors = validateForm(form)
    setFormErrors(errors)
    if (Object.keys(errors).length > 0) {
      showToast('Vui lòng điền đầy đủ thông tin', 'warning')
      return
    }
    const next: ClubAttendance = {
      id: makeClubId('ATT'),
      clubId: 'CLB-001',
      classId: form.classId || makeClubId('CLS'),
      className: form.className.trim(),
      memberId: form.memberId || makeClubId('MBR'),
      memberName: form.memberName.trim(),
      date: form.date,
      status: form.status,
      notes: form.notes.trim() || undefined,
      recordedBy: 'Current User',
    }
    setRecords((prev) => [next, ...prev])
    showToast('Đã ghi nhận điểm danh')
    setShowFormModal(false)
  }

  const requestDelete = (record: ClubAttendance) => {
    if (!requireAction('delete', 'xoa diem danh')) return
    setDeleteTarget(record)
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    setRecords((prev) => prev.filter((r) => r.id !== deleteTarget.id))
    showToast(`Đã xóa bản ghi điểm danh`, 'info')
    setDeleteTarget(null)
  }

  // Bulk attendance helpers
  const bulkMembers = React.useMemo(() => {
    if (!bulkClassId) return []
    const classMembers = records.filter(r => r.classId === bulkClassId)
    const unique = new Map<string, { memberId: string; memberName: string }>()
    for (const r of classMembers) unique.set(r.memberId, { memberId: r.memberId, memberName: r.memberName })
    return Array.from(unique.values())
  }, [bulkClassId, records])

  const openBulkMode = () => {
    if (!requireAction('create', 'diem danh hang loat')) return
    setBulkMode(true)
    setBulkStatuses({})
  }

  const saveBulk = () => {
    const newRecords: ClubAttendance[] = []
    const cls = classes.find(c => c.id === bulkClassId)
    for (const m of bulkMembers) {
      const status = bulkStatuses[m.memberId] || 'present'
      newRecords.push({
        id: makeClubId('ATT'),
        clubId: 'CLB-001',
        classId: bulkClassId,
        className: cls?.name || bulkClassId,
        memberId: m.memberId,
        memberName: m.memberName,
        date: bulkDate,
        status,
        recordedBy: 'Current User',
      })
    }
    if (newRecords.length === 0) {
      showToast('Không có thành viên nào để điểm danh', 'warning')
      return
    }
    setRecords(prev => [...newRecords, ...prev])
    showToast(`Đã điểm danh ${newRecords.length} thành viên`)
    setBulkMode(false)
  }

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (statusFilter) result.push({ key: 'status', label: 'Trạng thái', value: ATTENDANCE_STATUS_LABEL[statusFilter] })
    if (classFilter) result.push({ key: 'class', label: 'Lớp', value: classFilter })
    if (dateFilter) result.push({ key: 'date', label: 'Ngày', value: dateFilter })
    if (search) result.push({ key: 'search', label: 'Tìm', value: search })
    return result
  }, [statusFilter, classFilter, dateFilter, search])

  const removeFilter = (key: string) => {
    if (key === 'status') setStatusFilter('')
    if (key === 'class') setClassFilter('')
    if (key === 'date') setDateFilter('')
    if (key === 'search') setSearch('')
  }

  const stats: StatItem[] = [
    { label: 'Tổng bản ghi', value: records.length, icon: <VCT_Icons.List size={18} />, color: '#0ea5e9' },
    { label: 'Tỷ lệ điểm danh', value: `${attendanceRate}%`, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
    { label: 'Có mặt', value: records.filter((r) => r.status === 'present').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
    { label: 'Vắng mặt', value: records.filter((r) => r.status === 'absent').length, icon: <VCT_Icons.X size={18} />, color: '#ef4444' },
  ]

  const columns = [
    {
      key: 'member',
      label: 'Thành viên',
      render: (row: ClubAttendance) => (
        <div>
          <div className="text-sm font-semibold">{row.memberName}</div>
          <div className="text-xs text-(--vct-text-secondary)">{row.className}</div>
        </div>
      ),
    },
    { key: 'date', label: 'Ngày', render: (row: ClubAttendance) => <span className="text-sm">{row.date}</span> },
    {
      key: 'status',
      label: 'Trạng thái',
      render: (row: ClubAttendance) => {
        const tone = row.status === 'present' ? 'success' : row.status === 'absent' ? 'danger' : row.status === 'late' ? 'warning' : 'neutral'
        return <VCT_Badge text={ATTENDANCE_STATUS_LABEL[row.status]} type={tone} />
      },
    },
    { key: 'notes', label: 'Ghi chú', render: (row: ClubAttendance) => <span className="text-xs text-(--vct-text-secondary)">{row.notes || '—'}</span> },
    { key: 'recordedBy', label: 'Người ghi', render: (row: ClubAttendance) => <span className="text-sm">{row.recordedBy}</span> },
    {
      key: 'actions',
      label: '',
      align: 'right' as const,
      render: (row: ClubAttendance) => (
        <div className="flex justify-end gap-1">
          {can('delete') ? (
            <button type="button" onClick={() => requestDelete(row)} className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500">
              Xóa
            </button>
          ) : null}
        </div>
      ),
    },
  ]

  return (
    <VCT_PageContainer size="wide" animated>
      <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Điểm danh</h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">Ghi nhận và theo dõi tình hình tham dự buổi tập của thành viên.</p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      {/* Chart */}
      <div className="mb-6">
        <AttendanceChart records={records} />
      </div>

      <VCT_StatusPipeline
        className="mb-4"
        stages={[
          { key: 'present', label: 'Có mặt', color: ATTENDANCE_STATUS_COLOR.present, count: records.filter((r) => r.status === 'present').length },
          { key: 'late', label: 'Trễ', color: ATTENDANCE_STATUS_COLOR.late, count: records.filter((r) => r.status === 'late').length },
          { key: 'excused', label: 'Có phép', color: ATTENDANCE_STATUS_COLOR.excused, count: records.filter((r) => r.status === 'excused').length },
          { key: 'absent', label: 'Vắng', color: ATTENDANCE_STATUS_COLOR.absent, count: records.filter((r) => r.status === 'absent').length },
        ]}
        activeStage={statusFilter || null}
        onStageClick={(key) => setStatusFilter((key as AttendanceStatus) ?? '')}
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm thành viên, lớp..." />
          </div>
          <VCT_Select
            value={classFilter}
            onChange={setClassFilter}
            options={[{ value: '', label: 'Tất cả lớp' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            className="min-w-[170px]"
          />
          <VCT_Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="min-w-[160px]"
          />
        </div>
        <div className="flex gap-2">
          {can('export') && (
            <VCT_Button variant="ghost" icon={<VCT_Icons.Download size={16} />} onClick={() => exportCSV(filteredRecords)}>
              Xuất CSV
            </VCT_Button>
          )}
          {can('create') && (
            <VCT_Button variant="ghost" onClick={openBulkMode}>
              Điểm danh lớp
            </VCT_Button>
          )}
          <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateModal}>
            Ghi nhận
          </VCT_Button>
        </div>
      </div>

      <VCT_FilterChips className="mb-4" filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setSearch(''); setStatusFilter(''); setClassFilter(''); setDateFilter('') }} />

      {filteredRecords.length === 0 ? (
        <VCT_EmptyState icon="📋" title="Không có bản ghi" description="Thử đổi bộ lọc hoặc ghi nhận điểm danh mới." actionLabel={can('create') ? 'Ghi nhận' : undefined} onAction={can('create') ? openCreateModal : undefined} />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={columns} data={filteredRecords} rowKey="id" />
        </div>
      )}

      {/* Create Modal with validation */}
      <VCT_Modal
        isOpen={showFormModal}
        onClose={() => setShowFormModal(false)}
        title="Ghi nhận điểm danh"
        width={600}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowFormModal(false)}>Hủy</VCT_Button>
            <VCT_Button onClick={saveForm}>Lưu</VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <VCT_Field label="Tên thành viên *" error={formErrors.memberName}>
            <VCT_Input value={form.memberName} onChange={(e) => setForm((prev) => ({ ...prev, memberName: e.target.value }))} placeholder="Nguyễn Văn A" />
          </VCT_Field>
          <VCT_Field label="Lớp *" error={formErrors.className}>
            <VCT_Select
              value={form.classId}
              onChange={(v) => {
                const cls = classes.find((c) => c.id === v)
                setForm((prev) => ({ ...prev, classId: v, className: cls?.name || v }))
              }}
              options={[{ value: '', label: 'Chọn lớp' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </VCT_Field>
          <VCT_Field label="Ngày *" error={formErrors.date}>
            <VCT_Input type="date" value={form.date} onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))} />
          </VCT_Field>
          <VCT_Field label="Trạng thái">
            <VCT_Select
              value={form.status}
              onChange={(v) => setForm((prev) => ({ ...prev, status: v as AttendanceStatus }))}
              options={[
                { value: 'present', label: 'Có mặt' },
                { value: 'absent', label: 'Vắng' },
                { value: 'late', label: 'Trễ' },
                { value: 'excused', label: 'Có phép' },
              ]}
            />
          </VCT_Field>
          <div className="md:col-span-2">
            <VCT_Field label="Ghi chú">
              <VCT_Input value={form.notes} onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))} placeholder="Lý do vắng, trễ..." />
            </VCT_Field>
          </div>
        </div>
      </VCT_Modal>

      {/* Bulk Attendance Modal */}
      <VCT_Modal
        isOpen={bulkMode}
        onClose={() => setBulkMode(false)}
        title="Điểm danh cả lớp"
        width={700}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setBulkMode(false)}>Hủy</VCT_Button>
            <VCT_Button onClick={saveBulk} disabled={bulkMembers.length === 0}>Lưu ({bulkMembers.length})</VCT_Button>
          </div>
        }
      >
        <div className="mb-4 grid grid-cols-2 gap-3">
          <VCT_Field label="Lớp">
            <VCT_Select
              value={bulkClassId}
              onChange={(v) => { setBulkClassId(v); setBulkStatuses({}) }}
              options={[{ value: '', label: 'Chọn lớp' }, ...classes.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </VCT_Field>
          <VCT_Field label="Ngày">
            <VCT_Input type="date" value={bulkDate} onChange={(e) => setBulkDate(e.target.value)} />
          </VCT_Field>
        </div>
        {bulkMembers.length === 0 ? (
          <p className="rounded-xl bg-(--vct-bg-active) p-4 text-center text-sm text-(--vct-text-secondary)">
            Chọn lớp để hiển thị danh sách thành viên
          </p>
        ) : (
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {bulkMembers.map((m) => (
              <div key={m.memberId} className="flex items-center justify-between rounded-xl bg-(--vct-bg-active) px-4 py-2">
                <span className="text-sm font-medium text-(--vct-text-primary)">{m.memberName}</span>
                <VCT_Select
                  value={bulkStatuses[m.memberId] || 'present'}
                  onChange={(v) => setBulkStatuses(prev => ({ ...prev, [m.memberId]: v as AttendanceStatus }))}
                  options={[
                    { value: 'present', label: '✅ Có mặt' },
                    { value: 'absent', label: '❌ Vắng' },
                    { value: 'late', label: '⏰ Trễ' },
                    { value: 'excused', label: '📋 Có phép' },
                  ]}
                  className="w-[160px]"
                />
              </div>
            ))}
          </div>
        )}
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bản ghi điểm danh sẽ bị xóa vĩnh viễn."
        preview={deleteTarget ? `${deleteTarget.memberName} — ${deleteTarget.date}` : undefined}
        confirmLabel="Xóa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
