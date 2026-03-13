'use client'

import { useApiQuery, useApiMutation } from './useApiQuery'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ADMIN API HOOKS
// Typed React hooks for admin workspace: users, audit logs,
// system config, data quality, documents, notifications, integrity.
//
// NOTE: Backend admin APIs are not yet implemented.
// These hooks are wired to future endpoints and will return
// isLoading=false + data=null until the backend is ready.
// Pages should fall back to mock data when data === null.
// ═══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface AdminUser {
    id: string; name: string; email: string; phone: string
    role: string; scope: string
    status: 'active' | 'inactive' | 'locked'
    last_login: string; created_at: string; avatar_letter: string
}

export interface AuditLogEntry {
    id: string; severity: string; timestamp: string
    user: string; role: string; action: string
    resource: string; detail: string; ip: string
}

export interface SystemConfigParam {
    key: string; value: string; description: string; editable: boolean
}

export interface BackupEntry {
    id: string; date: string; size: string
    type: string; status: string
}

export interface DataQualityScore {
    table: string; overall: number
    completeness: number; accuracy: number
    consistency: number; timeliness: number
}

export interface DataQualityRule {
    id: string; table: string; rule: string
    type: string; severity: string
    last_run: string; result: string; detail: string
}

export interface DocumentTemplate {
    id: string; type: string; name: string
    version: number; is_active: boolean
    fields: string[]; federation: string | null
    issued_count: number
}

export interface IssuedDocument {
    id: string; doc_number: string; type: string
    recipient: string; issued_at: string
    status: string; verification_code: string
}

export interface NotificationTemplate {
    id: string; category: string; channel: string
    locale: string; title: string
    variables: string[]; version: number; is_active: boolean
}

export interface NotificationStat {
    category: string; total: number
    delivered: number; failed: number
    read: number; rate: number
}

export interface IntegrityAlert {
    id: string; severity: string; type: string
    tournament: string; detail: string
    status: string; assigned_to: string | null
    reported_at: string
}

// ── Query Hooks ──────────────────────────────────────────────

/** Fetch system users list — GET /api/v1/admin/users */
export function useAdminUsers(params?: { role?: string; status?: string }) {
    const qs = new URLSearchParams()
    if (params?.role) qs.set('role', params.role)
    if (params?.status) qs.set('status', params.status)
    const query = qs.toString()
    return useApiQuery<{ data: AdminUser[]; total: number }>(
        `/api/v1/admin/users${query ? '?' + query : ''}`,
        { enabled: false } // Enable when backend is ready
    )
}

/** Fetch audit logs — GET /api/v1/admin/audit-logs */
export function useAuditLogs(params?: { severity?: string; action?: string }) {
    const qs = new URLSearchParams()
    if (params?.severity) qs.set('severity', params.severity)
    if (params?.action) qs.set('action', params.action)
    const query = qs.toString()
    return useApiQuery<{ data: AuditLogEntry[]; total: number }>(
        `/api/v1/admin/audit-logs${query ? '?' + query : ''}`,
        { enabled: false }
    )
}

/** Fetch system config — GET /api/v1/admin/system/config */
export function useSystemConfig() {
    return useApiQuery<{ data: { params: SystemConfigParam[]; backups: BackupEntry[] } }>(
        '/api/v1/admin/system/config',
        { enabled: false }
    )
}

/** Fetch data quality scores + rules — GET /api/v1/admin/data-quality */
export function useDataQuality() {
    return useApiQuery<{ data: { scores: DataQualityScore[]; rules: DataQualityRule[] } }>(
        '/api/v1/admin/data-quality',
        { enabled: false }
    )
}

/** Fetch document templates + issued — GET /api/v1/admin/documents */
export function useDocumentTemplates() {
    return useApiQuery<{ data: { templates: DocumentTemplate[]; issued: IssuedDocument[] } }>(
        '/api/v1/admin/documents',
        { enabled: false }
    )
}

/** Fetch notification templates + stats — GET /api/v1/admin/notifications */
export function useNotificationTemplates() {
    return useApiQuery<{ data: { templates: NotificationTemplate[]; stats: NotificationStat[] } }>(
        '/api/v1/admin/notifications',
        { enabled: false }
    )
}

/** Fetch integrity alerts — GET /api/v1/admin/integrity */
export function useIntegrityAlerts() {
    return useApiQuery<{ data: IntegrityAlert[]; total: number }>(
        '/api/v1/admin/integrity',
        { enabled: false }
    )
}

// ── Mutation Hooks ───────────────────────────────────────────

/** Create a document template — POST /api/v1/admin/documents/templates */
export function useCreateDocTemplate() {
    return useApiMutation<Partial<DocumentTemplate>, { data: DocumentTemplate }>(
        'POST', '/api/v1/admin/documents/templates'
    )
}

/** Create a notification template — POST /api/v1/admin/notifications/templates */
export function useCreateNotifTemplate() {
    return useApiMutation<Partial<NotificationTemplate>, { data: NotificationTemplate }>(
        'POST', '/api/v1/admin/notifications/templates'
    )
}

/** Update system config param — PATCH /api/v1/admin/system/config */
export function useUpdateSystemConfig() {
    return useApiMutation<{ key: string; value: string }, { data: SystemConfigParam }>(
        'PATCH', '/api/v1/admin/system/config'
    )
}

/** Trigger system backup — POST /api/v1/admin/system/backup */
export function useCreateBackup() {
    return useApiMutation<{ type: string }, { data: BackupEntry }>(
        'POST', '/api/v1/admin/system/backup'
    )
}

/** Clear system cache — POST /api/v1/admin/system/cache/clear */
export function useClearCache() {
    return useApiMutation<Record<string, never>, { success: boolean }>(
        'POST', '/api/v1/admin/system/cache/clear'
    )
}

/** Create/update admin user — POST /api/v1/admin/users */
export function useCreateAdminUser() {
    return useApiMutation<Partial<AdminUser>, { data: AdminUser }>(
        'POST', '/api/v1/admin/users'
    )
}

/** Delete admin user — DELETE /api/v1/admin/users/:id */
export function useDeleteAdminUser(userId: string) {
    return useApiMutation<Record<string, never>, void>(
        'DELETE', `/api/v1/admin/users/${userId}`
    )
}
