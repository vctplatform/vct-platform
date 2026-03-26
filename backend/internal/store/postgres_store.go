package store

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"vct-platform/backend/internal/apierror"
)

type PostgresStore struct {
	pool *pgxpool.Pool
}

func (s *PostgresStore) Pool() *pgxpool.Pool {
	return s.pool
}

func NewPostgresStore(connectionString string, autoMigrate bool) (*PostgresStore, error) {
	cfg, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		return nil, fmt.Errorf("postgres parse config failed: %w", err)
	}
	if cfg.MaxConns <= 0 {
		cfg.MaxConns = 12
	}
	if cfg.MaxConnLifetime <= 0 {
		cfg.MaxConnLifetime = 30 * time.Minute
	}
	if cfg.HealthCheckPeriod <= 0 {
		cfg.HealthCheckPeriod = 30 * time.Second
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	pool, err := pgxpool.NewWithConfig(ctx, cfg)
	if err != nil {
		return nil, fmt.Errorf("postgres connect failed: %w", err)
	}

	store := &PostgresStore{pool: pool}
	if autoMigrate {
		if migrateErr := store.ensureSchema(); migrateErr != nil {
			pool.Close()
			return nil, migrateErr
		}
	}
	return store, nil
}

func (s *PostgresStore) ensureSchema() error {
	// Phase 1: Legacy EAV table (keeps existing API working)
	const eav = `
CREATE TABLE IF NOT EXISTS entity_records (
	entity TEXT NOT NULL,
	id TEXT NOT NULL,
	payload JSONB NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	PRIMARY KEY(entity, id)
);
CREATE INDEX IF NOT EXISTS idx_entity_records_entity_updated_at
	ON entity_records(entity, updated_at DESC);
`
	if _, err := s.pool.Exec(context.Background(), eav); err != nil {
		return fmt.Errorf("postgres eav migration failed: %w", err)
	}

	// Phase 2: Relational schema (typed tables for future per-entity repos)
	const relational = `
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  full_name VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  level VARCHAR(20) NOT NULL,
  round_number INT DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  registration_deadline DATE,
  location TEXT,
  venue TEXT,
  organizer TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'nhap',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS age_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(100) NOT NULL,
  tuoi_min INT NOT NULL,
  tuoi_max INT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  loai VARCHAR(20) NOT NULL,
  gioi_tinh VARCHAR(10),
  lua_tuoi_id UUID,
  so_nguoi INT DEFAULT 1,
  mo_ta TEXT,
  trang_thai VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weight_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(100) NOT NULL,
  gioi_tinh VARCHAR(5) NOT NULL,
  lua_tuoi_id UUID,
  can_nang_min DECIMAL(5,1) NOT NULL,
  can_nang_max DECIMAL(5,1) NOT NULL,
  trang_thai VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  ma_doan VARCHAR(20) NOT NULL,
  loai VARCHAR(20),
  tinh_thanh VARCHAR(100),
  lien_he VARCHAR(100),
  sdt VARCHAR(20),
  email VARCHAR(255),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'nhap',
  docs JSONB DEFAULT '{}',
  fees JSONB DEFAULT '{"total":0,"paid":0,"remaining":0}',
  achievements JSONB DEFAULT '[]',
  delegate_user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS athletes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  ho_ten VARCHAR(200) NOT NULL,
  gioi_tinh VARCHAR(5) NOT NULL,
  ngay_sinh DATE NOT NULL,
  can_nang DECIMAL(5,1) NOT NULL,
  chieu_cao DECIMAL(5,1),
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'nhap',
  docs JSONB DEFAULT '{}',
  ghi_chu TEXT,
  avatar_url TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  athlete_id UUID REFERENCES athletes(id) ON DELETE CASCADE,
  content_category_id UUID,
  weight_class_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_duyet',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ho_ten VARCHAR(200) NOT NULL,
  cap_bac VARCHAR(20) NOT NULL,
  chuyen_mon VARCHAR(20) NOT NULL,
  tinh_thanh VARCHAR(100),
  dien_thoai VARCHAR(20),
  email VARCHAR(255),
  nam_kinh_nghiem INT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_duyet',
  ghi_chu TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arenas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  ten VARCHAR(200) NOT NULL,
  loai VARCHAR(20) NOT NULL,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'dong',
  suc_chua INT DEFAULT 0,
  vi_tri TEXT,
  ghi_chu TEXT,
  equipment JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS referee_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  referee_id UUID,
  arena_id UUID,
  session_date DATE NOT NULL,
  session_shift VARCHAR(10) NOT NULL,
  role VARCHAR(20) DEFAULT 'chinh',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS combat_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  content_category_id UUID,
  weight_class_id UUID,
  arena_id UUID,
  athlete_red_id UUID,
  athlete_blue_id UUID,
  vong VARCHAR(50),
  bracket_position INT,
  diem_do JSONB DEFAULT '[]',
  diem_xanh JSONB DEFAULT '[]',
  penalties_red JSONB DEFAULT '[]',
  penalties_blue JSONB DEFAULT '[]',
  ket_qua TEXT,
  nguoi_thang_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'chua_dau',
  thoi_gian_bat_dau TIMESTAMPTZ,
  thoi_gian_ket_thuc TIMESTAMPTZ,
  event_log JSONB DEFAULT '[]',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS form_performances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  content_category_id UUID,
  arena_id UUID,
  athlete_id UUID,
  judge_scores JSONB NOT NULL DEFAULT '[]',
  diem_trung_binh DECIMAL(5,2),
  diem_tru_high DECIMAL(5,2),
  diem_tru_low DECIMAL(5,2),
  tong_diem DECIMAL(5,2),
  xep_hang INT,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'cho_thi',
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weigh_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  athlete_id UUID,
  weight_class_id UUID,
  can_nang_thuc DECIMAL(5,1) NOT NULL,
  ket_qua VARCHAR(20) NOT NULL DEFAULT 'cho_xu_ly',
  thoi_gian TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nguoi_can VARCHAR(100),
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  ngay DATE NOT NULL,
  buoi VARCHAR(10) NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  arena_id UUID,
  content_category_id UUID,
  so_tran INT DEFAULT 0,
  ghi_chu TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  loai VARCHAR(20) NOT NULL,
  team_id UUID,
  noi_dung TEXT NOT NULL,
  match_id UUID,
  performance_id UUID,
  trang_thai VARCHAR(20) NOT NULL DEFAULT 'moi',
  nguoi_gui VARCHAR(200) NOT NULL,
  thoi_gian_gui TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  nguoi_xu_ly VARCHAR(200),
  ket_luan TEXT,
  thoi_gian_xu_ly TIMESTAMPTZ,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  user_id UUID,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  athlete_id UUID,
  match_id UUID,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20),
  action_taken TEXT,
  can_continue BOOLEAN,
  reported_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  uploaded_by UUID,
  type VARCHAR(20) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title VARCHAR(200),
  description TEXT,
  tags JSONB DEFAULT '[]',
  match_id UUID,
  athlete_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS data_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL,
  old_data JSONB,
  new_data JSONB,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_athletes_tournament ON athletes(tournament_id);
CREATE INDEX IF NOT EXISTS idx_athletes_team ON athletes(team_id);
CREATE INDEX IF NOT EXISTS idx_registrations_athlete ON registrations(athlete_id);
CREATE INDEX IF NOT EXISTS idx_combat_matches_tournament ON combat_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_combat_matches_status ON combat_matches(trang_thai);
CREATE INDEX IF NOT EXISTS idx_form_performances_tournament ON form_performances(tournament_id);
CREATE INDEX IF NOT EXISTS idx_schedule_tournament_date ON schedule_entries(tournament_id, ngay);
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_referees_tournament ON referees(tournament_id);
CREATE INDEX IF NOT EXISTS idx_arenas_tournament ON arenas(tournament_id);
CREATE INDEX IF NOT EXISTS idx_appeals_tournament ON appeals(tournament_id);
CREATE INDEX IF NOT EXISTS idx_weigh_ins_athlete ON weigh_ins(athlete_id);
`
	if _, err := s.pool.Exec(context.Background(), relational); err != nil {
		return fmt.Errorf("postgres relational migration failed: %w", err)
	}

	const marketplaceSchema = `
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  seller_role TEXT NOT NULL,
  title TEXT NOT NULL,
  short_description TEXT,
  description TEXT,
  category TEXT NOT NULL,
  condition TEXT NOT NULL,
  martial_art TEXT,
  price_vnd BIGINT NOT NULL,
  compare_at_price_vnd BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'VND',
  stock_quantity INT NOT NULL DEFAULT 0,
  minimum_order_quantity INT NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  location TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  images JSONB NOT NULL DEFAULT '[]',
  tags JSONB NOT NULL DEFAULT '[]',
  specs JSONB NOT NULL DEFAULT '[]',
  shipping JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_orders (
  id UUID PRIMARY KEY,
  order_code TEXT NOT NULL UNIQUE,
  seller_id TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  buyer_name TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  buyer_email TEXT,
  buyer_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'unpaid',
  subtotal_vnd BIGINT NOT NULL DEFAULT 0,
  shipping_fee_vnd BIGINT NOT NULL DEFAULT 0,
  discount_vnd BIGINT NOT NULL DEFAULT 0,
  total_vnd BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketplace_order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES marketplace_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE RESTRICT,
  product_slug TEXT NOT NULL,
  product_title TEXT NOT NULL,
  unit_price_vnd BIGINT NOT NULL DEFAULT 0,
  quantity INT NOT NULL DEFAULT 1,
  line_total_vnd BIGINT NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_status
  ON marketplace_products(status, featured, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_seller
  ON marketplace_products(seller_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_category
  ON marketplace_products(category, status);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_seller
  ON marketplace_orders(seller_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_orders_status
  ON marketplace_orders(status, payment_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_order_items_order
  ON marketplace_order_items(order_id);
`
	if _, err := s.pool.Exec(context.Background(), marketplaceSchema); err != nil {
		return fmt.Errorf("postgres marketplace migration failed: %w", err)
	}

	return nil
}

func (s *PostgresStore) EnsureEntity(_ string) {}

func (s *PostgresStore) List(entity string) [][]byte {
	rows, err := s.pool.Query(
		context.Background(),
		`SELECT payload FROM entity_records WHERE entity=$1 ORDER BY id ASC`,
		entity,
	)
	if err != nil {
		return [][]byte{}
	}
	defer rows.Close()

	records := make([][]byte, 0)
	for rows.Next() {
		var raw []byte
		if scanErr := rows.Scan(&raw); scanErr != nil {
			continue
		}
		records = append(records, raw)
	}
	return records
}

func (s *PostgresStore) GetByID(entity, id string) ([]byte, bool) {
	var raw []byte
	err := s.pool.QueryRow(
		context.Background(),
		`SELECT payload FROM entity_records WHERE entity=$1 AND id=$2`,
		entity,
		id,
	).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) || err != nil {
		return nil, false
	}

	return raw, true
}

func (s *PostgresStore) Create(entity string, item []byte) ([]byte, error) {
	id, err := requireIDBytes(item)
	if err != nil {
		return nil, err
	}

	if _, exists := s.GetByID(entity, id); exists {
		return nil, fmt.Errorf("%w: %s", apierror.ErrDuplicateID, id)
	}

	_, err = s.pool.Exec(
		context.Background(),
		`INSERT INTO entity_records(entity, id, payload) VALUES($1, $2, $3)`,
		entity,
		id,
		item,
	)
	if err != nil {
		return nil, err
	}

	return item, nil
}

func (s *PostgresStore) Update(entity, id string, patch []byte) ([]byte, error) {
	var next []byte
	err := s.pool.QueryRow(
		context.Background(),
		`UPDATE entity_records SET payload = (payload || $3) || jsonb_build_object('id', $2::text), updated_at=NOW() WHERE entity=$1 AND id=$2 RETURNING payload`,
		entity,
		id,
		patch,
	).Scan(&next)

	if errors.Is(err, pgx.ErrNoRows) {
		return nil, apierror.ErrNotFound
	}
	if err != nil {
		return nil, err
	}

	return next, nil
}

func (s *PostgresStore) Delete(entity, id string) {
	_, _ = s.pool.Exec(
		context.Background(),
		`DELETE FROM entity_records WHERE entity=$1 AND id=$2`,
		entity,
		id,
	)
}

func (s *PostgresStore) ReplaceAll(entity string, items [][]byte) ([][]byte, error) {
	ctx := context.Background()
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer func() {
		_ = tx.Rollback(ctx)
	}()

	_, err = tx.Exec(ctx, `DELETE FROM entity_records WHERE entity=$1`, entity)
	if err != nil {
		return nil, err
	}

	for _, item := range items {
		id, idErr := requireIDBytes(item)
		if idErr != nil {
			return nil, idErr
		}
		_, execErr := tx.Exec(
			ctx,
			`INSERT INTO entity_records(entity, id, payload) VALUES($1, $2, $3)`,
			entity,
			id,
			item,
		)
		if execErr != nil {
			return nil, execErr
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return nil, err
	}

	return s.List(entity), nil
}

func (s *PostgresStore) Import(entity string, payload []any) ImportReport {
	report := ImportReport{
		Imported: make([][]byte, 0),
		Rejected: make([]RejectedItem, 0),
	}

	for _, item := range payload {
		mapped, ok := item.(map[string]any)
		if !ok {
			report.Rejected = append(report.Rejected, RejectedItem{
				Item:   item,
				Reason: "invalid format",
			})
			continue
		}

		id, err := requireID(mapped)
		if err != nil {
			report.Rejected = append(report.Rejected, RejectedItem{
				Item:   item,
				Reason: err.Error(),
			})
			continue
		}

		body, marshalErr := json.Marshal(mapped)
		if marshalErr != nil {
			report.Rejected = append(report.Rejected, RejectedItem{
				Item:   item,
				Reason: marshalErr.Error(),
			})
			continue
		}

		_, execErr := s.pool.Exec(
			context.Background(),
			`INSERT INTO entity_records(entity, id, payload)
			 VALUES($1, $2, $3)
			 ON CONFLICT(entity, id)
			 DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()`,
			entity,
			id,
			body,
		)
		if execErr != nil {
			report.Rejected = append(report.Rejected, RejectedItem{
				Item:   item,
				Reason: execErr.Error(),
			})
			continue
		}
		report.Imported = append(report.Imported, body)
	}

	return report
}

func (s *PostgresStore) ExportJSON(entity string) (string, error) {
	rows := s.List(entity)
	if len(rows) == 0 {
		return "[]", nil
	}
	var sb strings.Builder
	sb.WriteString("[\n")
	for i, row := range rows {
		sb.Write(row)
		if i < len(rows)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString("\n")
		}
	}
	sb.WriteString("]")
	return sb.String(), nil
}

func (s *PostgresStore) ExportCSV(entity string) (string, error) {
	rows := s.List(entity)
	if len(rows) == 0 {
		return "", nil
	}

	var firstItem map[string]any
	if err := json.Unmarshal(rows[0], &firstItem); err != nil {
		return "", err
	}
	headers := sortedKeys(firstItem)

	builder := &strings.Builder{}
	writer := csv.NewWriter(builder)
	if err := writer.Write(headers); err != nil {
		return "", err
	}

	for _, rowBytes := range rows {
		var row map[string]any
		if err := json.Unmarshal(rowBytes, &row); err != nil {
			continue
		}
		record := make([]string, 0, len(headers))
		for _, key := range headers {
			record = append(record, stringifyValue(row[key]))
		}
		if err := writer.Write(record); err != nil {
			return "", err
		}
	}
	writer.Flush()
	if err := writer.Error(); err != nil {
		return "", err
	}

	return builder.String(), nil
}

// ── Transaction Support ──────────────────────────────────────

// WithTransaction executes fn inside a database transaction.
// If fn returns nil, the transaction is committed; otherwise it is rolled back.
// The fn receives a TxStore that forwards all DataStore methods through the transaction.
func (s *PostgresStore) WithTransaction(ctx context.Context, fn func(tx DataStore) error) error {
	pgTx, err := s.pool.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	txStore := &TxStore{tx: pgTx}
	if fnErr := fn(txStore); fnErr != nil {
		_ = pgTx.Rollback(ctx)
		return fnErr
	}

	if commitErr := pgTx.Commit(ctx); commitErr != nil {
		return fmt.Errorf("commit transaction: %w", commitErr)
	}
	return nil
}

// TxStore wraps a pgx.Tx to implement DataStore within a transaction scope.
type TxStore struct {
	tx pgx.Tx
}

func (t *TxStore) EnsureEntity(_ string) {}

func (t *TxStore) List(entity string) [][]byte {
	rows, err := t.tx.Query(
		context.Background(),
		`SELECT payload FROM entity_records WHERE entity=$1 ORDER BY id ASC`,
		entity,
	)
	if err != nil {
		return [][]byte{}
	}
	defer rows.Close()

	records := make([][]byte, 0)
	for rows.Next() {
		var raw []byte
		if scanErr := rows.Scan(&raw); scanErr != nil {
			continue
		}
		records = append(records, raw)
	}
	return records
}

func (t *TxStore) GetByID(entity, id string) ([]byte, bool) {
	var raw []byte
	err := t.tx.QueryRow(
		context.Background(),
		`SELECT payload FROM entity_records WHERE entity=$1 AND id=$2`,
		entity, id,
	).Scan(&raw)
	if errors.Is(err, pgx.ErrNoRows) || err != nil {
		return nil, false
	}
	return raw, true
}

func (t *TxStore) Create(entity string, item []byte) ([]byte, error) {
	id, err := requireIDBytes(item)
	if err != nil {
		return nil, err
	}
	_, err = t.tx.Exec(
		context.Background(),
		`INSERT INTO entity_records(entity, id, payload) VALUES($1, $2, $3)`,
		entity, id, item,
	)
	if err != nil {
		return nil, err
	}
	return item, nil
}

func (t *TxStore) Update(entity, id string, patch []byte) ([]byte, error) {
	var next []byte
	err := t.tx.QueryRow(
		context.Background(),
		`UPDATE entity_records SET payload = (payload || $3) || jsonb_build_object('id', $2::text), updated_at=NOW() WHERE entity=$1 AND id=$2 RETURNING payload`,
		entity, id, patch,
	).Scan(&next)
	if errors.Is(err, pgx.ErrNoRows) || err != nil {
		return nil, errors.New("khong tim thay ban ghi")
	}
	return next, nil
}

func (t *TxStore) Delete(entity, id string) {
	_, _ = t.tx.Exec(
		context.Background(),
		`DELETE FROM entity_records WHERE entity=$1 AND id=$2`,
		entity, id,
	)
}

func (t *TxStore) ReplaceAll(entity string, items [][]byte) ([][]byte, error) {
	_, err := t.tx.Exec(context.Background(), `DELETE FROM entity_records WHERE entity=$1`, entity)
	if err != nil {
		return nil, err
	}
	for _, item := range items {
		if _, createErr := t.Create(entity, item); createErr != nil {
			return nil, createErr
		}
	}
	return t.List(entity), nil
}

func (t *TxStore) Import(entity string, payload []any) ImportReport {
	report := ImportReport{Imported: make([][]byte, 0), Rejected: make([]RejectedItem, 0)}
	for _, item := range payload {
		mapped, ok := item.(map[string]any)
		if !ok {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: "dinh dang khong hop le"})
			continue
		}
		id, err := requireID(mapped)
		if err != nil {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: err.Error()})
			continue
		}
		body, marshalErr := json.Marshal(mapped)
		if marshalErr != nil {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: marshalErr.Error()})
			continue
		}
		_, execErr := t.tx.Exec(context.Background(),
			`INSERT INTO entity_records(entity, id, payload) VALUES($1, $2, $3) ON CONFLICT(entity, id) DO UPDATE SET payload=EXCLUDED.payload, updated_at=NOW()`,
			entity, id, body)
		if execErr != nil {
			report.Rejected = append(report.Rejected, RejectedItem{Item: item, Reason: execErr.Error()})
			continue
		}
		report.Imported = append(report.Imported, body)
	}
	return report
}

func (t *TxStore) ExportJSON(entity string) (string, error) {
	rows := t.List(entity)
	if len(rows) == 0 {
		return "[]", nil
	}
	var sb strings.Builder
	sb.WriteString("[\n")
	for i, row := range rows {
		sb.Write(row)
		if i < len(rows)-1 {
			sb.WriteString(",\n")
		} else {
			sb.WriteString("\n")
		}
	}
	sb.WriteString("]")
	return sb.String(), nil
}

func (t *TxStore) ExportCSV(entity string) (string, error) {
	rows := t.List(entity)
	if len(rows) == 0 {
		return "", nil
	}
	var firstItem map[string]any
	if err := json.Unmarshal(rows[0], &firstItem); err != nil {
		return "", err
	}
	headers := sortedKeys(firstItem)
	builder := &strings.Builder{}
	writer := csv.NewWriter(builder)
	_ = writer.Write(headers)
	for _, rowBytes := range rows {
		var row map[string]any
		if err := json.Unmarshal(rowBytes, &row); err != nil {
			continue
		}
		record := make([]string, 0, len(headers))
		for _, key := range headers {
			record = append(record, stringifyValue(row[key]))
		}
		_ = writer.Write(record)
	}
	writer.Flush()
	return builder.String(), writer.Error()
}

func (t *TxStore) Close() error { return nil }

// ────────────────────────────────────────────────────────────

func (s *PostgresStore) Close() error {
	s.pool.Close()
	return nil
}
