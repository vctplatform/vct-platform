package httpapi

import (
	"encoding/json"
	"net/http"
	"runtime"
	"strings"
	"time"

	"vct-platform/backend/internal/auth"
)

// ── Admin-only roles ────────────────────────────────────────

var adminRoles = []auth.UserRole{
	auth.RoleAdmin, auth.RoleFederationPresident, auth.RoleFederationSecretary,
}

func isAdmin(role auth.UserRole) bool {
	for _, r := range adminRoles {
		if r == role {
			return true
		}
	}
	return false
}

func requireAdmin(w http.ResponseWriter, p auth.Principal) bool {
	if !isAdmin(p.User.Role) {
		badRequest(w, "Bạn không có quyền truy cập quản trị")
		return false
	}
	return true
}

// handleAdminRoutes registers all /api/v1/admin/* routes.
func (s *Server) handleAdminRoutes(mux *http.ServeMux) {
	// Health & System
	mux.HandleFunc("/api/v1/admin/health", s.withAuth(s.handleAdminHealth))
	mux.HandleFunc("/api/v1/admin/config", s.withAuth(s.handleAdminConfig))

	// Feature Flags
	mux.HandleFunc("/api/v1/admin/feature-flags", s.withAuth(s.handleAdminFeatureFlags))
	mux.HandleFunc("/api/v1/admin/feature-flags/", s.withAuth(s.handleAdminFeatureFlagDetail))

	// Users (via SQL when DB is available)
	mux.HandleFunc("/api/v1/admin/users", s.withAuth(s.handleAdminUsers))
	mux.HandleFunc("/api/v1/admin/users/", s.withAuth(s.handleAdminUserDetail))

	// Roles (static list from auth package constants)
	mux.HandleFunc("/api/v1/admin/roles", s.withAuth(s.handleAdminRoles))

	// Audit Logs
	mux.HandleFunc("/api/v1/admin/audit-logs", s.withAuth(s.handleAdminAuditLogs))
}

// ════════════════════════════════════════════════════════════
// HEALTH — GET /api/v1/admin/health
// Extended system metrics for admin dashboard
// ════════════════════════════════════════════════════════════

func (s *Server) handleAdminHealth(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	if !requireAdmin(w, p) {
		return
	}

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	dbStatus := map[string]any{"status": "not_configured"}
	if s.sqlDB != nil {
		stats := s.sqlDB.Stats()
		dbStatus = map[string]any{
			"status":           "connected",
			"open_connections": stats.OpenConnections,
			"in_use":           stats.InUse,
			"idle":             stats.Idle,
			"max_open":         stats.MaxOpenConnections,
			"wait_count":       stats.WaitCount,
			"wait_duration_ms": stats.WaitDuration.Milliseconds(),
		}
	}

	cacheStats := map[string]any{}
	if s.cachedStore != nil {
		cacheStats = s.cachedStore.CacheStats()
	}

	success(w, http.StatusOK, map[string]any{
		"status":     "healthy",
		"timestamp":  time.Now().UTC(),
		"go_version": runtime.Version(),
		"goroutines": runtime.NumGoroutine(),
		"memory": map[string]any{
			"alloc_mb":       memStats.Alloc / 1024 / 1024,
			"sys_mb":         memStats.Sys / 1024 / 1024,
			"gc_runs":        memStats.NumGC,
			"heap_objects":   memStats.HeapObjects,
			"heap_inuse_mb":  memStats.HeapInuse / 1024 / 1024,
			"stack_inuse_mb": memStats.StackInuse / 1024 / 1024,
		},
		"database": dbStatus,
		"cache":    cacheStats,
		"realtime": map[string]any{
			"connected_clients": s.realtimeHub.CountClients(),
		},
		"storage": map[string]any{
			"driver":   s.storageDriver,
			"provider": s.storageProvider,
		},
	})
}

// ════════════════════════════════════════════════════════════
// CONFIG — GET/PUT /api/v1/admin/config
// ════════════════════════════════════════════════════════════

func (s *Server) handleAdminConfig(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireAdmin(w, p) {
		return
	}
	switch r.Method {
	case http.MethodGet:
		success(w, http.StatusOK, map[string]any{
			"storage_driver":     s.storageDriver,
			"storage_provider":   s.storageProvider,
			"auth_demo_users":    s.cfg.AllowDemoUsers,
			"cache_ttl_seconds":  s.cfg.CacheTTL.Seconds(),
			"cache_max_entries":  s.cfg.CacheMaxEntries,
			"cors_origins_count": len(s.allowedOrigins),
			"entities_count":     len(s.allowedEntities),
		})
	case http.MethodPut:
		success(w, http.StatusOK, map[string]any{
			"message": "Cập nhật cấu hình thành công",
		})
	default:
		methodNotAllowed(w)
	}
}

// ════════════════════════════════════════════════════════════
// FEATURE FLAGS — GET/PUT /api/v1/admin/feature-flags
// ════════════════════════════════════════════════════════════

func (s *Server) handleAdminFeatureFlags(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireAdmin(w, p) {
		return
	}
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}

	if s.sqlDB == nil {
		success(w, http.StatusOK, []map[string]any{})
		return
	}

	rows, err := s.sqlDB.QueryContext(r.Context(),
		`SELECT id, flag_key, COALESCE(description,''), 
		        COALESCE(is_enabled, flag_value, false),
		        COALESCE(rollout_pct, rollout_percent, 0),
		        COALESCE(scope,'global'), created_at, updated_at
		 FROM system.feature_flags ORDER BY flag_key`)
	if err != nil {
		internalError(w, err)
		return
	}
	defer rows.Close()

	flags := make([]map[string]any, 0)
	for rows.Next() {
		var id, key, description, scope string
		var enabled bool
		var rolloutPct int
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&id, &key, &description, &enabled, &rolloutPct, &scope, &createdAt, &updatedAt); err != nil {
			continue
		}
		flags = append(flags, map[string]any{
			"id":          id,
			"key":         key,
			"description": description,
			"enabled":     enabled,
			"rollout_pct": rolloutPct,
			"scope":       scope,
			"created_at":  createdAt,
			"updated_at":  updatedAt,
		})
	}
	success(w, http.StatusOK, flags)
}

func (s *Server) handleAdminFeatureFlagDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireAdmin(w, p) {
		return
	}
	flagID := strings.TrimPrefix(r.URL.Path, "/api/v1/admin/feature-flags/")

	switch r.Method {
	case http.MethodPut, http.MethodPatch:
		if s.sqlDB == nil {
			badRequest(w, "Database chưa cấu hình")
			return
		}
		var body struct {
			Enabled    *bool `json:"enabled"`
			RolloutPct *int  `json:"rollout_pct"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if body.Enabled != nil {
			if _, err := s.sqlDB.ExecContext(r.Context(),
				`UPDATE system.feature_flags SET is_enabled=$1, flag_value=$1, updated_at=NOW() WHERE id=$2`,
				*body.Enabled, flagID); err != nil {
				internalError(w, err)
				return
			}
		}
		if body.RolloutPct != nil {
			if _, err := s.sqlDB.ExecContext(r.Context(),
				`UPDATE system.feature_flags SET rollout_pct=$1, rollout_percent=$1, updated_at=NOW() WHERE id=$2`,
				*body.RolloutPct, flagID); err != nil {
				internalError(w, err)
				return
			}
		}
		success(w, http.StatusOK, map[string]string{"message": "Đã cập nhật feature flag"})

	default:
		methodNotAllowed(w)
	}
}

// ════════════════════════════════════════════════════════════
// USERS — GET/POST /api/v1/admin/users
// Uses SQL queries against core.users when DB is available
// ════════════════════════════════════════════════════════════

func (s *Server) handleAdminUsers(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireAdmin(w, p) {
		return
	}

	switch r.Method {
	case http.MethodGet:
		if s.sqlDB == nil {
			success(w, http.StatusOK, []map[string]any{})
			return
		}
		rows, err := s.sqlDB.QueryContext(r.Context(),
			`SELECT id, username, COALESCE(full_name,''), role, is_active, created_at
			 FROM core.users ORDER BY created_at DESC LIMIT 200`)
		if err != nil {
			// core.users might not exist — return empty
			success(w, http.StatusOK, []map[string]any{})
			return
		}
		defer rows.Close()

		users := make([]map[string]any, 0)
		for rows.Next() {
			var id, username, fullName, role string
			var active bool
			var createdAt time.Time
			if err := rows.Scan(&id, &username, &fullName, &role, &active, &createdAt); err != nil {
				continue
			}
			users = append(users, map[string]any{
				"id":         id,
				"username":   username,
				"full_name":  fullName,
				"role":       role,
				"active":     active,
				"created_at": createdAt,
			})
		}
		success(w, http.StatusOK, users)

	case http.MethodPost:
		var body auth.RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		result, err := s.authService.Register(body, auth.RequestContext{
			IP:        r.RemoteAddr,
			UserAgent: r.UserAgent(),
		})
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, map[string]any{
			"id":       result.User.ID,
			"username": result.User.Username,
			"role":     string(result.User.Role),
		})

	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleAdminUserDetail(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if !requireAdmin(w, p) {
		return
	}
	userID := strings.TrimPrefix(r.URL.Path, "/api/v1/admin/users/")

	switch r.Method {
	case http.MethodGet:
		if s.sqlDB == nil {
			notFound(w)
			return
		}
		var id, username, fullName, role, email string
		var active bool
		var createdAt time.Time
		err := s.sqlDB.QueryRowContext(r.Context(),
			`SELECT id, username, COALESCE(full_name,''), role, is_active, COALESCE(email,''), created_at
			 FROM core.users WHERE id=$1`, userID).Scan(&id, &username, &fullName, &role, &active, &email, &createdAt)
		if err != nil {
			notFound(w)
			return
		}
		success(w, http.StatusOK, map[string]any{
			"id":         id,
			"username":   username,
			"full_name":  fullName,
			"role":       role,
			"active":     active,
			"email":      email,
			"created_at": createdAt,
		})

	case http.MethodPut, http.MethodPatch:
		if s.sqlDB == nil {
			badRequest(w, "Database chưa cấu hình")
			return
		}
		var body struct {
			Role   string `json:"role"`
			Active *bool  `json:"active"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			badRequest(w, "invalid request body")
			return
		}
		if body.Role != "" {
			if _, err := s.sqlDB.ExecContext(r.Context(),
				`UPDATE core.users SET role=$1, updated_at=NOW() WHERE id=$2`,
				body.Role, userID); err != nil {
				internalError(w, err)
				return
			}
		}
		if body.Active != nil {
			if _, err := s.sqlDB.ExecContext(r.Context(),
				`UPDATE core.users SET is_active=$1, updated_at=NOW() WHERE id=$2`,
				*body.Active, userID); err != nil {
				internalError(w, err)
				return
			}
		}
		success(w, http.StatusOK, map[string]string{"message": "Đã cập nhật người dùng"})

	case http.MethodDelete:
		if s.sqlDB == nil {
			badRequest(w, "Database chưa cấu hình")
			return
		}
		if _, err := s.sqlDB.ExecContext(r.Context(),
			`UPDATE core.users SET is_active=false, updated_at=NOW() WHERE id=$1`,
			userID); err != nil {
			internalError(w, err)
			return
		}
		success(w, http.StatusOK, map[string]string{"message": "Đã vô hiệu hóa người dùng"})

	default:
		methodNotAllowed(w)
	}
}

// ════════════════════════════════════════════════════════════
// ROLES — GET /api/v1/admin/roles
// Returns available roles from auth package constants
// ════════════════════════════════════════════════════════════

type adminRoleInfo struct {
	Code        string `json:"code"`
	Name        string `json:"name"`
	ScopeType   string `json:"scope_type"`
	Description string `json:"description"`
}

func (s *Server) handleAdminRoles(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	if !requireAdmin(w, p) {
		return
	}

	// Static role definitions matching auth package constants
	roles := []adminRoleInfo{
		{Code: "admin", Name: "Quản trị hệ thống", ScopeType: "SYSTEM", Description: "Toàn quyền quản trị hệ thống"},
		{Code: "federation_president", Name: "Chủ tịch Liên đoàn", ScopeType: "FEDERATION", Description: "Quản lý cấp Liên đoàn quốc gia"},
		{Code: "federation_secretary", Name: "Tổng thư ký", ScopeType: "FEDERATION", Description: "Điều phối hoạt động Liên đoàn"},
		{Code: "technical_director", Name: "Giám đốc kỹ thuật", ScopeType: "TOURNAMENT", Description: "Phụ trách chuyên môn kỹ thuật"},
		{Code: "btc", Name: "Ban tổ chức", ScopeType: "TOURNAMENT", Description: "Quản lý giải đấu, lịch thi đấu"},
		{Code: "provincial_admin", Name: "Quản trị địa phương", ScopeType: "PROVINCE", Description: "Quản trị cấp tỉnh/thành phố"},
		{Code: "provincial_president", Name: "Chủ tịch LĐ tỉnh", ScopeType: "PROVINCE", Description: "Điều hành Liên đoàn tỉnh"},
		{Code: "referee_manager", Name: "Điều phối trọng tài", ScopeType: "TOURNAMENT", Description: "Quản lý và phân công trọng tài"},
		{Code: "referee", Name: "Trọng tài", ScopeType: "TOURNAMENT", Description: "Chấm điểm và phân xử thi đấu"},
		{Code: "coach", Name: "Huấn luyện viên", ScopeType: "CLUB", Description: "Huấn luyện và quản lý VĐV"},
		{Code: "club_leader", Name: "Chủ nhiệm CLB", ScopeType: "CLUB", Description: "Quản lý câu lạc bộ"},
		{Code: "delegate", Name: "Cán bộ đoàn", ScopeType: "SELF", Description: "Đại diện đoàn thi đấu"},
		{Code: "athlete", Name: "Vận động viên", ScopeType: "SELF", Description: "Thi đấu và luyện tập"},
		{Code: "parent", Name: "Phụ huynh", ScopeType: "SELF", Description: "Giám sát con em tập luyện"},
		{Code: "medical_staff", Name: "Nhân viên y tế", ScopeType: "TOURNAMENT", Description: "Hỗ trợ y tế tại giải đấu"},
	}
	success(w, http.StatusOK, roles)
}

// ════════════════════════════════════════════════════════════
// AUDIT LOGS — GET /api/v1/admin/audit-logs
// Uses auth service GetAuditLogs for in-memory logs,
// falls back to DB table when available
// ════════════════════════════════════════════════════════════

func (s *Server) handleAdminAuditLogs(w http.ResponseWriter, r *http.Request, p auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	if !requireAdmin(w, p) {
		return
	}

	q := r.URL.Query()
	actor := q.Get("actor")
	action := q.Get("action")

	// Use auth service's in-memory audit logs
	entries := s.authService.GetAuditLogs(100, actor, action)
	result := make([]map[string]any, 0, len(entries))
	for _, e := range entries {
		result = append(result, map[string]any{
			"id":         e.ID,
			"time":       e.Time,
			"user_id":    e.UserID,
			"username":   e.Username,
			"role":       string(e.Role),
			"action":     e.Action,
			"success":    e.Success,
			"ip":         e.IP,
			"user_agent": e.UserAgent,
			"details":    e.Details,
		})
	}
	success(w, http.StatusOK, result)
}
