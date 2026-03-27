/**
 * VCT Notification Center (Pure UI)
 * 
 * A high-performance, animated drawer for notifications.
 * Accepts any content via children and supports categorized tabs.
 */

'use client'

import React from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text, VCT_Button } from './vct-ui-layout'
import { VCT_Badge } from './vct-ui-data-display'

/* ── Types ──────────────────────────────────────────────────── */

export interface NotificationTab {
    id: string
    label: string
    count?: number
}

export interface NotificationCenterProps {
    /** Whether the drawer is open */
    isOpen: boolean
    /** Called when the drawer should close */
    onClose: () => void
    /** Total number of unread notifications */
    unreadCount?: number
    /** Label for the "Mark all as read" button */
    markAllReadLabel?: string
    /** Called when "Mark all as read" is clicked */
    onMarkAllRead?: () => void
    /** List of category tabs */
    tabs?: NotificationTab[]
    /** Current active tab ID */
    activeTabId?: string
    /** Called when a tab is clicked */
    onTabChange?: (id: string) => void
    /** Main content (usually a list of notifications) */
    children?: React.ReactNode
    /** Header title */
    title?: string
}

/* ── Notification Center Component ──────────────────────────── */

export function NotificationCenter({
    isOpen,
    onClose,
    unreadCount = 0,
    markAllReadLabel = 'Đã đọc tất cả',
    onMarkAllRead,
    tabs = [],
    activeTabId,
    onTabChange,
    children,
    title = 'Thông báo',
}: NotificationCenterProps) {
    if (typeof document === 'undefined') return null

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
                        style={{ zIndex: 99999 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                    />

                    {/* Panel */}
                    <motion.div
                        className="fixed top-0 right-0 h-full flex flex-col border-l border-(--vct-border-subtle) bg-(--vct-bg-elevated) shadow-(--vct-shadow-xl)"
                        style={{
                            zIndex: 99999,
                            width: '420px',
                            maxWidth: '90vw',
                        }}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        role="dialog"
                        aria-label={title}
                        aria-modal="true"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-(--vct-border-subtle) px-5 py-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="m-0 text-base font-bold text-(--vct-text-primary)">
                                        {title}
                                    </h3>
                                    {unreadCount > 0 && (
                                        <VCT_Badge type="danger" text={String(unreadCount)} />
                                    )}
                                </div>
                                {unreadCount > 0 && (
                                    <p className="mt-0.5 text-xs text-(--vct-text-tertiary)">
                                        {unreadCount} thông báo chưa đọc
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && onMarkAllRead && (
                                    <button
                                        onClick={onMarkAllRead}
                                        className="rounded-md border-none bg-transparent px-2 py-1 text-xs font-semibold text-(--vct-accent-cyan) transition hover:bg-(--vct-bg-hover)"
                                    >
                                        {markAllReadLabel}
                                    </button>
                                )}
                                <button
                                    onClick={onClose}
                                    aria-label="Đóng"
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md border-none bg-transparent text-lg text-(--vct-text-tertiary) transition hover:bg-(--vct-bg-hover) hover:text-(--vct-text-primary)"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Tabs */}
                        {tabs.length > 0 && (
                            <div className="flex gap-0.5 border-b border-(--vct-border-subtle) px-5 pt-2">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.id}
                                        onClick={() => onTabChange?.(tab.id)}
                                        className={`-mb-px border-none bg-transparent px-3 py-2 text-xs font-medium transition ${activeTabId === tab.id
                                            ? 'border-b-2 border-(--vct-accent-cyan) font-bold text-(--vct-accent-cyan)'
                                            : 'border-b-2 border-transparent text-(--vct-text-tertiary) hover:text-(--vct-text-primary)'
                                            }`}
                                    >
                                        {tab.label}
                                        {tab.count !== undefined && tab.count > 0 && (
                                            <span className="ml-1.5 inline-flex min-w-[16px] items-center justify-center rounded-full bg-(--vct-danger) px-1 text-[9px] font-bold leading-none text-white">
                                                {tab.count}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Content */}
                        <div className="vct-hide-scrollbar flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    )
}

/* ── Notification Bell ──────────────────────────────────────── */

interface NotificationBellProps {
    count: number
    onClick: () => void
}

