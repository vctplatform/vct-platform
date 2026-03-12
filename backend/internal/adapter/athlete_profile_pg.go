package adapter

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PostgreSQL Athlete Profile Adapter
// Implements athlete.AthleteProfileRepository,
// athlete.ClubMembershipRepository, and
// athlete.TournamentEntryRepository using database/sql.
// ═══════════════════════════════════════════════════════════════

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"time"

	"vct-platform/backend/internal/domain/athlete"
)

// ══════════════════════════════════════════════════════════════
// AthleteProfile Repository
// ══════════════════════════════════════════════════════════════

// PgAthleteProfileRepo implements athlete.AthleteProfileRepository.
type PgAthleteProfileRepo struct{ db *sql.DB }

// NewPgAthleteProfileRepo creates a new PG-backed athlete profile repository.
func NewPgAthleteProfileRepo(db *sql.DB) *PgAthleteProfileRepo {
	return &PgAthleteProfileRepo{db: db}
}

const profileCols = `id, user_id, full_name, gender, date_of_birth, weight, height,
	belt_rank, belt_label, coach_name, phone, email, photo_url,
	address, id_number, province, nationality,
	ho_so, status, belt_history, goals, skill_stats,
	total_clubs, total_tournaments, total_medals, elo_rating,
	created_at, updated_at`

func scanProfile(row interface{ Scan(...any) error }) (*athlete.AthleteProfile, error) {
	p := &athlete.AthleteProfile{}
	var hosoJSON, beltHistJSON, goalsJSON, skillsJSON string
	err := row.Scan(
		&p.ID, &p.UserID, &p.FullName, &p.Gender, &p.DateOfBirth,
		&p.Weight, &p.Height, &p.BeltRank, &p.BeltLabel,
		&p.CoachName, &p.Phone, &p.Email, &p.PhotoURL,
		&p.Address, &p.IDNumber, &p.Province, &p.Nationality,
		&hosoJSON, &p.Status, &beltHistJSON, &goalsJSON, &skillsJSON,
		&p.TotalClubs, &p.TotalTournaments, &p.TotalMedals, &p.EloRating,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(hosoJSON), &p.HoSo)
	_ = json.Unmarshal([]byte(beltHistJSON), &p.BeltHistory)
	_ = json.Unmarshal([]byte(goalsJSON), &p.Goals)
	_ = json.Unmarshal([]byte(skillsJSON), &p.SkillStats)
	return p, nil
}

func (r *PgAthleteProfileRepo) List(ctx context.Context) ([]athlete.AthleteProfile, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+profileCols+` FROM athlete_profiles ORDER BY full_name`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.AthleteProfile
	for rows.Next() {
		p, err := scanProfile(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

func (r *PgAthleteProfileRepo) GetByID(ctx context.Context, id string) (*athlete.AthleteProfile, error) {
	p, err := scanProfile(r.db.QueryRowContext(ctx,
		`SELECT `+profileCols+` FROM athlete_profiles WHERE id=$1`, id))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("athlete profile not found: %s", id)
	}
	return p, err
}

func (r *PgAthleteProfileRepo) GetByUserID(ctx context.Context, userID string) (*athlete.AthleteProfile, error) {
	p, err := scanProfile(r.db.QueryRowContext(ctx,
		`SELECT `+profileCols+` FROM athlete_profiles WHERE user_id=$1`, userID))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("athlete profile not found for user: %s", userID)
	}
	return p, err
}

func (r *PgAthleteProfileRepo) ListByClub(ctx context.Context, clubID string) ([]athlete.AthleteProfile, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+profileCols+` FROM athlete_profiles p
		 WHERE EXISTS (SELECT 1 FROM athlete_memberships m WHERE m.athlete_id=p.id AND m.club_id=$1)
		 ORDER BY p.full_name`, clubID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.AthleteProfile
	for rows.Next() {
		p, err := scanProfile(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *p)
	}
	return out, rows.Err()
}

func marshalJSON(v interface{}) string {
	b, _ := json.Marshal(v)
	if b == nil {
		return "[]"
	}
	return string(b)
}

func (r *PgAthleteProfileRepo) Create(ctx context.Context, p athlete.AthleteProfile) (*athlete.AthleteProfile, error) {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO athlete_profiles
			(id, user_id, full_name, gender, date_of_birth, weight, height,
			 belt_rank, belt_label, coach_name, phone, email, photo_url,
			 address, id_number, province, nationality,
			 ho_so, status, belt_history, goals, skill_stats,
			 total_clubs, total_tournaments, total_medals, elo_rating,
			 created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)`,
		p.ID, p.UserID, p.FullName, p.Gender, p.DateOfBirth, p.Weight, p.Height,
		string(p.BeltRank), p.BeltLabel, p.CoachName, p.Phone, p.Email, p.PhotoURL,
		p.Address, p.IDNumber, p.Province, p.Nationality,
		marshalJSON(p.HoSo), string(p.Status), marshalJSON(p.BeltHistory),
		marshalJSON(p.Goals), marshalJSON(p.SkillStats),
		p.TotalClubs, p.TotalTournaments, p.TotalMedals, p.EloRating,
		p.CreatedAt, p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *PgAthleteProfileRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	// Read-modify-write pattern (same as in-memory store)
	p, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if v, ok := patch["full_name"].(string); ok {
		p.FullName = v
	}
	if v, ok := patch["weight"].(float64); ok {
		p.Weight = v
	}
	if v, ok := patch["height"].(float64); ok {
		p.Height = v
	}
	if v, ok := patch["belt_rank"].(string); ok {
		p.BeltRank = athlete.BeltRank(v)
		p.BeltLabel = athlete.BeltLabelMap[p.BeltRank]
	}
	if v, ok := patch["phone"].(string); ok {
		p.Phone = v
	}
	if v, ok := patch["email"].(string); ok {
		p.Email = v
	}
	if v, ok := patch["photo_url"].(string); ok {
		p.PhotoURL = v
	}
	if v, ok := patch["status"].(string); ok {
		p.Status = athlete.ProfileStatus(v)
	}
	if v, ok := patch["address"].(string); ok {
		p.Address = v
	}
	if v, ok := patch["id_number"].(string); ok {
		p.IDNumber = v
	}
	if v, ok := patch["province"].(string); ok {
		p.Province = v
	}
	if v, ok := patch["nationality"].(string); ok {
		p.Nationality = v
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		p.UpdatedAt = v
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE athlete_profiles SET
			full_name=$2, weight=$3, height=$4, belt_rank=$5, belt_label=$6,
			phone=$7, email=$8, photo_url=$9, status=$10,
			address=$11, id_number=$12, province=$13, nationality=$14, updated_at=$15
		 WHERE id=$1`,
		id, p.FullName, p.Weight, p.Height, string(p.BeltRank), p.BeltLabel,
		p.Phone, p.Email, p.PhotoURL, string(p.Status),
		p.Address, p.IDNumber, p.Province, p.Nationality, p.UpdatedAt)
	return err
}

func (r *PgAthleteProfileRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM athlete_profiles WHERE id=$1`, id)
	return err
}

// ══════════════════════════════════════════════════════════════
// ClubMembership Repository
// ══════════════════════════════════════════════════════════════

// PgClubMembershipRepo implements athlete.ClubMembershipRepository.
type PgClubMembershipRepo struct{ db *sql.DB }

// NewPgClubMembershipRepo creates a new PG-backed membership repository.
func NewPgClubMembershipRepo(db *sql.DB) *PgClubMembershipRepo {
	return &PgClubMembershipRepo{db: db}
}

const membershipCols = `id, athlete_id, club_id, club_name, role, join_date, status, coach_name, province_id, created_at, updated_at`

func scanMembership(row interface{ Scan(...any) error }) (*athlete.ClubMembership, error) {
	m := &athlete.ClubMembership{}
	err := row.Scan(&m.ID, &m.AthleteID, &m.ClubID, &m.ClubName, &m.Role,
		&m.JoinDate, &m.Status, &m.CoachName, &m.ProvinceID, &m.CreatedAt, &m.UpdatedAt)
	return m, err
}

func (r *PgClubMembershipRepo) List(ctx context.Context) ([]athlete.ClubMembership, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+membershipCols+` FROM athlete_memberships ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.ClubMembership
	for rows.Next() {
		m, err := scanMembership(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *m)
	}
	return out, rows.Err()
}

func (r *PgClubMembershipRepo) ListByAthlete(ctx context.Context, athleteID string) ([]athlete.ClubMembership, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+membershipCols+` FROM athlete_memberships WHERE athlete_id=$1 ORDER BY join_date DESC`, athleteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.ClubMembership
	for rows.Next() {
		m, err := scanMembership(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *m)
	}
	return out, rows.Err()
}

func (r *PgClubMembershipRepo) ListByClub(ctx context.Context, clubID string) ([]athlete.ClubMembership, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+membershipCols+` FROM athlete_memberships WHERE club_id=$1 ORDER BY created_at DESC`, clubID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.ClubMembership
	for rows.Next() {
		m, err := scanMembership(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *m)
	}
	return out, rows.Err()
}

func (r *PgClubMembershipRepo) GetByID(ctx context.Context, id string) (*athlete.ClubMembership, error) {
	m, err := scanMembership(r.db.QueryRowContext(ctx,
		`SELECT `+membershipCols+` FROM athlete_memberships WHERE id=$1`, id))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("club membership not found: %s", id)
	}
	return m, err
}

func (r *PgClubMembershipRepo) Create(ctx context.Context, m athlete.ClubMembership) (*athlete.ClubMembership, error) {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO athlete_memberships (id, athlete_id, club_id, club_name, role, join_date, status, coach_name, province_id, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		m.ID, m.AthleteID, m.ClubID, m.ClubName, string(m.Role),
		m.JoinDate, string(m.Status), m.CoachName, m.ProvinceID, m.CreatedAt, m.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &m, nil
}

func (r *PgClubMembershipRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	m, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if v, ok := patch["status"].(string); ok {
		m.Status = athlete.MembershipStatus(v)
	}
	if v, ok := patch["role"].(string); ok {
		m.Role = athlete.MembershipRole(v)
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		m.UpdatedAt = v
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE athlete_memberships SET status=$2, role=$3, updated_at=$4 WHERE id=$1`,
		id, string(m.Status), string(m.Role), m.UpdatedAt)
	return err
}

func (r *PgClubMembershipRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM athlete_memberships WHERE id=$1`, id)
	return err
}

// ══════════════════════════════════════════════════════════════
// TournamentEntry Repository
// ══════════════════════════════════════════════════════════════

// PgTournamentEntryRepo implements athlete.TournamentEntryRepository.
type PgTournamentEntryRepo struct{ db *sql.DB }

// NewPgTournamentEntryRepo creates a new PG-backed tournament entry repository.
func NewPgTournamentEntryRepo(db *sql.DB) *PgTournamentEntryRepo {
	return &PgTournamentEntryRepo{db: db}
}

const entryCols = `id, athlete_id, athlete_name, tournament_id, tournament_name,
	doan_id, doan_name, categories, ho_so, status,
	weigh_in_result, start_date, notes, created_at, updated_at`

func scanEntry(row interface{ Scan(...any) error }) (*athlete.TournamentEntry, error) {
	e := &athlete.TournamentEntry{}
	var catJSON, hosoJSON string
	err := row.Scan(
		&e.ID, &e.AthleteID, &e.AthleteName, &e.TournamentID, &e.TournamentName,
		&e.DoanID, &e.DoanName, &catJSON, &hosoJSON, &e.Status,
		&e.WeighInResult, &e.StartDate, &e.Notes, &e.CreatedAt, &e.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal([]byte(catJSON), &e.Categories)
	_ = json.Unmarshal([]byte(hosoJSON), &e.HoSo)
	return e, nil
}

func (r *PgTournamentEntryRepo) List(ctx context.Context) ([]athlete.TournamentEntry, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+entryCols+` FROM athlete_tournament_entries ORDER BY created_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.TournamentEntry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *PgTournamentEntryRepo) ListByAthlete(ctx context.Context, athleteID string) ([]athlete.TournamentEntry, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+entryCols+` FROM athlete_tournament_entries WHERE athlete_id=$1 ORDER BY start_date DESC`, athleteID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.TournamentEntry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *PgTournamentEntryRepo) ListByTournament(ctx context.Context, tournamentID string) ([]athlete.TournamentEntry, error) {
	rows, err := r.db.QueryContext(ctx,
		`SELECT `+entryCols+` FROM athlete_tournament_entries WHERE tournament_id=$1 ORDER BY athlete_name`, tournamentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []athlete.TournamentEntry
	for rows.Next() {
		e, err := scanEntry(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (r *PgTournamentEntryRepo) GetByID(ctx context.Context, id string) (*athlete.TournamentEntry, error) {
	e, err := scanEntry(r.db.QueryRowContext(ctx,
		`SELECT `+entryCols+` FROM athlete_tournament_entries WHERE id=$1`, id))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("tournament entry not found: %s", id)
	}
	return e, err
}

func (r *PgTournamentEntryRepo) Create(ctx context.Context, e athlete.TournamentEntry) (*athlete.TournamentEntry, error) {
	_, err := r.db.ExecContext(ctx,
		`INSERT INTO athlete_tournament_entries
			(id, athlete_id, athlete_name, tournament_id, tournament_name,
			 doan_id, doan_name, categories, ho_so, status,
			 weigh_in_result, start_date, notes, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
		e.ID, e.AthleteID, e.AthleteName, e.TournamentID, e.TournamentName,
		e.DoanID, e.DoanName, marshalJSON(e.Categories), marshalJSON(e.HoSo),
		string(e.Status), e.WeighInResult, e.StartDate, e.Notes, e.CreatedAt, e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *PgTournamentEntryRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	e, err := r.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if v, ok := patch["status"].(string); ok {
		e.Status = athlete.EntryStatus(v)
	}
	if v, ok := patch["weigh_in_result"].(string); ok {
		e.WeighInResult = v
	}
	if v, ok := patch["notes"].(string); ok {
		e.Notes = v
	}
	if v, ok := patch["updated_at"].(time.Time); ok {
		e.UpdatedAt = v
	}

	_, err = r.db.ExecContext(ctx,
		`UPDATE athlete_tournament_entries SET status=$2, weigh_in_result=$3, notes=$4, updated_at=$5 WHERE id=$1`,
		id, string(e.Status), e.WeighInResult, e.Notes, e.UpdatedAt)
	return err
}

func (r *PgTournamentEntryRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM athlete_tournament_entries WHERE id=$1`, id)
	return err
}
