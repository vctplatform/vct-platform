'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState, VCT_FilterChips, VCT_AvatarLetter } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

const API = '/api/v1/provincial'

// ── Types ────────────────────────────────────────────────────

interface VoSinh {
    id: string; full_name: string; gender: string; date_of_birth: string
    club_id: string; club_name: string; belt_rank: string; belt_label: string
    age_group: string; age_group_label: string; weight: number; height: number
    parent_name: string; parent_phone: string; coach_id: string; coach_name: string
    phone: string; email: string; address: string; id_number: string
    photo_url: string; start_date: string; notes: string; status: string
}

interface BeltHistoryItem {
    id: string; vo_sinh_id: string; from_belt: string; from_label: string
    to_belt: string; to_label: string; exam_date: string; result: string
    score: number; examiner_name: string; exam_location: string
    cert_id: string; notes: string
}

interface VoSinhStats {
    total: number; active_count: number; pending_count: number
    by_gender: Record<string, number>; by_age_group: Record<string, number>
    by_belt: Record<string, number>; by_status: Record<string, number>
    by_club: Record<string, number>
}

// ── Constants ────────────────────────────────────────────────

const STATUS_MAP: Record<string, { label: string; type: any }> = {
    active: { label: 'Đang tập', type: 'success' },
    pending: { label: 'Chờ duyệt', type: 'warning' },
    inactive: { label: 'Ngưng', type: 'neutral' },
    suspended: { label: 'Đình chỉ', type: 'error' },
}
const GENDER_MAP: Record<string, string> = { nam: 'Nam', nu: 'Nữ' }
const BELT_COLORS: Record<string, string> = {
    khong_dai: '#94a3b8', dai_vang: '#eab308', dai_xanh: '#22c55e',
    dai_lam: '#3b82f6', dai_do: '#ef4444', so_dang: '#1e293b',
    nhat_dang: '#1e293b', nhi_dang: '#1e293b', tam_dang: '#1e293b',
    tu_dang: '#1e293b', ngu_dang: '#1e293b', luc_dang: '#1e293b',
    that_dang: '#1e293b', bat_dang: '#1e293b', cuu_dang: '#1e293b', thap_dang: '#1e293b',
}
const AGE_LABELS: Record<string, string> = {
    thieu_nhi: 'Thiếu nhi (5-12)', thieu_nien: 'Thiếu niên (13-17)',
    thanh_nien: 'Thanh niên (18-35)', trung_nien: 'Trung niên (36+)',
}
const BELT_OPTIONS = [
    { value: 'khong_dai', label: 'Không đai' }, { value: 'dai_vang', label: 'Đai vàng' },
    { value: 'dai_xanh', label: 'Đai xanh' }, { value: 'dai_lam', label: 'Đai lam' },
    { value: 'dai_do', label: 'Đai đỏ' }, { value: 'so_dang', label: 'Sơ đẳng' },
    { value: 'nhat_dang', label: 'Nhất đẳng' }, { value: 'nhi_dang', label: 'Nhị đẳng' },
    { value: 'tam_dang', label: 'Tam đẳng' }, { value: 'tu_dang', label: 'Tứ đẳng' },
    { value: 'ngu_dang', label: 'Ngũ đẳng' }, { value: 'luc_dang', label: 'Lục đẳng' },
    { value: 'that_dang', label: 'Thất đẳng' }, { value: 'bat_dang', label: 'Bát đẳng' },
    { value: 'cuu_dang', label: 'Cửu đẳng' }, { value: 'thap_dang', label: 'Thập đẳng' },
]
const BELT_ORDER = BELT_OPTIONS.map(b => b.value)

type SortKey = 'full_name' | 'belt_rank' | 'club_name' | 'start_date'
type SortDir = 'asc' | 'desc'
type ModalMode = null | 'create' | 'detail' | 'edit' | 'confirm'
type DetailTab = 'info' | 'belt' | 'activity'

// ── Helpers ──────────────────────────────────────────────────

const getProvinceId = () => {
    if (typeof window === 'undefined') return 'PROV-HCM'
    return localStorage.getItem('vct_province_id') || 'PROV-HCM'
}

const headers = (): HeadersInit => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

const csvEscape = (v: any) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
}

const exportCSV = (data: VoSinh[]) => {
    const cols = ['full_name', 'gender', 'date_of_birth', 'club_name', 'belt_label', 'age_group_label', 'weight', 'height', 'coach_name', 'parent_name', 'phone', 'email', 'status', 'start_date'] as const
    const hdr = ['Họ tên', 'Giới tính', 'Ngày sinh', 'CLB', 'Đai', 'Nhóm tuổi', 'Cân (kg)', 'Cao (cm)', 'HLV', 'Phụ huynh', 'SĐT', 'Email', 'Trạng thái', 'Ngày bắt đầu']
    const rows = data.map(v => cols.map(c => {
        const val = v[c as keyof VoSinh]
        if (c === 'gender') return csvEscape(GENDER_MAP[val as string] || val)
        if (c === 'status') return csvEscape(STATUS_MAP[val as string]?.label || val)
        return csvEscape(val)
    }).join(','))
    const csv = [hdr.map(csvEscape).join(','), ...rows].join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `vo-sinh-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
}

const emptyForm = (): Partial<VoSinh> => ({
    full_name: '', gender: 'nam', date_of_birth: '', club_id: '', club_name: '',
    belt_rank: 'khong_dai', weight: 0, height: 0, phone: '', email: '',
    address: '', parent_name: '', parent_phone: '', notes: '', start_date: new Date().toISOString().slice(0, 10),
})

// ── Component ────────────────────────────────────────────────

export const Page_provincial_vo_sinh = () => {
    const [voSinh, setVoSinh] = useState<VoSinh[]>([])
    const [stats, setStats] = useState<VoSinhStats | null>(null)
    const [search, setSearch] = useState('')
    const [genderFilter, setGenderFilter] = useState<string | null>(null)
    const [beltFilter, setBeltFilter] = useState<string | null>(null)
    const [ageFilter, setAgeFilter] = useState<string | null>(null)
    const [statusFilter, setStatusFilter] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500)
    }, [])

    const [sortKey, setSortKey] = useState<SortKey>('full_name')
    const [sortDir, setSortDir] = useState<SortDir>('asc')
    const [modalMode, setModalMode] = useState<ModalMode>(null)
    const [selectedVS, setSelectedVS] = useState<VoSinh | null>(null)
    const [detailTab, setDetailTab] = useState<DetailTab>('info')
    const [beltHistory, setBeltHistory] = useState<BeltHistoryItem[]>([])
    const [beltHistoryLoading, setBeltHistoryLoading] = useState(false)
    const [form, setForm] = useState<Partial<VoSinh>>(emptyForm())
    const [saving, setSaving] = useState(false)
    const [actionMenu, setActionMenu] = useState<string | null>(null)
    const [confirmAction, setConfirmAction] = useState<{ type: string; id: string; name: string } | null>(null)

    // ── Data Fetch ───────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const h = headers()
            const provId = getProvinceId()
            const [vsRes, stRes] = await Promise.all([
                fetch(`${API}/vo-sinh?province_id=${provId}`, { headers: h }),
                fetch(`${API}/vo-sinh/stats?province_id=${provId}`, { headers: h }),
            ])
            if (vsRes.ok) { const d = await vsRes.json(); setVoSinh((d.data?.vo_sinh || d.vo_sinh) || []) }
            if (stRes.ok) { const d = await stRes.json(); setStats(d.data || d) }
        } catch (e) { console.error(e) }
        finally { setLoading(false) }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    // ── Filtering + Sorting ──────────────────────────────────
    const filtered = useMemo(() => {
        let data = voSinh
        if (genderFilter) data = data.filter(v => v.gender === genderFilter)
        if (beltFilter) data = data.filter(v => v.belt_rank === beltFilter)
        if (ageFilter) data = data.filter(v => v.age_group === ageFilter)
        if (statusFilter) data = data.filter(v => v.status === statusFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(v =>
                v.full_name.toLowerCase().includes(q) || v.club_name?.toLowerCase().includes(q) ||
                v.belt_label?.toLowerCase().includes(q) || v.coach_name?.toLowerCase().includes(q) ||
                v.phone?.includes(q) || v.email?.toLowerCase().includes(q)
            )
        }
        return [...data].sort((a, b) => {
            let cmp = 0
            if (sortKey === 'full_name') cmp = a.full_name.localeCompare(b.full_name)
            else if (sortKey === 'club_name') cmp = (a.club_name || '').localeCompare(b.club_name || '')
            else if (sortKey === 'start_date') cmp = (a.start_date || '').localeCompare(b.start_date || '')
            else if (sortKey === 'belt_rank') cmp = BELT_ORDER.indexOf(a.belt_rank) - BELT_ORDER.indexOf(b.belt_rank)
            return sortDir === 'asc' ? cmp : -cmp
        })
    }, [voSinh, search, genderFilter, beltFilter, ageFilter, statusFilter, sortKey, sortDir])

    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (genderFilter) f.push({ key: 'gender', label: 'Giới tính', value: GENDER_MAP[genderFilter] || genderFilter })
        if (beltFilter) f.push({ key: 'belt', label: 'Đai', value: voSinh.find(v => v.belt_rank === beltFilter)?.belt_label || beltFilter })
        if (ageFilter) f.push({ key: 'age', label: 'Nhóm tuổi', value: AGE_LABELS[ageFilter] || ageFilter })
        if (statusFilter) f.push({ key: 'status', label: 'Trạng thái', value: STATUS_MAP[statusFilter]?.label || statusFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [genderFilter, beltFilter, ageFilter, statusFilter, search, voSinh])

    const clearFilter = (k: string) => {
        if (k === 'gender') setGenderFilter(null); if (k === 'belt') setBeltFilter(null)
        if (k === 'age') setAgeFilter(null); if (k === 'status') setStatusFilter(null)
        if (k === 'search') setSearch('')
    }
    const clearAll = () => { setGenderFilter(null); setBeltFilter(null); setAgeFilter(null); setStatusFilter(null); setSearch('') }

    const uniqueBelts = useMemo(() => {
        const belts = new Set(voSinh.map(v => v.belt_rank))
        return Array.from(belts).map(b => ({ value: b, label: voSinh.find(v => v.belt_rank === b)?.belt_label || b }))
    }, [voSinh])

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        else { setSortKey(key); setSortDir('asc') }
    }
    const SortIcon = ({ k }: { k: SortKey }) => (
        <span className="ml-1 opacity-40">{sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}</span>
    )

    // ── Actions (with stats refresh) ─────────────────────────
    const refreshAfterAction = useCallback(async () => {
        try {
            const h = headers()
            const provId = getProvinceId()
            const stRes = await fetch(`${API}/vo-sinh/stats?province_id=${provId}`, { headers: h })
            if (stRes.ok) { const d = await stRes.json(); setStats(d.data || d) }
        } catch { /* silent */ }
    }, [])

    const handleApprove = async (id: string) => {
        try {
            const res = await fetch(`${API}/vo-sinh/${id}/approve`, { method: 'POST', headers: headers() })
            if (res.ok) {
                showToast('Đã duyệt võ sinh thành công!')
                setVoSinh(prev => prev.map(v => v.id === id ? { ...v, status: 'active' } : v))
                refreshAfterAction()
            } else { showToast('Lỗi duyệt', 'error') }
        } catch { showToast('Không thể kết nối server', 'error') }
    }

    const handleDeactivate = async (id: string) => {
        try {
            const res = await fetch(`${API}/vo-sinh/${id}/deactivate`, { method: 'POST', headers: headers() })
            if (res.ok) {
                showToast('Đã ngưng hoạt động võ sinh')
                setVoSinh(prev => prev.map(v => v.id === id ? { ...v, status: 'inactive' } : v))
                setActionMenu(null); setConfirmAction(null)
                refreshAfterAction()
            } else { showToast('Lỗi thao tác', 'error') }
        } catch { showToast('Không thể kết nối server', 'error') }
    }

    const handleReactivate = async (id: string) => {
        try {
            const res = await fetch(`${API}/vo-sinh/${id}/reactivate`, { method: 'POST', headers: headers() })
            if (res.ok) {
                showToast('Đã kích hoạt lại võ sinh!')
                setVoSinh(prev => prev.map(v => v.id === id ? { ...v, status: 'active' } : v))
                setActionMenu(null)
                refreshAfterAction()
            } else { showToast('Lỗi thao tác', 'error') }
        } catch { showToast('Không thể kết nối server', 'error') }
    }

    const handleSaveCreate = async () => {
        if (!form.full_name?.trim()) { showToast('Vui lòng nhập họ tên', 'error'); return }
        if (!form.club_name?.trim() && !form.club_id) { showToast('Vui lòng chọn CLB / Võ đường', 'error'); return }
        setSaving(true)
        try {
            const body = { ...form, province_id: getProvinceId() }
            const res = await fetch(`${API}/vo-sinh`, { method: 'POST', headers: headers(), body: JSON.stringify(body) })
            if (res.ok) {
                showToast('Thêm võ sinh thành công!')
                setModalMode(null); setForm(emptyForm())
                fetchData() // refreshes both list + stats
            } else { const d = await res.json().catch(() => ({})); showToast(d.error || 'Lỗi tạo mới', 'error') }
        } catch { showToast('Không thể kết nối server', 'error') }
        finally { setSaving(false) }
    }

    const handleSaveEdit = async () => {
        if (!selectedVS) return
        setSaving(true)
        try {
            const res = await fetch(`${API}/vo-sinh/${selectedVS.id}`, { method: 'PATCH', headers: headers(), body: JSON.stringify(form) })
            if (res.ok) {
                const d = await res.json()
                const updated = d.data || d
                showToast('Cập nhật thành công!')
                setVoSinh(prev => prev.map(v => v.id === selectedVS.id ? { ...v, ...updated } : v))
                setSelectedVS({ ...selectedVS, ...updated })
                setModalMode('detail') // Return to detail after edit
                refreshAfterAction()
            } else { showToast('Lỗi cập nhật', 'error') }
        } catch { showToast('Không thể kết nối server', 'error') }
        finally { setSaving(false) }
    }

    const openDetail = async (v: VoSinh) => {
        setSelectedVS(v); setDetailTab('info'); setModalMode('detail')
        setBeltHistoryLoading(true)
        try {
            const res = await fetch(`${API}/vo-sinh/${v.id}/belt-history`, { headers: headers() })
            if (res.ok) {
                const d = await res.json()
                setBeltHistory((d.data?.belt_history || d.belt_history) || [])
            }
        } catch { /* silent */ }
        finally { setBeltHistoryLoading(false) }
    }

    const openEdit = (v: VoSinh) => {
        setSelectedVS(v)
        setForm({
            full_name: v.full_name, gender: v.gender, date_of_birth: v.date_of_birth,
            club_name: v.club_name, club_id: v.club_id, belt_rank: v.belt_rank,
            weight: v.weight, height: v.height, phone: v.phone, email: v.email,
            address: v.address, parent_name: v.parent_name, parent_phone: v.parent_phone,
            notes: v.notes,
        })
        setModalMode('edit'); setActionMenu(null)
    }

    // ── Shared Form UI ───────────────────────────────────────
    const formField = (label: string, key: keyof typeof form, type = 'text', opts?: { required?: boolean; options?: { v: string; l: string }[] }) => (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold opacity-60">{label}{opts?.required && <span className="text-red-500 ml-0.5">*</span>}</label>
            {opts?.options ? (
                <select value={(form[key] as string) || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                    className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                    {opts.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
            ) : (
                <input type={type}
                    value={(form[key] as string | number) ?? ''}
                    onChange={e => setForm(p => ({ ...p, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))}
                    className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none focus:border-(--vct-accent) transition-colors"
                />
            )}
        </div>
    )

    const renderForm = (onSave: () => void) => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                {formField('Họ và tên', 'full_name', 'text', { required: true })}
                {formField('Giới tính', 'gender', 'text', { options: [{ v: 'nam', l: 'Nam' }, { v: 'nu', l: 'Nữ' }] })}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {formField('Ngày sinh', 'date_of_birth', 'date')}
                {formField('CLB / Võ đường', 'club_name', 'text', { required: true })}
            </div>
            <div className="grid grid-cols-3 gap-4">
                {formField('Đẳng cấp đai', 'belt_rank', 'text', { options: BELT_OPTIONS.map(b => ({ v: b.value, l: b.label })) })}
                {formField('Cân nặng (kg)', 'weight', 'number')}
                {formField('Chiều cao (cm)', 'height', 'number')}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {formField('Số điện thoại', 'phone')}
                {formField('Email', 'email', 'email')}
            </div>
            {formField('Địa chỉ', 'address')}
            <div className="grid grid-cols-2 gap-4">
                {formField('Phụ huynh (nếu < 18)', 'parent_name')}
                {formField('SĐT phụ huynh', 'parent_phone')}
            </div>
            {formField('Ghi chú', 'notes')}
            <div className="flex justify-end gap-3 pt-3 border-t border-(--vct-border-subtle)">
                <VCT_Button variant="ghost" onClick={() => { setModalMode(selectedVS ? 'detail' : null); setForm(emptyForm()) }}>Hủy</VCT_Button>
                <VCT_Button onClick={onSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</VCT_Button>
            </div>
        </div>
    )

    // ── Detail Modal Content ─────────────────────────────────
    const renderDetailInfo = (v: VoSinh) => (
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
            <DetailField label="Họ và tên" value={v.full_name} />
            <DetailField label="Giới tính" value={GENDER_MAP[v.gender] || v.gender} />
            <DetailField label="Ngày sinh" value={v.date_of_birth} />
            <DetailField label="CCCD/CMND" value={v.id_number} />
            <DetailField label="SĐT" value={v.phone} />
            <DetailField label="Email" value={v.email} />
            <DetailField label="Địa chỉ" value={v.address} span />
            <div className="col-span-2 border-t border-(--vct-border-subtle) pt-3 mt-1">
                <div className="text-xs font-bold uppercase opacity-50 mb-2">Thông tin võ thuật</div>
            </div>
            <DetailField label="CLB / Võ đường" value={v.club_name} />
            <DetailField label="HLV phụ trách" value={v.coach_name} />
            <DetailField label="Đai / Đẳng cấp" value={v.belt_label || v.belt_rank} badge beltColor={BELT_COLORS[v.belt_rank]} />
            <DetailField label="Nhóm tuổi" value={v.age_group_label || AGE_LABELS[v.age_group]} />
            <DetailField label="Cân nặng" value={v.weight ? `${v.weight} kg` : '—'} />
            <DetailField label="Chiều cao" value={v.height ? `${v.height} cm` : '—'} />
            <DetailField label="Ngày bắt đầu" value={v.start_date} />
            <DetailField label="Trạng thái" value={STATUS_MAP[v.status]?.label || v.status}
                badge badgeType={STATUS_MAP[v.status]?.type} />
            {(v.parent_name || v.parent_phone) && <>
                <div className="col-span-2 border-t border-(--vct-border-subtle) pt-3 mt-1">
                    <div className="text-xs font-bold uppercase opacity-50 mb-2">Phụ huynh / Giám hộ</div>
                </div>
                <DetailField label="Họ tên phụ huynh" value={v.parent_name} />
                <DetailField label="SĐT phụ huynh" value={v.parent_phone} />
            </>}
            {v.notes && <DetailField label="Ghi chú" value={v.notes} span />}
        </div>
    )

    const renderBeltTimeline = () => {
        if (beltHistoryLoading) return <div className="text-center py-8 opacity-50">Đang tải lịch sử đai...</div>
        if (beltHistory.length === 0) return <VCT_EmptyState title="Chưa có lịch sử thi đai" description="Lịch sử thăng cấp sẽ hiển thị tại đây" icon="🥋" />
        const sorted = [...beltHistory].sort((a, b) => a.exam_date.localeCompare(b.exam_date))
        return (
            <div className="relative pl-6">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-(--vct-border-subtle)" />
                {sorted.map((h) => {
                    const toColor = BELT_COLORS[h.to_belt] || '#6b7280'
                    return (
                        <div key={h.id} className="relative mb-6 last:mb-0">
                            <div className="absolute -left-6 top-1 w-4 h-4 rounded-full border-2 border-(--vct-bg-card)"
                                style={{ background: toColor }} />
                            <div className="ml-2 p-3 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-card) hover:border-(--vct-accent) transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                                            style={{ background: `${toColor}18`, color: toColor, border: `1px solid ${toColor}30` }}>
                                            <span className="w-2 h-2 rounded-full" style={{ background: toColor }} />
                                            {h.from_label} → {h.to_label}
                                        </span>
                                        <VCT_Badge text={h.result === 'pass' ? 'Đạt' : 'Không đạt'}
                                            type={h.result === 'pass' ? 'success' : 'error'} />
                                    </div>
                                    <span className="text-xs opacity-50">{h.exam_date}</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs opacity-70 mt-1">
                                    {h.score > 0 && <span>📊 Điểm: <strong>{h.score}</strong></span>}
                                    {h.examiner_name && <span>👤 GK: {h.examiner_name}</span>}
                                    {h.exam_location && <span>📍 {h.exam_location}</span>}
                                    {h.cert_id && <span>📜 CN: {h.cert_id}</span>}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        )
    }

    // ── Loading Skeleton ─────────────────────────────────────
    const renderSkeleton = () => (
        <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-(--vct-border-subtle) animate-pulse">
                    <div className="w-9 h-9 rounded-full bg-(--vct-bg-elevated)" />
                    <div className="flex-1 space-y-2">
                        <div className="h-3 w-36 bg-(--vct-bg-elevated) rounded" />
                        <div className="h-2.5 w-24 bg-(--vct-bg-elevated) rounded" />
                    </div>
                    <div className="h-3 w-28 bg-(--vct-bg-elevated) rounded" />
                    <div className="h-6 w-16 bg-(--vct-bg-elevated) rounded-full" />
                    <div className="h-3 w-20 bg-(--vct-bg-elevated) rounded" />
                    <div className="h-6 w-14 bg-(--vct-bg-elevated) rounded-full" />
                </div>
            ))}
        </div>
    )

    // ── Render ────────────────────────────────────────────────
    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">🥋 Quản Lý Võ Sinh</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Danh sách học viên, võ sinh tập luyện tại các CLB/Võ đường</p>
            </div>

            {/* ── KPI Stats ────────────────────────────── */}
            <VCT_StatRow items={[
                { label: 'Tổng võ sinh', value: stats?.total ?? voSinh.length, icon: <VCT_Icons.Users size={18} />, color: '#8b5cf6' },
                { label: 'Nam', value: stats?.by_gender?.nam ?? 0, icon: <VCT_Icons.User size={18} />, color: '#3b82f6' },
                { label: 'Nữ', value: stats?.by_gender?.nu ?? 0, icon: <VCT_Icons.User size={18} />, color: '#ec4899' },
                { label: 'Đang tập', value: stats?.active_count ?? 0, icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'Chờ duyệt', value: stats?.pending_count ?? 0, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            {/* ── Belt Distribution ────────────────────── */}
            {stats && Object.keys(stats.by_belt || {}).length > 0 && (
                <div className="mb-6 p-4 rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <div className="text-xs font-bold uppercase opacity-50 mb-3">📊 Phân bổ đẳng cấp</div>
                    <div className="flex gap-2 flex-wrap">
                        {Object.entries(stats.by_belt).map(([belt, count]) => {
                            const label = voSinh.find(v => v.belt_rank === belt)?.belt_label || belt
                            const color = BELT_COLORS[belt] || '#6b7280'
                            return (
                                <div key={belt} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-transform hover:scale-105"
                                    style={{ background: `${color}18`, color, border: `1px solid ${color}30` }}
                                    onClick={() => setBeltFilter(beltFilter === belt ? null : belt)}>
                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                                    {label}: {count}
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ── Age Group + Club Distribution ─────────── */}
            {stats && (Object.keys(stats.by_age_group || {}).length > 0 || Object.keys(stats.by_club || {}).length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {Object.keys(stats.by_age_group || {}).length > 0 && (
                        <div className="p-4 rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                            <div className="text-xs font-bold uppercase opacity-50 mb-3">👥 Lứa tuổi</div>
                            <div className="space-y-2">
                                {Object.entries(stats.by_age_group).map(([group, count]) => {
                                    const total = stats.total || 1
                                    const pct = Math.round((count / total) * 100)
                                    return (
                                        <div key={group} className="cursor-pointer hover:opacity-80" onClick={() => setAgeFilter(ageFilter === group ? null : group)}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span>{AGE_LABELS[group] || group}</span>
                                                <span className="font-bold">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-(--vct-bg-elevated) overflow-hidden">
                                                <div className="h-full rounded-full bg-(--vct-accent) transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                    {Object.keys(stats.by_club || {}).length > 0 && (
                        <div className="p-4 rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                            <div className="text-xs font-bold uppercase opacity-50 mb-3">🏢 CLB / Võ đường</div>
                            <div className="space-y-2">
                                {Object.entries(stats.by_club).sort((a, b) => b[1] - a[1]).map(([club, count]) => {
                                    const total = stats.total || 1
                                    const pct = Math.round((count / total) * 100)
                                    return (
                                        <div key={club}>
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="truncate max-w-[70%]">{club}</span>
                                                <span className="font-bold">{count} ({pct}%)</span>
                                            </div>
                                            <div className="h-2 rounded-full bg-(--vct-bg-elevated) overflow-hidden">
                                                <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <VCT_FilterChips filters={activeFilters} onRemove={clearFilter} onClearAll={clearAll} />

            {/* ── Filters & Actions ─────────────────────── */}
            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={10} align="center" className="flex-1 min-w-[300px] flex-wrap">
                    <div className="w-full max-w-[260px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm võ sinh, CLB, HLV, SĐT..." /></div>
                    <select value={genderFilter || ''} onChange={e => setGenderFilter(e.target.value || null)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Giới tính</option><option value="nam">Nam</option><option value="nu">Nữ</option>
                    </select>
                    <select value={beltFilter || ''} onChange={e => setBeltFilter(e.target.value || null)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Tất cả đai</option>
                        {uniqueBelts.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                    </select>
                    <select value={ageFilter || ''} onChange={e => setAgeFilter(e.target.value || null)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Nhóm tuổi</option>
                        <option value="thieu_nhi">Thiếu nhi</option><option value="thieu_nien">Thiếu niên</option>
                        <option value="thanh_nien">Thanh niên</option><option value="trung_nien">Trung niên</option>
                    </select>
                    <select value={statusFilter || ''} onChange={e => setStatusFilter(e.target.value || null)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Trạng thái</option>
                        <option value="active">Đang tập</option><option value="pending">Chờ duyệt</option><option value="inactive">Ngưng</option>
                    </select>
                </VCT_Stack>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button variant="ghost" size="sm" onClick={() => exportCSV(filtered)}>
                        <VCT_Icons.Download size={14} /> Export CSV
                    </VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />}
                        onClick={() => { setForm(emptyForm()); setSelectedVS(null); setModalMode('create') }}>
                        Thêm Võ Sinh
                    </VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {/* ── Data Table ───────────────────────────── */}
            {loading ? renderSkeleton() : filtered.length === 0 ? (
                <VCT_EmptyState title="Không có võ sinh nào" description="Thử thay đổi bộ lọc hoặc thêm võ sinh mới." icon="🥋" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                    <table className="w-full border-collapse">
                        <thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50 cursor-pointer select-none" onClick={() => toggleSort('full_name')}>
                                Võ sinh <SortIcon k="full_name" />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50 cursor-pointer select-none" onClick={() => toggleSort('club_name')}>
                                CLB / Võ đường <SortIcon k="club_name" />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50 cursor-pointer select-none" onClick={() => toggleSort('belt_rank')}>
                                Đai / Đẳng <SortIcon k="belt_rank" />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">Nhóm tuổi</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">Thể chất</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">HLV / Phụ huynh</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">Trạng thái</th>
                            <th className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50 w-[80px]"></th>
                        </tr></thead>
                        <tbody>
                            {filtered.map(v => {
                                const st = STATUS_MAP[v.status] || { label: v.status, type: 'neutral' }
                                const beltColor = BELT_COLORS[v.belt_rank] || '#64748b'
                                return (
                                    <tr key={v.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors cursor-pointer"
                                        onClick={() => openDetail(v)}>
                                        <td className="px-4 py-3">
                                            <VCT_Stack direction="row" gap={10} align="center">
                                                <VCT_AvatarLetter name={v.full_name} size={36} />
                                                <div>
                                                    <div className="font-semibold text-sm">{v.full_name}</div>
                                                    <div className="text-xs opacity-50">
                                                        {GENDER_MAP[v.gender] || v.gender} • {v.date_of_birth}
                                                        {v.start_date && ` • Từ ${v.start_date}`}
                                                    </div>
                                                </div>
                                            </VCT_Stack>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{v.club_name}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                                                style={{ background: `${beltColor}18`, color: beltColor, border: `1px solid ${beltColor}30` }}>
                                                <span className="w-2 h-2 rounded-full" style={{ background: beltColor }} />
                                                {v.belt_label || v.belt_rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">{v.age_group_label || AGE_LABELS[v.age_group] || '—'}</td>
                                        <td className="px-4 py-3 text-sm text-center">
                                            {v.weight ? `${v.weight}kg` : '—'}{v.height ? ` · ${v.height}cm` : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            {v.coach_name && <div className="text-xs">🥋 {v.coach_name}</div>}
                                            {v.parent_name && <div className="text-xs opacity-60">👤 {v.parent_name}</div>}
                                            {!v.coach_name && !v.parent_name && '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center"><VCT_Badge text={st.label} type={st.type} /></td>
                                        <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                                            <div className="relative">
                                                <button className="p-1.5 rounded-lg hover:bg-(--vct-bg-elevated) transition-colors text-(--vct-text-secondary)"
                                                    onClick={() => setActionMenu(actionMenu === v.id ? null : v.id)}>
                                                    ⋯
                                                </button>
                                                {actionMenu === v.id && (
                                                    <div className="absolute right-0 top-8 z-50 w-48 bg-(--vct-bg-card) border border-(--vct-border-subtle) rounded-xl shadow-xl py-1.5">
                                                        <button className="w-full text-left px-4 py-2 text-sm hover:bg-(--vct-bg-hover) transition-colors"
                                                            onClick={() => { openDetail(v); setActionMenu(null) }}>👁️ Xem chi tiết</button>
                                                        <button className="w-full text-left px-4 py-2 text-sm hover:bg-(--vct-bg-hover) transition-colors"
                                                            onClick={() => openEdit(v)}>✏️ Sửa thông tin</button>
                                                        {v.status === 'pending' && (
                                                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-(--vct-bg-hover) transition-colors text-green-500"
                                                                onClick={() => { handleApprove(v.id); setActionMenu(null) }}>✅ Duyệt</button>
                                                        )}
                                                        {v.status === 'active' && (
                                                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-(--vct-bg-hover) transition-colors text-orange-500"
                                                                onClick={() => { setConfirmAction({ type: 'deactivate', id: v.id, name: v.full_name }); setActionMenu(null); setModalMode('confirm') }}>⏸️ Ngưng hoạt động</button>
                                                        )}
                                                        {v.status === 'inactive' && (
                                                            <button className="w-full text-left px-4 py-2 text-sm hover:bg-(--vct-bg-hover) transition-colors text-blue-500"
                                                                onClick={() => { handleReactivate(v.id); setActionMenu(null) }}>▶️ Kích hoạt lại</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="mt-4 text-xs text-(--vct-text-secondary) opacity-60 text-right">
                Hiển thị {filtered.length} / {voSinh.length} võ sinh
            </div>

            {/* ── Create Modal ─────────────────────────── */}
            {modalMode === 'create' && (
                <ModalOverlay title="Thêm Võ Sinh Mới" onClose={() => { setModalMode(null); setForm(emptyForm()) }}>
                    {renderForm(handleSaveCreate)}
                </ModalOverlay>
            )}

            {/* ── Edit Modal ──────────────────────────── */}
            {modalMode === 'edit' && selectedVS && (
                <ModalOverlay title={`Sửa: ${selectedVS.full_name}`} onClose={() => setModalMode('detail')}>
                    {renderForm(handleSaveEdit)}
                </ModalOverlay>
            )}

            {/* ── Detail Modal ────────────────────────── */}
            {modalMode === 'detail' && selectedVS && (
                <ModalOverlay title={selectedVS.full_name} onClose={() => setModalMode(null)} wide>
                    <div className="flex gap-1 mb-5 p-1 rounded-xl bg-(--vct-bg-elevated)">
                        {([['info', '📋 Thông tin'], ['belt', '🥋 Lịch sử đai'], ['activity', '📅 Hoạt động']] as [DetailTab, string][]).map(([k, label]) => (
                            <button key={k} onClick={() => setDetailTab(k)}
                                className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${detailTab === k ? 'bg-(--vct-bg-card) text-(--vct-text-primary) shadow-sm' : 'text-(--vct-text-secondary) hover:text-(--vct-text-primary)'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                    {detailTab === 'info' && renderDetailInfo(selectedVS)}
                    {detailTab === 'belt' && renderBeltTimeline()}
                    {detailTab === 'activity' && (
                        <VCT_EmptyState title="Sắp ra mắt" description="Lịch sử tập luyện, điểm danh sẽ hiển thị tại đây trong phiên bản tiếp theo" icon="📅" />
                    )}
                    <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-(--vct-border-subtle)">
                        <VCT_Button variant="ghost" onClick={() => openEdit(selectedVS)}>✏️ Sửa</VCT_Button>
                        {selectedVS.status === 'pending' && (
                            <VCT_Button onClick={() => { handleApprove(selectedVS.id); setModalMode(null) }}>✅ Duyệt</VCT_Button>
                        )}
                        {selectedVS.status === 'inactive' && (
                            <VCT_Button onClick={() => { handleReactivate(selectedVS.id); setModalMode(null) }}>▶️ Kích hoạt lại</VCT_Button>
                        )}
                    </div>
                </ModalOverlay>
            )}

            {/* ── Confirm Dialog ───────────────────────── */}
            {modalMode === 'confirm' && confirmAction && (
                <ModalOverlay title="Xác nhận thao tác" onClose={() => { setModalMode(null); setConfirmAction(null) }}>
                    <div className="text-center py-4">
                        <div className="text-4xl mb-3">⚠️</div>
                        <p className="text-sm text-(--vct-text-primary) mb-1">
                            {confirmAction.type === 'deactivate' && `Bạn có chắc muốn ngưng hoạt động võ sinh`}
                        </p>
                        <p className="text-base font-bold text-(--vct-text-primary) mb-4">{confirmAction.name}?</p>
                        <p className="text-xs text-(--vct-text-secondary) mb-6">Thao tác này có thể hoàn tác bằng nút "Kích hoạt lại".</p>
                        <div className="flex justify-center gap-3">
                            <VCT_Button variant="ghost" onClick={() => { setModalMode(null); setConfirmAction(null) }}>Hủy</VCT_Button>
                            <VCT_Button onClick={() => {
                                if (confirmAction.type === 'deactivate') handleDeactivate(confirmAction.id)
                                setModalMode(null)
                            }}>Xác nhận</VCT_Button>
                        </div>
                    </div>
                </ModalOverlay>
            )}

            {actionMenu && <div className="fixed inset-0 z-40" onClick={() => setActionMenu(null)} />}
        </VCT_PageContainer>
    )
}

// ── Sub-components ───────────────────────────────────────────

const DetailField = ({ label, value, span, badge, beltColor, badgeType }: {
    label: string; value?: string | number; span?: boolean; badge?: boolean; beltColor?: string; badgeType?: string
}) => (
    <div className={span ? 'col-span-2' : ''}>
        <div className="text-xs font-semibold opacity-50 mb-0.5">{label}</div>
        {badge && beltColor ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
                style={{ background: `${beltColor}18`, color: beltColor, border: `1px solid ${beltColor}30` }}>
                <span className="w-2 h-2 rounded-full" style={{ background: beltColor }} />
                {value || '—'}
            </span>
        ) : badge && badgeType ? (
            <VCT_Badge text={String(value || '—')} type={badgeType as 'info' | 'success' | 'warning' | 'danger'} />
        ) : (
            <div className="text-sm text-(--vct-text-primary)">{value || '—'}</div>
        )}
    </div>
)

const ModalOverlay = ({ title, onClose, children, wide }: {
    title: string; onClose: () => void; children: React.ReactNode; wide?: boolean
}) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div className={`relative bg-(--vct-bg-card) border border-(--vct-border-subtle) rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto ${wide ? 'w-full max-w-[700px]' : 'w-full max-w-[560px]'}`}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-(--vct-text-primary)">{title}</h2>
                <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-(--vct-bg-elevated) text-(--vct-text-secondary) transition-colors">✕</button>
            </div>
            {children}
        </div>
    </div>
)
