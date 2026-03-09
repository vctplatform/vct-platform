'use client'

import * as React from 'react'
import { useState } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Stack, VCT_AvatarLetter, VCT_Tabs
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const COACH_DATA = {
    id: 'HLV-001', name: 'Võ sư Trần Văn Dũng', belt_rank: 'Hồng Đai', certification: 'Chứng nhận Quốc tế LV3',
    club: 'CLB Sơn Long Quyền', club_city: 'TP.HCM', phone: '0901234567', email: 'dung@sonlong.vn',
    dob: '15/03/1975', address: '123 Lý Thường Kiệt, Q.10, TP.HCM',
    bio: 'Võ sư Trần Văn Dũng đã theo đuổi võ cổ truyền từ năm 8 tuổi dưới sự hướng dẫn của cố võ sư Trần Đại Hùng. Với hơn 25 năm kinh nghiệm huấn luyện, ông đã đào tạo hàng trăm vận động viên, trong đó có nhiều nhà vô địch quốc gia và quốc tế.',
    students: 45, experience_years: 25,
    specialties: ['Quyền thuật', 'Đối kháng', 'Tự vệ'],
    status: 'active' as const,
}

const STUDENTS = [
    { id: 'VDV-001', name: 'Nguyễn Văn A', belt: 'Đai Xanh', joined: '01/2023', performance: 'A', status: 'active' },
    { id: 'VDV-002', name: 'Trần Thị B', belt: 'Đai Đỏ', joined: '03/2022', performance: 'A+', status: 'active' },
    { id: 'VDV-003', name: 'Lê Văn C', belt: 'Đai Vàng', joined: '09/2023', performance: 'B+', status: 'active' },
    { id: 'VDV-004', name: 'Phạm Thị D', belt: 'Đai Trắng', joined: '01/2024', performance: 'B', status: 'active' },
    { id: 'VDV-005', name: 'Hoàng Văn E', belt: 'Đai Xanh', joined: '06/2022', performance: 'B+', status: 'inactive' },
]

const CERTIFICATIONS = [
    { id: 'CN-01', name: 'Chứng nhận Quốc tế LV3', issuer: 'WVTF', date: '12/2020', expiry: '12/2025', status: 'valid' },
    { id: 'CN-02', name: 'Chứng nhận Quốc gia LV2', issuer: 'LĐVT VN', date: '06/2015', expiry: '06/2025', status: 'valid' },
    { id: 'CN-03', name: 'Chứng nhận Sơ cấp cứu', issuer: 'Hội Chữ thập đỏ', date: '03/2023', expiry: '03/2025', status: 'expiring' },
    { id: 'CN-04', name: 'Chứng nhận An toàn thể thao', issuer: 'Bộ VH-TT-DL', date: '01/2022', expiry: '01/2024', status: 'expired' },
]

const SCHEDULE = [
    { day: 'T2', sessions: [{ time: '17:00-18:30', class: 'Thiếu nhi', students: 15, location: 'Sân A' }] },
    { day: 'T3', sessions: [{ time: '18:00-20:00', class: 'Thanh niên', students: 20, location: 'Sân chính' }, { time: '20:00-21:30', class: 'Nâng cao', students: 10, location: 'Sân chính' }] },
    { day: 'T4', sessions: [{ time: '17:00-18:30', class: 'Thiếu nhi', students: 15, location: 'Sân A' }] },
    { day: 'T5', sessions: [{ time: '18:00-20:00', class: 'Thanh niên', students: 20, location: 'Sân chính' }, { time: '20:00-21:30', class: 'Nâng cao', students: 10, location: 'Sân chính' }] },
    { day: 'T6', sessions: [{ time: '17:00-18:30', class: 'Thiếu nhi', students: 15, location: 'Sân A' }] },
    { day: 'T7', sessions: [{ time: '08:00-10:00', class: 'Tự vệ', students: 25, location: 'Sân chính' }, { time: '10:30-12:00', class: 'Biểu diễn', students: 8, location: 'Sân A' }] },
    { day: 'CN', sessions: [] },
]

const CERT_STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'error' }> = {
    valid: { label: 'Còn hạn', type: 'success' },
    expiring: { label: 'Sắp hết', type: 'warning' },
    expired: { label: 'Hết hạn', type: 'error' },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_coach_profile = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const c = COACH_DATA

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            {/* ── BREADCRUMB ── */}
            <div className="flex items-center gap-2 text-sm text-[var(--vct-text-tertiary)] mb-6">
                <span className="hover:text-[var(--vct-accent-cyan)] cursor-pointer">Huấn luyện viên</span>
                <VCT_Icons.Chevron size={14} />
                <span className="text-[var(--vct-text-primary)]">{c.name}</span>
            </div>

            {/* ── PROFILE HEADER ── */}
            <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <VCT_AvatarLetter name={c.name} size={80} />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10b981] border-3 border-[var(--vct-bg-elevated)]"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-[var(--vct-text-primary)]">{c.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#ec489915] text-[#ec4899] border border-[#ec489930]">{c.belt_rank}</span>
                                <span className="text-xs text-[var(--vct-text-secondary)]">{c.certification}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[12px] text-[var(--vct-text-tertiary)]">
                                <span className="flex items-center gap-1"><VCT_Icons.Building2 size={12} /> {c.club} – {c.club_city}</span>
                                <span className="flex items-center gap-1"><VCT_Icons.Calendar size={12} /> {c.dob}</span>
                            </div>
                        </div>
                    </div>
                    <div className="md:ml-auto flex flex-wrap gap-3 items-start">
                        <VCT_Button variant="outline" icon={<VCT_Icons.Mail size={16} />}>Email</VCT_Button>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Phone size={16} />}>Gọi</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Edit size={16} />}>Chỉnh sửa</VCT_Button>
                    </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[var(--vct-border-subtle)]">
                    <div className="text-center p-3 bg-[var(--vct-bg-base)] rounded-xl">
                        <div className="text-2xl font-black text-[#0ea5e9]">{c.students}</div>
                        <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-1">Học trò</div>
                    </div>
                    <div className="text-center p-3 bg-[var(--vct-bg-base)] rounded-xl">
                        <div className="text-2xl font-black text-[#10b981]">{c.experience_years}</div>
                        <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-1">Năm kinh nghiệm</div>
                    </div>
                    <div className="text-center p-3 bg-[var(--vct-bg-base)] rounded-xl">
                        <div className="text-2xl font-black text-[#f59e0b]">{c.specialties.length}</div>
                        <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-1">Chuyên môn</div>
                    </div>
                    <div className="text-center p-3 bg-[var(--vct-bg-base)] rounded-xl">
                        <div className="text-2xl font-black text-[#8b5cf6]">{CERTIFICATIONS.filter(cr => cr.status === 'valid').length}</div>
                        <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-1">Chứng chỉ còn hạn</div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="mb-6 border-b border-[var(--vct-border-subtle)] pb-0">
                <VCT_Tabs
                    tabs={[{ key: 'overview', label: 'Hồ sơ' }, { key: 'students', label: `Học trò (${STUDENTS.length})` }, { key: 'certifications', label: 'Chứng chỉ' }, { key: 'schedule', label: 'Lịch dạy' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {/* ── TAB CONTENT ── */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                        <h3 className="font-bold text-[var(--vct-text-primary)] mb-3">Tiểu sử</h3>
                        <p className="text-sm text-[var(--vct-text-secondary)] leading-relaxed">{c.bio}</p>
                        <h3 className="font-bold text-[var(--vct-text-primary)] mt-6 mb-3">Chuyên môn</h3>
                        <div className="flex flex-wrap gap-2">
                            {c.specialties.map(s => <span key={s} className="px-3 py-1.5 text-sm font-medium rounded-xl bg-[var(--vct-accent-cyan)]/10 text-[var(--vct-accent-cyan)] border border-[var(--vct-accent-cyan)]/20">{s}</span>)}
                        </div>
                    </div>
                    <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                        <h3 className="font-bold text-[var(--vct-text-primary)] mb-4">Thông tin liên hệ</h3>
                        <VCT_Stack gap={12}>
                            <div className="flex items-center gap-3"><VCT_Icons.Phone size={16} className="text-[var(--vct-text-tertiary)]" /><span className="text-sm text-[var(--vct-text-secondary)]">{c.phone}</span></div>
                            <div className="flex items-center gap-3"><VCT_Icons.Mail size={16} className="text-[var(--vct-text-tertiary)]" /><span className="text-sm text-[var(--vct-text-secondary)]">{c.email}</span></div>
                            <div className="flex items-center gap-3"><VCT_Icons.MapPin size={16} className="text-[var(--vct-text-tertiary)]" /><span className="text-sm text-[var(--vct-text-secondary)]">{c.address}</span></div>
                            <div className="flex items-center gap-3"><VCT_Icons.Building2 size={16} className="text-[var(--vct-text-tertiary)]" /><span className="text-sm text-[var(--vct-text-secondary)]">{c.club}</span></div>
                        </VCT_Stack>
                    </div>
                </div>
            )}

            {activeTab === 'students' && (
                <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--vct-bg-card)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                                <th className="p-4 text-left">Học viên</th><th className="p-4 text-left">Cấp đai</th><th className="p-4 text-left">Tham gia</th><th className="p-4 text-center">Xếp loại</th><th className="p-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                            {STUDENTS.map(s => (
                                <tr key={s.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4"><VCT_Stack direction="row" gap={10} align="center"><VCT_AvatarLetter name={s.name} size={32} /><div><div className="font-bold text-sm text-[var(--vct-text-primary)]">{s.name}</div><div className="text-[11px] text-[var(--vct-text-tertiary)]">{s.id}</div></div></VCT_Stack></td>
                                    <td className="p-4 text-sm text-[var(--vct-text-secondary)]">{s.belt}</td>
                                    <td className="p-4 text-sm text-[var(--vct-text-secondary)]">{s.joined}</td>
                                    <td className="p-4 text-center"><span className="font-black text-sm text-[var(--vct-accent-cyan)]">{s.performance}</span></td>
                                    <td className="p-4 text-center"><VCT_Badge text={s.status === 'active' ? 'Đang học' : 'Nghỉ'} type={s.status === 'active' ? 'success' : 'neutral'} /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'certifications' && (
                <div className="space-y-3">
                    {CERTIFICATIONS.map(cert => {
                        const st = CERT_STATUS_MAP[cert.status] || CERT_STATUS_MAP.valid!
                        return (
                            <div key={cert.id} className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5 flex items-center justify-between hover:border-[var(--vct-accent-cyan)] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-[var(--vct-accent-cyan)]/10 flex items-center justify-center"><VCT_Icons.Award size={24} className="text-[var(--vct-accent-cyan)]" /></div>
                                    <div>
                                        <div className="font-bold text-[var(--vct-text-primary)]">{cert.name}</div>
                                        <div className="text-[12px] text-[var(--vct-text-tertiary)] mt-1">Cấp bởi: {cert.issuer} • Ngày cấp: {cert.date} • Hết hạn: {cert.expiry}</div>
                                    </div>
                                </div>
                                <VCT_Badge text={st.label} type={st.type} />
                            </div>
                        )
                    })}
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                    <h3 className="font-bold text-[var(--vct-text-primary)] mb-4">Lịch dạy hàng tuần</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {SCHEDULE.map(day => (
                            <div key={day.day} className="flex flex-col">
                                <div className="text-center font-bold text-sm text-[var(--vct-text-primary)] mb-2 p-2 bg-[var(--vct-bg-card)] rounded-xl">{day.day}</div>
                                {day.sessions.length === 0 ? (
                                    <div className="text-center py-8 text-[11px] text-[var(--vct-text-tertiary)]">Nghỉ</div>
                                ) : (
                                    <div className="space-y-2">
                                        {day.sessions.map((session, i) => (
                                            <div key={i} className="p-3 bg-[var(--vct-accent-cyan)]/5 border border-[var(--vct-accent-cyan)]/20 rounded-xl">
                                                <div className="text-[11px] font-bold text-[var(--vct-accent-cyan)]">{session.time}</div>
                                                <div className="text-[12px] font-semibold text-[var(--vct-text-primary)] mt-1">{session.class}</div>
                                                <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-1">{session.students} HV • {session.location}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
