'use client'
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  VCT_Button,
  VCT_Card,
  VCT_ProgressBar,
  VCT_Stack,
  VCT_Tabs,
  VCT_Toast,
} from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { CAN_KYS, LUOT_THI_QUYENS, TRAN_DAUS } from '../data/mock-data'
import { TOURNAMENT_CONFIG } from '../data/tournament-config'
import { repositories, useEntityCollection } from '../data/repository'
import {
  downloadRowsAsExcel,
  downloadTextFile,
  openPrintWindow,
  rowsToCsv,
} from '../data/export-utils'
import { useToast } from '../hooks/use-toast'

const formatDateStamp = () => new Date().toISOString().slice(0, 10)

export const Page_reports = () => {
  const [tab, setTab] = useState('tong_quan')
  const { toast, showToast, hideToast } = useToast()

  const teamsStore = useEntityCollection(repositories.teams.mock)
  const athletesStore = useEntityCollection(repositories.athletes.mock)
  const registrationStore = useEntityCollection(repositories.registration.mock)
  const scheduleStore = useEntityCollection(repositories.schedule.mock)
  const arenasStore = useEntityCollection(repositories.arenas.mock)
  const refereesStore = useEntityCollection(repositories.referees.mock)
  const appealsStore = useEntityCollection(repositories.appeals.mock)

  const teams = teamsStore.items
  const athletes = athletesStore.items
  const registrations = registrationStore.items
  const schedules = scheduleStore.items
  const arenas = arenasStore.items
  const referees = refereesStore.items
  const appeals = appealsStore.items

  const loadError =
    teamsStore.uiState.error ||
    athletesStore.uiState.error ||
    registrationStore.uiState.error ||
    scheduleStore.uiState.error ||
    arenasStore.uiState.error ||
    refereesStore.uiState.error ||
    appealsStore.uiState.error ||
    null

  const stats = useMemo(
    () => ({
      doan: teams.length,
      vdv: athletes.length,
      dk: registrations.length,
      tt: referees.length,
      san: arenas.length,
      tran: TRAN_DAUS.length,
      quyen: LUOT_THI_QUYENS.length,
      canky: CAN_KYS.length,
      kn: appeals.length,
      lich: schedules.length,
      vdv_nam: athletes.filter((v) => v.gioi === 'nam').length,
      vdv_nu: athletes.filter((v) => v.gioi === 'nu').length,
      doan_xn: teams.filter(
        (d) => d.trang_thai === 'da_xac_nhan' || d.trang_thai === 'da_checkin'
      ).length,
      can_dat: CAN_KYS.filter((c) => c.ket_qua === 'dat').length,
      tran_xong: TRAN_DAUS.filter((t) => t.trang_thai === 'ket_thuc').length,
      kn_done: appeals.filter(
        (k) => k.trang_thai === 'chap_nhan' || k.trang_thai === 'bac_bo'
      ).length,
    }),
    [appeals, arenas, athletes, referees, registrations, schedules, teams]
  )

  const vdvByDoan = useMemo(() => {
    const map: Record<string, { nam: number; nu: number; total: number }> = {}
    teams.forEach((team) => {
      map[team.tat || team.ma || team.ten] = { nam: 0, nu: 0, total: 0 }
    })

    athletes.forEach((athlete) => {
      const team = teams.find((item) => item.id === athlete.doan_id)
      const teamKey = team?.tat || team?.ma || team?.ten
      if (!teamKey || !map[teamKey]) return
      map[teamKey]!.total += 1
      if (athlete.gioi === 'nam') {
        map[teamKey]!.nam += 1
      } else {
        map[teamKey]!.nu += 1
      }
    })

    return Object.entries(map)
      .filter(([, value]) => value.total > 0)
      .sort(([, a], [, b]) => b.total - a.total)
  }, [athletes, teams])

  const maxVdv = vdvByDoan.length > 0 ? Math.max(...vdvByDoan.map(([, v]) => v.total)) : 1

  const sections = [
    { label: 'Tổng quan', key: 'tong_quan', icon: <VCT_Icons.Layout size={14} /> },
    { label: 'Đăng ký', key: 'dang_ky', icon: <VCT_Icons.Users size={14} /> },
    { label: 'Thi đấu', key: 'thi_dau', icon: <VCT_Icons.Swords size={14} /> },
    { label: 'Biểu đồ', key: 'bieu_do', icon: <VCT_Icons.Activity size={14} /> },
  ]

  const teamRows = useMemo(
    () =>
      teams.map((d) => ({
        ma_doan: d.ma,
        ten_doan: d.ten,
        tinh: d.tinh,
        so_vdv: d.so_vdv,
        trang_thai: d.trang_thai,
        le_phi_tong: d.le_phi.tong,
        le_phi_da_dong: d.le_phi.da_dong,
      })),
    [teams]
  )

  const exportCsv = () => {
    const csv = rowsToCsv(teamRows)
    downloadTextFile(
      `bao-cao-doan-${formatDateStamp()}.csv`,
      csv,
      'text/csv;charset=utf-8'
    )
    showToast(`Đã xuất CSV ${teamRows.length} đoàn`)
  }

  const exportExcel = () => {
    downloadRowsAsExcel(
      `bao-cao-doan-${formatDateStamp()}.xls`,
      teamRows,
      'BaoCaoDoan'
    )
    showToast(`Đã xuất Excel ${teamRows.length} đoàn`)
  }

  const exportJson = () => {
    const payload = {
      tournament: TOURNAMENT_CONFIG.ten_giai,
      generatedAt: new Date().toISOString(),
      summary: stats,
      teams: teamRows,
    }
    downloadTextFile(
      `bao-cao-tong-hop-${formatDateStamp()}.json`,
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8'
    )
    showToast('Đã xuất JSON tổng hợp')
  }

  const exportPdf = () => {
    const html = `
      <h1>${TOURNAMENT_CONFIG.ten_giai}</h1>
      <p class="muted">Báo cáo tổng hợp tạo lúc ${new Date().toLocaleString('vi-VN')}</p>
      <h2>Tổng quan</h2>
      <table>
        <tbody>
          <tr><th>Đoàn</th><td>${stats.doan}</td><th>VĐV</th><td>${stats.vdv}</td></tr>
          <tr><th>Đăng ký</th><td>${stats.dk}</td><th>Trọng tài</th><td>${stats.tt}</td></tr>
          <tr><th>Lịch thi đấu</th><td>${stats.lich}</td><th>Khiếu nại</th><td>${stats.kn}</td></tr>
          <tr><th>Trận đã kết thúc</th><td>${stats.tran_xong}</td><th>Cân đạt</th><td>${stats.can_dat}</td></tr>
        </tbody>
      </table>
      <h2 style="margin-top: 24px;">Danh sách đoàn</h2>
      <table>
        <thead>
          <tr>
            <th>Mã</th>
            <th>Tên đoàn</th>
            <th>Tỉnh</th>
            <th>VĐV</th>
            <th>Trạng thái</th>
            <th>Lệ phí</th>
          </tr>
        </thead>
        <tbody>
          ${teamRows
            .map(
              (row) => `
                <tr>
                  <td>${row.ma_doan}</td>
                  <td>${row.ten_doan}</td>
                  <td>${row.tinh}</td>
                  <td>${row.so_vdv}</td>
                  <td>${row.trang_thai}</td>
                  <td>${row.le_phi_da_dong}/${row.le_phi_tong}</td>
                </tr>`
            )
            .join('')}
        </tbody>
      </table>`

    if (!openPrintWindow({ title: 'Báo cáo tổng hợp', html })) {
      showToast('Trình duyệt chặn cửa sổ in. Vui lòng cho phép popup.', 'error')
      return
    }
    showToast('Đã mở bản in (có thể lưu PDF)')
  }

  return (
    <div className="mx-auto max-w-[1400px] pb-24">
      <VCT_Toast
        isVisible={toast.show}
        message={toast.msg}
        type={toast.type}
        onClose={hideToast}
      />

      {loadError && (
        <div
          style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 12,
            border: '1px solid rgba(239,68,68,0.25)',
            background: 'rgba(239,68,68,0.08)',
            color: 'var(--vct-danger)',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          Không thể tải đầy đủ dữ liệu báo cáo: {loadError}
        </div>
      )}

      <VCT_Stack direction="row" gap={16} align="center" className="mb-6">
        <div className="flex-1">
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              opacity: 0.5,
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            BÁO CÁO TỔNG HỢP
          </div>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.7 }}>
            {TOURNAMENT_CONFIG.ten_giai}
          </div>
        </div>
        <VCT_Button
          variant="secondary"
          icon={<VCT_Icons.Download size={16} />}
          onClick={exportCsv}
        >
          Xuất CSV
        </VCT_Button>
        <VCT_Button
          variant="secondary"
          icon={<VCT_Icons.Download size={16} />}
          onClick={exportExcel}
        >
          Xuất Excel
        </VCT_Button>
        <VCT_Button
          variant="secondary"
          icon={<VCT_Icons.FileText size={16} />}
          onClick={exportJson}
        >
          Xuất JSON
        </VCT_Button>
        <VCT_Button
          variant="secondary"
          icon={<VCT_Icons.Printer size={16} />}
          onClick={exportPdf}
        >
          In/PDF
        </VCT_Button>
      </VCT_Stack>

      <VCT_Tabs
        tabs={sections.map((section) => ({
          key: section.key,
          label: section.label,
          icon: section.icon,
        }))}
        activeTab={tab}
        onChange={setTab}
      />

      {tab === 'tong_quan' && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 16,
          }}
        >
          {[
            { label: 'Đoàn đăng ký', v: stats.doan, max: 60, icon: <VCT_Icons.Building2 size={20} />, c: 'var(--vct-accent-cyan)' },
            { label: 'VĐV', v: stats.vdv, max: 500, icon: <VCT_Icons.Users size={20} />, c: 'var(--vct-warning)' },
            { label: 'ND Đăng ký', v: stats.dk, max: 300, icon: <VCT_Icons.FileText size={20} />, c: 'var(--vct-info)' },
            { label: 'Trọng tài', v: stats.tt, max: 50, icon: <VCT_Icons.Shield size={20} />, c: 'var(--vct-success)' },
            { label: 'Sàn đấu', v: stats.san, max: 12, icon: <VCT_Icons.Layout size={20} />, c: 'var(--vct-accent-cyan)' },
            { label: 'Trận ĐK', v: stats.tran, max: 300, icon: <VCT_Icons.Swords size={20} />, c: 'var(--vct-danger)' },
            { label: 'Lượt Quyền', v: stats.quyen, max: 300, icon: <VCT_Icons.Award size={20} />, c: 'var(--vct-accent-cyan)' },
            { label: 'Cân ký', v: stats.canky, max: 300, icon: <VCT_Icons.Activity size={20} />, c: 'var(--vct-warning)' },
            { label: 'Khiếu nại', v: stats.kn, max: 100, icon: <VCT_Icons.Alert size={20} />, c: 'var(--vct-danger)' },
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <VCT_Card>
                <VCT_Stack direction="row" gap={12} align="center" style={{ marginBottom: 12 }}>
                  <div style={{ color: item.c }}>{item.icon}</div>
                  <span style={{ fontSize: 12, fontWeight: 700, opacity: 0.6 }}>{item.label}</span>
                  <span style={{ marginLeft: 'auto', fontSize: 20, fontWeight: 900, color: item.c }}>
                    {item.v}
                  </span>
                </VCT_Stack>
                <VCT_ProgressBar value={item.v} max={item.max} color={item.c} />
              </VCT_Card>
            </motion.div>
          ))}
        </div>
      )}

      {tab === 'dang_ky' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <VCT_Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Thống kê Đoàn</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng đoàn</span>
                <span style={{ fontWeight: 900 }}>{stats.doan}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Đã xác nhận</span>
                <span style={{ fontWeight: 900, color: 'var(--vct-success)' }}>{stats.doan_xn}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tỷ lệ xác nhận</span>
                <span style={{ fontWeight: 900, color: 'var(--vct-accent-cyan)' }}>
                  {Math.round((stats.doan_xn / Math.max(1, stats.doan)) * 100)}%
                </span>
              </div>
              <VCT_ProgressBar value={stats.doan_xn} max={Math.max(1, stats.doan)} showLabel />
            </div>
          </VCT_Card>
          <VCT_Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>VĐV theo giới tính</div>
            <div style={{ display: 'flex', gap: 24, textAlign: 'center', justifyContent: 'center' }}>
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--vct-info)' }}>{stats.vdv_nam}</div>
                <div style={{ fontSize: 12, opacity: 0.5 }}>Nam</div>
              </div>
              <div style={{ width: 2, background: 'var(--vct-border-subtle)' }} />
              <div>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--vct-accent-pink)' }}>{stats.vdv_nu}</div>
                <div style={{ fontSize: 12, opacity: 0.5 }}>Nữ</div>
              </div>
            </div>
          </VCT_Card>
        </div>
      )}

      {tab === 'thi_dau' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <VCT_Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Tiến độ Đối kháng</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng trận</span>
                <span style={{ fontWeight: 900 }}>{stats.tran}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Đã kết thúc</span>
                <span style={{ fontWeight: 900, color: 'var(--vct-success)' }}>{stats.tran_xong}</span>
              </div>
              <VCT_ProgressBar value={stats.tran_xong} max={Math.max(1, stats.tran)} showLabel />
            </div>
          </VCT_Card>
          <VCT_Card>
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 16 }}>Cân ký</div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tổng cần cân</span>
                <span style={{ fontWeight: 900 }}>{stats.canky}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Đạt cân</span>
                <span style={{ fontWeight: 900, color: 'var(--vct-success)' }}>{stats.can_dat}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Tỷ lệ đạt</span>
                <span style={{ fontWeight: 900, color: 'var(--vct-accent-cyan)' }}>
                  {Math.round((stats.can_dat / Math.max(1, stats.canky)) * 100)}%
                </span>
              </div>
              <VCT_ProgressBar value={stats.can_dat} max={Math.max(1, stats.canky)} showLabel />
            </div>
          </VCT_Card>
        </div>
      )}

      {tab === 'bieu_do' && (
        <VCT_Card>
          <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 20 }}>VĐV theo Đoàn</div>
          <div style={{ display: 'grid', gap: 8 }}>
            {vdvByDoan.map(([team, value]) => (
              <div key={team} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontWeight: 700, fontSize: 12, minWidth: 60, textAlign: 'right' }}>
                  {team}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 24,
                    display: 'flex',
                    borderRadius: 6,
                    overflow: 'hidden',
                    background: 'var(--vct-text-primary)',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value.nam / maxVdv) * 100}%` }}
                    transition={{ delay: 0.2 }}
                    style={{
                      height: '100%',
                      background: 'var(--vct-info)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {value.nam > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--vct-bg-elevated)' }}>
                        {value.nam}
                      </span>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(value.nu / maxVdv) * 100}%` }}
                    transition={{ delay: 0.3 }}
                    style={{
                      height: '100%',
                      background: 'var(--vct-accent-pink)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {value.nu > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--vct-bg-elevated)' }}>
                        {value.nu}
                      </span>
                    )}
                  </motion.div>
                </div>
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: 14,
                    fontFamily: 'monospace',
                    minWidth: 24,
                    textAlign: 'right',
                  }}
                >
                  {value.total}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 12,
              justifyContent: 'center',
              fontSize: 11,
            }}
          >
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: 'var(--vct-info)',
                  marginRight: 4,
                }}
              />
              Nam
            </span>
            <span>
              <span
                style={{
                  display: 'inline-block',
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: 'var(--vct-accent-pink)',
                  marginRight: 4,
                }}
              />
              Nữ
            </span>
          </div>
        </VCT_Card>
      )}
    </div>
  )
}
