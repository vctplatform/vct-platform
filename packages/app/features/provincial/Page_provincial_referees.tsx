'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_AvatarLetter } from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PROVINCIAL REFEREE MANAGEMENT
// Full CRUD + Approve/Reject + Stats + Certificates + Filters
// ═══════════════════════════════════════════════════════════════

const API = '/api/v1/provincial'

interface Referee {
    id: string; full_name: string; gender: string; date_of_birth: string
    referee_rank: string; cert_number: string; expertise: string
    experience_years: number; phone: string; email: string
    address: string; photo_url: string; notes: string; status: string
    province_id: string; created_at: string; updated_at: string
}

interface RefereeCert {
    id: string; referee_id: string; name: string; issuer: string
    cert_type: string; issue_date: string; expiry_date: string; status: string
}

interface RefereeStats {
    total: number; active: number; pending: number; inactive: number
    by_rank: Record<string, number>; by_expertise: Record<string, number>
}

type TabKey = 'all' | 'active' | 'pending' | 'inactive'

const RANK_MAP: Record<string, { label: string; color: string }> = {
    quoc_gia: { label: 'Quốc gia', color: 'var(--vct-info)' },
    cap_1: { label: 'Cấp I', color: 'var(--vct-accent-cyan)' },
    cap_2: { label: 'Cấp II', color: 'var(--vct-success)' },
    cap_3: { label: 'Cấp III', color: 'var(--vct-text-tertiary)' },
}

const EXPERTISE_MAP: Record<string, string> = {
    quyen: 'Quyền', doi_khang: 'Đối kháng', ca_hai: 'Cả hai',
}

const STATUS_MAP: Record<string, { label: string; type: string }> = {
    active: { label: 'Đang HĐ', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    inactive: { label: 'Tạm nghỉ', type: 'neutral' },
}

const CERT_STATUS: Record<string, { label: string; type: string }> = {
    valid: { label: 'Còn hiệu lực', type: 'success' },
    expiring: { label: 'Sắp hết hạn', type: 'warning' },
    expired: { label: 'Đã hết hạn', type: 'danger' },
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'Tất cả', icon: <VCT_Icons.Users size={14} /> },
    { key: 'active', label: 'Đang HĐ', icon: <VCT_Icons.Activity size={14} /> },
    { key: 'pending', label: 'Chờ duyệt', icon: <VCT_Icons.Clock size={14} /> },
    { key: 'inactive', label: 'Tạm nghỉ', icon: <VCT_Icons.Clock size={14} /> },
]

function authHeaders(): HeadersInit {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

// ── Main Page ────────────────────────────────────────────────

export const Page_provincial_referees = () => {
    const [referees, setReferees] = useState<Referee[]>([])
    const [stats, setStats] = useState<RefereeStats | null>(null)
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState<TabKey>('all')
    const [filterRank, setFilterRank] = useState('')
    const [filterExpertise, setFilterExpertise] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editRef, setEditRef] = useState<Referee | null>(null)
    const [expandedId, setExpandedId] = useState<string | null>(null)
    const [certs, setCerts] = useState<RefereeCert[]>([])
    const [deleteId, setDeleteId] = useState<string | null>(null)

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500)
    }, [])

    const loadData = useCallback(async () => {
        try {
            const [refRes, statsRes] = await Promise.all([
                fetch(`${API}/referees?province_id=PROV-HCM`, { headers: authHeaders() }),
                fetch(`${API}/referees/stats?province_id=PROV-HCM`, { headers: authHeaders() }),
            ])
            if (refRes.ok) { const d = await refRes.json(); setReferees((d.data?.referees || d.referees) || []) }
            if (statsRes.ok) { const d = await statsRes.json(); setStats(d.data || d) }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { loadData() }, [loadData])

    // ── Filtered List ────────────────────────────────────────

    const filtered = useMemo(() => {
        let list = referees
        if (tab !== 'all') list = list.filter(r => r.status === tab)
        if (filterRank) list = list.filter(r => r.referee_rank === filterRank)
        if (filterExpertise) list = list.filter(r => r.expertise === filterExpertise)
        if (search) {
            const q = search.toLowerCase()
            list = list.filter(r => r.full_name.toLowerCase().includes(q) || r.phone?.includes(q) || r.email?.toLowerCase().includes(q))
        }
        return list
    }, [referees, search, tab, filterRank, filterExpertise])

    // ── CRUD Handlers ────────────────────────────────────────

    const handleSave = async (data: Partial<Referee>) => {
        try {
            if (editRef) {
                const res = await fetch(`${API}/referees/${editRef.id}`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify(data) })
                if (!res.ok) throw new Error('Update failed')
                showToast(`Đã cập nhật ${data.full_name || editRef.full_name}`)
            } else {
                const res = await fetch(`${API}/referees`, { method: 'POST', headers: authHeaders(), body: JSON.stringify({ ...data, province_id: 'PROV-HCM' }) })
                if (!res.ok) throw new Error('Create failed')
                showToast(`Đã thêm trọng tài ${data.full_name}`)
            }
            setShowModal(false); setEditRef(null); loadData()
        } catch { showToast('Có lỗi xảy ra', 'danger') }
    }

    const handleDelete = async () => {
        if (!deleteId) return
        try {
            await fetch(`${API}/referees/${deleteId}`, { method: 'DELETE', headers: authHeaders() })
            showToast('Đã xoá trọng tài'); setDeleteId(null); loadData()
        } catch { showToast('Không thể xoá', 'danger') }
    }

    const handleApprove = async (id: string) => {
        try {
            await fetch(`${API}/referees/${id}/approve`, { method: 'POST', headers: authHeaders() })
            showToast('Đã duyệt trọng tài'); loadData()
        } catch { showToast('Lỗi khi duyệt', 'danger') }
    }

    const handleReject = async (id: string) => {
        try {
            await fetch(`${API}/referees/${id}/reject`, { method: 'POST', headers: authHeaders() })
            showToast('Đã từ chối trọng tài'); loadData()
        } catch { showToast('Lỗi khi từ chối', 'danger') }
    }

    const loadCerts = async (refereeId: string) => {
        try {
            const res = await fetch(`${API}/referees/${refereeId}/certificates`, { headers: authHeaders() })
            if (res.ok) { const d = await res.json(); setCerts((d.data?.certificates || d.certificates) || []) }
        } catch { setCerts([]) }
    }

    const toggleExpand = (id: string) => {
        if (expandedId === id) { setExpandedId(null); setCerts([]) }
        else { setExpandedId(id); loadCerts(id) }
    }

    // ── Render ────────────────────────────────────────────────

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">⚖️ Quản Lý Trọng Tài</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách trọng tài thuộc liên đoàn tỉnh — quản lý hồ sơ, chứng chỉ và phê duyệt</p>
            </div>

            {/* Stats Row */}
            <VCT_StatRow items={[
                { label: 'Tổng trọng tài', value: stats?.total ?? referees.length, icon: <VCT_Icons.Shield size={18} />, color: 'var(--vct-danger)' },
                { label: 'Đang hoạt động', value: stats?.active ?? referees.filter(r => r.status === 'active').length, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-success)' },
                { label: 'Chờ duyệt', value: stats?.pending ?? referees.filter(r => r.status === 'pending').length, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-warning)' },
                { label: 'Tạm nghỉ', value: stats?.inactive ?? 0, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-text-tertiary)' },
            ] as StatItem[]} className="mb-6" />

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl bg-(--vct-bg-card) border border-(--vct-border-subtle) w-fit">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t.key
                            ? 'bg-(--vct-primary) text-white shadow-md'
                            : 'text-(--vct-text-secondary) hover:bg-(--vct-bg-hover)'
                            }`}>
                        {t.icon}{t.label}
                        {t.key !== 'all' && <span className="ml-1 text-[10px] opacity-70">
                            {t.key === 'active' ? stats?.active ?? '—' : t.key === 'pending' ? stats?.pending ?? '—' : stats?.inactive ?? '—'}
                        </span>}
                    </button>
                ))}
            </div>

            {/* Toolbar: Search + Filters + Add */}
            <VCT_Stack direction="row" gap={12} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={10} align="center" className="flex-wrap">
                    <div className="w-full min-w-[220px] max-w-[320px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm trọng tài, SĐT, email..." />
                    </div>
                    <select value={filterRank} onChange={e => setFilterRank(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-(--vct-border-subtle) bg-(--vct-bg-card) text-sm text-(--vct-text-primary) outline-none transition-colors hover:border-(--vct-primary)">
                        <option value="">Tất cả cấp bậc</option>
                        {Object.entries(RANK_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                    <select value={filterExpertise} onChange={e => setFilterExpertise(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-(--vct-border-subtle) bg-(--vct-bg-card) text-sm text-(--vct-text-primary) outline-none transition-colors hover:border-(--vct-primary)">
                        <option value="">Tất cả chuyên môn</option>
                        {Object.entries(EXPERTISE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => { setEditRef(null); setShowModal(true) }}>Thêm Trọng Tài</VCT_Button>
            </VCT_Stack>

            {/* Table */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy trọng tài" description={loading ? 'Đang tải...' : 'Thử thay đổi bộ lọc hoặc thêm trọng tài mới.'} icon="⚖️" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                            {['Trọng tài', 'Cấp bậc', 'Chuyên môn', 'Kinh nghiệm', 'Liên hệ', 'Trạng thái', 'Thao tác'].map(h =>
                                <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider opacity-50">{h}</th>
                            )}
                        </tr></thead>
                        <tbody>
                            {filtered.map(r => (
                                <React.Fragment key={r.id}>
                                    <tr className={`border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors cursor-pointer ${expandedId === r.id ? 'bg-(--vct-bg-hover)' : ''}`}
                                        onClick={() => toggleExpand(r.id)}>
                                        <td className="px-4 py-3">
                                            <VCT_Stack direction="row" gap={10} align="center">
                                                <VCT_AvatarLetter name={r.full_name} size={38} />
                                                <div>
                                                    <div className="font-semibold text-sm text-(--vct-text-primary)">{r.full_name}</div>
                                                    <div className="text-[11px] text-(--vct-text-tertiary)">
                                                        {r.gender === 'nam' ? '♂ Nam' : '♀ Nữ'}{r.date_of_birth ? ` · ${r.date_of_birth}` : ''}
                                                    </div>
                                                </div>
                                            </VCT_Stack>
                                        </td>
                                        <td className="px-4 py-3">
                                            {RANK_MAP[r.referee_rank]
                                                ? <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: RANK_MAP[r.referee_rank]?.color + '22', color: RANK_MAP[r.referee_rank]?.color }}>
                                                    {RANK_MAP[r.referee_rank]?.label}
                                                </span>
                                                : <span className="text-xs opacity-50">{r.referee_rank || '—'}</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 text-sm">{EXPERTISE_MAP[r.expertise] || r.expertise || '—'}</td>
                                        <td className="px-4 py-3 text-sm">{r.experience_years ? `${r.experience_years} năm` : '—'}</td>
                                        <td className="px-4 py-3">
                                            <div className="text-xs text-(--vct-text-secondary)">{r.phone || '—'}</div>
                                            {r.email && <div className="text-[10px] text-(--vct-text-tertiary)">{r.email}</div>}
                                        </td>
                                        <td className="px-4 py-3">
                                            <VCT_Badge text={STATUS_MAP[r.status]?.label || r.status} type={STATUS_MAP[r.status]?.type || 'neutral'} />
                                        </td>
                                        <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                            <VCT_Stack direction="row" gap={4}>
                                                {r.status === 'pending' && (
                                                    <>
                                                        <button onClick={() => handleApprove(r.id)} title="Duyệt"
                                                            className="p-1.5 rounded-lg text-emerald-500 hover:bg-emerald-500/10 transition-colors"><VCT_Icons.Check size={16} /></button>
                                                        <button onClick={() => handleReject(r.id)} title="Từ chối"
                                                            className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"><VCT_Icons.X size={16} /></button>
                                                    </>
                                                )}
                                                <button onClick={() => { setEditRef(r); setShowModal(true) }} title="Chỉnh sửa"
                                                    className="p-1.5 rounded-lg text-(--vct-text-tertiary) hover:text-(--vct-primary) hover:bg-(--vct-primary-ghost) transition-colors"><VCT_Icons.Edit size={15} /></button>
                                                <button onClick={() => setDeleteId(r.id)} title="Xoá"
                                                    className="p-1.5 rounded-lg text-(--vct-text-tertiary) hover:text-red-500 hover:bg-red-500/10 transition-colors"><VCT_Icons.Trash size={15} /></button>
                                            </VCT_Stack>
                                        </td>
                                    </tr>

                                    {/* Expanded Detail Row */}
                                    {expandedId === r.id && (
                                        <tr><td colSpan={7} className="px-6 py-4 bg-(--vct-bg-card) border-b border-(--vct-border-subtle)">
                                            <div className="grid grid-cols-3 gap-6">
                                                {/* Personal Info */}
                                                <div>
                                                    <h4 className="text-xs font-bold uppercase opacity-40 mb-3">Thông tin cá nhân</h4>
                                                    <div className="space-y-2 text-sm">
                                                        <div><span className="opacity-50 mr-2">Số CC/CCCD:</span>{r.cert_number || '—'}</div>
                                                        <div><span className="opacity-50 mr-2">Địa chỉ:</span>{r.address || '—'}</div>
                                                        <div><span className="opacity-50 mr-2">Ghi chú:</span>{r.notes || '—'}</div>
                                                    </div>
                                                </div>
                                                {/* Certificates */}
                                                <div className="col-span-2">
                                                    <h4 className="text-xs font-bold uppercase opacity-40 mb-3">Chứng chỉ ({certs.length})</h4>
                                                    {certs.length === 0 ? (
                                                        <p className="text-xs opacity-40">Chưa có chứng chỉ nào</p>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            {certs.map(c => (
                                                                <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-(--vct-bg-glass) border border-(--vct-border-subtle)">
                                                                    <VCT_Icons.Award size={16} className="opacity-50" />
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-sm font-medium truncate">{c.name}</div>
                                                                        <div className="text-[10px] opacity-40">{c.issuer} · {c.issue_date}{c.expiry_date ? ` → ${c.expiry_date}` : ''}</div>
                                                                    </div>
                                                                    <VCT_Badge text={CERT_STATUS[c.status]?.label || c.status} type={CERT_STATUS[c.status]?.type || 'neutral'} />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td></tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Summary */}
            <div className="mt-4 text-xs text-(--vct-text-tertiary) text-right">
                Hiển thị {filtered.length}/{referees.length} trọng tài
            </div>

            {/* Add/Edit Modal */}
            {showModal && <RefereeModal referee={editRef} onSave={handleSave} onClose={() => { setShowModal(false); setEditRef(null) }} />}

            {/* Delete Confirmation */}
            {deleteId && (
                <div className="fixed inset-0 z- flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)}>
                    <div className="bg-(--vct-bg-card) rounded-2xl p-6 w-full max-w-sm shadow-2xl border border-(--vct-border-subtle)" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-2">Xác nhận xoá</h3>
                        <p className="text-sm text-(--vct-text-secondary) mb-5">Bạn chắc chắn muốn xoá trọng tài này? Hành động không thể hoàn tác.</p>
                        <VCT_Stack direction="row" gap={10} justify="flex-end">
                            <VCT_Button variant="ghost" onClick={() => setDeleteId(null)}>Huỷ</VCT_Button>
                            <VCT_Button variant="danger" onClick={handleDelete}>Xoá</VCT_Button>
                        </VCT_Stack>
                    </div>
                </div>
            )}
        </VCT_PageContainer>
    )
}

// ── Referee Add/Edit Modal ───────────────────────────────────

function RefereeModal({ referee, onSave, onClose }: { referee: Referee | null; onSave: (d: Partial<Referee>) => void; onClose: () => void }) {
    const [form, setForm] = useState({
        full_name: referee?.full_name || '',
        gender: referee?.gender || 'nam',
        date_of_birth: referee?.date_of_birth || '',
        referee_rank: referee?.referee_rank || 'cap_3',
        expertise: referee?.expertise || 'quyen',
        experience_years: referee?.experience_years ?? 0,
        phone: referee?.phone || '',
        email: referee?.email || '',
        address: referee?.address || '',
        cert_number: referee?.cert_number || '',
        notes: referee?.notes || '',
    })

    const set = (key: string, val: string | number) => setForm(p => ({ ...p, [key]: val }))

    const inputCls = "w-full px-3 py-2 rounded-lg border border-(--vct-border-subtle) bg-(--vct-bg-glass) text-sm text-(--vct-text-primary) outline-none transition-colors focus:border-(--vct-primary) focus:ring-2 focus:ring-(--vct-primary-ghost)"
    const labelCls = "block text-xs font-semibold text-(--vct-text-secondary) mb-1.5"

    return (
        <div className="fixed inset-0 z- flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-(--vct-bg-card) rounded-2xl p-6 w-full max-w-lg shadow-2xl border border-(--vct-border-subtle) max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-5">{referee ? '✏️ Chỉnh sửa Trọng Tài' : '➕ Thêm Trọng Tài Mới'}</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="col-span-2"><label className={labelCls}>Họ và tên *</label><input className={inputCls} value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Nguyễn Văn A" /></div>
                    <div><label className={labelCls}>Giới tính</label>
                        <select className={inputCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                            <option value="nam">Nam</option><option value="nu">Nữ</option>
                        </select></div>
                    <div><label className={labelCls}>Ngày sinh</label><input type="date" className={inputCls} value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} /></div>
                    <div><label className={labelCls}>Cấp bậc</label>
                        <select className={inputCls} value={form.referee_rank} onChange={e => set('referee_rank', e.target.value)}>
                            {Object.entries(RANK_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select></div>
                    <div><label className={labelCls}>Chuyên môn</label>
                        <select className={inputCls} value={form.expertise} onChange={e => set('expertise', e.target.value)}>
                            {Object.entries(EXPERTISE_MAP).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select></div>
                    <div><label className={labelCls}>Số năm kinh nghiệm</label><input type="number" min={0} className={inputCls} value={form.experience_years} onChange={e => set('experience_years', parseInt(e.target.value) || 0)} /></div>
                    <div><label className={labelCls}>Số chứng chỉ TT</label><input className={inputCls} value={form.cert_number} onChange={e => set('cert_number', e.target.value)} placeholder="TT-QG-2024-XXX" /></div>
                    <div><label className={labelCls}>Số điện thoại</label><input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="0903..." /></div>
                    <div><label className={labelCls}>Email</label><input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@vct.vn" /></div>
                    <div className="col-span-2"><label className={labelCls}>Địa chỉ</label><input className={inputCls} value={form.address} onChange={e => set('address', e.target.value)} placeholder="Quận, tỉnh/TP" /></div>
                    <div className="col-span-2"><label className={labelCls}>Ghi chú</label><textarea className={inputCls} rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Ghi chú thêm..." /></div>
                </div>

                <VCT_Stack direction="row" gap={10} justify="flex-end">
                    <VCT_Button variant="ghost" onClick={onClose}>Huỷ</VCT_Button>
                    <VCT_Button onClick={() => onSave(form)} disabled={!form.full_name}>{referee ? 'Cập nhật' : 'Thêm mới'}</VCT_Button>
                </VCT_Stack>
            </div>
        </div>
    )
}
