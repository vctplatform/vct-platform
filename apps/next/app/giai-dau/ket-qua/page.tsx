'use client'

// ═══════════════════════════════════════════════════════════════
// Tournament Results & Medals
// ═══════════════════════════════════════════════════════════════

import { useState } from 'react'

interface TournamentResult {
  id: string
  category_name: string
  content_type: string
  gold_name: string
  gold_team: string
  silver_name: string
  silver_team: string
  bronze1_name: string
  bronze1_team: string
  bronze2_name: string
  bronze2_team: string
  is_finalized: boolean
}

interface TeamStanding {
  rank: number
  team_name: string
  province: string
  gold: number
  silver: number
  bronze: number
  total_medals: number
  points: number
}

export default function ResultsPage() {
  const [results] = useState<TournamentResult[]>([])
  const [standings] = useState<TeamStanding[]>([])
  const [tab, setTab] = useState<'results' | 'standings'>('results')

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
          🏅 Kết Quả & Huy Chương
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4, fontSize: 14 }}>
          Kết quả thi đấu theo nội dung và bảng xếp hạng toàn đoàn
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {([
          { key: 'results' as const, label: '🏆 Kết quả theo nội dung' },
          { key: 'standings' as const, label: '🥇 Xếp hạng toàn đoàn' },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '10px 20px', fontSize: 14, cursor: 'pointer', border: 'none',
            borderRadius: 8,
            background: tab === t.key ? 'rgba(59,130,246,0.3)' : 'transparent',
            color: tab === t.key ? '#60a5fa' : 'rgba(255,255,255,0.6)',
            fontWeight: tab === t.key ? 600 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'results' && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Nội dung', '🥇 Vàng', '🥈 Bạc', '🥉 Đồng 1', '🥉 Đồng 2', 'Trạng thái'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: 'left',
                    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Chưa có kết quả nào được ghi nhận.
                  </td>
                </tr>
              ) : results.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 500 }}>{r.category_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#fbbf24', fontWeight: 600 }}>{r.gold_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{r.gold_team}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#94a3b8', fontWeight: 600 }}>{r.silver_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{r.silver_team}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#cd7f32', fontWeight: 600 }}>{r.bronze1_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{r.bronze1_team}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ color: '#cd7f32', fontWeight: 600 }}>{r.bronze2_name}</div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{r.bronze2_team}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      background: r.is_finalized ? '#10b98120' : '#f59e0b20',
                      color: r.is_finalized ? '#10b981' : '#f59e0b',
                      padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                    }}>{r.is_finalized ? 'Đã xác nhận' : 'Chờ xác nhận'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'standings' && (
        <div style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                {['Hạng', 'Đoàn', 'Tỉnh/TP', '🥇', '🥈', '🥉', 'Tổng HC', 'Điểm'].map(h => (
                  <th key={h} style={{
                    padding: '12px 16px', textAlign: h === 'Hạng' ? 'center' : 'left',
                    color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: 0.5,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {standings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>
                    Chưa có bảng xếp hạng toàn đoàn.
                  </td>
                </tr>
              ) : standings.map(s => (
                <tr key={s.rank} style={{
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: s.rank <= 3 ? `rgba(251,191,36,${0.05 * (4 - s.rank)})` : 'transparent',
                }}>
                  <td style={{
                    padding: '12px 16px', textAlign: 'center',
                    color: s.rank <= 3 ? '#fbbf24' : '#fff',
                    fontWeight: 700, fontSize: s.rank <= 3 ? 18 : 14,
                  }}>
                    {s.rank <= 3 ? ['🥇', '🥈', '🥉'][s.rank - 1] : s.rank}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{s.team_name}</td>
                  <td style={{ padding: '12px 16px', color: 'rgba(255,255,255,0.7)' }}>{s.province}</td>
                  <td style={{ padding: '12px 16px', color: '#fbbf24', fontWeight: 600 }}>{s.gold}</td>
                  <td style={{ padding: '12px 16px', color: '#94a3b8', fontWeight: 600 }}>{s.silver}</td>
                  <td style={{ padding: '12px 16px', color: '#cd7f32', fontWeight: 600 }}>{s.bronze}</td>
                  <td style={{ padding: '12px 16px', color: '#fff', fontWeight: 600 }}>{s.total_medals}</td>
                  <td style={{ padding: '12px 16px', color: '#3b82f6', fontWeight: 700, fontSize: 16 }}>{s.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
