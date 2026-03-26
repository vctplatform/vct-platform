'use client'
import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FC, ReactNode } from 'react'

const cn = (...tokens: Array<string | false | null | undefined>) =>
    tokens.filter(Boolean).join(' ')

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AccordionItem {
    key: string
    title: ReactNode
    content: ReactNode
    icon?: ReactNode
    disabled?: boolean
}

export interface VCTAccordionProps {
    /** Array of accordion items */
    items: AccordionItem[]
    /** Keys open by default */
    defaultOpenKeys?: string[]
    /** Allow multiple items to be open simultaneously */
    allowMultiple?: boolean
    /** Variant style */
    variant?: 'default' | 'bordered' | 'separated'
    className?: string
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export const VCT_Accordion = ({
    items,
    defaultOpenKeys = [],
    allowMultiple = false,
    variant = 'default',
    className,
}: VCTAccordionProps) => {
    const [openKeys, setOpenKeys] = React.useState<Set<string>>(
        () => new Set(defaultOpenKeys)
    )

    const toggle = (key: string) => {
        setOpenKeys((prev) => {
            const next = new Set(prev)
            if (next.has(key)) {
                next.delete(key)
            } else {
                if (!allowMultiple) next.clear()
                next.add(key)
            }
            return next
        })
    }

    const wrapperClass: Record<string, string> = {
        default: 'divide-y divide-vct-border',
        bordered:
            'divide-y divide-vct-border rounded-xl border border-vct-border overflow-hidden',
        separated: 'grid gap-2',
    }

    return (
        <div className={cn(wrapperClass[variant], className ?? '')}>
            {items.map((item) => {
                const isOpen = openKeys.has(item.key)
                const itemClass =
                    variant === 'separated'
                        ? 'rounded-xl border border-vct-border overflow-hidden'
                        : ''

                return (
                    <div key={item.key} className={itemClass}>
                        {/* Header / trigger */}
                        <button
                            type="button"
                            onClick={() => !item.disabled && toggle(item.key)}
                            disabled={item.disabled}
                            aria-expanded={isOpen}
                            className={cn(
                                'flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold transition',
                                'bg-vct-elevated hover:bg-vct-input',
                                'disabled:cursor-not-allowed disabled:opacity-50',
                                'text-vct-text'
                            )}
                        >
                            {item.icon ? (
                                <span className="shrink-0 text-vct-text-muted">
                                    {item.icon}
                                </span>
                            ) : null}

                            <span className="flex-1">{item.title}</span>

                            {/* Chevron */}
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                className={cn(
                                    'shrink-0 text-vct-text-muted transition-transform duration-200',
                                    isOpen && 'rotate-180'
                                )}
                            >
                                <path
                                    d="M4 6L8 10L12 6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {/* Content panel with framer-motion animation */}
                        <AnimatePresence initial={false}>
                            {isOpen ? (
                                <motion.div
                                    key="content"
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                                    className="overflow-hidden"
                                >
                                    <div className="px-4 pb-4 pt-1 text-sm text-vct-text-muted leading-relaxed">
                                        {item.content}
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                )
            })}
        </div>
    )
}

export const VCTAccordion = VCT_Accordion as FC<VCTAccordionProps>
