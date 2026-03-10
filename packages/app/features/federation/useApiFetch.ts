/**
 * ═══════════════════════════════════════════════════════════════
 * VCT PLATFORM — CENTRALIZED API CLIENT HOOK
 * Reusable fetch wrapper for all federation API calls.
 * ═══════════════════════════════════════════════════════════════
 */

import { useState, useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

interface ApiState<T> {
    data: T | null
    loading: boolean
    error: string | null
}

interface ApiOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    body?: unknown
    headers?: Record<string, string>
}

/**
 * Generic hook for making authenticated API calls.
 *
 * Usage:
 * ```tsx
 * const { data, loading, error, execute } = useApiFetch<Partner[]>()
 * useEffect(() => { execute('/international/partners') }, [])
 * ```
 */
export function useApiFetch<T = unknown>() {
    const [state, setState] = useState<ApiState<T>>({
        data: null,
        loading: false,
        error: null,
    })

    const execute = useCallback(async (path: string, options?: ApiOptions): Promise<T | null> => {
        setState(prev => ({ ...prev, loading: true, error: null }))

        try {
            const url = `${API_BASE}${path}`
            const token = typeof window !== 'undefined'
                ? localStorage.getItem('vct_access_token') || ''
                : ''

            const res = await fetch(url, {
                method: options?.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...options?.headers,
                },
                ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
            })

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({ message: res.statusText }))
                throw new Error(errBody.message || `HTTP ${res.status}`)
            }

            const json = await res.json()
            setState({ data: json as T, loading: false, error: null })
            return json as T
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error'
            setState(prev => ({ ...prev, loading: false, error: message }))
            return null
        }
    }, [])

    const reset = useCallback(() => {
        setState({ data: null, loading: false, error: null })
    }, [])

    return { ...state, execute, reset }
}

/**
 * Convenience wrappers for specific API sections.
 */
export const federationApi = {
    // ── Federation ─────────────────────────────────────────
    listProvinces: () => fetch(`${API_BASE}/federation/provinces`),
    getProvince: (id: string) => fetch(`${API_BASE}/federation/provinces/${id}`),
    getOrgChart: () => fetch(`${API_BASE}/federation/org-chart`),
    getStats: () => fetch(`${API_BASE}/federation/stats`),

    // ── Documents ──────────────────────────────────────────
    listDocuments: (params?: Record<string, string>) => {
        const qs = params ? '?' + new URLSearchParams(params).toString() : ''
        return fetch(`${API_BASE}/documents${qs}`)
    },
    getDocument: (id: string) => fetch(`${API_BASE}/documents/${id}`),

    // ── Discipline ─────────────────────────────────────────
    listCases: (status?: string) => {
        const qs = status ? `?status=${status}` : ''
        return fetch(`${API_BASE}/discipline/cases${qs}`)
    },
    getCase: (id: string) => fetch(`${API_BASE}/discipline/cases/${id}`),

    // ── Certifications ─────────────────────────────────────
    listCerts: () => fetch(`${API_BASE}/certifications`),
    verifyCert: (code: string) => fetch(`${API_BASE}/public/certifications/verify/${code}`),

    // ── Approvals ──────────────────────────────────────────
    listWorkflows: () => fetch(`${API_BASE}/approvals/workflows`),
    myPending: () => fetch(`${API_BASE}/approvals/my-pending`),
    myRequests: () => fetch(`${API_BASE}/approvals/my-requests`),
    getApproval: (id: string) => fetch(`${API_BASE}/approvals/${id}`),

    // ── International ──────────────────────────────────────
    listPartners: () => fetch(`${API_BASE}/international/partners`),
    listEvents: () => fetch(`${API_BASE}/international/events`),
    listDelegations: (eventId?: string) => {
        const qs = eventId ? `?event_id=${eventId}` : ''
        return fetch(`${API_BASE}/international/delegations${qs}`)
    },
}
