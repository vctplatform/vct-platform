'use client'

import * as React from 'react'
import { useState, useMemo } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_Modal, VCT_Input, VCT_Field,
    VCT_ConfirmDialog
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { VCT_Timeline } from '../components/VCT_Timeline'
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { exportToCSV } from './utils/adminExport'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminGuard } from './components/AdminGuard'
import './admin.module.css'
import type { TimelineEvent } from '../components/VCT_Timeline'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const DB_METRICS = [
    { label: 'Active Connections', value: '24 / 100', status: 'ok' },
    { label: 'Query Latency (P95)', value: '12ms', status: 'ok' },
    { label: 'DB Size', value: '2.4 GB', status: 'ok' },
    { label: 'Replication Lag', value: '0ms', status: 'ok' },
]

const CACHE_METRICS = [
    { label: 'Hit Rate', value: '94.2%', status: 'ok' },
    { label: 'Memory Usage', value: '256 MB / 1 GB', status: 'ok' },
    { label: 'Keys', value: '12,450', status: 'ok' },
    { label: 'Evictions/min', value: '3', status: 'ok' },
]

const QUEUE_METRICS = [
    { label: 'Pending Messages', value: '12', status: 'ok' },
    { label: 'Consumers', value: '4', status: 'ok' },
    { label: 'Msg/sec (in)', value: '85', status: 'ok' },
    { label: 'Msg/sec (out)', value: '82', status: 'ok' },
]

const STORAGE_METRICS = [
    { label: 'Total Files', value: '45,200', status: 'ok' },
    { label: 'Used Space', value: '18.5 GB / 100 GB', status: 'ok' },
    { label: 'Upload Speed', value: '12 MB/s', status: 'ok' },
    { label: 'CDN Bandwidth', value: '2.1 TB (tháng)', status: 'ok' },
]

interface ConfigParam {
    key: string
    value: string
    defaultValue: string
    unit: string
    description: string
    type: 'number' | 'boolean' | 'string'
    min?: number
    max?: number
    step?: number
}

const INITIAL_CONFIG_PARAMS: ConfigParam[] = [
    { key: 'session.timeout', value: '3600', defaultValue: '3600', unit: 'giây', description: 'Thời gian hết hạn session', type: 'number', min: 300, max: 86400, step: 300 },
    { key: 'scoring.max_judges', value: '7', defaultValue: '7', unit: '', description: 'Số giám khảo tối đa chấm quyền thuật', type: 'number', min: 3, max: 15, step: 2 },
    { key: 'scoring.drop_highest', value: 'true', defaultValue: 'true', unit: '', description: 'Bỏ điểm cao nhất khi tổng hợp', type: 'boolean' },
    { key: 'scoring.drop_lowest', value: 'true', defaultValue: 'true', unit: '', description: 'Bỏ điểm thấp nhất khi tổng hợp', type: 'boolean' },
    { key: 'registration.deadline_hours', value: '48', defaultValue: '48', unit: 'giờ', description: 'Hạn đăng ký trước giải', type: 'number', min: 1, max: 168, step: 1 },
    { key: 'weigh_in.tolerance_kg', value: '0.5', defaultValue: '0.5', unit: 'kg', description: 'Sai số cho phép khi cân', type: 'number', min: 0.1, max: 2.0, step: 0.1 },
    { key: 'ranking.elo_k_factor', value: '32', defaultValue: '32', unit: '', description: 'K-Factor cho ELO rating', type: 'number', min: 10, max: 64, step: 2 },
    { key: 'upload.max_size_mb', value: '50', defaultValue: '50', unit: 'MB', description: 'Kích thước upload tối đa', type: 'number', min: 5, max: 500, step: 5 },
]

const INITIAL_BACKUP_HISTORY = [
    { id: 'BK-001', time: '10/03/2024 03:00', size: '2.1 GB', type: 'Tự động', status: 'success' },
    { id: 'BK-002', time: '09/03/2024 03:00', size: '2.0 GB', type: 'Tự động', status: 'success' },
    { id: 'BK-003', time: '08/03/2024 15:30', size: '2.0 GB', type: 'Thủ công', status: 'success' },
    { id: 'BK-004', time: '08/03/2024 03:00', size: '1.9 GB', type: 'Tự động', status: 'success' },
]

// ════════════════════════════════════════
// SKELETON COMPONENTS
// ════════════════════════════════════════
const SkeletonMetricCard = () => (
    <div className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
        <div className="h-3 w-20 bg-(--vct-bg-elevated) rounded animate-pulse mb-2" />
        <div className="h-5 w-16 bg-(--vct-bg-elevated) rounded animate-pulse" />
    </div>
)

const SkeletonMetricGrid = ({ title, color }: { title: string; color: string }) => (
    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
        <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2" style={{ color }}>
            <div className="w-[18px] h-[18px] bg-(--vct-bg-card) rounded animate-pulse" /> {title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
    </div>
)


const SkeletonBackupItem = () => (
    <div className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
        <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-(--vct-bg-elevated) animate-pulse" />
            <div className="space-y-1">
                <div className="h-4 w-32 bg-(--vct-bg-elevated) rounded animate-pulse" />
                <div className="h-3 w-20 bg-(--vct-bg-elevated) rounded animate-pulse" />
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-5 w-16 bg-(--vct-bg-elevated) rounded animate-pulse" />
            <div className="h-8 w-8 bg-(--vct-bg-elevated) rounded animate-pulse" />
        </div>
    </div>
)

// ════════════════════════════════════════
// METRIC CARD COMPONENT
// ════════════════════════════════════════
const MetricGrid = ({ title, icon, metrics, color }: { title: string; icon: React.ReactNode; metrics: typeof DB_METRICS; color: string }) => (
    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
        <h3 className="font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2" style={{ color }}>
            {icon} {title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {metrics.map(m => (
                <div key={m.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{m.label}</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]"></div>
                        <span className="font-black text-sm text-(--vct-text-primary)">{m.value}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
// Add GlobalStyle helper to style the table hover states when using AdminDataTable
const GlobalStyle = () => (
    <React.Fragment>
        <style dangerouslySetInnerHTML={{ __html: `
            .admin-table-row:hover .admin-row-action {
                opacity: 1 !important;
            }
            .admin-row-action {
                opacity: 0;
                transition: opacity 0.2s ease;
            }
        `}} />
    </React.Fragment>
)

export const Page_admin_system = () => (
    <AdminGuard>
        <Page_admin_system_Content />
    </AdminGuard>
)

const Page_admin_system_Content = () => {
    const [configParams, setConfigParams] = useState(INITIAL_CONFIG_PARAMS)
    const [backups, setBackups] = useState(INITIAL_BACKUP_HISTORY)
    const { showToast } = useShellToast()
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingParam, setEditingParam] = useState<ConfigParam | null>(null)
    const [editValue, setEditValue] = useState('')
    const [editError, setEditError] = useState('')
    const [confirmBackup, setConfirmBackup] = useState(false)
    const [confirmClearCache, setConfirmClearCache] = useState(false)
    const [confirmReset, setConfirmReset] = useState<ConfigParam | null>(null)
    const { isLoading } = useAdminFetch<null>('/admin/system/config', { mockData: null })
    const [drawerParam, setDrawerParam] = useState<ConfigParam | null>(null)
    const [search, setSearch] = useState('')
    const [sortCol, setSortCol] = useState<string>('key')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
    const currentEnv = 'development' as 'development' | 'staging' | 'production'

    const filteredParams = useMemo(() => {
        let filtered = configParams
        if (search) {
            const q = search.toLowerCase()
            filtered = filtered.filter(p => p.key.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
        }

        return [...filtered].sort((a, b) => {
            const valA = String((a as any)[sortCol] || '').toLowerCase()
            const valB = String((b as any)[sortCol] || '').toLowerCase()
            return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
        })
    }, [configParams, search, sortCol, sortDir])

    const handleSort = (key: string) => {
        if (sortCol === key) {
            setSortDir(d => d === 'asc' ? 'desc' : 'asc')
        } else {
            setSortCol(key)
            setSortDir('asc')
        }
    }

    const modifiedCount = useMemo(() => configParams.filter(p => p.value !== p.defaultValue).length, [configParams])

    const validateValue = (param: ConfigParam, val: string): string => {
        if (param.type === 'boolean') return ''
        if (param.type === 'number') {
            const num = Number(val)
            if (isNaN(num)) return 'Giá trị phải là số'
            if (param.min !== undefined && num < param.min) return `Tối thiểu: ${param.min}`
            if (param.max !== undefined && num > param.max) return `Tối đa: ${param.max}`
        }
        if (!val.trim()) return 'Giá trị không được để trống'
        return ''
    }

    const handleEditParam = (param: ConfigParam) => {
        setEditingParam(param)
        setEditValue(param.value)
        setEditError('')
        setShowEditModal(true)
    }

    const { mutate: mutateConfig } = useAdminMutation<ConfigParam, { key: string; value: string }>(
        '/admin/system/config',
        { method: 'PATCH', onError: () => showToast('Lỗi API, đã cập nhật cục bộ', 'warning') }
    )
    const { mutate: mutateBackup } = useAdminMutation<void>(
        '/admin/system/backup',
        { method: 'POST', onError: () => showToast('Lỗi API, backup giả lập', 'warning') }
    )
    const { mutate: mutateClearCache } = useAdminMutation<void>(
        '/admin/system/cache/clear',
        { method: 'POST', onError: () => showToast('Lỗi API, đã xóa cache cục bộ', 'warning') }
    )

    const handleSaveParam = async () => {
        if (!editingParam) return
        const err = validateValue(editingParam, editValue)
        if (err) { setEditError(err); return }
        await mutateConfig({ key: editingParam.key, value: editValue })
        setConfigParams(prev => prev.map(p => p.key === editingParam.key ? { ...p, value: editValue } : p))
        showToast(`Đã cập nhật "${editingParam.key}" = ${editValue}`)
        setShowEditModal(false)
    }

    const handleResetParam = async (param: ConfigParam) => {
        await mutateConfig({ key: param.key, value: param.defaultValue })
        setConfigParams(prev => prev.map(p => p.key === param.key ? { ...p, value: p.defaultValue } : p))
        showToast(`Đã khôi phục "${param.key}" về mặc định: ${param.defaultValue}`)
        setConfirmReset(null)
        if (drawerParam?.key === param.key) {
            setDrawerParam(prev => prev ? { ...prev, value: param.defaultValue } : null)
        }
    }

    const handleBackup = async () => {
        await mutateBackup()
        const newBackup = {
            id: `BK-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
            time: new Date().toLocaleString('vi-VN'),
            size: '2.1 GB',
            type: 'Thủ công',
            status: 'success',
        }
        setBackups(prev => [newBackup, ...prev])
        showToast('Đã tạo backup thành công!')
        setConfirmBackup(false)
    }

    const handleClearCache = async () => {
        await mutateClearCache()
        showToast('Đã xóa cache Redis thành công!', 'warning')
        setConfirmClearCache(false)
    }

    const handleDownloadBackup = (backup: typeof INITIAL_BACKUP_HISTORY[0]) => {
        showToast(`Đang tải backup ${backup.id} (${backup.size})...`)
    }

    const sysStats: StatItem[] = [
        { label: 'Uptime', value: '99.98%', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
        { label: 'CPU', value: '23%', icon: <VCT_Icons.Laptop size={18} />, color: '#0ea5e9' },
        { label: 'Memory', value: '4.2/8 GB', icon: <VCT_Icons.Layers size={18} />, color: '#f59e0b' },
        { label: 'Disk', value: '22/100 GB', icon: <VCT_Icons.Settings size={18} />, color: '#8b5cf6' },
    ]

    return (
        <AdminPageShell
            title="Cấu Hình & Giám Sát Hệ Thống"
            subtitle="Giám sát cơ sở hạ tầng, tham số cấu hình và quản lý backup."
            icon={<VCT_Icons.Settings size={28} className="text-[#8b5cf6]" />}
            stats={sysStats}
            actions={
                <VCT_Stack direction="row" gap={12} className="flex-wrap">
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => setConfirmBackup(true)}>Tạo Backup</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.RotateCcw size={16} />} onClick={() => setConfirmClearCache(true)}>Xóa Cache</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                        exportToCSV({
                            headers: ['Key', 'Giá trị', 'Mặc định', 'Đơn vị', 'Loại', 'Mô tả'],
                            rows: configParams.map(p => [p.key, p.value, p.defaultValue, p.unit, p.type, p.description]),
                            filename: `vct_config_${new Date().toISOString().slice(0, 10)}.csv`,
                        })
                        showToast('Đã xuất cấu hình!')
                    }}>Xuất CSV</VCT_Button>
                </VCT_Stack>
            }
        >

            {/* ── ENVIRONMENT BADGE ── */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-xs text-(--vct-text-tertiary)">Môi trường:</span>
                <VCT_Badge
                    type={currentEnv === 'production' ? 'danger' : currentEnv === 'staging' ? 'warning' : 'info'}
                    text={currentEnv === 'production' ? 'PRODUCTION' : currentEnv === 'staging' ? 'STAGING' : 'DEVELOPMENT'}
                />
            </div>



            {/* ── INFRASTRUCTURE METRICS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {isLoading ? (
                    <>
                        <SkeletonMetricGrid title="PostgreSQL Database" color="#0ea5e9" />
                        <SkeletonMetricGrid title="Redis Cache" color="#ef4444" />
                        <SkeletonMetricGrid title="NATS Message Queue" color="#10b981" />
                        <SkeletonMetricGrid title="Object Storage" color="#f59e0b" />
                    </>
                ) : (
                    <>
                        <MetricGrid title="PostgreSQL Database" icon={<VCT_Icons.Layers size={18} />} metrics={DB_METRICS} color="#0ea5e9" />
                        <MetricGrid title="Redis Cache" icon={<VCT_Icons.Activity size={18} />} metrics={CACHE_METRICS} color="#ef4444" />
                        <MetricGrid title="NATS Message Queue" icon={<VCT_Icons.Star size={18} />} metrics={QUEUE_METRICS} color="#10b981" />
                        <MetricGrid title="Object Storage" icon={<VCT_Icons.Image size={18} />} metrics={STORAGE_METRICS} color="#f59e0b" />
                    </>
                )}
            </div>

            {/* ── CONFIG PARAMS ── */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-bold text-lg text-(--vct-text-primary) flex items-center gap-2">
                        <VCT_Icons.Settings size={20} className="text-[#8b5cf6]" /> Tham Số Cấu Hình
                    </h2>
                    {modifiedCount > 0 && (
                        <VCT_Badge type="warning" text={`${modifiedCount} đã thay đổi`} />
                    )}
                </div>

                {/* CONFIG SEARCH */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tìm theo key hoặc mô tả..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full px-3 py-2 bg-(--vct-bg-base) border border-(--vct-border-subtle) rounded-lg text-sm text-(--vct-text-primary) placeholder:text-(--vct-text-tertiary) focus:outline-none focus:border-(--vct-accent-cyan)"
                    />
                </div>

                <GlobalStyle />
                <AdminDataTable
                    data={filteredParams}
                    isLoading={isLoading}
                    sortBy={sortCol}
                    sortDir={sortDir}
                    onSort={handleSort}
                    rowKey={p => p.key}
                    emptyTitle="Không tìm thấy tham số"
                    emptyDescription="Thử từ khóa khác"
                    emptyIcon="⚙️"
                    columns={[
                        {
                            key: 'key',
                            label: 'Key',
                            sortable: true,
                            render: (p) => <div className="font-mono text-xs font-bold text-(--vct-accent-cyan)">{p.key}</div>
                        },
                        {
                            key: 'value',
                            label: 'Giá trị',
                            sortable: true,
                            render: (p) => (
                                <div>
                                    <span className={`font-bold text-sm ${p.value !== p.defaultValue ? 'text-[#f59e0b]' : 'text-(--vct-text-primary)'}`}>{p.value}</span>
                                    {p.unit && <span className="text-[10px] text-(--vct-text-tertiary) ml-1">{p.unit}</span>}
                                    {p.value !== p.defaultValue && <span className="text-[9px] text-(--vct-text-tertiary) block mt-0.5">(mặc định: {p.defaultValue})</span>}
                                </div>
                            )
                        },
                        {
                            key: 'description',
                            label: 'Mô tả',
                            sortable: true,
                            hideMobile: true,
                            render: (p) => <div className="text-sm text-(--vct-text-secondary)">{p.description}</div>
                        },
                        {
                            key: '_actions',
                            label: '',
                            align: 'right',
                            sortable: false,
                            render: (p) => (
                                <div onClick={(e) => { e.stopPropagation(); handleEditParam(p) }} className="hover:bg-white/10 p-1 rounded inline-flex cursor-pointer text-(--vct-text-tertiary) hover:text-white transition-colors">
                                    <VCT_Icons.Edit size={14} />
                                </div>
                            )
                        }
                    ]}
                    onRowClick={setDrawerParam}
                />
            </div>

            {/* ── BACKUP HISTORY ── */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                <h2 className="font-bold text-lg text-(--vct-text-primary) mb-4 flex items-center gap-2">
                    <VCT_Icons.Download size={20} className="text-[#10b981]" /> Lịch Sử Backup
                </h2>
                <div className="space-y-2">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <SkeletonBackupItem key={i} />)
                    ) : (
                        backups.map(bk => (
                            <div key={bk.id} className="flex items-center justify-between p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) hover:border-(--vct-accent-cyan) transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]"></div>
                                    <div>
                                        <div className="font-semibold text-sm text-(--vct-text-primary)">{bk.time}</div>
                                        <div className="text-[11px] text-(--vct-text-tertiary)">{bk.type} • {bk.size}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <VCT_Badge text="Thành công" type="success" />
                                    <VCT_Button variant="ghost" size="sm" icon={<VCT_Icons.Download size={14} />} onClick={() => handleDownloadBackup(bk)} />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── EDIT CONFIG MODAL ── */}
            <VCT_Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa tham số" width="480px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowEditModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSaveParam} disabled={!!editError}>Lưu thay đổi</VCT_Button>
                </>
            }>
                {editingParam && (
                    <VCT_Stack gap={16}>
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">Key</div>
                            <div className="font-mono text-sm text-(--vct-accent-cyan)">{editingParam.key}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-(--vct-text-secondary) mb-1">{editingParam.description}</div>
                            <div className="text-[10px] text-(--vct-text-tertiary)">
                                Loại: <span className="font-bold uppercase">{editingParam.type}</span>
                                {editingParam.min !== undefined && ` · Min: ${editingParam.min}`}
                                {editingParam.max !== undefined && ` · Max: ${editingParam.max}`}
                                {editingParam.defaultValue && ` · Mặc định: ${editingParam.defaultValue}`}
                            </div>
                        </div>

                        {/* Type-aware input */}
                        {editingParam.type === 'boolean' ? (
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setEditValue(editValue === 'true' ? 'false' : 'true')}
                                    aria-label={`Chuyển đổi ${editingParam.key}`}
                                    className={`relative w-14 h-7 rounded-full transition-colors ${
                                        editValue === 'true' ? 'bg-[#10b981]' : 'bg-(--vct-bg-base) border border-(--vct-border-strong)'
                                    }`}
                                >
                                    <div className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform ${
                                        editValue === 'true' ? 'translate-x-7' : 'translate-x-0.5'
                                    }`} />
                                </button>
                                <span className={`text-sm font-bold ${editValue === 'true' ? 'text-[#10b981]' : 'text-(--vct-text-tertiary)'}`}>
                                    {editValue === 'true' ? 'BẬT' : 'TẮT'}
                                </span>
                            </div>
                        ) : editingParam.type === 'number' ? (
                            <VCT_Field label={`Giá trị${editingParam.unit ? ` (${editingParam.unit})` : ''}`}>
                                <div className="space-y-2">
                                    <VCT_Input
                                        type="number"
                                        value={editValue}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setEditValue(e.target.value)
                                            setEditError(validateValue(editingParam, e.target.value))
                                        }}
                                        min={editingParam.min}
                                        max={editingParam.max}
                                        step={editingParam.step}
                                    />
                                    {editingParam.min !== undefined && editingParam.max !== undefined && (
                                        <input
                                            type="range"
                                            aria-label={`Phạm vi ${editingParam.key}`}
                                            min={editingParam.min}
                                            max={editingParam.max}
                                            step={editingParam.step}
                                            value={Number(editValue) || editingParam.min}
                                            onChange={e => { setEditValue(e.target.value); setEditError('') }}
                                            className="w-full accent-(--vct-accent-cyan,#0ea5e9)"
                                        />
                                    )}
                                    {editError && <div className="text-xs text-[#ef4444] font-semibold">{editError}</div>}
                                </div>
                            </VCT_Field>
                        ) : (
                            <VCT_Field label="Giá trị">
                                <VCT_Input value={editValue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditValue(e.target.value)} />
                            </VCT_Field>
                        )}

                        {/* Reset to default */}
                        {editingParam.value !== editingParam.defaultValue && (
                            <button
                                type="button"
                                onClick={() => { setEditValue(editingParam.defaultValue); setEditError('') }}
                                className="text-xs text-(--vct-accent-cyan) hover:underline self-start"
                            >↺ Khôi phục mặc định ({editingParam.defaultValue})</button>
                        )}
                    </VCT_Stack>
                )}
            </VCT_Modal>

            {/* ── CONFIRM DIALOGS ── */}
            <VCT_ConfirmDialog
                isOpen={confirmBackup}
                onClose={() => setConfirmBackup(false)}
                onConfirm={handleBackup}
                title="Tạo Backup Thủ Công"
                message="Bạn có chắc muốn tạo backup thủ công ngay bây giờ? Quá trình có thể mất vài phút."
                confirmLabel="Tạo Backup"
            />
            <VCT_ConfirmDialog
                isOpen={confirmClearCache}
                onClose={() => setConfirmClearCache(false)}
                onConfirm={handleClearCache}
                title="Xóa Redis Cache"
                message="Thao tác này sẽ xóa toàn bộ cache. Các request tiếp theo sẽ chậm hơn cho đến khi cache được rebuild. Tiếp tục?"
                confirmLabel="Xóa Cache"
            />

            {/* ── CONFIG DETAIL DRAWER ── */}
            <VCT_Drawer isOpen={!!drawerParam} onClose={() => setDrawerParam(null)} title="Chi tiết tham số" width={480}>
                {drawerParam && (
                    <div className="space-y-5">
                        <div className="pb-4 border-b border-(--vct-border-subtle)">
                            <div className="font-mono text-lg font-bold text-(--vct-accent-cyan)">{drawerParam.key}</div>
                            <p className="text-sm text-(--vct-text-secondary) mt-1">{drawerParam.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Giá trị hiện tại</div>
                                <div className="text-2xl font-black text-(--vct-text-primary)">{drawerParam.value}<span className="text-xs text-(--vct-text-tertiary) ml-1">{drawerParam.unit}</span></div>
                            </div>
                            <div className="p-4 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-1">Loại</div>
                                <div className="text-sm font-semibold text-(--vct-text-primary)">{drawerParam.value === 'true' || drawerParam.value === 'false' ? 'Boolean' : isNaN(Number(drawerParam.value)) ? 'String' : 'Number'}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-(--vct-text-tertiary) mb-2">Lịch sử thay đổi</div>
                            <VCT_Timeline events={[
                                { time: '10/03/2024 08:00', title: `Giá trị hiện tại: ${drawerParam.value}`, description: 'admin@vct.vn cập nhật', icon: <VCT_Icons.Edit size={14} />, color: '#0ea5e9' },
                                { time: '01/03/2024 09:30', title: 'Giá trị trước: —', description: 'Thiết lập ban đầu', icon: <VCT_Icons.Plus size={14} />, color: '#10b981' },
                            ] as TimelineEvent[]} maxHeight={180} />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-(--vct-border-subtle)">
                            <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Edit size={14} />} onClick={() => { handleEditParam(drawerParam); setDrawerParam(null) }}>Chỉnh sửa</VCT_Button>
                            {drawerParam.value !== drawerParam.defaultValue && (
                                <VCT_Button variant="ghost" size="sm" icon={<VCT_Icons.RotateCcw size={14} />} onClick={() => setConfirmReset(drawerParam)}>Khôi phục mặc định</VCT_Button>
                            )}
                        </div>
                    </div>
                )}
            </VCT_Drawer>

            {/* ── CONFIRM RESET DEFAULT ── */}
            <VCT_ConfirmDialog
                isOpen={!!confirmReset}
                onClose={() => setConfirmReset(null)}
                onConfirm={() => confirmReset && handleResetParam(confirmReset)}
                title="Khôi phục mặc định"
                message={`Bạn có chắc muốn khôi phục "${confirmReset?.key}" về giá trị mặc định (${confirmReset?.defaultValue})?`}
                confirmLabel="Khôi phục"
            />
        </AdminPageShell>
    )
}
