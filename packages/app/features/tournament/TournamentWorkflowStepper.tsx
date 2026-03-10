'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Tournament Workflow Stepper (VĐ1: End-to-End Flow)
// Shows tournament progress and guides users to next actions
// ════════════════════════════════════════════════════════════════

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'

interface WorkflowStep {
    id: string; label: string; icon: string; status: 'done' | 'active' | 'pending' | 'locked'
    description: string; route: string; stats?: string
}

const TOURNAMENT_WORKFLOW: WorkflowStep[] = [
    { id: 'setup', label: 'Tạo giải', icon: '📋', status: 'done', description: 'Nhập thông tin giải, nội dung, sàn đấu', route: '/giai-dau', stats: '68 nội dung' },
    { id: 'registration', label: 'Đăng ký', icon: '📝', status: 'done', description: 'Đăng ký đơn vị, VĐV tham gia', route: '/registration', stats: '486 VĐV / 42 đơn vị' },
    { id: 'weighin', label: 'Cân ký', icon: '⚖️', status: 'done', description: 'Kiểm tra cân nặng VĐV theo hạng cân', route: '/weigh-in', stats: '470/486 đạt' },
    { id: 'meeting', label: 'Họp chuyên môn', icon: '🤝', status: 'done', description: 'Phổ biến luật, bốc thăm đại biểu', route: '/hop-chuyen-mon', stats: '42/42 đoàn' },
    { id: 'draw', label: 'Bốc thăm', icon: '🎲', status: 'done', description: 'Xếp nhánh đối kháng, thứ tự quyền', route: '/boc-tham', stats: '38 nhánh' },
    { id: 'schedule', label: 'Lịch thi đấu', icon: '📅', status: 'active', description: 'Xếp lịch trận đấu theo sàn và thời gian', route: '/schedule', stats: '156 trận' },
    { id: 'referee', label: 'Phân công TT', icon: '👨‍⚖️', status: 'pending', description: 'Phân trọng tài vào từng sàn, ca', route: '/referee-assignments' },
    { id: 'competition', label: 'Thi đấu', icon: '🥊', status: 'locked', description: 'Đối kháng & Quyền thuật', route: '/combat' },
    { id: 'results', label: 'Kết quả', icon: '🏆', status: 'locked', description: 'Tổng hợp kết quả, huy chương', route: '/results' },
    { id: 'reports', label: 'Báo cáo', icon: '📊', status: 'locked', description: 'In báo cáo, tổng kết giải', route: '/reports' },
]

const STATUS_STYLES: Record<
    WorkflowStep['status'],
    { bg: string; border: string; text: string; dot: string }
> = {
    done: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-600', dot: 'bg-emerald-500' },
    active: { bg: 'bg-blue-500/10', border: 'border-blue-500/50', text: 'text-blue-600', dot: 'bg-blue-500 animate-pulse' },
    pending: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-600', dot: 'bg-amber-500' },
    locked: { bg: 'bg-vct-input', border: 'border-vct-border', text: 'text-vct-text-muted', dot: 'bg-vct-border' },
}

const STATUS_LABELS: Record<WorkflowStep['status'], string> = {
    done: '✅ Hoàn tất',
    active: '🔵 Đang thực hiện',
    pending: '⏳ Sắp đến',
    locked: '🔒 Chưa mở',
}

export function TournamentWorkflowStepper({ compact = false }: { compact?: boolean }) {
    const [expanded, setExpanded] = useState(!compact)
    const activeStep = TOURNAMENT_WORKFLOW.find(s => s.status === 'active')
    const doneCount = TOURNAMENT_WORKFLOW.filter(s => s.status === 'done').length
    const progress = Math.round((doneCount / TOURNAMENT_WORKFLOW.length) * 100)

    if (compact && !expanded) {
        return (
            <button onClick={() => setExpanded(true)}
                className="w-full flex items-center gap-3 rounded-xl border border-vct-border bg-vct-elevated p-3 hover:bg-vct-input transition text-left">
                <div className="h-10 w-10 rounded-lg bg-blue-500/15 flex items-center justify-center text-lg">📋</div>
                <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold flex items-center gap-2">
                        Tiến trình giải
                        <span className="text-xs font-bold text-blue-500">{progress}%</span>
                    </div>
                    <div className="text-xs text-vct-text-muted truncate">
                        Đang: {activeStep?.label || 'Hoàn tất'} • {doneCount}/{TOURNAMENT_WORKFLOW.length} bước
                    </div>
                </div>
                <div className="h-2 w-24 rounded-full bg-vct-input overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" style={{ width: `${progress}%` }} />
                </div>
                <VCT_Icons.ChevronDown size={16} className="text-vct-text-muted" />
            </button>
        )
    }

    return (
        <div className="rounded-xl border border-vct-border bg-vct-elevated overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-vct-border">
                <div className="flex items-center gap-3">
                    <div className="text-xl">📋</div>
                    <div>
                        <div className="text-sm font-bold">Quy trình điều hành giải</div>
                        <div className="text-xs text-vct-text-muted">{doneCount}/{TOURNAMENT_WORKFLOW.length} bước — {progress}% hoàn thành</div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-32 rounded-full bg-vct-input overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-blue-500" />
                    </div>
                    {compact && (
                        <button onClick={() => setExpanded(false)} className="text-vct-text-muted hover:text-vct-text">
                            <VCT_Icons.Close size={16} />
                        </button>
                    )}
                </div>
            </div>

            {/* Steps */}
            <div className="p-4">
                <div className="relative">
                    {/* Vertical line */}
                    <div className="absolute left-5 top-0 bottom-0 w-px bg-vct-border" />

                    <div className="grid gap-1">
                        {TOURNAMENT_WORKFLOW.map((step, i) => {
                            const style = STATUS_STYLES[step.status]
                            const isClickable = step.status !== 'locked'
                            return (
                                <div key={step.id}
                                    className={`relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition ${isClickable ? 'cursor-pointer hover:bg-vct-input' : 'opacity-60'} ${step.status === 'active' ? style.bg : ''}`}
                                    onClick={() => isClickable && typeof window !== 'undefined' && (window.location.href = step.route)}>
                                    {/* Dot */}
                                    <div className={`relative z-10 mt-1 h-4 w-4 rounded-full border-2 ${step.status === 'done' ? 'border-emerald-500 bg-emerald-500' : step.status === 'active' ? 'border-blue-500 bg-blue-500' : 'border-vct-border bg-vct-bg'} flex items-center justify-center`}>
                                        {step.status === 'done' && <span className="text-white text-[8px]">✓</span>}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">{step.icon}</span>
                                            <span className={`text-sm font-bold ${step.status === 'locked' ? 'text-vct-text-muted' : ''}`}>{step.label}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${style.bg} ${style.text}`}>
                                                {STATUS_LABELS[step.status]}
                                            </span>
                                        </div>
                                        <div className="text-xs text-vct-text-muted mt-0.5">{step.description}</div>
                                        {step.stats && <div className="text-xs font-bold text-vct-text mt-0.5">{step.stats}</div>}
                                    </div>

                                    {/* Arrow */}
                                    {isClickable && (
                                        <span className="text-vct-text-muted mt-1"><VCT_Icons.ArrowUpRight size={14} /></span>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Next Action CTA */}
            {activeStep && (
                <div className="px-5 py-3 border-t border-vct-border bg-blue-500/5">
                    <button onClick={() => typeof window !== 'undefined' && (window.location.href = activeStep.route)}
                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-500 py-2 text-sm font-bold text-white hover:bg-blue-600 transition">
                        {activeStep.icon} Tiếp tục: {activeStep.label}
                        <VCT_Icons.ArrowUpRight size={14} />
                    </button>
                </div>
            )}
        </div>
    )
}
