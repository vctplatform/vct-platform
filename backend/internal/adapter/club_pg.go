package adapter

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — PostgreSQL Club Module Adapter
// Implements club.AttendanceStore, club.EquipmentStore, and
// club.FacilityStore using database/sql.
// Tables: club_attendance, club_equipment, club_facilities
// (created by migration 0042_club_voduong.sql)
// ═══════════════════════════════════════════════════════════════

import (
	"context"
	"database/sql"
	"fmt"

	"vct-platform/backend/internal/domain/club"
)

// ── Attendance ───────────────────────────────────────────────

// PgAttendanceStore implements club.AttendanceStore using PostgreSQL.
type PgAttendanceStore struct{ db *sql.DB }

// NewPgAttendanceStore creates a new PG-backed attendance store.
func NewPgAttendanceStore(db *sql.DB) *PgAttendanceStore {
	return &PgAttendanceStore{db: db}
}

const attendanceCols = `id, club_id, class_id, class_name, member_id, member_name, date, status, notes, recorded_by, created_at`

func scanAttendance(row interface{ Scan(...any) error }) (*club.Attendance, error) {
	a := &club.Attendance{}
	err := row.Scan(&a.ID, &a.ClubID, &a.ClassID, &a.ClassName, &a.MemberID,
		&a.MemberName, &a.Date, &a.Status, &a.Notes, &a.RecordedBy, &a.CreatedAt)
	return a, err
}

func (s *PgAttendanceStore) List(ctx context.Context, clubID string) ([]club.Attendance, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+attendanceCols+` FROM club_attendance WHERE club_id=$1 ORDER BY date DESC, created_at DESC`, clubID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []club.Attendance
	for rows.Next() {
		a, err := scanAttendance(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *a)
	}
	return out, rows.Err()
}

func (s *PgAttendanceStore) ListByClass(ctx context.Context, clubID, classID string) ([]club.Attendance, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+attendanceCols+` FROM club_attendance WHERE club_id=$1 AND class_id=$2 ORDER BY date DESC`, clubID, classID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []club.Attendance
	for rows.Next() {
		a, err := scanAttendance(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *a)
	}
	return out, rows.Err()
}

func (s *PgAttendanceStore) ListByDate(ctx context.Context, clubID, date string) ([]club.Attendance, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+attendanceCols+` FROM club_attendance WHERE club_id=$1 AND date=$2 ORDER BY created_at`, clubID, date)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []club.Attendance
	for rows.Next() {
		a, err := scanAttendance(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *a)
	}
	return out, rows.Err()
}

func (s *PgAttendanceStore) GetByID(ctx context.Context, id string) (*club.Attendance, error) {
	a, err := scanAttendance(s.db.QueryRowContext(ctx,
		`SELECT `+attendanceCols+` FROM club_attendance WHERE id=$1`, id))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("attendance record not found: %s", id)
	}
	return a, err
}

func (s *PgAttendanceStore) Create(ctx context.Context, a club.Attendance) (*club.Attendance, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO club_attendance (id, club_id, class_id, class_name, member_id, member_name, date, status, notes, recorded_by, created_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
		a.ID, a.ClubID, a.ClassID, a.ClassName, a.MemberID, a.MemberName,
		a.Date, string(a.Status), a.Notes, a.RecordedBy, a.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &a, nil
}

func (s *PgAttendanceStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM club_attendance WHERE id=$1`, id)
	return err
}

// ── Equipment ────────────────────────────────────────────────

// PgEquipmentStore implements club.EquipmentStore using PostgreSQL.
type PgEquipmentStore struct{ db *sql.DB }

// NewPgEquipmentStore creates a new PG-backed equipment store.
func NewPgEquipmentStore(db *sql.DB) *PgEquipmentStore {
	return &PgEquipmentStore{db: db}
}

const equipmentCols = `id, club_id, name, category, quantity, condition, purchase_date, unit_value, total_value, supplier, notes, created_at, updated_at`

func scanEquipment(row interface{ Scan(...any) error }) (*club.Equipment, error) {
	e := &club.Equipment{}
	err := row.Scan(&e.ID, &e.ClubID, &e.Name, &e.Category, &e.Quantity,
		&e.Condition, &e.PurchaseDate, &e.UnitValue, &e.TotalValue,
		&e.Supplier, &e.Notes, &e.CreatedAt, &e.UpdatedAt)
	return e, err
}

func (s *PgEquipmentStore) List(ctx context.Context, clubID string) ([]club.Equipment, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+equipmentCols+` FROM club_equipment WHERE club_id=$1 ORDER BY name`, clubID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []club.Equipment
	for rows.Next() {
		e, err := scanEquipment(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *e)
	}
	return out, rows.Err()
}

func (s *PgEquipmentStore) GetByID(ctx context.Context, id string) (*club.Equipment, error) {
	e, err := scanEquipment(s.db.QueryRowContext(ctx,
		`SELECT `+equipmentCols+` FROM club_equipment WHERE id=$1`, id))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("equipment not found: %s", id)
	}
	return e, err
}

func (s *PgEquipmentStore) Create(ctx context.Context, e club.Equipment) (*club.Equipment, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO club_equipment (id, club_id, name, category, quantity, condition, purchase_date, unit_value, total_value, supplier, notes, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
		e.ID, e.ClubID, e.Name, string(e.Category), e.Quantity, string(e.Condition),
		e.PurchaseDate, e.UnitValue, e.TotalValue, e.Supplier, e.Notes, e.CreatedAt, e.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &e, nil
}

func (s *PgEquipmentStore) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	// Build dynamic SET clause from patch keys
	e, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if v, ok := patch["name"].(string); ok {
		e.Name = v
	}
	if v, ok := patch["category"].(string); ok {
		e.Category = club.EquipmentCategory(v)
	}
	if v, ok := patch["quantity"].(float64); ok {
		e.Quantity = int(v)
	}
	if v, ok := patch["condition"].(string); ok {
		e.Condition = club.EquipmentCondition(v)
	}
	if v, ok := patch["unit_value"].(float64); ok {
		e.UnitValue = v
	}
	if v, ok := patch["notes"].(string); ok {
		e.Notes = v
	}
	e.TotalValue = float64(e.Quantity) * e.UnitValue

	_, err = s.db.ExecContext(ctx,
		`UPDATE club_equipment SET name=$2, category=$3, quantity=$4, condition=$5,
		 unit_value=$6, total_value=$7, notes=$8, updated_at=NOW() WHERE id=$1`,
		id, e.Name, string(e.Category), e.Quantity, string(e.Condition),
		e.UnitValue, e.TotalValue, e.Notes)
	return err
}

func (s *PgEquipmentStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM club_equipment WHERE id=$1`, id)
	return err
}

// ── Facilities ───────────────────────────────────────────────

// PgFacilityStore implements club.FacilityStore using PostgreSQL.
type PgFacilityStore struct{ db *sql.DB }

// NewPgFacilityStore creates a new PG-backed facility store.
func NewPgFacilityStore(db *sql.DB) *PgFacilityStore {
	return &PgFacilityStore{db: db}
}

const facilityCols = `id, club_id, name, type, area_sqm, capacity, status, address, last_maintenance_date, next_maintenance_date, monthly_rent, notes, created_at, updated_at`

func scanFacility(row interface{ Scan(...any) error }) (*club.Facility, error) {
	f := &club.Facility{}
	err := row.Scan(&f.ID, &f.ClubID, &f.Name, &f.Type, &f.AreaSqm, &f.Capacity,
		&f.Status, &f.Address, &f.LastMaintenanceDate, &f.NextMaintenanceDate,
		&f.MonthlyRent, &f.Notes, &f.CreatedAt, &f.UpdatedAt)
	return f, err
}

func (s *PgFacilityStore) List(ctx context.Context, clubID string) ([]club.Facility, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT `+facilityCols+` FROM club_facilities WHERE club_id=$1 ORDER BY name`, clubID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var out []club.Facility
	for rows.Next() {
		f, err := scanFacility(rows)
		if err != nil {
			return nil, err
		}
		out = append(out, *f)
	}
	return out, rows.Err()
}

func (s *PgFacilityStore) GetByID(ctx context.Context, id string) (*club.Facility, error) {
	f, err := scanFacility(s.db.QueryRowContext(ctx,
		`SELECT `+facilityCols+` FROM club_facilities WHERE id=$1`, id))
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("facility not found: %s", id)
	}
	return f, err
}

func (s *PgFacilityStore) Create(ctx context.Context, f club.Facility) (*club.Facility, error) {
	_, err := s.db.ExecContext(ctx,
		`INSERT INTO club_facilities (id, club_id, name, type, area_sqm, capacity, status, address, last_maintenance_date, next_maintenance_date, monthly_rent, notes, created_at, updated_at)
		 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
		f.ID, f.ClubID, f.Name, string(f.Type), f.AreaSqm, f.Capacity,
		string(f.Status), f.Address, f.LastMaintenanceDate, f.NextMaintenanceDate,
		f.MonthlyRent, f.Notes, f.CreatedAt, f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func (s *PgFacilityStore) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	f, err := s.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if v, ok := patch["name"].(string); ok {
		f.Name = v
	}
	if v, ok := patch["type"].(string); ok {
		f.Type = club.FacilityType(v)
	}
	if v, ok := patch["area_sqm"].(float64); ok {
		f.AreaSqm = v
	}
	if v, ok := patch["capacity"].(float64); ok {
		f.Capacity = int(v)
	}
	if v, ok := patch["status"].(string); ok {
		f.Status = club.FacilityStatus(v)
	}
	if v, ok := patch["monthly_rent"].(float64); ok {
		f.MonthlyRent = v
	}
	if v, ok := patch["notes"].(string); ok {
		f.Notes = v
	}

	_, err = s.db.ExecContext(ctx,
		`UPDATE club_facilities SET name=$2, type=$3, area_sqm=$4, capacity=$5,
		 status=$6, monthly_rent=$7, notes=$8, updated_at=NOW() WHERE id=$1`,
		id, f.Name, string(f.Type), f.AreaSqm, f.Capacity,
		string(f.Status), f.MonthlyRent, f.Notes)
	return err
}

func (s *PgFacilityStore) Delete(ctx context.Context, id string) error {
	_, err := s.db.ExecContext(ctx, `DELETE FROM club_facilities WHERE id=$1`, id)
	return err
}
