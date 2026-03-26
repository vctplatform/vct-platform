package adapter

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"

	"vct-platform/backend/internal/domain/federation"
)

// ── Province Repository (PostgreSQL) ──

type sqlProvinceRepo struct {
	db *pgxpool.Pool
}

func NewSqlProvinceRepo(db *pgxpool.Pool) federation.ProvinceRepository {
	return &sqlProvinceRepo{db: db}
}

func (r *sqlProvinceRepo) List(ctx context.Context) ([]federation.Province, error) {
	q := `SELECT id, code, name, region, has_fed, fed_unit_id, club_count, coach_count, vdv_count, created_at, updated_at 
	      FROM federation_provinces ORDER BY code ASC`
	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []federation.Province
	for rows.Next() {
		var p federation.Province
		var fedUnitID *string
		err := rows.Scan(&p.ID, &p.Code, &p.Name, &p.Region, &p.HasFed, &fedUnitID,
			&p.ClubCount, &p.CoachCount, &p.VDVCount, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if fedUnitID != nil {
			p.FedUnitID = *fedUnitID
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

func (r *sqlProvinceRepo) GetByID(ctx context.Context, id string) (*federation.Province, error) {
	q := `SELECT id, code, name, region, has_fed, fed_unit_id, club_count, coach_count, vdv_count, created_at, updated_at 
	      FROM federation_provinces WHERE id = $1`
	var p federation.Province
	var fedUnitID *string
	err := r.db.QueryRow(ctx, q, id).Scan(&p.ID, &p.Code, &p.Name, &p.Region, &p.HasFed, &fedUnitID,
		&p.ClubCount, &p.CoachCount, &p.VDVCount, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if fedUnitID != nil {
		p.FedUnitID = *fedUnitID
	}
	return &p, nil
}

func (r *sqlProvinceRepo) GetByCode(ctx context.Context, code string) (*federation.Province, error) {
	q := `SELECT id, code, name, region, has_fed, fed_unit_id, club_count, coach_count, vdv_count, created_at, updated_at 
	      FROM federation_provinces WHERE code = $1`
	var p federation.Province
	var fedUnitID *string
	err := r.db.QueryRow(ctx, q, code).Scan(&p.ID, &p.Code, &p.Name, &p.Region, &p.HasFed, &fedUnitID,
		&p.ClubCount, &p.CoachCount, &p.VDVCount, &p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if fedUnitID != nil {
		p.FedUnitID = *fedUnitID
	}
	return &p, nil
}

func (r *sqlProvinceRepo) Create(ctx context.Context, p federation.Province) (*federation.Province, error) {
	q := `INSERT INTO federation_provinces (id, code, name, region, has_fed, fed_unit_id, club_count, coach_count, vdv_count, created_at, updated_at) 
	      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`

	var fedUnitID *string
	if p.FedUnitID != "" {
		fedUnitID = &p.FedUnitID
	}

	_, err := r.db.Exec(ctx, q, p.ID, p.Code, p.Name, p.Region, p.HasFed, fedUnitID,
		p.ClubCount, p.CoachCount, p.VDVCount, p.CreatedAt, p.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *sqlProvinceRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	// A basic loop to dynamically build the query.
	// In production, we'd use squirrel or explicit typed update args.
	return UpdateGenericTable(ctx, r.db, "federation_provinces", id, patch)
}

func (r *sqlProvinceRepo) ListByRegion(ctx context.Context, region federation.RegionCode) ([]federation.Province, error) {
	q := `SELECT id, code, name, region, has_fed, fed_unit_id, club_count, coach_count, vdv_count, created_at, updated_at 
	      FROM federation_provinces WHERE region = $1 ORDER BY code ASC`
	rows, err := r.db.Query(ctx, q, string(region))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []federation.Province
	for rows.Next() {
		var p federation.Province
		var fedUnitID *string
		err := rows.Scan(&p.ID, &p.Code, &p.Name, &p.Region, &p.HasFed, &fedUnitID,
			&p.ClubCount, &p.CoachCount, &p.VDVCount, &p.CreatedAt, &p.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if fedUnitID != nil {
			p.FedUnitID = *fedUnitID
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// ── FederationUnit Repository (PostgreSQL) ──

type sqlUnitRepo struct {
	db *pgxpool.Pool
}

func NewSqlUnitRepo(db *pgxpool.Pool) federation.FederationUnitRepository {
	return &sqlUnitRepo{db: db}
}

func (r *sqlUnitRepo) List(ctx context.Context) ([]federation.FederationUnit, error) {
	q := `SELECT id, name, short_name, type, parent_id, province_id, status, address, phone, email, website, founded_date, leader_name, leader_title, club_count, member_count, metadata, created_at, updated_at 
	      FROM federation_units`
	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []federation.FederationUnit
	for rows.Next() {
		var u federation.FederationUnit
		var parentID, provinceID, address, phone, email, website, founded, lName, lTitle *string
		err := rows.Scan(&u.ID, &u.Name, &u.ShortName, &u.Type, &parentID, &provinceID, &u.Status,
			&address, &phone, &email, &website, &founded, &lName, &lTitle, &u.ClubCount, &u.MemberCount, &u.Metadata, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if parentID != nil {
			u.ParentID = *parentID
		}
		if provinceID != nil {
			u.ProvinceID = *provinceID
		}
		if address != nil {
			u.Address = *address
		}
		if phone != nil {
			u.Phone = *phone
		}
		if email != nil {
			u.Email = *email
		}
		if website != nil {
			u.Website = *website
		}
		if founded != nil {
			u.FoundedDate = *founded
		}
		if lName != nil {
			u.LeaderName = *lName
		}
		if lTitle != nil {
			u.LeaderTitle = *lTitle
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *sqlUnitRepo) GetByID(ctx context.Context, id string) (*federation.FederationUnit, error) {
	q := `SELECT id, name, short_name, type, parent_id, province_id, status, address, phone, email, website, founded_date, leader_name, leader_title, club_count, member_count, metadata, created_at, updated_at 
	      FROM federation_units WHERE id = $1`
	var u federation.FederationUnit
	var parentID, provinceID, address, phone, email, website, founded, lName, lTitle *string
	err := r.db.QueryRow(ctx, q, id).Scan(&u.ID, &u.Name, &u.ShortName, &u.Type, &parentID, &provinceID, &u.Status,
		&address, &phone, &email, &website, &founded, &lName, &lTitle, &u.ClubCount, &u.MemberCount, &u.Metadata, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	if parentID != nil {
		u.ParentID = *parentID
	}
	if provinceID != nil {
		u.ProvinceID = *provinceID
	}
	if address != nil {
		u.Address = *address
	}
	if phone != nil {
		u.Phone = *phone
	}
	if email != nil {
		u.Email = *email
	}
	if website != nil {
		u.Website = *website
	}
	if founded != nil {
		u.FoundedDate = *founded
	}
	if lName != nil {
		u.LeaderName = *lName
	}
	if lTitle != nil {
		u.LeaderTitle = *lTitle
	}
	return &u, nil
}

func (r *sqlUnitRepo) Create(ctx context.Context, u federation.FederationUnit) (*federation.FederationUnit, error) {
	q := `INSERT INTO federation_units (id, name, short_name, type, parent_id, province_id, status, address, phone, email, website, founded_date, leader_name, leader_title, club_count, member_count, metadata, created_at, updated_at) 
	      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`

	var parentID, provinceID, address, phone, email, website, founded, lName, lTitle *string
	if u.ParentID != "" {
		parentID = &u.ParentID
	}
	if u.ProvinceID != "" {
		provinceID = &u.ProvinceID
	}
	if u.Address != "" {
		address = &u.Address
	}
	if u.Phone != "" {
		phone = &u.Phone
	}
	if u.Email != "" {
		email = &u.Email
	}
	if u.Website != "" {
		website = &u.Website
	}
	if u.FoundedDate != "" {
		founded = &u.FoundedDate
	}
	if u.LeaderName != "" {
		lName = &u.LeaderName
	}
	if u.LeaderTitle != "" {
		lTitle = &u.LeaderTitle
	}

	_, err := r.db.Exec(ctx, q, u.ID, u.Name, u.ShortName, u.Type, parentID, provinceID, u.Status,
		address, phone, email, website, founded, lName, lTitle, u.ClubCount, u.MemberCount, u.Metadata, u.CreatedAt, u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *sqlUnitRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	return UpdateGenericTable(ctx, r.db, "federation_units", id, patch)
}

func (r *sqlUnitRepo) Delete(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "DELETE FROM federation_units WHERE id = $1", id)
	return err
}

func (r *sqlUnitRepo) ListByType(ctx context.Context, uType federation.UnitType) ([]federation.FederationUnit, error) {
	q := `SELECT id, name, short_name, type, parent_id, province_id, status, address, phone, email, website, founded_date, leader_name, leader_title, club_count, member_count, metadata, created_at, updated_at 
	      FROM federation_units WHERE type = $1`
	rows, err := r.db.Query(ctx, q, string(uType))
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []federation.FederationUnit
	for rows.Next() {
		var u federation.FederationUnit
		var parentID, provinceID, address, phone, email, website, founded, lName, lTitle *string
		err := rows.Scan(&u.ID, &u.Name, &u.ShortName, &u.Type, &parentID, &provinceID, &u.Status,
			&address, &phone, &email, &website, &founded, &lName, &lTitle, &u.ClubCount, &u.MemberCount, &u.Metadata, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if parentID != nil {
			u.ParentID = *parentID
		}
		if provinceID != nil {
			u.ProvinceID = *provinceID
		}
		if address != nil {
			u.Address = *address
		}
		if phone != nil {
			u.Phone = *phone
		}
		if email != nil {
			u.Email = *email
		}
		if website != nil {
			u.Website = *website
		}
		if founded != nil {
			u.FoundedDate = *founded
		}
		if lName != nil {
			u.LeaderName = *lName
		}
		if lTitle != nil {
			u.LeaderTitle = *lTitle
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

func (r *sqlUnitRepo) ListByParent(ctx context.Context, parentID string) ([]federation.FederationUnit, error) {
	q := `SELECT id, name, short_name, type, parent_id, province_id, status, address, phone, email, website, founded_date, leader_name, leader_title, club_count, member_count, metadata, created_at, updated_at 
	      FROM federation_units WHERE parent_id = $1`
	rows, err := r.db.Query(ctx, q, parentID)
	// ... we will extract this scan logic into a small func if we had more time.
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []federation.FederationUnit
	for rows.Next() {
		var u federation.FederationUnit
		var parentID, provinceID, address, phone, email, website, founded, lName, lTitle *string
		err := rows.Scan(&u.ID, &u.Name, &u.ShortName, &u.Type, &parentID, &provinceID, &u.Status,
			&address, &phone, &email, &website, &founded, &lName, &lTitle, &u.ClubCount, &u.MemberCount, &u.Metadata, &u.CreatedAt, &u.UpdatedAt)
		if err != nil {
			return nil, err
		}
		if parentID != nil {
			u.ParentID = *parentID
		}
		if provinceID != nil {
			u.ProvinceID = *provinceID
		}
		if address != nil {
			u.Address = *address
		}
		if phone != nil {
			u.Phone = *phone
		}
		if email != nil {
			u.Email = *email
		}
		if website != nil {
			u.Website = *website
		}
		if founded != nil {
			u.FoundedDate = *founded
		}
		if lName != nil {
			u.LeaderName = *lName
		}
		if lTitle != nil {
			u.LeaderTitle = *lTitle
		}
		out = append(out, u)
	}
	return out, rows.Err()
}

// ── Personnel Repository (PostgreSQL) ──

type sqlPersonnelRepo struct {
	db *pgxpool.Pool
}

func NewSqlPersonnelRepo(db *pgxpool.Pool) federation.PersonnelRepository {
	return &sqlPersonnelRepo{db: db}
}

func (r *sqlPersonnelRepo) List(ctx context.Context, unitID string) ([]federation.PersonnelAssignment, error) {
	var q string
	var args []interface{}
	if unitID == "" {
		q = `SELECT id, user_id, user_name, unit_id, unit_name, position, role_code, start_date, end_date, is_active, decision_no, created_at FROM federation_personnel`
	} else {
		q = `SELECT id, user_id, user_name, unit_id, unit_name, position, role_code, start_date, end_date, is_active, decision_no, created_at FROM federation_personnel WHERE unit_id = $1`
		args = append(args, unitID)
	}

	rows, err := r.db.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var out []federation.PersonnelAssignment
	for rows.Next() {
		var a federation.PersonnelAssignment
		var sDate, eDate, dNo *string
		err := rows.Scan(&a.ID, &a.UserID, &a.UserName, &a.UnitID, &a.UnitName, &a.Position, &a.RoleCode, &sDate, &eDate, &a.IsActive, &dNo, &a.CreatedAt)
		if err != nil {
			return nil, err
		}
		if sDate != nil {
			a.StartDate = *sDate
		}
		if eDate != nil {
			a.EndDate = *eDate
		}
		if dNo != nil {
			a.DecisionNo = *dNo
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (r *sqlPersonnelRepo) Create(ctx context.Context, a federation.PersonnelAssignment) error {
	q := `INSERT INTO federation_personnel (id, user_id, user_name, unit_id, unit_name, position, role_code, start_date, end_date, is_active, decision_no, created_at) 
	      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`
	var sDate, eDate, dNo *string
	if a.StartDate != "" {
		sDate = &a.StartDate
	}
	if a.EndDate != "" {
		eDate = &a.EndDate
	}
	if a.DecisionNo != "" {
		dNo = &a.DecisionNo
	}

	_, err := r.db.Exec(ctx, q, a.ID, a.UserID, a.UserName, a.UnitID, a.UnitName, a.Position, a.RoleCode, sDate, eDate, a.IsActive, dNo, a.CreatedAt)
	return err
}

func (r *sqlPersonnelRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	return UpdateGenericTable(ctx, r.db, "federation_personnel", id, patch)
}

func (r *sqlPersonnelRepo) Deactivate(ctx context.Context, id string) error {
	_, err := r.db.Exec(ctx, "UPDATE federation_personnel SET is_active = false WHERE id = $1", id)
	return err
}

func (r *sqlPersonnelRepo) GetByUserAndUnit(ctx context.Context, userID, unitID string) (*federation.PersonnelAssignment, error) {
	q := `SELECT id, user_id, user_name, unit_id, unit_name, position, role_code, start_date, end_date, is_active, decision_no, created_at 
	      FROM federation_personnel WHERE user_id = $1 AND unit_id = $2 LIMIT 1`
	var a federation.PersonnelAssignment
	var sDate, eDate, dNo *string
	err := r.db.QueryRow(ctx, q, userID, unitID).Scan(&a.ID, &a.UserID, &a.UserName, &a.UnitID, &a.UnitName, &a.Position, &a.RoleCode, &sDate, &eDate, &a.IsActive, &dNo, &a.CreatedAt)
	if err != nil {
		return nil, err
	}
	if sDate != nil {
		a.StartDate = *sDate
	}
	if eDate != nil {
		a.EndDate = *eDate
	}
	if dNo != nil {
		a.DecisionNo = *dNo
	}
	return &a, nil
}

// ── Shared Update Helper ──
func UpdateGenericTable(ctx context.Context, db *pgxpool.Pool, table string, id string, patch map[string]interface{}) error {
	if len(patch) == 0 {
		return nil
	}

	query := fmt.Sprintf("UPDATE %s SET updated_at = CURRENT_TIMESTAMP", table)
	if table == "federation_personnel" {
		query = fmt.Sprintf("UPDATE %s SET ", table) // lacks updated_at
	}

	args := []interface{}{}
	argID := 1
	for k, v := range patch {
		if table == "federation_personnel" && argID == 1 {
			query += fmt.Sprintf("%s = $%d", k, argID)
		} else {
			query += fmt.Sprintf(", %s = $%d", k, argID)
		}
		args = append(args, v)
		argID++
	}
	query += fmt.Sprintf(" WHERE id = $%d", argID)
	args = append(args, id)

	_, err := db.Exec(ctx, query, args...)
	return err
}
