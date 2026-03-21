package auth

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"

	"vct-platform/backend/internal/util"
)

type UserRole string

const (
	RoleOwner               UserRole = "owner"
	RoleAdmin               UserRole = "admin"
	RoleFederationPresident UserRole = "federation_president"
	RoleFederationSecretary UserRole = "federation_secretary"
	RoleProvincialAdmin     UserRole = "provincial_admin"
	RoleTechnicalDirector   UserRole = "technical_director"
	RoleBTC                 UserRole = "btc"
	RoleRefereeManager      UserRole = "referee_manager"
	RoleReferee             UserRole = "referee"
	RoleCoach               UserRole = "coach"
	RoleDelegate            UserRole = "delegate"
	RoleAthlete             UserRole = "athlete"
	RoleMedicalStaff        UserRole = "medical_staff"

	// Provincial-level roles
	RoleProvincialPresident       UserRole = "provincial_president"
	RoleProvincialVicePresident   UserRole = "provincial_vice_president"
	RoleProvincialSecretary       UserRole = "provincial_secretary"
	RoleProvincialTechnicalHead   UserRole = "provincial_technical_head"
	RoleProvincialRefereeHead     UserRole = "provincial_referee_head"
	RoleProvincialCommitteeMember UserRole = "provincial_committee_member"
	RoleProvincialAccountant      UserRole = "provincial_accountant"

	// Club-level roles
	RoleClubLeader     UserRole = "club_leader"
	RoleClubViceLeader UserRole = "club_vice_leader"
	RoleClubSecretary  UserRole = "club_secretary"
	RoleClubAccountant UserRole = "club_accountant"

	// Parent / Guardian role
	RoleParent UserRole = "parent"
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
	ErrConflict           = errors.New("conflict")
)

// Error codes for structured API responses.
const (
	CodeInvalidCredentials = "ERR_INVALID_CREDENTIALS"
	CodeBadRequest         = "ERR_BAD_REQUEST"
	CodeForbidden          = "ERR_FORBIDDEN"
	CodeUnauthorized       = "ERR_UNAUTHORIZED"
	CodeConflict           = "ERR_CONFLICT"
	CodeTokenExpired       = "ERR_TOKEN_EXPIRED"
	CodeTokenRevoked       = "ERR_TOKEN_REVOKED"
	CodeSessionInvalid     = "ERR_SESSION_INVALID"
	CodeRefreshReuse       = "ERR_REFRESH_REUSE"
)

type AuthUser struct {
	ID          string   `json:"id"`
	Username    string   `json:"username"`
	DisplayName string   `json:"displayName"`
	Role        UserRole `json:"role"`
	Email       string   `json:"email,omitempty"`
	AvatarURL   string   `json:"avatarUrl,omitempty"`
	TenantID    string   `json:"tenantId,omitempty"`
	Locale      string   `json:"locale,omitempty"`
	Timezone    string   `json:"timezone,omitempty"`
}

// RoleAssignment represents a scoped role assignment for UUID RBAC.
type RoleAssignment struct {
	RoleID    string `json:"roleId"`
	RoleName  string `json:"roleName"`
	RoleCode  string `json:"roleCode"`
	ScopeType string `json:"scopeType"`
	ScopeID   string `json:"scopeId,omitempty"`
	ScopeName string `json:"scopeName,omitempty"`
	GrantedAt string `json:"grantedAt"`
}

// WorkspaceAccess represents a workspace this user UUID can access.
type WorkspaceAccess struct {
	Type      string `json:"type"`
	ScopeID   string `json:"scopeId"`
	ScopeName string `json:"scopeName"`
	Role      string `json:"role"`
}

type LoginRequest struct {
	Username       string   `json:"username"`
	Password       string   `json:"password"`
	Role           UserRole `json:"role"`
	TournamentCode string   `json:"tournamentCode"`
	OperationShift string   `json:"operationShift"`
}

// RegisterRequest represents a self-registration request.
type RegisterRequest struct {
	Username    string   `json:"username"`
	Password    string   `json:"password"`
	DisplayName string   `json:"displayName"`
	Role        UserRole `json:"role"`
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
	User           AuthUser          `json:"user"`
	Roles          []RoleAssignment  `json:"roles"`
	Permissions    []string          `json:"permissions"`
	Workspaces     []WorkspaceAccess `json:"workspaces"`
	TournamentCode string            `json:"tournamentCode"`
	OperationShift string            `json:"operationShift"`
}

type Principal struct {
	User           AuthUser
	SessionID      string
	TokenID        string
	TokenExpiresAt time.Time
	TournamentCode string
	OperationShift string
	Roles          []RoleAssignment
	Permissions    []string
	Workspaces     []WorkspaceAccess
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
	AllowDemoUsers  bool
	CredentialsJSON string
	DB              *sql.DB // optional — enables persistent user storage in core.users
}

type userCredential struct {
	passwordHash string
	displayName  string
	allowedRole  []UserRole
	userID       string
}

type credentialSeed struct {
	Username    string     `json:"username"`
	Password    string     `json:"password"`
	DisplayName string     `json:"displayName"`
	Roles       []UserRole `json:"roles"`
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
	stopCh            chan struct{}
	allowSelfRegister bool
	roleBindings      *RoleBindingStore // Multi-role context support
	otpStore          *OTPStore         // Pending OTP verifications
	userStore         UserStore         // persistent user storage (nil = in-memory only)
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

	credentials, err := resolveCredentials(config.CredentialsJSON, config.AllowDemoUsers)
	if err != nil {
		panic(fmt.Sprintf("auth credential configuration invalid: %v", err))
	}

	svc := &Service{
		secret:            []byte(strings.TrimSpace(config.Secret)),
		issuer:            strings.TrimSpace(config.Issuer),
		accessTTL:         config.AccessTTL,
		refreshTTL:        config.RefreshTTL,
		auditLimit:        auditLimit,
		cleanupInterval:   cleanupInterval,
		credentials:       credentials,
		refreshSessions:   make(map[string]*refreshSession),
		revokedAccessJTIs: make(map[string]time.Time),
		audit:             make([]AuditEntry, 0, auditLimit),
		stopCh:            make(chan struct{}),
		roleBindings:      NewRoleBindingStore(),
		otpStore:          NewOTPStore(),
	}

	// Wire PostgreSQL user store if DB connection is provided
	if config.DB != nil {
		svc.userStore = NewPgUserStore(config.DB)
		slog.Info("PostgreSQL user store enabled", slog.String("table", "core.users"))
		// Sync bootstrap/demo credentials to database
		svc.syncCredentialsToDB(credentials)
	}

	// Background cleanup goroutine
	go func() {
		ticker := time.NewTicker(cleanupInterval)
		defer ticker.Stop()
		for {
			select {
			case <-svc.stopCh:
				return
			case now := <-ticker.C:
				svc.mu.Lock()
				svc.cleanupLocked(now.UTC())
				svc.mu.Unlock()
			}
		}
	}()

	return svc
}

// Stop terminates the background cleanup goroutine.
func (s *Service) Stop() {
	select {
	case <-s.stopCh:
		// already closed
	default:
		close(s.stopCh)
	}
}

func resolveCredentials(raw string, allowDemo bool) (map[string]userCredential, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		if allowDemo {
			return demoCredentials(), nil
		}
		return map[string]userCredential{}, nil
	}

	var seeds []credentialSeed
	if err := json.Unmarshal([]byte(trimmed), &seeds); err != nil {
		return nil, fmt.Errorf("parse VCT_BOOTSTRAP_USERS_JSON failed: %w", err)
	}
	if len(seeds) == 0 {
		return nil, fmt.Errorf("VCT_BOOTSTRAP_USERS_JSON must contain at least one credential")
	}

	allowedRoles := map[UserRole]struct{}{
		RoleAdmin:               {},
		RoleFederationPresident: {},
		RoleFederationSecretary: {},
		RoleProvincialAdmin:     {},
		RoleTechnicalDirector:   {},
		RoleBTC:                 {},
		RoleRefereeManager:      {},
		RoleReferee:             {},
		RoleCoach:               {},
		RoleDelegate:            {},
		RoleAthlete:             {},
		RoleMedicalStaff:        {},
		// Provincial-level roles
		RoleProvincialPresident:       {},
		RoleProvincialVicePresident:   {},
		RoleProvincialSecretary:       {},
		RoleProvincialTechnicalHead:   {},
		RoleProvincialRefereeHead:     {},
		RoleProvincialCommitteeMember: {},
		RoleProvincialAccountant:      {},
		// Club-level roles
		RoleClubLeader:     {},
		RoleClubViceLeader: {},
		RoleClubSecretary:  {},
		RoleClubAccountant: {},
		// Parent / Guardian
		RoleParent: {},
	}

	credentials := make(map[string]userCredential, len(seeds))
	for _, seed := range seeds {
		username := strings.TrimSpace(strings.ToLower(seed.Username))
		password := strings.TrimSpace(seed.Password)
		displayName := strings.TrimSpace(seed.DisplayName)
		if username == "" || password == "" || displayName == "" {
			return nil, fmt.Errorf("credential must include username/password/displayName")
		}
		if len(seed.Roles) == 0 {
			return nil, fmt.Errorf("credential %q must include at least one role", username)
		}

		roles := make([]UserRole, 0, len(seed.Roles))
		seenRoles := map[UserRole]struct{}{}
		for _, role := range seed.Roles {
			if _, ok := allowedRoles[role]; !ok {
				return nil, fmt.Errorf("credential %q has unsupported role %q", username, role)
			}
			if _, exists := seenRoles[role]; exists {
				continue
			}
			seenRoles[role] = struct{}{}
			roles = append(roles, role)
		}

		// Hash password with bcrypt
		hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			return nil, fmt.Errorf("failed to hash password for %q: %w", username, err)
		}

		credentials[username] = userCredential{
			passwordHash: string(hash),
			displayName:  displayName,
			allowedRole:  roles,
			userID:       util.NewUUIDv7(),
		}
	}

	return credentials, nil
}

// ── Demo User ID Constants ────────────────────────────────────
// These are fixed IDs used for demo users so that seed data in
// in-memory stores can reference them consistently.
const (
	OwnerUserID       = "owner-hbtung-00000001"
	DemoAthleteUserID = "demo-athlete-00000001"
	DemoParentUserID  = "demo-parent-000000001"
)

func demoCredentials() map[string]userCredential {
	// Pre-hash demo passwords with bcrypt at startup.
	hashOrPanic := func(pw string) string {
		h, err := bcrypt.GenerateFromPassword([]byte(pw), bcrypt.DefaultCost)
		if err != nil {
			panic(fmt.Sprintf("demo credential hash failed: %v", err))
		}
		return string(h)
	}

	return map[string]userCredential{
		// ── Platform Owner ──
		"hbtung": {
			passwordHash: hashOrPanic("BaTung@1511"),
			displayName:  "Hoàng Bá Tùng",
			allowedRole:  []UserRole{RoleOwner},
			userID:       OwnerUserID,
		},
		"admin": {
			passwordHash: hashOrPanic("Admin@123"),
			displayName:  "Quản trị hệ thống",
			allowedRole:  []UserRole{RoleAdmin},
			userID:       util.NewUUIDv7(),
		},
		"federation": {
			passwordHash: hashOrPanic("Fed@123"),
			displayName:  "Chủ tịch Liên đoàn",
			allowedRole:  []UserRole{RoleFederationPresident},
			userID:       util.NewUUIDv7(),
		},
		"btc": {
			passwordHash: hashOrPanic("Btc@123"),
			displayName:  "Ban tổ chức",
			allowedRole:  []UserRole{RoleBTC},
			userID:       util.NewUUIDv7(),
		},
		"ref-manager": {
			passwordHash: hashOrPanic("Ref@123"),
			displayName:  "Điều phối trọng tài",
			allowedRole:  []UserRole{RoleRefereeManager},
			userID:       util.NewUUIDv7(),
		},
		"referee": {
			passwordHash: hashOrPanic("Judge@123"),
			displayName:  "Trọng tài",
			allowedRole:  []UserRole{RoleReferee},
			userID:       util.NewUUIDv7(),
		},
		"delegate": {
			passwordHash: hashOrPanic("Delegate@123"),
			displayName:  "Cán bộ đoàn",
			allowedRole:  []UserRole{RoleDelegate},
			userID:       util.NewUUIDv7(),
		},
		"club-leader": {
			passwordHash: hashOrPanic("Club@123"),
			displayName:  "Chủ nhiệm CLB Thanh Long",
			allowedRole:  []UserRole{RoleClubLeader},
			userID:       util.NewUUIDv7(),
		},
		"parent": {
			passwordHash: hashOrPanic("Parent@123"),
			displayName:  "Nguyễn Thị Phụ Huynh",
			allowedRole:  []UserRole{RoleParent},
			userID:       DemoParentUserID,
		},
		"coach": {
			passwordHash: hashOrPanic("Coach@123"),
			displayName:  "Huấn luyện viên",
			allowedRole:  []UserRole{RoleCoach},
			userID:       util.NewUUIDv7(),
		},
		"athlete": {
			passwordHash: hashOrPanic("Athlete@123"),
			displayName:  "Nguyễn Hoàng Nam",
			allowedRole:  []UserRole{RoleAthlete},
			userID:       DemoAthleteUserID,
		},
		"provincial": {
			passwordHash: hashOrPanic("Prov@123"),
			displayName:  "Quản trị tỉnh/thành",
			allowedRole:  []UserRole{RoleProvincialAdmin},
			userID:       util.NewUUIDv7(),
		},
		"medical": {
			passwordHash: hashOrPanic("Medical@123"),
			displayName:  "Bác sĩ y tế",
			allowedRole:  []UserRole{RoleMedicalStaff},
			userID:       util.NewUUIDv7(),
		},
		"tech-director": {
			passwordHash: hashOrPanic("Tech@123"),
			displayName:  "Giám đốc kỹ thuật",
			allowedRole:  []UserRole{RoleTechnicalDirector},
			userID:       util.NewUUIDv7(),
		},
	}
}

func (s *Service) Login(input LoginRequest, requestCtx RequestContext) (LoginResult, error) {
	username := strings.TrimSpace(strings.ToLower(input.Username))
	password := strings.TrimSpace(input.Password)
	role := input.Role
	if username == "" || password == "" {
		return LoginResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "username và password là bắt buộc")
	}

	now := time.Now().UTC()

	// ── Try database lookup first ───────────────────────────────
	var cred userCredential
	var found bool

	if s.userStore != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		stored, err := s.userStore.FindByUsername(ctx, username)
		if err != nil {
			slog.Warn("DB lookup error, falling back to in-memory", slog.String("user", username), slog.String("error", err.Error()))
		}
		if stored != nil && stored.IsActive {
			cred = userCredential{
				passwordHash: stored.PasswordHash,
				displayName:  stored.FullName,
				allowedRole:  stored.Roles,
				userID:       stored.ID,
			}
			found = true
		}
	}

	// ── Fallback to in-memory credentials ────────────────────────
	if !found {
		s.mu.RLock()
		var memCred userCredential
		memCred, found = s.credentials[username]
		s.mu.RUnlock()
		if found {
			cred = memCred
		}
	}

	if !found {
		s.mu.Lock()
		s.addAuditLocked("auth.login", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "invalid_credentials"})
		s.mu.Unlock()
		return LoginResult{}, wrapCodedError(ErrInvalidCredentials, CodeInvalidCredentials, "sai thông tin đăng nhập")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(cred.passwordHash), []byte(password)); err != nil {
		s.mu.Lock()
		s.addAuditLocked("auth.login", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "invalid_credentials"})
		s.mu.Unlock()
		return LoginResult{}, wrapCodedError(ErrInvalidCredentials, CodeInvalidCredentials, "sai thông tin đăng nhập")
	}

	// Auto-select role if not provided: use the user's first allowed role.
	if role == "" {
		if len(cred.allowedRole) > 0 {
			role = cred.allowedRole[0]
		} else {
			return LoginResult{}, wrapCodedError(ErrForbidden, CodeForbidden, "tài khoản không có role nào được phép")
		}
	} else if !containsRole(cred.allowedRole, role) {
		s.mu.Lock()
		s.addAuditLocked("auth.login", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "invalid_role"})
		s.mu.Unlock()
		return LoginResult{}, wrapCodedError(ErrForbidden, CodeForbidden, "role không hợp lệ với tài khoản")
	}

	user := AuthUser{
		ID:          cred.userID,
		Username:    username,
		DisplayName: cred.displayName,
		Role:        role,
	}

	tournamentCode := normalizeTournamentCode(input.TournamentCode)
	operationShift := normalizeOperationShift(input.OperationShift)

	s.mu.Lock()
	defer s.mu.Unlock()
	s.cleanupLocked(now)

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

	// Ensure multi-role store has at least the primary binding
	if s.roleBindings != nil {
		s.roleBindings.EnsureDefaultBinding(user)
	}

	roles, perms, ws := s.resolveRBACSnapshot(user)

	// Update last_login_at in database (async, non-blocking)
	if s.userStore != nil {
		go func() {
			ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
			defer cancel()
			_ = s.userStore.UpdateLastLogin(ctx, user.ID)
		}()
	}

	return LoginResult{
		TokenResponse:  response,
		User:           user,
		Roles:          roles,
		Permissions:    perms,
		Workspaces:     ws,
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
	principal.Roles, principal.Permissions, principal.Workspaces = s.resolveRBACSnapshot(principal.User)
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

	roles, perms, ws := s.resolveRBACSnapshot(session.User)

	return LoginResult{
		TokenResponse:  response,
		User:           session.User,
		Roles:          roles,
		Permissions:    perms,
		Workspaces:     ws,
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

	roles, perms, ws := s.resolveRBACSnapshot(principal.User)
	result.Roles = roles
	result.Permissions = perms
	result.Workspaces = ws

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

// wrapCodedError wraps an error with both a code and a human-readable message.
// Format: "base: [CODE] message" — the code can be extracted by helpers.
func wrapCodedError(base error, code string, message string) error {
	return fmt.Errorf("%w: [%s] %s", base, code, message)
}

// Register creates a new user credential with bcrypt-hashed password and UUID v7 ID.
// When a UserStore is configured, the user is persisted to the database.
func (s *Service) Register(input RegisterRequest, requestCtx RequestContext) (LoginResult, error) {
	username := strings.TrimSpace(strings.ToLower(input.Username))
	password := strings.TrimSpace(input.Password)
	displayName := strings.TrimSpace(input.DisplayName)
	role := input.Role

	if username == "" || password == "" || displayName == "" {
		return LoginResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "username, password, và displayName là bắt buộc")
	}
	if len(password) < 8 {
		return LoginResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "mật khẩu phải có ít nhất 8 ký tự")
	}
	if role == "" {
		role = RoleAthlete // default role for self-registration
	}

	// Only allow safe self-registration roles
	safeRoles := map[UserRole]struct{}{
		RoleAthlete: {}, RoleCoach: {}, RoleDelegate: {},
	}
	if _, ok := safeRoles[role]; !ok {
		return LoginResult{}, wrapCodedError(ErrForbidden, CodeForbidden, "role này không cho phép tự đăng ký")
	}

	// ── Check for duplicates in database first ──────────────────
	if s.userStore != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		existing, err := s.userStore.FindByUsername(ctx, username)
		if err != nil {
			slog.Warn("DB duplicate check error", slog.String("user", username), slog.String("error", err.Error()))
		}
		if existing != nil {
			s.mu.Lock()
			s.addAuditLocked("auth.register", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "duplicate_username"})
			s.mu.Unlock()
			return LoginResult{}, wrapCodedError(ErrConflict, CodeConflict, "tên đăng nhập đã tồn tại")
		}
	}

	now := time.Now().UTC()
	s.mu.Lock()
	defer s.mu.Unlock()

	// Also check in-memory
	if _, exists := s.credentials[username]; exists {
		s.addAuditLocked("auth.register", false, requestCtx, AuthUser{Username: username, Role: role}, map[string]any{"reason": "duplicate_username"})
		return LoginResult{}, wrapCodedError(ErrConflict, CodeConflict, "tên đăng nhập đã tồn tại")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return LoginResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "không thể mã hóa mật khẩu")
	}

	userID := util.NewUUIDv7()

	// ── Persist to database if available ─────────────────────────
	if s.userStore != nil {
		ctx2, cancel2 := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel2()

		email := ""
		// If username looks like an email (from OTP flow), use it as email too
		if strings.Contains(username, "@") {
			email = username
		}

		if dbErr := s.userStore.Create(ctx2, &StoredUser{
			ID:           userID,
			TenantID:     SystemTenantID,
			Username:     username,
			Email:        email,
			PasswordHash: string(hash),
			FullName:     displayName,
			Role:         role,
			Roles:        []UserRole{role},
			IsActive:     true,
			Locale:       "vi",
			Timezone:     "Asia/Ho_Chi_Minh",
		}); dbErr != nil {
			slog.Warn("DB persist failed, user saved in-memory only", slog.String("user", username), slog.String("error", dbErr.Error()))
		} else {
			slog.Info("user persisted to database", slog.String("user", username), slog.String("id", userID))
		}
	}

	// Always save to in-memory map as well (for session consistency)
	s.credentials[username] = userCredential{
		passwordHash: string(hash),
		displayName:  displayName,
		allowedRole:  []UserRole{role},
		userID:       userID,
	}

	user := AuthUser{
		ID:          userID,
		Username:    username,
		DisplayName: displayName,
		Role:        role,
	}

	sessionID := randomID(16)
	refreshJTI := randomID(20)
	response, issueErr := s.issueTokenPairLocked(user, "VCT-2026", "sang", sessionID, refreshJTI, now)
	if issueErr != nil {
		return LoginResult{}, issueErr
	}

	s.refreshSessions[sessionID] = &refreshSession{
		ID:                sessionID,
		User:              user,
		TournamentCode:    "VCT-2026",
		OperationShift:    "sang",
		CurrentRefreshJTI: refreshJTI,
		CreatedAt:         now,
		ExpiresAt:         response.RefreshExpiresAt,
		LastSeenAt:        now,
		LastSeenIP:        requestCtx.IP,
		LastSeenUA:        requestCtx.UserAgent,
	}

	s.addAuditLocked("auth.register", true, requestCtx, user, map[string]any{"sessionId": sessionID})

	roles, perms, ws := s.resolveRBACSnapshot(user)

	return LoginResult{
		TokenResponse:  response,
		User:           user,
		Roles:          roles,
		Permissions:    perms,
		Workspaces:     ws,
		TournamentCode: "VCT-2026",
		OperationShift: "sang",
	}, nil
}

// syncCredentialsToDB upserts bootstrap/demo credentials into core.users.
// Runs once at startup. Errors are logged but non-fatal.
func (s *Service) syncCredentialsToDB(credentials map[string]userCredential) {
	if s.userStore == nil {
		return
	}
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	synced := 0
	for username, cred := range credentials {
		// Check if already exists
		existing, err := s.userStore.FindByUsername(ctx, username)
		if err != nil {
			slog.Warn("sync check failed", slog.String("user", username), slog.String("error", err.Error()))
			continue
		}
		if existing != nil {
			continue // already in DB
		}

		email := ""
		if strings.Contains(username, "@") {
			email = username
		}

		if err := s.userStore.Create(ctx, &StoredUser{
			ID:           cred.userID,
			TenantID:     SystemTenantID,
			Username:     username,
			Email:        email,
			PasswordHash: cred.passwordHash,
			FullName:     cred.displayName,
			Role:         cred.allowedRole[0],
			Roles:        cred.allowedRole,
			IsActive:     true,
			Locale:       "vi",
			Timezone:     "Asia/Ho_Chi_Minh",
		}); err != nil {
			slog.Warn("sync failed", slog.String("user", username), slog.String("error", err.Error()))
		} else {
			synced++
		}
	}
	if synced > 0 {
		slog.Info("synced bootstrap users to database", slog.Int("count", synced))
	}
}

// ── UUID-Centric RBAC Resolver ──────────────────────────────────
// Resolves roles, permissions, and workspaces from the user's primary role.
// TODO: Replace with database queries to core.user_roles + core.role_permissions
// when the system is fully integrated with the PostgreSQL RBAC tables.

func (s *Service) resolveRBACSnapshot(user AuthUser) ([]RoleAssignment, []string, []WorkspaceAccess) {
	if s != nil && s.roleBindings != nil && strings.TrimSpace(user.ID) != "" {
		s.roleBindings.EnsureDefaultBinding(user)
		if bindings := s.roleBindings.GetBindings(user.ID); len(bindings) > 0 {
			return ResolveRBACMultiRole(bindings)
		}
	}
	return resolveRBACForUser(user)
}

func resolveRBACForUser(user AuthUser) ([]RoleAssignment, []string, []WorkspaceAccess) {
	now := time.Now().UTC().Format(time.RFC3339)
	role := user.Role

	// Build role assignment
	roles := []RoleAssignment{
		{
			RoleID:    fmt.Sprintf("role-%s", string(role)),
			RoleName:  roleDisplayName(role),
			RoleCode:  string(role),
			ScopeType: roleScopeType(role),
			GrantedAt: now,
		},
	}

	// Build permissions
	perms := resolvePermissionsForRole(role)

	// Build workspaces
	ws := resolveWorkspacesForRole(role)

	return roles, perms, ws
}

func roleDisplayName(role UserRole) string {
	switch role {
	case RoleOwner:
		return "Chủ sở hữu"
	case RoleAdmin:
		return "Quản trị hệ thống"
	case RoleFederationPresident:
		return "Chủ tịch Liên đoàn"
	case RoleFederationSecretary:
		return "Tổng thư ký"
	case RoleProvincialAdmin:
		return "Quản trị địa phương"
	case RoleProvincialPresident:
		return "Chủ tịch LĐ tỉnh"
	case RoleProvincialVicePresident:
		return "Phó chủ tịch LĐ tỉnh"
	case RoleProvincialSecretary:
		return "Thư ký LĐ tỉnh"
	case RoleProvincialTechnicalHead:
		return "Trưởng ban chuyên môn tỉnh"
	case RoleProvincialRefereeHead:
		return "Trưởng ban trọng tài tỉnh"
	case RoleProvincialCommitteeMember:
		return "Ủy viên BCH tỉnh"
	case RoleProvincialAccountant:
		return "Kế toán LĐ tỉnh"
	case RoleTechnicalDirector:
		return "Giám đốc kỹ thuật"
	case RoleBTC:
		return "Ban tổ chức"
	case RoleRefereeManager:
		return "Điều phối trọng tài"
	case RoleReferee:
		return "Trọng tài"
	case RoleCoach:
		return "Huấn luyện viên"
	case RoleDelegate:
		return "Cán bộ đoàn"
	case RoleAthlete:
		return "Vận động viên"
	case RoleMedicalStaff:
		return "Nhân viên y tế"
	case RoleClubLeader:
		return "Chủ nhiệm CLB"
	case RoleClubViceLeader:
		return "Phó chủ nhiệm CLB"
	case RoleClubSecretary:
		return "Thư ký CLB"
	case RoleClubAccountant:
		return "Thủ quỹ CLB"
	case RoleParent:
		return "Phụ huynh"
	default:
		return string(role)
	}
}

func roleScopeType(role UserRole) string {
	switch role {
	case RoleOwner, RoleAdmin:
		return "SYSTEM"
	case RoleFederationPresident, RoleFederationSecretary:
		return "FEDERATION"
	case RoleProvincialAdmin, RoleProvincialPresident, RoleProvincialVicePresident,
		RoleProvincialSecretary, RoleProvincialTechnicalHead, RoleProvincialRefereeHead,
		RoleProvincialCommitteeMember, RoleProvincialAccountant:
		return "PROVINCE"
	case RoleTechnicalDirector, RoleBTC, RoleRefereeManager, RoleReferee, RoleMedicalStaff:
		return "TOURNAMENT"
	case RoleCoach, RoleClubLeader, RoleClubViceLeader, RoleClubSecretary, RoleClubAccountant:
		return "CLUB"
	case RoleDelegate, RoleAthlete, RoleParent:
		return "SELF"
	default:
		return "SELF"
	}
}

func resolvePermissionsForRole(role UserRole) []string {
	switch role {
	case RoleOwner, RoleAdmin:
		return []string{"*"}
	case RoleFederationPresident:
		return []string{
			"tournament.*", "athlete.*", "scoring.read", "heritage.*",
			"training.*", "payment.*", "system.manage_config", "system.manage_users",
			"system.view_audit", "community.*",
		}
	case RoleFederationSecretary:
		return []string{
			"tournament.*", "athlete.*", "scoring.read", "heritage.read",
			"training.read", "payment.read", "system.view_audit", "community.*",
		}
	case RoleProvincialAdmin, RoleProvincialPresident:
		return []string{
			"provincial.*", "tournament.read", "tournament.create", "athlete.*",
			"training.*", "payment.*", "heritage.read", "certification.*",
			"discipline.*", "document.*", "club.*",
		}
	case RoleProvincialVicePresident:
		return []string{
			"provincial.read", "provincial.club.*", "provincial.personnel.read",
			"tournament.read", "athlete.*", "training.*",
			"certification.read", "discipline.read", "document.read", "club.*",
		}
	case RoleProvincialSecretary:
		return []string{
			"provincial.*", "tournament.read", "athlete.*",
			"training.read", "document.*", "club.*",
			"certification.read", "discipline.read",
		}
	case RoleProvincialTechnicalHead:
		return []string{
			"provincial.read", "provincial.athlete.*", "provincial.coach.*",
			"tournament.read", "athlete.*", "training.*",
			"certification.*", "heritage.read",
		}
	case RoleProvincialRefereeHead:
		return []string{
			"provincial.read", "provincial.referee.*",
			"tournament.read", "scoring.read",
			"certification.referee.*",
		}
	case RoleProvincialCommitteeMember:
		return []string{
			"provincial.read", "tournament.read", "athlete.read",
			"training.read", "document.read",
		}
	case RoleProvincialAccountant:
		return []string{
			"provincial.read", "provincial.finance.*",
			"payment.*",
		}
	case RoleTechnicalDirector:
		return []string{
			"tournament.*", "athlete.*", "scoring.*",
			"training.*", "heritage.*",
		}
	case RoleBTC:
		return []string{
			"tournament.read", "tournament.create", "tournament.update",
			"athlete.read", "athlete.create", "athlete.update",
			"scoring.read", "payment.read", "payment.create",
		}
	case RoleRefereeManager:
		return []string{
			"tournament.read", "athlete.read",
			"scoring.*",
		}
	case RoleReferee:
		return []string{
			"tournament.read", "athlete.read",
			"scoring.read", "scoring.record",
		}
	case RoleCoach:
		return []string{
			"tournament.read", "athlete.read", "athlete.update",
			"training.*", "scoring.read", "club.read", "club.class.*", "club.member.read",
		}
	case RoleClubLeader:
		return []string{
			"club.*", "tournament.read", "athlete.read", "athlete.update",
			"training.*", "scoring.read", "certification.read",
		}
	case RoleClubViceLeader:
		return []string{
			"club.read", "club.member.*", "club.class.*",
			"tournament.read", "athlete.read", "training.*",
		}
	case RoleClubSecretary:
		return []string{
			"club.read", "club.member.*", "club.class.read",
			"tournament.read", "athlete.read",
		}
	case RoleClubAccountant:
		return []string{
			"club.read", "club.finance.*",
		}
	case RoleDelegate:
		return []string{
			"tournament.read", "athlete.read", "athlete.update",
			"scoring.read",
		}
	case RoleAthlete:
		return []string{
			"tournament.read", "athlete.read",
			"scoring.read", "training.read",
		}
	case RoleMedicalStaff:
		return []string{
			"tournament.read", "athlete.read",
			"scoring.read",
		}
	case RoleParent:
		return []string{
			"athlete.read", "tournament.read", "scoring.read",
			"training.read", "consent.*", "payment.read",
		}
	default:
		return []string{"tournament.read"}
	}
}

func resolveWorkspacesForRole(role UserRole) []WorkspaceAccess {
	ws := []WorkspaceAccess{}

	switch role {
	case RoleOwner, RoleAdmin:
		ws = append(ws,
			WorkspaceAccess{Type: "system_admin", ScopeID: "SYS", ScopeName: "Quản trị hệ thống", Role: "admin"},
			WorkspaceAccess{Type: "federation_admin", ScopeID: "FED", ScopeName: "Liên đoàn VCT", Role: "admin"},
			WorkspaceAccess{Type: "tournament_ops", ScopeID: "TOURN", ScopeName: "Giải đấu", Role: "admin"},
			WorkspaceAccess{Type: "club_management", ScopeID: "CLUB", ScopeName: "CLB", Role: "admin"},
		)
	case RoleFederationPresident, RoleFederationSecretary:
		ws = append(ws,
			WorkspaceAccess{Type: "federation_admin", ScopeID: "FED", ScopeName: "Liên đoàn VCT", Role: string(role)},
		)
	case RoleProvincialAdmin, RoleProvincialPresident, RoleProvincialVicePresident,
		RoleProvincialSecretary, RoleProvincialTechnicalHead, RoleProvincialRefereeHead,
		RoleProvincialCommitteeMember, RoleProvincialAccountant:
		ws = append(ws,
			WorkspaceAccess{Type: "provincial_admin", ScopeID: "PROV", ScopeName: "Liên đoàn tỉnh", Role: string(role)},
		)
	case RoleTechnicalDirector:
		ws = append(ws,
			WorkspaceAccess{Type: "federation_admin", ScopeID: "FED", ScopeName: "Liên đoàn VCT", Role: string(role)},
			WorkspaceAccess{Type: "tournament_ops", ScopeID: "TOURN", ScopeName: "Giải đấu", Role: string(role)},
		)
	case RoleBTC:
		ws = append(ws,
			WorkspaceAccess{Type: "tournament_ops", ScopeID: "TOURN", ScopeName: "Giải đấu", Role: "btc"},
		)
	case RoleRefereeManager, RoleReferee:
		ws = append(ws,
			WorkspaceAccess{Type: "referee_console", ScopeID: "TOURN", ScopeName: "Trọng tài", Role: string(role)},
		)
	case RoleCoach:
		ws = append(ws,
			WorkspaceAccess{Type: "club_management", ScopeID: "CLUB", ScopeName: "CLB", Role: "coach"},
		)
	case RoleClubLeader, RoleClubViceLeader, RoleClubSecretary, RoleClubAccountant:
		ws = append(ws,
			WorkspaceAccess{Type: "club_management", ScopeID: "CLUB", ScopeName: "Quản lý CLB", Role: string(role)},
		)
	case RoleDelegate:
		ws = append(ws,
			WorkspaceAccess{Type: "tournament_ops", ScopeID: "TOURN", ScopeName: "Giải đấu", Role: "delegate"},
		)
	case RoleAthlete:
		ws = append(ws,
			WorkspaceAccess{Type: "athlete_portal", ScopeID: "SELF", ScopeName: "Hồ sơ VĐV", Role: "athlete"},
		)
	case RoleMedicalStaff:
		ws = append(ws,
			WorkspaceAccess{Type: "tournament_ops", ScopeID: "TOURN", ScopeName: "Y tế giải", Role: "medical_staff"},
		)
	case RoleParent:
		ws = append(ws,
			WorkspaceAccess{Type: "parent_portal", ScopeID: "SELF", ScopeName: "Quản lý con em", Role: "parent"},
		)
	}

	// Everyone gets public spectator
	ws = append(ws, WorkspaceAccess{Type: "public_spectator", ScopeID: "PUBLIC", ScopeName: "Xem trực tiếp", Role: "viewer"})

	return ws
}
