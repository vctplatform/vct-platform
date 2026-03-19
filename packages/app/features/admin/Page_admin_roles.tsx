'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field,
    VCT_ConfirmDialog
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { exportToCSV } from './utils/adminExport'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'

interface Role {
    id: string; name: string; code: string; description: string
    user_count: number; scope_type: string; permissions: string[]; is_system: boolean
}

const PERMISSIONS = [
    { key: 'tournament.view', label: 'Xem giải đấu', module: 'Giải đấu' },
    { key: 'tournament.create', label: 'Tạo giải đấu', module: 'Giải đấu' },
    { key: 'tournament.edit', label: 'Sửa giải đấu', module: 'Giải đấu' },
    { key: 'tournament.delete', label: 'Xóa giải đấu', module: 'Giải đấu' },
    { key: 'scoring.submit', label: 'Chấm điểm', module: 'Chấm điểm' },
    { key: 'scoring.override', label: 'Ghi đè điểm', module: 'Chấm điểm' },
    { key: 'athlete.view', label: 'Xem VĐV', module: 'Nhân sự' },
    { key: 'athlete.edit', label: 'Sửa VĐV', module: 'Nhân sự' },
    { key: 'club.manage', label: 'Quản lý CLB', module: 'Tổ chức' },
    { key: 'finance.view', label: 'Xem tài chính', module: 'Tài chính' },
    { key: 'finance.manage', label: 'Quản lý tài chính', module: 'Tài chính' },
    { key: 'admin.users', label: 'Quản trị tài khoản', module: 'Admin' },
    { key: 'admin.system', label: 'Cấu hình hệ thống', module: 'Admin' },
    { key: 'admin.audit', label: 'Xem audit log', module: 'Admin' },
]



const SCOPE_LABELS: Record<string, string> = { SYSTEM: 'Hệ thống', FEDERATION: 'Liên đoàn', CLUB: 'CLB', TOURNAMENT: 'Giải đấu', SELF: 'Cá nhân' }

const SkeletonRoleItem = () => (<div className="p-4 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) animate-pulse"><div className="h-4 w-28 bg-(--vct-bg-card) rounded mb-2" /><div className="h-3 w-20 bg-(--vct-bg-card) rounded mb-2" /><div className="h-3 w-full bg-(--vct-bg-card) rounded" /></div>)
const SkeletonPermGrid = () => (<div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 animate-pulse"><div className="h-6 w-48 bg-(--vct-bg-card) rounded mb-6" />{[...Array(3)].map((_,i)=>(<div key={i} className="mb-6"><div className="h-3 w-20 bg-(--vct-bg-card) rounded mb-3" /><div className="grid grid-cols-2 gap-2">{[...Array(4)].map((_,j)=>(<div key={j} className="h-12 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)" />))}</div></div>))}</div>)

export const Page_admin_roles = () => (
    <AdminGuard>
        <Page_admin_roles_Content />
    </AdminGuard>
)

const Page_admin_roles_Content = () => {
    const { t } = useI18n()
    const { data: fetchedRoles, isLoading } = useAdminFetch<Role[]>('/admin/roles')
    const [roles, setRoles] = useState<Role[]>([])
    const [search, setSearch] = useState('')
    const [selectedRole, setSelectedRole] = useState<Role | null>(null)
    const [showModal, setShowModal] = useState(false)
    const { showToast } = useShellToast()
    const [form, setForm] = useState({ name: '', code: '', description: '', scope_type: 'CLUB' })
    const [confirmPerm, setConfirmPerm] = useState<{ roleId: string; permKey: string; roleName: string } | null>(null)

    const { mutate: mutatePerm } = useAdminMutation('/admin/roles/permissions', { onSuccess: () => {} })
    const { mutate: mutateCreate } = useAdminMutation('/admin/roles/create', { onSuccess: () => {} })

    React.useEffect(() => {
        if (fetchedRoles) {
            // Normalize: ensure every role has a permissions array (API may omit it)
            const normalized = fetchedRoles.map(r => ({ ...r, permissions: r.permissions ?? [] }))
            setRoles(normalized)
            if (!selectedRole) setSelectedRole(normalized[0] ?? null)
        }
    }, [fetchedRoles, selectedRole])

    const filtered = useMemo(() => {
        if (!search) return roles
        const q = search.toLowerCase()
        return roles.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    }, [roles, search])

    const permModules = useMemo(() => {
        const m: Record<string, typeof PERMISSIONS> = {}
        PERMISSIONS.forEach(p => { if (!m[p.module]) m[p.module] = []; m[p.module]!.push(p) })
        return m
    }, [])

    const doTogglePerm = async (roleId: string, permKey: string) => {
        const perm = PERMISSIONS.find(p => p.key === permKey)
        const isAdding = !(roles.find(r => r.id === roleId)?.permissions ?? []).includes(permKey)
        
        await mutatePerm({ roleId, permissions: [permKey], action: isAdding ? 'add' : 'remove' })

        setRoles(prev => prev.map(r => {
            if (r.id !== roleId) return r
            const perms = (r.permissions ?? []).includes(permKey) ? (r.permissions ?? []).filter(p => p !== permKey) : [...(r.permissions ?? []), permKey]
            return { ...r, permissions: perms }
        }))
        if (selectedRole?.id === roleId) {
            setSelectedRole(prev => prev ? { ...prev, permissions: (prev.permissions ?? []).includes(permKey) ? (prev.permissions ?? []).filter(p => p !== permKey) : [...(prev.permissions ?? []), permKey] } : prev)
        }
        showToast(`${isAdding ? 'Đã thêm' : 'Đã gỡ'} quyền "${perm?.label}"`, isAdding ? 'success' : 'warning')
    }

    const togglePerm = (roleId: string, permKey: string) => {
        const role = roles.find(r => r.id === roleId)
        if (role?.is_system && permKey.startsWith('admin.')) { setConfirmPerm({ roleId, permKey, roleName: role?.name ?? '' }); return }
        doTogglePerm(roleId, permKey)
    }

    const handleCreate = async () => {
        if (!form.name || !form.code) { showToast('Vui lòng nhập tên và mã', 'error'); return }
        const newRole = { id: `R-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`, name: form.name, code: form.code, description: form.description, scope_type: form.scope_type, user_count: 0, permissions: [], is_system: false }
        
        await mutateCreate(newRole)
        
        setRoles(prev => [...prev, newRole as Role])
        showToast(`Đã tạo vai trò "${form.name}"`)
        setShowModal(false)
    }

    const handleExport = () => {
        exportToCSV({
            headers: ['Vai trò', 'Mã', 'Phạm vi', 'SL', ...PERMISSIONS.map(p => p.key)],
            rows: roles.map(r => [
                r.name, r.code, SCOPE_LABELS[r.scope_type] ?? '', String(r.user_count),
                ...PERMISSIONS.map(p => r.permissions.includes(p.key) ? '✓' : '')
            ]),
            filename: `vct_roles_${new Date().toISOString().slice(0, 10)}.csv`,
        })
        showToast('Đã xuất ma trận phân quyền!')
    }

    const stats: StatItem[] = [
        { label: 'Vai trò', value: roles.length, icon: <VCT_Icons.Shield size={18} />, color: '#8b5cf6' },
        { label: 'Người dùng', value: roles.reduce((s,r)=>s+r.user_count,0).toLocaleString(), icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
        { label: 'Quyền HT', value: PERMISSIONS.length, icon: <VCT_Icons.ShieldCheck size={18} />, color: '#10b981' },
        { label: 'Tùy chỉnh', value: roles.filter(r => !r.is_system).length, icon: <VCT_Icons.Settings size={18} />, color: '#f59e0b' },
    ]

    return (
        <AdminPageShell
            title={t('admin.roles.title')}
            subtitle={t('admin.roles.subtitle')}
            icon={<VCT_Icons.Shield size={28} className="text-[#8b5cf6]" />}
            breadcrumbs={[
                { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
                { label: 'Vai trò & Quyền' },
            ]}
            stats={stats}
            actions={
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={handleExport}>{t('admin.roles.exportMatrix')}</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => { setForm({ name:'', code:'', description:'', scope_type:'CLUB' }); setShowModal(true) }}>Tạo Vai Trò</VCT_Button>
                </VCT_Stack>
            }
        >

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <div className="mb-4"><VCT_SearchInput placeholder="Tìm vai trò..." value={search} onChange={setSearch} onClear={() => setSearch('')} /></div>
                    <div className="space-y-2">
                        {isLoading ? [...Array(4)].map((_,i) => <SkeletonRoleItem key={i} />) : filtered.map(role => (
                            <div key={role.id} onClick={() => setSelectedRole(role)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRole?.id === role.id ? 'bg-(--vct-accent-cyan)/10 border-(--vct-accent-cyan)' : 'bg-(--vct-bg-elevated) border-(--vct-border-subtle) hover:border-(--vct-accent-cyan)'}`}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{role.name}</div>
                                    {role.is_system && <VCT_Badge type="info" text="HT" />}
                                </div>
                                <div className="text-[11px] font-mono text-(--vct-accent-cyan) mb-1">{role.code}</div>
                                <div className="text-[11px] text-(--vct-text-tertiary)">{role.description}</div>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-(--vct-text-tertiary)">
                                    <span className="flex items-center gap-1"><VCT_Icons.Users size={10} /> {role.user_count}</span>
                                    <span className="flex items-center gap-1"><VCT_Icons.Shield size={10} /> {(role.permissions ?? []).length} quyền</span>
                                    <span className="flex items-center gap-1"><VCT_Icons.Layers size={10} /> {SCOPE_LABELS[role.scope_type] ?? 'Khác'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-2">
                    {isLoading ? <SkeletonPermGrid /> : selectedRole ? (
                        <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div><h2 className="font-bold text-lg text-(--vct-text-primary)">Ma Trận Phân Quyền</h2><p className="text-sm text-(--vct-text-secondary) mt-1">Vai trò: <span className="font-bold text-(--vct-accent-cyan)">{selectedRole.name}</span></p></div>
                                <div className="flex items-center gap-2 text-[11px] text-(--vct-text-tertiary)"><div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-[#10b981]" /> Có</div><div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-(--vct-border-strong)" /> Không</div></div>
                            </div>
                            <div className="space-y-6">
                                {Object.entries(permModules).map(([mod, perms]) => (
                                    <div key={mod}><div className="text-[11px] font-bold uppercase tracking-wider text-(--vct-text-tertiary) mb-3 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-(--vct-accent-cyan)" />{mod}</div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{perms.map(perm => {
                                            const has = (selectedRole.permissions ?? []).includes(perm.key)
                                            return (<button key={perm.key} onClick={() => togglePerm(selectedRole.id, perm.key)} className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${has ? 'bg-[#10b98115] border-[#10b98140] hover:border-[#10b981]' : 'bg-(--vct-bg-base) border-(--vct-border-subtle) hover:border-(--vct-border-strong)'}`}><div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${has ? 'bg-[#10b981] text-white' : 'bg-(--vct-border-strong)'}`}>{has && <VCT_Icons.Check size={12} />}</div><div><div className="text-sm font-semibold text-(--vct-text-primary)">{perm.label}</div><div className="text-[10px] font-mono text-(--vct-text-tertiary)">{perm.key}</div></div></button>)
                                        })}</div></div>
                                ))}
                            </div>
                        </div>
                    ) : (<div className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) rounded-2xl p-12 text-center"><VCT_Icons.Shield size={48} className="text-(--vct-text-tertiary) mx-auto mb-4" /><div className="text-(--vct-text-secondary)">Chọn một vai trò</div></div>)}
                </div>
            </div>

            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo vai trò mới" width="500px" footer={<><VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button><VCT_Button onClick={handleCreate}>Tạo</VCT_Button></>}>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên *"><VCT_Input value={form.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, name: e.target.value})} placeholder="VD: Giám sát KT" /></VCT_Field>
                    <VCT_Field label="Mã *"><VCT_Input value={form.code} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, code: e.target.value.toUpperCase()})} placeholder="VD: TECH_SUPERVISOR" /></VCT_Field>
                    <VCT_Field label="Mô tả"><VCT_Input value={form.description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, description: e.target.value})} /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>

            <VCT_ConfirmDialog isOpen={!!confirmPerm} onClose={() => setConfirmPerm(null)} onConfirm={() => { if (confirmPerm) doTogglePerm(confirmPerm.roleId, confirmPerm.permKey); setConfirmPerm(null) }} title="Thay đổi quyền admin" message={`Thay đổi quyền admin cho "${confirmPerm?.roleName}". Ảnh hưởng bảo mật. Tiếp tục?`} confirmLabel="Xác nhận" />
        </AdminPageShell>
    )
}
