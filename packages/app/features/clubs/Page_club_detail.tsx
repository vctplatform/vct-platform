'use client'

import * as React from 'react'
import { useState } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_AvatarLetter, VCT_Tabs } from '@vct/ui'
import { VCT_PageContainer } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const CLUB_DATA = {
    id: 'CLB-001', name: 'CLB Sơn Long Quyền', address: '88 Lý Thái Tổ, Q.10, TP.HCM',
    phone: '0901234567', email: 'info@sonlong.vn', founded: '2005',
    head_coach: 'Võ sư Trần Văn Dũng', status: 'active' as const,
}

const KPI = { members: 45, coaches: 3, classes: 5, attendance_rate: '92%' }

const MEMBERS_LIST = [
    { id: 'M-01', name: 'Nguyễn Văn A', belt: 'Đai Xanh', role: 'VĐV', joined: '01/2023', status: 'active' },
    { id: 'M-02', name: 'Trần Thị B', belt: 'Đai Đỏ', role: 'VĐV', joined: '03/2022', status: 'active' },
    { id: 'M-03', name: 'Lê Văn C', belt: 'Đai Vàng', role: 'VĐV', joined: '09/2023', status: 'active' },
    { id: 'M-04', name: 'Phạm Thị D', belt: 'Đai Trắng', role: 'VĐV', joined: '01/2024', status: 'active' },
    { id: 'M-05', name: 'Hoàng Văn E', belt: 'Đai Xanh', role: 'VĐV', joined: '06/2022', status: 'inactive' },
    { id: 'M-06', name: 'Trần Văn Dũng', belt: 'Hồng Đai', role: 'HLV', joined: '01/2005', status: 'active' },
]

const CLASSES = [
    { id: 'C-01', name: 'Lớp Thiếu nhi', schedule: 'T2, T4, T6 17:00-18:30', instructor: 'VS Dũng', students: 15, level: 'Cơ bản' },
    { id: 'C-02', name: 'Lớp Thanh niên', schedule: 'T3, T5 18:00-20:00', instructor: 'VS Dũng', students: 20, level: 'Trung cấp' },
    { id: 'C-03', name: 'Lớp Nâng cao', schedule: 'T3, T5 20:00-21:30', instructor: 'VS Tuấn', students: 10, level: 'Nâng cao' },
    { id: 'C-04', name: 'Lớp Tự vệ', schedule: 'T7 08:00-10:00', instructor: 'VS Hà', students: 25, level: 'Tất cả' },
    { id: 'C-05', name: 'Lớp Biểu diễn', schedule: 'T7 10:30-12:00', instructor: 'VS Dũng', students: 8, level: 'Nâng cao' },
]

const ATTENDANCE = [
    { date: '10/03', class: 'Thiếu nhi', present: 14, absent: 1, total: 15 },
    { date: '10/03', class: 'Thanh niên', present: 18, absent: 2, total: 20 },
    { date: '09/03', class: 'Thiếu nhi', present: 13, absent: 2, total: 15 },
    { date: '09/03', class: 'Nâng cao', present: 10, absent: 0, total: 10 },
    { date: '08/03', class: 'Thanh niên', present: 19, absent: 1, total: 20 },
]

const FINANCE = [
    { id: 'F-01', date: '10/03/2024', desc: 'Học phí tháng 3', amount: '+15.000.000₫', type: 'income' },
    { id: 'F-02', date: '08/03/2024', desc: 'Phí đăng ký giải QG', amount: '+5.000.000₫', type: 'income' },
    { id: 'F-03', date: '05/03/2024', desc: 'Tiền thuê sân', amount: '-8.000.000₫', type: 'expense' },
    { id: 'F-04', date: '01/03/2024', desc: 'Lương HLV', amount: '-12.000.000₫', type: 'expense' },
    { id: 'F-05', date: '28/02/2024', desc: 'Mua dụng cụ', amount: '-3.500.000₫', type: 'expense' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_club_detail = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const c = CLUB_DATA

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="flex items-center gap-2 text-sm text-(--vct-text-tertiary) mb-6">
                <span className="hover:text-(--vct-accent-cyan) cursor-pointer">CLB / Võ đường</span>
                <VCT_Icons.Chevron size={14} />
                <span className="text-(--vct-text-primary)">{c.name}</span>
            </div>

            {/* HEADER */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-(--vct-warning) to-(--vct-danger) flex items-center justify-center text-white text-xl font-black">SL</div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-(--vct-text-primary)">{c.name}</h1>
                        <div className="flex items-center gap-2 mt-1"><VCT_Badge text="CLB/Võ đường" type="warning" /><VCT_Badge text="Hoạt động" type="success" /></div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px] text-(--vct-text-tertiary)">
                            <span className="flex items-center gap-1"><VCT_Icons.MapPin size={12} /> {c.address}</span>
                            <span className="flex items-center gap-1"><VCT_Icons.Phone size={12} /> {c.phone}</span>
                            <span className="flex items-center gap-1"><VCT_Icons.UserCheck size={12} /> {c.head_coach}</span>
                        </div>
                    </div>
                    <VCT_Button icon={<VCT_Icons.Edit size={16} />}>Chỉnh sửa</VCT_Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-(--vct-border-subtle)">
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-(--vct-accent-cyan)">{KPI.members}</div><div className="text-[10px] text-(--vct-text-tertiary)">Thành viên</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-(--vct-success)">{KPI.coaches}</div><div className="text-[10px] text-(--vct-text-tertiary)">HLV</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-(--vct-warning)">{KPI.classes}</div><div className="text-[10px] text-(--vct-text-tertiary)">Lớp học</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-(--vct-info)">{KPI.attendance_rate}</div><div className="text-[10px] text-(--vct-text-tertiary)">Tỉ lệ chuyên cần</div></div>
                </div>
            </div>

            <div className="mb-6"><VCT_Tabs tabs={[{ key: 'overview', label: 'Tổng quan' }, { key: 'members', label: `Thành viên (${MEMBERS_LIST.length})` }, { key: 'classes', label: `Lớp học (${CLASSES.length})` }, { key: 'attendance', label: 'Điểm danh' }, { key: 'finance', label: 'Tài chính' }]} activeTab={activeTab} onChange={setActiveTab} /></div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4">Lớp học đang mở</h3>
                        <div className="space-y-2">{CLASSES.map(cl => (
                            <div key={cl.id} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <div><div className="font-semibold text-sm text-(--vct-text-primary)">{cl.name}</div><div className="text-[11px] text-(--vct-text-tertiary)">{cl.schedule}</div></div>
                                <div className="text-right"><div className="font-bold text-sm text-(--vct-text-primary)">{cl.students}</div><div className="text-[10px] text-(--vct-text-tertiary)">{cl.level}</div></div>
                            </div>
                        ))}</div>
                    </div>
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4">Thu chi gần đây</h3>
                        <div className="space-y-2">{FINANCE.slice(0, 5).map(f => (
                            <div key={f.id} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <div><div className="font-semibold text-sm text-(--vct-text-primary)">{f.desc}</div><div className="text-[11px] text-(--vct-text-tertiary)">{f.date}</div></div>
                                <span className={`font-bold text-sm ${f.type === 'income' ? 'text-(--vct-success)' : 'text-(--vct-danger)'}`}>{f.amount}</span>
                            </div>
                        ))}</div>
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">Thành viên</th><th className="p-4 text-left">Cấp đai</th><th className="p-4 text-left">Vai trò</th><th className="p-4 text-left">Tham gia</th><th className="p-4 text-center">TT</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">{MEMBERS_LIST.map(m => (
                            <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={m.name} size={32} /><div className="font-bold text-sm text-(--vct-text-primary)">{m.name}</div></VCT_Stack></td>
                                <td className="p-4 text-sm text-(--vct-text-secondary)">{m.belt}</td>
                                <td className="p-4"><VCT_Badge text={m.role} type={m.role === 'HLV' ? 'info' : 'neutral'} /></td>
                                <td className="p-4 text-sm text-(--vct-text-tertiary)">{m.joined}</td>
                                <td className="p-4 text-center"><VCT_Badge text={m.status === 'active' ? '✓' : '—'} type={m.status === 'active' ? 'success' : 'neutral'} /></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {activeTab === 'classes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {CLASSES.map(cl => (
                        <div key={cl.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 hover:border-(--vct-accent-cyan) transition-all">
                            <div className="flex items-center justify-between mb-3"><span className="font-bold text-(--vct-text-primary)">{cl.name}</span><VCT_Badge text={cl.level} type="info" /></div>
                            <div className="space-y-2 text-[12px] text-(--vct-text-secondary)">
                                <div className="flex items-center gap-2"><VCT_Icons.Clock size={12} className="text-(--vct-text-tertiary)" /> {cl.schedule}</div>
                                <div className="flex items-center gap-2"><VCT_Icons.UserCheck size={12} className="text-(--vct-text-tertiary)" /> {cl.instructor}</div>
                                <div className="flex items-center gap-2"><VCT_Icons.Users size={12} className="text-(--vct-text-tertiary)" /> {cl.students} học viên</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">Ngày</th><th className="p-4 text-left">Lớp</th><th className="p-4 text-center">Có mặt</th><th className="p-4 text-center">Vắng</th><th className="p-4 text-center">Tỉ lệ</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">{ATTENDANCE.map((a, i) => (
                            <tr key={i} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-sm text-(--vct-text-secondary)">{a.date}</td>
                                <td className="p-4 font-semibold text-sm text-(--vct-text-primary)">{a.class}</td>
                                <td className="p-4 text-center font-bold text-(--vct-success)">{a.present}</td>
                                <td className="p-4 text-center font-bold text-(--vct-danger)">{a.absent}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <span className="font-bold text-sm text-(--vct-text-primary)">{Math.round(a.present / a.total * 100)}%</span>
                                        <div className="w-16 h-1.5 bg-(--vct-border-strong) rounded-full overflow-hidden"><div className="h-full bg-(--vct-success) rounded-full" style={{ width: `${a.present / a.total * 100}%` }}></div></div>
                                    </div>
                                </td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {activeTab === 'finance' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">Ngày</th><th className="p-4 text-left">Mô tả</th><th className="p-4 text-right">Số tiền</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">{FINANCE.map(f => (
                            <tr key={f.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4 text-sm text-(--vct-text-tertiary)">{f.date}</td>
                                <td className="p-4 font-semibold text-sm text-(--vct-text-primary)">{f.desc}</td>
                                <td className={`p-4 text-right font-bold text-sm ${f.type === 'income' ? 'text-(--vct-success)' : 'text-(--vct-danger)'}`}>{f.amount}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
