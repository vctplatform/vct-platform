import * as React from 'react'
import { VCT_Badge, VCT_AvatarLetter } from '../../../components/vct-ui'
import { VCT_Icons } from '../../../components/vct-icons'
import type { SupportTicket } from './support.data'
import { TYPE_BADGE, PRIORITY_BADGE } from './support.data'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
interface SupportAnalyticsTabProps {
    tickets: SupportTicket[]
}

export function SupportAnalyticsTab({ tickets }: SupportAnalyticsTabProps) {
    // Prepare Bar Chart Data
    const barChartData = [
        { day: 'T2', count: 3 },
        { day: 'T3', count: 5 },
        { day: 'T4', count: 2 },
        { day: 'T5', count: 7 },
        { day: 'T6', count: 4 },
        { day: 'T7', count: 6 },
        { day: 'CN', count: 1 },
    ];

    // Prepare Pie Chart Data
    const types = Object.entries(TYPE_BADGE)
    const pieChartData = types.map(([key, badge]) => ({
        name: badge.label,
        value: tickets.filter(t => t.loai === key).length,
        color: key === 'bug' ? '#ef4444' : key === 'account' ? '#10b981' : key === 'payment' ? '#f59e0b' : key === 'feature' ? '#0ea5e9' : '#8b5cf6'
    })).filter(d => d.value > 0);

    return (
        <div className="space-y-6 mb-6">
            {/* Row 1: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                    <div className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Activity size={16} className="text-[#0ea5e9]" /> Tickets theo ngày (7 ngày)
                    </div>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--vct-border-subtle)" vertical={false} />
                                <XAxis dataKey="day" stroke="var(--vct-text-tertiary)" fontSize={11} tickLine={false} axisLine={false} />
                                <YAxis stroke="var(--vct-text-tertiary)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                                <RechartsTooltip 
                                    contentStyle={{ backgroundColor: 'var(--vct-bg-elevated)', borderRadius: '8px', border: '1px solid var(--vct-border-strong)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: 'var(--vct-text-primary)' }}
                                    cursor={{ fill: 'var(--vct-bg-base)', opacity: 0.5 }}
                                />
                                <Bar name="Tickets" dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut chart */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                    <div className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Target size={16} className="text-[#8b5cf6]" /> Phân bổ theo loại
                    </div>
                    <div className="h-[200px] w-full flex items-center justify-center relative">
                        {pieChartData.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {pieChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: 'var(--vct-bg-elevated)', borderRadius: '8px', border: '1px solid var(--vct-border-strong)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: 'var(--vct-text-primary)' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <div className="text-2xl font-black text-(--vct-text-primary)">{tickets.length}</div>
                                        <div className="text-[10px] uppercase font-bold text-(--vct-text-tertiary)">Tickets</div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-sm text-(--vct-text-tertiary)">Không có dữ liệu</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: SLA + Top Agents */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SLA Compliance */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                    <div className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Shield size={16} className="text-[#10b981]" /> SLA Compliance
                    </div>
                    <div className="space-y-4">
                        {[
                            { label: 'Phản hồi lần đầu < 2h', value: 85, color: '#10b981' },
                            { label: 'Giải quyết < 24h', value: 72, color: '#f59e0b' },
                            { label: 'CSAT >= 4/5', value: 91, color: '#0ea5e9' },
                        ].map(item => (
                            <div key={item.label}>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-(--vct-text-secondary)">{item.label}</span>
                                    <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}%</span>
                                </div>
                                <div className="w-full h-2 bg-(--vct-bg-base) rounded-full overflow-hidden">
                                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top Agents */}
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                    <div className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                        <VCT_Icons.Trophy size={16} className="text-[#f59e0b]" /> Top Agents
                    </div>
                    <div className="space-y-3">
                        {[
                            { name: 'Admin VCT', resolved: 42, avgTime: '1.8h', rating: 4.7 },
                            { name: 'DevTeam', resolved: 28, avgTime: '3.2h', rating: 4.5 },
                            { name: 'Support Team', resolved: 15, avgTime: '2.1h', rating: 4.8 },
                        ].map((agent, i) => (
                            <div key={agent.name} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === 0 ? 'bg-[#f59e0b]' : i === 1 ? 'bg-[#94a3b8]' : 'bg-[#cd7f32]'}`}>{i + 1}</div>
                                <VCT_AvatarLetter name={agent.name} size={28} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-bold text-(--vct-text-primary)">{agent.name}</div>
                                    <div className="text-[10px] text-(--vct-text-tertiary)">{agent.resolved} đã giải quyết · TB {agent.avgTime}</div>
                                </div>
                                <div className="text-xs font-bold text-[#f59e0b]">⭐ {agent.rating}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Row 3: Priority breakdown */}
            <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-5">
                <div className="text-sm font-bold text-(--vct-text-primary) mb-4 flex items-center gap-2">
                    <VCT_Icons.AlertTriangle size={16} className="text-[#ef4444]" /> Phân bổ theo mức ưu tiên
                </div>
                <div className="grid grid-cols-4 gap-3">
                    {Object.entries(PRIORITY_BADGE).map(([key, badge]) => {
                        const count = tickets.filter(t => t.mucUuTien === key).length
                        const pct = tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0
                        return (
                            <div key={key} className="text-center p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <div className="text-2xl font-bold text-(--vct-text-primary)">{count}</div>
                                <VCT_Badge type={badge.type} text={badge.label} />
                                <div className="text-[10px] text-(--vct-text-tertiary) mt-1">{pct}%</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
