'use client'

import * as React from 'react'
import {
  VCT_Badge,
  VCT_Card,
  VCT_ProgressBar,
  VCT_Stack,
  VCT_Toast,
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import {
  ATTENDANCE_SEED,
  BELT_EXAM_SEED,
  CLASS_SEED,
  DAY_LABEL,
  EQUIPMENT_SEED,
  FACILITY_SEED,
  FINANCE_ENTRY_SEED,
  MEMBER_SEED,
  TOURNAMENT_SEED,
  calculateFinanceSummary,
  useClubStoredState,
} from './club-data'

const toDayOfWeek = (date: Date) => {
  const day = date.getDay()
  return day === 0 ? 7 : day
}

const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`

export const Page_club_dashboard = () => {
  const [members] = useClubStoredState('members', MEMBER_SEED)
  const [classes] = useClubStoredState('classes', CLASS_SEED)
  const [tournaments] = useClubStoredState('tournaments', TOURNAMENT_SEED)
  const [financeEntries] = useClubStoredState('finance', FINANCE_ENTRY_SEED)
  const [beltExams] = useClubStoredState('belt-exams', BELT_EXAM_SEED)
  const [attendance] = useClubStoredState('attendance', ATTENDANCE_SEED)
  const [equipment] = useClubStoredState('equipment', EQUIPMENT_SEED)
  const [facilities] = useClubStoredState('facilities', FACILITY_SEED)
  const [toast, setToast] = React.useState({
    show: false,
    msg: '',
    type: 'info' as 'success' | 'warning' | 'error' | 'info',
  })

  const financeSummary = React.useMemo(
    () => calculateFinanceSummary(financeEntries),
    [financeEntries]
  )

  const todayClassCount = React.useMemo(() => {
    const today = toDayOfWeek(new Date())
    return classes.reduce((total, item) => {
      const hasSession = item.sessions.some((session) => session.dayOfWeek === today)
      return hasSession ? total + 1 : total
    }, 0)
  }, [classes])

  const activeMemberCount = members.filter((member) => member.status === 'active').length
  const pendingMemberCount = members.filter((member) => member.status === 'pending').length
  const pausedClassCount = classes.filter((item) => item.status === 'paused').length
  const ongoingTournamentCount = tournaments.filter(
    (item) => item.status === 'ongoing'
  ).length
  const upcomingExams = beltExams.filter((item) => item.status === 'upcoming').length

  // New module KPIs
  const attendanceRate = React.useMemo(() => {
    if (attendance.length === 0) return 0
    const ok = attendance.filter(r => r.status === 'present' || r.status === 'late').length
    return Math.round((ok / attendance.length) * 100)
  }, [attendance])
  const equipmentValue = React.useMemo(() => equipment.reduce((s, e) => s + e.totalValue, 0), [equipment])
  const needReplace = React.useMemo(() => equipment.filter(e => e.condition === 'damaged' || e.condition === 'retired').reduce((s, e) => s + e.quantity, 0), [equipment])
  const overdueMaint = React.useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return facilities.filter(f => f.nextMaintenanceDate && f.nextMaintenanceDate <= today).length
  }, [facilities])

  const kpis: StatItem[] = [
    {
      label: 'Thanh vien hoat dong',
      value: activeMemberCount,
      icon: <VCT_Icons.Users size={18} />,
      color: '#0ea5e9',
      sub: `${pendingMemberCount} cho duyet`,
    },
    {
      label: 'Lop hoc hoat dong',
      value: classes.filter((item) => item.status === 'active').length,
      icon: <VCT_Icons.Book size={18} />,
      color: '#10b981',
      sub: `${todayClassCount} lop hom nay`,
    },
    {
      label: 'Giai dau can theo doi',
      value:
        tournaments.filter(
          (item) => item.status === 'registration' || item.status === 'upcoming'
        ).length,
      icon: <VCT_Icons.Trophy size={18} />,
      color: '#f59e0b',
      sub: `${ongoingTournamentCount} dang dien ra`,
    },
    {
      label: 'So du quy',
      value: formatCurrency(financeSummary.balance),
      icon: <VCT_Icons.DollarSign size={18} />,
      color: financeSummary.balance < 0 ? '#ef4444' : '#8b5cf6',
      sub: `Thu: ${formatCurrency(financeSummary.totalIncome)}`,
    },
  ]

  const alerts = React.useMemo(() => {
    const items: Array<{ id: string; label: string; tone: 'warning' | 'info' | 'error' }> = []
    if (pendingMemberCount > 0) {
      items.push({
        id: 'pending-member',
        label: `${pendingMemberCount} thanh vien cho duyet`,
        tone: 'warning',
      })
    }
    if (pausedClassCount > 0) {
      items.push({
        id: 'paused-class',
        label: `${pausedClassCount} lop dang tam nghi`,
        tone: 'info',
      })
    }
    if (financeSummary.pending > 0) {
      items.push({
        id: 'pending-transaction',
        label: `${formatCurrency(financeSummary.pending)} giao dich dang treo`,
        tone: 'warning',
      })
    }
    if (upcomingExams > 0) {
      items.push({
        id: 'upcoming-exam',
        label: `${upcomingExams} ky thi dai sap den`,
        tone: 'info',
      })
    }
    if (financeSummary.balance < 0) {
      items.push({
        id: 'negative-balance',
        label: 'So du quy dang am, can dieu chinh thu chi',
        tone: 'error',
      })
    }
    return items
  }, [financeSummary.balance, financeSummary.pending, pausedClassCount, pendingMemberCount, upcomingExams])

  const todayClasses = React.useMemo(() => {
    const today = toDayOfWeek(new Date())
    return classes
      .filter((item) => item.sessions.some((session) => session.dayOfWeek === today))
      .map((item) => ({
        ...item,
        sessions: item.sessions.filter((session) => session.dayOfWeek === today),
      }))
      .slice(0, 4)
  }, [classes])

  const quickActions = [
    {
      id: 'members',
      label: 'Quan ly thanh vien',
      desc: 'Them moi, duyet va cap nhat ho so',
      href: '/club/members',
      icon: <VCT_Icons.Users size={18} />,
    },
    {
      id: 'classes',
      label: 'Quan ly lop hoc',
      desc: 'Lich hoc, si so va hoc phi',
      href: '/club/classes',
      icon: <VCT_Icons.Book size={18} />,
    },
    {
      id: 'finance',
      label: 'So cai thu chi',
      desc: 'Ghi nhan dong tien va so du',
      href: '/club/finance',
      icon: <VCT_Icons.DollarSign size={18} />,
    },
    {
      id: 'cert',
      label: 'Thăng đai',
      desc: 'Kỳ thi đai và chứng nhận',
      href: '/club/certifications',
      icon: <VCT_Icons.Award size={18} />,
    },
    {
      id: 'attendance',
      label: 'Điểm danh',
      desc: 'Ghi nhận điểm danh hàng ngày',
      href: '/club/attendance',
      icon: <VCT_Icons.Check size={18} />,
    },
    {
      id: 'equipment',
      label: 'Thiết bị',
      desc: 'Kiểm kê trang thiết bị',
      href: '/club/equipment',
      icon: <VCT_Icons.Layers size={18} />,
    },
    {
      id: 'facilities',
      label: 'Cơ sở vật chất',
      desc: 'Phòng tập, sân đấu, kho',
      href: '/club/facilities',
      icon: <VCT_Icons.Building size={18} />,
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
          Dashboard CLB
        </h1>
        <p className="mt-1 text-sm text-(--vct-text-secondary)">
          Tong quan hoat dong thanh vien, lop hoc, giai dau va tai chinh.
        </p>
      </div>

      <VCT_StatRow items={kpis} className="mb-4" />

      {/* New module KPIs */}
      <VCT_StatRow items={[
        { label: 'Tỷ lệ điểm danh', value: `${attendanceRate}%`, icon: <VCT_Icons.Activity size={18} />, color: attendanceRate >= 80 ? '#10b981' : '#f59e0b' },
        { label: 'Giá trị thiết bị', value: formatCurrency(equipmentValue), icon: <VCT_Icons.Layers size={18} />, color: '#8b5cf6', sub: needReplace > 0 ? `${needReplace} cần thay` : undefined },
        { label: 'Cơ sở vật chất', value: facilities.length, icon: <VCT_Icons.Building size={18} />, color: '#0ea5e9', sub: overdueMaint > 0 ? `${overdueMaint} quá hạn bảo trì` : undefined },
        { label: 'Sắp thi đai', value: upcomingExams, icon: <VCT_Icons.Award size={18} />, color: '#f59e0b' },
      ] as StatItem[]} className="mb-6" />

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <VCT_Card title="Canh bao van hanh" className="lg:col-span-2">
          {alerts.length === 0 ? (
            <div className="text-sm text-(--vct-text-secondary)">
              Khong co canh bao quan trong.
            </div>
          ) : (
            <div className="grid gap-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) px-3 py-2"
                >
                  <span className="text-sm text-(--vct-text-primary)">{alert.label}</span>
                  <VCT_Badge
                    text={alert.tone === 'error' ? 'Can xu ly' : 'Theo doi'}
                    type={alert.tone === 'error' ? 'danger' : alert.tone}
                    pulse
                  />
                </div>
              ))}
            </div>
          )}
        </VCT_Card>

        <VCT_Card title="Ty le lap day lop">
          <div className="grid gap-3">
            {classes.slice(0, 4).map((item) => {
              const percent =
                item.maxStudents <= 0
                  ? 0
                  : Math.round((item.currentStudents / item.maxStudents) * 100)
              return (
                <div key={item.id}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-semibold text-(--vct-text-primary)">
                      {item.name}
                    </span>
                    <span className="text-(--vct-text-secondary)">
                      {item.currentStudents}/{item.maxStudents}
                    </span>
                  </div>
                  <VCT_ProgressBar value={item.currentStudents} max={item.maxStudents} />
                  <div className="mt-1 text-[11px] text-(--vct-text-secondary)">
                    {percent}% cong suat
                  </div>
                </div>
              )
            })}
          </div>
        </VCT_Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {quickActions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-4 transition hover:border-(--vct-accent-cyan)/35 hover:bg-(--vct-bg-hover)"
          >
            <VCT_Stack direction="row" align="center" justify="space-between" gap={8}>
              <span className="text-(--vct-accent-cyan)">{action.icon}</span>
              <VCT_Icons.ChevronRight size={16} />
            </VCT_Stack>
            <div className="mt-3 text-sm font-bold text-(--vct-text-primary)">
              {action.label}
            </div>
            <div className="mt-1 text-xs text-(--vct-text-secondary)">
              {action.desc}
            </div>
          </a>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <VCT_Card title="Lop hoc hom nay">
          {todayClasses.length === 0 ? (
            <div className="text-sm text-(--vct-text-secondary)">
              Khong co buoi hoc trong ngay.
            </div>
          ) : (
            <div className="grid gap-2">
              {todayClasses.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) p-3"
                >
                  <div className="text-sm font-semibold text-(--vct-text-primary)">
                    {item.name}
                  </div>
                  <div className="mt-1 text-xs text-(--vct-text-secondary)">
                    HLV: {item.coachName}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {item.sessions.map((session, index) => (
                      <span
                        key={`${item.id}-${index}`}
                        className="rounded-md bg-(--vct-bg-card) px-2 py-1 text-[11px] text-(--vct-text-secondary)"
                      >
                        {DAY_LABEL(session.dayOfWeek)} {session.startTime}-{session.endTime}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </VCT_Card>

        <VCT_Card title="Giai dau sap toi">
          <div className="grid gap-2">
            {tournaments
              .filter((item) => item.status !== 'completed')
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-(--vct-text-primary)">
                        {item.name}
                      </div>
                      <div className="mt-1 text-xs text-(--vct-text-secondary)">
                        {item.startDate} - {item.endDate} • {item.location}
                      </div>
                    </div>
                    <VCT_Badge
                      text={item.status === 'registration' ? 'Dang ky' : item.status === 'upcoming' ? 'Sap toi' : 'Dang thi'}
                      type={item.status === 'ongoing' ? 'success' : 'info'}
                    />
                  </div>
                  <div className="mt-2 text-xs text-(--vct-text-secondary)">
                    {item.registeredAthletes} VDV • {item.events} noi dung
                  </div>
                </div>
              ))}
          </div>
        </VCT_Card>
      </div>
    </VCT_PageContainer>
  )
}

