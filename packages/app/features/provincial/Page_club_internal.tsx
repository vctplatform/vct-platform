'use client'

import * as React from 'react'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast, VCT_SearchInput, VCT_EmptyState } from '@vct/ui'
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

const API = '/api/v1/club'

interface ClubDashboard { club_id: string; club_name: string; club_type: string; total_members: number; active_members: number; pending_members: number; total_classes: number; active_classes: number; total_income: number; total_expense: number; balance: number }
interface ClubMember { id: string; full_name: string; gender: string; date_of_birth: string; belt_rank: string; class_name: string; member_type: string; status: string; join_date: string; phone: string; email: string; guardian_name: string; guardian_phone: string }
interface ClubClass { id: string; name: string; level: string; coach_name: string; max_students: number; current_count: number; monthly_fee: number; status: string }
interface FinEntry { id: string; type: string; category: string; amount: number; description: string; member_name: string; date: string; receipt_no: string }

const STATUS_MAP: Record<string, { label: string; type: any }> = { active: { label: 'Hoạt động', type: 'success' }, pending: { label: 'Chờ duyệt', type: 'warning' }, inactive: { label: 'Nghỉ', type: 'neutral' }, paused: { label: 'Tạm dừng', type: 'warning' }, closed: { label: 'Đã đóng', type: 'danger' } }
const MEMBER_TYPE_MAP: Record<string, string> = { student: 'Học viên', coach: 'HLV', assistant: 'Trợ giảng' }
const LEVEL_MAP: Record<string, string> = { beginner: 'Cơ bản', intermediate: 'Trung cấp', advanced: 'Nâng cao', competition: 'Thi đấu' }
const CATEGORY_MAP: Record<string, string> = { hoi_phi: 'Hội phí', thue_san: 'Thuê sân', giai_dau: 'Giải đấu', thiet_bi: 'Thiết bị', khac: 'Khác' }
const fmtVND = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v)

type Tab = 'overview' | 'members' | 'classes' | 'finance'

export const Page_club_internal = () => {
    const [tab, setTab] = useState<Tab>('overview')
    const [clubID] = useState('CLB-HCM-001')
    const [dashboard, setDashboard] = useState<ClubDashboard | null>(null)
    const [members, setMembers] = useState<ClubMember[]>([])
    const [classes, setClasses] = useState<ClubClass[]>([])
    const [finances, setFinances] = useState<FinEntry[]>([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500) }, [])

    const headers = useMemo(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
        return token ? { Authorization: `Bearer ${token}` } as HeadersInit : {} as HeadersInit
    }, [])

    useEffect(() => {
        (async () => {
            try {
                const [dashRes, memRes, clsRes, finRes] = await Promise.all([
                    fetch(`${API}/dashboard?club_id=${clubID}`, { headers }),
                    fetch(`${API}/members?club_id=${clubID}`, { headers }),
                    fetch(`${API}/classes?club_id=${clubID}`, { headers }),
                    fetch(`${API}/finance?club_id=${clubID}`, { headers }),
                ])
                if (dashRes.ok) { const d = await dashRes.json(); setDashboard(d.data || d) }
                if (memRes.ok) { const d = await memRes.json(); setMembers((d.data?.members || d.members) || []) }
                if (clsRes.ok) { const d = await clsRes.json(); setClasses((d.data?.classes || d.classes) || []) }
                if (finRes.ok) { const d = await finRes.json(); setFinances((d.data?.entries || d.entries) || []) }
            } catch (e) { console.error(e) }
            finally { setLoading(false) }
        })()
    }, [clubID, headers])

    const totalIncome = useMemo(() => finances.filter(f => f.type === 'income').reduce((s, f) => s + f.amount, 0), [finances])
    const totalExpense = useMemo(() => finances.filter(f => f.type === 'expense').reduce((s, f) => s + f.amount, 0), [finances])

    const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
        { key: 'overview', label: 'Tổng quan', icon: <VCT_Icons.Dashboard size={16} /> },
        { key: 'members', label: 'Thành viên', icon: <VCT_Icons.Users size={16} /> },
        { key: 'classes', label: 'Lớp tập', icon: <VCT_Icons.LayoutGrid size={16} /> },
        { key: 'finance', label: 'Thu chi', icon: <VCT_Icons.Activity size={16} /> },
    ]

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">🏠 Quản Lý Nội Bộ CLB</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">{dashboard?.club_name || 'Câu lạc bộ Võ cổ truyền'}</p>
            </div>

            {/* Tab navigation */}
            <div className="flex gap-1 p-1 mb-6 rounded-xl bg-(--vct-bg-elevated) border border-(--vct-border-subtle) w-fit">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? 'bg-(--vct-accent) text-white shadow-sm' : 'text-(--vct-text-secondary) hover:text-(--vct-text-primary) hover:bg-(--vct-bg-hover)'}`}>
                        {t.icon}{t.label}
                    </button>
                ))}
            </div>

            {/* Overview */}
            {tab === 'overview' && (
                <>
                    <VCT_StatRow items={[
                        { label: 'Thành viên', value: dashboard?.total_members ?? 0, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-accent-cyan)' },
                        { label: 'Đang tập', value: dashboard?.active_members ?? 0, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-success)' },
                        { label: 'Chờ duyệt', value: dashboard?.pending_members ?? 0, icon: <VCT_Icons.Clock size={18} />, color: 'var(--vct-warning)' },
                        { label: 'Lớp tập', value: dashboard?.total_classes ?? 0, icon: <VCT_Icons.LayoutGrid size={18} />, color: 'var(--vct-info)' },
                    ] as StatItem[]} className="mb-4" />
                    <VCT_StatRow items={[
                        { label: 'Thu nhập', value: fmtVND(dashboard?.total_income ?? 0), icon: <VCT_Icons.TrendingUp size={18} />, color: 'var(--vct-success)' },
                        { label: 'Chi phí', value: fmtVND(dashboard?.total_expense ?? 0), icon: <VCT_Icons.TrendingDown size={18} />, color: 'var(--vct-danger)' },
                        { label: 'Số dư', value: fmtVND(dashboard?.balance ?? 0), icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-accent-cyan)' },
                    ] as StatItem[]} className="mb-6" />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5">
                            <h3 className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2"><VCT_Icons.Users size={16} /> Thành viên mới nhất</h3>
                            {members.slice(0, 5).map(m => (<div key={m.id} className="flex justify-between items-center py-2 border-b border-(--vct-border-subtle) last:border-0"><div className="text-sm font-medium">{m.full_name}<span className="text-xs opacity-50 ml-2">{MEMBER_TYPE_MAP[m.member_type] || m.member_type}</span></div><VCT_Badge text={(STATUS_MAP[m.status] || { label: m.status }).label} type={(STATUS_MAP[m.status] || { type: 'neutral' }).type} /></div>))}
                        </div>
                        <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5">
                            <h3 className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2"><VCT_Icons.LayoutGrid size={16} /> Lớp tập</h3>
                            {classes.slice(0, 5).map(c => (<div key={c.id} className="flex justify-between items-center py-2 border-b border-(--vct-border-subtle) last:border-0"><div className="text-sm font-medium">{c.name}<span className="text-xs opacity-50 ml-2">{LEVEL_MAP[c.level] || c.level} • {c.current_count}/{c.max_students}</span></div><VCT_Badge text={fmtVND(c.monthly_fee)} type="info" /></div>))}
                        </div>
                    </div>
                </>
            )}

            {/* Members */}
            {tab === 'members' && (
                <>
                    <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                        <div className="w-full max-w-[300px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm thành viên..." /></div>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng thêm thành viên đang phát triển', 'info')}>Thêm thành viên</VCT_Button>
                    </VCT_Stack>
                    {members.length === 0 ? <VCT_EmptyState title="Chưa có thành viên" description={loading ? 'Đang tải...' : 'Thêm thành viên đầu tiên.'} icon="👥" /> : (
                        <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                            <table className="w-full border-collapse"><thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {['Họ tên', 'Loại', 'Đẳng cấp', 'Lớp', 'SĐT', 'Trạng thái'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                            </tr></thead><tbody>
                                    {members.filter(m => !search || m.full_name.toLowerCase().includes(search.toLowerCase())).map(m => {
                                        const st = STATUS_MAP[m.status] || { label: m.status, type: 'neutral' }
                                        return (<tr key={m.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                            <td className="px-4 py-3"><div className="font-semibold text-sm">{m.full_name}</div><div className="text-xs opacity-50">{m.date_of_birth}{m.guardian_name ? ` • PH: ${m.guardian_name}` : ''}</div></td>
                                            <td className="px-4 py-3 text-sm">{MEMBER_TYPE_MAP[m.member_type] || m.member_type}</td>
                                            <td className="px-4 py-3"><VCT_Badge text={m.belt_rank || '—'} type="info" /></td>
                                            <td className="px-4 py-3 text-sm">{m.class_name || '—'}</td>
                                            <td className="px-4 py-3 text-sm">{m.phone || m.guardian_phone || '—'}</td>
                                            <td className="px-4 py-3 text-center"><VCT_Badge text={st.label} type={st.type} /></td>
                                        </tr>)
                                    })}
                                </tbody></table>
                        </div>
                    )}
                </>
            )}

            {/* Classes */}
            {tab === 'classes' && (
                <>
                    <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                        <div className="w-full max-w-[300px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm lớp tập..." /></div>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng thêm lớp tập đang phát triển', 'info')}>Thêm lớp</VCT_Button>
                    </VCT_Stack>
                    {classes.length === 0 ? <VCT_EmptyState title="Chưa có lớp tập" description="Thêm lớp tập đầu tiên." icon="📋" /> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classes.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase())).map(c => {
                                const st = STATUS_MAP[c.status] || { label: c.status, type: 'neutral' }
                                const pct = c.max_students > 0 ? Math.round((c.current_count / c.max_students) * 100) : 0
                                return (
                                    <div key={c.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-5 hover:shadow-lg transition-shadow">
                                        <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-sm">{c.name}</h3><VCT_Badge text={st.label} type={st.type} /></div>
                                        <div className="text-xs text-(--vct-text-secondary) space-y-1 mb-3">
                                            <div>📊 Cấp độ: <span className="font-medium text-(--vct-text-primary)">{LEVEL_MAP[c.level] || c.level}</span></div>
                                            <div>👤 HLV: <span className="font-medium text-(--vct-text-primary)">{c.coach_name || '—'}</span></div>
                                            <div>💰 Học phí: <span className="font-medium text-(--vct-text-primary)">{fmtVND(c.monthly_fee)}/tháng</span></div>
                                        </div>
                                        <div className="text-xs text-(--vct-text-secondary) mb-1">Sĩ số: {c.current_count}/{c.max_students} ({pct}%)</div>
                                        <div className="w-full h-2 rounded-full bg-(--vct-bg-elevated) overflow-hidden"><div className="h-full rounded-full bg-(--vct-accent) transition-all" style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Finance */}
            {tab === 'finance' && (
                <>
                    <VCT_StatRow items={[
                        { label: 'Tổng thu', value: fmtVND(totalIncome), icon: <VCT_Icons.TrendingUp size={18} />, color: 'var(--vct-success)' },
                        { label: 'Tổng chi', value: fmtVND(totalExpense), icon: <VCT_Icons.TrendingDown size={18} />, color: 'var(--vct-danger)' },
                        { label: 'Số dư', value: fmtVND(totalIncome - totalExpense), icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-accent-cyan)' },
                    ] as StatItem[]} className="mb-5" />
                    <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5">
                        <div className="w-full max-w-[300px]"><VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm giao dịch..." /></div>
                        <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => showToast('Chức năng ghi thu/chi đang phát triển', 'info')}>Ghi thu/chi</VCT_Button>
                    </VCT_Stack>
                    {finances.length === 0 ? <VCT_EmptyState title="Chưa có giao dịch" description="Thêm bản ghi tài chính đầu tiên." icon="💰" /> : (
                        <div className="overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass)">
                            <table className="w-full border-collapse"><thead><tr className="border-b border-(--vct-border-strong) bg-(--vct-bg-card)">
                                {['Ngày', 'Loại', 'Danh mục', 'Mô tả', 'Thành viên', 'Số tiền'].map(h => <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase opacity-50">{h}</th>)}
                            </tr></thead><tbody>
                                    {finances.filter(f => !search || f.description.toLowerCase().includes(search.toLowerCase())).map(f => (
                                        <tr key={f.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-hover) transition-colors">
                                            <td className="px-4 py-3 text-sm">{f.date}</td>
                                            <td className="px-4 py-3"><VCT_Badge text={f.type === 'income' ? 'Thu' : 'Chi'} type={f.type === 'income' ? 'success' : 'danger'} /></td>
                                            <td className="px-4 py-3 text-sm">{CATEGORY_MAP[f.category] || f.category}</td>
                                            <td className="px-4 py-3 text-sm">{f.description}</td>
                                            <td className="px-4 py-3 text-sm">{f.member_name || '—'}</td>
                                            <td className="px-4 py-3 text-sm font-bold" style={{ color: f.type === 'income' ? 'var(--vct-success)' : 'var(--vct-danger)' }}>{f.type === 'income' ? '+' : '-'}{fmtVND(f.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody></table>
                        </div>
                    )}
                </>
            )}
        </VCT_PageContainer>
    )
}
