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
  VCT_Tabs,
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
  CLASS_LEVEL_LABEL,
  TRAINING_MODULE_SEED,
  type BeltRank,
  type ClassLevel,
  type ClubBeltExam,
  type ClubTrainingModule,
  type ExamStatus,
  type ModuleStatus,
  type TrainingTrack,
  makeClubId,
  useClubStoredState,
} from './club-data'

type TrainingTab = 'modules' | 'exams'

type ModuleFormState = {
  title: string
  track: TrainingTrack
  level: ClassLevel
  durationWeeks: string
  lessons: string
  progress: string
  owner: string
  status: ModuleStatus
}

type ExamFormState = {
  name: string
  examDate: string
  level: BeltRank
  status: ExamStatus
  candidates: string
  passedCount: string
  location: string
}

const TRACK_LABEL: Record<TrainingTrack, string> = {
  quyen: 'Bai quyen',
  doi_khang: 'Doi khang',
  the_luc: 'The luc',
  ky_thuat: 'Ky thuat',
}

const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  active: 'Hoat dong',
  draft: 'Nhap',
  archived: 'Luu tru',
}

const EXAM_STATUS_LABEL: Record<ExamStatus, string> = {
  upcoming: 'Sap dien ra',
  completed: 'Da ket thuc',
  draft: 'Nhap',
}

const MODULE_STATUS_TONE: Record<ModuleStatus, 'success' | 'warning' | 'neutral'> = {
  active: 'success',
  draft: 'warning',
  archived: 'neutral',
}

const EXAM_STATUS_TONE: Record<ExamStatus, 'info' | 'success' | 'neutral'> = {
  upcoming: 'info',
  completed: 'success',
  draft: 'neutral',
}

const createInitialModuleForm = (): ModuleFormState => ({
  title: '',
  track: 'ky_thuat',
  level: 'beginner',
  durationWeeks: '8',
  lessons: '24',
  progress: '0',
  owner: '',
  status: 'draft',
})

const createInitialExamForm = (): ExamFormState => ({
  name: '',
  examDate: new Date().toISOString().slice(0, 10),
  level: 'yellow',
  status: 'upcoming',
  candidates: '10',
  passedCount: '0',
  location: '',
})

const parsePositiveInt = (value: string, fallback = 0) => {
  const normalized = Number.parseInt(value, 10)
  if (!Number.isFinite(normalized) || normalized < 0) return fallback
  return normalized
}

export const Page_club_training = () => {
  const [modules, setModules] = useClubStoredState(
    'training-modules',
    TRAINING_MODULE_SEED
  )
  const [exams, setExams] = useClubStoredState('belt-exams', BELT_EXAM_SEED)
  const [activeTab, setActiveTab] = React.useState<TrainingTab>('modules')
  const [search, setSearch] = React.useState('')
  const [trackFilter, setTrackFilter] = React.useState<TrainingTrack | ''>('')
  const [moduleStatusFilter, setModuleStatusFilter] = React.useState<ModuleStatus | ''>('')
  const [examStatusFilter, setExamStatusFilter] = React.useState<ExamStatus | ''>('')
  const [selectedModuleIds, setSelectedModuleIds] = React.useState<Set<string>>(new Set())
  const [editingModule, setEditingModule] = React.useState<ClubTrainingModule | null>(null)
  const [editingExam, setEditingExam] = React.useState<ClubBeltExam | null>(null)
  const [deleteModuleTarget, setDeleteModuleTarget] = React.useState<ClubTrainingModule | null>(
    null
  )
  const [deleteExamTarget, setDeleteExamTarget] = React.useState<ClubBeltExam | null>(null)
  const [showModuleModal, setShowModuleModal] = React.useState(false)
  const [showExamModal, setShowExamModal] = React.useState(false)
  const [moduleForm, setModuleForm] = React.useState<ModuleFormState>(
    createInitialModuleForm()
  )
  const [examForm, setExamForm] = React.useState<ExamFormState>(createInitialExamForm())
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

  const { can, requireAction } = useRouteActionGuard('/club/training', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  const filteredModules = React.useMemo(() => {
    let rows = modules
    if (trackFilter) rows = rows.filter((item) => item.track === trackFilter)
    if (moduleStatusFilter) rows = rows.filter((item) => item.status === moduleStatusFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.title.toLowerCase().includes(keyword) ||
          item.owner.toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [moduleStatusFilter, modules, search, trackFilter])

  const filteredExams = React.useMemo(() => {
    let rows = exams
    if (examStatusFilter) rows = rows.filter((item) => item.status === examStatusFilter)
    if (search) {
      const keyword = search.toLowerCase()
      rows = rows.filter(
        (item) =>
          item.name.toLowerCase().includes(keyword) ||
          item.location.toLowerCase().includes(keyword) ||
          item.id.toLowerCase().includes(keyword)
      )
    }
    return rows
  }, [examStatusFilter, exams, search])

  React.useEffect(() => {
    if (activeTab !== 'modules') return
    const next = new Set<string>()
    filteredModules.forEach((item) => {
      if (selectedModuleIds.has(item.id)) next.add(item.id)
    })
    if (next.size !== selectedModuleIds.size) setSelectedModuleIds(next)
  }, [activeTab, filteredModules, selectedModuleIds])

  const toggleModuleSelection = (id: string) => {
    setSelectedModuleIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAllModules = () => {
    const visibleIds = filteredModules.map((item) => item.id)
    const allSelected = visibleIds.every((id) => selectedModuleIds.has(id))
    setSelectedModuleIds((prev) => {
      const next = new Set(prev)
      if (allSelected) visibleIds.forEach((id) => next.delete(id))
      else visibleIds.forEach((id) => next.add(id))
      return next
    })
  }

  const openCreateModule = () => {
    if (!requireAction('create', 'tao giao trinh')) return
    setEditingModule(null)
    setModuleForm(createInitialModuleForm())
    setShowModuleModal(true)
  }

  const openEditModule = (item: ClubTrainingModule) => {
    if (!requireAction('update', 'cap nhat giao trinh')) return
    setEditingModule(item)
    setModuleForm({
      title: item.title,
      track: item.track,
      level: item.level,
      durationWeeks: `${item.durationWeeks}`,
      lessons: `${item.lessons}`,
      progress: `${item.progress}`,
      owner: item.owner,
      status: item.status,
    })
    setShowModuleModal(true)
  }

  const saveModule = () => {
    const title = moduleForm.title.trim()
    const owner = moduleForm.owner.trim()
    const durationWeeks = parsePositiveInt(moduleForm.durationWeeks, 0)
    const lessons = parsePositiveInt(moduleForm.lessons, 0)
    const progress = Math.max(0, Math.min(100, parsePositiveInt(moduleForm.progress, 0)))

    if (!title) {
      showToast('Ten giao trinh la bat buoc', 'warning')
      return
    }
    if (!owner) {
      showToast('Nguoi phu trach la bat buoc', 'warning')
      return
    }
    if (durationWeeks <= 0 || lessons <= 0) {
      showToast('So tuan va so bai hoc phai lon hon 0', 'warning')
      return
    }

    const payload: ClubTrainingModule = {
      id: editingModule?.id ?? makeClubId('TRN'),
      title,
      track: moduleForm.track,
      level: moduleForm.level,
      durationWeeks,
      lessons,
      progress,
      owner,
      status: moduleForm.status,
      updatedAt: new Date().toISOString().slice(0, 10),
    }

    if (editingModule) {
      setModules((prev) =>
        prev.map((item) => (item.id === editingModule.id ? payload : item))
      )
      showToast('Da cap nhat giao trinh')
    } else {
      setModules((prev) => [payload, ...prev])
      showToast('Da tao giao trinh moi')
    }

    setShowModuleModal(false)
    setEditingModule(null)
  }

  const requestDeleteModule = (item: ClubTrainingModule) => {
    if (!requireAction('delete', 'xoa giao trinh')) return
    setDeleteModuleTarget(item)
  }

  const confirmDeleteModule = () => {
    if (!deleteModuleTarget) return
    setModules((prev) => prev.filter((item) => item.id !== deleteModuleTarget.id))
    setSelectedModuleIds((prev) => {
      const next = new Set(prev)
      next.delete(deleteModuleTarget.id)
      return next
    })
    showToast(`Da xoa giao trinh ${deleteModuleTarget.title}`, 'info')
    setDeleteModuleTarget(null)
  }

  const setModuleStatus = (id: string, status: ModuleStatus) => {
    if (!requireAction('update', 'cap nhat trang thai giao trinh')) return
    setModules((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status, updatedAt: new Date().toISOString().slice(0, 10) }
          : item
      )
    )
    showToast('Da cap nhat trang thai giao trinh')
  }

  const bulkSetModuleStatus = (status: ModuleStatus) => {
    if (!requireAction('update', 'cap nhat hang loat giao trinh')) return
    if (selectedModuleIds.size === 0) return
    setModules((prev) =>
      prev.map((item) =>
        selectedModuleIds.has(item.id)
          ? { ...item, status, updatedAt: new Date().toISOString().slice(0, 10) }
          : item
      )
    )
    showToast(`Da cap nhat ${selectedModuleIds.size} giao trinh`)
    setSelectedModuleIds(new Set())
  }

  const openCreateExam = () => {
    if (!requireAction('create', 'tao ky thi dai')) return
    setEditingExam(null)
    setExamForm(createInitialExamForm())
    setShowExamModal(true)
  }

  const openEditExam = (item: ClubBeltExam) => {
    if (!requireAction('update', 'cap nhat ky thi dai')) return
    setEditingExam(item)
    setExamForm({
      name: item.name,
      examDate: item.examDate,
      level: item.level,
      status: item.status,
      candidates: `${item.candidates}`,
      passedCount: `${item.passedCount}`,
      location: item.location,
    })
    setShowExamModal(true)
  }

  const saveExam = () => {
    const name = examForm.name.trim()
    const location = examForm.location.trim()
    const candidates = parsePositiveInt(examForm.candidates, 0)
    const passedCount = parsePositiveInt(examForm.passedCount, 0)

    if (!name) {
      showToast('Ten ky thi la bat buoc', 'warning')
      return
    }
    if (!examForm.examDate) {
      showToast('Ngay thi la bat buoc', 'warning')
      return
    }
    if (!location) {
      showToast('Dia diem thi la bat buoc', 'warning')
      return
    }
    if (candidates <= 0) {
      showToast('So luong thi sinh phai lon hon 0', 'warning')
      return
    }
    if (passedCount > candidates) {
      showToast('So luong dat khong the vuot so thi sinh', 'warning')
      return
    }

    const payload: ClubBeltExam = {
      id: editingExam?.id ?? makeClubId('EXM'),
      name,
      examDate: examForm.examDate,
      level: examForm.level,
      status: examForm.status,
      candidates,
      passedCount,
      location,
    }

    if (editingExam) {
      setExams((prev) =>
        prev.map((item) => (item.id === editingExam.id ? payload : item))
      )
      showToast('Da cap nhat ky thi dai')
    } else {
      setExams((prev) => [payload, ...prev])
      showToast('Da tao ky thi dai moi')
    }

    setShowExamModal(false)
    setEditingExam(null)
  }

  const requestDeleteExam = (item: ClubBeltExam) => {
    if (!requireAction('delete', 'xoa ky thi dai')) return
    setDeleteExamTarget(item)
  }

  const confirmDeleteExam = () => {
    if (!deleteExamTarget) return
    setExams((prev) => prev.filter((item) => item.id !== deleteExamTarget.id))
    showToast(`Da xoa ky thi ${deleteExamTarget.name}`, 'info')
    setDeleteExamTarget(null)
  }

  const markExamCompleted = (item: ClubBeltExam) => {
    if (!requireAction('update', 'hoan tat ky thi dai')) return
    setExams((prev) =>
      prev.map((exam) =>
        exam.id === item.id
          ? { ...exam, status: 'completed', passedCount: Math.max(exam.passedCount, 0) }
          : exam
      )
    )
    showToast('Da cap nhat trang thai ky thi')
  }

  const moduleColumns = [
      {
        key: 'select',
        label: (
          <input
            type="checkbox"
            checked={
              filteredModules.length > 0 &&
              filteredModules.every((item) => selectedModuleIds.has(item.id))
            }
            onChange={toggleSelectAllModules}
          />
        ),
        render: (row: ClubTrainingModule) => (
          <input
            type="checkbox"
            checked={selectedModuleIds.has(row.id)}
            onChange={() => toggleModuleSelection(row.id)}
          />
        ),
      },
      {
        key: 'module',
        label: 'Giao trinh',
        render: (row: ClubTrainingModule) => (
          <div>
            <div className="text-sm font-semibold">{row.title}</div>
            <div className="text-xs text-(--vct-text-secondary)">ID: {row.id}</div>
          </div>
        ),
      },
      {
        key: 'track',
        label: 'Nhom',
        render: (row: ClubTrainingModule) => TRACK_LABEL[row.track],
      },
      {
        key: 'level',
        label: 'Cap do',
        render: (row: ClubTrainingModule) => CLASS_LEVEL_LABEL[row.level],
      },
      {
        key: 'owner',
        label: 'Phu trach',
        render: (row: ClubTrainingModule) => (
          <div className="text-sm">
            <div>{row.owner}</div>
            <div className="text-xs text-(--vct-text-secondary)">
              Cap nhat: {row.updatedAt}
            </div>
          </div>
        ),
      },
      {
        key: 'duration',
        label: 'Ke hoach',
        render: (row: ClubTrainingModule) => (
          <span className="text-xs text-(--vct-text-secondary)">
            {row.durationWeeks} tuan • {row.lessons} bai
          </span>
        ),
      },
      {
        key: 'progress',
        label: 'Tien do',
        render: (row: ClubTrainingModule) => (
          <div className="min-w-[130px]">
            <VCT_ProgressBar value={row.progress} max={100} />
            <div className="mt-1 text-[11px] text-(--vct-text-secondary)">
              {row.progress}%
            </div>
          </div>
        ),
      },
      {
        key: 'status',
        label: 'Trang thai',
        render: (row: ClubTrainingModule) => (
          <VCT_Badge
            text={MODULE_STATUS_LABEL[row.status]}
            type={MODULE_STATUS_TONE[row.status]}
          />
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubTrainingModule) => (
          <div className="flex justify-end gap-1">
            {row.status !== 'active' ? (
              <button
                type="button"
                onClick={() => setModuleStatus(row.id, 'active')}
                className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-500"
              >
                Kich hoat
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setModuleStatus(row.id, 'archived')}
                className="rounded-md bg-slate-500/15 px-2 py-1 text-xs font-semibold text-slate-500"
              >
                Luu tru
              </button>
            )}
            {can('update') ? (
              <button
                type="button"
                onClick={() => openEditModule(row)}
                className="rounded-md bg-(--vct-bg-input) px-2 py-1 text-xs font-semibold"
              >
                Sua
              </button>
            ) : null}
            {can('delete') ? (
              <button
                type="button"
                onClick={() => requestDeleteModule(row)}
                className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500"
              >
                Xoa
              </button>
            ) : null}
          </div>
        ),
      },
    ]

  const examColumns = [
      {
        key: 'exam',
        label: 'Ky thi dai',
        render: (row: ClubBeltExam) => (
          <div>
            <div className="text-sm font-semibold">{row.name}</div>
            <div className="text-xs text-(--vct-text-secondary)">Ma: {row.id}</div>
          </div>
        ),
      },
      {
        key: 'level',
        label: 'Moc dai',
        render: (row: ClubBeltExam) => (
          <span className="text-sm">
            {BELT_EMOJI[row.level]} {BELT_LABEL[row.level]}
          </span>
        ),
      },
      {
        key: 'schedule',
        label: 'Ngay & dia diem',
        render: (row: ClubBeltExam) => (
          <div className="text-xs text-(--vct-text-secondary)">
            <div>{row.examDate}</div>
            <div>{row.location}</div>
          </div>
        ),
      },
      {
        key: 'result',
        label: 'Ket qua',
        render: (row: ClubBeltExam) => {
          const rate =
            row.candidates > 0 ? Math.round((row.passedCount / row.candidates) * 100) : 0
          return (
            <div className="text-xs text-(--vct-text-secondary)">
              <div>
                Dat: {row.passedCount}/{row.candidates}
              </div>
              <div>Ty le: {rate}%</div>
            </div>
          )
        },
      },
      {
        key: 'status',
        label: 'Trang thai',
        render: (row: ClubBeltExam) => (
          <VCT_Badge text={EXAM_STATUS_LABEL[row.status]} type={EXAM_STATUS_TONE[row.status]} />
        ),
      },
      {
        key: 'actions',
        label: '',
        align: 'right' as const,
        render: (row: ClubBeltExam) => (
          <div className="flex justify-end gap-1">
            {row.status !== 'completed' ? (
              <button
                type="button"
                onClick={() => markExamCompleted(row)}
                className="rounded-md bg-emerald-500/15 px-2 py-1 text-xs font-semibold text-emerald-500"
              >
                Hoan tat
              </button>
            ) : null}
            {can('update') ? (
              <button
                type="button"
                onClick={() => openEditExam(row)}
                className="rounded-md bg-(--vct-bg-input) px-2 py-1 text-xs font-semibold"
              >
                Sua
              </button>
            ) : null}
            {can('delete') ? (
              <button
                type="button"
                onClick={() => requestDeleteExam(row)}
                className="rounded-md bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-500"
              >
                Xoa
              </button>
            ) : null}
          </div>
        ),
      },
    ]

  const avgModuleProgress =
    modules.length > 0
      ? Math.round(modules.reduce((sum, item) => sum + item.progress, 0) / modules.length)
      : 0
  const completedExams = exams.filter((item) => item.status === 'completed')
  const totalCandidates = completedExams.reduce((sum, item) => sum + item.candidates, 0)
  const totalPassed = completedExams.reduce((sum, item) => sum + item.passedCount, 0)
  const passRate = totalCandidates > 0 ? Math.round((totalPassed / totalCandidates) * 100) : 0

  const stats: StatItem[] = [
    {
      label: 'Tong giao trinh',
      value: modules.length,
      icon: <VCT_Icons.Book size={18} />,
      color: 'var(--vct-accent-cyan)',
    },
    {
      label: 'Dang trien khai',
      value: modules.filter((item) => item.status === 'active').length,
      icon: <VCT_Icons.Activity size={18} />,
      color: 'var(--vct-success)',
    },
    {
      label: 'Tien do TB',
      value: `${avgModuleProgress}%`,
      icon: <VCT_Icons.Target size={18} />,
      color: 'var(--vct-warning)',
    },
    {
      label: 'Ty le dat ky thi',
      value: `${passRate}%`,
      icon: <VCT_Icons.Award size={18} />,
      color: 'var(--vct-info)',
      sub: `${totalPassed}/${totalCandidates} thi sinh`,
    },
  ]

  const activeFilters = React.useMemo(() => {
    const result: Array<{ key: string; label: string; value: string }> = []
    if (search) result.push({ key: 'search', label: 'Tim', value: search })
    if (activeTab === 'modules') {
      if (trackFilter) {
        result.push({ key: 'track', label: 'Nhom', value: TRACK_LABEL[trackFilter] })
      }
      if (moduleStatusFilter) {
        result.push({
          key: 'module-status',
          label: 'Trang thai',
          value: MODULE_STATUS_LABEL[moduleStatusFilter],
        })
      }
    } else if (examStatusFilter) {
      result.push({
        key: 'exam-status',
        label: 'Trang thai',
        value: EXAM_STATUS_LABEL[examStatusFilter],
      })
    }
    return result
  }, [activeTab, examStatusFilter, moduleStatusFilter, search, trackFilter])

  const removeFilter = (key: string) => {
    if (key === 'search') setSearch('')
    if (key === 'track') setTrackFilter('')
    if (key === 'module-status') setModuleStatusFilter('')
    if (key === 'exam-status') setExamStatusFilter('')
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
          Quan ly huan luyen CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Van hanh giao trinh tap luyen va cac ky thi thang dai.
        </p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      <div className="mb-4">
        <VCT_Tabs
          tabs={[
            { key: 'modules', label: 'Giao trinh', icon: <VCT_Icons.Book size={14} /> },
            { key: 'exams', label: 'Ky thi dai', icon: <VCT_Icons.Award size={14} /> },
          ]}
          activeTab={activeTab}
          onChange={(tab) => {
            setActiveTab(tab as TrainingTab)
            setSearch('')
            setTrackFilter('')
            setModuleStatusFilter('')
            setExamStatusFilter('')
            setSelectedModuleIds(new Set())
          }}
        />
      </div>

      {activeTab === 'modules' ? (
        <VCT_StatusPipeline
          className="mb-4"
          stages={[
            {
              key: 'active',
              label: 'Hoat dong',
              color: 'var(--vct-success)',
              count: modules.filter((item) => item.status === 'active').length,
            },
            {
              key: 'draft',
              label: 'Nhap',
              color: 'var(--vct-warning)',
              count: modules.filter((item) => item.status === 'draft').length,
            },
            {
              key: 'archived',
              label: 'Luu tru',
              color: 'var(--vct-text-tertiary)',
              count: modules.filter((item) => item.status === 'archived').length,
            },
          ]}
          activeStage={moduleStatusFilter || null}
          onStageClick={(key) => setModuleStatusFilter((key as ModuleStatus) ?? '')}
        />
      ) : null}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-[320px] flex-1 flex-wrap items-center gap-2">
          <div className="w-full max-w-[320px]">
            <VCT_SearchInput
              value={search}
              onChange={setSearch}
              onClear={() => setSearch('')}
              placeholder={
                activeTab === 'modules'
                  ? 'Tim ten giao trinh, nguoi phu trach...'
                  : 'Tim ky thi, dia diem, ma ky thi...'
              }
            />
          </div>
          {activeTab === 'modules' ? (
            <VCT_Select
              value={trackFilter}
              onChange={(value) => setTrackFilter((value as TrainingTrack) || '')}
              options={[
                { value: '', label: 'Tat ca nhom' },
                { value: 'ky_thuat', label: 'Ky thuat' },
                { value: 'quyen', label: 'Bai quyen' },
                { value: 'doi_khang', label: 'Doi khang' },
                { value: 'the_luc', label: 'The luc' },
              ]}
              className="min-w-[150px]"
            />
          ) : (
            <VCT_Select
              value={examStatusFilter}
              onChange={(value) => setExamStatusFilter((value as ExamStatus) || '')}
              options={[
                { value: '', label: 'Tat ca trang thai' },
                { value: 'upcoming', label: 'Sap dien ra' },
                { value: 'completed', label: 'Da ket thuc' },
                { value: 'draft', label: 'Nhap' },
              ]}
              className="min-w-[170px]"
            />
          )}
        </div>
        <VCT_Button
          icon={<VCT_Icons.Plus size={16} />}
          onClick={activeTab === 'modules' ? openCreateModule : openCreateExam}
        >
          {activeTab === 'modules' ? 'Tao giao trinh' : 'Tao ky thi dai'}
        </VCT_Button>
      </div>

      <VCT_FilterChips
        className="mb-4"
        filters={activeFilters}
        onRemove={removeFilter}
        onClearAll={() => {
          setSearch('')
          setTrackFilter('')
          setModuleStatusFilter('')
          setExamStatusFilter('')
        }}
      />

      {activeTab === 'modules' ? (
        filteredModules.length === 0 ? (
          <VCT_EmptyState
            icon="🥋"
            title="Khong co giao trinh phu hop"
            description="Thu doi bo loc hoac tao giao trinh moi."
            actionLabel={can('create') ? 'Tao giao trinh' : undefined}
            onAction={can('create') ? openCreateModule : undefined}
          />
        ) : (
          <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
            <VCT_Table columns={moduleColumns} data={filteredModules} rowKey="id" />
          </div>
        )
      ) : filteredExams.length === 0 ? (
        <VCT_EmptyState
          icon="🎖️"
          title="Khong co ky thi phu hop"
          description="Thu doi bo loc hoac tao ky thi dai moi."
          actionLabel={can('create') ? 'Tao ky thi dai' : undefined}
          onAction={can('create') ? openCreateExam : undefined}
        />
      ) : (
        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-2">
          <VCT_Table columns={examColumns} data={filteredExams} rowKey="id" />
        </div>
      )}

      <VCT_BulkActionsBar
        count={activeTab === 'modules' ? selectedModuleIds.size : 0}
        onClearSelection={() => setSelectedModuleIds(new Set())}
        actions={[
          {
            label: 'Kich hoat',
            variant: 'primary',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => bulkSetModuleStatus('active'),
          },
          {
            label: 'Nhap',
            variant: 'secondary',
            icon: <VCT_Icons.Edit size={14} />,
            onClick: () => bulkSetModuleStatus('draft'),
          },
          {
            label: 'Luu tru',
            variant: 'secondary',
            icon: <VCT_Icons.ArrowDownLeft size={14} />,
            onClick: () => bulkSetModuleStatus('archived'),
          },
        ]}
      />

      <VCT_Modal
        isOpen={showModuleModal}
        onClose={() => setShowModuleModal(false)}
        title={editingModule ? 'Cap nhat giao trinh' : 'Tao giao trinh moi'}
        width={760}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowModuleModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveModule}>
              {editingModule ? 'Luu thay doi' : 'Tao giao trinh'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <VCT_Field label="Ten giao trinh">
              <VCT_Input
                value={moduleForm.title}
                onChange={(event) =>
                  setModuleForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Can ban cong phap cap 1"
              />
            </VCT_Field>
          </div>
          <VCT_Field label="Nhom huan luyen">
            <VCT_Select
              value={moduleForm.track}
              onChange={(value) =>
                setModuleForm((prev) => ({ ...prev, track: value as TrainingTrack }))
              }
              options={[
                { value: 'ky_thuat', label: 'Ky thuat' },
                { value: 'quyen', label: 'Bai quyen' },
                { value: 'doi_khang', label: 'Doi khang' },
                { value: 'the_luc', label: 'The luc' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Cap do">
            <VCT_Select
              value={moduleForm.level}
              onChange={(value) =>
                setModuleForm((prev) => ({ ...prev, level: value as ClassLevel }))
              }
              options={[
                { value: 'beginner', label: 'Co ban' },
                { value: 'intermediate', label: 'Trung cap' },
                { value: 'advanced', label: 'Nang cao' },
                { value: 'competition', label: 'Thi dau' },
                { value: 'kids', label: 'Thieu nhi' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Nguoi phu trach">
            <VCT_Input
              value={moduleForm.owner}
              onChange={(event) =>
                setModuleForm((prev) => ({ ...prev, owner: event.target.value }))
              }
              placeholder="Le Quang Huy"
            />
          </VCT_Field>
          <VCT_Field label="Trang thai">
            <VCT_Select
              value={moduleForm.status}
              onChange={(value) =>
                setModuleForm((prev) => ({ ...prev, status: value as ModuleStatus }))
              }
              options={[
                { value: 'draft', label: 'Nhap' },
                { value: 'active', label: 'Hoat dong' },
                { value: 'archived', label: 'Luu tru' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="So tuan">
            <VCT_Input
              type="number"
              min={1}
              value={moduleForm.durationWeeks}
              onChange={(event) =>
                setModuleForm((prev) => ({ ...prev, durationWeeks: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="So bai hoc">
            <VCT_Input
              type="number"
              min={1}
              value={moduleForm.lessons}
              onChange={(event) =>
                setModuleForm((prev) => ({ ...prev, lessons: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Tien do (%)">
            <VCT_Input
              type="number"
              min={0}
              max={100}
              value={moduleForm.progress}
              onChange={(event) =>
                setModuleForm((prev) => ({ ...prev, progress: event.target.value }))
              }
            />
          </VCT_Field>
        </div>
      </VCT_Modal>

      <VCT_Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title={editingExam ? 'Cap nhat ky thi dai' : 'Tao ky thi dai moi'}
        width={760}
        footer={
          <div className="flex justify-end gap-2">
            <VCT_Button variant="ghost" onClick={() => setShowExamModal(false)}>
              Huy
            </VCT_Button>
            <VCT_Button onClick={saveExam}>
              {editingExam ? 'Luu thay doi' : 'Tao ky thi'}
            </VCT_Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <VCT_Field label="Ten ky thi">
              <VCT_Input
                value={examForm.name}
                onChange={(event) =>
                  setExamForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Ky thi thang dai quy 2"
              />
            </VCT_Field>
          </div>
          <VCT_Field label="Ngay thi">
            <VCT_Input
              type="date"
              value={examForm.examDate}
              onChange={(event) =>
                setExamForm((prev) => ({ ...prev, examDate: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="Moc dai">
            <VCT_Select
              value={examForm.level}
              onChange={(value) =>
                setExamForm((prev) => ({ ...prev, level: value as BeltRank }))
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
          <VCT_Field label="Trang thai">
            <VCT_Select
              value={examForm.status}
              onChange={(value) =>
                setExamForm((prev) => ({ ...prev, status: value as ExamStatus }))
              }
              options={[
                { value: 'draft', label: 'Nhap' },
                { value: 'upcoming', label: 'Sap dien ra' },
                { value: 'completed', label: 'Da ket thuc' },
              ]}
            />
          </VCT_Field>
          <VCT_Field label="Dia diem">
            <VCT_Input
              value={examForm.location}
              onChange={(event) =>
                setExamForm((prev) => ({ ...prev, location: event.target.value }))
              }
              placeholder="Nha tap trung tam"
            />
          </VCT_Field>
          <VCT_Field label="Thi sinh">
            <VCT_Input
              type="number"
              min={1}
              value={examForm.candidates}
              onChange={(event) =>
                setExamForm((prev) => ({ ...prev, candidates: event.target.value }))
              }
            />
          </VCT_Field>
          <VCT_Field label="So dat">
            <VCT_Input
              type="number"
              min={0}
              value={examForm.passedCount}
              onChange={(event) =>
                setExamForm((prev) => ({ ...prev, passedCount: event.target.value }))
              }
            />
          </VCT_Field>
        </div>
      </VCT_Modal>

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteModuleTarget)}
        onClose={() => setDeleteModuleTarget(null)}
        onConfirm={confirmDeleteModule}
        title="Xac nhan xoa giao trinh"
        message="Giao trinh se bi xoa khoi he thong huan luyen CLB."
        preview={deleteModuleTarget ? deleteModuleTarget.title : undefined}
        confirmLabel="Xoa"
        confirmVariant="danger"
      />

      <VCT_ConfirmDialog
        isOpen={Boolean(deleteExamTarget)}
        onClose={() => setDeleteExamTarget(null)}
        onConfirm={confirmDeleteExam}
        title="Xac nhan xoa ky thi"
        message="Ky thi se bi xoa khoi lich su thi thang dai."
        preview={deleteExamTarget ? deleteExamTarget.name : undefined}
        confirmLabel="Xoa"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
