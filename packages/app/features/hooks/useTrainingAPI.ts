'use client'

import { useApiQuery, useApiMutation } from './useApiQuery'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TRAINING API HOOKS
// Typed React hooks for curriculum, training plans, attendance,
// belt exams, techniques, and e-learning.
// ═══════════════════════════════════════════════════════════════

// ── Types ────────────────────────────────────────────────────

export interface Curriculum {
    id: string; title: string; code: string
    belt_level: string; estimated_months: number
    forms: string[]; techniques_count: number
    status: 'draft' | 'published' | 'archived'
    last_updated?: string; description?: string
}

export interface TrainingPlan {
    id: string; name: string; description?: string
    duration_weeks: number; sessions_per_week: number
    target_level?: string; objectives?: string[]
    schedule?: TrainingSession[]; status?: string
    created_at?: string
}

export interface TrainingSession {
    day: string; time: string; duration_minutes: number
    focus: string; instructor?: string; location?: string
}

export interface AttendanceRecord {
    id: string; student_id: string; student_name?: string
    class_id?: string; date: string; status: 'present' | 'absent' | 'late' | 'excused'
    checked_in_at?: string; notes?: string
}

export interface BeltExam {
    id: string; name: string; exam_date: string
    belt_level: string; location?: string
    examiner?: string; status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    registered_count?: number; passed_count?: number
    candidates?: BeltExamCandidate[]
}

export interface BeltExamCandidate {
    id: string; student_name: string; current_belt: string
    target_belt: string; result?: 'pass' | 'fail' | 'pending'
    score?: number; notes?: string
}

export interface ELearningCourse {
    id: string; title: string; description?: string
    category: string; level: string; duration_hours: number
    lessons_count: number; enrolled_count?: number
    instructor?: string; thumbnail_url?: string
    status: 'draft' | 'published' | 'archived'
}

// ── Query Hooks ──────────────────────────────────────────────

export function useCurriculums() {
    return useApiQuery<Curriculum[]>('/api/v1/training_curriculums')
}

export function useCurriculum(id: string) {
    return useApiQuery<Curriculum>(`/api/v1/training_curriculums/${id}`, { enabled: !!id })
}

export function useTrainingPlans() {
    return useApiQuery<TrainingPlan[]>('/api/v1/training_plans')
}

export function useAttendance(params?: { date?: string; class_id?: string }) {
    const qs = new URLSearchParams()
    if (params?.date) qs.set('date', params.date)
    if (params?.class_id) qs.set('class_id', params.class_id)
    const query = qs.toString()
    return useApiQuery<AttendanceRecord[]>(`/api/v1/training_attendance${query ? '?' + query : ''}`)
}

export function useBeltExams(status?: string) {
    const qs = status ? `?status=${status}` : ''
    return useApiQuery<BeltExam[]>(`/api/v1/training_belt_exams${qs}`)
}

export function useELearningCourses() {
    return useApiQuery<ELearningCourse[]>('/api/v1/training_elearning')
}

// ── Mutation Hooks ───────────────────────────────────────────

export function useCreateCurriculum() {
    return useApiMutation<Partial<Curriculum>, Curriculum>('POST', '/api/v1/training_curriculums')
}

export function useUpdateCurriculum(id: string) {
    return useApiMutation<Partial<Curriculum>, Curriculum>('PATCH', `/api/v1/training_curriculums/${id}`)
}

export function useDeleteCurriculum(id: string) {
    return useApiMutation<void, void>('DELETE', `/api/v1/training_curriculums/${id}`)
}

export function useRecordAttendance() {
    return useApiMutation<Partial<AttendanceRecord>, AttendanceRecord>('POST', '/api/v1/training_attendance')
}

export function useCreateBeltExam() {
    return useApiMutation<Partial<BeltExam>, BeltExam>('POST', '/api/v1/training_belt_exams')
}
