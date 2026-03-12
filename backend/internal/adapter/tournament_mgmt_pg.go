package adapter

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PostgreSQL Tournament Management Adapter
// Implements tournament.MgmtRepository using database/sql
// ═══════════════════════════════════════════════════════════════

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"vct-platform/backend/internal/domain/tournament"
)

// PgTournamentMgmtStore implements tournament.MgmtRepository using PostgreSQL.
type PgTournamentMgmtStore struct {
	db *sql.DB
}

// NewPgTournamentMgmtStore creates a new PostgreSQL-backed tournament management store.
func NewPgTournamentMgmtStore(db *sql.DB) *PgTournamentMgmtStore {
	return &PgTournamentMgmtStore{db: db}
}

// ── Categories ───────────────────────────────────────────────

func (s *PgTournamentMgmtStore) CreateCategory(ctx context.Context, c *tournament.Category) error {
	c.CreatedAt = time.Now()
	c.UpdatedAt = c.CreatedAt
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_categories
			(id, tournament_id, content_type, age_group, weight_class, gender, name, max_athletes, min_athletes, is_team_event, status, sort_order, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		c.ID, c.TournamentID, c.ContentType, c.AgeGroup, c.WeightClass, c.Gender,
		c.Name, c.MaxAthletes, c.MinAthletes, c.IsTeamEvent, c.Status, c.SortOrder,
		c.CreatedAt, c.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) GetCategory(ctx context.Context, id string) (*tournament.Category, error) {
	c := &tournament.Category{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, tournament_id, content_type, age_group, weight_class, gender, name, max_athletes, min_athletes, is_team_event, status, sort_order, created_at, updated_at
		 FROM tournament_categories WHERE id = $1`, id).Scan(
		&c.ID, &c.TournamentID, &c.ContentType, &c.AgeGroup, &c.WeightClass, &c.Gender,
		&c.Name, &c.MaxAthletes, &c.MinAthletes, &c.IsTeamEvent, &c.Status, &c.SortOrder,
		&c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("category not found: %s", id)
	}
	return c, err
}

func (s *PgTournamentMgmtStore) UpdateCategory(ctx context.Context, c *tournament.Category) error {
	c.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE tournament_categories SET
			content_type=$2, age_group=$3, weight_class=$4, gender=$5, name=$6,
			max_athletes=$7, min_athletes=$8, is_team_event=$9, status=$10, sort_order=$11, updated_at=$12
		 WHERE id=$1`,
		c.ID, c.ContentType, c.AgeGroup, c.WeightClass, c.Gender,
		c.Name, c.MaxAthletes, c.MinAthletes, c.IsTeamEvent, c.Status, c.SortOrder, c.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) DeleteCategory(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM tournament_categories WHERE id=$1`, id)
	return err
}

func (s *PgTournamentMgmtStore) ListCategories(ctx context.Context, tournamentID string) ([]*tournament.Category, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, tournament_id, content_type, age_group, weight_class, gender, name, max_athletes, min_athletes, is_team_event, status, sort_order, created_at, updated_at
		 FROM tournament_categories WHERE tournament_id=$1 ORDER BY sort_order, name`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.Category
	for rows.Next() {
		c := &tournament.Category{}
		if err := rows.Scan(&c.ID, &c.TournamentID, &c.ContentType, &c.AgeGroup, &c.WeightClass, &c.Gender,
			&c.Name, &c.MaxAthletes, &c.MinAthletes, &c.IsTeamEvent, &c.Status, &c.SortOrder,
			&c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// ── Registrations ────────────────────────────────────────────

func (s *PgTournamentMgmtStore) CreateRegistration(ctx context.Context, r *tournament.Registration) error {
	r.CreatedAt = time.Now()
	r.UpdatedAt = r.CreatedAt
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_registrations
			(id, tournament_id, team_id, team_name, province, team_type, status, head_coach, head_coach_id,
			 total_athletes, total_contents, submitted_at, approved_by, approved_at, rejected_by, reject_reason, notes, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)`,
		r.ID, r.TournamentID, r.TeamID, r.TeamName, r.Province, r.TeamType, r.Status, r.HeadCoach, r.HeadCoachID,
		r.TotalAthletes, r.TotalContents, r.SubmittedAt, r.ApprovedBy, r.ApprovedAt, r.RejectedBy, r.RejectReason, r.Notes, r.CreatedAt, r.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) GetRegistration(ctx context.Context, id string) (*tournament.Registration, error) {
	r := &tournament.Registration{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, tournament_id, team_id, team_name, province, team_type, status, head_coach, head_coach_id,
		        total_athletes, total_contents, submitted_at, approved_by, approved_at, rejected_by, reject_reason, notes, created_at, updated_at
		 FROM tournament_registrations WHERE id=$1`, id).Scan(
		&r.ID, &r.TournamentID, &r.TeamID, &r.TeamName, &r.Province, &r.TeamType, &r.Status, &r.HeadCoach, &r.HeadCoachID,
		&r.TotalAthletes, &r.TotalContents, &r.SubmittedAt, &r.ApprovedBy, &r.ApprovedAt, &r.RejectedBy, &r.RejectReason, &r.Notes, &r.CreatedAt, &r.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("registration not found: %s", id)
	}
	return r, err
}

func (s *PgTournamentMgmtStore) UpdateRegistration(ctx context.Context, r *tournament.Registration) error {
	r.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE tournament_registrations SET
			team_name=$2, province=$3, team_type=$4, status=$5, head_coach=$6, head_coach_id=$7,
			total_athletes=$8, total_contents=$9, submitted_at=$10, approved_by=$11, approved_at=$12,
			rejected_by=$13, reject_reason=$14, notes=$15, updated_at=$16
		 WHERE id=$1`,
		r.ID, r.TeamName, r.Province, r.TeamType, r.Status, r.HeadCoach, r.HeadCoachID,
		r.TotalAthletes, r.TotalContents, r.SubmittedAt, r.ApprovedBy, r.ApprovedAt,
		r.RejectedBy, r.RejectReason, r.Notes, r.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) ListRegistrations(ctx context.Context, tournamentID string) ([]*tournament.Registration, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, tournament_id, team_id, team_name, province, team_type, status, head_coach, head_coach_id,
		        total_athletes, total_contents, submitted_at, approved_by, approved_at, rejected_by, reject_reason, notes, created_at, updated_at
		 FROM tournament_registrations WHERE tournament_id=$1 ORDER BY created_at DESC`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.Registration
	for rows.Next() {
		r := &tournament.Registration{}
		if err := rows.Scan(&r.ID, &r.TournamentID, &r.TeamID, &r.TeamName, &r.Province, &r.TeamType, &r.Status, &r.HeadCoach, &r.HeadCoachID,
			&r.TotalAthletes, &r.TotalContents, &r.SubmittedAt, &r.ApprovedBy, &r.ApprovedAt, &r.RejectedBy, &r.RejectReason, &r.Notes, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// ── Registration Athletes ────────────────────────────────────

func (s *PgTournamentMgmtStore) AddRegistrationAthlete(ctx context.Context, a *tournament.RegistrationAthlete) error {
	a.CreatedAt = time.Now()
	catJSON, _ := json.Marshal(a.CategoryIDs)
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_registration_athletes
			(id, registration_id, athlete_id, athlete_name, date_of_birth, gender, weight, belt_rank, category_ids, status, notes, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
		a.ID, a.RegistrationID, a.AthleteID, a.AthleteName, a.DateOfBirth, a.Gender,
		a.Weight, a.BeltRank, string(catJSON), a.Status, a.Notes, a.CreatedAt)
	return err
}

func (s *PgTournamentMgmtStore) ListRegistrationAthletes(ctx context.Context, registrationID string) ([]*tournament.RegistrationAthlete, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, registration_id, athlete_id, athlete_name, date_of_birth, gender, weight, belt_rank, category_ids, status, notes, created_at
		 FROM tournament_registration_athletes WHERE registration_id=$1 ORDER BY athlete_name`, registrationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.RegistrationAthlete
	for rows.Next() {
		a := &tournament.RegistrationAthlete{}
		var catJSON string
		if err := rows.Scan(&a.ID, &a.RegistrationID, &a.AthleteID, &a.AthleteName, &a.DateOfBirth, &a.Gender,
			&a.Weight, &a.BeltRank, &catJSON, &a.Status, &a.Notes, &a.CreatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(catJSON), &a.CategoryIDs)
		out = append(out, a)
	}
	return out, rows.Err()
}

// ── Schedule ─────────────────────────────────────────────────

func (s *PgTournamentMgmtStore) CreateScheduleSlot(ctx context.Context, sl *tournament.ScheduleSlot) error {
	sl.CreatedAt = time.Now()
	sl.UpdatedAt = sl.CreatedAt
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_schedule_slots
			(id, tournament_id, arena_id, arena_name, date, session, start_time, end_time, category_id, category_name, content_type, match_count, status, notes, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
		sl.ID, sl.TournamentID, sl.ArenaID, sl.ArenaName, sl.Date, sl.Session, sl.StartTime, sl.EndTime,
		sl.CategoryID, sl.CategoryName, sl.ContentType, sl.MatchCount, sl.Status, sl.Notes, sl.CreatedAt, sl.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) GetScheduleSlot(ctx context.Context, id string) (*tournament.ScheduleSlot, error) {
	sl := &tournament.ScheduleSlot{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, tournament_id, arena_id, arena_name, date, session, start_time, end_time, category_id, category_name, content_type, match_count, status, notes, created_at, updated_at
		 FROM tournament_schedule_slots WHERE id=$1`, id).Scan(
		&sl.ID, &sl.TournamentID, &sl.ArenaID, &sl.ArenaName, &sl.Date, &sl.Session, &sl.StartTime, &sl.EndTime,
		&sl.CategoryID, &sl.CategoryName, &sl.ContentType, &sl.MatchCount, &sl.Status, &sl.Notes, &sl.CreatedAt, &sl.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("schedule slot not found: %s", id)
	}
	return sl, err
}

func (s *PgTournamentMgmtStore) UpdateScheduleSlot(ctx context.Context, sl *tournament.ScheduleSlot) error {
	sl.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE tournament_schedule_slots SET
			arena_id=$2, arena_name=$3, date=$4, session=$5, start_time=$6, end_time=$7,
			category_id=$8, category_name=$9, content_type=$10, match_count=$11, status=$12, notes=$13, updated_at=$14
		 WHERE id=$1`,
		sl.ID, sl.ArenaID, sl.ArenaName, sl.Date, sl.Session, sl.StartTime, sl.EndTime,
		sl.CategoryID, sl.CategoryName, sl.ContentType, sl.MatchCount, sl.Status, sl.Notes, sl.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) DeleteScheduleSlot(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM tournament_schedule_slots WHERE id=$1`, id)
	return err
}

func (s *PgTournamentMgmtStore) ListScheduleSlots(ctx context.Context, tournamentID string) ([]*tournament.ScheduleSlot, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, tournament_id, arena_id, arena_name, date, session, start_time, end_time, category_id, category_name, content_type, match_count, status, notes, created_at, updated_at
		 FROM tournament_schedule_slots WHERE tournament_id=$1 ORDER BY date, start_time`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.ScheduleSlot
	for rows.Next() {
		sl := &tournament.ScheduleSlot{}
		if err := rows.Scan(&sl.ID, &sl.TournamentID, &sl.ArenaID, &sl.ArenaName, &sl.Date, &sl.Session, &sl.StartTime, &sl.EndTime,
			&sl.CategoryID, &sl.CategoryName, &sl.ContentType, &sl.MatchCount, &sl.Status, &sl.Notes, &sl.CreatedAt, &sl.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, sl)
	}
	return out, rows.Err()
}

// ── Arena Assignments ────────────────────────────────────────

func (s *PgTournamentMgmtStore) CreateArenaAssignment(ctx context.Context, a *tournament.ArenaAssignment) error {
	a.CreatedAt = time.Now()
	ctJSON, _ := json.Marshal(a.ContentTypes)
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_arena_assignments
			(id, tournament_id, arena_id, arena_name, date, content_types, session, is_active, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
		a.ID, a.TournamentID, a.ArenaID, a.ArenaName, a.Date, string(ctJSON), a.Session, a.IsActive, a.CreatedAt)
	return err
}

func (s *PgTournamentMgmtStore) ListArenaAssignments(ctx context.Context, tournamentID string) ([]*tournament.ArenaAssignment, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, tournament_id, arena_id, arena_name, date, content_types, session, is_active, created_at
		 FROM tournament_arena_assignments WHERE tournament_id=$1 ORDER BY date, arena_name`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.ArenaAssignment
	for rows.Next() {
		a := &tournament.ArenaAssignment{}
		var ctJSON string
		if err := rows.Scan(&a.ID, &a.TournamentID, &a.ArenaID, &a.ArenaName, &a.Date, &ctJSON, &a.Session, &a.IsActive, &a.CreatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(ctJSON), &a.ContentTypes)
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *PgTournamentMgmtStore) DeleteArenaAssignment(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM tournament_arena_assignments WHERE id=$1`, id)
	return err
}

// ── Results ──────────────────────────────────────────────────

func (s *PgTournamentMgmtStore) RecordResult(ctx context.Context, r *tournament.TournamentResult) error {
	r.CreatedAt = time.Now()
	r.UpdatedAt = r.CreatedAt
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_results
			(id, tournament_id, category_id, category_name, content_type,
			 gold_id, gold_name, gold_team, silver_id, silver_name, silver_team,
			 bronze1_id, bronze1_name, bronze1_team, bronze2_id, bronze2_name, bronze2_team,
			 is_finalized, finalized_by, finalized_at, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
		r.ID, r.TournamentID, r.CategoryID, r.CategoryName, r.ContentType,
		r.GoldID, r.GoldName, r.GoldTeam, r.SilverID, r.SilverName, r.SilverTeam,
		r.Bronze1ID, r.Bronze1Name, r.Bronze1Team, r.Bronze2ID, r.Bronze2Name, r.Bronze2Team,
		r.IsFinalized, r.FinalizedBy, r.FinalizedAt, r.CreatedAt, r.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) GetResult(ctx context.Context, id string) (*tournament.TournamentResult, error) {
	r := &tournament.TournamentResult{}
	err := s.db.QueryRowContext(ctx,
		`SELECT id, tournament_id, category_id, category_name, content_type,
		        gold_id, gold_name, gold_team, silver_id, silver_name, silver_team,
		        bronze1_id, bronze1_name, bronze1_team, bronze2_id, bronze2_name, bronze2_team,
		        is_finalized, finalized_by, finalized_at, created_at, updated_at
		 FROM tournament_results WHERE id=$1`, id).Scan(
		&r.ID, &r.TournamentID, &r.CategoryID, &r.CategoryName, &r.ContentType,
		&r.GoldID, &r.GoldName, &r.GoldTeam, &r.SilverID, &r.SilverName, &r.SilverTeam,
		&r.Bronze1ID, &r.Bronze1Name, &r.Bronze1Team, &r.Bronze2ID, &r.Bronze2Name, &r.Bronze2Team,
		&r.IsFinalized, &r.FinalizedBy, &r.FinalizedAt, &r.CreatedAt, &r.UpdatedAt)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("result not found: %s", id)
	}
	return r, err
}

func (s *PgTournamentMgmtStore) UpdateResult(ctx context.Context, r *tournament.TournamentResult) error {
	r.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`UPDATE tournament_results SET
			category_name=$2, content_type=$3,
			gold_id=$4, gold_name=$5, gold_team=$6, silver_id=$7, silver_name=$8, silver_team=$9,
			bronze1_id=$10, bronze1_name=$11, bronze1_team=$12, bronze2_id=$13, bronze2_name=$14, bronze2_team=$15,
			is_finalized=$16, finalized_by=$17, finalized_at=$18, updated_at=$19
		 WHERE id=$1`,
		r.ID, r.CategoryName, r.ContentType,
		r.GoldID, r.GoldName, r.GoldTeam, r.SilverID, r.SilverName, r.SilverTeam,
		r.Bronze1ID, r.Bronze1Name, r.Bronze1Team, r.Bronze2ID, r.Bronze2Name, r.Bronze2Team,
		r.IsFinalized, r.FinalizedBy, r.FinalizedAt, r.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) ListResults(ctx context.Context, tournamentID string) ([]*tournament.TournamentResult, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, tournament_id, category_id, category_name, content_type,
		        gold_id, gold_name, gold_team, silver_id, silver_name, silver_team,
		        bronze1_id, bronze1_name, bronze1_team, bronze2_id, bronze2_name, bronze2_team,
		        is_finalized, finalized_by, finalized_at, created_at, updated_at
		 FROM tournament_results WHERE tournament_id=$1 ORDER BY category_name`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.TournamentResult
	for rows.Next() {
		r := &tournament.TournamentResult{}
		if err := rows.Scan(&r.ID, &r.TournamentID, &r.CategoryID, &r.CategoryName, &r.ContentType,
			&r.GoldID, &r.GoldName, &r.GoldTeam, &r.SilverID, &r.SilverName, &r.SilverTeam,
			&r.Bronze1ID, &r.Bronze1Name, &r.Bronze1Team, &r.Bronze2ID, &r.Bronze2Name, &r.Bronze2Team,
			&r.IsFinalized, &r.FinalizedBy, &r.FinalizedAt, &r.CreatedAt, &r.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// ── Team Standings ───────────────────────────────────────────

func (s *PgTournamentMgmtStore) UpsertTeamStanding(ctx context.Context, st *tournament.TeamStanding) error {
	st.UpdatedAt = time.Now()
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO tournament_team_standings
			(id, tournament_id, team_id, team_name, province, gold, silver, bronze, total_medals, points, rank, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
		 ON CONFLICT (tournament_id, team_id) DO UPDATE SET
			team_name=EXCLUDED.team_name, province=EXCLUDED.province,
			gold=EXCLUDED.gold, silver=EXCLUDED.silver, bronze=EXCLUDED.bronze,
			total_medals=EXCLUDED.total_medals, points=EXCLUDED.points, rank=EXCLUDED.rank, updated_at=EXCLUDED.updated_at`,
		st.ID, st.TournamentID, st.TeamID, st.TeamName, st.Province,
		st.Gold, st.Silver, st.Bronze, st.TotalMedals, st.Points, st.Rank, st.UpdatedAt)
	return err
}

func (s *PgTournamentMgmtStore) ListTeamStandings(ctx context.Context, tournamentID string) ([]*tournament.TeamStanding, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, tournament_id, team_id, team_name, province, gold, silver, bronze, total_medals, points, rank, updated_at
		 FROM tournament_team_standings WHERE tournament_id=$1 ORDER BY rank, gold DESC, silver DESC, bronze DESC`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []*tournament.TeamStanding
	for rows.Next() {
		st := &tournament.TeamStanding{}
		if err := rows.Scan(&st.ID, &st.TournamentID, &st.TeamID, &st.TeamName, &st.Province,
			&st.Gold, &st.Silver, &st.Bronze, &st.TotalMedals, &st.Points, &st.Rank, &st.UpdatedAt); err != nil {
			return nil, err
		}
		out = append(out, st)
	}
	return out, rows.Err()
}
