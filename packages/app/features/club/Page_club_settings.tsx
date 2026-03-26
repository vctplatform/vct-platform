'use client'

import * as React from 'react'
import {
  VCT_Badge,
  VCT_Button,
  VCT_ConfirmDialog,
  VCT_Field,
  VCT_Input,
  VCT_Select,
  VCT_Toast,
} from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { useRouteActionGuard } from '../hooks/use-route-action-guard'
import {
  CLUB_SETTINGS_SEED,
  MEMBER_SEED,
  type ClubSettings,
  useClubStoredState,
} from './club-data'

const DAY_OPTIONS = [
  { day: 1, label: 'Thu 2' },
  { day: 2, label: 'Thu 3' },
  { day: 3, label: 'Thu 4' },
  { day: 4, label: 'Thu 5' },
  { day: 5, label: 'Thu 6' },
  { day: 6, label: 'Thu 7' },
  { day: 7, label: 'Chu nhat' },
]

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T

const parsePositiveInt = (value: string, fallback = 0) => {
  const normalized = Number.parseInt(value, 10)
  if (!Number.isFinite(normalized) || normalized < 0) return fallback
  return normalized
}

export const Page_club_settings = () => {
  const [settings, setSettings] = useClubStoredState('settings', CLUB_SETTINGS_SEED)
  const [members] = useClubStoredState('members', MEMBER_SEED)
  const [draft, setDraft] = React.useState<ClubSettings>(() => clone(settings))
  const [showResetConfirm, setShowResetConfirm] = React.useState(false)
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

  const { can, requireAction } = useRouteActionGuard('/club/settings', {
    notifyDenied: (message) => showToast(message, 'error'),
  })

  React.useEffect(() => {
    setDraft(clone(settings))
  }, [settings])

  const isDirty = React.useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(settings),
    [draft, settings]
  )

  const utilizationRate =
    draft.maxCapacity > 0 ? Math.round((members.length / draft.maxCapacity) * 100) : 0

  const stats: StatItem[] = [
    {
      label: 'Ma CLB',
      value: draft.code,
      icon: <VCT_Icons.FileText size={18} />,
      color: 'var(--vct-accent-cyan)',
    },
    {
      label: 'Cong suat hien tai',
      value: `${members.length}/${draft.maxCapacity}`,
      icon: <VCT_Icons.Users size={18} />,
      color: utilizationRate > 90 ? 'var(--vct-danger)' : 'var(--vct-success)',
      sub: `${utilizationRate}% suc chua`,
    },
    {
      label: 'Khung gio mo cua',
      value: `${draft.openTime} - ${draft.closeTime}`,
      icon: <VCT_Icons.Clock size={18} />,
      color: 'var(--vct-warning)',
    },
    {
      label: 'Trang thai CLB',
      value: draft.status === 'active' ? 'Hoat dong' : 'Tam dung',
      icon: <VCT_Icons.Activity size={18} />,
      color: draft.status === 'active' ? 'var(--vct-success)' : 'var(--vct-text-tertiary)',
    },
  ]

  const toggleTrainingDay = (day: number) => {
    if (!can('update')) return
    setDraft((prev) => {
      const active = prev.trainingDays.includes(day)
      const nextDays = active
        ? prev.trainingDays.filter((item) => item !== day)
        : [...prev.trainingDays, day]
      return {
        ...prev,
        trainingDays: nextDays.sort((left, right) => left - right),
      }
    })
  }

  const saveSettings = () => {
    if (!requireAction('update', 'cap nhat cau hinh CLB')) return

    const name = draft.name.trim()
    const shortName = draft.shortName.trim()
    const code = draft.code.trim()
    const address = draft.address.trim()
    const leaderName = draft.leaderName.trim()
    const leaderPhone = draft.leaderPhone.trim()
    const email = draft.email.trim()
    const website = draft.website.trim()
    const facilitySize = parsePositiveInt(`${draft.facilitySize}`, 0)
    const maxCapacity = parsePositiveInt(`${draft.maxCapacity}`, 0)

    if (!name || !shortName || !code) {
      showToast('Ten CLB, ten viet tat va ma CLB la bat buoc', 'warning')
      return
    }
    if (!address || !leaderName || !leaderPhone) {
      showToast('Dia chi va thong tin nguoi dai dien la bat buoc', 'warning')
      return
    }
    if (!email) {
      showToast('Email lien he la bat buoc', 'warning')
      return
    }
    if (!draft.foundedDate) {
      showToast('Ngay thanh lap la bat buoc', 'warning')
      return
    }
    if (!draft.openTime || !draft.closeTime) {
      showToast('Khung gio mo cua la bat buoc', 'warning')
      return
    }
    if (draft.closeTime <= draft.openTime) {
      showToast('Gio dong cua phai sau gio mo cua', 'warning')
      return
    }
    if (facilitySize <= 0 || maxCapacity <= 0) {
      showToast('Dien tich va suc chua toi da phai lon hon 0', 'warning')
      return
    }
    if (draft.trainingDays.length === 0) {
      showToast('Can chon it nhat 1 ngay tap', 'warning')
      return
    }

    setSettings({
      ...draft,
      name,
      shortName,
      code,
      address,
      leaderName,
      leaderPhone,
      email,
      website,
      facilitySize,
      maxCapacity,
    })
    showToast('Da luu cau hinh CLB')
  }

  const resetDraft = () => {
    setDraft(clone(settings))
    showToast('Da huy thay doi chua luu', 'info')
  }

  const restoreSeed = () => {
    if (!requireAction('manage', 'phuc hoi cau hinh mac dinh')) return
    setSettings(clone(CLUB_SETTINGS_SEED))
    showToast('Da phuc hoi cau hinh mac dinh', 'warning')
    setShowResetConfirm(false)
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
          Cau hinh CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Cap nhat thong tin don vi, van hanh co so, lich tap va thong tin lien he.
        </p>
      </div>

      <VCT_StatRow items={stats} className="mb-6" />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-(--vct-text-secondary)">
          {isDirty ? (
            <VCT_Badge text="Co thay doi chua luu" type="warning" />
          ) : (
            <VCT_Badge text="Da dong bo" type="success" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <VCT_Button variant="ghost" onClick={resetDraft} disabled={!isDirty}>
            Huy thay doi
          </VCT_Button>
          <VCT_Button onClick={saveSettings} disabled={!isDirty}>
            Luu cau hinh
          </VCT_Button>
          <VCT_Button
            variant="secondary"
            onClick={() => setShowResetConfirm(true)}
            disabled={!can('manage')}
          >
            Phuc hoi mac dinh
          </VCT_Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
          <h2 className="mb-3 text-sm font-bold text-(--vct-text-primary)">
            Thong tin co ban
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="md:col-span-2">
              <VCT_Field label="Ten CLB">
                <VCT_Input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
              </VCT_Field>
            </div>
            <VCT_Field label="Ten viet tat">
              <VCT_Input
                value={draft.shortName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, shortName: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Ma CLB">
              <VCT_Input
                value={draft.code}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Loai hinh">
              <VCT_Select
                value={draft.type}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, type: value as ClubSettings['type'] }))
                }
                options={[
                  { value: 'club', label: 'Cau lac bo' },
                  { value: 'vo_duong', label: 'Vo duong' },
                ]}
              />
            </VCT_Field>
            <VCT_Field label="Dong phai">
              <VCT_Input
                value={draft.lineage}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, lineage: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Ngay thanh lap">
              <VCT_Input
                type="date"
                value={draft.foundedDate}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, foundedDate: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Trang thai hoat dong">
              <VCT_Select
                value={draft.status}
                onChange={(value) =>
                  setDraft((prev) => ({ ...prev, status: value as ClubSettings['status'] }))
                }
                options={[
                  { value: 'active', label: 'Hoat dong' },
                  { value: 'paused', label: 'Tam dung' },
                ]}
              />
            </VCT_Field>
          </div>
        </section>

        <section className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
          <h2 className="mb-3 text-sm font-bold text-(--vct-text-primary)">
            Lien he va dia chi
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <VCT_Field label="Nguoi dai dien">
              <VCT_Input
                value={draft.leaderName}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, leaderName: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="So dien thoai">
              <VCT_Input
                value={draft.leaderPhone}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, leaderPhone: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Email">
              <VCT_Input
                value={draft.email}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, email: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Website">
              <VCT_Input
                value={draft.website}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, website: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Quan/Huyen">
              <VCT_Input
                value={draft.district}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, district: event.target.value }))
                }
              />
            </VCT_Field>
            <div className="md:col-span-2">
              <VCT_Field label="Dia chi">
                <VCT_Input
                  value={draft.address}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, address: event.target.value }))
                  }
                />
              </VCT_Field>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
          <h2 className="mb-3 text-sm font-bold text-(--vct-text-primary)">
            Co so vat chat
          </h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <VCT_Field label="Dien tich (m2)">
              <VCT_Input
                type="number"
                min={1}
                value={`${draft.facilitySize}`}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    facilitySize: parsePositiveInt(event.target.value, prev.facilitySize),
                  }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Suc chua toi da">
              <VCT_Input
                type="number"
                min={1}
                value={`${draft.maxCapacity}`}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    maxCapacity: parsePositiveInt(event.target.value, prev.maxCapacity),
                  }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Gio mo cua">
              <VCT_Input
                type="time"
                value={draft.openTime}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, openTime: event.target.value }))
                }
              />
            </VCT_Field>
            <VCT_Field label="Gio dong cua">
              <VCT_Input
                type="time"
                value={draft.closeTime}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, closeTime: event.target.value }))
                }
              />
            </VCT_Field>
          </div>
        </section>

        <section className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4">
          <h2 className="mb-3 text-sm font-bold text-(--vct-text-primary)">
            Lich hoat dong
          </h2>
          <div className="mb-3 text-xs text-(--vct-text-secondary)">
            Chon cac ngay CLB mo tap luyen trong tuan.
          </div>
          <div className="flex flex-wrap gap-2">
            {DAY_OPTIONS.map((item) => {
              const active = draft.trainingDays.includes(item.day)
              return (
                <button
                  key={item.day}
                  type="button"
                  onClick={() => toggleTrainingDay(item.day)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'border-cyan-500/40 bg-cyan-500/15 text-cyan-500'
                      : 'border-(--vct-border-subtle) bg-(--vct-bg-card) text-(--vct-text-secondary)'
                  }`}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
          <div className="mt-4 text-xs text-(--vct-text-secondary)">
            He thong dang ghi nhan {draft.trainingDays.length} ngay tap moi tuan.
          </div>
        </section>
      </div>

      <VCT_ConfirmDialog
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={restoreSeed}
        title="Phuc hoi cau hinh mac dinh"
        message="Thao tac nay se ghi de toan bo cau hinh CLB bang gia tri mac dinh."
        preview={draft.name}
        confirmLabel="Phuc hoi"
        confirmVariant="danger"
      />
    </VCT_PageContainer>
  )
}
