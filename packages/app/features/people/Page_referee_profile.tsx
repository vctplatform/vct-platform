'use client'

import * as React from 'react'
import { useState } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_AvatarLetter, VCT_Tabs } from '../components/vct-ui'
import { VCT_PageContainer } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const REF_DATA = {
    id: 'TT-001', name: 'Nguyễn Đức Hòa', certification_level: 'Quốc tế', federation: 'LĐVT VN', city: 'TP.HCM',
    phone: '0901234567', email: 'hoa@vct.vn', dob: '20/06/1978', address: '45 Nguyễn Du, Q.1, TP.HCM',
    bio: 'Trọng tài Nguyễn Đức Hòa có 20 năm kinh nghiệm điều hành giải đấu, đã tham gia điều hành hơn 85 giải đấu trong nước và quốc tế. Ông được chứng nhận cấp quốc tế bởi WVTF và là trọng tài chính tại nhiều giải vô địch quốc gia.',
    experience_years: 20, tournaments_judged: 85, rating: 4.9, status: 'active' as const,
    specialties: ['Đối kháng', 'Quyền thuật'],
}

const CERTIFICATIONS = [
    { id: 'CN-01', name: 'Trọng tài Quốc tế', issuer: 'WVTF', date: '12/2019', expiry: '12/2025', level: 'LV3', status: 'valid' },
    { id: 'CN-02', name: 'Trọng tài Quốc gia A', issuer: 'LĐVT VN', date: '06/2015', expiry: '—', level: 'LV A', status: 'valid' },
    { id: 'CN-03', name: 'Anti-Doping Official', issuer: 'WADA', date: '03/2023', expiry: '03/2025', level: '—', status: 'valid' },
]

const ASSIGNMENTS = [
    { id: 'AS-01', tournament: 'Giải VĐQG 2024', date: '15-20/04/2024', location: 'TP.HCM', role: 'Trọng tài chính', status: 'upcoming' },
    { id: 'AS-02', tournament: 'Giải trẻ miền Nam 2024', date: '01-03/03/2024', location: 'Bình Dương', role: 'Giám sát kỹ thuật', status: 'completed' },
    { id: 'AS-03', tournament: 'Cúp Mùa Xuân 2024', date: '10-12/02/2024', location: 'Hà Nội', role: 'Trọng tài sàn', status: 'completed' },
    { id: 'AS-04', tournament: 'Giải VĐQG 2023', date: '20-25/11/2023', location: 'Đà Nẵng', role: 'Trọng tài chính', status: 'completed' },
    { id: 'AS-05', tournament: 'SEA Games Vovinam 2023', date: '05-10/05/2023', location: 'Phnom Penh', role: 'Trọng tài quốc tế', status: 'completed' },
]

const HISTORY_STATS = [
    { year: '2024', tournaments: 2, matches: 45, accuracy: '97.8%' },
    { year: '2023', tournaments: 12, matches: 210, accuracy: '98.2%' },
    { year: '2022', tournaments: 15, matches: 280, accuracy: '97.5%' },
    { year: '2021', tournaments: 8, matches: 150, accuracy: '96.9%' },
    { year: '2020', tournaments: 3, matches: 55, accuracy: '97.1%' },
]

const ASSIGN_STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'info' | 'neutral' }> = {
    upcoming: { label: 'Sắp tới', type: 'info' },
    completed: { label: 'Hoàn thành', type: 'success' },
    cancelled: { label: 'Hủy', type: 'neutral' },
}

const CERT_STATUS_MAP: Record<string, { label: string; type: 'success' | 'warning' | 'error' }> = {
    valid: { label: 'Còn hạn', type: 'success' },
    expiring: { label: 'Sắp hết', type: 'warning' },
    expired: { label: 'Hết hạn', type: 'error' },
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_referee_profile = () => {
    const [activeTab, setActiveTab] = useState('overview')
    const r = REF_DATA

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 text-sm text-(--vct-text-tertiary) mb-6">
                <span className="hover:text-(--vct-accent-cyan) cursor-pointer">Trọng tài</span>
                <VCT_Icons.Chevron size={14} />
                <span className="text-(--vct-text-primary)">{r.name}</span>
            </div>

            {/* PROFILE HEADER */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <VCT_AvatarLetter name={r.name} size={80} />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#10b981] border-3 border-(--vct-bg-elevated)"></div>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-(--vct-text-primary)">{r.name}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[#8b5cf615] text-[#8b5cf6] border border-[#8b5cf630]">{r.certification_level}</span>
                                <span className="flex items-center gap-1 text-xs text-[#f59e0b]"><VCT_Icons.Star size={12} /> {r.rating}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-2 text-[12px] text-(--vct-text-tertiary)">
                                <span className="flex items-center gap-1"><VCT_Icons.Building2 size={12} /> {r.federation} – {r.city}</span>
                                <span className="flex items-center gap-1"><VCT_Icons.Calendar size={12} /> {r.dob}</span>
                            </div>
                        </div>
                    </div>
                    <div className="md:ml-auto flex flex-wrap gap-3 items-start">
                        <VCT_Button variant="outline" icon={<VCT_Icons.Mail size={16} />}>Email</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Edit size={16} />}>Chỉnh sửa</VCT_Button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-(--vct-border-subtle)">
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl">
                        <div className="text-2xl font-black text-[#0ea5e9]">{r.tournaments_judged}</div>
                        <div className="text-[10px] text-(--vct-text-tertiary) mt-1">Giải đã điều</div>
                    </div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl">
                        <div className="text-2xl font-black text-[#10b981]">{r.experience_years}</div>
                        <div className="text-[10px] text-(--vct-text-tertiary) mt-1">Năm kinh nghiệm</div>
                    </div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl">
                        <div className="text-2xl font-black text-[#f59e0b]">{r.rating}</div>
                        <div className="text-[10px] text-(--vct-text-tertiary) mt-1">Rating</div>
                    </div>
                    <div className="text-center p-3 bg-(--vct-bg-base) rounded-xl">
                        <div className="text-2xl font-black text-[#8b5cf6]">{CERTIFICATIONS.length}</div>
                        <div className="text-[10px] text-(--vct-text-tertiary) mt-1">Chứng chỉ</div>
                    </div>
                </div>
            </div>

            {/* TABS */}
            <div className="mb-6 border-b border-(--vct-border-subtle) pb-0">
                <VCT_Tabs
                    tabs={[{ key: 'overview', label: 'Hồ sơ' }, { key: 'certifications', label: 'Chứng chỉ' }, { key: 'assignments', label: 'Phân công' }, { key: 'history', label: 'Lịch sử' }]}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />
            </div>

            {/* TAB CONTENT */}
            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                        <h3 className="font-bold text-(--vct-text-primary) mb-3">Tiểu sử</h3>
                        <p className="text-sm text-(--vct-text-secondary) leading-relaxed">{r.bio}</p>
                        <h3 className="font-bold text-(--vct-text-primary) mt-6 mb-3">Chuyên môn</h3>
                        <div className="flex flex-wrap gap-2">
                            {r.specialties.map(s => <span key={s} className="px-3 py-1.5 text-sm font-medium rounded-xl bg-(--vct-accent-cyan)/10 text-(--vct-accent-cyan) border border-(--vct-accent-cyan)/20">{s}</span>)}
                        </div>
                    </div>
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                        <h3 className="font-bold text-(--vct-text-primary) mb-4">Thông tin liên hệ</h3>
                        <VCT_Stack gap={12}>
                            <div className="flex items-center gap-3"><VCT_Icons.Phone size={16} className="text-(--vct-text-tertiary)" /><span className="text-sm text-(--vct-text-secondary)">{r.phone}</span></div>
                            <div className="flex items-center gap-3"><VCT_Icons.Mail size={16} className="text-(--vct-text-tertiary)" /><span className="text-sm text-(--vct-text-secondary)">{r.email}</span></div>
                            <div className="flex items-center gap-3"><VCT_Icons.MapPin size={16} className="text-(--vct-text-tertiary)" /><span className="text-sm text-(--vct-text-secondary)">{r.address}</span></div>
                            <div className="flex items-center gap-3"><VCT_Icons.Building2 size={16} className="text-(--vct-text-tertiary)" /><span className="text-sm text-(--vct-text-secondary)">{r.federation}</span></div>
                        </VCT_Stack>
                    </div>
                </div>
            )}

            {activeTab === 'certifications' && (
                <div className="space-y-3">
                    {CERTIFICATIONS.map(cert => (
                        <div key={cert.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 flex items-center justify-between hover:border-(--vct-accent-cyan) transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-[#8b5cf615] flex items-center justify-center"><VCT_Icons.Award size={24} className="text-[#8b5cf6]" /></div>
                                <div>
                                    <div className="font-bold text-(--vct-text-primary)">{cert.name}</div>
                                    <div className="text-[12px] text-(--vct-text-tertiary) mt-1">Cấp bởi: {cert.issuer} • Level: {cert.level} • Ngày cấp: {cert.date} • Hết hạn: {cert.expiry}</div>
                                </div>
                            </div>
                            <VCT_Badge text={CERT_STATUS_MAP[cert.status]?.label || ''} type={CERT_STATUS_MAP[cert.status]?.type || 'success'} />
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'assignments' && (
                <div className="space-y-3">
                    {ASSIGNMENTS.map(a => (
                        <div key={a.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-(--vct-accent-cyan) transition-colors">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${a.status === 'upcoming' ? 'bg-[#0ea5e915]' : 'bg-[#10b98115]'}`}>
                                    <VCT_Icons.Trophy size={24} className={a.status === 'upcoming' ? 'text-[#0ea5e9]' : 'text-[#10b981]'} />
                                </div>
                                <div>
                                    <div className="font-bold text-(--vct-text-primary)">{a.tournament}</div>
                                    <div className="text-[12px] text-(--vct-text-tertiary) mt-1 flex items-center gap-3">
                                        <span className="flex items-center gap-1"><VCT_Icons.Calendar size={10} /> {a.date}</span>
                                        <span className="flex items-center gap-1"><VCT_Icons.MapPin size={10} /> {a.location}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-(--vct-accent-cyan)">{a.role}</span>
                                <VCT_Badge text={ASSIGN_STATUS_MAP[a.status]?.label || ''} type={ASSIGN_STATUS_MAP[a.status]?.type || 'neutral'} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                                <th className="p-4 text-left">Năm</th><th className="p-4 text-center">Giải đấu</th><th className="p-4 text-center">Trận điều hành</th><th className="p-4 text-center">Độ chính xác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">
                            {HISTORY_STATS.map(h => (
                                <tr key={h.year} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-(--vct-text-primary)">{h.year}</td>
                                    <td className="p-4 text-center font-bold text-(--vct-text-primary)">{h.tournaments}</td>
                                    <td className="p-4 text-center font-bold text-[#0ea5e9]">{h.matches}</td>
                                    <td className="p-4 text-center">
                                        <span className="font-bold text-[#10b981]">{h.accuracy}</span>
                                        <div className="w-full h-1.5 bg-(--vct-border-strong) rounded-full mt-1 overflow-hidden">
                                            <div className="h-full bg-[#10b981] rounded-full" style={{ width: h.accuracy }}></div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
