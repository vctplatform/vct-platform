'use client'

// ═══════════════════════════════════════════════════════════════
// Tournament Registration Management
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'

interface Registration {
  id: string
  team_name: string
  province: string
  team_type: string
  status: string
  total_athletes: number
  total_contents: number
  head_coach: string
  submitted_at?: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  nhap:            { label: 'Nháp',            color: '#94a3b8' },
  cho_duyet:       { label: 'Chờ duyệt',       color: '#f59e0b' },
  da_duyet:        { label: 'Đã duyệt',        color: '#10b981' },
  tu_choi:         { label: 'Từ chối',          color: '#ef4444' },
  yeu_cau_bo_sung: { label: 'Yêu cầu bổ sung', color: '#f97316' },
}

const TEAM_TYPE_MAP: Record<string, string> = {
  doan_tinh: 'Đoàn tỉnh',
  clb: 'CLB',
  ca_nhan: 'Cá nhân',
}

export default function RegistrationManagementPage() {
  const [registrations] = useState<Registration[]>([])
  const [filter, setFilter] = useState('')

  const filtered = registrations.filter(r =>
    !filter || r.status === filter
  )

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
            📝 Đăng Ký Tham Gia
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 14 }}>
            Quản lý đăng ký đoàn / CLB tham gia giải đấu
          </p>
        </div>
        <button style={{
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          color: '#fff', border: 'none', borderRadius: 8,
          padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>
          + Đăng ký mới
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { value: '', label: 'Tất cả' },
          ...Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label })),
        ].map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)} style={{
            background: filter === f.value ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.05)',
            border: filter === f.value ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
            color: filter === f.value ? '#60a5fa' : 'rgba(255,255,255,0.7)',
            borderRadius: 8, padding: '6px 14px', fontSize: 13, cursor: 'pointer',
          }}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Tên đoàn', 'Tỉnh/TP', 'Loại', 'HLV Trưởng', 'Số VĐV', 'Số ND', 'Trạng thái', 'Thao tác'].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Chưa có đăng ký nào. Nhấn "Đăng ký mới" để thêm đoàn tham gia.
                </td>
              </tr>
            ) : filtered.map(reg => {
              const st = STATUS_MAP[reg.status] || { label: reg.status, color: '#94a3b8' }
              return (
                <tr key={reg.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 500 }}>{reg.team_name}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{reg.province}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{TEAM_TYPE_MAP[reg.team_type] || reg.team_type}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{reg.head_coach}</td>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{reg.total_athletes}</td>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{reg.total_contents}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${st.color}20`, color: st.color,
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {reg.status === 'cho_duyet' && (
                        <>
                          <button style={{
                            background: '#10b98130', color: '#10b981', border: 'none',
                            borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          }}>✓ Duyệt</button>
                          <button style={{
                            background: '#ef444430', color: '#ef4444', border: 'none',
                            borderRadius: 4, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 600,
                          }}>✗ Từ chối</button>
                        </>
                      )}
                      <button style={{
                        background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                        borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer',
                      }}>👁</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
