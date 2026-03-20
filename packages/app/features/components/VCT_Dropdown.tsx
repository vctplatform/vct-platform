'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'

/* ────────────────────────────────────────────
 *  VCT_Dropdown
 *  Action menu with keyboard navigation (↑↓ Enter Esc).
 *  Click-outside dismiss, Tailwind-styled.
 * ──────────────────────────────────────────── */

export interface DropdownItem {
    label: string
    icon?: ReactNode
    onClick: () => void
    danger?: boolean
    disabled?: boolean
}

export interface VCT_DropdownProps {
    /** Trigger element (button, icon, etc.) */
    trigger: ReactNode
    /** Menu items */
    items: DropdownItem[]
    /** Menu alignment */
    align?: 'left' | 'right'
    /** Additional class on wrapper */
    className?: string
}

export function VCT_Dropdown({ trigger, items, align = 'right', className }: VCT_DropdownProps) {
    const [open, setOpen] = useState(false)
    const [focusedIdx, setFocusedIdx] = useState(-1)
    const wrapperRef = useRef<HTMLDivElement>(null)

    // Click-outside dismiss
    useEffect(() => {
        if (!open) return
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [open])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (!open) {
                if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                    e.preventDefault()
                    setOpen(true)
                    setFocusedIdx(0)
                }
                return
            }

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setFocusedIdx((prev) => (prev + 1) % items.length)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setFocusedIdx((prev) => (prev - 1 + items.length) % items.length)
                    break
                case 'Enter':
                    e.preventDefault()
                    if (focusedIdx >= 0 && !items[focusedIdx]?.disabled) {
                        items[focusedIdx]?.onClick()
                        setOpen(false)
                    }
                    break
                case 'Escape':
                    setOpen(false)
                    setFocusedIdx(-1)
                    break
            }
        },
        [open, focusedIdx, items]
    )

    return (
        <div
            ref={wrapperRef}
            className={`relative inline-flex ${className ?? ''}`}
            onKeyDown={handleKeyDown}
        >
            <span
                onClick={() => { setOpen((v) => !v); setFocusedIdx(-1) }}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={open}
                className="inline-flex cursor-pointer"
            >
                {trigger}
            </span>

            {open && (
                <div
                    role="menu"
                    className={`absolute top-full z- mt-1.5 min-w-[200px] rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-elevated) py-1 shadow-(--vct-shadow-xl) animate-[vct-scale-in_0.15s_var(--vct-ease-out)_both] ${align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'}`}
                >
                    {items.map((item, i) => (
                        <button
                            key={item.label}
                            role="menuitem"
                            tabIndex={-1}
                            disabled={item.disabled}
                            onClick={() => {
                                if (!item.disabled) {
                                    item.onClick()
                                    setOpen(false)
                                }
                            }}
                            className={`flex w-full items-center gap-2.5 border-none px-3 py-2.5 text-left text-sm transition ${item.disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                } ${item.danger
                                    ? 'text-(--vct-danger) hover:bg-red-500/10'
                                    : 'text-(--vct-text-primary) hover:bg-(--vct-bg-hover)'
                                } ${i === focusedIdx ? 'bg-(--vct-bg-hover)' : 'bg-transparent'
                                } ${i === 0 ? 'border-b border-(--vct-border-subtle) pb-2.5 mb-1 font-semibold text-xs' : 'font-medium'
                                }`}
                            onMouseEnter={() => setFocusedIdx(i)}
                            onMouseLeave={() => setFocusedIdx(-1)}
                        >
                            {item.icon && <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center opacity-70">{item.icon}</span>}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
