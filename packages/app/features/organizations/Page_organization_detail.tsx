'use client'

import * as React from 'react'
import { useState } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_AvatarLetter, VCT_Tabs, VCT_SearchInput } from '../components/vct-ui'
import { VCT_PageContainer } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const ORG_DATA = {
    id: 'ORG-001', name: 'Liên đoàn Võ thuật Cổ truyền TP.HCM', short_name: 'LĐVTCT-HCM',
    type: 'federation', address: '55 Nguyễn Thị Minh Khai, Q.1, TP.HCM',
    phone: '028-3829-1234', email: 'ldvtct-hcm@vct.vn', website: 'ldvtct-hcm.vn',
    established: '1995', leader: 'GĐ Nguyễn Văn Minh', status: 'active' as const,
}

const MEMBER_CLUBS = [
    { id: 'CLB-01', name: 'CLB Sơn Long Quyền', members: 45, coaches: 3, city: 'Q.10', status: 'active' },
    { id: 'CLB-02', name: 'VĐ Thiên Long', members: 60, coaches: 4, city: 'Q.Bình Thạnh', status: 'active' },
    { id: 'CLB-03', name: 'CLB Q.12', members: 35, coaches: 2, city: 'Q.12', status: 'active' },
    { id: 'CLB-04', name: 'CLB Tân Bình', members: 28, coaches: 2, city: 'Q.Tân Bình', status: 'active' },
    { id: 'CLB-05', name: 'CLB Gò Vấp', members: 20, coaches: 1, city: 'Q.Gò Vấp', status: 'inactive' },
]

const RECENT_TOURNAMENTS = [
    { id: 'T-01', name: 'Giải VĐQG 2024', date: '15-20/04/2024', athletes: 450, status: 'upcoming' },
    { id: 'T-02', name: 'Giải trẻ miền Nam', date: '01-03/03/2024', athletes: 280, status: 'completed' },
    { id: 'T-03', name: 'Cúp Mùa Xuân 2024', date: '10-12/02/2024', athletes: 200, status: 'completed' },
]

const MEMBERS = [
    { id: 'M-01', name: 'Nguyễn Văn Minh', role: 'Giám đốc', department: 'Ban lãnh đạo', phone: '0901111111' },
    { id: 'M-02', name: 'Trần Thị Thu', role: 'Phó GĐ', department: 'Ban lãnh đạo', phone: '0902222222' },
    { id: 'M-03', name: 'Lê Hoàng Nam', role: 'Trưởng ban chuyên môn', department: 'Ban chuyên môn', phone: '0903333333' },
    { id: 'M-04', name: 'Phạm Thanh Hà', role: 'Trưởng ban trọng tài', department: 'Ban trọng tài', phone: '0904444444' },
    { id: 'M-05', name: 'Võ Minh Đức', role: 'Kế toán', department: 'Ban tài chính', phone: '0905555555' },
]

const FINANCE_SUMMARY = [
    { label: 'Thu phí thành viên', amount: '120.000.000₫', type: 'income' },
    { label: 'Thu phí giải đấu', amount: '350.000.000₫', type: 'income' },
    { label: 'Tài trợ', amount: '200.000.000₫', type: 'income' },
    { label: 'Chi giải đấu', amount: '-280.000.000₫', type: 'expense' },
    { label: 'Chi hành chính', amount: '-85.000.000₫', type: 'expense' },
    { label: 'Chi đào tạo', amount: '-45.000.000₫', type: 'expense' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_organization_detail = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const o = ORG_DATA
    const totalMembers = MEMBER_CLUBS.reduce((s, c) => s + c.members, 0)
    const totalCoaches = MEMBER_CLUBS.reduce((s, c) => s + c.coaches, 0)

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="flex items-center gap-2 text-sm text-(--vct-text-tertiary) mb-6">
                <span className="hover:text-(--vct-accent-cyan) cursor-pointer">Tổ chức</span>
                <VCT_Icons.Chevron size={14} />
                <span className="text-(--vct-text-primary)">{o.name}</span>
            </div>

            {/* HEADER */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-(--vct-accent-cyan) to-[#8b5cf6] flex items-center justify-center text-white text-2xl font-black">
                        {o.short_name.slice(0, 2)}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold text-(--vct-text-primary)">{o.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <VCT_Badge text="Liên đoàn" type="info" />
                            <VCT_Badge text="Hoạt động" type="success" />
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-[12px] text-(--vct-text-tertiary)">
                            <span className="flex items-center gap-1"><VCT_Icons.MapPin size={12} /> {o.address}</span>
                            <span className="flex items-center gap-1"><VCT_Icons.Phone size={12} /> {o.phone}</span>
                            <span className="flex items-center gap-1"><VCT_Icons.Mail size={12} /> {o.email}</span>
                            <span className="flex items-center gap-1"><VCT_Icons.Calendar size={12} /> Thành lập: {o.established}</span>
                        </div>
                    </div>
                    <VCT_Button icon={<VCT_Icons.Edit size={16} />}>Chỉnh sửa</VCT_Button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-6 pt-6 border-t border-(--vct-border-subtle)">
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-[#0ea5e9]">{MEMBER_CLUBS.length}</div><div className="text-[10px] text-(--vct-text-tertiary)">CLB</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-[#10b981]">{totalMembers}</div><div className="text-[10px] text-(--vct-text-tertiary)">VĐV</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-[#f59e0b]">{totalCoaches}</div><div className="text-[10px] text-(--vct-text-tertiary)">HLV</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-[#8b5cf6]">{RECENT_TOURNAMENTS.length}</div><div className="text-[10px] text-(--vct-text-tertiary)">Giải đấu</div></div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl"><div className="text-xl font-black text-[#ec4899]">{MEMBERS.length}</div><div className="text-[10px] text-(--vct-text-tertiary)">Cán bộ</div></div>
                </div>
            </div>

            <div className="mb-6"><VCT_Tabs tabs={[{ key: 'overview', label: 'Tổng quan' }, { key: 'clubs', label: `CLB (${MEMBER_CLUBS.length})` }, { key: 'members', label: 'Thành viên' }, { key: 'finance', label: 'Tài chính' }]} activeTab={activeTab} onChange={setActiveTab} /></div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2"><VCT_Icons.Trophy size={18} className="text-[#f59e0b]" /> Giải đấu gần đây</h3>
                        <div className="space-y-3">
                            {RECENT_TOURNAMENTS.map(t => (
                                <div key={t.id} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) hover:border-(--vct-accent-cyan) transition-colors cursor-pointer">
                                    <div><div className="font-semibold text-sm text-(--vct-text-primary)">{t.name}</div><div className="text-[11px] text-(--vct-text-tertiary)">{t.date} • {t.athletes} VĐV</div></div>
                                    <VCT_Badge text={t.status === 'upcoming' ? 'Sắp tới' : 'Hoàn thành'} type={t.status === 'upcoming' ? 'info' : 'success'} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2"><VCT_Icons.Building2 size={18} className="text-[#0ea5e9]" /> CLB nổi bật</h3>
                        <div className="space-y-3">
                            {MEMBER_CLUBS.filter(c => c.status === 'active').slice(0, 4).map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="flex items-center gap-3"><VCT_AvatarLetter name={c.name} size={32} /><div><div className="font-semibold text-sm text-(--vct-text-primary)">{c.name}</div><div className="text-[11px] text-(--vct-text-tertiary)">{c.city}</div></div></div>
                                    <div className="text-right"><div className="font-bold text-sm text-(--vct-text-primary)">{c.members}</div><div className="text-[10px] text-(--vct-text-tertiary)">thành viên</div></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'clubs' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">CLB</th><th className="p-4 text-center">Thành viên</th><th className="p-4 text-center">HLV</th><th className="p-4 text-left">Quận/huyện</th><th className="p-4 text-center">Trạng thái</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">
                            {MEMBER_CLUBS.map(c => (
                                <tr key={c.id} className="hover:bg-white/5 transition-colors cursor-pointer">
                                    <td className="p-4"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={c.name} size={32} /><div className="font-bold text-sm text-(--vct-text-primary)">{c.name}</div></VCT_Stack></td>
                                    <td className="p-4 text-center font-bold text-(--vct-text-primary)">{c.members}</td>
                                    <td className="p-4 text-center font-bold text-(--vct-text-primary)">{c.coaches}</td>
                                    <td className="p-4 text-sm text-(--vct-text-secondary)">{c.city}</td>
                                    <td className="p-4 text-center"><VCT_Badge text={c.status === 'active' ? 'Hoạt động' : 'Tạm ngưng'} type={c.status === 'active' ? 'success' : 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">Thành viên</th><th className="p-4 text-left">Chức vụ</th><th className="p-4 text-left">Phòng/Ban</th><th className="p-4 text-left">Liên hệ</th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">
                            {MEMBERS.map(m => (
                                <tr key={m.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={m.name} size={32} /><div className="font-bold text-sm text-(--vct-text-primary)">{m.name}</div></VCT_Stack></td>
                                    <td className="p-4 text-sm text-(--vct-text-secondary)">{m.role}</td>
                                    <td className="p-4 text-sm text-(--vct-text-secondary)">{m.department}</td>
                                    <td className="p-4 text-sm text-(--vct-text-tertiary)">{m.phone}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'finance' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h3 className="font-bold text-(--vct-text-primary) mb-4">Tổng quan Tài chính (2024)</h3>
                    <div className="space-y-2">
                        {FINANCE_SUMMARY.map((f, i) => (
                            <div key={i} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <span className="text-sm text-(--vct-text-secondary)">{f.label}</span>
                                <span className={`font-bold text-sm ${f.type === 'income' ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>{f.amount}</span>
                            </div>
                        ))}
                        <div className="flex items-center justify-between p-4 bg-(--vct-accent-cyan)/5 rounded-xl border border-(--vct-accent-cyan)/20 mt-4">
                            <span className="font-bold text-(--vct-text-primary)">Số dư</span>
                            <span className="font-black text-lg text-(--vct-accent-cyan)">260.000.000₫</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
