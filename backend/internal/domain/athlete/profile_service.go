package athlete

import (
	"context"
	"fmt"
	"strings"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE PROFILE DOMAIN
// Models, repositories, and service for the user-linked athlete
// profile system. VĐV is a ROLE of a User, not a standalone
// entity. This service manages the long-lived athlete profile
// (hồ sơ thể thao), club memberships, and tournament entries.
// ═══════════════════════════════════════════════════════════════

// ── Constants & Enums ────────────────────────────────────────

type ProfileStatus string

const (
	ProfileStatusDraft    ProfileStatus = "draft"
	ProfileStatusActive   ProfileStatus = "active"
	ProfileStatusInactive ProfileStatus = "inactive"
)

type MembershipStatus string

const (
	MembershipStatusPending  MembershipStatus = "pending"
	MembershipStatusActive   MembershipStatus = "active"
	MembershipStatusInactive MembershipStatus = "inactive"
)

type MembershipRole string

const (
	MembershipRoleMember  MembershipRole = "member"
	MembershipRoleCaptain MembershipRole = "captain"
)

type EntryStatus string

const (
	EntryStatusNhap       EntryStatus = "nhap"
	EntryStatusThieuHoSo  EntryStatus = "thieu_ho_so"
	EntryStatusChoXacNhan EntryStatus = "cho_xac_nhan"
	EntryStatusDuDieuKien EntryStatus = "du_dieu_kien"
	EntryStatusBiTuChoi   EntryStatus = "bi_tu_choi"
)

type BeltRank string

const (
	BeltNone   BeltRank = "none"
	BeltYellow BeltRank = "yellow"
	BeltGreen  BeltRank = "green"
	BeltBlue   BeltRank = "blue"
	BeltRed    BeltRank = "red"
	BeltBlack0 BeltRank = "so_dang"
	BeltBlack1 BeltRank = "nhat_dang"
	BeltBlack2 BeltRank = "nhi_dang"
	BeltBlack3 BeltRank = "tam_dang"
	BeltBlack4 BeltRank = "tu_dang"
	BeltBlack5 BeltRank = "ngu_dang"
)

var BeltLabelMap = map[BeltRank]string{
	BeltNone:   "Không đai",
	BeltYellow: "Đai vàng",
	BeltGreen:  "Đai xanh",
	BeltBlue:   "Đai lam",
	BeltRed:    "Đai đỏ",
	BeltBlack0: "Sơ đẳng",
	BeltBlack1: "Nhất đẳng",
	BeltBlack2: "Nhị đẳng",
	BeltBlack3: "Tam đẳng",
	BeltBlack4: "Tứ đẳng",
	BeltBlack5: "Ngũ đẳng",
}

// ── Domain Models ────────────────────────────────────────────

// HoSoChecklist tracks the document checklist for an athlete.
type HoSoChecklist struct {
	KhamSK  bool `json:"kham_sk"`
	BaoHiem bool `json:"bao_hiem"`
	Anh     bool `json:"anh"`
	CMND    bool `json:"cmnd"`
}

// BeltHistoryEntry records a belt promotion event.
type BeltHistoryEntry struct {
	Belt string `json:"belt"`
	Date string `json:"date"`
}

// AthleteGoal represents a personal training/competition goal.
type AthleteGoal struct {
	ID       int    `json:"id"`
	Title    string `json:"title"`
	Progress int    `json:"progress"`
	Type     string `json:"type"` // belt, tournament, training
}

// SkillStat represents a single skill measurement.
type SkillStat struct {
	Label string `json:"label"`
	Value int    `json:"value"`
	Color string `json:"color"`
}

// AthleteProfile is the long-lived sports profile linked to a User.
type AthleteProfile struct {
	ID          string        `json:"id"`
	UserID      string        `json:"user_id"`
	FullName    string        `json:"full_name"`
	Gender      string        `json:"gender"`
	DateOfBirth string        `json:"date_of_birth"`
	Weight      float64       `json:"weight"`
	Height      float64       `json:"height"`
	BeltRank    BeltRank      `json:"belt_rank"`
	BeltLabel   string        `json:"belt_label"`
	CoachName   string        `json:"coach_name,omitempty"`
	Phone       string        `json:"phone,omitempty"`
	Email       string        `json:"email,omitempty"`
	PhotoURL    string        `json:"photo_url,omitempty"`
	Address     string        `json:"address,omitempty"`
	IDNumber    string        `json:"id_number,omitempty"`
	Province    string        `json:"province,omitempty"`
	Nationality string        `json:"nationality,omitempty"`
	HoSo        HoSoChecklist `json:"ho_so"`
	Status      ProfileStatus `json:"status"`

	// Extended data
	BeltHistory []BeltHistoryEntry `json:"belt_history,omitempty"`
	Goals       []AthleteGoal      `json:"goals,omitempty"`
	SkillStats  []SkillStat        `json:"skill_stats,omitempty"`

	// Stats (denormalized for display)
	TotalClubs       int `json:"total_clubs"`
	TotalTournaments int `json:"total_tournaments"`
	TotalMedals      int `json:"total_medals"`
	EloRating        int `json:"elo_rating"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// ClubMembership tracks an athlete's membership in a club/võ đường.
type ClubMembership struct {
	ID         string           `json:"id"`
	AthleteID  string           `json:"athlete_id"`
	ClubID     string           `json:"club_id"`
	ClubName   string           `json:"club_name"`
	Role       MembershipRole   `json:"role"`
	JoinDate   string           `json:"join_date"`
	Status     MembershipStatus `json:"status"`
	CoachName  string           `json:"coach_name,omitempty"`
	ProvinceID string           `json:"province_id,omitempty"`
	CreatedAt  time.Time        `json:"created_at"`
	UpdatedAt  time.Time        `json:"updated_at"`
}

// TournamentEntry represents an athlete's registration for a specific tournament.
type TournamentEntry struct {
	ID             string        `json:"id"`
	AthleteID      string        `json:"athlete_id"`
	AthleteName    string        `json:"athlete_name"`
	TournamentID   string        `json:"tournament_id"`
	TournamentName string        `json:"tournament_name"`
	DoanID         string        `json:"doan_id"`
	DoanName       string        `json:"doan_name"`
	Categories     []string      `json:"categories"`
	HoSo           HoSoChecklist `json:"ho_so"`
	Status         EntryStatus   `json:"status"`
	WeighInResult  string        `json:"weigh_in_result,omitempty"`
	StartDate      string        `json:"start_date,omitempty"`
	Notes          string        `json:"notes,omitempty"`
	CreatedAt      time.Time     `json:"created_at"`
	UpdatedAt      time.Time     `json:"updated_at"`
}

// ── Repository Interfaces ────────────────────────────────────

type AthleteProfileRepository interface {
	List(ctx context.Context) ([]AthleteProfile, error)
	GetByID(ctx context.Context, id string) (*AthleteProfile, error)
	GetByUserID(ctx context.Context, userID string) (*AthleteProfile, error)
	ListByClub(ctx context.Context, clubID string) ([]AthleteProfile, error)
	Create(ctx context.Context, p AthleteProfile) (*AthleteProfile, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type ClubMembershipRepository interface {
	List(ctx context.Context) ([]ClubMembership, error)
	ListByAthlete(ctx context.Context, athleteID string) ([]ClubMembership, error)
	ListByClub(ctx context.Context, clubID string) ([]ClubMembership, error)
	GetByID(ctx context.Context, id string) (*ClubMembership, error)
	Create(ctx context.Context, m ClubMembership) (*ClubMembership, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

type TournamentEntryRepository interface {
	List(ctx context.Context) ([]TournamentEntry, error)
	ListByAthlete(ctx context.Context, athleteID string) ([]TournamentEntry, error)
	ListByTournament(ctx context.Context, tournamentID string) ([]TournamentEntry, error)
	GetByID(ctx context.Context, id string) (*TournamentEntry, error)
	Create(ctx context.Context, e TournamentEntry) (*TournamentEntry, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

// ── Profile Service ──────────────────────────────────────────

type ProfileService struct {
	profiles    AthleteProfileRepository
	memberships ClubMembershipRepository
	entries     TournamentEntryRepository
	newID       func() string
}

func NewProfileService(
	profiles AthleteProfileRepository,
	memberships ClubMembershipRepository,
	entries TournamentEntryRepository,
	newID func() string,
) *ProfileService {
	return &ProfileService{
		profiles:    profiles,
		memberships: memberships,
		entries:     entries,
		newID:       newID,
	}
}

// ── Profile Methods ──────────────────────────────────────────

func (s *ProfileService) CreateProfile(ctx context.Context, p AthleteProfile) (*AthleteProfile, error) {
	if p.FullName == "" {
		return nil, fmt.Errorf("full_name is required")
	}
	if p.UserID == "" {
		return nil, fmt.Errorf("user_id is required")
	}
	if p.ID == "" {
		p.ID = s.newID()
	}
	if p.Status == "" {
		p.Status = ProfileStatusDraft
	}
	p.BeltLabel = BeltLabelMap[p.BeltRank]
	now := time.Now().UTC()
	p.CreatedAt = now
	p.UpdatedAt = now
	return s.profiles.Create(ctx, p)
}

func (s *ProfileService) GetProfile(ctx context.Context, id string) (*AthleteProfile, error) {
	return s.profiles.GetByID(ctx, id)
}

func (s *ProfileService) GetByUserID(ctx context.Context, userID string) (*AthleteProfile, error) {
	return s.profiles.GetByUserID(ctx, userID)
}

func (s *ProfileService) ListProfiles(ctx context.Context) ([]AthleteProfile, error) {
	return s.profiles.List(ctx)
}

func (s *ProfileService) ListByClub(ctx context.Context, clubID string) ([]AthleteProfile, error) {
	return s.profiles.ListByClub(ctx, clubID)
}

func (s *ProfileService) UpdateProfile(ctx context.Context, id string, patch map[string]interface{}) error {
	patch["updated_at"] = time.Now().UTC()
	return s.profiles.Update(ctx, id, patch)
}

func (s *ProfileService) DeleteProfile(ctx context.Context, id string) error {
	return s.profiles.Delete(ctx, id)
}

// SearchProfiles filters profiles by a text query matching name, email, phone, or province.
func (s *ProfileService) SearchProfiles(ctx context.Context, query string) ([]AthleteProfile, error) {
	all, err := s.profiles.List(ctx)
	if err != nil {
		return nil, err
	}
	if query == "" {
		return all, nil
	}
	q := strings.ToLower(query)
	var result []AthleteProfile
	for _, p := range all {
		if strings.Contains(strings.ToLower(p.FullName), q) ||
			strings.Contains(strings.ToLower(p.Email), q) ||
			strings.Contains(strings.ToLower(p.Phone), q) ||
			strings.Contains(strings.ToLower(p.Province), q) ||
			strings.Contains(strings.ToLower(string(p.BeltRank)), q) {
			result = append(result, p)
		}
	}
	return result, nil
}

// StatsResult aggregates counts for the athlete dashboard.
type StatsResult struct {
	Total       int            `json:"total"`
	ByGender    map[string]int `json:"by_gender"`
	ByStatus    map[string]int `json:"by_status"`
	ByBeltRank  map[string]int `json:"by_belt_rank"`
	AvgElo      int            `json:"avg_elo"`
	TotalMedals int            `json:"total_medals"`
}

// GetStats computes aggregate statistics across all athlete profiles.
func (s *ProfileService) GetStats(ctx context.Context) (*StatsResult, error) {
	all, err := s.profiles.List(ctx)
	if err != nil {
		return nil, err
	}
	stats := &StatsResult{
		Total:      len(all),
		ByGender:   make(map[string]int),
		ByStatus:   make(map[string]int),
		ByBeltRank: make(map[string]int),
	}
	var totalElo int
	for _, p := range all {
		stats.ByGender[p.Gender]++
		stats.ByStatus[string(p.Status)]++
		stats.ByBeltRank[string(p.BeltRank)]++
		totalElo += p.EloRating
		stats.TotalMedals += p.TotalMedals
	}
	if len(all) > 0 {
		stats.AvgElo = totalElo / len(all)
	}
	return stats, nil
}

// ── Club Membership Methods ──────────────────────────────────

func (s *ProfileService) JoinClub(ctx context.Context, m ClubMembership) (*ClubMembership, error) {
	if m.AthleteID == "" {
		return nil, fmt.Errorf("athlete_id is required")
	}
	if m.ClubID == "" {
		return nil, fmt.Errorf("club_id is required")
	}
	if m.ID == "" {
		m.ID = s.newID()
	}
	if m.Role == "" {
		m.Role = MembershipRoleMember
	}
	if m.Status == "" {
		m.Status = MembershipStatusPending
	}
	now := time.Now().UTC()
	m.CreatedAt = now
	m.UpdatedAt = now
	return s.memberships.Create(ctx, m)
}

func (s *ProfileService) ListMyClubs(ctx context.Context, athleteID string) ([]ClubMembership, error) {
	return s.memberships.ListByAthlete(ctx, athleteID)
}

func (s *ProfileService) ListClubMembers(ctx context.Context, clubID string) ([]ClubMembership, error) {
	return s.memberships.ListByClub(ctx, clubID)
}

func (s *ProfileService) LeaveClub(ctx context.Context, id string) error {
	return s.memberships.Delete(ctx, id)
}

func (s *ProfileService) UpdateMembership(ctx context.Context, id string, patch map[string]interface{}) error {
	patch["updated_at"] = time.Now().UTC()
	return s.memberships.Update(ctx, id, patch)
}

// ── Tournament Entry Methods ─────────────────────────────────

func (s *ProfileService) EnterTournament(ctx context.Context, e TournamentEntry) (*TournamentEntry, error) {
	if e.AthleteID == "" {
		return nil, fmt.Errorf("athlete_id is required")
	}
	if e.TournamentID == "" {
		return nil, fmt.Errorf("tournament_id is required")
	}
	if e.ID == "" {
		e.ID = s.newID()
	}
	if e.Status == "" {
		e.Status = EntryStatusNhap
	}
	now := time.Now().UTC()
	e.CreatedAt = now
	e.UpdatedAt = now
	return s.entries.Create(ctx, e)
}

func (s *ProfileService) GetEntry(ctx context.Context, id string) (*TournamentEntry, error) {
	return s.entries.GetByID(ctx, id)
}

func (s *ProfileService) ListMyTournaments(ctx context.Context, athleteID string) ([]TournamentEntry, error) {
	return s.entries.ListByAthlete(ctx, athleteID)
}

func (s *ProfileService) ListByTournament(ctx context.Context, tournamentID string) ([]TournamentEntry, error) {
	return s.entries.ListByTournament(ctx, tournamentID)
}

func (s *ProfileService) UpdateEntryStatus(ctx context.Context, id string, status EntryStatus) error {
	return s.entries.Update(ctx, id, map[string]interface{}{
		"status":     string(status),
		"updated_at": time.Now().UTC(),
	})
}

func (s *ProfileService) ApproveEntry(ctx context.Context, id string) error {
	return s.UpdateEntryStatus(ctx, id, EntryStatusDuDieuKien)
}

func (s *ProfileService) RejectEntry(ctx context.Context, id string) error {
	return s.UpdateEntryStatus(ctx, id, EntryStatusBiTuChoi)
}

// ── Training Session ─────────────────────────────────────────

type SessionType string

const (
	SessionTypeRegular  SessionType = "regular"
	SessionTypeSparring SessionType = "sparring"
	SessionTypeExam     SessionType = "exam"
	SessionTypeSpecial  SessionType = "special"
)

type SessionStatus string

const (
	SessionStatusScheduled SessionStatus = "scheduled"
	SessionStatusCompleted SessionStatus = "completed"
	SessionStatusCancelled SessionStatus = "cancelled"
	SessionStatusAbsent    SessionStatus = "absent"
)

// TrainingSession represents a single training session for an athlete.
type TrainingSession struct {
	ID        string        `json:"id"`
	AthleteID string        `json:"athlete_id"`
	Date      string        `json:"date"`      // YYYY-MM-DD
	StartTime string        `json:"start_time"` // HH:MM
	EndTime   string        `json:"end_time"`   // HH:MM
	Type      SessionType   `json:"type"`
	Location  string        `json:"location"`
	Coach     string        `json:"coach"`
	ClubName  string        `json:"club_name,omitempty"`
	Status    SessionStatus `json:"status"`
	Notes     string        `json:"notes,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

// AttendanceStats aggregates training attendance metrics.
type AttendanceStats struct {
	TotalSessions    int     `json:"total_sessions"`
	Attended         int     `json:"attended"`
	Absent           int     `json:"absent"`
	Cancelled        int     `json:"cancelled"`
	AttendanceRate   float64 `json:"attendance_rate"` // 0-100
	CurrentStreak    int     `json:"current_streak"`
	ByType           map[string]int `json:"by_type"`
}

type TrainingSessionRepository interface {
	List(ctx context.Context) ([]TrainingSession, error)
	ListByAthlete(ctx context.Context, athleteID string) ([]TrainingSession, error)
	GetByID(ctx context.Context, id string) (*TrainingSession, error)
	Create(ctx context.Context, s TrainingSession) (*TrainingSession, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

// TrainingService manages training sessions.
type TrainingService struct {
	sessions TrainingSessionRepository
	newID    func() string
}

func NewTrainingService(sessions TrainingSessionRepository, newID func() string) *TrainingService {
	return &TrainingService{sessions: sessions, newID: newID}
}

func (s *TrainingService) CreateSession(ctx context.Context, sess TrainingSession) (*TrainingSession, error) {
	if sess.AthleteID == "" {
		return nil, fmt.Errorf("athlete_id is required")
	}
	if sess.Date == "" {
		return nil, fmt.Errorf("date is required")
	}
	if sess.ID == "" {
		sess.ID = s.newID()
	}
	if sess.Type == "" {
		sess.Type = SessionTypeRegular
	}
	if sess.Status == "" {
		sess.Status = SessionStatusScheduled
	}
	now := time.Now().UTC()
	sess.CreatedAt = now
	sess.UpdatedAt = now
	return s.sessions.Create(ctx, sess)
}

func (s *TrainingService) GetSession(ctx context.Context, id string) (*TrainingSession, error) {
	return s.sessions.GetByID(ctx, id)
}

func (s *TrainingService) ListByAthlete(ctx context.Context, athleteID string) ([]TrainingSession, error) {
	return s.sessions.ListByAthlete(ctx, athleteID)
}

func (s *TrainingService) UpdateSession(ctx context.Context, id string, patch map[string]interface{}) error {
	patch["updated_at"] = time.Now().UTC()
	return s.sessions.Update(ctx, id, patch)
}

func (s *TrainingService) DeleteSession(ctx context.Context, id string) error {
	return s.sessions.Delete(ctx, id)
}

// GetAttendanceStats computes attendance metrics for an athlete.
func (s *TrainingService) GetAttendanceStats(ctx context.Context, athleteID string) (*AttendanceStats, error) {
	sessions, err := s.sessions.ListByAthlete(ctx, athleteID)
	if err != nil {
		return nil, err
	}

	stats := &AttendanceStats{
		TotalSessions: len(sessions),
		ByType:        make(map[string]int),
	}

	// Sort by date desc for streak calculation
	for _, sess := range sessions {
		stats.ByType[string(sess.Type)]++
		switch sess.Status {
		case SessionStatusCompleted:
			stats.Attended++
		case SessionStatusAbsent:
			stats.Absent++
		case SessionStatusCancelled:
			stats.Cancelled++
		}
	}

	// Streak: count consecutive completed from most recent
	for i := len(sessions) - 1; i >= 0; i-- {
		if sessions[i].Status == SessionStatusCompleted {
			stats.CurrentStreak++
		} else if sessions[i].Status != SessionStatusCancelled {
			break
		}
	}

	if stats.TotalSessions > 0 {
		effective := stats.TotalSessions - stats.Cancelled
		if effective > 0 {
			stats.AttendanceRate = float64(stats.Attended) / float64(effective) * 100
		}
	}

	return stats, nil
}
