'use client'

import { useApiQuery } from './useApiQuery'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION API HOOKS
// Typed React hooks for all federation API endpoints.
// ═══════════════════════════════════════════════════════════════

const API_BASE = '/api/v1/federation'

// ── Types ────────────────────────────────────────────────────

export interface PaginatedResult<T> {
    items: T[]
    total: number
    page: number
    limit: number
    total_pages: number
}

export interface Province {
    id: string; code: string; name: string; region: string
    has_fed: boolean; club_count: number; vdv_count: number; coach_count: number
    status?: string; created_at?: string
}

export interface FederationUnit {
    id: string; name: string; short_name: string; type: string
    parent_id?: string; status: string; leader_name?: string
    club_count: number; member_count: number
}

export interface PersonnelAssignment {
    id: string; user_id: string; user_name: string
    unit_id: string; unit_name: string; position: string
    role_code: string; start_date: string; is_active: boolean
}

export interface NationalStatistics {
    total_provinces: number; active_provinces: number
    total_clubs: number; total_athletes: number
    total_coaches: number; total_referees: number
    active_tournaments: number; total_tournaments_ytd: number
    by_region: Record<string, number>
    top_provinces_by_clubs: Province[]
}

export interface MasterBelt {
    level: number; name: string; color_hex: string
    required_time_min: number; is_dan_level: boolean; description: string
}

export interface MasterWeightClass {
    id: string; gender: string; category: string
    min_weight: number; max_weight: number; is_heavy: boolean
}

export interface MasterAgeGroup {
    id: string; name: string; min_age: number; max_age: number
}

export interface MasterContent {
    id: string; code: string; name: string; description: string
    requires_weight: boolean; is_team_event: boolean
    min_athletes: number; max_athletes: number; has_weapon: boolean
}

export interface ApprovalRequest {
    id: string; type: string; title: string; description: string
    status: string; submitted_by: string; submitted_at: string
    notes: string
}

// ── Hooks ────────────────────────────────────────────────────

export function useFederationStats() {
    return useApiQuery<NationalStatistics>(`${API_BASE}/statistics`)
}

export function useFederationProvinces(params?: { page?: number; limit?: number; search?: string }) {
    const qs = new URLSearchParams()
    if (params?.page) qs.set('page', String(params.page))
    if (params?.limit) qs.set('limit', String(params.limit))
    if (params?.search) qs.set('search', params.search)
    const query = qs.toString()
    return useApiQuery<Province[]>(`${API_BASE}/provinces${query ? '?' + query : ''}`)
}

export function useFederationUnits() {
    return useApiQuery<FederationUnit[]>(`${API_BASE}/units`)
}

export function useFederationPersonnel(unitId?: string) {
    const qs = unitId ? `?unit_id=${unitId}` : ''
    return useApiQuery<PersonnelAssignment[]>(`${API_BASE}/personnel${qs}`)
}

export function useFederationOrgChart() {
    return useApiQuery<any[]>(`${API_BASE}/org-chart`)
}

export function useMasterBelts() {
    return useApiQuery<MasterBelt[]>(`${API_BASE}/master/belts`)
}

export function useMasterWeights() {
    return useApiQuery<MasterWeightClass[]>(`${API_BASE}/master/weights`)
}

export function useMasterAges() {
    return useApiQuery<MasterAgeGroup[]>(`${API_BASE}/master/ages`)
}

export function useMasterContents() {
    return useApiQuery<MasterContent[]>(`${API_BASE}/master/contents`)
}

export function useFederationApprovals(status?: string) {
    const qs = status ? `?status=${status}` : ''
    return useApiQuery<ApprovalRequest[]>(`${API_BASE}/approvals${qs}`)
}

// ── Mutation Helpers ─────────────────────────────────────────

export async function createProvince(data: Partial<Province>) {
    const res = await fetch(`${API_BASE}/provinces`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw await res.json()
    return res.json()
}

export async function createUnit(data: Partial<FederationUnit>) {
    const res = await fetch(`${API_BASE}/units`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw await res.json()
    return res.json()
}

export async function assignPersonnel(data: Partial<PersonnelAssignment>) {
    const res = await fetch(`${API_BASE}/personnel`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw await res.json()
    return res.json()
}

export async function createMasterContent(data: Partial<MasterContent>) {
    const res = await fetch(`${API_BASE}/master/contents`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    if (!res.ok) throw await res.json()
    return res.json()
}

export async function processApproval(id: string, action: 'APPROVE' | 'REJECT', notes?: string) {
    const res = await fetch(`${API_BASE}/approvals/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes }),
    })
    if (!res.ok) throw await res.json()
    return res.json()
}
