'use client'

import './admin.module.css'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence } from 'framer-motion'
import { usePagination } from '../hooks/usePagination'
import { useDebounce } from '../hooks/useDebounce'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { useFormValidation } from './hooks/useFormValidation'
import { AdminDataTable } from './components/AdminDataTable'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_AvatarLetter, VCT_Tabs,
    VCT_BulkActionsBar,
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'
import { VCT_Drawer } from '@vct/ui'
import { AdminPaginationBar } from './components/AdminPaginationBar'

import {
    ROLE_OPTIONS,
    ROLE_COLORS,
    STATUS_MAP,
    getRoleLabel,
    type SystemUser,
} from './admin-users.data'
import type { UserFormData } from './admin.types'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { exportToCSV } from './utils/adminExport'

import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
const BLANK_FORM: UserFormData = { name: '', email: '', phone: '', role: 'VIEWER', scope: '', status: 'active' }



// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════


export const Page_admin_users = () => (
    <AdminGuard>
        <Page_admin_users_Content />
    </AdminGuard>
)

const Page_admin_users_Content = () => {
    const router = useRouter()
    const { t } = useI18n()
    const { data: fetchedUsers, isLoading } = useAdminFetch<SystemUser[]>('/admin/users')
    const [users, setUsers] = useState<SystemUser[]>([])
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 300)
    const [roleFilter, setRoleFilter] = useState('all')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const { showToast } = useShellToast()
    const [showModal, setShowModal] = useState(false)
    const [editingUser, setEditingUser] = useState<SystemUser | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<SystemUser | null>(null)
    const [form, setForm] = useState<UserFormData>({ ...BLANK_FORM })
    const [drawerUser, setDrawerUser] = useState<SystemUser | null>(null)
    const [sortCol, setSortCol] = useState<string>('name')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    const { mutate: mutateSave } = useAdminMutation('/admin/users', { 
        onSuccess: () => showToast('Đã lưu tài khoản!')
    })
    const { mutate: mutateDelete } = useAdminMutation('/admin/users/delete', {
        onSuccess: () => showToast('Đã vô hiệu hóa tài khoản!')
    })

    const { validate, getFieldError, clearErrors } = useFormValidation({
        name: { rules: [{ type: 'required', message: 'Họ tên là bắt buộc' }, { type: 'maxLength', value: 100 }] },
        email: { rules: [{ type: 'required', message: 'Email là bắt buộc' }, { type: 'pattern', value: /^\S+@\S+\.\S+$/, message: 'Email không hợp lệ' }] },
    })

    React.useEffect(() => { if (fetchedUsers) setUsers(fetchedUsers) }, [fetchedUsers])

    const filtered = useMemo(() => {
        let data = users
        if (roleFilter !== 'all') data = data.filter(u => u.role === roleFilter)
        if (debouncedSearch) {
            const q = debouncedSearch.toLowerCase()
            data = data.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q))
        }
        
        // Sorting
        data = [...data].sort((a, b) => {
            const valA = String((a as any)[sortCol] || '').toLowerCase()
            const valB = String((b as any)[sortCol] || '').toLowerCase()
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })

        return data
    }, [users, roleFilter, debouncedSearch, sortCol, sortDir])

    const pagination = usePagination(filtered, { pageSize: 5 })

    const openAddModal = useCallback(() => {
        setEditingUser(null)
        setForm({ ...BLANK_FORM })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((user: SystemUser) => {
        setEditingUser(user)
        setForm({ name: user.name, email: user.email, phone: user.phone, role: user.role, scope: user.scope, status: user.status })
        clearErrors()
        setShowModal(true)
    }, [clearErrors])

    const openUserDetail = useCallback((user: SystemUser) => {
        setDrawerUser(user)
    }, [])

    const handleSort = (key: string) => {
        if (sortCol === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortCol(key)
            setSortDir('asc')
        }
    }

    const handleSave = async () => {
        if (!validate({ name: form.name, email: form.email })) return
        
        await mutateSave({ ...form, id: editingUser?.id })

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

    const handleDelete = async () => {
        if (!deleteTarget) return
        
        await mutateDelete({ id: deleteTarget.id })

        setUsers(prev => prev.filter(u => u.id !== deleteTarget.id))
        setSelectedIds(prev => { const n = new Set(prev); n.delete(deleteTarget.id); return n })
        showToast(`Đã vô hiệu hóa tài khoản "${deleteTarget.name}"`)
        setDeleteTarget(null)
    }

    const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

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

    const kpiStats: StatItem[] = [
        { label: 'Tổng TK', value: users.length, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-accent-cyan)' },
        { label: 'Hoạt động', value: users.filter(u => u.status === 'active').length, icon: <VCT_Icons.CheckCircle size={18} />, color: 'var(--vct-success)' },
        { label: 'Bị khóa', value: users.filter(u => u.status === 'locked').length, icon: <VCT_Icons.Shield size={18} />, color: 'var(--vct-danger)' },
        { label: 'Online', value: 128, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-warning)' },
    ]

    return (
        <AdminPageShell
            title={t('admin.users.title')}
            subtitle={t('admin.users.subtitle')}
            icon={<VCT_Icons.Users size={28} className="text-(--vct-accent-cyan)" />}
            breadcrumbs={[
                { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
                { label: 'Tài khoản' },
            ]}
            stats={kpiStats}
            actions={
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                        exportToCSV({
                            headers: ['ID', 'Tên', 'Email', 'SĐT', 'Vai trò', 'Phạm vi', 'Trạng thái', 'Đăng nhập cuối'],
                            rows: filtered.map(u => [u.id, u.name, u.email, u.phone, getRoleLabel(u.role), u.scope, u.status, u.last_login]),
                            filename: `vct_users_${new Date().toISOString().slice(0, 10)}.csv`,
                        })
                        showToast('Đã xuất file Excel thành công!')
                    }}>Xuất Excel</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm Tài Khoản</VCT_Button>
                </VCT_Stack>
            }
        >

            {/* ── TABS & SEARCH ── */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-(--vct-border-subtle) pb-4">
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
            <AdminDataTable
                data={pagination.paginatedItems}
                isLoading={isLoading}
                sortBy={sortCol}
                sortDir={sortDir}
                onSort={handleSort}
                rowKey={u => u.id}
                emptyTitle="Không tìm thấy tài khoản"
                emptyDescription="Thử thay đổi bộ lọc hoặc từ khóa."
                emptyIcon="👤"
                columns={[
                    {
                        key: '_select',
                        label: '',
                        width: '48px',
                        align: 'center',
                        sortable: false,
                        render: (u) => (
                            <input 
                                type="checkbox" 
                                aria-label="Chọn người dùng" 
                                checked={selectedIds.has(u.id)} 
                                onChange={() => toggleSelect(u.id)} 
                                className="w-4 h-4 accent-(--vct-accent-cyan) rounded border-(--vct-border-strong) bg-transparent"
                                onClick={e => e.stopPropagation()}
                            />
                        )
                    },
                    {
                        key: 'name',
                        label: 'Người dùng',
                        sortable: true,
                        render: (u) => (
                            <VCT_Stack direction="row" gap={10} align="center">
                                <VCT_AvatarLetter name={u.name} size={36} />
                                <div>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); openUserDetail(u) }}
                                        className="text-left text-[13px] font-bold text-(--vct-text-primary) transition-colors hover:text-(--vct-accent-cyan)"
                                    >
                                        {u.name}
                                    </button>
                                    <div className="text-[11px] opacity-60">{u.email} • {u.phone}</div>
                                </div>
                            </VCT_Stack>
                        )
                    },
                    {
                        key: 'role',
                        label: 'Vai trò',
                        sortable: true,
                        render: (u) => (
                            <span className="admin-role-tag" data-color={ROLE_COLORS[u.role] || 'slate'}>
                                {getRoleLabel(u.role)}
                            </span>
                        )
                    },
                    {
                        key: 'scope',
                        label: 'Phạm vi',
                        sortable: true,
                        hideMobile: true,
                        render: (u) => <span className="text-[13px] text-(--vct-text-secondary)">{u.scope}</span>
                    },
                    {
                        key: 'status',
                        label: 'Trạng thái',
                        sortable: true,
                        align: 'center',
                        render: (u) => <VCT_Badge text={STATUS_MAP[u.status]?.label || 'Không rõ'} type={STATUS_MAP[u.status]?.type || 'neutral'} />
                    },
                    {
                        key: 'last_login',
                        label: 'Đăng nhập cuối',
                        sortable: true,
                        hideMobile: true,
                        render: (u) => <div className="flex items-center gap-1 text-[12px] text-(--vct-text-tertiary)"><VCT_Icons.Clock size={12} /> {u.last_login}</div>
                    },
                    {
                        key: '_actions',
                        label: '',
                        align: 'right',
                        sortable: false,
                        render: (u) => (
                            <VCT_Stack direction="row" gap={4} justify="flex-end">
                                <button type="button" aria-label="Xem chi tiết" onClick={(e) => { e.stopPropagation(); openUserDetail(u) }} className="p-1.5 text-(--vct-text-tertiary) hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/10"><VCT_Icons.Eye size={16} /></button>
                                <button type="button" aria-label="Chỉnh sửa" onClick={(e) => { e.stopPropagation(); openEditModal(u) }} className="p-1.5 text-(--vct-text-tertiary) hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-white/10"><VCT_Icons.Edit size={16} /></button>
                                <button type="button" aria-label="Xóa" onClick={(e) => { e.stopPropagation(); setDeleteTarget(u) }} className="p-1.5 text-(--vct-danger) opacity-0 group-hover:opacity-100 transition-all rounded-md hover:bg-[#ef444420]"><VCT_Icons.Trash size={16} /></button>
                            </VCT_Stack>
                        )
                    }
                ]}
                onRowClick={openUserDetail}
            />
            {!isLoading && pagination.totalPages > 1 && (
                <div className="mt-4">
                    <AdminPaginationBar {...pagination} />
                </div>
            )}

            {/* ── BULK ACTIONS ── */}
            <AnimatePresence>
                <VCT_BulkActionsBar count={selectedIds.size} onClearSelection={() => setSelectedIds(new Set())} actions={bulkActions} />
            </AnimatePresence>

            {/* ── ADD/EDIT MODAL ── */}
            <VCT_Modal isOpen={showModal} onClose={() => { setShowModal(false); clearErrors() }} title={editingUser ? 'Chỉnh sửa tài khoản' : 'Thêm tài khoản mới'} width="600px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => { setShowModal(false); clearErrors() }}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingUser ? 'Cập nhật' : 'Tạo tài khoản'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Họ tên *" error={getFieldError('name')}><VCT_Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })} placeholder="Nguyễn Văn A" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Email *" className="flex-1" error={getFieldError('email')}><VCT_Input type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} placeholder="email@vct.vn" /></VCT_Field>
                        <VCT_Field label="Số điện thoại" className="flex-1"><VCT_Input value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} placeholder="0901234567" /></VCT_Field>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Vai trò" className="flex-1"><VCT_Select options={ROLE_OPTIONS} value={form.role} onChange={(v: string) => setForm({ ...form, role: v })} /></VCT_Field>
                        <VCT_Field label="Phạm vi" className="flex-1"><VCT_Input value={form.scope} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, scope: e.target.value })} placeholder="VD: CLB Sơn Long" /></VCT_Field>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Vô hiệu hóa tài khoản" message={`Bạn có chắc muốn vô hiệu hóa tài khoản "${deleteTarget?.name}"? Tài khoản sẽ không thể đăng nhập cho đến khi được kích hoạt lại.`}
                confirmLabel="Vô hiệu hóa" />

            {/* ── USER DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerUser} onClose={() => setDrawerUser(null)} title="Chi tiết tài khoản" width={520} footer={
                <VCT_Stack direction="row" gap={8} justify="flex-end">
                    <VCT_Button variant="outline" onClick={() => { if (drawerUser) { openEditModal(drawerUser); setDrawerUser(null) } }}>Chỉnh sửa</VCT_Button>
                    <VCT_Button variant="outline" onClick={() => drawerUser && router.push(`/admin/users/${drawerUser.id}`)}>Xem trang chi tiết</VCT_Button>
                </VCT_Stack>
            }>
                {drawerUser && (
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="flex items-center gap-4 pb-4 border-b border-(--vct-border-subtle)">
                            <VCT_AvatarLetter name={drawerUser.name} size={56} />
                            <div>
                                <div className="text-lg font-bold text-(--vct-text-primary)">{drawerUser.name}</div>
                                <div className="text-sm text-(--vct-text-secondary)">{drawerUser.email}</div>
                                <VCT_Badge text={STATUS_MAP[drawerUser.status]?.label || 'N/A'} type={STATUS_MAP[drawerUser.status]?.type || 'neutral'} />
                            </div>
                        </div>
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">ID</div><div className="font-mono text-(--vct-accent-cyan)">{drawerUser.id}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">SĐT</div><div className="text-(--vct-text-primary)">{drawerUser.phone}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Vai trò</div><span className="admin-role-tag" data-color={ROLE_COLORS[drawerUser.role] || 'slate'}>{getRoleLabel(drawerUser.role)}</span></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Phạm vi</div><div className="text-(--vct-text-primary)">{drawerUser.scope}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Đăng nhập cuối</div><div className="text-(--vct-text-primary)">{drawerUser.last_login}</div></div>
                            <div><div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Ngày tạo</div><div className="text-(--vct-text-primary)">{drawerUser.created_at}</div></div>
                        </div>
                        {/* Login History */}
                        <div>
                            <h3 className="font-bold text-sm text-(--vct-text-primary) mb-3 flex items-center gap-2"><VCT_Icons.Clock size={14} /> Lịch sử hoạt động</h3>
                            <div className="text-center text-(--vct-text-tertiary) py-4 text-xs">
                                Lịch sử đăng nhập sẽ hiển thị từ audit log thực tế.
                            </div>
                        </div>
                    </div>
                )}
            </VCT_Drawer>
        </AdminPageShell>
    )
}
