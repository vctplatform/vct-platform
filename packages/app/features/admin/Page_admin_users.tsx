'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_AvatarLetter, VCT_EmptyState, VCT_Tabs,
    VCT_BulkActionsBar, VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import {
    ROLE_OPTIONS,
    ROLE_COLORS,
    STATUS_MAP,
    MOCK_USERS,
    getRoleLabel,
    type SystemUser,
} from './admin-users.data'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
const BLANK_FORM = { name: '', email: '', phone: '', role: 'VIEWER', scope: '' }

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_users = () => {
    const router = useRouter()
    const [users, setUsers] = useState<SystemUser[]>(MOCK_USERS)
    const [search, setSearch] = useState('')
    const [roleFilter, setRoleFilter] = useState('all')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null)
    const [form, setForm] = useState<any>({ ...BLANK_FORM })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    const filtered = useMemo(() => {
        let data = users
        if (roleFilter !== 'all') data = data.filter(u => u.role === roleFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
        }
        return data
    }, [users, roleFilter, search])

    const openAddModal = useCallback(() => {
        setEditingUser(null)
        setForm({ ...BLANK_FORM })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((user: SystemUser) => {
        setEditingUser(user)
        setForm({ name: user.name, email: user.email, phone: user.phone, role: user.role, scope: user.scope })
        setShowModal(true)
    }, [])

    const openUserDetail = useCallback((userId: string) => {
        router.push(`/users/${userId}`)
    }, [router])

    const handleSave = () => {
        if (!form.name || !form.email) { showToast('Vui lòng nhập họ tên và email', 'error'); return }
        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...form } : u))
            showToast(`Đã cập nhật "${form.name}"`)
        } else {
            const newUser: SystemUser = {
                ...form, id: `USR-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                status: 'active', last_login: '—', created_at: new Date().toLocaleDateString('vi-VN'),
                avatar_letter: form.name[0] || 'U',
            }
            setUsers(prev => [newUser, ...prev])
            showToast(`Đã thêm tài khoản "${form.name}"`)
        }
        setShowModal(false)
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
        showToast(`Đã vô hiệu hóa tài khoản "${deleteTarget.name}"`)
        setDeleteTarget(null)
    }

    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    const toggleSelectAll = () => setSelectedIds(prev => prev.size === filtered.length ? new Set() : new Set(filtered.map(u => u.id)))

    const bulkActions = useMemo(() => [
        {
            label: 'Vô hiệu hóa',
            icon: <VCT_Icons.x size={14} />,
            onClick: () => {
                setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status: 'inactive' as const } : u))
                showToast(`Đã vô hiệu hóa ${selectedIds.size} tài khoản`, 'warning')
                setSelectedIds(new Set())
            },
            variant: 'danger'
        },
        {
            label: 'Kích hoạt lại',
            icon: <VCT_Icons.Check size={14} />,
            onClick: () => {
                setUsers(prev => prev.map(u => selectedIds.has(u.id) ? { ...u, status: 'active' as const } : u))
                showToast(`Đã kích hoạt ${selectedIds.size} tài khoản`)
                setSelectedIds(new Set())
            },
            variant: 'default'
        }
    ], [selectedIds, showToast])

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Quản Lý Tài Khoản</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý người dùng, phân quyền và trạng thái tài khoản trong hệ thống.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Xuất Excel</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm Tài Khoản</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Tổng TK', value: users.length, icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
                { label: 'Hoạt động', value: users.filter(u => u.status === 'active').length, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                { label: 'Bị khóa', value: users.filter(u => u.status === 'locked').length, icon: <VCT_Icons.Shield size={18} />, color: '#ef4444' },
                { label: 'Online', value: 128, icon: <VCT_Icons.Activity size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-8" />

            {/* ── TABS & SEARCH ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[var(--vct-border-subtle)] pb-4">
                <VCT_Tabs
                    tabs={[
                        { key: 'all', label: 'Tất cả' },
                        ...ROLE_OPTIONS.map(r => ({ key: r.value, label: r.label }))
                    ]}
                    activeTab={roleFilter}
                    onChange={setRoleFilter}
                />
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm tên, email, mã..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── TABLE ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy tài khoản" description="Thử thay đổi bộ lọc hoặc từ khóa." actionLabel="Thêm tài khoản" onAction={openAddModal} icon="👤" />
            ) : (
                <div className="overflow-hidden rounded-2xl border border-[var(--vct-border-subtle)] bg-[var(--vct-bg-glass)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-[var(--vct-border-strong)] bg-[var(--vct-bg-card)]">
                                <th style={{ padding: '14px 16px', width: 40, textAlign: 'center' }}>
                                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0} onChange={toggleSelectAll} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />
                                </th>
                                {['Người dùng', 'Vai trò', 'Phạm vi', 'Trạng thái', 'Đăng nhập cuối', ''].map((h, i) => (
                                    <th key={i} style={{ padding: '14px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5, textAlign: i === 3 ? 'center' : 'left' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((user, idx) => (
                                <tr key={user.id} className="group" style={{ borderBottom: '1px solid var(--vct-border-subtle)', background: selectedIds.has(user.id) ? 'rgba(34, 211, 238, 0.05)' : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)' }}>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <input type="checkbox" checked={selectedIds.has(user.id)} onChange={() => toggleSelect(user.id)} style={{ width: 16, height: 16, accentColor: '#22d3ee' }} />
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <VCT_Stack direction="row" gap={10} align="center">
                                            <VCT_AvatarLetter name={user.name} size={36} />
                                            <div>
                                                <button
                                                    type="button"
                                                    onClick={() => openUserDetail(user.id)}
                                                    className="text-left text-[13px] font-bold text-[var(--vct-text-primary)] transition-colors hover:text-[var(--vct-accent-cyan)]"
                                                >
                                                    {user.name}
                                                </button>
                                                <div style={{ fontSize: 11, opacity: 0.6 }}>{user.email} • {user.phone}</div>
                                            </div>
                                        </VCT_Stack>
                                    </td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, color: ROLE_COLORS[user.role] || '#94a3b8', background: `${ROLE_COLORS[user.role] || '#94a3b8'}15` }}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--vct-text-secondary)' }}>{user.scope}</td>
                                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                        <VCT_Badge text={STATUS_MAP[user.status]?.label || 'Không rõ'} type={STATUS_MAP[user.status]?.type || 'neutral'} />
                                    </td>
                                    <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--vct-text-tertiary)' }}>
                                        <div className="flex items-center gap-1"><VCT_Icons.Clock size={12} /> {user.last_login}</div>
                                    </td>
                                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                                        <VCT_Stack direction="row" gap={4} justify="flex-end">
                                            <button type="button" onClick={() => openUserDetail(user.id)} className="p-1.5 text-[var(--vct-text-tertiary)] hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/10"><VCT_Icons.Eye size={16} /></button>
                                            <button type="button" onClick={() => openEditModal(user)} className="p-1.5 text-[var(--vct-text-tertiary)] hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/10"><VCT_Icons.Edit size={16} /></button>
                                            <button type="button" onClick={() => setDeleteTarget(user)} className="p-1.5 text-[#ef4444] opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-[#ef444420]"><VCT_Icons.Trash size={16} /></button>
                                        </VCT_Stack>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ── BULK ACTIONS ── */}
            <AnimatePresence>
                <VCT_BulkActionsBar count={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} actions={bulkActions} />
            </AnimatePresence>

            {/* ── ADD/EDIT MODAL ── */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'} width="600px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingUser ? 'Cập nhật' : 'Tạo tài khoản'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Họ tên *"><VCT_Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Email *" className="flex-1"><VCT_Input type="email" value={form.email} onChange={(e: any) => setForm({ ...form, email: e.target.value })} placeholder="email@vct.vn" /></VCT_Field>
                        <VCT_Field label="Số điện thoại" className="flex-1"><VCT_Input value={form.phone} onChange={(e: any) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Vai trò" className="flex-1"><VCT_Select options={ROLE_OPTIONS} value={form.role} onChange={(v: any) => setForm({ ...form, role: v })} /></VCT_Field>
                        <VCT_Field label="Phạm vi" className="flex-1"><VCT_Input value={form.scope} onChange={(e: any) => setForm({ ...form, scope: e.target.value })} placeholder="VD: CLB Sơn Long" /></VCT_Field>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Vô hiệu hóa tài khoản" message={`Bạn có chắc muốn vô hiệu hóa tài khoản "${deleteTarget?.name}"? Tài khoản sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`}
                confirmLabel="Vô hiệu hóa" />
        </VCT_PageContainer>
    )
}
