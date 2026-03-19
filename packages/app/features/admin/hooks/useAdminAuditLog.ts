import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../auth/AuthProvider'
import { apiFetch } from './useAdminAPI'

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
 * POSTs entries to backend API and keeps local state for immediate display.
 */
export function useAdminAuditLog() {
    const [entries, setEntries] = useState<AuditEntry[]>([])
    const counterRef = useRef(0)
    const { currentUser } = useAuth()

    const log = useCallback((entry: Omit<AuditEntry, 'id' | 'timestamp' | 'user'>) => {
        counterRef.current += 1
        const newEntry: AuditEntry = {
            ...entry,
            id: `AUDIT-${counterRef.current.toString().padStart(4, '0')}`,
            user: currentUser?.email || currentUser?.name || 'unknown',
            timestamp: new Date().toISOString(),
        }
        setEntries(prev => [newEntry, ...prev].slice(0, 100))

        // Fire-and-forget POST to backend
        apiFetch('/admin/audit-logs', {
            method: 'POST',
            body: JSON.stringify(newEntry),
        }).catch(() => { /* swallow — local entry already recorded */ })
    }, [currentUser])

    const getByEntity = useCallback((entity: string) => {
        return entries.filter(e => e.entity === entity)
    }, [entries])

    const getByAction = useCallback((action: AuditEntry['action']) => {
        return entries.filter(e => e.action === action)
    }, [entries])

    return { log, entries, getByEntity, getByAction }
}
