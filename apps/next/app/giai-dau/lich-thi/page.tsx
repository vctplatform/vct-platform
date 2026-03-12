'use client'

// ═══════════════════════════════════════════════════════════════
// Tournament Schedule Management
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'

interface ScheduleSlot {
  id: string
  arena_name: string
  date: string
  session: string
  start_time: string
  end_time: string
  category_name: string
  content_type: string
  match_count: number
  status: string
}

const SESSION_MAP: Record<string, { label: string; icon: string }> = {
  sang: { label: 'Sáng', icon: '🌅' },
  chieu: { label: 'Chiều', icon: '☀️' },
  toi: { label: 'Tối', icon: '🌙' },
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  du_kien:      { label: 'Dự kiến',       color: '#94a3b8' },
  xac_nhan:     { label: 'Xác nhận',      color: '#3b82f6' },
  dang_dien_ra: { label: 'Đang diễn ra',  color: '#f59e0b' },
  hoan_thanh:   { label: 'Hoàn thành',    color: '#10b981' },
  hoan:         { label: 'Hoãn',          color: '#ef4444' },
}

export default function ScheduleManagementPage() {
  const [slots] = useState<ScheduleSlot[]>([])
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table')

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
            📅 Lịch Thi Đấu
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 14 }}>
            Quản lý lịch thi đấu theo sân và phiên
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8,
            display: 'flex',
            overflow: 'hidden',
          }}>
            {(['table', 'timeline'] as const).map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)} style={{
                padding: '8px 16px', fontSize: 13, cursor: 'pointer', border: 'none',
                background: viewMode === mode ? 'rgba(59,130,246,0.3)' : 'transparent',
                color: viewMode === mode ? '#60a5fa' : 'rgba(255,255,255,0.6)',
                fontWeight: viewMode === mode ? 600 : 400,
              }}>
                {mode === 'table' ? '📋 Bảng' : '📊 Timeline'}
              </button>
            ))}
          </div>
          <button style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff', border: 'none', borderRadius: 8,
            padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
          }}>
            + Thêm lịch
          </button>
        </div>
      </div>

      {/* Table View */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        overflow: 'hidden',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              {['Ngày', 'Phiên', 'Sân', 'Giờ', 'Nội dung', 'Số trận', 'Trạng thái', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slots.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Chưa có lịch thi đấu. Nhấn "Thêm lịch" để tạo.
                </td>
              </tr>
            ) : slots.map(slot => {
              const session = SESSION_MAP[slot.session] || { label: slot.session, icon: '📋' }
              const st = STATUS_MAP[slot.status] || { label: slot.status, color: '#94a3b8' }
              return (
                <tr key={slot.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 500 }}>{slot.date}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
                    {session.icon} {session.label}
                  </td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{slot.arena_name}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>
                    {slot.start_time} - {slot.end_time}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#fff' }}>{slot.category_name}</td>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{slot.match_count}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: `${st.color}20`, color: st.color,
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>{st.label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button style={{
                      background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none',
                      borderRadius: 4, padding: '4px 8px', fontSize: 12, cursor: 'pointer',
                    }}>✏️</button>
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
