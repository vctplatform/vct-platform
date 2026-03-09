'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_Select, VCT_EmptyState, VCT_KpiCard
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Student {
    id: string
    name: string
    belt: string
    avatar?: string
    status: 'present' | 'absent' | 'late' | 'none'
    note?: string
}

const MOCK_CLASS = {
    id: 'C1',
    name: 'Lớp Căn Bản 1 - Võ Đường Liên Hoa',
    date: '2023-11-20',
    time: '18:00 - 19:30',
    instructor: 'HLV Lê Văn A'
}

const MOCK_STUDENTS: Student[] = [
    { id: 'HS001', name: 'Nguyễn Văn Tiến', belt: 'Đai Vàng', status: 'present' },
    { id: 'HS002', name: 'Trần Thị Mai', belt: 'Đai Trắng', status: 'present' },
    { id: 'HS003', name: 'Lê Hoàng Tâm', belt: 'Đai Trắng', status: 'late', note: 'Kẹt xe' },
    { id: 'HS004', name: 'Phạm Minh Đức', belt: 'Đai Cam', status: 'absent', note: 'Bệnh' },
    { id: 'HS005', name: 'Vũ Thanh Hằng', belt: 'Đai Vàng', status: 'none' },
    { id: 'HS006', name: 'Đặng Mậu Tài', belt: 'Đai Trắng', status: 'none' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_attendance = () => {
    const [students, setStudents] = useState(MOCK_STUDENTS)
    const [search, setSearch] = useState('')

    const filtered = useMemo(() => {
        let v = students
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
        }
        return v
    }, [search, students])

    const stats = {
        total: students.length,
        present: students.filter(s => s.status === 'present').length,
        late: students.filter(s => s.status === 'late').length,
        absent: students.filter(s => s.status === 'absent').length,
        none: students.filter(s => s.status === 'none').length,
    }

    const setStatus = (id: string, st: 'present' | 'absent' | 'late') => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, status: st } : s))
    }

    const markAllPresent = () => {
        setStudents(prev => prev.map(s => s.status === 'none' ? { ...s, status: 'present' } : s))
    }

    return (
        <div className="mx-auto max-w-[1200px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)] mb-2">Điểm danh Lớp học</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm">
                        <span className="text-[var(--vct-text-secondary)] font-medium bg-[var(--vct-bg-elevated)] px-3 py-1 rounded-md border border-[var(--vct-border-subtle)] flex items-center gap-2">
                            <VCT_Icons.Users size={16} className="text-[#8b5cf6]" /> {MOCK_CLASS.name}
                        </span>
                        <span className="text-[var(--vct-text-secondary)] font-medium bg-[var(--vct-bg-elevated)] px-3 py-1 rounded-md border border-[var(--vct-border-subtle)] flex items-center gap-2">
                            <VCT_Icons.Calendar size={16} className="text-[#0ea5e9]" /> {MOCK_CLASS.date} | {MOCK_CLASS.time}
                        </span>
                    </div>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button icon={<VCT_Icons.Camera size={16} />} variant="secondary">Quét QR</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Check size={16} />} onClick={markAllPresent}>Tất cả Có mặt</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <div className="vct-stagger mb-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--vct-bg-card)] border-l-4 border-l-[#3b82f6] rounded-r-xl p-4 border-y border-r border-[#1e293b]">
                    <div className="text-xs font-bold text-[#94a3b8] uppercase">TỔNG Võ Sinh</div>
                    <div className="text-2xl font-black text-white mt-1">{stats.total}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border-l-4 border-l-[#10b981] rounded-r-xl p-4 border-y border-r border-[#1e293b]">
                    <div className="text-xs font-bold text-[#94a3b8] uppercase">Có Mặt</div>
                    <div className="text-2xl font-black text-[#10b981] mt-1">{stats.present}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border-l-4 border-l-[#f59e0b] rounded-r-xl p-4 border-y border-r border-[#1e293b]">
                    <div className="text-xs font-bold text-[#94a3b8] uppercase">Đi Trễ</div>
                    <div className="text-2xl font-black text-[#f59e0b] mt-1">{stats.late}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border-l-4 border-l-[#ef4444] rounded-r-xl p-4 border-y border-r border-[#1e293b]">
                    <div className="text-xs font-bold text-[#94a3b8] uppercase">Vắng Mặt</div>
                    <div className="text-2xl font-black text-[#ef4444] mt-1">{stats.absent}</div>
                </div>
            </div>

            {/* ── TOOLBAR ── */}
            <div className="mb-6 bg-[var(--vct-bg-elevated)] p-4 rounded-xl border border-[var(--vct-border-subtle)]">
                <VCT_SearchInput placeholder="Tìm kiếm võ sinh theo tên, mã..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
            </div>

            {/* ── LIST ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                            <th className="p-4">Võ sinh</th>
                            <th className="p-4">Cấp đai</th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                        {filtered.map(s => (
                            <tr key={s.id} className={`hover:bg-white/5 transition-colors ${s.status === 'absent' ? 'opacity-60' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-[var(--vct-border-strong)] flex items-center justify-center font-bold text-white shrink-0">
                                            {s.name.split(' ').pop()?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-[var(--vct-text-primary)]">{s.name}</div>
                                            <div className="text-xs text-[var(--vct-text-tertiary)] font-mono">{s.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs font-semibold px-2 py-1 rounded tracking-wide bg-yellow-500/20 text-yellow-500">
                                        {s.belt}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => setStatus(s.id, 'present')}
                                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 w-20 transition-all ${s.status === 'present' ? 'bg-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] border border-[var(--vct-border-subtle)] hover:bg-[#10b98120] hover:text-[#10b981] hover:border-[#10b98150]'}`}
                                        >
                                            <VCT_Icons.Check size={20} />
                                            <span className="text-[10px] font-bold">Có mặt</span>
                                        </button>
                                        <button
                                            onClick={() => setStatus(s.id, 'late')}
                                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 w-20 transition-all ${s.status === 'late' ? 'bg-[#f59e0b] text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] border border-[var(--vct-border-subtle)] hover:bg-[#f59e0b20] hover:text-[#f59e0b] hover:border-[#f59e0b50]'}`}
                                        >
                                            <VCT_Icons.Clock size={20} />
                                            <span className="text-[10px] font-bold">Đi trễ</span>
                                        </button>
                                        <button
                                            onClick={() => setStatus(s.id, 'absent')}
                                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 w-20 transition-all ${s.status === 'absent' ? 'bg-[#ef4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] border border-[var(--vct-border-subtle)] hover:bg-[#ef444420] hover:text-[#ef4444] hover:border-[#ef444450]'}`}
                                        >
                                            <VCT_Icons.X size={20} />
                                            <span className="text-[10px] font-bold">Vắng</span>
                                        </button>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <input
                                        type="text"
                                        placeholder="Thêm ghi chú..."
                                        className="w-full bg-transparent border-b border-[var(--vct-border-strong)] focus:border-[var(--vct-accent-cyan)] outline-none text-sm text-[var(--vct-text-primary)] transition-colors py-1"
                                        defaultValue={s.note || ''}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filtered.length === 0 && (
                <div className="mt-8">
                    <VCT_EmptyState title="Không tìm thấy võ sinh" description="Thử thay đổi từ khóa tìm kiếm." icon="🔍" />
                </div>
            )}
        </div>
    )
}
