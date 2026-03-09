package httpapi

import (
	"fmt"
	"log"
	"net"
	"net/http"
	"strings"
	"time"

	"vct-platform/backend/internal/auth"
	"vct-platform/backend/internal/authz"
)

// ── Authentication Middleware ─────────────────────────────────

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

func (s *Server) authorizeEntityAction(
	principal *auth.Principal,
	entity string,
	action authz.EntityAction,
) error {
	if s.cfg.DisableAuthForData {
		return nil
	}
	if principal == nil {
		return fmt.Errorf("%w: thiếu thông tin phiên làm việc", auth.ErrUnauthorized)
	}
	if authz.CanEntityAction(principal.User.Role, entity, action) {
		return nil
	}
	return fmt.Errorf(
		"%w: vai trò %s không có quyền %s trên %s",
		auth.ErrForbidden,
		principal.User.Role,
		action,
		entity,
	)
}

// ── CORS Middleware ───────────────────────────────────────────

func (s *Server) withCORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := strings.TrimSpace(r.Header.Get("Origin"))
		if origin != "" {
			if s.isAllowedOrigin(origin) {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Vary", "Origin")
				w.Header().Set("Access-Control-Allow-Headers", "Authorization, Content-Type")
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			}
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}

func (s *Server) isAllowedOrigin(origin string) bool {
	if _, ok := s.allowedOrigins["*"]; ok {
		return true
	}
	_, ok := s.allowedOrigins[origin]
	return ok
}

// ── Logging Middleware ────────────────────────────────────────

func (s *Server) withLogging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		started := time.Now()
		rw := &responseRecorder{ResponseWriter: w, statusCode: http.StatusOK}
		next.ServeHTTP(rw, r)
		latency := time.Since(started)
		log.Printf("%s %s %d %s", r.Method, r.URL.Path, rw.statusCode, latency)
	})
}

// ── Request Context ──────────────────────────────────────────

func requestContextFromRequest(r *http.Request) auth.RequestContext {
	ip := strings.TrimSpace(r.Header.Get("X-Forwarded-For"))
	if ip == "" {
		host, _, err := net.SplitHostPort(strings.TrimSpace(r.RemoteAddr))
		if err == nil {
			ip = host
		} else {
			ip = strings.TrimSpace(r.RemoteAddr)
		}
	} else if strings.Contains(ip, ",") {
		ip = strings.TrimSpace(strings.Split(ip, ",")[0])
	}

	return auth.RequestContext{
		IP:        ip,
		UserAgent: strings.TrimSpace(r.UserAgent()),
	}
}

func tokenFromRequest(r *http.Request) string {
	if token := strings.TrimSpace(r.URL.Query().Get("token")); token != "" {
		return token
	}
	authorization := strings.TrimSpace(r.Header.Get("Authorization"))
	if strings.HasPrefix(strings.ToLower(authorization), "bearer ") {
		return strings.TrimSpace(authorization[7:])
	}
	return ""
}

// ── Response Recorder ────────────────────────────────────────

type responseRecorder struct {
	http.ResponseWriter
	statusCode int
}

func (r *responseRecorder) WriteHeader(statusCode int) {
	r.statusCode = statusCode
	r.ResponseWriter.WriteHeader(statusCode)
}
