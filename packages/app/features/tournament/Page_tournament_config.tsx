'use client'

import * as React from 'react'
import { useState } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Tabs, VCT_Input, VCT_Field } from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const GENERAL_INFO = {
    name: 'Giải Vô Địch Quốc Gia Võ Cổ Truyền 2024', location: 'Nhà thi đấu Phú Thọ, TP.HCM',
    date_start: '15/04/2024', date_end: '20/04/2024', registration_deadline: '01/04/2024',
    max_athletes: 500, registered: 320, arenas: 4,
}

const CONTENT_CATEGORIES = [
    { id: 'CT-01', name: 'Đối kháng Nam', age_groups: ['U18', 'Tuyển'], weight_classes: 8, athletes: 120, status: 'open' },
    { id: 'CT-02', name: 'Đối kháng Nữ', age_groups: ['U18', 'Tuyển'], weight_classes: 6, athletes: 80, status: 'open' },
    { id: 'CT-03', name: 'Quyền thuật Nam', age_groups: ['U15', 'U18', 'Tuyển'], weight_classes: 0, athletes: 65, status: 'open' },
    { id: 'CT-04', name: 'Quyền thuật Nữ', age_groups: ['U15', 'U18', 'Tuyển'], weight_classes: 0, athletes: 55, status: 'open' },
    { id: 'CT-05', name: 'Biểu diễn đồng đội', age_groups: ['Tất cả'], weight_classes: 0, athletes: 0, status: 'draft' },
]

const SCORING_RULES = [
    { key: 'judges_per_match', label: 'Số giám khảo / trận', value: '5', type: 'Đối kháng' },
    { key: 'judges_per_quyen', label: 'Số giám khảo / quyền', value: '7', type: 'Quyền thuật' },
    { key: 'drop_highest', label: 'Bỏ điểm cao nhất', value: 'Có', type: 'Quyền thuật' },
    { key: 'drop_lowest', label: 'Bỏ điểm thấp nhất', value: 'Có', type: 'Quyền thuật' },
    { key: 'round_duration', label: 'Thời gian 1 hiệp', value: '2 phút', type: 'Đối kháng' },
    { key: 'rounds_per_match', label: 'Số hiệp / trận', value: '3', type: 'Đối kháng' },
    { key: 'weigh_in_tolerance', label: 'Sai số cân nặng', value: '0.5 kg', type: 'Đối kháng' },
    { key: 'tko_threshold', label: 'Ngưỡng TKO', value: '8 điểm chênh lệch', type: 'Đối kháng' },
]

const ARENAS = [
    { id: 'A-01', name: 'Sàn A (Chính)', size: '12x12m', type: 'Đối kháng', status: 'ready' },
    { id: 'A-02', name: 'Sàn B', size: '12x12m', type: 'Đối kháng', status: 'ready' },
    { id: 'A-03', name: 'Sàn C', size: '14x14m', type: 'Quyền thuật', status: 'ready' },
    { id: 'A-04', name: 'Sàn D', size: '14x14m', type: 'Quyền thuật', status: 'maintenance' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_tournament_config = () => {
    const [activeTab, setActiveTab] = useState('general')
    const g = GENERAL_INFO

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="flex items-center gap-2 text-sm text-vct-text-tertiary mb-6">
                <span className="hover:text-(--vct-accent-cyan) cursor-pointer">Giải đấu</span>
                <VCT_Icons.Chevron size={14} />
                <span className="text-vct-text-primary">Cấu hình</span>
            </div>

            <VCT_PageHero
                icon={<VCT_Icons.Settings size={24} />}
                title="Cấu Hình Giải Đấu"
                subtitle={g.name}
                gradientFrom="rgba(139, 92, 246, 0.08)"
                gradientTo="rgba(245, 158, 11, 0.06)"
                actions={
                    <VCT_Stack direction="row" gap={12}>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Eye size={16} />}>Xem trước</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Check size={16} />}>Lưu cấu hình</VCT_Button>
                    </VCT_Stack>
                }
            />

            <VCT_StatRow items={[
                { label: 'Nội dung thi', value: CONTENT_CATEGORIES.length, icon: <VCT_Icons.Swords size={18} />, color: '#8b5cf6' },
                { label: 'VĐV đăng ký', value: `${g.registered}/${g.max_athletes}`, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
                { label: 'Sàn đấu', value: g.arenas, icon: <VCT_Icons.LayoutGrid size={18} />, color: '#10b981' },
                { label: 'Ngày thi đấu', value: '6 ngày', icon: <VCT_Icons.Calendar size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-8" />

            <div className="mb-6"><VCT_Tabs tabs={[{ key: 'general', label: 'Thông tin chung' }, { key: 'categories', label: 'Nội dung thi' }, { key: 'scoring', label: 'Cấu hình chấm điểm' }, { key: 'arenas', label: 'Sàn đấu' }]} activeTab={activeTab} onChange={setActiveTab} /></div>

            {activeTab === 'general' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h3 className="font-bold text-(--vct-text-primary) mb-6">Thông tin chung</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <VCT_Field label="Tên giải"><VCT_Input value={g.name} readOnly /></VCT_Field>
                        <VCT_Field label="Địa điểm"><VCT_Input value={g.location} readOnly /></VCT_Field>
                        <VCT_Field label="Ngày bắt đầu"><VCT_Input value={g.date_start} readOnly /></VCT_Field>
                        <VCT_Field label="Ngày kết thúc"><VCT_Input value={g.date_end} readOnly /></VCT_Field>
                        <VCT_Field label="Hạn đăng ký"><VCT_Input value={g.registration_deadline} readOnly /></VCT_Field>
                        <VCT_Field label="Số VĐV tối đa"><VCT_Input value={g.max_athletes.toString()} readOnly /></VCT_Field>
                    </div>
                </div>
            )}

            {activeTab === 'categories' && (
                <div className="space-y-3">
                    {CONTENT_CATEGORIES.map(cat => (
                        <div key={cat.id} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5 flex items-center justify-between hover:border-(--vct-accent-cyan) transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-(--vct-accent-cyan)/10 flex items-center justify-center"><VCT_Icons.Swords size={24} className="text-(--vct-accent-cyan)" /></div>
                                <div>
                                    <div className="font-bold text-(--vct-text-primary)">{cat.name}</div>
                                    <div className="flex items-center gap-3 mt-1 text-[11px] text-(--vct-text-tertiary)">
                                        <span>Lứa tuổi: {cat.age_groups.join(', ')}</span>
                                        {cat.weight_classes > 0 && <span>{cat.weight_classes} hạng cân</span>}
                                        <span>{cat.athletes} VĐV</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <VCT_Badge text={cat.status === 'open' ? 'Mở đăng ký' : 'Bản nháp'} type={cat.status === 'open' ? 'success' : 'neutral'} />
                                <VCT_Button variant="ghost" size="sm" icon={<VCT_Icons.Edit size={14} />} />
                            </div>
                        </div>
                    ))}
                    <VCT_Button variant="outline" icon={<VCT_Icons.Plus size={16} />} className="w-full mt-4">Thêm nội dung thi</VCT_Button>
                </div>
            )}

            {activeTab === 'scoring' && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead><tr className="bg-(--vct-bg-card) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                            <th className="p-4 text-left">Tham số</th><th className="p-4 text-center">Giá trị</th><th className="p-4 text-left">Áp dụng cho</th><th className="p-4 w-12"></th>
                        </tr></thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">{SCORING_RULES.map(r => (
                            <tr key={r.key} className="hover:bg-white/5 transition-colors group">
                                <td className="p-4 font-semibold text-sm text-(--vct-text-primary)">{r.label}</td>
                                <td className="p-4 text-center font-bold text-(--vct-accent-cyan)">{r.value}</td>
                                <td className="p-4"><VCT_Badge text={r.type} type={r.type === 'Đối kháng' ? 'error' : 'info'} /></td>
                                <td className="p-4"><button className="p-1 text-(--vct-text-tertiary) hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-white/10"><VCT_Icons.Edit size={14} /></button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {activeTab === 'arenas' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {ARENAS.map(a => (
                        <div key={a.id} className={`bg-(--vct-bg-elevated) border rounded-2xl p-5 transition-colors ${a.status === 'ready' ? 'border-[#10b98140]' : 'border-[#f59e0b40]'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-bold text-(--vct-text-primary)">{a.name}</span>
                                <VCT_Badge text={a.status === 'ready' ? 'Sẵn sàng' : 'Bảo trì'} type={a.status === 'ready' ? 'success' : 'warning'} />
                            </div>
                            <div className="space-y-1 text-[12px] text-(--vct-text-secondary)">
                                <div className="flex items-center gap-2"><VCT_Icons.LayoutGrid size={12} /> Kích thước: {a.size}</div>
                                <div className="flex items-center gap-2"><VCT_Icons.Swords size={12} /> Dành cho: {a.type}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </VCT_PageContainer>
    )
}
