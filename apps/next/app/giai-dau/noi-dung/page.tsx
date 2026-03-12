'use client'

// ═══════════════════════════════════════════════════════════════
// Tournament Category Management
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'

interface Category {
  id: string
  content_type: string
  age_group: string
  weight_class: string
  gender: string
  name: string
  max_athletes: number
  is_team_event: boolean
  status: string
}

const CONTENT_TYPES = [
  { value: 'doi_khang', label: 'Đối kháng ⚔️' },
  { value: 'quyen', label: 'Quyền 🥋' },
  { value: 'quyen_dong_doi', label: 'Quyền đồng đội 👥' },
  { value: 'song_luyen', label: 'Song luyện 🤝' },
  { value: 'nhieu_luyen', label: 'Nhiều luyện 👫' },
  { value: 'binh_khi', label: 'Binh khí 🗡️' },
  { value: 'vu_khi_doi_luyen', label: 'Vũ khí đối luyện ⚔️' },
  { value: 'tu_ve', label: 'Tự vệ 🛡️' },
]

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  active: { label: 'Hoạt động', color: '#10b981' },
  closed: { label: 'Đã đóng', color: '#94a3b8' },
  cancelled: { label: 'Đã hủy', color: '#ef4444' },
}

export default function CategoryManagementPage() {
  const [categories] = useState<Category[]>([])
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
            📋 Nội Dung Thi Đấu
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 14 }}>
            Quản lý các nội dung thi đấu trong giải
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Thêm nội dung
        </button>
      </div>

      {showForm && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}>
          <h3 style={{ color: '#fff', marginBottom: 16 }}>Thêm nội dung thi đấu mới</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>Loại nội dung</label>
              <select style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 14,
              }}>
                {CONTENT_TYPES.map(ct => (
                  <option key={ct.value} value={ct.value}>{ct.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>Lứa tuổi</label>
              <input type="text" placeholder="VD: Thiếu niên 1" style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 14, boxSizing: 'border-box',
              }} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>Hạng cân</label>
              <input type="text" placeholder="VD: 48kg" style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 14, boxSizing: 'border-box',
              }} />
            </div>
            <div>
              <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, display: 'block', marginBottom: 4 }}>Giới tính</label>
              <select style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
                color: '#fff', fontSize: 14,
              }}>
                <option value="nam">Nam</option>
                <option value="nu">Nữ</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button style={{
              background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer',
            }}>Lưu</button>
            <button onClick={() => setShowForm(false)} style={{
              background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 16px', fontSize: 14, cursor: 'pointer',
            }}>Hủy</button>
          </div>
        </div>
      )}

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
              {['Tên nội dung', 'Loại', 'Lứa tuổi', 'Hạng cân', 'Giới tính', 'Trạng thái', ''].map(h => (
                <th key={h} style={{
                  padding: '12px 16px', textAlign: 'left',
                  color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: 0.5,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                  Chưa có nội dung thi đấu nào. Nhấn "Thêm nội dung" để bắt đầu.
                </td>
              </tr>
            ) : categories.map(cat => {
              const st = STATUS_MAP[cat.status] || { label: cat.status, color: '#94a3b8' }
              return (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 500 }}>{cat.name}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{cat.content_type}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{cat.age_group}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{cat.weight_class || '—'}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{cat.gender === 'nam' ? 'Nam' : 'Nữ'}</td>
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
