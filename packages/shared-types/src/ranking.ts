// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — RANKING DOMAIN TYPES
// ════════════════════════════════════════════════════════════════

export interface Ranking {
    id: string;
    athlete_id: string;
    athlete_name: string;
    club_name: string;
    category: string;
    weight_class?: string;
    elo_rating: number;
    points: number;
    national_rank: number;
    wins: number;
    losses: number;
    draws: number;
    last_updated: string;
}

export interface EloRating {
    athlete_id: string;
    rating: number;
    rd: number; // Rating Deviation (Glicko)
    volatility: number;
    last_match_date: string;
}

export interface HeadToHead {
    athlete1_id: string;
    athlete2_id: string;
    total_matches: number;
    athlete1_wins: number;
    athlete2_wins: number;
    draws: number;
    matches: Array<{
        match_id: string;
        tournament_name: string;
        date: string;
        winner_id: string;
        score: string;
    }>;
}
