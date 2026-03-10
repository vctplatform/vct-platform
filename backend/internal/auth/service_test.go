package auth

import (
	"errors"
	"testing"
	"time"
)

func newTestService() *Service {
	return NewService(ServiceConfig{
		Secret:         "test-secret-for-auth-service",
		Issuer:         "vct-test",
		AccessTTL:      10 * time.Minute,
		RefreshTTL:     2 * time.Hour,
		AuditLimit:     200,
		AllowDemoUsers: true,
	})
}

func adminLoginRequest() LoginRequest {
	return LoginRequest{
		Username:       "admin",
		Password:       "Admin@123",
		Role:           RoleAdmin,
		TournamentCode: "VCT-2026",
		OperationShift: "sang",
	}
}

func testRequestContext() RequestContext {
	return RequestContext{
		IP:        "127.0.0.1",
		UserAgent: "go-test",
	}
}

func TestRefreshReuseRevokesSession(t *testing.T) {
	service := newTestService()
	ctx := testRequestContext()

	loginResult, err := service.Login(adminLoginRequest(), ctx)
	if err != nil {
		t.Fatalf("login failed: %v", err)
	}
	if loginResult.AccessToken == "" || loginResult.RefreshToken == "" {
		t.Fatalf("expected access and refresh tokens in login response")
	}

	refreshed, err := service.Refresh(
		RefreshRequest{RefreshToken: loginResult.RefreshToken},
		ctx,
	)
	if err != nil {
		t.Fatalf("refresh failed: %v", err)
	}
	if refreshed.RefreshToken == loginResult.RefreshToken {
		t.Fatalf("expected rotated refresh token after refresh")
	}

	_, err = service.Refresh(RefreshRequest{RefreshToken: loginResult.RefreshToken}, ctx)
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("expected unauthorized for refresh token reuse, got: %v", err)
	}

	_, err = service.AuthenticateAccessToken(refreshed.AccessToken, ctx)
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("expected session to be revoked after token reuse, got: %v", err)
	}
}

func TestRevokeAllSessions(t *testing.T) {
	service := newTestService()
	ctx := testRequestContext()

	firstSession, err := service.Login(adminLoginRequest(), ctx)
	if err != nil {
		t.Fatalf("first login failed: %v", err)
	}
	secondSession, err := service.Login(adminLoginRequest(), ctx)
	if err != nil {
		t.Fatalf("second login failed: %v", err)
	}

	principal, err := service.AuthenticateAccessToken(firstSession.AccessToken, ctx)
	if err != nil {
		t.Fatalf("principal auth failed: %v", err)
	}

	revokedCount, err := service.Revoke(principal, RevokeRequest{
		RevokeAll: true,
		Reason:    "security_incident",
	}, ctx)
	if err != nil {
		t.Fatalf("revoke all failed: %v", err)
	}
	if revokedCount < 2 {
		t.Fatalf("expected at least 2 revoked sessions, got %d", revokedCount)
	}

	_, err = service.AuthenticateAccessToken(secondSession.AccessToken, ctx)
	if !errors.Is(err, ErrUnauthorized) {
		t.Fatalf("expected revoked second session token to be unauthorized, got: %v", err)
	}
}

func TestAuditLogsFilterByActorAndAction(t *testing.T) {
	service := newTestService()
	ctx := testRequestContext()

	_, err := service.Login(LoginRequest{
		Username:       "ghost",
		Password:       "wrong",
		Role:           RoleAdmin,
		TournamentCode: "VCT-2026",
		OperationShift: "sang",
	}, ctx)
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected invalid credentials error, got: %v", err)
	}

	_, err = service.Login(adminLoginRequest(), ctx)
	if err != nil {
		t.Fatalf("admin login failed: %v", err)
	}

	ghostLoginAudit := service.GetAuditLogs(10, "ghost", "auth.login")
	if len(ghostLoginAudit) != 1 {
		t.Fatalf("expected 1 ghost audit entry, got %d", len(ghostLoginAudit))
	}
	if ghostLoginAudit[0].Success {
		t.Fatalf("expected ghost login audit to be failed entry")
	}
	if ghostLoginAudit[0].Action != "auth.login" {
		t.Fatalf("expected auth.login action, got %s", ghostLoginAudit[0].Action)
	}
}

func TestRegisterAndLogin(t *testing.T) {
	service := newTestService()
	ctx := testRequestContext()

	// Register a new user
	regResult, err := service.Register(RegisterRequest{
		Username:    "newathlete",
		Password:    "Strong@Pass123",
		DisplayName: "New Athlete",
		Role:        RoleAthlete,
	}, ctx)
	if err != nil {
		t.Fatalf("register failed: %v", err)
	}
	if regResult.AccessToken == "" || regResult.RefreshToken == "" {
		t.Fatalf("expected tokens from registration")
	}
	if regResult.User.Username != "newathlete" {
		t.Fatalf("expected username 'newathlete', got %s", regResult.User.Username)
	}
	// User ID should be a UUID v7 (36 chars with hyphens)
	if len(regResult.User.ID) != 36 {
		t.Fatalf("expected UUID v7 user ID (36 chars), got %q (%d chars)", regResult.User.ID, len(regResult.User.ID))
	}

	// Login with the registered credentials
	loginResult, err := service.Login(LoginRequest{
		Username:       "newathlete",
		Password:       "Strong@Pass123",
		Role:           RoleAthlete,
		TournamentCode: "VCT-2026",
		OperationShift: "sang",
	}, ctx)
	if err != nil {
		t.Fatalf("login after register failed: %v", err)
	}
	if loginResult.User.ID != regResult.User.ID {
		t.Fatalf("expected same user ID after login, got %s vs %s", loginResult.User.ID, regResult.User.ID)
	}
}

func TestRegisterDuplicateUsername(t *testing.T) {
	service := newTestService()
	ctx := testRequestContext()

	_, err := service.Register(RegisterRequest{
		Username:    "uniqueuser",
		Password:    "Strong@Pass123",
		DisplayName: "First User",
		Role:        RoleAthlete,
	}, ctx)
	if err != nil {
		t.Fatalf("first register failed: %v", err)
	}

	_, err = service.Register(RegisterRequest{
		Username:    "uniqueuser",
		Password:    "Another@Pass456",
		DisplayName: "Second User",
		Role:        RoleAthlete,
	}, ctx)
	if !errors.Is(err, ErrConflict) {
		t.Fatalf("expected conflict error for duplicate username, got: %v", err)
	}
}

func TestBcryptPasswordVerification(t *testing.T) {
	service := newTestService()
	ctx := testRequestContext()

	// Demo user "admin" should still work with bcrypt-hashed password
	result, err := service.Login(adminLoginRequest(), ctx)
	if err != nil {
		t.Fatalf("admin login with bcrypt failed: %v", err)
	}
	if result.User.Username != "admin" {
		t.Fatalf("expected admin username, got %s", result.User.Username)
	}
	// User ID should be UUID v7, not "u-admin"
	if result.User.ID == "u-admin" {
		t.Fatalf("user ID should be UUID v7, not derived from username")
	}
	if len(result.User.ID) != 36 {
		t.Fatalf("expected UUID v7 user ID (36 chars), got %q", result.User.ID)
	}

	// Wrong password should still fail
	_, err = service.Login(LoginRequest{
		Username:       "admin",
		Password:       "WrongPassword",
		Role:           RoleAdmin,
		TournamentCode: "VCT-2026",
		OperationShift: "sang",
	}, ctx)
	if !errors.Is(err, ErrInvalidCredentials) {
		t.Fatalf("expected invalid credentials for wrong password, got: %v", err)
	}
}
