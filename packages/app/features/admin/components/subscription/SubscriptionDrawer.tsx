'use client'

import * as React from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_EmptyState } from '../../../components/vct-ui'
import { VCT_Icons } from '../../../components/vct-icons'
import { VCT_Drawer } from '../../../components/VCT_Drawer'

// ════════════════════════════════════════
// Types
// ════════════════════════════════════════
interface Subscription {
    id: string; plan_code: string; plan_name: string
    entity_type: string; entity_id: string; entity_name: string
    status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired'
    billing_cycle_type: string
    current_period_start: string; current_period_end: string
    auto_renew: boolean; created_at: string
}

interface BillingEntry {
    id: string; period: string; amount: number; status: string
    due_date: string; paid_at?: string
}

interface SubscriptionDrawerProps {
    selected: Subscription | null
    onClose: () => void
    drawerTab: 'info' | 'billing'
    setDrawerTab: (tab: 'info' | 'billing') => void
    billingHistory: Record<string, BillingEntry[]>
    onRenew: (id: string) => void
    onCancel: (id: string) => void
    onReactivate: (id: string) => void
    onSuspend: (id: string) => void
    onMarkPaid: (subId: string, billingId: string) => void
    statusMap: Record<string, { label: string; type: 'info' | 'success' | 'warning' | 'danger' | 'neutral' }>
    entityMap: Record<string, { label: string; type: 'info' | 'warning' | 'danger' | 'neutral' }>
    fmt: (n: number) => string
}

// ════════════════════════════════════════
// Helpers
// ════════════════════════════════════════
const daysUntil = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ════════════════════════════════════════
// COMPONENT
// ════════════════════════════════════════
export const SubscriptionDrawer = ({
    selected, onClose, drawerTab, setDrawerTab,
    billingHistory, onRenew, onCancel, onReactivate, onSuspend, onMarkPaid,
    statusMap, entityMap, fmt,
}: SubscriptionDrawerProps) => (
    <VCT_Drawer isOpen={!!selected} onClose={onClose} title={`Subscription ${selected?.id ?? ''}`} width={580}>
        {selected && (
            <VCT_Stack gap={20}>
                {/* Drawer Tabs: Info / Billing */}
                <div className="flex rounded-xl border border-(--vct-border-strong) overflow-hidden" role="tablist">
                    {(['info', 'billing'] as const).map(t => (
                        <button key={t} onClick={() => setDrawerTab(t)}
                            role="tab"
                            aria-selected={drawerTab === t}
                            aria-label={t === 'info' ? 'Thông tin subscription' : 'Lịch sử thanh toán'}
                            className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${drawerTab === t ? 'bg-[#8b5cf6] text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:bg-(--vct-bg-base)'}`}
                        >
                            {t === 'info' ? 'Thông tin' : 'Thanh toán'}
                        </button>
                    ))}
                </div>

                {drawerTab === 'info' && (
                    <>
                        <div className="flex items-center gap-3 flex-wrap">
                            <VCT_Badge type={entityMap[selected.entity_type]?.type || 'info'} text={entityMap[selected.entity_type]?.label || selected.entity_type} />
                            <VCT_Badge type={statusMap[selected.status]?.type || 'neutral'} text={statusMap[selected.status]?.label || selected.status} />
                            {selected.auto_renew && <VCT_Badge type="success" text="Tự gia hạn" />}
                        </div>

                        {/* Trial progress bar */}
                        {selected.status === 'trial' && (
                            <div className="p-3 bg-[#8b5cf610] border border-[#8b5cf640] rounded-xl">
                                <div className="flex items-center justify-between text-xs mb-2">
                                    <span className="text-[#8b5cf6] font-bold">Trial Period</span>
                                    <span className="text-(--vct-text-tertiary)">{Math.max(0, daysUntil(selected.current_period_end))} / {Math.ceil((new Date(selected.current_period_end).getTime() - new Date(selected.current_period_start).getTime()) / (1000 * 60 * 60 * 24))} ngày</span>
                                </div>
                                <div className="w-full h-2 bg-[#8b5cf620] rounded-full overflow-hidden">
                                    <div className="h-full bg-linear-to-r from-[#8b5cf6] to-[#a855f7] rounded-full transition-all"
                                        style={{ width: `${Math.min(100, Math.max(0, 100 - (daysUntil(selected.current_period_end) / Math.max(1, Math.ceil((new Date(selected.current_period_end).getTime() - new Date(selected.current_period_start).getTime()) / (1000 * 60 * 60 * 24))) * 100)))}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Đơn vị', value: selected.entity_name },
                                { label: 'Gói dịch vụ', value: selected.plan_name },
                                { label: 'Chu kỳ', value: selected.billing_cycle_type === 'yearly' ? 'Năm' : 'Tháng' },
                                { label: 'Bắt đầu', value: selected.current_period_start },
                                { label: 'Hết hạn', value: selected.current_period_end },
                                { label: 'Ngày đăng ký', value: selected.created_at },
                            ].map(item => (
                                <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                    <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Actions based on status */}
                        <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle) flex-wrap">
                            {(selected.status === 'active' || selected.status === 'past_due' || selected.status === 'expired') && (
                                <>
                                    <VCT_Button variant="primary" onClick={() => onRenew(selected.id)} icon={<VCT_Icons.Refresh size={14} />}>Gia hạn</VCT_Button>
                                    <VCT_Button variant="outline" onClick={() => onSuspend(selected.id)} icon={<VCT_Icons.Pause size={14} />}>Tạm ngưng</VCT_Button>
                                    <VCT_Button variant="outline" onClick={() => onCancel(selected.id)} icon={<VCT_Icons.X size={14} />}>Hủy gói</VCT_Button>
                                </>
                            )}
                            {selected.status === 'suspended' && (
                                <>
                                    <VCT_Button variant="primary" onClick={() => onReactivate(selected.id)} icon={<VCT_Icons.Play size={14} />}>Kích hoạt lại</VCT_Button>
                                    <VCT_Button variant="outline" onClick={() => onCancel(selected.id)} icon={<VCT_Icons.X size={14} />}>Hủy gói</VCT_Button>
                                </>
                            )}
                            {selected.status === 'trial' && (
                                <VCT_Button variant="primary" onClick={() => onRenew(selected.id)} icon={<VCT_Icons.CheckCircle size={14} />}>Kích hoạt gói</VCT_Button>
                            )}
                        </VCT_Stack>
                    </>
                )}

                {drawerTab === 'billing' && (
                    <div>
                        <h4 className="font-bold text-(--vct-text-primary) text-sm mb-3 flex items-center gap-2">
                            <VCT_Icons.FileText size={16} className="text-[#0ea5e9]" /> Lịch sử thanh toán
                        </h4>
                        {(billingHistory[selected.id] || []).length === 0 ? (
                            <VCT_EmptyState icon={<VCT_Icons.FileText size={32} />} title="Chưa có kỳ thanh toán" />
                        ) : (
                            <div className="space-y-3">
                                {(billingHistory[selected.id] || []).map(bc => (
                                    <div key={bc.id} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle) flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-sm text-(--vct-text-primary)">{bc.period}</div>
                                            <div className="text-[11px] text-(--vct-text-tertiary)">Hạn TT: {bc.due_date}{bc.paid_at ? ` · Đã TT: ${bc.paid_at}` : ''}</div>
                                        </div>
                                        <div className="text-right flex flex-col items-end gap-1">
                                            <div className="font-bold text-sm text-(--vct-text-primary)">{fmt(bc.amount)}</div>
                                            <VCT_Badge type={bc.status === 'paid' ? 'success' : bc.status === 'pending' ? 'warning' : 'danger'} text={bc.status === 'paid' ? 'Đã TT' : bc.status === 'pending' ? 'Chờ TT' : 'Quá hạn'} />
                                            {bc.status !== 'paid' && (
                                                <button onClick={() => onMarkPaid(selected.id, bc.id)} className="text-[10px] text-[#8b5cf6] hover:underline font-bold mt-1" aria-label="Đánh dấu đã thanh toán">Đánh dấu đã thu</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </VCT_Stack>
        )}
    </VCT_Drawer>
)
