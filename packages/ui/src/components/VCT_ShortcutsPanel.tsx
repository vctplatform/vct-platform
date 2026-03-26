'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Icons } from './vct-icons'

/**
 * VCT_ShortcutsPanel — Keyboard shortcuts help overlay
 * Toggle with "?" key. Shows all available keyboard shortcuts.
 */

interface ShortcutGroup {
    title: string
    shortcuts: Array<{ keys: string[]; description: string }>
}

const SHORTCUTS: ShortcutGroup[] = [
    {
        title: 'Điều hướng',
        shortcuts: [
            { keys: ['Ctrl', 'K'], description: 'Mở Command Palette' },
            { keys: ['?'], description: 'Hiện phím tắt' },
            { keys: ['Esc'], description: 'Đóng dialog / modal' },
        ],
    },
    {
        title: 'Hành động',
        shortcuts: [
            { keys: ['Ctrl', 'S'], description: 'Lưu thay đổi' },
            { keys: ['Ctrl', 'P'], description: 'In / Xuất PDF' },
            { keys: ['Ctrl', 'N'], description: 'Tạo mới' },
            { keys: ['Ctrl', 'F'], description: 'Tìm kiếm' },
        ],
    },
    {
        title: 'Bảng dữ liệu',
        shortcuts: [
            { keys: ['↑', '↓'], description: 'Di chuyển giữa các dòng' },
            { keys: ['Enter'], description: 'Mở chi tiết / Xác nhận' },
            { keys: ['Space'], description: 'Chọn / Bỏ chọn' },
            { keys: ['Ctrl', 'A'], description: 'Chọn tất cả' },
        ],
    },
]

const Kbd = ({ children }: { children: ReactNode }) => (
    <kbd className="inline-flex min-w-[24px] items-center justify-center rounded-md border border-(--vct-border-strong) bg-(--vct-bg-elevated) px-1.5 py-0.5 font-mono text-[11px] font-bold text-(--vct-text-primary) shadow-[0_1px_2px_rgba(0,0,0,0.15)]">
        {children}
    </kbd>
)

export function VCT_ShortcutsPanel() {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // "?" key (Shift + /)
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                const tag = (e.target as HTMLElement)?.tagName
                if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
                e.preventDefault()
                setOpen(v => !v)
            }
            if (e.key === 'Escape' && open) {
                setOpen(false)
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [open])

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z- bg-black/50 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="fixed inset-x-4 top-[10%] z- mx-auto max-w-lg overflow-hidden rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) shadow-2xl sm:inset-x-auto"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-(--vct-border-subtle) px-5 py-4">
                            <div className="flex items-center gap-2">
                                <VCT_Icons.Settings size={18} />
                                <span className="text-sm font-extrabold">Phím Tắt</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="rounded-lg p-1.5 text-(--vct-text-tertiary) transition hover:bg-(--vct-bg-elevated)"
                            >
                                <VCT_Icons.x size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-[60vh] overflow-y-auto p-5">
                            {SHORTCUTS.map((group, gi) => (
                                <div key={gi} className={gi > 0 ? 'mt-5' : ''}>
                                    <h3 className="mb-3 text-[10px] font-extrabold uppercase tracking-widest text-(--vct-text-tertiary)">
                                        {group.title}
                                    </h3>
                                    <div className="space-y-2">
                                        {group.shortcuts.map((s, si) => (
                                            <div key={si} className="flex items-center justify-between rounded-lg px-2 py-1.5 transition hover:bg-(--vct-bg-elevated)">
                                                <span className="text-[13px] text-(--vct-text-secondary)">{s.description}</span>
                                                <div className="flex items-center gap-1">
                                                    {s.keys.map((k, ki) => (
                                                        <span key={ki} className="flex items-center gap-1">
                                                            {ki > 0 && <span className="text-[10px] text-(--vct-text-tertiary)">+</span>}
                                                            <Kbd>{k}</Kbd>
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-(--vct-border-subtle) px-5 py-3 text-center text-[11px] text-(--vct-text-tertiary)">
                            Nhấn <Kbd>?</Kbd> để đóng • <Kbd>Esc</Kbd> để thoát
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
