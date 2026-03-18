import { useEffect, useCallback } from 'react'

type ShortcutAction = () => void

interface AdminShortcuts {
    /** Ctrl+K or Cmd+K — open command palette */
    onCommandPalette?: ShortcutAction
    /** Ctrl+/ or Cmd+/ — focus search input */
    onFocusSearch?: ShortcutAction
    /** Escape — close active modal/drawer */
    onEscape?: ShortcutAction
    /** N — create new item (only when not in input) */
    onNew?: ShortcutAction
    /** E — edit selected item (only when not in input) */
    onEdit?: ShortcutAction
    /** D or Delete — delete selected item (only when not in input) */
    onDelete?: ShortcutAction
}

/**
 * Admin keyboard shortcuts hook.
 * Registers global keyboard shortcuts for admin power-user workflows.
 *
 * @example
 * useAdminShortcuts({
 *     onCommandPalette: () => setShowPalette(true),
 *     onFocusSearch: () => searchRef.current?.focus(),
 *     onEscape: () => { setDrawer(null); setModal(false) },
 *     onNew: () => openCreateForm(),
 *     onEdit: () => selected && openEditForm(selected),
 *     onDelete: () => selected && confirmDelete(selected),
 * })
 */
export function useAdminShortcuts(shortcuts: AdminShortcuts) {
    const handler = useCallback((e: KeyboardEvent) => {
        // Skip if user is typing in an input
        const target = e.target as HTMLElement
        const isInput = target instanceof HTMLInputElement
            || target instanceof HTMLTextAreaElement
            || target.contentEditable === 'true'

        const mod = e.ctrlKey || e.metaKey

        // Ctrl+K — command palette (always capture, even in inputs)
        if (mod && e.key === 'k') {
            e.preventDefault()
            shortcuts.onCommandPalette?.()
            return
        }

        // Ctrl+/ — focus search (always capture)
        if (mod && e.key === '/') {
            e.preventDefault()
            shortcuts.onFocusSearch?.()
            return
        }

        // Escape — close modal/drawer (works everywhere)
        if (e.key === 'Escape') {
            shortcuts.onEscape?.()
            return
        }

        // Page-level shortcuts — only when NOT in input fields
        if (isInput) return

        // N — new/create
        if (e.key === 'n' || e.key === 'N') {
            e.preventDefault()
            shortcuts.onNew?.()
            return
        }

        // E — edit selected
        if (e.key === 'e' || e.key === 'E') {
            e.preventDefault()
            shortcuts.onEdit?.()
            return
        }

        // D or Delete — delete selected
        if (e.key === 'd' || e.key === 'D' || e.key === 'Delete') {
            e.preventDefault()
            shortcuts.onDelete?.()
            return
        }
    }, [shortcuts])

    useEffect(() => {
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [handler])
}
