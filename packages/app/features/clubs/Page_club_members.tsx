'use client'
import React, { useState, useMemo } from 'react'
import { VCT_Icons } from '@vct/ui'

interface ClubMember {
    id: string; name: string; dob: string; gender: 'Nam' | 'Nữ'; belt: string
    joinDate: string; status: 'active' | 'inactive' | 'suspended'; phone: string
    feeStatus: 'paid' | 'partial' | 'overdue'; attendance: number
}

const MEMBERS: ClubMember[] = [
    { id: 'm1', name: 'Nguyễn Hoàng Nam', dob: '15/03/2002', gender: 'Nam', belt: 'Huyền đai 2', joinDate: '01/06/2020', status: 'active', phone: '0901-xxx', feeStatus: 'paid', attendance: 95 },
    { id: 'm2', name: 'Trần Thị Mai', dob: '22/08/2005', gender: 'Nữ', belt: 'Hồng đai', joinDate: '15/03/2022', status: 'active', phone: '0912-xxx', feeStatus: 'paid', attendance: 88 },
    { id: 'm3', name: 'Lê Minh Tuấn', dob: '01/11/2008', gender: 'Nam', belt: 'Lam đai', joinDate: '01/09/2023', status: 'active', phone: '0933-xxx', feeStatus: 'partial', attendance: 72 },
    { id: 'm4', name: 'Phạm Thanh Hương', dob: '30/04/2010', gender: 'Nữ', belt: 'Vàng đai', joinDate: '01/01/2024', status: 'active', phone: '0945-xxx', feeStatus: 'overdue', attendance: 45 },
    { id: 'm5', name: 'Võ Đức Anh', dob: '12/07/2001', gender: 'Nam', belt: 'Huyền đai 1', joinDate: '15/08/2019', status: 'inactive', phone: '0967-xxx', feeStatus: 'overdue', attendance: 20 },
    { id: 'm6', name: 'Ngô Thị Lan', dob: '18/02/2006', gender: 'Nữ', belt: 'Nâu đai', joinDate: '01/06/2021', status: 'active', phone: '0978-xxx', feeStatus: 'paid', attendance: 92 },
]

const BELT_COLORS: Record<string, string> = { 'Vàng đai': 'var(--vct-gold)', 'Lam đai': 'var(--vct-info)', 'Nâu đai': '#a16207', 'Hồng đai': 'var(--vct-accent-pink)', 'Huyền đai 1': 'var(--vct-bg-input)', 'Huyền đai 2': 'var(--vct-text-primary)' }

export function Page_club_members() {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    const filtered = useMemo(() => {
        let list = MEMBERS
        if (statusFilter !== 'all') list = list.filter(m => m.status === statusFilter)
        if (search) { const q = search.toLowerCase(); list = list.filter(m => m.name.toLowerCase().includes(q)) }
        return list
    }, [search, statusFilter])

    return (
        <div className="grid gap-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="m-0 text-2xl font-black">Quản Lý Võ Sinh</h1>
                    <p className="mt-1 text-sm text-vct-text-muted">Danh sách, đai, học phí, điểm danh</p>
                </div>
                <button className="flex items-center gap-1 rounded-lg bg-vct-accent px-3 py-2 text-xs font-bold text-white hover:brightness-110 transition">
                    <VCT_Icons.Plus size={14} /> Thêm võ sinh
                </button>
            </div>

            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[{ l: 'Tổng võ sinh', v: MEMBERS.length, c: 'var(--vct-info)' }, { l: 'Đang tập', v: MEMBERS.filter(m => m.status === 'active').length, c: 'var(--vct-success)' },
                { l: 'Overdue phí', v: MEMBERS.filter(m => m.feeStatus === 'overdue').length, c: 'var(--vct-danger)' },
                { l: 'TB điểm danh', v: Math.round(MEMBERS.reduce((s, m) => s + m.attendance, 0) / MEMBERS.length) + '%', c: 'var(--vct-warning)' }
                ].map(s => (
                    <div key={s.l} className="rounded-xl border border-vct-border bg-vct-elevated p-3 text-center">
                        <div className="text-xl font-black" style={{ color: s.c }}>{s.v}</div>
                        <div className="text-xs text-vct-text-muted font-bold">{s.l}</div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 max-w-xs">
                    <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Tìm võ sinh..."
                        className="w-full rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent" />
                </div>
                <div className="flex gap-1 rounded-lg border border-vct-border p-0.5">
                    {[{ v: 'all', l: 'Tất cả' }, { v: 'active', l: 'Đang tập' }, { v: 'inactive', l: 'Nghỉ' }].map(f => (
                        <button key={f.v} onClick={() => setStatusFilter(f.v)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${statusFilter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                    ))}
                </div>
            </div>

            <div className="rounded-xl border border-vct-border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-vct-elevated"><tr>
                        <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Võ sinh</th>
                        <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Đai</th>
                        <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Điểm danh</th>
                        <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Học phí</th>
                        <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Trạng thái</th>
                    </tr></thead>
                    <tbody>
                        {filtered.map(m => (
                            <tr key={m.id} className="border-t border-vct-border hover:bg-vct-elevated/50 transition cursor-pointer">
                                <td className="px-4 py-3">
                                    <div className="font-bold">{m.name}</div>
                                    <div className="text-xs text-vct-text-muted">{m.gender} • {m.dob} • Từ {m.joinDate}</div>
                                </td>
                                <td className="px-4 py-3">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded-full border" style={{ background: BELT_COLORS[m.belt] || 'var(--vct-text-tertiary)' }} />
                                        <span className="text-xs font-bold">{m.belt}</span>
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-xs font-bold ${m.attendance >= 80 ? 'text-emerald-500' : m.attendance >= 50 ? 'text-amber-500' : 'text-red-500'}`}>{m.attendance}%</span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.feeStatus === 'paid' ? 'bg-emerald-500/15 text-emerald-600' : m.feeStatus === 'partial' ? 'bg-amber-500/15 text-amber-600' : 'bg-red-500/15 text-red-600'}`}>
                                        {m.feeStatus === 'paid' ? '✅ Đã đóng' : m.feeStatus === 'partial' ? '⏳ Một phần' : '❌ Quá hạn'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.status === 'active' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-gray-500/15 text-gray-600'}`}>
                                        {m.status === 'active' ? '🟢 Đang tập' : '⚪ Nghỉ'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
