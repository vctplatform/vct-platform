'use client'

// ═══════════════════════════════════════════════════════════════
// Tournament Management Dashboard
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react'

interface DashboardStats {
  total_categories: number
  total_registrations: number
  pending_registrations: number
  approved_registrations: number
  total_athletes: number
  total_teams: number
  total_schedule_slots: number
  completed_slots: number
  total_results: number
  finalized_results: number
  total_gold: number
  total_silver: number
  total_bronze: number
  registration_rate: number
  completion_rate: number
}

const EMPTY_STATS: DashboardStats = {
  total_categories: 0, total_registrations: 0, pending_registrations: 0,
  approved_registrations: 0, total_athletes: 0, total_teams: 0,
  total_schedule_slots: 0, completed_slots: 0, total_results: 0,
  finalized_results: 0, total_gold: 0, total_silver: 0, total_bronze: 0,
  registration_rate: 0, completion_rate: 0,
}

function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      transition: 'all 0.2s',
    }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}20`, color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#fff' }}>{value}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{title}</div>
      </div>
    </div>
  )
}

export default function TournamentManagementDashboard() {
  const [stats] = useState<DashboardStats>(EMPTY_STATS)

  return (
    <div style={{ padding: 32, maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>
          🏆 Quản Lý Giải Đấu
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 8 }}>
          Tổng quan về tình trạng tổ chức và quản lý giải đấu
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}>
        <StatCard title="Nội dung thi đấu" value={stats.total_categories} icon="📋" color="#3b82f6" />
        <StatCard title="Đoàn đăng ký" value={stats.total_registrations} icon="📝" color="#10b981" />
        <StatCard title="Chờ duyệt" value={stats.pending_registrations} icon="⏳" color="#f59e0b" />
        <StatCard title="Đã duyệt" value={stats.approved_registrations} icon="✅" color="#22c55e" />
        <StatCard title="Tổng VĐV" value={stats.total_athletes} icon="🥋" color="#8b5cf6" />
        <StatCard title="Lịch thi đấu" value={stats.total_schedule_slots} icon="📅" color="#06b6d4" />
        <StatCard title="Đã hoàn thành" value={stats.completed_slots} icon="🏁" color="#10b981" />
        <StatCard title="Kết quả xác nhận" value={stats.finalized_results} icon="🏅" color="#f59e0b" />
      </div>

      {/* Medal Summary */}
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 16 }}>
          🏅 Tổng Huy Chương
        </h2>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#fbbf24' }}>🥇 {stats.total_gold}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Huy chương Vàng</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#94a3b8' }}>🥈 {stats.total_silver}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Huy chương Bạc</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#cd7f32' }}>🥉 {stats.total_bronze}</div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>Huy chương Đồng</div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: 12,
      }}>
        {[
          { label: 'Nội dung thi đấu', href: '/giai-dau/noi-dung', icon: '📋' },
          { label: 'Đăng ký tham gia', href: '/giai-dau/dang-ky', icon: '📝' },
          { label: 'Lịch thi đấu', href: '/giai-dau/lich-thi', icon: '📅' },
          { label: 'Kết quả & Huy chương', href: '/giai-dau/ket-qua', icon: '🏅' },
          { label: 'Thống kê', href: '/giai-dau/thong-ke', icon: '📊' },
        ].map(link => (
          <a key={link.href} href={link.href} style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '16px 20px',
            color: '#fff',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 500,
            transition: 'all 0.2s',
          }}>
            <span style={{ fontSize: 20 }}>{link.icon}</span>
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}
