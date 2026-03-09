'use client'

import { useState, type ReactNode, type CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/* ────────────────────────────────────────────
 *  VCT_Wizard
 *  Multi-step form with step indicators,
 *  per-step validation, and animated transitions.
 * ──────────────────────────────────────────── */

export interface WizardStep {
    /** Step label shown in the indicator */
    title: string
    /** Step content */
    content: ReactNode
    /** Optional validation function; must return true to proceed */
    validate?: () => boolean
}

export interface VCT_WizardProps {
    /** Wizard steps */
    steps: WizardStep[]
    /** Called when the last step completes */
    onComplete: () => void
    /** Called on every step change */
    onStepChange?: (step: number) => void
    /** Label texts */
    labels?: {
        next?: string
        back?: string
        complete?: string
    }
}

export function VCT_Wizard({
    steps,
    onComplete,
    onStepChange,
    labels,
}: VCT_WizardProps) {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(1) // 1 = forward, -1 = back

    const goTo = (idx: number) => {
        setDirection(idx > current ? 1 : -1)
        setCurrent(idx)
        onStepChange?.(idx)
    }

    const handleNext = () => {
        const step = steps[current]
        if (step?.validate && !step.validate()) return
        if (current < steps.length - 1) {
            goTo(current + 1)
        } else {
            onComplete()
        }
    }

    const handleBack = () => {
        if (current > 0) goTo(current - 1)
    }

    const isLast = current === steps.length - 1

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Step indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }} role="tablist">
                {steps.map((step, i) => {
                    const isCompleted = i < current
                    const isActive = i === current
                    return (
                        <div
                            key={i}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                flex: i < steps.length - 1 ? 1 : undefined,
                            }}
                        >
                            {/* Step circle + label */}
                            <div
                                role="tab"
                                aria-selected={isActive}
                                aria-label={`Bước ${i + 1}: ${step.title}`}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 6,
                                    cursor: isCompleted ? 'pointer' : 'default',
                                }}
                                onClick={() => isCompleted && goTo(i)}
                            >
                                <span
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: 32,
                                        height: 32,
                                        borderRadius: 'var(--vct-radius-full)',
                                        fontSize: 'var(--vct-font-sm)',
                                        fontWeight: 700,
                                        transition: 'all var(--vct-duration-normal) ease',
                                        ...(isActive
                                            ? {
                                                background: 'var(--vct-accent-cyan)',
                                                color: '#fff',
                                                boxShadow: '0 0 0 3px rgba(14,165,233,0.25)',
                                            }
                                            : isCompleted
                                                ? {
                                                    background: 'var(--vct-success)',
                                                    color: '#fff',
                                                }
                                                : {
                                                    background: 'var(--vct-bg-input)',
                                                    color: 'var(--vct-text-tertiary)',
                                                }),
                                    }}
                                >
                                    {isCompleted ? '✓' : i + 1}
                                </span>
                                <span
                                    style={{
                                        fontSize: 'var(--vct-font-xs)',
                                        fontWeight: isActive ? 700 : 500,
                                        color: isActive
                                            ? 'var(--vct-text-primary)'
                                            : isCompleted
                                                ? 'var(--vct-text-secondary)'
                                                : 'var(--vct-text-tertiary)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {step.title}
                                </span>
                            </div>
                            {/* Connector line */}
                            {i < steps.length - 1 && (
                                <div
                                    style={{
                                        flex: 1,
                                        height: 2,
                                        margin: '0 8px',
                                        marginBottom: 22,
                                        borderRadius: 1,
                                        background: i < current
                                            ? 'var(--vct-success)'
                                            : 'var(--vct-border-subtle)',
                                        transition: 'background var(--vct-duration-normal) ease',
                                    }}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Step content */}
            <div style={{ minHeight: 120, position: 'relative', overflow: 'hidden' }}>
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={current}
                        initial={{ opacity: 0, x: direction * 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -30 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        role="tabpanel"
                        aria-label={steps[current]?.title}
                    >
                        {steps[current]?.content}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <button
                    onClick={handleBack}
                    disabled={current === 0}
                    aria-label={labels?.back ?? 'Quay lại'}
                    style={{
                        padding: '8px 20px',
                        border: '1px solid var(--vct-border-subtle)',
                        borderRadius: 'var(--vct-radius-md)',
                        background: 'var(--vct-bg-elevated)',
                        color: current === 0 ? 'var(--vct-text-tertiary)' : 'var(--vct-text-primary)',
                        fontSize: 'var(--vct-font-sm)',
                        fontWeight: 600,
                        cursor: current === 0 ? 'not-allowed' : 'pointer',
                        opacity: current === 0 ? 0.5 : 1,
                        transition: 'all var(--vct-duration-fast) ease',
                    }}
                >
                    {labels?.back ?? 'Quay lại'}
                </button>
                <button
                    onClick={handleNext}
                    aria-label={isLast ? (labels?.complete ?? 'Hoàn tất') : (labels?.next ?? 'Tiếp theo')}
                    style={{
                        padding: '8px 24px',
                        border: 'none',
                        borderRadius: 'var(--vct-radius-md)',
                        background: isLast ? 'var(--vct-success)' : 'var(--vct-accent-cyan)',
                        color: '#fff',
                        fontSize: 'var(--vct-font-sm)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all var(--vct-duration-fast) ease',
                        boxShadow: 'var(--vct-shadow-sm)',
                    }}
                >
                    {isLast ? (labels?.complete ?? 'Hoàn tất') : (labels?.next ?? 'Tiếp theo')}
                </button>
            </div>
        </div>
    )
}
