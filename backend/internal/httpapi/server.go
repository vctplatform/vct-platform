package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/config"
	"vct-platform/backend/internal/store"
)

const (
	maxRequestBodySize = 10 << 20 // 10 MB
	rateLimitWindow    = 1 * time.Minute
	rateLimitMax       = 60
)

type ipRateEntry struct {
	count     int
	windowStart time.Time
}

type Server struct {
	cfg             config.Config
	authService     *auth.Service
	store           *store.Store
	allowedEntities map[string]struct{}
	allowedOrigins  map[string]struct{}
	rateMu          sync.Mutex
	rateMap         map[string]*ipRateEntry
}

func New(cfg config.Config) *Server {
	originSet := make(map[string]struct{}, len(cfg.AllowedOrigins))
	for _, origin := range cfg.AllowedOrigins {
		trimmed := strings.TrimSpace(origin)
		if trimmed != "" && trimmed != "*" {
			originSet[trimmed] = struct{}{}
		}
	}

	return &Server{
		cfg: cfg,
		authService: auth.NewService(auth.ServiceConfig{
			Secret:          cfg.JWTSecret,
			Issuer:          cfg.JWTIssuer,
			AccessTTL:       cfg.AccessTokenTTL,
			RefreshTTL:      cfg.RefreshTokenTTL,
			AuditLimit:      cfg.AuditLimit,
			CleanupInterval: 5 * time.Minute,
		}),
		store:           store.NewStore(),
		allowedEntities: defaultEntitySet(),
		allowedOrigins:  originSet,
		rateMap:         make(map[string]*ipRateEntry),
	}
}

func (s *Server) Handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/healthz", s.handleHealth)
	mux.HandleFunc("/api/v1/auth/login", s.handleAuthLogin)
	mux.HandleFunc("/api/v1/auth/refresh", s.handleAuthRefresh)
	mux.HandleFunc("/api/v1/auth/me", s.withAuth(s.handleAuthMe))
	mux.HandleFunc("/api/v1/auth/logout", s.withAuth(s.handleAuthLogout))
	mux.HandleFunc("/api/v1/auth/revoke", s.withAuth(s.handleAuthRevoke))
	mux.HandleFunc("/api/v1/auth/audit", s.withAuth(s.handleAuthAudit))
	mux.HandleFunc("/api/v1/", s.handleEntityRoutes)
	return s.withCORS(s.withRateLimit(s.withBodyLimit(s.withSecurityHeaders(s.withLogging(mux)))))
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
	success(w, http.StatusOK, map[string]any{
		"status":  "ok",
		"service": "vct-backend",
		"time":    time.Now().UTC(),
	})
}

func (s *Server) handleAuthLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var input auth.LoginRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
		return
	}

	result, err := s.authService.Login(input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

func (s *Server) handleAuthRefresh(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var input auth.RefreshRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
		return
	}

	result, err := s.authService.Refresh(input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, result)
}

func (s *Server) handleAuthMe(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}
	success(w, http.StatusOK, s.authService.Me(principal))
}

func (s *Server) handleAuthLogout(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}
	s.authService.Logout(principal, requestContextFromRequest(r))
	success(w, http.StatusOK, map[string]any{"message": "Đã đăng xuất và thu hồi phiên"})
}

func (s *Server) handleAuthRevoke(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var input auth.RevokeRequest
	if err := decodeJSON(r, &input); err != nil {
		badRequest(w, err.Error())
		return
	}

	revokedCount, err := s.authService.Revoke(principal, input, requestContextFromRequest(r))
	if err != nil {
		writeAuthError(w, err)
		return
	}
	success(w, http.StatusOK, map[string]any{
		"message":      "Thu hồi token thành công",
		"revokedCount": revokedCount,
	})
}

func (s *Server) handleAuthAudit(w http.ResponseWriter, r *http.Request, principal auth.Principal) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}

	if principal.User.Role != auth.RoleAdmin && principal.User.Role != auth.RoleBTC {
		writeAuthError(w, fmt.Errorf("%w: Không đủ quyền xem audit logs", auth.ErrForbidden))
		return
	}

	limit, err := strconv.Atoi(strings.TrimSpace(r.URL.Query().Get("limit")))
	if err != nil {
		limit = 100
	}
	actor := strings.TrimSpace(r.URL.Query().Get("actor"))
	action := strings.TrimSpace(r.URL.Query().Get("action"))

	auditLogs := s.authService.GetAuditLogs(limit, actor, action)
	success(w, http.StatusOK, map[string]any{
		"items": auditLogs,
		"count": len(auditLogs),
	})
}

func (s *Server) handleEntityRoutes(w http.ResponseWriter, r *http.Request) {
	path := strings.TrimPrefix(r.URL.Path, "/api/v1/")
	path = strings.Trim(path, "/")
	if path == "" {
		notFound(w)
		return
	}

	segments := strings.Split(path, "/")
	entity := segments[0]
	if entity == "auth" {
		notFound(w)
		return
	}
	if _, allowed := s.allowedEntities[entity]; !allowed {
		notFound(w)
		return
	}

	if !s.cfg.DisableAuthForData {
		if _, err := s.principalFromRequest(r); err != nil {
			writeAuthError(w, err)
			return
		}
	}

	s.store.EnsureEntity(entity)

	switch len(segments) {
	case 1:
		s.handleEntityCollection(entity, w, r)
	case 2:
		s.handleEntityAction(entity, segments[1], w, r)
	default:
		notFound(w)
	}
}

func (s *Server) handleEntityCollection(entity string, w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		success(w, http.StatusOK, s.store.List(entity))
	case http.MethodPost:
		item, err := decodeObject(r)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		created, err := s.store.Create(entity, item)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusCreated, created)
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleEntityAction(entity, action string, w http.ResponseWriter, r *http.Request) {
	switch action {
	case "bulk":
		s.handleBulkReplace(entity, w, r)
		return
	case "import":
		s.handleImport(entity, w, r)
		return
	case "export":
		s.handleExport(entity, w, r)
		return
	}

	id := action
	switch r.Method {
	case http.MethodGet:
		item, ok := s.store.GetByID(entity, id)
		if !ok {
			notFound(w)
			return
		}
		success(w, http.StatusOK, item)
	case http.MethodPatch:
		patch, err := decodeObject(r)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		updated, err := s.store.Update(entity, id, patch)
		if err != nil {
			badRequest(w, err.Error())
			return
		}
		success(w, http.StatusOK, updated)
	case http.MethodDelete:
		s.store.Delete(entity, id)
		w.WriteHeader(http.StatusNoContent)
	default:
		methodNotAllowed(w)
	}
}

func (s *Server) handleBulkReplace(entity string, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		methodNotAllowed(w)
		return
	}

	var payload struct {
		Items []map[string]any `json:"items"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		badRequest(w, err.Error())
		return
	}
	replaced, err := s.store.ReplaceAll(entity, payload.Items)
	if err != nil {
		badRequest(w, err.Error())
		return
	}
	success(w, http.StatusOK, replaced)
}

func (s *Server) handleImport(entity string, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		methodNotAllowed(w)
		return
	}

	var payload struct {
		Items []any `json:"items"`
	}
	if err := decodeJSON(r, &payload); err != nil {
		badRequest(w, err.Error())
		return
	}
	report := s.store.Import(entity, payload.Items)
	success(w, http.StatusOK, report)
}

func (s *Server) handleExport(entity string, w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		methodNotAllowed(w)
		return
	}

	format := strings.ToLower(strings.TrimSpace(r.URL.Query().Get("format")))
	if format == "" {
		format = "json"
	}

	var (
		payload string
		err     error
	)
	switch format {
	case "json":
		payload, err = s.store.ExportJSON(entity)
	case "csv":
		payload, err = s.store.ExportCSV(entity)
	default:
		badRequest(w, "format không hỗ trợ, chỉ nhận json hoặc csv")
		return
	}
	if err != nil {
		internalError(w, err)
		return
	}

	contentType := "application/json; charset=utf-8"
	if format == "csv" {
		contentType = "text/csv; charset=utf-8"
	}
	w.Header().Set("Content-Type", contentType)
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write([]byte(payload))
}

// ════════════════════════════════════════
// MIDDLEWARE
// ════════════════════════════════════════

func (s *Server) withAuth(next func(http.ResponseWriter, *http.Request, auth.Principal)) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		principal, err := s.principalFromRequest(r)
		if err != nil {
			writeAuthError(w, err)
			return
		}
		next(w, r, principal)
	}
}

func (s *Server) principalFromRequest(r *http.Request) (auth.Principal, error) {
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if !strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
		return auth.Principal{}, fmt.Errorf("%w: thiếu bearer token", auth.ErrUnauthorized)
	}
	token := strings.TrimSpace(authorization[7:])
	if token == "" {
		return auth.Principal{}, fmt.Errorf("%w: token trống", auth.ErrUnauthorized)
	}
	return s.authService.AuthenticateAccessToken(token, requestContextFromRequest(r))
}

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if origin != "" && s.isAllowedOrigin(origin) {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Vary", "Origin")
			w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type, X-Requested-With")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Max-Age", "7200")
			w.Header().Set("Access-Control-Allow-Credentials", "true")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) isAllowedOrigin(origin string) bool {
	// No wildcard support - explicit origins only
	_, ok := s.allowedOrigins[origin]
	return ok
}

func (s *Server) withSecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("Referrer-Policy", "strict-origin-when-cross-origin")
		w.Header().Set("Cache-Control", "no-store")
		next.ServeHTTP(w, r)
	})
}

func (s *Server) withBodyLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Body != nil && r.ContentLength > maxRequestBodySize {
			http.Error(w, `{"message":"request body quá lớn (tối đa 10MB)"}`, http.StatusRequestEntityTooLarge)
			return
		}
		r.Body = http.MaxBytesReader(w, r.Body, maxRequestBodySize)
		next.ServeHTTP(w, r)
	})
}

func (s *Server) withRateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip := extractClientIP(r)
		now := time.Now()

		s.rateMu.Lock()
		entry, exists := s.rateMap[ip]
		if !exists {
			entry = &ipRateEntry{windowStart: now}
			s.rateMap[ip] = entry
		}
		if now.Sub(entry.windowStart) > rateLimitWindow {
			entry.count = 0
			entry.windowStart = now
		}
		entry.count++
		count := entry.count
		s.rateMu.Unlock()

		if count > rateLimitMax {
			w.Header().Set("Retry-After", "60")
			http.Error(w, `{"message":"quá nhiều request, vui lòng thử lại sau"}`, http.StatusTooManyRequests)
			return
		}

		w.Header().Set("X-RateLimit-Limit", strconv.Itoa(rateLimitMax))
		w.Header().Set("X-RateLimit-Remaining", strconv.Itoa(rateLimitMax-count))
		next.ServeHTTP(w, r)
	})
}

func (s *Server) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		rw := &responseRecorder{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(rw, r)
		latency := time.Since(started)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.statusCode, latency)
	})
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════

func extractClientIP(r *http.Request) string {
	ip := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if ip == "" {
		host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
		if err == nil {
			return host
		}
		return strings.TrimSpace(r.RemoteAddr)
	}
	if strings.Contains(ip, ",") {
		return strings.TrimSpace(strings.Split(ip, ",")[0])
	}
	return ip
}

func requestContextFromRequest(r *http.Request) auth.RequestContext {
	return auth.RequestContext{
		IP:        extractClientIP(r),
		UserAgent: strings.TrimSpace(r.UserAgent()),
	}
}

func decodeObject(r *http.Request) (map[string]any, error) {
	var payload map[string]any
	if err := decodeJSON(r, &payload); err != nil {
		return nil, err
	}
	return payload, nil
}

func decodeJSON(r *http.Request, output any) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(output); err != nil {
		return fmt.Errorf("json không hợp lệ: %w", err)
	}
	return nil
}

func success(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func badRequest(w http.ResponseWriter, message string) {
	success(w, http.StatusBadRequest, map[string]string{"message": message})
}

func notFound(w http.ResponseWriter) {
	success(w, http.StatusNotFound, map[string]string{"message": "không tìm thấy tài nguyên"})
}

func methodNotAllowed(w http.ResponseWriter) {
	success(w, http.StatusMethodNotAllowed, map[string]string{"message": "method không được hỗ trợ"})
}

func internalError(w http.ResponseWriter, err error) {
	success(w, http.StatusInternalServerError, map[string]string{"message": "lỗi hệ thống nội bộ"})
}

func writeAuthError(w http.ResponseWriter, err error) {
	status := http.StatusUnauthorized
	switch {
	case errors.Is(err, auth.ErrBadRequest):
		status = http.StatusBadRequest
	case errors.Is(err, auth.ErrInvalidCredentials):
		status = http.StatusUnauthorized
	case errors.Is(err, auth.ErrForbidden):
		status = http.StatusForbidden
	case errors.Is(err, auth.ErrUnauthorized):
		status = http.StatusUnauthorized
	case errors.Is(err, auth.ErrAccountLocked):
		status = http.StatusTooManyRequests
	}
	success(w, status, map[string]string{"message": authMessage(err)})
}

func authMessage(err error) string {
	parts := strings.SplitN(err.Error(), ":", 2)
	if len(parts) < 2 {
		return err.Error()
	}
	return strings.TrimSpace(parts[1])
}

func defaultEntitySet() map[string]struct{} {
	entities := []string{
		"teams",
		"athletes",
		"registration",
		"results",
		"schedule",
		"arenas",
		"referees",
		"appeals",
		"weigh-ins",
		"combat-matches",
		"form-performances",
		"content-categories",
		"referee-assignments",
		"tournament-config",
	}
	sort.Strings(entities)
	set := make(map[string]struct{}, len(entities))
	for _, entity := range entities {
		set[entity] = struct{}{}
	}
	return set
}

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}
