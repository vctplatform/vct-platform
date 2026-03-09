'use client'

/**
 * VCT Page Templates
 * 
 * Reusable page layout templates for consistent UI across the platform.
 * Templates: List, Detail, Wizard, Dashboard
 */

import { useState, type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    VCT_Text, VCT_Card, VCT_Button, VCT_Badge,
} from 'app/features/components/vct-ui'

/* ═══════════════════════════════════════════════════════════════
   LIST PAGE TEMPLATE
   ═══════════════════════════════════════════════════════════════ */

interface ListPageProps {
    /** Page title */
    title: string
    /** Subtitle / breadcrumb */
    subtitle?: string
    /** Icon emoji */
    icon?: string
    /** KPI cards above the list */
    kpis?: Array<{ label: string; value: string | number; color?: string; icon?: string }>
    /** Action buttons (top right) */
    actions?: ReactNode
    /** Search placeholder */
    searchPlaceholder?: string
    /** Search callback */
    onSearch?: (query: string) => void
    /** Filter options */
    filters?: Array<{ label: string; value: string }>
    /** Active filter */
    activeFilter?: string
    /** Filter callback */
    onFilter?: (value: string) => void
    /** Table or list content */
    children: ReactNode
    /** Pagination info */
    pagination?: {
        current: number
        total: number
        pageSize: number
        onChange: (page: number) => void
    }
}

export function VCT_PageTemplate_List({
    title, subtitle, icon, kpis, actions, searchPlaceholder = 'Tìm kiếm...',
    onSearch, filters, activeFilter, onFilter, children, pagination,
}: ListPageProps) {
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* Header */}
            <div className="px-6 py-5" style={{ background: 'var(--vct-bg-elevated)', borderBottom: '1px solid var(--vct-border-subtle)' }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <VCT_Text variant="h1" style={{ margin: 0 }}>
                            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
                            {title}
                        </VCT_Text>
                        {subtitle && <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{subtitle}</VCT_Text>}
                    </div>
                    {actions && <div className="flex items-center gap-2">{actions}</div>}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-4">
                {/* KPIs */}
                {kpis && kpis.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        {kpis.map((kpi, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <VCT_Card>
                                    <div className="p-4">
                                        <div className="flex items-center justify-between mb-1">
                                            <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{kpi.label}</VCT_Text>
                                            {kpi.icon && <span>{kpi.icon}</span>}
                                        </div>
                                        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: kpi.color || 'var(--vct-accent-cyan)' }}>{kpi.value}</div>
                                    </div>
                                </VCT_Card>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Search + Filters */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                    {onSearch && (
                        <div className="flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder={searchPlaceholder}
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); onSearch(e.target.value) }}
                                className="w-full rounded-lg px-4 py-2"
                                style={{
                                    background: 'var(--vct-bg-input)',
                                    border: '1px solid var(--vct-border-subtle)',
                                    color: 'var(--vct-text-primary)',
                                    fontSize: 14,
                                }}
                            />
                        </div>
                    )}
                    {filters && onFilter && (
                        <div className="flex gap-1">
                            {filters.map((f) => (
                                <button
                                    key={f.value}
                                    onClick={() => onFilter(f.value)}
                                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                                    style={{
                                        background: activeFilter === f.value ? 'var(--vct-accent-cyan)' : 'var(--vct-bg-input)',
                                        color: activeFilter === f.value ? '#fff' : 'var(--vct-text-secondary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div>{children}</div>

                {/* Pagination */}
                {pagination && pagination.total > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <VCT_Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.current <= 1}
                            onClick={() => pagination.onChange(pagination.current - 1)}
                        >
                            ← Trước
                        </VCT_Button>
                        <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                            Trang {pagination.current}/{pagination.total}
                        </VCT_Text>
                        <VCT_Button
                            variant="ghost"
                            size="sm"
                            disabled={pagination.current >= pagination.total}
                            onClick={() => pagination.onChange(pagination.current + 1)}
                        >
                            Sau →
                        </VCT_Button>
                    </div>
                )}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   DETAIL PAGE TEMPLATE
   ═══════════════════════════════════════════════════════════════ */

interface DetailPageProps {
    title: string
    subtitle?: string
    icon?: string
    badge?: { text: string; type: 'success' | 'warning' | 'danger' | 'info' }
    actions?: ReactNode
    backUrl?: string
    onBack?: () => void
    /** Tabs for detail sections */
    tabs?: Array<{ id: string; label: string; icon?: string }>
    activeTab?: string
    onTabChange?: (id: string) => void
    children: ReactNode
    sidebar?: ReactNode
}

export function VCT_PageTemplate_Detail({
    title, subtitle, icon, badge, actions, onBack,
    tabs, activeTab, onTabChange, children, sidebar,
}: DetailPageProps) {
    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* Header */}
            <div className="px-6 py-5" style={{ background: 'var(--vct-bg-elevated)', borderBottom: '1px solid var(--vct-border-subtle)' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button onClick={onBack} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--vct-text-tertiary)', fontSize: 18, padding: 4,
                                }}>←</button>
                            )}
                            <div>
                                <div className="flex items-center gap-2">
                                    <VCT_Text variant="h1" style={{ margin: 0 }}>
                                        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
                                        {title}
                                    </VCT_Text>
                                    {badge && <VCT_Badge type={badge.type} text={badge.text} />}
                                </div>
                                {subtitle && <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>{subtitle}</VCT_Text>}
                            </div>
                        </div>
                        {actions && <div className="flex items-center gap-2">{actions}</div>}
                    </div>

                    {/* Tabs */}
                    {tabs && onTabChange && (
                        <div className="flex gap-1 mt-4">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    className="px-4 py-2 rounded-t-lg text-sm font-medium transition-all"
                                    style={{
                                        background: activeTab === tab.id ? 'var(--vct-bg-base)' : 'transparent',
                                        color: activeTab === tab.id ? 'var(--vct-accent-cyan)' : 'var(--vct-text-secondary)',
                                        border: 'none',
                                        cursor: 'pointer',
                                        borderBottom: activeTab === tab.id ? '2px solid var(--vct-accent-cyan)' : 'none',
                                    }}
                                >
                                    {tab.icon && <span style={{ marginRight: 4 }}>{tab.icon}</span>}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="max-w-7xl mx-auto px-6 py-4" style={{ display: sidebar ? 'grid' : 'block', gridTemplateColumns: sidebar ? '1fr 320px' : undefined, gap: 24 }}>
                <div>{children}</div>
                {sidebar && <aside>{sidebar}</aside>}
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   WIZARD PAGE TEMPLATE (Multi-step form)
   ═══════════════════════════════════════════════════════════════ */

interface WizardStep {
    id: string
    label: string
    icon?: string
    content: ReactNode
}

interface WizardPageProps {
    title: string
    icon?: string
    steps: WizardStep[]
    currentStep: number
    onStepChange: (step: number) => void
    onSubmit: () => void
    onCancel?: () => void
    isSubmitting?: boolean
}

export function VCT_PageTemplate_Wizard({
    title, icon, steps, currentStep, onStepChange, onSubmit, onCancel, isSubmitting,
}: WizardPageProps) {
    const isLastStep = currentStep === steps.length - 1
    const isFirstStep = currentStep === 0

    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* Header */}
            <div className="px-6 py-4" style={{ background: 'var(--vct-bg-elevated)', borderBottom: '1px solid var(--vct-border-subtle)' }}>
                <div className="max-w-3xl mx-auto">
                    <VCT_Text variant="h2" style={{ margin: 0 }}>
                        {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
                        {title}
                    </VCT_Text>
                </div>
            </div>

            {/* Step Indicator */}
            <div className="max-w-3xl mx-auto px-6 py-4">
                <div className="flex items-center gap-2 mb-6">
                    {steps.map((step, i) => (
                        <div key={step.id} className="flex items-center flex-1">
                            <button
                                onClick={() => i < currentStep && onStepChange(i)}
                                className="flex items-center gap-2"
                                style={{
                                    background: 'none', border: 'none', cursor: i < currentStep ? 'pointer' : 'default',
                                    padding: 0,
                                }}
                            >
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                                    style={{
                                        background: i <= currentStep ? 'var(--vct-accent-cyan)' : 'var(--vct-bg-input)',
                                        color: i <= currentStep ? '#fff' : 'var(--vct-text-tertiary)',
                                    }}
                                >
                                    {i < currentStep ? '✓' : step.icon || i + 1}
                                </div>
                                <VCT_Text variant="small" style={{
                                    fontWeight: i === currentStep ? 700 : 400,
                                    color: i <= currentStep ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {step.label}
                                </VCT_Text>
                            </button>
                            {i < steps.length - 1 && (
                                <div className="flex-1 h-px mx-2" style={{
                                    background: i < currentStep ? 'var(--vct-accent-cyan)' : 'var(--vct-border-subtle)',
                                }} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <VCT_Card>
                            <div className="p-6">{steps[currentStep]?.content}</div>
                        </VCT_Card>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex items-center justify-between mt-4">
                    <div>
                        {onCancel && (
                            <VCT_Button variant="ghost" onClick={onCancel}>Hủy</VCT_Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {!isFirstStep && (
                            <VCT_Button variant="secondary" onClick={() => onStepChange(currentStep - 1)}>
                                ← Quay lại
                            </VCT_Button>
                        )}
                        {isLastStep ? (
                            <VCT_Button variant="primary" onClick={onSubmit} disabled={isSubmitting}>
                                {isSubmitting ? '⏳ Đang lưu...' : '✓ Hoàn tất'}
                            </VCT_Button>
                        ) : (
                            <VCT_Button variant="primary" onClick={() => onStepChange(currentStep + 1)}>
                                Tiếp tục →
                            </VCT_Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD PAGE TEMPLATE
   ═══════════════════════════════════════════════════════════════ */

interface DashboardPageProps {
    title: string
    subtitle?: string
    icon?: string
    /** Date range or filter controls */
    headerControls?: ReactNode
    children: ReactNode
}

export function VCT_PageTemplate_Dashboard({
    title, subtitle, icon, headerControls, children,
}: DashboardPageProps) {
    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* Header */}
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <VCT_Text variant="h1" style={{ color: '#fff', margin: 0 }}>
                            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
                            {title}
                        </VCT_Text>
                        {subtitle && <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.6)' }}>{subtitle}</VCT_Text>}
                    </div>
                    {headerControls && <div>{headerControls}</div>}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                {children}
            </div>
        </div>
    )
}
