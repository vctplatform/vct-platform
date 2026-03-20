'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_Select, VCT_EmptyState
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useAttendance } from '../hooks/useTrainingAPI'

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
// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_attendance = () => {
    // ── Real API data ──
    const { data: apiAttendance, isLoading } = useAttendance()
    const [students, setStudents] = useState<Student[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (apiAttendance && apiAttendance.length > 0) {
            setStudents(apiAttendance.map(a => ({
                id: a.id, name: a.student_name || a.student_id,
                belt: 'N/A', status: a.status as Student['status'], note: a.notes,
            })))
        }
    }, [apiAttendance])

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
        <VCT_PageContainer animated>
            <VCT_PageHero
                icon={<VCT_Icons.Users size={24} />}
                title="Điểm danh Lớp học"
                subtitle={`Lớp Căn Bản 1 - Võ Đường Liên Hoa • 2023-11-20 | 18:00 - 19:30`}
                gradientFrom="rgba(59, 130, 246, 0.08)"
                gradientTo="rgba(16, 185, 129, 0.06)"
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Button icon={<VCT_Icons.Camera size={16} />} variant="secondary">Quét QR</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Check size={16} />} onClick={markAllPresent}>Tất cả Có mặt</VCT_Button>
                    </VCT_Stack>
                }
            />

            <VCT_StatRow items={[
                { label: 'Tổng Võ sinh', value: stats.total, icon: <VCT_Icons.Users size={18} />, color: '#3b82f6' },
                { label: 'Có mặt', value: stats.present, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Đi trễ', value: stats.late, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Vắng mặt', value: stats.absent, icon: <VCT_Icons.X size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            {/* ── TOOLBAR ── */}
            <div className="mb-6 bg-(--vct-bg-elevated) p-4 rounded-xl border border-(--vct-border-subtle)">
                <VCT_SearchInput placeholder="Tìm kiếm võ sinh theo tên, mã..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
            </div>

            {/* ── LIST ── */}
            <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4">Võ sinh</th>
                            <th className="p-4">Cấp đai</th>
                            <th className="p-4 text-center">Trạng thái</th>
                            <th className="p-4">Ghi chú</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-(--vct-border-subtle)">
                        {filtered.map(s => (
                            <tr key={s.id} className={`hover:bg-white/5 transition-colors ${s.status === 'absent' ? 'opacity-60' : ''}`}>
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-(--vct-border-strong) flex items-center justify-center font-bold text-white shrink-0">
                                            {s.name.split(' ').pop()?.[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{s.name}</div>
                                            <div className="text-xs text-(--vct-text-tertiary) font-mono">{s.id}</div>
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
                                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 w-20 transition-all ${s.status === 'present' ? 'bg-[#10b981] text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) border border-(--vct-border-subtle) hover:bg-[#10b98120] hover:text-[#10b981] hover:border-[#10b98150]'}`}
                                        >
                                            <VCT_Icons.Check size={20} />
                                            <span className="text-[10px] font-bold">Có mặt</span>
                                        </button>
                                        <button
                                            onClick={() => setStatus(s.id, 'late')}
                                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 w-20 transition-all ${s.status === 'late' ? 'bg-[#f59e0b] text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) border border-(--vct-border-subtle) hover:bg-[#f59e0b20] hover:text-[#f59e0b] hover:border-[#f59e0b50]'}`}
                                        >
                                            <VCT_Icons.Clock size={20} />
                                            <span className="text-[10px] font-bold">Đi trễ</span>
                                        </button>
                                        <button
                                            onClick={() => setStatus(s.id, 'absent')}
                                            className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 w-20 transition-all ${s.status === 'absent' ? 'bg-[#ef4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) border border-(--vct-border-subtle) hover:bg-[#ef444420] hover:text-[#ef4444] hover:border-[#ef444450]'}`}
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
                                        className="w-full bg-transparent border-b border-(--vct-border-strong) focus:border-(--vct-accent-cyan) outline-none text-sm text-(--vct-text-primary) transition-colors py-1"
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
        </VCT_PageContainer>
    )
}
