'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA — Document Templates
// ════════════════════════════════════════
const MOCK_TEMPLATES = [
    { id: 'DT-001', type: 'MEDAL_CERTIFICATE', name: 'Giấy chứng nhận Huy chương', version: 2, is_active: true, fields: ['athlete_name', 'tournament_name', 'medal_type', 'category', 'date'], federation: 'LVNVN', issued_count: 342 },
    { id: 'DT-002', type: 'PARTICIPATION_CERT', name: 'Giấy chứng nhận Tham gia', version: 1, is_active: true, fields: ['athlete_name', 'tournament_name', 'date'], federation: 'LVNVN', issued_count: 1250 },
    { id: 'DT-003', type: 'BELT_PROMOTION_CERT', name: 'Chứng nhận Thăng đai', version: 3, is_active: true, fields: ['athlete_name', 'belt_from', 'belt_to', 'exam_date', 'examiner'], federation: 'LVNVN', issued_count: 89 },
    { id: 'DT-004', type: 'REFEREE_LICENSE', name: 'Giấy phép Trọng tài', version: 1, is_active: true, fields: ['referee_name', 'license_level', 'valid_from', 'valid_until'], federation: 'LVNVN', issued_count: 56 },
    { id: 'DT-005', type: 'ATHLETE_CARD', name: 'Thẻ VĐV', version: 2, is_active: true, fields: ['athlete_name', 'photo', 'dob', 'club', 'belt_rank', 'id_number'], federation: 'LVNVN', issued_count: 2100 },
    { id: 'DT-006', type: 'TOURNAMENT_SANCTION', name: 'Quyết định Phê duyệt Giải', version: 1, is_active: false, fields: ['tournament_name', 'organizer', 'location', 'date_range', 'budget'], federation: 'LVNVN', issued_count: 12 },
    { id: 'DT-007', type: 'MEDICAL_CLEARANCE', name: 'Giấy chứng nhận Sức khỏe', version: 1, is_active: true, fields: ['athlete_name', 'doctor_name', 'hospital', 'exam_date', 'valid_until'], federation: null, issued_count: 450 },
]

const MOCK_ISSUED = [
    { id: 'ID-001', doc_number: 'VCT-2024-MC-001234', type: 'MEDAL_CERTIFICATE', recipient: 'Nguyễn Văn A', issued_at: '2024-03-09', status: 'valid', verification_code: 'VCT24MC1234' },
    { id: 'ID-002', doc_number: 'VCT-2024-PC-005678', type: 'PARTICIPATION_CERT', recipient: 'Trần Thị B', issued_at: '2024-03-09', status: 'valid', verification_code: 'VCT24PC5678' },
    { id: 'ID-003', doc_number: 'VCT-2024-BP-000089', type: 'BELT_PROMOTION_CERT', recipient: 'Lê Minh C', issued_at: '2024-03-08', status: 'valid', verification_code: 'VCT24BP0089' },
    { id: 'ID-004', doc_number: 'VCT-2024-AC-002100', type: 'ATHLETE_CARD', recipient: 'Phạm Đức D', issued_at: '2024-03-07', status: 'revoked', verification_code: 'VCT24AC2100' },
    { id: 'ID-005', doc_number: 'VCT-2024-RL-000056', type: 'REFEREE_LICENSE', recipient: 'Hoàng Văn E', issued_at: '2024-03-06', status: 'valid', verification_code: 'VCT24RL0056' },
]

const TYPE_LABELS: Record<string, string> = {
    MEDAL_CERTIFICATE: '🥇 Huy chương',
    PARTICIPATION_CERT: '📜 Tham gia',
    BELT_PROMOTION_CERT: '🥋 Thăng đai',
    REFEREE_LICENSE: '🏅 GP Trọng tài',
    TOURNAMENT_SANCTION: '📋 PD Giải đấu',
    CLUB_REGISTRATION: '🏢 GP CLB',
    ATHLETE_CARD: '🪪 Thẻ VĐV',
    MEDICAL_CLEARANCE: '🏥 Sức khỏe',
    CUSTOM: '📄 Tùy chỉnh',
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_documents = () => {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [tab, setTab] = useState<'templates' | 'issued'>('templates')

    const filteredTemplates = useMemo(() => {
        let v = MOCK_TEMPLATES
        if (typeFilter !== 'all') v = v.filter(t => t.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(t => t.name.toLowerCase().includes(q))
        }
        return v
    }, [search, typeFilter])

    const filteredIssued = useMemo(() => {
        if (!search) return MOCK_ISSUED
        const q = search.toLowerCase()
        return MOCK_ISSUED.filter(d => d.recipient.toLowerCase().includes(q) || d.doc_number.toLowerCase().includes(q))
    }, [search])

    const totalIssued = MOCK_TEMPLATES.reduce((acc, t) => acc + t.issued_count, 0)

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản Lý Chứng Chỉ & Tài Liệu</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý mẫu chứng chỉ, giấy phép, thẻ VĐV. Ký số + xác minh QR.</p>
                </div>
                <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />}>Thêm mẫu</VCT_Button>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Tổng mẫu</div>
                    <div className="text-3xl font-bold text-[var(--vct-text-primary)]">{MOCK_TEMPLATES.length}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Mẫu Active</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--vct-accent-green,#22c55e)' }}>{MOCK_TEMPLATES.filter(t => t.is_active).length}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Tổng đã cấp</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--vct-accent-blue,#3b82f6)' }}>{totalIssued.toLocaleString()}</div>
                </div>
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl p-4 text-center">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Đã thu hồi</div>
                    <div className="text-3xl font-bold" style={{ color: 'var(--vct-accent-red,#ef4444)' }}>{MOCK_ISSUED.filter(d => d.status === 'revoked').length}</div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('templates')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'templates' ? 'bg-[var(--vct-accent-blue,#3b82f6)] text-white' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] hover:text-[var(--vct-text-primary)]'}`}
                >Mẫu tài liệu</button>
                <button
                    onClick={() => setTab('issued')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'issued' ? 'bg-[var(--vct-accent-blue,#3b82f6)] text-white' : 'bg-[var(--vct-bg-elevated)] text-[var(--vct-text-secondary)] hover:text-[var(--vct-text-primary)]'}`}
                >Đã cấp ({MOCK_ISSUED.length})</button>
            </div>

            {/* ── FILTERS ── */}
            <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex-1 min-w-[200px]">
                    <VCT_SearchInput
                        placeholder={tab === 'templates' ? 'Tìm theo tên mẫu...' : 'Tìm theo người nhận, mã số...'}
                        value={search} onChange={setSearch} onClear={() => setSearch('')}
                    />
                </div>
                {tab === 'templates' && (
                    <VCT_Select value={typeFilter} onChange={setTypeFilter} options={[
                        { value: 'all', label: 'Tất cả loại' },
                        ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })),
                    ]} />
                )}
            </div>

            {tab === 'templates' ? (
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                                <th className="p-4 w-20">T.Thái</th>
                                <th className="p-4 w-32">Loại</th>
                                <th className="p-4">Tên mẫu</th>
                                <th className="p-4 w-20 text-center">Ver.</th>
                                <th className="p-4 w-28 text-right">Đã cấp</th>
                                <th className="p-4 w-44">Trường bắt buộc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                            {filteredTemplates.map(tpl => (
                                <tr key={tpl.id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4"><VCT_Badge type={tpl.is_active ? 'success' : 'neutral'} text={tpl.is_active ? 'Active' : 'Off'} /></td>
                                    <td className="p-4 text-[12px]">{TYPE_LABELS[tpl.type] || tpl.type}</td>
                                    <td className="p-4 font-semibold text-[var(--vct-text-primary)]">{tpl.name}</td>
                                    <td className="p-4 text-center text-[var(--vct-text-tertiary)]">v{tpl.version}</td>
                                    <td className="p-4 text-right font-mono text-[12px] text-[var(--vct-accent-cyan)]">{tpl.issued_count.toLocaleString()}</td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {tpl.fields.slice(0, 3).map(f => (
                                                <span key={f} className="bg-[var(--vct-bg-base)] border border-[var(--vct-border-subtle)] px-1.5 py-0.5 rounded text-[9px] font-mono text-[var(--vct-text-tertiary)]">{f}</span>
                                            ))}
                                            {tpl.fields.length > 3 && <span className="text-[9px] text-[var(--vct-text-tertiary)]">+{tpl.fields.length - 3}</span>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[var(--vct-bg-elevated)] border-b border-[var(--vct-border-strong)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                                <th className="p-4 w-20">T.Thái</th>
                                <th className="p-4 w-48">Mã số</th>
                                <th className="p-4 w-32">Loại</th>
                                <th className="p-4">Người nhận</th>
                                <th className="p-4 w-28">Ngày cấp</th>
                                <th className="p-4 w-32">Mã xác minh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                            {filteredIssued.map(doc => (
                                <tr key={doc.id} className="hover:bg-white/5 transition-colors text-sm">
                                    <td className="p-4"><VCT_Badge type={doc.status === 'valid' ? 'success' : 'danger'} text={doc.status === 'valid' ? 'Valid' : 'Revoked'} /></td>
                                    <td className="p-4 font-mono text-[12px] text-[var(--vct-text-primary)]">{doc.doc_number}</td>
                                    <td className="p-4 text-[12px]">{TYPE_LABELS[doc.type] || doc.type}</td>
                                    <td className="p-4 text-[var(--vct-accent-cyan)] font-semibold">{doc.recipient}</td>
                                    <td className="p-4 font-mono text-[11px] text-[var(--vct-text-tertiary)]">{doc.issued_at}</td>
                                    <td className="p-4 font-mono text-[11px] text-[var(--vct-text-secondary)]">{doc.verification_code}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
