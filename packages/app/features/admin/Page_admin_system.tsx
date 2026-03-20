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
import { AdminPageShell, useShellToast } from './components/AdminPageShell'
import { useAdminFetch } from './hooks/useAdminAPI'
import { useAdminMutation } from './hooks/useAdminMutation'
import { exportToCSV } from './utils/adminExport'
import { AdminDataTable } from './components/AdminDataTable'
import { AdminGuard } from './components/AdminGuard'
import { useI18n } from '../i18n'
import './admin.module.css'

// ════════════════════════════════════════
// TYPES (fetched from API)
// ════════════════════════════════════════
interface HealthData {
    status: string
    timestamp: string
    go_version: string
    goroutines: number
    memory: { alloc_mb: number; sys_mb: number; gc_runs: number; heap_objects: number; heap_inuse_mb: number; stack_inuse_mb: number }
    database: Record<string, any>
    cache: Record<string, any>
    realtime: { connected_clients: number }
    storage: { driver: string; provider: string }
}

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
        <h3 className="admin-skeleton-title mb-4" data-color={color}>
            <div className="w-[18px] h-[18px] bg-(--vct-bg-card) rounded animate-pulse" /> {title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
    </div>
)

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

// ════════════════════════════════════════
// METRIC CARD COMPONENT
// ════════════════════════════════════════
interface MetricItem { label: string; value: string | number; status?: string }

const MetricGrid = ({ title, icon, metrics, color }: { title: string; icon: React.ReactNode; metrics: MetricItem[]; color: string }) => (
    <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
        <h3 className="admin-section-title mb-4" data-color={color}>
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
export const Page_admin_system = () => (
    <AdminGuard>
        <Page_admin_system_Content />
    </AdminGuard>
)

const Page_admin_system_Content = () => {
    const { t } = useI18n()
    const [configParams, setConfigParams] = useState<ConfigParam[]>([])
    const { showToast } = useShellToast()
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingParam, setEditingParam] = useState<ConfigParam | null>(null)
    const [editValue, setEditValue] = useState('')
    const [editError, setEditError] = useState('')
    const [confirmBackup, setConfirmBackup] = useState(false)
    const [confirmClearCache, setConfirmClearCache] = useState(false)
    const [confirmReset, setConfirmReset] = useState<ConfigParam | null>(null)
    const [drawerParam, setDrawerParam] = useState<ConfigParam | null>(null)
    const [search, setSearch] = useState('')
    const [sortCol, setSortCol] = useState<string>('key')
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

    // ── Fetch real data from API ──
    const { data: healthData, isLoading: healthLoading } = useAdminFetch<HealthData>('/admin/health')
    const { data: configData, isLoading: configLoading } = useAdminFetch<ConfigParam[]>('/admin/config')

    const isLoading = healthLoading || configLoading

    // Initialize config params from API when available
    React.useEffect(() => {
        if (configData && Array.isArray(configData)) {
            setConfigParams(configData)
        }
    }, [configData])

    // Build metrics from real health data
    const dbMetrics: MetricItem[] = healthData?.database ? [
        { label: 'Status', value: healthData.database.status || 'N/A' },
        { label: 'Open Connections', value: healthData.database.open_connections ?? 'N/A' },
        { label: 'In Use', value: healthData.database.in_use ?? 'N/A' },
        { label: 'Idle', value: healthData.database.idle ?? 'N/A' },
    ] : []

    const memoryMetrics: MetricItem[] = healthData?.memory ? [
        { label: 'Alloc', value: `${healthData.memory.alloc_mb} MB` },
        { label: 'System', value: `${healthData.memory.sys_mb} MB` },
        { label: 'Heap In-Use', value: `${healthData.memory.heap_inuse_mb} MB` },
        { label: 'GC Runs', value: healthData.memory.gc_runs },
    ] : []

    const cacheMetrics: MetricItem[] = healthData?.cache ? Object.entries(healthData.cache).map(([key, value]) => ({
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value: String(value),
    })) : []

    const runtimeMetrics: MetricItem[] = healthData ? [
        { label: 'Goroutines', value: healthData.goroutines },
        { label: 'Go Version', value: healthData.go_version },
        { label: 'WS Clients', value: healthData.realtime.connected_clients },
        { label: 'Storage', value: `${healthData.storage.driver} (${healthData.storage.provider})` },
    ] : []

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
        '/admin/config',
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
        showToast('Đã gửi yêu cầu backup!')
        setConfirmBackup(false)
    }

    const handleClearCache = async () => {
        await mutateClearCache()
        showToast('Đã gửi yêu cầu xóa cache!', 'warning')
        setConfirmClearCache(false)
    }

    const sysStats: StatItem[] = [
        { label: 'Status', value: healthData?.status ?? '—', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
        { label: 'Goroutines', value: healthData?.goroutines ?? '—', icon: <VCT_Icons.Laptop size={18} />, color: '#0ea5e9' },
        { label: 'Memory', value: healthData ? `${healthData.memory.alloc_mb} MB` : '—', icon: <VCT_Icons.Layers size={18} />, color: '#f59e0b' },
        { label: 'Storage', value: healthData?.storage.driver ?? '—', icon: <VCT_Icons.Settings size={18} />, color: '#8b5cf6' },
    ]

    return (
        <AdminPageShell
            title={t('admin.system.title')}
            subtitle={t('admin.system.subtitle')}
            icon={<VCT_Icons.Settings size={28} className="text-[#8b5cf6]" />}
            breadcrumbs={[
                { label: 'Admin', href: '/admin', icon: <VCT_Icons.Home size={14} /> },
                { label: 'Cấu hình Hệ thống' },
            ]}
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
                {healthData && (
                    <span className="text-xs text-(--vct-text-tertiary) ml-2">
                        · {healthData.go_version} · {healthData.storage.driver}/{healthData.storage.provider}
                    </span>
                )}
            </div>

            {/* ── INFRASTRUCTURE METRICS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {isLoading ? (
                    <>
                        <SkeletonMetricGrid title="Database" color="#0ea5e9" />
                        <SkeletonMetricGrid title="Memory" color="#ef4444" />
                        <SkeletonMetricGrid title="Cache" color="#10b981" />
                        <SkeletonMetricGrid title="Runtime" color="#f59e0b" />
                    </>
                ) : healthData ? (
                    <>
                        {dbMetrics.length > 0 && <MetricGrid title="PostgreSQL Database" icon={<VCT_Icons.Layers size={18} />} metrics={dbMetrics} color="#0ea5e9" />}
                        {memoryMetrics.length > 0 && <MetricGrid title="Memory & GC" icon={<VCT_Icons.Activity size={18} />} metrics={memoryMetrics} color="#ef4444" />}
                        {cacheMetrics.length > 0 && <MetricGrid title="Cache" icon={<VCT_Icons.Star size={18} />} metrics={cacheMetrics} color="#10b981" />}
                        {runtimeMetrics.length > 0 && <MetricGrid title="Runtime" icon={<VCT_Icons.Settings size={18} />} metrics={runtimeMetrics} color="#f59e0b" />}
                    </>
                ) : (
                    <div className="md:col-span-2 text-center text-(--vct-text-tertiary) py-12 bg-(--vct-bg-elevated) rounded-2xl border border-(--vct-border-strong)">
                        <VCT_Icons.Info size={32} className="mx-auto mb-3 opacity-50" />
                        <div className="text-sm font-semibold">Không thể kết nối backend</div>
                        <div className="text-xs mt-1">Khởi động Go backend để xem metrics thực tế.</div>
                    </div>
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
                {configParams.length === 0 && !isLoading ? (
                    <div className="text-center text-(--vct-text-tertiary) py-8 text-sm">
                        <VCT_Icons.Settings size={24} className="mx-auto mb-2 opacity-50" />
                        Chưa có cấu hình. Dữ liệu sẽ được tải từ backend.
                    </div>
                ) : (
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
                        onRowClick={(item) => setDrawerParam(item)}
                    />
                )}
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
                title="Xóa Cache"
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
                                <div className="text-sm font-semibold text-(--vct-text-primary)">{drawerParam.type}</div>
                            </div>
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
