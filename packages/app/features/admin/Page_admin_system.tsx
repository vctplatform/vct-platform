'use client'

import * as React from 'react'
import { useState, useCallback } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_PageContainer, VCT_StatRow, VCT_Modal, VCT_Input, VCT_Field,
    VCT_ConfirmDialog
} from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_Drawer } from '../components/VCT_Drawer'
import { VCT_Timeline } from '../components/VCT_Timeline'
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
    unit: string
    description: string
}

const INITIAL_CONFIG_PARAMS: ConfigParam[] = [
    { key: 'session.timeout', value: '3600', unit: 'giây', description: 'Thời gian hết hạn session' },
    { key: 'scoring.max_judges', value: '7', unit: '', description: 'Số giám khảo tối đa chấm quyền thuật' },
    { key: 'scoring.drop_highest', value: 'true', unit: '', description: 'Bỏ điểm cao nhất khi tổng hợp' },
    { key: 'scoring.drop_lowest', value: 'true', unit: '', description: 'Bỏ điểm thấp nhất khi tổng hợp' },
    { key: 'registration.deadline_hours', value: '48', unit: 'giờ', description: 'Hạn đăng ký trước giải' },
    { key: 'weigh_in.tolerance_kg', value: '0.5', unit: 'kg', description: 'Sai số cho phép khi cân' },
    { key: 'ranking.elo_k_factor', value: '32', unit: '', description: 'K-Factor cho ELO rating' },
    { key: 'upload.max_size_mb', value: '50', unit: 'MB', description: 'Kích thước upload tối đa' },
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
    <div className="p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
        <div className="h-3 w-20 bg-[var(--vct-bg-elevated)] rounded animate-pulse mb-2" />
        <div className="h-5 w-16 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
    </div>
)

const SkeletonMetricGrid = ({ title, color }: { title: string; color: string }) => (
    <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5">
        <h3 className="font-bold text-[var(--vct-text-primary)] mb-4 flex items-center gap-2" style={{ color }}>
            <div className="w-[18px] h-[18px] bg-[var(--vct-bg-card)] rounded animate-pulse" /> {title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => <SkeletonMetricCard key={i} />)}
        </div>
    </div>
)

const SkeletonConfigRow = () => (
    <tr>
        <td className="p-3"><div className="h-4 w-28 bg-[var(--vct-bg-elevated)] rounded animate-pulse" /></td>
        <td className="p-3"><div className="h-4 w-16 bg-[var(--vct-bg-elevated)] rounded animate-pulse" /></td>
        <td className="p-3"><div className="h-4 w-40 bg-[var(--vct-bg-elevated)] rounded animate-pulse" /></td>
        <td className="p-3"><div className="h-4 w-6 bg-[var(--vct-bg-elevated)] rounded animate-pulse" /></td>
    </tr>
)

const SkeletonBackupItem = () => (
    <div className="flex items-center justify-between p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
        <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-[var(--vct-bg-elevated)] animate-pulse" />
            <div className="space-y-1">
                <div className="h-4 w-32 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
                <div className="h-3 w-20 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
            </div>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-5 w-16 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
            <div className="h-8 w-8 bg-[var(--vct-bg-elevated)] rounded animate-pulse" />
        </div>
    </div>
)

// ════════════════════════════════════════
// METRIC CARD COMPONENT
// ════════════════════════════════════════
const MetricGrid = ({ title, icon, metrics, color }: { title: string; icon: React.ReactNode; metrics: typeof DB_METRICS; color: string }) => (
    <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-5">
        <h3 className="font-bold text-[var(--vct-text-primary)] mb-4 flex items-center gap-2" style={{ color }}>
            {icon} {title}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            {metrics.map(m => (
                <div key={m.label} className="p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
                    <div className="text-[10px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">{m.label}</div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]"></div>
                        <span className="font-black text-sm text-[var(--vct-text-primary)]">{m.value}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
)

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_admin_system = () => {
    const [configParams, setConfigParams] = useState(INITIAL_CONFIG_PARAMS)
    const [backups, setBackups] = useState(INITIAL_BACKUP_HISTORY)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showEditModal, setShowEditModal] = useState(false)
    const [editingParam, setEditingParam] = useState<ConfigParam | null>(null)
    const [editValue, setEditValue] = useState('')
    const [confirmBackup, setConfirmBackup] = useState(false)
    const [confirmClearCache, setConfirmClearCache] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [drawerParam, setDrawerParam] = useState<ConfigParam | null>(null)

    React.useEffect(() => {
        const t = setTimeout(() => setIsLoading(false), 800)
        return () => clearTimeout(t)
    }, [])

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    const handleEditParam = (param: ConfigParam) => {
        setEditingParam(param)
        setEditValue(param.value)
        setShowEditModal(true)
    }

    const handleSaveParam = () => {
        if (!editingParam) return
        setConfigParams(prev => prev.map(p => p.key === editingParam.key ? { ...p, value: editValue } : p))
        showToast(`Đã cập nhật "${editingParam.key}" = ${editValue}`)
        setShowEditModal(false)
    }

    const handleBackup = () => {
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

    const handleClearCache = () => {
        showToast('Đã xóa cache Redis thành công!', 'warning')
        setConfirmClearCache(false)
    }

    const handleDownloadBackup = (backup: typeof INITIAL_BACKUP_HISTORY[0]) => {
        showToast(`Đang tải backup ${backup.id} (${backup.size})...`)
    }

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Cấu Hình & Giám Sát Hệ Thống</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Giám sát cơ sở hạ tầng, tham số cấu hình và quản lý backup.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => setConfirmBackup(true)}>Tạo Backup</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.RotateCcw size={16} />} onClick={() => setConfirmClearCache(true)}>Xóa Cache</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />} onClick={() => {
                        const header = 'Key,Giá trị,Đơn vị,Mô tả'
                        const csv = [header, ...configParams.map(p => `${p.key},${p.value},${p.unit},"${p.description}"`)].join('\n')
                        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
                        const url = URL.createObjectURL(blob)
                        const a = document.createElement('a'); a.href = url; a.download = `vct_config_${new Date().toISOString().slice(0, 10)}.csv`; a.click()
                        URL.revokeObjectURL(url)
                    }}>Xuất CSV</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <VCT_StatRow items={[
                { label: 'Uptime', value: '99.98%', icon: <VCT_Icons.Activity size={18} />, color: '#10b981' },
                { label: 'CPU', value: '23%', icon: <VCT_Icons.Laptop size={18} />, color: '#0ea5e9' },
                { label: 'Memory', value: '4.2/8 GB', icon: <VCT_Icons.Layers size={18} />, color: '#f59e0b' },
                { label: 'Disk', value: '22/100 GB', icon: <VCT_Icons.Settings size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-8" />

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
            <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6 mb-8">
                <h2 className="font-bold text-lg text-[var(--vct-text-primary)] mb-4 flex items-center gap-2">
                    <VCT_Icons.Settings size={20} className="text-[#8b5cf6]" /> Tham Số Cấu Hình
                </h2>
                <div className="overflow-hidden rounded-xl border border-[var(--vct-border-subtle)]">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-[var(--vct-bg-card)] text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold">
                                <th className="p-3 text-left">Key</th>
                                <th className="p-3 text-left">Giá trị</th>
                                <th className="p-3 text-left">Mô tả</th>
                                <th className="p-3 w-12"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--vct-border-subtle)]">
                            {isLoading ? (
                                [...Array(5)].map((_, i) => <SkeletonConfigRow key={i} />)
                            ) : (
                                configParams.map(param => (
                                    <tr key={param.key} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setDrawerParam(param)}>
                                        <td className="p-3 font-mono text-xs font-bold text-[var(--vct-accent-cyan)]">{param.key}</td>
                                        <td className="p-3">
                                            <span className="font-bold text-sm text-[var(--vct-text-primary)]">{param.value}</span>
                                            {param.unit && <span className="text-[10px] text-[var(--vct-text-tertiary)] ml-1">{param.unit}</span>}
                                        </td>
                                        <td className="p-3 text-sm text-[var(--vct-text-secondary)]">{param.description}</td>
                                        <td className="p-3">
                                            <button
                                                type="button"
                                                onClick={() => handleEditParam(param)}
                                                className="p-1 text-[var(--vct-text-tertiary)] hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-white/10"
                                            >
                                                <VCT_Icons.Edit size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── BACKUP HISTORY ── */}
            <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-strong)] rounded-2xl p-6">
                <h2 className="font-bold text-lg text-[var(--vct-text-primary)] mb-4 flex items-center gap-2">
                    <VCT_Icons.Download size={20} className="text-[#10b981]" /> Lịch Sử Backup
                </h2>
                <div className="space-y-2">
                    {isLoading ? (
                        [...Array(4)].map((_, i) => <SkeletonBackupItem key={i} />)
                    ) : (
                        backups.map(bk => (
                            <div key={bk.id} className="flex items-center justify-between p-3 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]"></div>
                                    <div>
                                        <div className="font-semibold text-sm text-[var(--vct-text-primary)]">{bk.time}</div>
                                        <div className="text-[11px] text-[var(--vct-text-tertiary)]">{bk.type} • {bk.size}</div>
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
            <VCT_Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Chỉnh sửa tham số" width="450px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowEditModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSaveParam}>Lưu thay đổi</VCT_Button>
                </>
            }>
                {editingParam && (
                    <VCT_Stack gap={16}>
                        <div>
                            <div className="text-[11px] uppercase tracking-wider text-[var(--vct-text-tertiary)] font-bold mb-1">Key</div>
                            <div className="font-mono text-sm text-[var(--vct-accent-cyan)]">{editingParam.key}</div>
                        </div>
                        <div>
                            <div className="text-[11px] text-[var(--vct-text-secondary)] mb-2">{editingParam.description}</div>
                        </div>
                        <VCT_Field label={`Giá trị${editingParam.unit ? ` (${editingParam.unit})` : ''}`}>
                            <VCT_Input value={editValue} onChange={(e: any) => setEditValue(e.target.value)} />
                        </VCT_Field>
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
                        <div className="pb-4 border-b border-[var(--vct-border-subtle)]">
                            <div className="font-mono text-lg font-bold text-[var(--vct-accent-cyan)]">{drawerParam.key}</div>
                            <p className="text-sm text-[var(--vct-text-secondary)] mt-1">{drawerParam.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
                                <div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Giá trị hiện tại</div>
                                <div className="text-2xl font-black text-[var(--vct-text-primary)]">{drawerParam.value}<span className="text-xs text-[var(--vct-text-tertiary)] ml-1">{drawerParam.unit}</span></div>
                            </div>
                            <div className="p-4 bg-[var(--vct-bg-base)] rounded-xl border border-[var(--vct-border-subtle)]">
                                <div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-1">Loại</div>
                                <div className="text-sm font-semibold text-[var(--vct-text-primary)]">{drawerParam.value === 'true' || drawerParam.value === 'false' ? 'Boolean' : isNaN(Number(drawerParam.value)) ? 'String' : 'Number'}</div>
                            </div>
                        </div>
                        <div>
                            <div className="text-[10px] uppercase text-[var(--vct-text-tertiary)] mb-2">Lịch sử thay đổi</div>
                            <VCT_Timeline events={[
                                { time: '10/03/2024 08:00', title: `Giá trị hiện tại: ${drawerParam.value}`, description: 'admin@vct.vn cập nhật', icon: <VCT_Icons.Edit size={14} />, color: '#0ea5e9' },
                                { time: '01/03/2024 09:30', title: 'Giá trị trước: —', description: 'Thiết lập ban đầu', icon: <VCT_Icons.Plus size={14} />, color: '#10b981' },
                            ] as TimelineEvent[]} maxHeight={180} />
                        </div>
                        <div className="flex gap-3 pt-4 border-t border-[var(--vct-border-subtle)]">
                            <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.Edit size={14} />} onClick={() => { handleEditParam(drawerParam); setDrawerParam(null) }}>Chỉnh sửa</VCT_Button>
                        </div>
                    </div>
                )}
            </VCT_Drawer>
        </VCT_PageContainer>
    )
}
