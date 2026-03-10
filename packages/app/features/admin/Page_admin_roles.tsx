'use client'

import * as React from 'react'
import { useState, useMemo, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field,
    VCT_PageContainer, VCT_StatRow
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
interface Role {
    id: string
    name: string
    code: string
    description: string
    user_count: number
    scope_type: string
    permissions: string[]
    is_system: boolean
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

const MOCK_ROLES: Role[] = [
    { id: 'R-001', name: 'Quản trị viên hệ thống', code: 'SYSTEM_ADMIN', description: 'Toàn quyền quản trị hệ thống', user_count: 2, scope_type: 'SYSTEM', permissions: PERMISSIONS.map(p => p.key), is_system: true },
    { id: 'R-002', name: 'Quản lý Liên đoàn', code: 'FEDERATION_ADMIN', description: 'Quản trị cấp liên đoàn/hội', user_count: 8, scope_type: 'FEDERATION', permissions: ['tournament.view', 'tournament.create', 'tournament.edit', 'athlete.view', 'athlete.edit', 'club.manage', 'finance.view', 'finance.manage'], is_system: true },
    { id: 'R-003', name: 'Chủ nhiệm CLB', code: 'CLUB_MANAGER', description: 'Quản lý câu lạc bộ/võ đường', user_count: 45, scope_type: 'CLUB', permissions: ['tournament.view', 'athlete.view', 'athlete.edit', 'club.manage', 'finance.view'], is_system: true },
    { id: 'R-004', name: 'Trọng tài', code: 'REFEREE', description: 'Quyền chấm điểm trong giải đấu', user_count: 120, scope_type: 'TOURNAMENT', permissions: ['tournament.view', 'scoring.submit', 'athlete.view'], is_system: true },
    { id: 'R-005', name: 'Huấn luyện viên', code: 'COACH', description: 'Quản lý đào tạo, học trò', user_count: 85, scope_type: 'CLUB', permissions: ['tournament.view', 'athlete.view', 'athlete.edit'], is_system: true },
    { id: 'R-006', name: 'Vận động viên', code: 'ATHLETE', description: 'Xem thông tin cá nhân, đăng ký thi đấu', user_count: 3500, scope_type: 'SELF', permissions: ['tournament.view', 'athlete.view'], is_system: true },
    { id: 'R-007', name: 'Giám sát kỹ thuật', code: 'TECH_SUPERVISOR', description: 'Giám sát kỹ thuật, ghi đè điểm', user_count: 12, scope_type: 'TOURNAMENT', permissions: ['tournament.view', 'scoring.submit', 'scoring.override', 'athlete.view'], is_system: false },
]

const SCOPE_LABELS: Record<string, string> = {
    SYSTEM: 'Hệ thống',
    FEDERATION: 'Liên đoàn',
    CLUB: 'Câu lạc bộ',
    TOURNAMENT: 'Giải đấu',
    SELF: 'Cá nhân',
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_roles = () => {
    const [roles, setRoles] = useState<Role[]>(MOCK_ROLES)
    const [search, setSearch] = useState('')
    const [selectedRole, setSelectedRole] = useState<Role | null>(MOCK_ROLES[0] || null)
    const [showModal, setShowModal] = useState(false)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [form, setForm] = useState({ name: '', code: '', description: '', scope_type: 'CLUB' })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    const filtered = useMemo(() => {
        if (!search) return roles
        const q = search.toLowerCase()
        return roles.filter(r => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q))
    }, [roles, search])

    const permissionModules = useMemo(() => {
        const modules: Record<string, typeof PERMISSIONS> = {}
        PERMISSIONS.forEach(p => {
            if (!modules[p.module]) modules[p.module] = []
            modules[p.module]!.push(p)
        })
        return modules
    }, [])

    const togglePermission = (roleId: string, permKey: string) => {
        setRoles(prev => prev.map(r => {
            if (r.id !== roleId) return r
            const perms = r.permissions.includes(permKey)
                ? r.permissions.filter(p => p !== permKey)
                : [...r.permissions, permKey]
            return { ...r, permissions: perms }
        }))
        if (selectedRole?.id === roleId) {
            setSelectedRole(prev => prev ? {
                ...prev,
                permissions: prev.permissions.includes(permKey)
                    ? prev.permissions.filter(p => p !== permKey)
                    : [...prev.permissions, permKey]
            } : prev)
        }
    }

    const handleCreateRole = () => {
        if (!form.name || !form.code) { showToast('Vui lòng nhập tên và mã vai trò', 'error'); return }
        const newRole: Role = {
            id: `R-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            name: form.name, code: form.code, description: form.description,
            scope_type: form.scope_type, user_count: 0, permissions: [], is_system: false,
        }
        setRoles(prev => [...prev, newRole])
        showToast(`Đã tạo vai trò "${form.name}"`)
        setShowModal(false)
    }

    const totalUsers = roles.reduce((s, r) => s + r.user_count, 0)

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Phân Quyền & Vai Trò</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Quản lý vai trò, phân quyền context-aware (RBAC) trong hệ thống.</p>
                </div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => { setForm({ name: '', code: '', description: '', scope_type: 'CLUB' }); setShowModal(true) }}>Tạo Vai Trò</VCT_Button>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Vai trò', value: roles.length, icon: <VCT_Icons.Shield size={18} />, color: '#8b5cf6' },
                { label: 'Người dùng', value: totalUsers.toLocaleString(), icon: <VCT_Icons.Users size={18} />, color: '#0ea5e9' },
                { label: 'Quyền HT', value: PERMISSIONS.length, icon: <VCT_Icons.ShieldCheck size={18} />, color: '#10b981' },
                { label: 'Tùy chỉnh', value: roles.filter(r => !r.is_system).length, icon: <VCT_Icons.Settings size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-8" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── ROLES LIST ── */}
                <div className="lg:col-span-1">
                    <div className="mb-4">
                        <VCT_SearchInput placeholder="Tìm vai trò..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                    </div>
                    <div className="space-y-2">
                        {filtered.map(role => (
                            <div key={role.id}
                                onClick={() => setSelectedRole(role)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedRole?.id === role.id
                                    ? 'bg-[var(--vct-accent-cyan)]/10 border-[var(--vct-accent-cyan)]'
                                    : 'bg-[var(--vct-bg-elevated)] border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)]'
                                    }`}>
                                <div className="flex items-center justify-between mb-1">
                                    <div className="font-bold text-sm text-[var(--vct-text-primary)]">{role.name}</div>
                                    {role.is_system && <VCT_Badge type="info" text="Hệ thống" />}
                                </div>
                                <div className="text-[11px] font-mono text-[var(--vct-accent-cyan)] mb-1">{role.code}</div>
                                <div className="text-[11px] text-[var(--vct-text-tertiary)]">{role.description}</div>
                                <div className="flex items-center gap-3 mt-2 text-[10px] text-[var(--vct-text-tertiary)]">
                                    <span className="flex items-center gap-1"><VCT_Icons.Users size={10} /> {role.user_count} người</span>
                                    <span className="flex items-center gap-1"><VCT_Icons.Shield size={10} /> {role.permissions.length} quyền</span>
                                    <span className="flex items-center gap-1"><VCT_Icons.Layers size={10} /> {SCOPE_LABELS[role.scope_type]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── PERMISSION MATRIX ── */}
                <div className="lg:col-span-2">
                    {selectedRole ? (
                        <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="font-bold text-lg text-[var(--vct-text-primary)]">Ma Trận Phân Quyền</h2>
                                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Vai trò: <span className="font-bold text-[var(--vct-accent-cyan)]">{selectedRole.name}</span></p>
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-[var(--vct-text-tertiary)]">
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded bg-[#10b981]"></div> Được phép
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-3 h-3 rounded bg-[var(--vct-border-strong)]"></div> Không
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {Object.entries(permissionModules).map(([module, perms]) => (
                                    <div key={module}>
                                        <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--vct-text-tertiary)] mb-3 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[var(--vct-accent-cyan)]"></div>
                                            {module}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {perms.map(perm => {
                                                const hasPermission = selectedRole.permissions.includes(perm.key)
                                                return (
                                                    <button key={perm.key}
                                                        onClick={() => togglePermission(selectedRole.id, perm.key)}
                                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${hasPermission
                                                            ? 'bg-[#10b98115] border-[#10b98140] hover:border-[#10b981]'
                                                            : 'bg-[var(--vct-bg-base)] border-[var(--vct-border-subtle)] hover:border-[var(--vct-border-strong)]'
                                                            }`}>
                                                        <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${hasPermission ? 'bg-[#10b981] text-white' : 'bg-[var(--vct-border-strong)]'}`}>
                                                            {hasPermission && <VCT_Icons.Check size={12} />}
                                                        </div>
                                                        <div>
                                                            <div className="text-sm font-semibold text-[var(--vct-text-primary)]">{perm.label}</div>
                                                            <div className="text-[10px] font-mono text-[var(--vct-text-tertiary)]">{perm.key}</div>
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] rounded-2xl p-12 text-center">
                            <VCT_Icons.Shield size={48} className="text-[var(--vct-text-tertiary)] mx-auto mb-4" />
                            <div className="text-[var(--vct-text-secondary)]">Chọn một vai trò để xem ma trận phân quyền</div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── CREATE ROLE MODAL ── */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo vai trò mới" width="500px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleCreateRole}>Tạo vai trò</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên vai trò *"><VCT_Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="VD: Giám sát kỹ thuật" /></VCT_Field>
                    <VCT_Field label="Mã vai trò *"><VCT_Input value={form.code} onChange={(e: any) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VD: TECH_SUPERVISOR" /></VCT_Field>
                    <VCT_Field label="Mô tả"><VCT_Input value={form.description} onChange={(e: any) => setForm({ ...form, description: e.target.value })} placeholder="Mô tả ngắn gọn vai trò" /></VCT_Field>
                </VCT_Stack>
            </VCT_Modal>
        </VCT_PageContainer>
    )
}
