'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import {
    VCT_Badge, VCT_Button, VCT_Stack,
    VCT_PageContainer, VCT_PageHero, VCT_StatRow,
    VCT_Modal, VCT_Toast
} from '@vct/ui'
import type { StatItem } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface MySubscription {
    id: string; plan_code: string; plan_name: string
    entity_type: string; entity_name: string
    status: 'trial' | 'active' | 'past_due' | 'suspended' | 'cancelled' | 'expired'
    billing_cycle_type: string
    current_period_start: string; current_period_end: string
    auto_renew: boolean; price: number; trial_end?: string
}

interface AvailablePlan {
    id: string; code: string; name: string; description: string
    price_monthly: number; price_yearly: number
    max_members: number; max_tournaments: number; max_athletes: number
    features: string[]; is_popular?: boolean
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    trial:     { label: 'Dùng thử',      color: 'var(--vct-info)', icon: <VCT_Icons.Clock size={14} /> },
    active:    { label: 'Đang hoạt động', color: 'var(--vct-success)', icon: <VCT_Icons.CheckCircle size={14} /> },
    past_due:  { label: 'Quá hạn',        color: 'var(--vct-warning)', icon: <VCT_Icons.AlertTriangle size={14} /> },
    suspended: { label: 'Tạm ngưng',      color: 'var(--vct-danger)', icon: <VCT_Icons.X size={14} /> },
    cancelled: { label: 'Đã hủy',         color: 'var(--vct-text-tertiary)', icon: <VCT_Icons.X size={14} /> },
    expired:   { label: 'Hết hạn',        color: 'var(--vct-text-tertiary)', icon: <VCT_Icons.Clock size={14} /> },
}

const fmt = (n: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
const daysUntil = (d: string) => Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 86400000))
const totalDays = (s: string, e: string) => Math.max(1, Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000))

// ════════════════════════════════════════
// MOCK DATA — null = no subscription yet
// ════════════════════════════════════════
const MY_SUB: MySubscription | null = {
    id: 'sub-1', plan_code: 'professional', plan_name: 'Gói Chuyên nghiệp',
    entity_type: 'organization', entity_name: 'CLB VCT Bình Định',
    status: 'active', billing_cycle_type: 'yearly',
    current_period_start: '2025-06-01', current_period_end: '2026-06-01',
    auto_renew: true, price: 15_000_000,
}

const AVAILABLE_PLANS: AvailablePlan[] = [
    {
        id: 'plan-1', code: 'basic', name: 'Gói Cơ bản', description: 'Dành cho CLB nhỏ, bắt đầu chuyển đổi số',
        price_monthly: 500_000, price_yearly: 5_000_000,
        max_members: 30, max_tournaments: 2, max_athletes: 50,
        features: ['Quản lý thành viên', 'Đăng ký giải cơ bản', 'Báo cáo tháng'],
    },
    {
        id: 'plan-2', code: 'professional', name: 'Gói Chuyên nghiệp', description: 'Dành cho CLB trung bình, quản lý chuyên nghiệp',
        price_monthly: 1_500_000, price_yearly: 15_000_000,
        max_members: 100, max_tournaments: 10, max_athletes: 200,
        features: ['Tất cả tính năng Cơ bản', 'Quản lý tài chính', 'Chấm điểm live', 'API tích hợp', 'Hỗ trợ ưu tiên'],
        is_popular: true,
    },
    {
        id: 'plan-3', code: 'enterprise', name: 'Gói Doanh nghiệp', description: 'Dành cho liên đoàn, tổ chức lớn',
        price_monthly: 3_000_000, price_yearly: 30_000_000,
        max_members: 500, max_tournaments: 50, max_athletes: 1000,
        features: ['Tất cả tính năng Pro', 'Đa chi nhánh', 'White-label', 'SLA 99.9%', 'Quản lý đội ngũ', 'Custom domain'],
    },
]

const BILLING_HISTORY = [
    { id: 'bc-1', period: '06/2025 – 06/2026', amount: 15_000_000, status: 'paid', paid_at: '2025-06-03' },
    { id: 'bc-2', period: '06/2024 – 06/2025', amount: 15_000_000, status: 'paid', paid_at: '2024-06-01' },
    { id: 'bc-3', period: '06/2023 – 06/2024', amount: 12_000_000, status: 'paid', paid_at: '2023-06-05' },
]

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_finance_subscriptions = () => {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
    const [isLoading, setIsLoading] = useState(true)
    const [currentSub, setCurrentSub] = useState<MySubscription | null>(null)
    const [availablePlans, setAvailablePlans] = useState<AvailablePlan[]>([])
    const [billingHistory, setBillingHistory] = useState<any[]>([])

    // Payment Modal State
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)
    const [selectedMethod, setSelectedMethod] = useState<'banking' | 'vnpay' | 'momo' | null>(null)
    const [actionType, setActionType] = useState<'renew' | 'upgrade' | null>(null)
    const [selectedPlanForUpgrade, setSelectedPlanForUpgrade] = useState<AvailablePlan | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('vct_access_token') : null
                const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {}
                
                const [plansRes, subsRes] = await Promise.all([
                    fetch('/api/v1/finance/plans', { headers }),
                    fetch('/api/v1/finance/subscriptions', { headers })
                ])

                if (plansRes.ok) {
                    const pj = await plansRes.json()
                    setAvailablePlans(pj.data || AVAILABLE_PLANS)
                } else setAvailablePlans(AVAILABLE_PLANS)

                if (subsRes.ok) {
                    const sj = await subsRes.json()
                    const items = sj.data?.items || []
                    if (items.length > 0) {
                        const sub = items[0]
                        setCurrentSub(sub)
                        const bcRes = await fetch(`/api/v1/finance/billing-cycles?subscription_id=${sub.id}`, { headers })
                        if (bcRes.ok) {
                            const bcj = await bcRes.json()
                            setBillingHistory(bcj.data?.items || BILLING_HISTORY)
                        } else setBillingHistory(BILLING_HISTORY)
                    } else {
                        setCurrentSub(MY_SUB) // For dev environment visual testing
                        setBillingHistory(BILLING_HISTORY)
                    }
                } else {
                    setCurrentSub(MY_SUB)
                    setBillingHistory(BILLING_HISTORY)
                }
            } catch {
                setAvailablePlans(AVAILABLE_PLANS)
                setCurrentSub(MY_SUB)
                setBillingHistory(BILLING_HISTORY)
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleOpenPayment = (action: 'renew' | 'upgrade', plan?: AvailablePlan) => {
        setActionType(action)
        if (plan) setSelectedPlanForUpgrade(plan)
        setSelectedMethod(null)
        setIsPaymentModalOpen(true)
    }

    const handleConfirmPayment = () => {
        if (!selectedMethod) {
            setToast({ show: true, msg: 'Vui lòng chọn phương thức thanh toán', type: 'error' })
            setTimeout(() => setToast(p => ({ ...p, show: false })), 3000)
            return
        }
        setIsProcessing(true)
        setTimeout(() => {
            setIsProcessing(false)
            setIsPaymentModalOpen(false)
            setToast({ show: true, msg: actionType === 'renew' ? 'Gia hạn thành công!' : 'Đã đăng ký nâng cấp gói!', type: 'success' })
            setTimeout(() => setToast(p => ({ ...p, show: false })), 3000)
        }, 1500)
    }

    const daysRemaining = useMemo(() =>
        currentSub ? daysUntil(currentSub.current_period_end) : 0
    , [currentSub])

    const stats: StatItem[] = currentSub ? [
        { icon: <VCT_Icons.CreditCard size={20} />, label: 'Gói hiện tại', value: currentSub.plan_name, color: 'var(--vct-info)' },
        { icon: <VCT_Icons.Calendar size={20} />, label: 'Hết hạn', value: currentSub.current_period_end, color: daysRemaining < 30 ? 'var(--vct-warning)' : 'var(--vct-success)' },
        { icon: <VCT_Icons.Clock size={20} />, label: 'Còn lại', value: `${daysRemaining} ngày`, color: daysRemaining < 30 ? 'var(--vct-danger)' : 'var(--vct-accent-cyan)' },
        { icon: <VCT_Icons.DollarSign size={20} />, label: 'Số tiền kỳ này', value: fmt(currentSub.price), color: 'var(--vct-success)' },
    ] : [
        { icon: <VCT_Icons.CreditCard size={20} />, label: 'Gói hiện tại', value: 'Chưa đăng ký', color: 'var(--vct-text-tertiary)' },
        { icon: <VCT_Icons.Calendar size={20} />, label: 'Trạng thái', value: 'Chưa kích hoạt', color: 'var(--vct-text-tertiary)' },
        { icon: <VCT_Icons.Clock size={20} />, label: 'Dùng thử', value: 'Miễn phí 30 ngày', color: 'var(--vct-info)' },
        { icon: <VCT_Icons.DollarSign size={20} />, label: 'Chi phí', value: '0₫', color: 'var(--vct-success)' },
    ]

    return (
        <VCT_PageContainer size="wide">
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            <VCT_PageHero
                title="Subscription & Gói dịch vụ"
                subtitle="Quản lý gói đang sử dụng, nâng cấp và xem lịch sử thanh toán"
                icon={<VCT_Icons.CreditCard size={28} />}
                gradientFrom="rgba(139, 92, 246, 0.08)"
                gradientTo="rgba(14, 165, 233, 0.06)"
            />
            <VCT_StatRow items={stats} />

            {/* ── No Subscription — CTA ── */}
            {!currentSub && !isLoading && (
                <div className="mb-6 p-8 bg-gradient-to-br from-[#8b5cf610] to-[#0ea5e910] border border-[#8b5cf640] rounded-2xl text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-(--vct-info) to-[#a855f7] flex items-center justify-center">
                        <VCT_Icons.CreditCard size={32} className="text-white" />
                    </div>
                    <h2 className="font-black text-xl text-(--vct-text-primary) mb-2">Chưa có gói dịch vụ</h2>
                    <p className="text-sm text-(--vct-text-secondary) mb-6 max-w-md mx-auto">
                        Đăng ký gói dịch vụ để sử dụng đầy đủ tính năng quản lý CLB, giải đấu, và tài chính. Dùng thử miễn phí 30 ngày!
                    </p>
                    <VCT_Button variant="primary" icon={<VCT_Icons.Plus size={16} />} onClick={() => {
                        const basic = availablePlans.find(p => p.code === 'basic')
                        if (basic) handleOpenPayment('upgrade', basic)
                    }}>
                        Đăng ký gói ngay
                    </VCT_Button>
                </div>
            )}

            {/* ── Current Subscription Card ── */}
            {currentSub && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6 mb-6">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${STATUS_MAP[currentSub.status]?.color || 'var(--vct-info)'}, ${STATUS_MAP[currentSub.status]?.color || '#a855f7'}cc)` }}>
                                <VCT_Icons.CreditCard size={24} className="text-white" />
                            </div>
                            <div>
                                <h2 className="font-black text-lg text-(--vct-text-primary)">{currentSub.plan_name}</h2>
                                <div className="text-sm text-(--vct-text-secondary)">{currentSub.entity_name}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <VCT_Badge type={STATUS_MAP[currentSub.status]?.label === 'Đang hoạt động' ? 'success' : STATUS_MAP[currentSub.status]?.label === 'Dùng thử' ? 'info' : STATUS_MAP[currentSub.status]?.label === 'Quá hạn' ? 'warning' : 'danger'} text={STATUS_MAP[currentSub.status]?.label ?? currentSub.status} />
                            {currentSub.auto_renew && <VCT_Badge type="success" text="Tự gia hạn" />}
                        </div>
                    </div>

                    {/* Period progress bar */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-(--vct-text-tertiary)">{currentSub.current_period_start}</span>
                            <span className={`font-bold ${daysRemaining < 30 ? 'text-(--vct-warning)' : 'text-(--vct-text-tertiary)'}`}>
                                {daysRemaining < 30 ? `⚠ ${daysRemaining} ngày còn lại` : `${daysRemaining} ngày còn lại`}
                            </span>
                            <span className="text-(--vct-text-tertiary)">{currentSub.current_period_end}</span>
                        </div>
                        <div className="w-full h-2 bg-(--vct-bg-base) rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all ${daysRemaining < 30 ? 'bg-gradient-to-r from-(--vct-warning) to-(--vct-danger)' : 'bg-gradient-to-r from-(--vct-success) to-(--vct-accent-cyan)'}`}
                                style={{ width: `${Math.min(100, Math.max(2, 100 - (daysRemaining / totalDays(currentSub.current_period_start, currentSub.current_period_end) * 100)))}%` }}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {[
                            { label: 'Chu kỳ', value: currentSub.billing_cycle_type === 'yearly' ? 'Hàng năm' : 'Hàng tháng' },
                            { label: 'Bắt đầu', value: currentSub.current_period_start },
                            { label: 'Hết hạn', value: currentSub.current_period_end },
                            { label: 'Giá', value: fmt(currentSub.price) + (currentSub.billing_cycle_type === 'yearly' ? '/năm' : '/tháng') },
                        ].map(item => (
                            <div key={item.label} className="p-3 bg-(--vct-bg-base) rounded-xl border border-(--vct-border-subtle)">
                                <div className="text-[10px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold mb-1">{item.label}</div>
                                <div className="font-bold text-sm text-(--vct-text-primary)">{item.value}</div>
                            </div>
                        ))}
                    </div>
                    {daysRemaining < 30 && (
                        <div className="p-3 bg-[#f59e0b10] border border-[#f59e0b40] rounded-xl flex items-center gap-3 mb-4">
                            <VCT_Icons.AlertTriangle size={18} className="text-(--vct-warning) shrink-0" />
                            <span className="text-sm text-(--vct-warning) font-medium">Gói sẽ hết hạn trong {daysRemaining} ngày. Gia hạn ngay để tránh gián đoạn dịch vụ.</span>
                        </div>
                    )}
                    <VCT_Stack direction="row" gap={8}>
                        <VCT_Button variant="primary" icon={<VCT_Icons.Refresh size={14} />} onClick={() => handleOpenPayment('renew')}>Gia hạn ngay</VCT_Button>
                        <VCT_Button variant="outline" icon={<VCT_Icons.TrendingUp size={14} />} onClick={() => {
                            const betterPlan = availablePlans.find(p => p.price_yearly > (currentSub?.price || 0))
                            if (betterPlan) handleOpenPayment('upgrade', betterPlan)
                        }}>Nâng cấp gói</VCT_Button>
                    </VCT_Stack>
                </div>
            )}

            {/* ── Available Plans ── */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-(--vct-text-primary) text-lg flex items-center gap-2">
                        <VCT_Icons.Layers size={20} className="text-(--vct-info)" /> So sánh gói dịch vụ
                    </h3>
                    <div className="flex rounded-xl border border-(--vct-border-strong) overflow-hidden">
                        {['monthly', 'yearly'].map(cycle => (
                            <button
                                key={cycle}
                                onClick={() => setBillingCycle(cycle as 'monthly' | 'yearly')}
                                className={`px-4 py-2 text-sm font-semibold transition-colors ${billingCycle === cycle ? 'bg-(--vct-info) text-white' : 'bg-(--vct-bg-elevated) text-(--vct-text-secondary) hover:bg-(--vct-bg-base)'}`}
                            >
                                {cycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm'}
                                {cycle === 'yearly' && <span className="ml-1 text-[10px] opacity-75">-17%</span>}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {availablePlans.map(plan => {
                        const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly
                        const isCurrent = currentSub?.plan_code === plan.code
                        const isUpgrade = currentSub && !isCurrent && (plan.price_yearly > (availablePlans.find(p => p.code === currentSub.plan_code)?.price_yearly ?? 0))
                        const isDowngrade = currentSub && !isCurrent && (plan.price_yearly < (availablePlans.find(p => p.code === currentSub.plan_code)?.price_yearly ?? Infinity))
                        return (
                            <div
                                key={plan.id}
                                className={`bg-(--vct-bg-elevated) border rounded-2xl p-5 transition-all relative ${
                                    isCurrent ? 'border-(--vct-success) shadow-[0_0_30px_#10b98115] ring-1 ring-[#10b98140]' :
                                    plan.is_popular ? 'border-(--vct-info) shadow-[0_0_30px_#8b5cf615]' :
                                    'border-(--vct-border-strong) hover:border-[#8b5cf680]'
                                }`}
                            >
                                {plan.is_popular && !isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--vct-info) text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">Phổ biến nhất</div>
                                )}
                                {isCurrent && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--vct-success) text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1">
                                        <VCT_Icons.CheckCircle size={10} /> Gói hiện tại
                                    </div>
                                )}
                                <div className="mb-4 mt-1">
                                    <div className="font-black text-lg text-(--vct-text-primary)">{plan.name}</div>
                                    <div className="text-xs text-(--vct-text-tertiary) mt-1">{plan.description}</div>
                                </div>
                                <div className="mb-4">
                                    <span className="text-3xl font-black text-(--vct-text-primary)">{fmt(price)}</span>
                                    <span className="text-sm text-(--vct-text-tertiary)">/{billingCycle === 'yearly' ? 'năm' : 'tháng'}</span>
                                </div>
                                <div className="space-y-2 mb-5 text-sm">
                                    <div className="flex items-center gap-2 text-(--vct-text-secondary)">
                                        <VCT_Icons.Users size={14} className="text-(--vct-info) shrink-0" />
                                        <span>Tối đa <strong>{plan.max_members}</strong> thành viên</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-(--vct-text-secondary)">
                                        <VCT_Icons.Trophy size={14} className="text-(--vct-warning) shrink-0" />
                                        <span>Tối đa <strong>{plan.max_tournaments}</strong> giải/năm</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-(--vct-text-secondary)">
                                        <VCT_Icons.Activity size={14} className="text-(--vct-success) shrink-0" />
                                        <span>Tối đa <strong>{plan.max_athletes}</strong> VĐV</span>
                                    </div>
                                    {(plan.features || []).map(f => (
                                        <div key={f} className="flex items-center gap-2 text-(--vct-text-secondary)">
                                            <VCT_Icons.CheckCircle size={14} className="text-(--vct-success) shrink-0" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                                <VCT_Button
                                    variant={isCurrent ? 'outline' : 'primary'}
                                    className="w-full"
                                    disabled={isCurrent}
                                    icon={isUpgrade ? <VCT_Icons.TrendingUp size={14} /> : isDowngrade ? <VCT_Icons.TrendingDown size={14} /> : undefined}
                                    onClick={() => !isCurrent && handleOpenPayment('upgrade', plan)}
                                >
                                    {isCurrent ? '✓ Đang sử dụng' : isUpgrade ? 'Nâng cấp' : isDowngrade ? 'Hạ gói' : 'Đăng ký ngay'}
                                </VCT_Button>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Billing History ── */}
            {currentSub && (
                <div className="bg-(--vct-bg-elevated) border border-(--vct-border-strong) rounded-2xl p-6">
                    <h3 className="font-bold text-(--vct-text-primary) text-lg mb-4 flex items-center gap-2">
                        <VCT_Icons.FileText size={20} className="text-(--vct-accent-cyan)" /> Lịch sử thanh toán
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-(--vct-border-subtle)">
                                    <th className="text-left p-3 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Kỳ thanh toán</th>
                                    <th className="text-right p-3 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Số tiền</th>
                                    <th className="text-center p-3 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Trạng thái</th>
                                    <th className="text-right p-3 text-(--vct-text-tertiary) font-bold text-xs uppercase tracking-wider">Ngày TT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {billingHistory.map(item => (
                                    <tr key={item.id} className="border-b border-(--vct-border-subtle) hover:bg-(--vct-bg-base) transition-colors">
                                        <td className="p-3 font-semibold text-(--vct-text-primary)">{item.period}</td>
                                        <td className="p-3 text-right font-bold text-(--vct-text-primary)">{fmt(item.amount)}</td>
                                        <td className="p-3 text-center"><VCT_Badge type="success" text="Đã thanh toán" /></td>
                                        <td className="p-3 text-right text-(--vct-text-tertiary)">{item.paid_at}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Payment Method Modal ── */}
            <VCT_Modal
                isOpen={isPaymentModalOpen}
                onClose={() => !isProcessing && setIsPaymentModalOpen(false)}
                title={actionType === 'renew' ? 'Gia hạn gói dịch vụ' : 'Đăng ký nâng cấp gói'}
                width={500}
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="text-sm">
                            Tổng thanh toán: <strong className="text-lg text-(--vct-text-primary)">
                                {fmt(actionType === 'renew' ? (currentSub?.price || 0) : (selectedPlanForUpgrade ? (billingCycle === 'yearly' ? selectedPlanForUpgrade.price_yearly : selectedPlanForUpgrade.price_monthly) : 0))}
                            </strong>
                        </div>
                        <VCT_Stack direction="row" gap={8} justify="end">
                            <VCT_Button variant="ghost" onClick={() => setIsPaymentModalOpen(false)} disabled={isProcessing}>Hủy</VCT_Button>
                            <VCT_Button variant="primary" onClick={handleConfirmPayment} loading={isProcessing}>
                                Xác nhận thanh toán
                            </VCT_Button>
                        </VCT_Stack>
                    </div>
                }
            >
                <div className="p-1">
                    <div className="mb-5 p-4 bg-[#0ea5e910] border border-[#0ea5e930] rounded-xl flex items-start gap-3">
                        <VCT_Icons.CreditCard size={20} className="text-(--vct-accent-cyan) shrink-0 mt-0.5" />
                        <div>
                            <div className="font-bold text-sm text-(--vct-text-primary) mb-1">
                                {actionType === 'renew' ? `Gia hạn ${currentSub?.plan_name}` : `Nâng cấp lên ${selectedPlanForUpgrade?.name}`}
                            </div>
                            <div className="text-xs text-(--vct-text-secondary)">
                                Chu kỳ thanh toán: {billingCycle === 'yearly' ? 'Hàng năm' : 'Hàng tháng'}
                            </div>
                        </div>
                    </div>

                    <h4 className="font-bold text-sm text-(--vct-text-primary) mb-3">Chọn phương thức thanh toán</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {[
                            { id: 'vnpay', name: 'Thanh toán qua VNPAY', desc: 'Quét mã QR bằng App Ngân hàng', icon: <VCT_Icons.Smartphone size={20} className="text-[#005BAA]" /> },
                            { id: 'momo', name: 'Ví MoMo', desc: 'Thanh toán nhanh qua ví điện tử', icon: <VCT_Icons.CreditCard size={20} className="text-[#A50064]" /> },
                            { id: 'banking', name: 'Chuyển khoản Ngân hàng', desc: 'Chuyển khoản thủ công 24/7', icon: <VCT_Icons.Building2 size={20} className="text-(--vct-success)" /> }
                        ].map(method => (
                            <div
                                key={method.id}
                                className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3 ${selectedMethod === method.id ? 'border-(--vct-info) bg-[#8b5cf608]' : 'border-(--vct-border-subtle) hover:border-(--vct-border-strong)'}`}
                                onClick={() => setSelectedMethod(method.id as any)}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedMethod === method.id ? 'border-(--vct-info)' : 'border-(--vct-border-strong)'}`}>
                                    {selectedMethod === method.id && <div className="w-2.5 h-2.5 rounded-full bg-(--vct-info)" />}
                                </div>
                                <div className="w-10 h-10 rounded-lg bg-(--vct-bg-base) border border-(--vct-border-subtle) flex items-center justify-center shrink-0 shadow-sm">
                                    {method.icon}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-(--vct-text-primary)">{method.name}</div>
                                    <div className="text-[11px] text-(--vct-text-secondary) mt-0.5">{method.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {selectedMethod && <div className="mt-5 p-4 rounded-xl bg-(--vct-bg-base) border border-(--vct-border-subtle) text-sm text-(--vct-text-secondary) text-center">
                        Hệ thống sẽ chuyển hướng bạn đến cổng thanh toán an toàn sau khi xác nhận.
                    </div>}
                </div>
            </VCT_Modal>
        </VCT_PageContainer>
    )
}

