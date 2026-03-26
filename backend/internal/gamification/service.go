package gamification

import (
	"context"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — GAMIFICATION & ACHIEVEMENTS
// Badge system, seasonal leaderboards, fan following.
// ═══════════════════════════════════════════════════════════════

// ── Badge Definitions ───────────────────────────────────────

type BadgeCategory string

const (
	BadgeCompetition BadgeCategory = "competition"
	BadgeTraining    BadgeCategory = "training"
	BadgeCommunity   BadgeCategory = "community"
	BadgeMilestone   BadgeCategory = "milestone"
)

type BadgeTier string

const (
	TierBronze  BadgeTier = "bronze"
	TierSilver  BadgeTier = "silver"
	TierGold    BadgeTier = "gold"
	TierDiamond BadgeTier = "diamond"
)

// BadgeDefinition is a blueprint for an achievement.
type BadgeDefinition struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Icon        string        `json:"icon"`
	Category    BadgeCategory `json:"category"`
	Tier        BadgeTier     `json:"tier"`
	Condition   string        `json:"condition"` // human-readable unlock condition
	Points      int           `json:"points"`
}

// UserBadge is an earned badge.
type UserBadge struct {
	BadgeID  string          `json:"badge_id"`
	UserID   string          `json:"user_id"`
	EarnedAt time.Time       `json:"earned_at"`
	Badge    BadgeDefinition `json:"badge"`
}

// ── Seasonal Leaderboard ────────────────────────────────────

// Season groups rankings by time period.
type Season struct {
	ID        string `json:"id"`
	Name      string `json:"name"` // e.g. "Mùa giải 2026"
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	IsActive  bool   `json:"is_active"`
}

// SeasonRanking is a per-season ranking entry.
type SeasonRanking struct {
	UserID    string  `json:"user_id"`
	UserName  string  `json:"user_name"`
	Province  string  `json:"province"`
	Category  string  `json:"category"` // doi_khang, quyen_thuat
	SeasonID  string  `json:"season_id"`
	Points    int     `json:"points"`
	Wins      int     `json:"wins"`
	Losses    int     `json:"losses"`
	Rank      int     `json:"rank"`
	EloRating float64 `json:"elo_rating"`
}

// ── Fan Following ───────────────────────────────────────────

type Follow struct {
	ID         string    `json:"id"`
	FollowerID string    `json:"follower_id"`
	TargetID   string    `json:"target_id"`   // athlete or club ID
	TargetType string    `json:"target_type"` // athlete, club
	CreatedAt  time.Time `json:"created_at"`
}

// ── Store Interface ─────────────────────────────────────────

type Store interface {
	// Badges
	ListBadgeDefinitions(ctx context.Context) ([]BadgeDefinition, error)
	ListUserBadges(ctx context.Context, userID string) ([]UserBadge, error)
	AwardBadge(ctx context.Context, userID, badgeID string) error
	HasBadge(ctx context.Context, userID, badgeID string) (bool, error)

	// Seasons
	GetActiveSeason(ctx context.Context) (*Season, error)
	ListSeasonRankings(ctx context.Context, seasonID, category string, limit int) ([]SeasonRanking, error)

	// Follows
	Follow(ctx context.Context, f Follow) error
	Unfollow(ctx context.Context, followerID, targetID string) error
	ListFollowing(ctx context.Context, followerID string) ([]Follow, error)
	CountFollowers(ctx context.Context, targetID string) (int, error)
}

// ── Service ─────────────────────────────────────────────────

type Service struct {
	store Store
	idGen func() string
}

func NewService(store Store, idGen func() string) *Service {
	return &Service{store: store, idGen: idGen}
}

// ── Default Badge Definitions ───────────────────────────────

func DefaultBadges() []BadgeDefinition {
	return []BadgeDefinition{
		// Competition
		{ID: "badge-first-match", Name: "Trận đầu tiên", Description: "Tham gia trận đấu đầu tiên", Icon: "🥊", Category: BadgeCompetition, Tier: TierBronze, Condition: "matches >= 1", Points: 10},
		{ID: "badge-10-matches", Name: "Chiến binh", Description: "Tham gia 10 trận đấu", Icon: "⚔️", Category: BadgeCompetition, Tier: TierSilver, Condition: "matches >= 10", Points: 50},
		{ID: "badge-50-matches", Name: "Huyền thoại sàn đấu", Description: "Tham gia 50 trận đấu", Icon: "🏟️", Category: BadgeCompetition, Tier: TierGold, Condition: "matches >= 50", Points: 200},
		{ID: "badge-100-matches", Name: "Bất bại", Description: "Tham gia 100 trận đấu", Icon: "👑", Category: BadgeCompetition, Tier: TierDiamond, Condition: "matches >= 100", Points: 500},
		{ID: "badge-gold-medal", Name: "HCV Quốc gia", Description: "Đạt HCV giải quốc gia", Icon: "🥇", Category: BadgeCompetition, Tier: TierGold, Condition: "national_gold >= 1", Points: 300},
		{ID: "badge-province-champ", Name: "Vô địch tỉnh", Description: "Vô địch giải cấp tỉnh", Icon: "🏆", Category: BadgeCompetition, Tier: TierSilver, Condition: "provincial_gold >= 1", Points: 100},

		// Training
		{ID: "badge-first-belt", Name: "Lên đai đầu tiên", Description: "Hoàn thành kỳ thi lên đai", Icon: "🥋", Category: BadgeTraining, Tier: TierBronze, Condition: "belt_promotions >= 1", Points: 20},
		{ID: "badge-black-belt", Name: "Huyền đai", Description: "Đạt Huyền đai", Icon: "🎖️", Category: BadgeTraining, Tier: TierDiamond, Condition: "belt == huyen_dai", Points: 1000},
		{ID: "badge-100-sessions", Name: "Tập luyện bền bỉ", Description: "Tham gia 100 buổi tập", Icon: "💪", Category: BadgeTraining, Tier: TierSilver, Condition: "training_sessions >= 100", Points: 80},

		// Community
		{ID: "badge-first-follow", Name: "Người hâm mộ", Description: "Theo dõi VĐV đầu tiên", Icon: "👀", Category: BadgeCommunity, Tier: TierBronze, Condition: "following >= 1", Points: 5},
		{ID: "badge-10-followers", Name: "Ngôi sao", Description: "Có 10 người theo dõi", Icon: "⭐", Category: BadgeCommunity, Tier: TierSilver, Condition: "followers >= 10", Points: 30},
		{ID: "badge-100-followers", Name: "Siêu sao", Description: "Có 100 người theo dõi", Icon: "🌟", Category: BadgeCommunity, Tier: TierGold, Condition: "followers >= 100", Points: 150},

		// Milestones
		{ID: "badge-1-year", Name: "1 năm VCT", Description: "Thành viên VCT Platform 1 năm", Icon: "🎂", Category: BadgeMilestone, Tier: TierBronze, Condition: "membership >= 365 days", Points: 25},
		{ID: "badge-elo-1500", Name: "Thế lực", Description: "Đạt ELO 1500+", Icon: "📈", Category: BadgeMilestone, Tier: TierGold, Condition: "elo >= 1500", Points: 200},
	}
}
