'use client'
import React, { useState } from 'react'
import { VCT_Icons } from '@vct/ui'

interface Facility { id: string; name: string; type: string; status: 'available' | 'in_use' | 'maintenance'; capacity: number; equipment: string[]; schedule?: string }

const FACILITIES: Facility[] = [
    { id: 'f1', name: 'Phòng tập A1', type: 'Phòng tập', status: 'in_use', capacity: 30, equipment: ['Đệm sàn', 'Gương', 'Bao đấm x4'], schedule: 'Lớp Cơ Bản A — 17:00-18:30' },
    { id: 'f2', name: 'Phòng tập A2', type: 'Phòng tập', status: 'available', capacity: 20, equipment: ['Đệm sàn', 'Gương', 'Bao đấm x2', 'Vòng đai ring'] },
    { id: 'f3', name: 'Sân tập ngoài trời', type: 'Sân ngoài', status: 'available', capacity: 50, equipment: ['Sân cỏ nhân tạo', 'Bao đấm treo x6'] },
    { id: 'f4', name: 'Ring thi đấu', type: 'Ring', status: 'maintenance', capacity: 2, equipment: ['Ring 8x8m', 'Ghế trọng tài', 'Bảng điểm điện tử'] },
    { id: 'f5', name: 'Phòng tập gym', type: 'Gym', status: 'available', capacity: 15, equipment: ['Tạ đơn', 'Tạ đòn', 'Ghế đẩy', 'Máy chạy x3'] },
    { id: 'f6', name: 'Phòng B1 (Thiếu nhi)', type: 'Phòng tập', status: 'in_use', capacity: 25, equipment: ['Đệm mềm', 'Gương', 'Đồ chơi tập'], schedule: 'Lớp Thiếu Nhi — 16:00-17:00' },
]

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
    available: { label: '✅ Trống', color: 'var(--vct-success)', bg: 'bg-emerald-500/15' },
    in_use: { label: '🔵 Đang sử dụng', color: 'var(--vct-info)', bg: 'bg-blue-500/15' },
    maintenance: { label: '🔧 Bảo trì', color: 'var(--vct-warning)', bg: 'bg-amber-500/15' },
}

export function Page_club_facilities() {
    const [filter, setFilter] = useState('all')
    const filtered = filter === 'all' ? FACILITIES : FACILITIES.filter(f => f.status === filter)

    return (
        <div className="grid gap-6">
            <div>
                <h1 className="m-0 text-2xl font-black">Quản Lý Cơ Sở Vật Chất</h1>
                <p className="mt-1 text-sm text-vct-text-muted">Phòng tập, sân bãi, ring và trang thiết bị</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {Object.entries(STATUS_MAP).map(([k, v]) => (
                    <div key={k} className="rounded-xl border border-vct-border bg-vct-elevated p-3 text-center">
                        <div className="text-2xl font-black" style={{ color: v.color }}>{FACILITIES.filter(f => f.status === k).length}</div>
                        <div className="text-xs text-vct-text-muted font-bold">{v.label}</div>
                    </div>
                ))}
            </div>

            <div className="flex gap-1 rounded-lg border border-vct-border p-0.5 w-fit">
                {[{ v: 'all', l: 'Tất cả' }, { v: 'available', l: '✅ Trống' }, { v: 'in_use', l: '🔵 Đang dùng' }, { v: 'maintenance', l: '🔧 Bảo trì' }].map(f => (
                    <button key={f.v} onClick={() => setFilter(f.v)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition ${filter === f.v ? 'bg-vct-accent text-white' : 'text-vct-text-muted hover:bg-vct-input'}`}>{f.l}</button>
                ))}
            </div>

            <div className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-4">
                {filtered.map(f => {
                    const st = STATUS_MAP[f.status]!
                    return (
                        <div key={f.id} className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden hover:shadow-lg transition">
                            <div className="h-2" style={{ background: st.color }} />
                            <div className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <div className="font-bold text-sm">{f.name}</div>
                                        <div className="text-xs text-vct-text-muted">{f.type} • {f.capacity} người</div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${st.bg}`} style={{ color: st.color }}>{st.label}</span>
                                </div>
                                {f.schedule && (
                                    <div className="text-xs bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1.5 mb-3 text-blue-600 font-bold">
                                        📅 {f.schedule}
                                    </div>
                                )}
                                <div className="text-xs font-bold mb-1">Trang thiết bị:</div>
                                <div className="flex flex-wrap gap-1">
                                    {f.equipment.map(eq => <span key={eq} className="rounded-full bg-vct-input px-2 py-0.5 text-[10px] text-vct-text-muted">{eq}</span>)}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
