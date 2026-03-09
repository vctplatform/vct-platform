// ── Community Module Types ───────────────────────────────────
// Social features: posts, comments, groups, reactions,
// marketplace listings, notifications.

export interface Post {
    id: string
    author_id: string
    author_name: string
    author_avatar?: string
    author_role?: string
    content: string
    media_urls?: string[]
    tags?: string[]
    group_id?: string
    visibility: 'public' | 'members' | 'group_only'
    reaction_counts: ReactionCounts
    comment_count: number
    share_count: number
    is_pinned: boolean
    created_at: string
    updated_at: string
}

export interface ReactionCounts {
    like: number
    love: number
    celebrate: number
    support: number
    total: number
}

export interface Comment {
    id: string
    post_id: string
    author_id: string
    author_name: string
    author_avatar?: string
    content: string
    parent_id?: string // for nested replies
    reaction_counts: ReactionCounts
    created_at: string
}

export interface Reaction {
    id: string
    user_id: string
    target_type: 'post' | 'comment'
    target_id: string
    type: 'like' | 'love' | 'celebrate' | 'support'
    created_at: string
}

export interface Group {
    id: string
    name: string
    description?: string
    category: 'mon_phai' | 'vung' | 'so_thich' | 'giai_dau' | 'other'
    cover_url?: string
    avatar_url?: string
    owner_id: string
    member_count: number
    is_public: boolean
    rules?: string[]
    created_at: string
}

export interface GroupMembership {
    id: string
    group_id: string
    user_id: string
    user_name: string
    role: 'owner' | 'admin' | 'moderator' | 'member'
    joined_at: string
    status: 'active' | 'pending' | 'banned'
}

export interface MarketplaceListing {
    id: string
    seller_id: string
    seller_name: string
    title: string
    description: string
    category: 'trang_phuc' | 'dung_cu' | 'tai_lieu' | 'khac'
    condition: 'moi' | 'nhu_moi' | 'da_su_dung' | 'can_sua'
    price: number
    currency: string // 'VND'
    images: string[]
    location?: string
    is_negotiable: boolean
    status: 'active' | 'sold' | 'reserved' | 'expired'
    created_at: string
    updated_at: string
}
