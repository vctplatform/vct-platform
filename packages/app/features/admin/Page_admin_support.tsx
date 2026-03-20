'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_AvatarLetter, VCT_EmptyState, VCT_Tabs,
} from '../components/vct-ui'
import { VCT_Textarea } from '../components/VCT_Textarea'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { AdminSkeletonRow } from './components/AdminSkeletonRow'
import { AdminPaginationBar } from './components/AdminPaginationBar'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { useDebounce } from '../hooks/useDebounce'
import { exportToCSV } from './utils/adminExport'
import { usePagination } from '../hooks/usePagination'
import { useI18n } from '../i18n'
import { AdminGuard } from './components/AdminGuard'

import type { SupportTicket, FAQ, SupportCategory } from './components/support/support.data'
import {
    STATUS_BADGE, PRIORITY_BADGE, PRIORITY_ORDER, TYPE_BADGE,
    MOCK_TICKETS, MOCK_REPLIES, MOCK_FAQS, MOCK_CATEGORIES, MOCK_NOTES, MOCK_ACTIVITIES,
} from './components/support/support.data'
import { SupportTicketDrawer } from './components/support/SupportTicketDrawer'
import { SupportAnalyticsTab } from './components/support/SupportAnalyticsTab'

// ════════════════════════════════════════
// FAQ FORM SUB-COMPONENT
// ════════════════════════════════════════
const FaqForm = ({ initial, onSave, onCancel }: { initial: FAQ | null, onSave: (data: Pick<FAQ, 'cauHoi' | 'traLoi' | 'danhMuc'>) => void, onCancel: () => void }) => {
    const [cauHoi, setCauHoi] = useState(initial?.cauHoi ?? '')
    const [traLoi, setTraLoi] = useState(initial?.traLoi ?? '')
    const [danhMuc, setDanhMuc] = useState(initial?.danhMuc ?? 'Chung')
    return (
        <VCT_Stack gap={16}>
            <VCT_Field label="Câu hỏi"><VCT_Input value={cauHoi} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCauHoi(e.target.value)} placeholder="Nhập câu hỏi..." /></VCT_Field>
            <VCT_Field label="Câu trả lời"><VCT_Textarea value={traLoi} onChange={setTraLoi} placeholder="Nhập câu trả lời..." rows={4} /></VCT_Field>
            <VCT_Field label="Danh mục">
                <VCT_Select value={danhMuc} onChange={setDanhMuc} options={[
                    { value: 'Tài khoản', label: 'Tài khoản' }, { value: 'Giải đấu', label: 'Giải đấu' },
                    { value: 'Thanh toán', label: 'Thanh toán' }, { value: 'Kỹ thuật', label: 'Kỹ thuật' },
                    { value: 'Chung', label: 'Chung' },
                ]} />
            </VCT_Field>
            <VCT_Stack direction="row" gap={8} justify="end" className="pt-2 border-t border-(--vct-border-subtle)">
                <VCT_Button variant="ghost" onClick={onCancel}>Hủy</VCT_Button>
                <VCT_Button variant="primary" onClick={() => onSave({ cauHoi, traLoi, danhMuc })} icon={<VCT_Icons.CheckCircle size={14} />}>{initial ? 'Cập nhật' : 'Thêm'}</VCT_Button>
            </VCT_Stack>
        </VCT_Stack>
    )
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_support = () => (
    <AdminGuard>
        <Page_admin_support_Content />
    </AdminGuard>
)

const Page_admin_support_Content = () => {
    const { data: fetchedTickets, isLoading } = useAdminFetch<SupportTicket[]>('/admin/support/tickets', { mockData: MOCK_TICKETS })
    const { t } = useI18n()
    const [tickets, setTickets] = useState<SupportTicket[]>([])
    const [replies, setReplies] = useState(MOCK_REPLIES)
    const [faqs, setFaqs] = useState(MOCK_FAQS)
    const [categories, setCategories] = useState(MOCK_CATEGORIES)
    const [tab, setTab] = useState('tickets')
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterPriority, setFilterPriority] = useState('all')
    const [selected, setSelected] = useState<SupportTicket | null>(null)
    const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)
    const [showResolveConfirm, setShowResolveConfirm] = useState<string | null>(null)
    const [showFaqModal, setShowFaqModal] = useState(false)
    const [editingFaq, setEditingFaq] = useState<FAQ | null>(null)
    const [faqSearch, setFaqSearch] = useState('')
    const [viewMode, setViewMode] = useState<'table' | 'board'>('table')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [notes, setNotes] = useState(MOCK_NOTES)
    const [sortBy, setSortBy] = useState<'createdAt' | 'mucUuTien' | 'trangThai'>('createdAt')
    const [sortAsc, setSortAsc] = useState(false)
    const [showCatModal, setShowCatModal] = useState(false)
    const [editingCat, setEditingCat] = useState<SupportCategory | null>(null)
    const { showToast } = useShellToast()
    // CreateTicket form state
    const [newTitle, setNewTitle] = useState('')
    const [newContent, setNewContent] = useState('')
    const [newType, setNewType] = useState<SupportTicket['loai']>('general')
    const [newPriority, setNewPriority] = useState<SupportTicket['mucUuTien']>('medium')
    const nextTicketId = useMemo(() => `TK-${String(tickets.length + 1).padStart(3, '0')}`, [tickets.length])

    useEffect(() => { if (fetchedTickets) setTickets(fetchedTickets) }, [fetchedTickets])

    // ── FILTERED + SORTED TICKETS ──
    const filteredTickets = useMemo(() => {
        const filtered = tickets.filter(t => {
            const matchSearch = t.tieuDe.toLowerCase().includes(debouncedSearch.toLowerCase())
                || t.maTicket.toLowerCase().includes(debouncedSearch.toLowerCase())
                || t.nguoiTaoTen.toLowerCase().includes(debouncedSearch.toLowerCase())
            const matchStatus = filterStatus === 'all' || t.trangThai === filterStatus
            const matchPriority = filterPriority === 'all' || t.mucUuTien === filterPriority
            return matchSearch && matchStatus && matchPriority
        })
        return [...filtered].sort((a, b) => {
            let cmp = 0
            if (sortBy === 'mucUuTien') cmp = (PRIORITY_ORDER[a.mucUuTien] ?? 9) - (PRIORITY_ORDER[b.mucUuTien] ?? 9)
            else if (sortBy === 'trangThai') cmp = a.trangThai.localeCompare(b.trangThai)
            else cmp = a.createdAt.localeCompare(b.createdAt)
            return sortAsc ? cmp : -cmp
        })
    }, [tickets, debouncedSearch, filterStatus, filterPriority, sortBy, sortAsc])

    const pagination = usePagination(filteredTickets, { pageSize: 10 })



    // ── SLA STATS ──
    const countByStatus = (s: string) => tickets.filter(t => t.trangThai === s).length
    const resolvedCount = countByStatus('resolved') + countByStatus('closed')
    const resolutionRate = tickets.length > 0 ? Math.round((resolvedCount / tickets.length) * 100) : 0
    const avgResponseHours = 2.4 // mock
    const slaViolations = tickets.filter(t => t.mucUuTien === 'critical' && t.trangThai === 'open').length

    const stats: StatItem[] = [
        { icon: <VCT_Icons.FileText size={20} />, label: 'Tổng tickets', value: tickets.length, color: '#0ea5e9' },
        { icon: <VCT_Icons.AlertTriangle size={20} />, label: 'Đang mở', value: countByStatus('open'), color: '#f59e0b' },
        { icon: <VCT_Icons.Clock size={20} />, label: 'Phản hồi TB', value: `${avgResponseHours}h`, color: '#8b5cf6' },
        { icon: <VCT_Icons.Activity size={20} />, label: 'Tỉ lệ giải quyết', value: `${resolutionRate}%`, color: '#10b981' },
        { icon: <VCT_Icons.AlertTriangle size={20} />, label: 'Vi phạm SLA', value: slaViolations, color: slaViolations > 0 ? '#ef4444' : '#10b981' },
    ]

    // ── MUTATIONS ──
    const { mutate: mutateTicketStatus } = useAdminMutation<SupportTicket, { id: string; status: string }>(
        '/admin/support/tickets',
        { method: 'PATCH', onError: () => showToast('Lỗi API, đã cập nhật cục bộ', 'warning') }
    )
    const { mutate: mutateCreateTicket } = useAdminMutation<SupportTicket, Partial<SupportTicket>>(
        '/admin/support/tickets',
        { method: 'POST', onError: () => showToast('Lỗi API, đã tạo cục bộ', 'warning') }
    )

    // ── ACTIONS ──
    const handleAssign = async (id: string) => {
        await mutateTicketStatus({ id, status: 'in_progress' })
        setTickets(prev => prev.map(t => t.id === id ? { ...t, trangThai: 'in_progress' as const, nguoiXuLyTen: 'Admin VCT', updatedAt: new Date().toISOString() } : t))
        showToast('Đã nhận xử lý ticket')
    }

    const handleResolve = async (id: string) => {
        await mutateTicketStatus({ id, status: 'resolved' })
        setTickets(prev => prev.map(t => t.id === id ? { ...t, trangThai: 'resolved' as const, updatedAt: new Date().toISOString() } : t))
        setShowResolveConfirm(null)
        showToast('Đã đánh dấu giải quyết')
    }

    const handleClose = async (id: string) => {
        await mutateTicketStatus({ id, status: 'closed' })
        setTickets(prev => prev.map(t => t.id === id ? { ...t, trangThai: 'closed' as const, updatedAt: new Date().toISOString() } : t))
        showToast('Đã đóng ticket', 'info')
    }

    const handleReopen = async (id: string) => {
        await mutateTicketStatus({ id, status: 'open' })
        setTickets(prev => prev.map(t => t.id === id ? { ...t, trangThai: 'open' as const, updatedAt: new Date().toISOString() } : t))
        showToast('Đã mở lại ticket')
    }

    const handleCreateTicket = async () => {
        if (!newTitle || !newContent) {
            showToast('Vui lòng nhập tiêu đề và nội dung', 'error')
            return
        }
        const now = new Date().toISOString()
        const newTicket: SupportTicket = {
            id: nextTicketId,
            maTicket: nextTicketId,
            tieuDe: newTitle,
            noiDung: newContent,
            loai: newType,
            mucUuTien: newPriority,
            trangThai: 'open',
            danhMuc: TYPE_BADGE[newType]?.label || 'Chung',
            nguoiTaoTen: 'Admin VCT',
            nguoiTaoEmail: 'admin@vct.vn',
            soTraLui: 0,
            createdAt: now,
            updatedAt: now,
        }
        await mutateCreateTicket(newTicket)
        setTickets(prev => [...prev, newTicket])
        setNewTitle('')
        setNewContent('')
        setNewType('general')
        setNewPriority('medium')
        setShowCreateModal(false)
        showToast('Đã tạo ticket mới', 'success')
    }

    // ── BULK ACTIONS ──
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }
    const toggleAll = () => {
        if (selectedIds.size === filteredTickets.length) setSelectedIds(new Set())
        else setSelectedIds(new Set(filteredTickets.map(t => t.id)))
    }
    const bulkAssign = () => {
        setTickets(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, trangThai: 'in_progress' as const, nguoiXuLyTen: 'Admin VCT' } : t))
        showToast(`Đã nhận xử lý ${selectedIds.size} tickets`)
        setSelectedIds(new Set())
    }
    const bulkClose = () => {
        setTickets(prev => prev.map(t => selectedIds.has(t.id) ? { ...t, trangThai: 'closed' as const } : t))
        showToast(`Đã đóng ${selectedIds.size} tickets`, 'info')
        setSelectedIds(new Set())
    }

    // ── SORT HELPER ──
    const handleSort = (col: typeof sortBy) => {
        if (sortBy === col) setSortAsc(!sortAsc)
        else { setSortBy(col); setSortAsc(true) }
    }
    const sortIcon = (col: typeof sortBy) => sortBy === col ? (sortAsc ? ' ↑' : ' ↓') : ''

    const tabItems = [
        { key: 'tickets', label: `Tickets (${tickets.length})` },
        { key: 'faq', label: `FAQ (${faqs.length})` },
        { key: 'categories', label: `Danh mục (${categories.length})` },
        { key: 'analytics', label: '📊 Thống kê' },
    ]

    return (
        <AdminPageShell
            title="Chăm sóc Khách hàng & Hỗ trợ Kỹ thuật"
            subtitle="Quản lý ticket hỗ trợ, FAQ, và danh mục dịch vụ"
            icon={<VCT_Icons.Shield size={28} className="text-[#8b5cf6]" />}
            stats={stats}
        >
            <style>{`
                @keyframes vct-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.3 } }
                @keyframes vct-pulse { 0% { transform: scale(1) } 50% { transform: scale(1.15) } 100% { transform: scale(1) } }
                .vct-blink { animation: vct-blink 1.2s ease-in-out infinite }
                .vct-pulse { animation: vct-pulse 2s ease-in-out infinite }
            `}</style>

            {/* Live status bar */}
            <div className="flex items-center gap-4 mb-4 flex-wrap">
                {slaViolations > 0 && (
                    <div className="flex items-center gap-2 bg-[#ef444418] border border-[#ef444430] rounded-full px-3 py-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#ef4444] vct-blink" />
                        <span className="text-xs font-bold text-[#ef4444]">{slaViolations} vi phạm SLA</span>
                    </div>
                )}
                <div className="flex items-center gap-2 bg-[#f59e0b18] border border-[#f59e0b30] rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#f59e0b] vct-blink" />
                    <span className="text-xs font-bold text-[#f59e0b]">{countByStatus('open')} chờ phản hồi</span>
                </div>
                <div className="flex items-center gap-2 bg-[#0ea5e918] border border-[#0ea5e930] rounded-full px-3 py-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                    <span className="text-xs font-bold text-[#0ea5e9]">{resolutionRate}% giải quyết</span>
                </div>
            </div>

            {/* ── Tabs ── */}
            <VCT_Tabs tabs={tabItems} activeTab={tab} onChange={setTab} className="mb-6" />

            {/* ═══════════════════════════════════════
                TAB: TICKETS
               ═══════════════════════════════════════ */}
            {tab === 'tickets' && (
                <>
                    {/* ── Toolbar ── */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <VCT_SearchInput value={search} onChange={setSearch} placeholder="Tìm ticket, mã, người tạo..." className="flex-1 min-w-[220px]" />
                        <VCT_Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            options={[
                                { value: 'all', label: 'Tất cả trạng thái' },
                                ...Object.entries(STATUS_BADGE).map(([k, v]) => ({ value: k, label: v.label }))
                            ]}
                        />
                        <VCT_Select
                            value={filterPriority}
                            onChange={setFilterPriority}
                            options={[
                                { value: 'all', label: 'Tất cả mức ưu tiên' },
                                ...Object.entries(PRIORITY_BADGE).map(([k, v]) => ({ value: k, label: v.label }))
                            ]}
                        />
                        <VCT_Button variant="primary" onClick={() => setShowCreateModal(true)} icon={<VCT_Icons.Plus size={14} />}>Tạo ticket</VCT_Button>
                        <div className="flex items-center bg-(--vct-bg-base) border border-(--vct-border-subtle) rounded-lg overflow-hidden">
                            <button type="button" className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${viewMode === 'table' ? 'bg-(--vct-accent-cyan) text-white' : 'text-(--vct-text-tertiary) hover:text-(--vct-text-primary)'}`} onClick={() => setViewMode('table')}>☰ Table</button>
                            <button type="button" className={`px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer ${viewMode === 'board' ? 'bg-(--vct-accent-cyan) text-white' : 'text-(--vct-text-tertiary) hover:text-(--vct-text-primary)'}`} onClick={() => setViewMode('board')}>▦ Board</button>
                        </div>
                        <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                            exportToCSV({
                                headers: ['Mã', 'Tiêu đề', 'Loại', 'Ưu tiên', 'Trạng thái', 'Người tạo', 'Email', 'Ngày tạo'],
                                rows: filteredTickets.map(t => [t.maTicket, t.tieuDe, t.loai, t.mucUuTien, t.trangThai, t.nguoiTaoTen, t.nguoiTaoEmail, t.createdAt]),
                                filename: 'vct_support_tickets.csv',
                            })
                            showToast('Đã xuất danh sách tickets!')
                        }}>Xuất CSV</VCT_Button>
                    </div>

                    {/* ── Bulk Action Bar ── */}
                    {selectedIds.size > 0 && (
                        <div className="flex items-center gap-3 mb-4 p-3 bg-(--vct-accent-cyan)/10 border border-(--vct-accent-cyan)/20 rounded-xl">
                            <span className="text-sm font-bold text-(--vct-text-primary)">{selectedIds.size} đã chọn</span>
                            <VCT_Button size="sm" variant="primary" onClick={bulkAssign} icon={<VCT_Icons.User size={14} />}>Nhận xử lý</VCT_Button>
                            <VCT_Button size="sm" variant="ghost" onClick={bulkClose} icon={<VCT_Icons.Close size={14} />}>Đóng</VCT_Button>
                            <VCT_Button size="sm" variant="ghost" onClick={() => {
                                exportToCSV({
                                    headers: ['Mã', 'Tiêu đề', 'Loại', 'Ưu tiên', 'Trạng thái', 'Người tạo'],
                                    rows: filteredTickets.filter(t => selectedIds.has(t.id)).map(t => [t.maTicket, t.tieuDe, t.loai, t.mucUuTien, t.trangThai, t.nguoiTaoTen]),
                                    filename: 'vct_selected_tickets.csv',
                                })
                                showToast(`Đã xuất ${selectedIds.size} tickets`)
                            }} icon={<VCT_Icons.Download size={14} />}>Xuất</VCT_Button>
                            <VCT_Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} className="ml-auto">Bỏ chọn</VCT_Button>
                        </div>
                    )}

                    {/* ── Table View ── */}
                    {viewMode === 'table' && (
                    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden mb-6">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-(--vct-border-subtle)">
                                        <th className="w-10 p-4"><input type="checkbox" aria-label="Chọn tất cả" checked={selectedIds.size > 0 && selectedIds.size === filteredTickets.length} onChange={toggleAll} className="accent-(--vct-accent-cyan) cursor-pointer" /></th>
                                        <th className="text-left p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Mã</th>
                                        <th className="text-left p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-(--vct-text-primary)" onClick={() => handleSort('createdAt')}>Tiêu đề{sortIcon('createdAt')}</th>
                                        <th className="text-center p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Loại</th>
                                        <th className="text-center p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-(--vct-text-primary)" onClick={() => handleSort('mucUuTien')}>Ưu tiên{sortIcon('mucUuTien')}</th>
                                        <th className="text-center p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider cursor-pointer hover:text-(--vct-text-primary)" onClick={() => handleSort('trangThai')}>Trạng thái{sortIcon('trangThai')}</th>
                                        <th className="text-left p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Người tạo</th>
                                        <th className="text-center p-4 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {isLoading ? [...Array(5)].map((_, i) => <AdminSkeletonRow key={i} cols={8} />) : pagination.paginatedItems.length === 0 ? (
                                        <tr><td colSpan={8}><VCT_EmptyState icon={<VCT_Icons.FileText size={40} />} title="Không có ticket" description="Thử thay đổi bộ lọc hoặc tạo ticket mới" /></td></tr>
                                    ) : pagination.paginatedItems.map(t => (
                                        <tr key={t.id} className={`border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-base) cursor-pointer transition-colors ${selectedIds.has(t.id) ? 'bg-(--vct-accent-cyan)/5' : ''}`} onClick={() => setSelected(t)}>
                                            <td className="p-4" onClick={e => { e.stopPropagation(); toggleSelect(t.id) }}><input type="checkbox" aria-label={`Chọn ${t.maTicket}`} checked={selectedIds.has(t.id)} onChange={() => {}} className="accent-(--vct-accent-cyan) cursor-pointer" /></td>
                                            <td className="p-4 font-mono text-xs text-(--vct-accent-cyan) font-bold">{t.maTicket}</td>
                                            <td className="p-4">
                                                <div className="font-semibold text-(--vct-text-primary) line-clamp-1 max-w-[300px]">{t.tieuDe}</div>
                                                <div className="text-[11px] text-(--vct-text-tertiary) mt-0.5">{t.createdAt} · {t.soTraLui} phản hồi</div>
                                            </td>
                                            <td className="p-4 text-center"><VCT_Badge type={TYPE_BADGE[t.loai]?.type ?? 'neutral'} text={TYPE_BADGE[t.loai]?.label} /></td>
                                            <td className="p-4 text-center"><VCT_Badge type={PRIORITY_BADGE[t.mucUuTien]?.type ?? 'neutral'} text={PRIORITY_BADGE[t.mucUuTien]?.label} /></td>
                                            <td className="p-4 text-center"><VCT_Badge type={STATUS_BADGE[t.trangThai]?.type ?? 'neutral'} text={STATUS_BADGE[t.trangThai]?.label} /></td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <VCT_AvatarLetter name={t.nguoiTaoTen} size={28} />
                                                    <div>
                                                        <div className="text-xs font-semibold text-(--vct-text-primary)">{t.nguoiTaoTen}</div>
                                                        <div className="text-[10px] text-(--vct-text-tertiary)">{t.nguoiTaoEmail}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-center" onClick={e => e.stopPropagation()}>
                                                <VCT_Stack direction="row" gap={4} justify="center">
                                                    {t.trangThai === 'open' && <VCT_Button size="sm" variant="ghost" onClick={() => handleAssign(t.id)} icon={<VCT_Icons.User size={14} />}>Nhận</VCT_Button>}
                                                    {t.trangThai === 'in_progress' && <VCT_Button size="sm" variant="ghost" onClick={() => setShowResolveConfirm(t.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Xong</VCT_Button>}
                                                    {t.trangThai === 'resolved' && <VCT_Button size="sm" variant="ghost" onClick={() => handleClose(t.id)} icon={<VCT_Icons.Close size={14} />}>Đóng</VCT_Button>}
                                                </VCT_Stack>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!isLoading && pagination.totalPages > 1 && (
                            <AdminPaginationBar {...pagination} />
                        )}
                    </div>
                    )}

                    {/* ── Kanban Board View ── */}
                    {viewMode === 'board' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {(['open', 'in_progress', 'waiting_customer', 'resolved'] as const).map(status => {
                                const col = filteredTickets.filter(t => t.trangThai === status)
                                const badge = STATUS_BADGE[status]
                                return (
                                    <div key={status} className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden">
                                        <div className="p-3 border-b border-(--vct-border-subtle) flex items-center justify-between">
                                            <VCT_Badge type={badge?.type ?? 'neutral'} text={badge?.label ?? status} />
                                            <span className="text-xs font-bold text-(--vct-text-tertiary) bg-(--vct-bg-base) px-2 py-0.5 rounded-full">{col.length}</span>
                                        </div>
                                        <div className="p-2 space-y-2 min-h-[120px] max-h-[420px] overflow-y-auto">
                                            {col.length === 0 ? (
                                                <div className="text-center py-8 text-xs text-(--vct-text-tertiary)">Trống</div>
                                            ) : col.map(t => (
                                                <div key={t.id} className="p-3 bg-(--vct-bg-base) border border-(--vct-border-subtle) rounded-xl cursor-pointer hover:border-(--vct-accent-cyan)/40 transition-all hover:shadow-md" onClick={() => setSelected(t)}>
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[10px] font-mono font-bold text-(--vct-accent-cyan)">{t.maTicket}</span>
                                                        <VCT_Badge type={PRIORITY_BADGE[t.mucUuTien]?.type ?? 'neutral'} text={PRIORITY_BADGE[t.mucUuTien]?.label} />
                                                    </div>
                                                    <div className="font-semibold text-xs text-(--vct-text-primary) line-clamp-2 mb-2">{t.tieuDe}</div>
                                                    <div className="flex items-center gap-1.5">
                                                        <VCT_AvatarLetter name={t.nguoiTaoTen} size={18} />
                                                        <span className="text-[10px] text-(--vct-text-tertiary)">{t.nguoiTaoTen}</span>
                                                        {t.soTraLui > 0 && <span className="text-[10px] text-(--vct-text-tertiary) ml-auto">💬 {t.soTraLui}</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {/* ═══════════════════════════════════════
                TAB: FAQ
               ═══════════════════════════════════════ */}
            {tab === 'faq' && (
                <>
                    {/* FAQ Toolbar */}
                    <div className="flex flex-wrap items-center gap-3 mb-6">
                        <VCT_SearchInput value={faqSearch} onChange={setFaqSearch} placeholder="Tìm câu hỏi..." className="flex-1 min-w-[220px]" />
                        <VCT_Button variant="primary" onClick={() => { setEditingFaq(null); setShowFaqModal(true) }} icon={<VCT_Icons.Plus size={14} />}>Thêm FAQ</VCT_Button>
                    </div>

                    <div className="space-y-3 mb-6">
                        {faqs.filter(f => f.cauHoi.toLowerCase().includes(faqSearch.toLowerCase()) || f.danhMuc.toLowerCase().includes(faqSearch.toLowerCase())).map(faq => (
                            <div key={faq.id} className={`bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl overflow-hidden transition-all ${!faq.isActive ? 'opacity-50' : ''}`}>
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-white/5 transition-colors"
                                    onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-[#8b5cf620] flex items-center justify-center shrink-0">
                                            <VCT_Icons.Info size={16} className="text-[#8b5cf6]" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-(--vct-text-primary) line-clamp-1">{faq.cauHoi}</div>
                                            <div className="text-[11px] text-(--vct-text-tertiary) mt-0.5">{faq.danhMuc} · {faq.luotXem.toLocaleString()} lượt xem</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <VCT_Badge type={faq.isActive ? 'success' : 'neutral'} text={faq.isActive ? 'Bật' : 'Tắt'} />
                                        <VCT_Icons.ChevronDown size={16} className={`text-(--vct-text-tertiary) transition-transform ${expandedFAQ === faq.id ? 'rotate-180' : ''}`} />
                                    </div>
                                </button>
                                {expandedFAQ === faq.id && (
                                    <div className="px-5 pb-5 pt-0 border-t border-(--vct-border-subtle)">
                                        <div className="mt-4 text-sm text-(--vct-text-secondary) leading-relaxed whitespace-pre-line">{faq.traLoi}</div>
                                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                                            <VCT_Button size="sm" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setEditingFaq(faq); setShowFaqModal(true) }} icon={<VCT_Icons.Edit size={14} />}>Sửa</VCT_Button>
                                            <VCT_Button size="sm" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setFaqs(prev => prev.map(f => f.id === faq.id ? { ...f, isActive: !f.isActive } : f)); showToast(faq.isActive ? 'Đã tắt FAQ' : 'Đã bật FAQ', 'info') }} icon={<VCT_Icons.Eye size={14} />}>{faq.isActive ? 'Tắt' : 'Bật'}</VCT_Button>
                                            <VCT_Button size="sm" variant="ghost" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setFaqs(prev => prev.filter(f => f.id !== faq.id)); showToast('Đã xóa FAQ', 'info') }} icon={<VCT_Icons.Trash size={14} />}>Xóa</VCT_Button>
                                            <span className="text-[10px] text-(--vct-text-tertiary) ml-auto">ID: {faq.id}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════
                TAB: CATEGORIES
               ═══════════════════════════════════════ */}
            {tab === 'categories' && (
                <>
                    {/* Category Toolbar */}
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-sm font-bold text-(--vct-text-primary) flex-1">{categories.length} danh mục dịch vụ</span>
                        <VCT_Button variant="primary" onClick={() => { setEditingCat(null); setShowCatModal(true) }} icon={<VCT_Icons.Plus size={14} />}>Thêm danh mục</VCT_Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {categories.map(cat => {
                        const IconComponent = (VCT_Icons as Record<string, React.ComponentType<{ size?: number }>>)[cat.icon] ?? VCT_Icons.Layers
                        return (
                            <div
                                key={cat.id}
                                className="admin-nav-card"
                                style={{ '--_nav-color': cat.mauSac } as React.CSSProperties}
                            >
                                <div className="flex items-start gap-4">
                                    <div
                                        className="admin-nav-icon"
                                        style={{ '--_nav-color': cat.mauSac } as React.CSSProperties}
                                    >
                                        <IconComponent size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold text-(--vct-text-primary) text-sm">{cat.ten}</div>
                                        <div className="text-xs text-(--vct-text-secondary) mt-1 line-clamp-2">{cat.moTa}</div>
                                        <div className="flex items-center gap-2 mt-3">
                                            <VCT_Badge type="info" text={`${cat.soTicket} tickets`} />
                                            {cat.isActive && <span className="w-2 h-2 rounded-full bg-[#10b981]" />}
                                        </div>
                                        <div className="flex items-center gap-1 mt-2">
                                            <VCT_Button size="sm" variant="ghost" onClick={() => { setEditingCat(cat); setShowCatModal(true) }} icon={<VCT_Icons.Edit size={12} />}>Sửa</VCT_Button>
                                            <VCT_Button size="sm" variant="ghost" onClick={() => { setCategories(prev => prev.filter(c => c.id !== cat.id)); showToast('Đã xóa danh mục', 'info') }} icon={<VCT_Icons.Trash size={12} />}>Xóa</VCT_Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    </div>
                </>
            )}

            {/* ═══════════════════════════════════════
                TAB: ANALYTICS
               ═══════════════════════════════════════ */}
            {tab === 'analytics' && <SupportAnalyticsTab tickets={tickets} />}
            <SupportTicketDrawer
                selected={selected}
                onClose={() => setSelected(null)}
                replies={replies}
                notes={notes}
                activities={MOCK_ACTIVITIES}
                onAssign={handleAssign}
                onResolve={handleResolve}
                onCloseTicket={handleClose}
                onReopen={handleReopen}
                onAddReply={(reply) => setReplies(prev => [...prev, reply])}
                onAddNote={(note) => setNotes(prev => [...prev, note])}
            />

            <VCT_ConfirmDialog
                isOpen={!!showResolveConfirm}
                onClose={() => setShowResolveConfirm(null)}
                onConfirm={() => showResolveConfirm && handleResolve(showResolveConfirm)}
                title="Giải quyết ticket?"
                message="Xác nhận đánh dấu ticket này là đã giải quyết? Khách hàng sẽ nhận thông báo."
                confirmLabel="Giải quyết"
                confirmVariant="primary"
            />

            {/* ── Create Ticket Modal ── */}
            <VCT_Modal isOpen={showCreateModal} onClose={() => { setShowCreateModal(false); setNewTitle(''); setNewContent(''); setNewType('general'); setNewPriority('medium') }} title={t('support.action.create')} width={560}>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tiêu đề">
                        <VCT_Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Mô tả ngắn gọn vấn đề..." />
                    </VCT_Field>
                    <VCT_Field label="Nội dung chi tiết">
                        <VCT_Textarea value={newContent} onChange={setNewContent} placeholder="Mô tả chi tiết vấn đề cần hỗ trợ..." rows={4} />
                    </VCT_Field>
                    <div className="grid grid-cols-2 gap-3">
                        <VCT_Field label="Loại">
                            <VCT_Select
                                value={newType}
                                onChange={(v) => setNewType(v as SupportTicket['loai'])}
                                options={Object.entries(TYPE_BADGE).map(([k, v]) => ({ value: k, label: v.label }))}
                            />
                        </VCT_Field>
                        <VCT_Field label="Mức ưu tiên">
                            <VCT_Select
                                value={newPriority}
                                onChange={(v) => setNewPriority(v as SupportTicket['mucUuTien'])}
                                options={Object.entries(PRIORITY_BADGE).map(([k, v]) => ({ value: k, label: v.label }))}
                            />
                        </VCT_Field>
                    </div>
                    <VCT_Stack direction="row" gap={8} justify="end" className="pt-2 border-t border-(--vct-border-subtle)">
                        <VCT_Button variant="ghost" onClick={() => { setShowCreateModal(false); setNewTitle(''); setNewContent(''); setNewType('general'); setNewPriority('medium') }}>{t('common.cancel')}</VCT_Button>
                        <VCT_Button variant="primary" onClick={handleCreateTicket} icon={<VCT_Icons.Plus size={14} />}>
                            {t('support.action.create')}
                        </VCT_Button>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── FAQ Create/Edit Modal ── */}
            <VCT_Modal isOpen={showFaqModal} onClose={() => { setShowFaqModal(false); setEditingFaq(null) }} title={editingFaq ? 'Chỉnh sửa FAQ' : 'Thêm FAQ mới'} width={560}>
                <FaqForm
                    initial={editingFaq}
                    onSave={(data) => {
                        if (editingFaq) {
                            setFaqs(prev => prev.map(f => f.id === editingFaq.id ? { ...f, ...data } : f))
                            showToast('Đã cập nhật FAQ')
                        } else {
                            setFaqs(prev => [...prev, { ...data, id: `FAQ-${Date.now()}`, luotXem: 0, isActive: true }])
                            showToast('Đã thêm FAQ mới')
                        }
                        setShowFaqModal(false)
                        setEditingFaq(null)
                    }}
                    onCancel={() => { setShowFaqModal(false); setEditingFaq(null) }}
                />
            </VCT_Modal>

            {/* ── Category Create/Edit Modal ── */}
            <VCT_Modal isOpen={showCatModal} onClose={() => { setShowCatModal(false); setEditingCat(null) }} title={editingCat ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'} width={480}>
                {(() => {
                    const CatForm = () => {
                        const [ten, setTen] = useState(editingCat?.ten ?? '')
                        const [moTa, setMoTa] = useState(editingCat?.moTa ?? '')
                        const [mauSac, setMauSac] = useState(editingCat?.mauSac ?? '#8b5cf6')
                        return (
                            <VCT_Stack gap={16}>
                                <VCT_Field label="Tên danh mục"><VCT_Input value={ten} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTen(e.target.value)} placeholder="VD: Hỗ trợ tài khoản..." /></VCT_Field>
                                <VCT_Field label="Mô tả"><VCT_Textarea value={moTa} onChange={setMoTa} placeholder="Mô tả danh mục..." rows={3} /></VCT_Field>
                                <VCT_Field label="Màu sắc"><VCT_Input value={mauSac} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMauSac(e.target.value)} placeholder="#hex color" /></VCT_Field>
                                <VCT_Stack direction="row" gap={8} justify="end" className="pt-2 border-t border-(--vct-border-subtle)">
                                    <VCT_Button variant="ghost" onClick={() => { setShowCatModal(false); setEditingCat(null) }}>Hủy</VCT_Button>
                                    <VCT_Button variant="primary" onClick={() => {
                                        if (editingCat) {
                                            setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, ten, moTa, mauSac } : c))
                                            showToast('Đã cập nhật danh mục')
                                        } else {
                                            setCategories(prev => [...prev, { id: `CAT-${Date.now()}`, ten, moTa, mauSac, icon: 'Layers', soTicket: 0, isActive: true }])
                                            showToast('Đã thêm danh mục mới')
                                        }
                                        setShowCatModal(false); setEditingCat(null)
                                    }} icon={<VCT_Icons.CheckCircle size={14} />}>{editingCat ? 'Cập nhật' : 'Thêm'}</VCT_Button>
                                </VCT_Stack>
                            </VCT_Stack>
                        )
                    }
                    return <CatForm />
                })()}
            </VCT_Modal>
        </AdminPageShell>
    )
}
