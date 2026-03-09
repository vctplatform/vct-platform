package auth

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type UserRole string

const (
	RoleAdmin          UserRole = "admin"
	RoleBTC            UserRole = "btc"
	RoleRefereeManager UserRole = "referee_manager"
	RoleReferee        UserRole = "referee"
	RoleDelegate       UserRole = "delegate"
)

const (
	tokenUseAccess  = "access"
	tokenUseRefresh = "refresh"
)

var (
	ErrUnauthorized       = errors.New("unauthorized")
	ErrForbidden          = errors.New("forbidden")
	ErrBadRequest         = errors.New("bad_request")
	ErrInvalidCredentials = errors.New("invalid_credentials")
)

type AuthUser struct {
	ID          string   `json:"id"`
	Username    string   `json:"username"`
	DisplayName string   `json:"displayName"`
	Role        UserRole `json:"role"`
}

type LoginRequest struct {
	Username       string   `json:"username"`
	Password       string   `json:"password"`
	Role           UserRole `json:"role"`
	TournamentCode string   `json:"tournamentCode"`
	OperationShift string   `json:"operationShift"`
}

type RefreshRequest struct {
	RefreshToken string `json:"refreshToken"`
}

type RevokeRequest struct {
	RefreshToken string `json:"refreshToken"`
	AccessToken  string `json:"accessToken"`
	RevokeAll    bool   `json:"revokeAll"`
	Reason       string `json:"reason"`
}

type RequestContext struct {
	IP        string
	UserAgent string
}

type TokenResponse struct {
	Token            string    `json:"token"`
	AccessToken      string    `json:"accessToken"`
	RefreshToken     string    `json:"refreshToken"`
	TokenType        string    `json:"tokenType"`
	ExpiresAt        time.Time `json:"expiresAt"`
	RefreshExpiresAt time.Time `json:"refreshExpiresAt"`
}

type LoginResult struct {
	TokenResponse
	User           AuthUser `json:"user"`
	TournamentCode string   `json:"tournamentCode"`
	OperationShift string   `json:"operationShift"`
}

type Principal struct {
	User           AuthUser
	SessionID      string
	TokenID        string
	TokenExpiresAt time.Time
	TournamentCode string
	OperationShift string
}

type AuditEntry struct {
	ID        string         `json:"id"`
	Time      time.Time      `json:"time"`
	UserID    string         `json:"userId"`
	Username  string         `json:"username"`
	Role      UserRole       `json:"role"`
	Action    string         `json:"action"`
	Success   bool           `json:"success"`
	IP        string         `json:"ip"`
	UserAgent string         `json:"userAgent"`
	Details   map[string]any `json:"details,omitempty"`
}

type ServiceConfig struct {
	Secret          string
	Issuer          string
	AccessTTL       time.Duration
	RefreshTTL      time.Duration
	AuditLimit      int
	CleanupInterval time.Duration
}

type userCredential struct {
	password    string
	displayName string
	allowedRole []UserRole
}

type refreshSession struct {
	ID                string
	User              AuthUser
	TournamentCode    string
	OperationShift    string
	CurrentRefreshJTI string
	CreatedAt         time.Time
	ExpiresAt         time.Time
	RevokedAt         *time.Time
	RevokeReason      string
	LastSeenAt        time.Time
	LastSeenIP        string
	LastSeenUA        string
}

type tokenClaims struct {
	UserID         string   `json:"uid"`
	Username       string   `json:"username"`
	DisplayName    string   `json:"displayName"`
	Role           UserRole `json:"role"`
	TokenUse       string   `json:"tokenUse"`
	SessionID      string   `json:"sessionId"`
	TournamentCode string   `json:"tournamentCode"`
	OperationShift string   `json:"operationShift"`
	jwt.RegisteredClaims
}

type Service struct {
	mu                sync.RWMutex
	secret            []byte
	issuer            string
	accessTTL         time.Duration
	refreshTTL        time.Duration
	auditLimit        int
	cleanupInterval   time.Duration
	lastCleanup       time.Time
	credentials       map[string]userCredential
	refreshSessions   map[string]*refreshSession
	revokedAccessJTIs map[string]time.Time
	audit             []AuditEntry
}

func NewService(config ServiceConfig) *Service {
	auditLimit := config.AuditLimit
	if auditLimit <= 0 {
		auditLimit = 5000
	}
	cleanupInterval := config.CleanupInterval
	if cleanupInterval <= 0 {
		cleanupInterval = 5 * time.Minute
	}

	return &Service{
		secret:          []byte(strings.TrimSpace(config.Secret)),
		issuer:          strings.TrimSpace(config.Issuer),
		accessTTL:       config.AccessTTL,
		refreshTTL:      config.RefreshTTL,
		auditLimit:      auditLimit,
		cleanupInterval: cleanupInterval,
		credentials: map[string]userCredential{
			"admin": {
				password:    "Admin@123",
				displayName: "Quản trị hệ thống",
				allowedRole: []UserRole{RoleAdmin},
			},
			"btc": {
				password:    "Btc@123",
				displayName: "Ban tổ chức",
				allowedRole: []UserRole{RoleBTC},
			},
			"ref-manager": {
				password:    "Ref@123",
				displayName: "Điều phối trọng tài",
				allowedRole: []UserRole{RoleRefereeManager},
			},
			"referee": {
				password:    "Judge@123",
				displayName: "Trọng tài",
				allowedRole: []UserRole{RoleReferee},
			},
			"delegate": {
				password:    "Delegate@123",
				displayName: "Cán bộ đoàn",
				allowedRole: []UserRole{RoleDelegate},
			},
		},
		refreshSessions:   make(map[string]*refreshSession),
		revokedAccessJTIs: make(map[string]time.Time),
		audit:             make([]AuditEntry, 0, auditLimit),
	}
}

func (s *Service) Login(input LoginRequest, requestCtx RequestContext) (LoginResult, error) {
	username := strings.TrimSpace(strings.ToLower(input.Username))
	password := strings.TrimSpace(input.Password)
	role := input.Role
	if username == "" || password == "" {
		return LoginResult{}, wrapError(ErrBadRequest, "username và password là bắt buộc")
	}
	if role == "" {
		return LoginResult{}, wrapError(ErrBadRequest, "role là bắt buộc")
	}

	now := time.Now().UTC()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked(now)

	cred, ok := s.credentials[username]
	passwordMatch := ok && subtle.ConstantTimeCompare([]byte(cred.password), []byte(password)) == 1
	if !passwordMatch {
		s.addAuditLocked("auth.login", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "invalid_credentials"})
		return LoginResult{}, wrapError(ErrInvalidCredentials, "sai thông tin đăng nhập")
	}
	if !containsRole(cred.allowedRole, role) {
		s.addAuditLocked("auth.login", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "invalid_role"})
		return LoginResult{}, wrapError(ErrForbidden, "role không hợp lệ với tài khoản")
	}

	user := AuthUser{
		ID:          "u-" + strings.ReplaceAll(username, " ", "-"),
		Username:    username,
		DisplayName: cred.displayName,
		Role:        role,
	}

	tournamentCode := normalizeTournamentCode(input.TournamentCode)
	operationShift := normalizeOperationShift(input.OperationShift)

	sessionID := randomID(16)
	refreshJTI := randomID(20)
	response, err := s.issueTokenPairLocked(user, tournamentCode, operationShift, sessionID, refreshJTI, now)
	if err != nil {
		return LoginResult{}, err
	}

	s.refreshSessions[sessionID] = &refreshSession{
		ID:                sessionID,
		User:              user,
		TournamentCode:    tournamentCode,
		OperationShift:    operationShift,
		CurrentRefreshJTI: refreshJTI,
		CreatedAt:         now,
		ExpiresAt:         response.RefreshExpiresAt,
		LastSeenAt:        now,
		LastSeenIP:        requestCtx.IP,
		LastSeenUA:        requestCtx.UserAgent,
	}

	s.addAuditLocked("auth.login", true, requestCtx, user, map[string]any{
		"sessionId":      sessionID,
		"tournamentCode": tournamentCode,
		"operationShift": operationShift,
	})

	return LoginResult{
		TokenResponse:  response,
		User:           user,
		TournamentCode: tournamentCode,
		OperationShift: operationShift,
	}, nil
}

func (s *Service) AuthenticateAccessToken(token string, requestCtx RequestContext) (Principal, error) {
	claims, err := s.parseToken(token, tokenUseAccess)
	if err != nil {
		return Principal{}, err
	}

	now := time.Now().UTC()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked(now)

	if revokedUntil, revoked := s.revokedAccessJTIs[claims.ID]; revoked && revokedUntil.After(now) {
		return Principal{}, wrapError(ErrUnauthorized, "token truy cập đã bị thu hồi")
	}

	session, ok := s.refreshSessions[claims.SessionID]
	if !ok || session.RevokedAt != nil || session.ExpiresAt.Before(now) {
		return Principal{}, wrapError(ErrUnauthorized, "phiên truy cập không hợp lệ")
	}

	session.LastSeenAt = now
	session.LastSeenIP = requestCtx.IP
	session.LastSeenUA = requestCtx.UserAgent

	principal := Principal{
		User: AuthUser{
			ID:          claims.UserID,
			Username:    claims.Username,
			DisplayName: claims.DisplayName,
			Role:        claims.Role,
		},
		SessionID:      claims.SessionID,
		TokenID:        claims.ID,
		TokenExpiresAt: claims.ExpiresAt.Time,
		TournamentCode: claims.TournamentCode,
		OperationShift: claims.OperationShift,
	}
	return principal, nil
}

func (s *Service) Refresh(input RefreshRequest, requestCtx RequestContext) (LoginResult, error) {
	refreshToken := strings.TrimSpace(input.RefreshToken)
	if refreshToken == "" {
		return LoginResult{}, wrapError(ErrBadRequest, "refreshToken là bắt buộc")
	}

	claims, err := s.parseToken(refreshToken, tokenUseRefresh)
	if err != nil {
		return LoginResult{}, err
	}

	now := time.Now().UTC()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked(now)

	session, ok := s.refreshSessions[claims.SessionID]
	if !ok {
		return LoginResult{}, wrapError(ErrUnauthorized, "phiên refresh không tồn tại")
	}

	if session.RevokedAt != nil {
		return LoginResult{}, wrapError(ErrUnauthorized, "phiên refresh đã bị thu hồi")
	}
	if session.ExpiresAt.Before(now) {
		s.revokeSessionLocked(session, "refresh_expired", now)
		return LoginResult{}, wrapError(ErrUnauthorized, "refresh token đã hết hạn")
	}

	if session.CurrentRefreshJTI != claims.ID {
		s.revokeSessionLocked(session, "refresh_reuse_detected", now)
		s.addAuditLocked("auth.refresh", false, requestCtx, session.User, map[string]any{
			"sessionId": session.ID,
			"reason":    "token_reuse_detected",
		})
		return LoginResult{}, wrapError(ErrUnauthorized, "refresh token không còn hợp lệ")
	}

	nextRefreshJTI := randomID(20)
	response, issueErr := s.issueTokenPairLocked(
		session.User,
		session.TournamentCode,
		session.OperationShift,
		session.ID,
		nextRefreshJTI,
		now,
	)
	if issueErr != nil {
		return LoginResult{}, issueErr
	}

	session.CurrentRefreshJTI = nextRefreshJTI
	session.LastSeenAt = now
	session.LastSeenIP = requestCtx.IP
	session.LastSeenUA = requestCtx.UserAgent
	session.ExpiresAt = response.RefreshExpiresAt

	s.addAuditLocked("auth.refresh", true, requestCtx, session.User, map[string]any{
		"sessionId": session.ID,
	})

	return LoginResult{
		TokenResponse:  response,
		User:           session.User,
		TournamentCode: session.TournamentCode,
		OperationShift: session.OperationShift,
	}, nil
}

func (s *Service) Logout(principal Principal, requestCtx RequestContext) {
	now := time.Now().UTC()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked(now)

	s.revokeAccessTokenLocked(principal.TokenID, principal.TokenExpiresAt)
	if session, ok := s.refreshSessions[principal.SessionID]; ok {
		s.revokeSessionLocked(session, "logout", now)
	}
	s.addAuditLocked("auth.logout", true, requestCtx, principal.User, map[string]any{
		"sessionId": principal.SessionID,
	})
}

func (s *Service) Revoke(principal Principal, input RevokeRequest, requestCtx RequestContext) (int, error) {
	now := time.Now().UTC()
	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked(now)

	reason := strings.TrimSpace(input.Reason)
	if reason == "" {
		reason = "manual_revoke"
	}

	revokedCount := 0
	if input.RevokeAll {
		for _, session := range s.refreshSessions {
			if session.User.ID != principal.User.ID {
				continue
			}
			if session.RevokedAt == nil {
				s.revokeSessionLocked(session, reason, now)
				revokedCount++
			}
		}
		s.addAuditLocked("auth.revoke_all", true, requestCtx, principal.User, map[string]any{"revokedCount": revokedCount})
		return revokedCount, nil
	}

	if token := strings.TrimSpace(input.AccessToken); token != "" {
		claims, err := s.parseToken(token, tokenUseAccess)
		if err == nil && claims.UserID == principal.User.ID {
			s.revokeAccessTokenLocked(claims.ID, claims.ExpiresAt.Time)
			revokedCount++
		}
	}

	if refreshToken := strings.TrimSpace(input.RefreshToken); refreshToken != "" {
		claims, err := s.parseToken(refreshToken, tokenUseRefresh)
		if err == nil {
			if session, ok := s.refreshSessions[claims.SessionID]; ok && session.User.ID == principal.User.ID {
				if session.RevokedAt == nil {
					s.revokeSessionLocked(session, reason, now)
					revokedCount++
				}
			}
		}
	}

	if revokedCount == 0 {
		if session, ok := s.refreshSessions[principal.SessionID]; ok {
			if session.RevokedAt == nil {
				s.revokeSessionLocked(session, reason, now)
				revokedCount++
			}
		}
		s.revokeAccessTokenLocked(principal.TokenID, principal.TokenExpiresAt)
		revokedCount++
	}

	s.addAuditLocked("auth.revoke", true, requestCtx, principal.User, map[string]any{"revokedCount": revokedCount})
	return revokedCount, nil
}

func (s *Service) Me(principal Principal) LoginResult {
	now := time.Now().UTC()
	result := LoginResult{
		TokenResponse: TokenResponse{
			TokenType: "Bearer",
			ExpiresAt: principal.TokenExpiresAt,
		},
		User:           principal.User,
		TournamentCode: principal.TournamentCode,
		OperationShift: principal.OperationShift,
	}

	s.mu.RLock()
	session, ok := s.refreshSessions[principal.SessionID]
	s.mu.RUnlock()
	if ok {
		result.TokenResponse.RefreshExpiresAt = session.ExpiresAt
		if session.ExpiresAt.Before(now) {
			result.TokenResponse.RefreshExpiresAt = now
		}
	}
	return result
}

func (s *Service) GetAuditLogs(limit int, actor string, action string) []AuditEntry {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if limit <= 0 || limit > s.auditLimit {
		limit = 100
	}
	actor = strings.TrimSpace(strings.ToLower(actor))
	action = strings.TrimSpace(strings.ToLower(action))

	result := make([]AuditEntry, 0, limit)
	for i := len(s.audit) - 1; i >= 0 && len(result) < limit; i-- {
		entry := s.audit[i]
		if actor != "" {
			if strings.ToLower(entry.UserID) != actor && strings.ToLower(entry.Username) != actor {
				continue
			}
		}
		if action != "" && strings.ToLower(entry.Action) != action {
			continue
		}
		result = append(result, entry)
	}
	return result
}

func (s *Service) issueTokenPairLocked(
	user AuthUser,
	tournamentCode string,
	operationShift string,
	sessionID string,
	refreshJTI string,
	now time.Time,
) (TokenResponse, error) {
	if len(s.secret) == 0 {
		return TokenResponse{}, wrapError(ErrBadRequest, "JWT secret không hợp lệ")
	}

	accessJTI := randomID(20)
	accessExpiresAt := now.Add(s.accessTTL)
	refreshExpiresAt := now.Add(s.refreshTTL)

	accessClaims := tokenClaims{
		UserID:         user.ID,
		Username:       user.Username,
		DisplayName:    user.DisplayName,
		Role:           user.Role,
		TokenUse:       tokenUseAccess,
		SessionID:      sessionID,
		TournamentCode: tournamentCode,
		OperationShift: operationShift,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   user.ID,
			ID:        accessJTI,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(accessExpiresAt),
		},
	}
	refreshClaims := tokenClaims{
		UserID:         user.ID,
		Username:       user.Username,
		DisplayName:    user.DisplayName,
		Role:           user.Role,
		TokenUse:       tokenUseRefresh,
		SessionID:      sessionID,
		TournamentCode: tournamentCode,
		OperationShift: operationShift,
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer:    s.issuer,
			Subject:   user.ID,
			ID:        refreshJTI,
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(refreshExpiresAt),
		},
	}

	accessToken, err := s.signToken(accessClaims)
	if err != nil {
		return TokenResponse{}, err
	}
	refreshToken, err := s.signToken(refreshClaims)
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		Token:            accessToken,
		AccessToken:      accessToken,
		RefreshToken:     refreshToken,
		TokenType:        "Bearer",
		ExpiresAt:        accessExpiresAt,
		RefreshExpiresAt: refreshExpiresAt,
	}, nil
}

func (s *Service) signToken(claims tokenClaims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString(s.secret)
	if err != nil {
		return "", wrapError(ErrBadRequest, fmt.Sprintf("không thể ký token: %v", err))
	}
	return signed, nil
}

func (s *Service) parseToken(rawToken string, expectedUse string) (tokenClaims, error) {
	tokenText := strings.TrimSpace(rawToken)
	if tokenText == "" {
		return tokenClaims{}, wrapError(ErrUnauthorized, "token trống")
	}

	parsed, err := jwt.ParseWithClaims(tokenText, &tokenClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method == nil || token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, wrapError(ErrUnauthorized, "phương thức ký token không hợp lệ")
		}
		return s.secret, nil
	}, jwt.WithIssuer(s.issuer), jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}))
	if err != nil {
		return tokenClaims{}, wrapError(ErrUnauthorized, "token không hợp lệ hoặc đã hết hạn")
	}

	claims, ok := parsed.Claims.(*tokenClaims)
	if !ok || !parsed.Valid {
		return tokenClaims{}, wrapError(ErrUnauthorized, "token claims không hợp lệ")
	}
	if claims.TokenUse != expectedUse {
		return tokenClaims{}, wrapError(ErrUnauthorized, "token không đúng loại")
	}
	return *claims, nil
}

func (s *Service) revokeSessionLocked(session *refreshSession, reason string, now time.Time) {
	if session.RevokedAt != nil {
		return
	}
	session.RevokedAt = &now
	session.RevokeReason = reason
}

func (s *Service) revokeAccessTokenLocked(jti string, expiresAt time.Time) {
	if strings.TrimSpace(jti) == "" {
		return
	}
	s.revokedAccessJTIs[jti] = expiresAt
}

func (s *Service) cleanupLocked(now time.Time) {
	if !s.lastCleanup.IsZero() && now.Sub(s.lastCleanup) < s.cleanupInterval {
		return
	}
	s.lastCleanup = now

	for sessionID, session := range s.refreshSessions {
		if session.ExpiresAt.Before(now.Add(-1 * time.Hour)) {
			delete(s.refreshSessions, sessionID)
		}
	}
	for jti, expire := range s.revokedAccessJTIs {
		if expire.Before(now) {
			delete(s.revokedAccessJTIs, jti)
		}
	}
}

func (s *Service) addAuditLocked(action string, success bool, requestCtx RequestContext, user AuthUser, details map[string]any) {
	entry := AuditEntry{
		ID:        randomID(12),
		Time:      time.Now().UTC(),
		UserID:    user.ID,
		Username:  user.Username,
		Role:      user.Role,
		Action:    action,
		Success:   success,
		IP:        requestCtx.IP,
		UserAgent: requestCtx.UserAgent,
		Details:   details,
	}
	s.audit = append(s.audit, entry)
	if len(s.audit) > s.auditLimit {
		extra := len(s.audit) - s.auditLimit
		s.audit = append([]AuditEntry(nil), s.audit[extra:]...)
	}
}

func containsRole(roles []UserRole, target UserRole) bool {
	for _, role := range roles {
		if role == target {
			return true
		}
	}
	return false
}

func normalizeTournamentCode(code string) string {
	trimmed := strings.TrimSpace(strings.ToUpper(code))
	if trimmed == "" {
		return "VCT-2026"
	}
	return trimmed
}

func normalizeOperationShift(shift string) string {
	trimmed := strings.TrimSpace(strings.ToLower(shift))
	switch trimmed {
	case "sang", "chieu", "toi":
		return trimmed
	default:
		return "sang"
	}
}

func randomID(size int) string {
	buf := make([]byte, size)
	if _, err := rand.Read(buf); err != nil {
		fallback := []byte(time.Now().UTC().Format(time.RFC3339Nano))
		return hex.EncodeToString(fallback)
	}
	return hex.EncodeToString(buf)
}

func wrapError(base error, message string) error {
	return fmt.Errorf("%w: %s", base, message)
}
