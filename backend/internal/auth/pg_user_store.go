package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"strings"

	"vct-platform/backend/internal/apierror"
)

// SystemTenantID is the root tenant used for auth-level user records.
const SystemTenantID = "00000000-0000-7000-8000-000000000001"

// PgUserStore implements UserStore backed by the core.users table.
type PgUserStore struct {
	db *sql.DB
}

// NewPgUserStore creates a PostgreSQL-backed user store.
func NewPgUserStore(db *sql.DB) *PgUserStore {
	return &PgUserStore{db: db}
}

// FindByUsername looks up a user by username in core.users.
func (s *PgUserStore) FindByUsername(ctx context.Context, username string) (*StoredUser, error) {
	const query = `
		SELECT id, tenant_id, username, COALESCE(email,''), COALESCE(phone,''),
		       password_hash, full_name, is_active,
		       COALESCE(locale,'vi'), COALESCE(timezone,'Asia/Ho_Chi_Minh'),
		       COALESCE(metadata->>'roles', '[]')
		FROM core.users
		WHERE username = $1 AND is_deleted = false
		LIMIT 1
	`
	row := s.db.QueryRowContext(ctx, query, strings.ToLower(strings.TrimSpace(username)))

	var u StoredUser
	var rolesJSON string
	err := row.Scan(
		&u.ID, &u.TenantID, &u.Username, &u.Email, &u.Phone,
		&u.PasswordHash, &u.FullName, &u.IsActive,
		&u.Locale, &u.Timezone, &rolesJSON,
	)
	if err == sql.ErrNoRows {
		return nil, nil // not found — not an error
	}
	if err != nil {
		return nil, apierror.Wrap(err, "AUTH_500_DB", "lỗi truy vấn người dùng")
	}

	// Parse roles from metadata JSON array
	var roles []string
	if err := json.Unmarshal([]byte(rolesJSON), &roles); err == nil {
		for _, r := range roles {
			u.Roles = append(u.Roles, UserRole(r))
		}
	}
	if len(u.Roles) > 0 {
		u.Role = u.Roles[0]
	}

	return &u, nil
}

// Create inserts a new user into core.users.
func (s *PgUserStore) Create(ctx context.Context, user *StoredUser) error {
	tenantID := user.TenantID
	if tenantID == "" {
		tenantID = SystemTenantID
	}

	// Encode roles as JSON array in metadata
	rolesJSON, _ := json.Marshal(rolesToStrings(user.Roles))
	metadata := fmt.Sprintf(`{"roles": %s}`, string(rolesJSON))

	const query = `
		INSERT INTO core.users (id, tenant_id, username, email, phone, password_hash, full_name, locale, timezone, metadata)
		VALUES ($1, $2, $3, NULLIF($4,''), NULLIF($5,''), $6, $7, $8, $9, $10::jsonb)
		ON CONFLICT (tenant_id, username) DO NOTHING
	`
	result, err := s.db.ExecContext(ctx, query,
		user.ID,
		tenantID,
		strings.ToLower(strings.TrimSpace(user.Username)),
		strings.TrimSpace(user.Email),
		strings.TrimSpace(user.Phone),
		user.PasswordHash,
		strings.TrimSpace(user.FullName),
		coalesce(user.Locale, "vi"),
		coalesce(user.Timezone, "Asia/Ho_Chi_Minh"),
		metadata,
	)
	if err != nil {
		return apierror.Wrap(err, "AUTH_500_DB", "lỗi tạo người dùng")
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		return apierror.New("AUTH_409_EXISTS", "tên đăng nhập đã tồn tại")
	}
	return nil
}

// UpdateLastLogin stamps last_login_at for a user.
func (s *PgUserStore) UpdateLastLogin(ctx context.Context, userID string) error {
	const query = `UPDATE core.users SET last_login_at = NOW() WHERE id = $1`
	_, err := s.db.ExecContext(ctx, query, userID)
	if err != nil {
		return apierror.Wrap(err, "AUTH_500_DB", "lỗi cập nhật thời gian đăng nhập")
	}
	return nil
}

// ── helpers ──────────────────────────────────────────────────────

func rolesToStrings(roles []UserRole) []string {
	out := make([]string, len(roles))
	for i, r := range roles {
		out[i] = string(r)
	}
	return out
}

func coalesce(val, fallback string) string {
	if strings.TrimSpace(val) == "" {
		return fallback
	}
	return val
}
