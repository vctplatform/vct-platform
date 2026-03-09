// ── Heritage Module Types ────────────────────────────────────
// Covers: martial arts schools (môn phái), lineage trees,
// heritage techniques, historical documentation.

export interface MartialSchool {
    id: string
    name_vi: string
    name_en?: string
    founder?: string
    founding_year?: number
    origin_location?: string
    province?: string
    description?: string
    philosophy?: string
    parent_school_id?: string
    logo_url?: string
    is_active: boolean
    recognized_by?: string[] // federation IDs
    notable_techniques?: string[]
    metadata?: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface SchoolLineage {
    id: string
    school_id: string
    master_name: string
    generation: number
    title?: string // 'Sáng Tổ', 'Chưởng Môn', 'Trưởng Tràng', etc.
    period?: string // e.g., '1920-1985'
    biography?: string
    avatar_url?: string
    parent_lineage_id?: string
    children_ids?: string[]
    contributions?: string[]
}

export interface LineageNode {
    id: string
    name: string
    generation: number
    title?: string
    period?: string
    avatar_url?: string
    children: LineageNode[]
}

export interface HeritageTechnique {
    id: string
    school_id: string
    name_vi: string
    name_en?: string
    category: 'quyen' | 'binh_khi' | 'tu_ve' | 'khi_cong' | 'y_hoc'
    origin_story?: string
    description?: string
    difficulty: 1 | 2 | 3 | 4 | 5
    is_traditional: boolean
    recognition_status?: 'di_san_van_hoa' | 'quoc_gia' | 'dia_phuong' | 'chua_cong_nhan'
    media?: HeritageMedia[]
    metadata?: Record<string, unknown>
    created_at: string
}

export interface HeritageMedia {
    id: string
    type: 'video' | 'image' | 'document' | 'audio'
    url: string
    thumbnail_url?: string
    title?: string
    description?: string
    author?: string
    year?: number
    source?: string
    tags?: string[]
}
