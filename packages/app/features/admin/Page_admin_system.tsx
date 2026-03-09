'use client'

import * as React from 'react'
import { VCT_KpiCard, VCT_Badge, VCT_Button, VCT_Stack } from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

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

const CONFIG_PARAMS = [
    { key: 'session.timeout', value: '3600', unit: 'giây', description: 'Thời gian hết hạn session' },
    { key: 'scoring.max_judges', value: '7', unit: '', description: 'Số giám khảo tối đa chấm quyền thuật' },
    { key: 'scoring.drop_highest', value: 'true', unit: '', description: 'Bỏ điểm cao nhất khi tổng hợp' },
    { key: 'scoring.drop_lowest', value: 'true', unit: '', description: 'Bỏ điểm thấp nhất khi tổng hợp' },
    { key: 'registration.deadline_hours', value: '48', unit: 'giờ', description: 'Hạn đăng ký trước giải' },
    { key: 'weigh_in.tolerance_kg', value: '0.5', unit: 'kg', description: 'Sai số cho phép khi cân' },
    { key: 'ranking.elo_k_factor', value: '32', unit: '', description: 'K-Factor cho ELO rating' },
    { key: 'upload.max_size_mb', value: '50', unit: 'MB', description: 'Kích thước upload tối đa' },
]

const BACKUP_HISTORY = [
    { id: 'BK-001', time: '10/03/2024 03:00', size: '2.1 GB', type: 'Tự động', status: 'success' },
    { id: 'BK-002', time: '09/03/2024 03:00', size: '2.0 GB', type: 'Tự động', status: 'success' },
    { id: 'BK-003', time: '08/03/2024 15:30', size: '2.0 GB', type: 'Thủ công', status: 'success' },
    { id: 'BK-004', time: '08/03/2024 03:00', size: '1.9 GB', type: 'Tự động', status: 'success' },
]

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
    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Cấu Hình & Giám Sát Hệ Thống</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Giám sát cơ sở hạ tầng, tham số cấu hình và quản lý backup.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button variant="outline" icon={<VCT_Icons.Download size={16} />}>Tạo Backup</VCT_Button>
                    <VCT_Button variant="outline" icon={<VCT_Icons.RotateCcw size={16} />}>Xóa Cache</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <div className="vct-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <VCT_KpiCard label="Uptime" value="99.98%" icon={<VCT_Icons.Activity size={24} />} color="#10b981" />
                <VCT_KpiCard label="CPU Usage" value="23%" icon={<VCT_Icons.Laptop size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Memory" value="4.2/8 GB" icon={<VCT_Icons.Layers size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Disk" value="22/100 GB" icon={<VCT_Icons.Settings size={24} />} color="#8b5cf6" />
            </div>

            {/* ── INFRASTRUCTURE METRICS ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <MetricGrid title="PostgreSQL Database" icon={<VCT_Icons.Layers size={18} />} metrics={DB_METRICS} color="#0ea5e9" />
                <MetricGrid title="Redis Cache" icon={<VCT_Icons.Activity size={18} />} metrics={CACHE_METRICS} color="#ef4444" />
                <MetricGrid title="NATS Message Queue" icon={<VCT_Icons.Star size={18} />} metrics={QUEUE_METRICS} color="#10b981" />
                <MetricGrid title="Object Storage" icon={<VCT_Icons.Image size={18} />} metrics={STORAGE_METRICS} color="#f59e0b" />
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
                            {CONFIG_PARAMS.map(param => (
                                <tr key={param.key} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-3 font-mono text-xs font-bold text-[var(--vct-accent-cyan)]">{param.key}</td>
                                    <td className="p-3">
                                        <span className="font-bold text-sm text-[var(--vct-text-primary)]">{param.value}</span>
                                        {param.unit && <span className="text-[10px] text-[var(--vct-text-tertiary)] ml-1">{param.unit}</span>}
                                    </td>
                                    <td className="p-3 text-sm text-[var(--vct-text-secondary)]">{param.description}</td>
                                    <td className="p-3">
                                        <button className="p-1 text-[var(--vct-text-tertiary)] hover:text-white opacity-0 group-hover:opacity-100 transition-all rounded hover:bg-white/10">
                                            <VCT_Icons.Edit size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                    {BACKUP_HISTORY.map(bk => (
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
                                <VCT_Button variant="ghost" size="sm" icon={<VCT_Icons.Download size={14} />} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
