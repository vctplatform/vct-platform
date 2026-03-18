import { useCallback, useRef, useState } from 'react'

// ════════════════════════════════════════
// useAdminAuditLog — Track admin actions
// ════════════════════════════════════════

export interface AuditEntry {
    id: string
    action: 'create' | 'update' | 'delete' | 'toggle' | 'assign' | 'status_change' | 'config_change'
    entity: string
    entityId: string
    description: string
    user: string
    timestamp: string
    metadata?: Record<string, unknown>
}

/**
 * Hook to log admin actions for audit trail.
 * Stores entries in memory (would connect to API in production).
 *
 * @example
 * ```tsx
 * const { log, entries } = useAdminAuditLog()
 * log({ action: 'create', entity: 'ticket', entityId: 'TKT-100', description: 'Created new ticket' })
 * ```
 */
export function useAdminAuditLog() {
    const [entries, setEntries] = useState<AuditEntry[]>([])
    const counterRef = useRef(0)

    const log = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp' | 'user'>) => {
        counterRef.current += 1
        const newEntry: AuditEntry = {
            ...entry,
            id: `AUDIT-${counterRef.current.toString().padStart(4, '0')}`,
            user: 'admin@vct.vn', // Would come from auth context in production
            timestamp: new Date().toISOString(),
        }
        setEntries(prev => [newEntry, ...prev].slice(0, 100)) // Keep last 100 entries
        // In production: also POST to /admin/audit-log
    }, [])

    const getByEntity = useCallback((entity: string) => {
        return entries.filter(e => e.entity === entity)
    }, [entries])

    const getByAction = useCallback((action: AuditEntry['action']) => {
        return entries.filter(e => e.action === action)
    }, [entries])

    return { log, entries, getByEntity, getByAction }
}
