'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput, VCT_Badge, VCT_Select,
    VCT_Modal, VCT_Input, VCT_Field, VCT_Toast
} from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Drawer } from '@vct/ui'
import { usePagination } from '../hooks/usePagination'
import { AdminSkeletonRow } from './components/AdminSkeletonRow'
import { AdminPaginationBar } from './components/AdminPaginationBar'
import { useAdminFetch } from './hooks/useAdminAPI'

// ════════════════════════════════════════
// MOCK DATA — Document Templates
// ════════════════════════════════════════
const INITIAL_TEMPLATES = [
    { id: 'DT-001', type: 'MEDAL_CERTIFICATE', name: 'Giấy chứng nhận Huy chương', version: 2, is_active: true, fields: ['athlete_name', 'tournament_name', 'medal_type', 'category', 'date'], federation: 'LVNVN', issued_count: 342 },
    { id: 'DT-002', type: 'PARTICIPATION_CERT', name: 'Giấy chứng nhận Tham gia', version: 1, is_active: true, fields: ['athlete_name', 'tournament_name', 'date'], federation: 'LVNVN', issued_count: 1250 },
    { id: 'DT-003', type: 'BELT_PROMOTION_CERT', name: 'Chứng nhận Thăng đai', version: 3, is_active: true, fields: ['athlete_name', 'belt_from', 'belt_to', 'exam_date', 'examiner'], federation: 'LVNVN', issued_count: 89 },
    { id: 'DT-004', type: 'REFEREE_LICENSE', name: 'Giấy phép Trọng tài', version: 1, is_active: true, fields: ['referee_name', 'license_level', 'valid_from', 'valid_until'], federation: 'LVNVN', issued_count: 56 },
    { id: 'DT-005', type: 'ATHLETE_CARD', name: 'Thẻ VĐV', version: 2, is_active: true, fields: ['athlete_name', 'photo', 'dob', 'club', 'belt_rank', 'id_number'], federation: 'LVNVN', issued_count: 2100 },
    { id: 'DT-006', type: 'TOURNAMENT_SANCTION', name: 'Quyết định Phê duyệt Giải', version: 1, is_active: false, fields: ['tournament_name', 'organizer', 'location', 'date_range', 'budget'], federation: 'LVNVN', issued_count: 12 },
    { id: 'DT-007', type: 'MEDICAL_CLEARANCE', name: 'Giấy chứng nhận Sức khỏe', version: 1, is_active: true, fields: ['athlete_name', 'doctor_name', 'hospital', 'exam_date', 'valid_until'], federation: null, issued_count: 450 },
]

interface IssuedDoc {
    id: string
    doc_number: string
    type: string
    recipient: string
    issued_at: string
    status: string
    verification_code: string
}

const TYPE_OPTIONS = [
    { value: 'MEDAL_CERTIFICATE', label: '🥇 Huy chương' },
    { value: 'PARTICIPATION_CERT', label: '📜 Tham gia' },
    { value: 'BELT_PROMOTION_CERT', label: '🥋 Thăng đai' },
    { value: 'REFEREE_LICENSE', label: '🏅 GP Trọng tài' },
    { value: 'TOURNAMENT_SANCTION', label: '📋 PD Giải đấu' },
    { value: 'CLUB_REGISTRATION', label: '🏢 GP CLB' },
    { value: 'ATHLETE_CARD', label: '🪪 Thẻ VĐV' },
    { value: 'MEDICAL_CLEARANCE', label: '🏥 Sức khỏe' },
    { value: 'CUSTOM', label: '📄 Tùy chỉnh' },
]

const TYPE_LABELS: Record<string, string> = TYPE_OPTIONS.reduce<Record<string, string>>((acc, o) => {
    acc[o.value] = o.label
    return acc
}, {})

const BLANK_TEMPLATE = { name: '', type: 'MEDAL_CERTIFICATE', fieldsText: '', is_active: true }



// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_documents = () => {
    const [templates, setTemplates] = useState(INITIAL_TEMPLATES)
    const { data: fetchedIssued } = useAdminFetch<IssuedDoc[]>('/admin/documents/issued')
    const issuedDocs = useMemo(() => fetchedIssued ?? [], [fetchedIssued])
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('all')
    const [tab, setTab] = useState<'templates' | 'issued'>('templates')
    const [isLoading, setIsLoading] = useState(true)
    const [showAddModal, setShowAddModal] = useState(false)
    const [form, setForm] = useState(BLANK_TEMPLATE)
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
    const [drawerTemplate, setDrawerTemplate] = useState<typeof INITIAL_TEMPLATES[0] | null>(null)
    const [drawerDoc, setDrawerDoc] = useState<IssuedDoc | null>(null)

    // Simulate initial loading
    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    const filteredTemplates = useMemo(() => {
        let v = templates
        if (typeFilter !== 'all') v = v.filter(t => t.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            v = v.filter(t => t.name.toLowerCase().includes(q))
        }
        return v
    }, [search, typeFilter, templates])

    const filteredIssued = useMemo(() => {
        if (!search) return issuedDocs
        const q = search.toLowerCase()
        return issuedDocs.filter(d => d.recipient.toLowerCase().includes(q) || d.doc_number.toLowerCase().includes(q))
    }, [search, issuedDocs])

    const tplPagination = usePagination(filteredTemplates, { pageSize: 5 })
    const issuedPagination = usePagination(filteredIssued, { pageSize: 5 })

    const totalIssued = templates.reduce((acc, t) => acc + t.issued_count, 0)

    const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type })
        setTimeout(() => setToast(null), 3000)
    }, [])

    const handleExport = useCallback(() => {
        const header = 'ID,Loại,Tên mẫu,Version,Trạng thái,Đã cấp,Trường\n'
        const rows = filteredTemplates.map(t =>
            `${t.id},${t.type},${t.name},${t.version},${t.is_active ? 'Active' : 'Off'},${t.issued_count},"${t.fields.join(', ')}"`
        ).join('\n')
        const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'document_templates.csv'; a.click()
        URL.revokeObjectURL(url)
        showToast('Đã xuất báo cáo mẫu tài liệu!')
    }, [filteredTemplates, showToast])

    const handleSubmitTemplate = useCallback(() => {
        if (!form.name.trim()) return
        const newTpl = {
            id: `DT-${String(templates.length + 1).padStart(3, '0')}`,
            type: form.type,
            name: form.name.trim(),
            version: 1,
            is_active: form.is_active,
            fields: form.fieldsText.split(',').map(f => f.trim()).filter(Boolean),
            federation: 'LVNVN',
            issued_count: 0,
        }
        setTemplates(prev => [newTpl, ...prev])
        setShowAddModal(false)
        setForm(BLANK_TEMPLATE)
        showToast(`Đã tạo mẫu "${newTpl.name}" thành công!`)
    }, [form, templates.length, showToast])

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            {toast && <VCT_Toast isVisible={!!toast} message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Quản Lý Chứng Chỉ & Tài Liệu</h1>
                    <p className="text-sm text-(--vct-text-secondary) mt-1">Quản lý mẫu chứng chỉ, giấy phép, thẻ VĐV. Ký số + xác minh QR.</p>
                </div>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button variant="ghost" icon={<VCT_Icons.Download size={16} />} onClick={handleExport}>Xuất CSV</VCT_Button>
                    <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />} onClick={() => setShowAddModal(true)}>Thêm mẫu</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── STAT CARDS ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                    { label: 'Tổng mẫu', value: templates.length, color: 'var(--vct-accent-blue,#3b82f6)' },
                    { label: 'Mẫu active', value: templates.filter(t => t.is_active).length, color: 'var(--vct-accent-green,#22c55e)' },
                    { label: 'Đã cấp', value: totalIssued.toLocaleString(), color: 'var(--vct-accent-cyan,#06b6d4)' },
                    { label: 'Loại mẫu', value: new Set(templates.map(t => t.type)).size, color: 'var(--vct-accent-purple,#8b5cf6)' },
                ].map(card => (
                    <div key={card.label} className="bg-(--vct-bg-card) border border-(--vct-border-subtle) rounded-2xl p-5 text-center">
                        <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
                        <div className="text-xs text-(--vct-text-tertiary) mt-1">{card.label}</div>
                    </div>
                ))}
            </div>

            {/* ── TABS ── */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setTab('templates')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'templates' ? 'bg-(--vct-accent-blue,#3b82f6) text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:text-(--vct-text-primary)'}`}
                >Mẫu tài liệu</button>
                <button
                    onClick={() => setTab('issued')}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === 'issued' ? 'bg-(--vct-accent-blue,#3b82f6) text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:text-(--vct-text-primary)'}`}
                >Đã cấp ({issuedDocs.length})</button>
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
                        ...TYPE_OPTIONS,
                    ]} />
                )}
            </div>

            {tab === 'templates' ? (
                <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                                <th className="p-4 w-20">T.Thái</th>
                                <th className="p-4 w-32">Loại</th>
                                <th className="p-4">Tên mẫu</th>
                                <th className="p-4 w-20 text-center">Ver.</th>
                                <th className="p-4 w-28 text-right">Đã cấp</th>
                                <th className="p-4 w-44">Trường bắt buộc</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={6} />)
                            ) : tplPagination.paginatedItems.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-(--vct-text-tertiary)">Không tìm thấy mẫu tài liệu nào</td></tr>
                            ) : (
                                tplPagination.paginatedItems.map(tpl => (
                                    <tr key={tpl.id} className="hover:bg-white/5 transition-colors text-sm cursor-pointer" onClick={() => setDrawerTemplate(tpl)}>
                                        <td className="p-4"><VCT_Badge type={tpl.is_active ? 'success' : 'neutral'} text={tpl.is_active ? 'Active' : 'Off'} /></td>
                                        <td className="p-4 text-[12px]">{TYPE_LABELS[tpl.type] || tpl.type}</td>
                                        <td className="p-4 font-semibold text-(--vct-text-primary)">{tpl.name}</td>
                                        <td className="p-4 text-center text-(--vct-text-tertiary)">v{tpl.version}</td>
                                        <td className="p-4 text-right font-mono text-[12px] text-(--vct-accent-cyan)">{tpl.issued_count.toLocaleString()}</td>
                                        <td className="p-4">
                                            <div className="flex flex-wrap gap-1">
                                                {tpl.fields.slice(0, 3).map(f => (
                                                    <span key={f} className="bg-(--vct-bg-base) border border-(--vct-border-subtle) px-1.5 py-0.5 rounded text-[9px] font-mono text-(--vct-text-tertiary)">{f}</span>
                                                ))}
                                                {tpl.fields.length > 3 && <span className="text-[9px] text-(--vct-text-tertiary)">+{tpl.fields.length - 3}</span>}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {!isLoading && <AdminPaginationBar {...tplPagination} />}
                </div>
            ) : (
                <div className="bg-(--vct-bg-card) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-(--vct-bg-elevated) border-b border-(--vct-border-strong) text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">
                                <th className="p-4 w-20">T.Thái</th>
                                <th className="p-4 w-48">Mã số</th>
                                <th className="p-4 w-32">Loại</th>
                                <th className="p-4">Người nhận</th>
                                <th className="p-4 w-28">Ngày cấp</th>
                                <th className="p-4 w-32">Mã xác minh</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--vct-border-subtle)">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={6} />)
                            ) : issuedPagination.paginatedItems.length === 0 ? (
                                <tr><td colSpan={6} className="p-12 text-center text-(--vct-text-tertiary)">Không tìm thấy tài liệu nào</td></tr>
                            ) : (
                                issuedPagination.paginatedItems.map(doc => (
                                    <tr key={doc.id} className="hover:bg-white/5 transition-colors text-sm cursor-pointer" onClick={() => setDrawerDoc(doc)}>
                                        <td className="p-4"><VCT_Badge type={doc.status === 'valid' ? 'success' : 'danger'} text={doc.status === 'valid' ? 'Valid' : 'Revoked'} /></td>
                                        <td className="p-4 font-mono text-[12px] text-(--vct-text-primary)">{doc.doc_number}</td>
                                        <td className="p-4 text-[12px]">{TYPE_LABELS[doc.type] || doc.type}</td>
                                        <td className="p-4 text-(--vct-accent-cyan) font-semibold">{doc.recipient}</td>
                                        <td className="p-4 font-mono text-[11px] text-(--vct-text-tertiary)">{doc.issued_at}</td>
                                        <td className="p-4 font-mono text-[11px] text-(--vct-text-secondary)">{doc.verification_code}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                    {!isLoading && <AdminPaginationBar {...issuedPagination} />}
                </div>
            )}

            {/* ── ADD TEMPLATE MODAL ── */}
            <VCT_Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Thêm mẫu tài liệu mới">
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên mẫu" required>
                        <VCT_Input placeholder="VD: Giấy chứng nhận Huy chương" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                    </VCT_Field>
                    <VCT_Field label="Loại tài liệu">
                        <VCT_Select value={form.type} onChange={(v: string) => setForm(f => ({ ...f, type: v }))} options={TYPE_OPTIONS} />
                    </VCT_Field>
                    <VCT_Field label="Trường dữ liệu" hint="Phân cách bằng dấu phẩy, VD: athlete_name, tournament_name, date">
                        <VCT_Input placeholder="athlete_name, tournament_name, medal_type" value={form.fieldsText} onChange={(e) => setForm(f => ({ ...f, fieldsText: e.target.value }))} />
                    </VCT_Field>
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox" id="tpl-active" checked={form.is_active}
                            onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                            className="w-4 h-4 accent-(--vct-accent-blue,#3b82f6)"
                        />
                        <label htmlFor="tpl-active" className="text-sm text-(--vct-text-secondary)">Kích hoạt ngay</label>
                    </div>
                </VCT_Stack>
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-(--vct-border-subtle)">
                    <VCT_Button variant="ghost" onClick={() => setShowAddModal(false)}>Hủy</VCT_Button>
                    <VCT_Button variant="primary" onClick={handleSubmitTemplate} disabled={!form.name.trim()}>Tạo mẫu</VCT_Button>
                </div>
            </VCT_Modal>

            {/* ── TEMPLATE DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerTemplate} onClose={() => setDrawerTemplate(null)} title="Chi tiết mẫu tài liệu" width={520}>
                {drawerTemplate && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-(--vct-border-subtle)">
                            <VCT_Badge type={drawerTemplate.is_active ? 'success' : 'neutral'} text={drawerTemplate.is_active ? 'Active' : 'Off'} />
                            <span className="font-mono text-xs text-(--vct-text-tertiary) ml-auto">{drawerTemplate.id}</span>
                        </div>
                        <div>
                            <div className="text-lg font-bold text-(--vct-text-primary)">{drawerTemplate.name}</div>
                            <div className="text-sm text-(--vct-text-secondary) mt-1">{TYPE_LABELS[drawerTemplate.type] || drawerTemplate.type}</div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) text-center">
                                <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Version</div>
                                <div className="text-xl font-black text-(--vct-accent-blue)">v{drawerTemplate.version}</div>
                            </div>
                            <div className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) text-center">
                                <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Đã cấp</div>
                                <div className="text-xl font-black text-(--vct-accent-cyan)">{drawerTemplate.issued_count.toLocaleString()}</div>
                            </div>
                            <div className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) text-center">
                                <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Liên đoàn</div>
                                <div className="text-sm font-bold text-(--vct-text-primary)">{drawerTemplate.federation || '—'}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Trường dữ liệu</div>
                            <div className="flex flex-wrap gap-2">
                                {drawerTemplate.fields.map(f => (
                                    <span key={f} className="bg-(--vct-bg-base) border border-(--vct-border-subtle) px-2 py-1 rounded-lg text-xs font-mono text-(--vct-text-secondary)">{f}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </VCT_Drawer>

            {/* ── ISSUED DOC DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerDoc} onClose={() => setDrawerDoc(null)} title="Chi tiết tài liệu đã cấp" width={480}>
                {drawerDoc && (
                    <div className="space-y-5">
                        <div className="flex items-center gap-3 pb-4 border-b border-(--vct-border-subtle)">
                            <VCT_Badge type={drawerDoc.status === 'valid' ? 'success' : 'danger'} text={drawerDoc.status === 'valid' ? 'Valid' : 'Revoked'} />
                            <span className="font-mono text-xs text-(--vct-text-tertiary) ml-auto">{drawerDoc.id}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Mã số</div><div className="font-mono font-bold text-(--vct-text-primary)">{drawerDoc.doc_number}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Loại</div><div className="text-(--vct-text-primary)">{TYPE_LABELS[drawerDoc.type] || drawerDoc.type}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Người nhận</div><div className="font-semibold text-(--vct-accent-cyan)">{drawerDoc.recipient}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Ngày cấp</div><div className="font-mono text-(--vct-text-primary)">{drawerDoc.issued_at}</div></div>
                        </div>
                        <div className="p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Mã xác minh QR</div>
                            <div className="flex items-center gap-3">
                                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                                    <VCT_Icons.Shield size={48} />
                                </div>
                                <div className="font-mono text-lg font-black text-(--vct-accent-green)">{drawerDoc.verification_code}</div>
                            </div>
                        </div>
                    </div>
                )}
            </VCT_Drawer>
        </div>
    )
}
