// ── Training Module Types ────────────────────────────────────
// Covers: curriculum, techniques, training plans, attendance,
// belt examinations, and training sessions.

export interface Curriculum {
    id: string
    name: string
    level: string // e.g., 'co_ban', 'trung_cap', 'nang_cao'
    belt_rank_code: string
    description?: string
    estimated_months: number
    techniques: CurriculumTechnique[]
    requirements?: string[]
    metadata?: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface CurriculumTechnique {
    technique_id: string
    order_index: number
    is_required: boolean
    proficiency_level: 'nhap_mon' | 'thuc_hanh' | 'thanh_thao'
}

export interface Technique {
    id: string
    name_vi: string
    name_en?: string
    category: 'quyen' | 'doi_khang' | 'binh_khi' | 'tu_ve' | 'khi_cong'
    subcategory?: string
    difficulty: 1 | 2 | 3 | 4 | 5
    description: string
    instructions?: string
    key_points?: string[]
    common_mistakes?: string[]
    media?: TechniqueMedia[]
    belt_requirement?: string
    created_at: string
}

export interface TechniqueMedia {
    id: string
    technique_id: string
    type: 'video' | 'image' | 'diagram'
    url: string
    thumbnail_url?: string
    title?: string
    duration_sec?: number
}

export interface TrainingPlan {
    id: string
    club_id: string
    coach_id: string
    name: string
    start_date: string
    end_date: string
    goal?: string
    target_belt?: string
    sessions_per_week: number
    status: 'draft' | 'active' | 'completed' | 'paused'
    sessions: TrainingSession[]
    created_at: string
}

export interface TrainingSession {
    id: string
    plan_id: string
    date: string
    start_time: string
    end_time: string
    location?: string
    coach_id: string
    techniques: string[] // technique IDs
    notes?: string
    status: 'scheduled' | 'completed' | 'cancelled'
    attendance?: AttendanceRecord[]
}

export interface AttendanceRecord {
    id: string
    session_id: string
    athlete_id: string
    athlete_name: string
    status: 'present' | 'absent' | 'late' | 'excused'
    check_in_time?: string
    notes?: string
}

export interface BeltExam {
    id: string
    club_id: string
    date: string
    target_belt: string
    examiner_ids: string[]
    candidates: BeltExamCandidate[]
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
    location?: string
    notes?: string
    created_at: string
}

export interface BeltExamCandidate {
    athlete_id: string
    athlete_name: string
    current_belt: string
    target_belt: string
    score?: number
    passed?: boolean
    examiner_notes?: string
}
