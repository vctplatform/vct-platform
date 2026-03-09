'use client'

import { useState, useRef, useEffect, useCallback, type ReactNode, type CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_Dropdown
 *  Action menu with keyboard navigation (↑↓ Enter Esc).
 *  Click-outside dismiss, framer-motion animation.
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

    const menuStyle: CSSProperties = {
        position: 'absolute',
        top: '100%',
        [align === 'right' ? 'right' : 'left']: 0,
        marginTop: 6,
        minWidth: 180,
        zIndex: 'var(--vct-z-dropdown, 100)' as any,
        borderRadius: 'var(--vct-radius-md)',
        background: 'var(--vct-bg-elevated)',
        border: '1px solid var(--vct-border-subtle)',
        boxShadow: 'var(--vct-shadow-xl)',
        padding: '4px 0',
        animation: 'vct-scale-in 0.15s var(--vct-ease-out) both',
        transformOrigin: align === 'right' ? 'top right' : 'top left',
    }

    return (
        <div
            ref={wrapperRef}
            className={className}
            style={{ position: 'relative', display: 'inline-flex' }}
            onKeyDown={handleKeyDown}
        >
            <span
                onClick={() => { setOpen((v) => !v); setFocusedIdx(-1) }}
                role="button"
                tabIndex={0}
                aria-haspopup="menu"
                aria-expanded={open}
                style={{ cursor: 'pointer', display: 'inline-flex' }}
            >
                {trigger}
            </span>

            {open && (
                <div role="menu" style={menuStyle}>
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
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                width: '100%',
                                padding: '8px 12px',
                                border: 'none',
                                background: i === focusedIdx ? 'var(--vct-bg-hover)' : 'transparent',
                                color: item.danger ? 'var(--vct-danger)' : 'var(--vct-text-primary)',
                                fontSize: 'var(--vct-font-sm)',
                                fontWeight: 500,
                                textAlign: 'left',
                                cursor: item.disabled ? 'not-allowed' : 'pointer',
                                opacity: item.disabled ? 0.5 : 1,
                                transition: 'background var(--vct-duration-fast) ease',
                            }}
                            onMouseEnter={() => setFocusedIdx(i)}
                            onMouseLeave={() => setFocusedIdx(-1)}
                        >
                            {item.icon && <span style={{ display: 'inline-flex', flexShrink: 0, width: 18, height: 18 }}>{item.icon}</span>}
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
