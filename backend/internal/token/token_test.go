package token

import (
	"strings"
	"testing"
	"time"
)

func svc() *Service {
	return NewService(Config{
		Secret:     "vct-platform-test-secret-key-2026",
		Issuer:     "vct-platform",
		AccessTTL:  15 * time.Minute,
		RefreshTTL: 24 * time.Hour,
	})
}

func TestGenerateAndValidate(t *testing.T) {
	s := svc()
	tok, err := s.GenerateAccess("user-1", []string{"admin"}, nil)
	if err != nil {
		t.Fatal(err)
	}

	claims, err := s.Validate(tok)
	if err != nil {
		t.Fatal(err)
	}
	if claims.Subject != "user-1" {
		t.Error("subject mismatch")
	}
	if claims.TokenType != "access" {
		t.Errorf("expected access, got %s", claims.TokenType)
	}
	if !claims.HasRole("admin") {
		t.Error("should have admin role")
	}
}

func TestInvalidSignature(t *testing.T) {
	s := svc()
	tok, _ := s.GenerateAccess("user-1", nil, nil)

	// Tamper with signature
	parts := strings.SplitN(tok, ".", 2)
	tampered := parts[0] + ".INVALID"

	_, err := s.Validate(tampered)
	if err == nil {
		t.Error("expected invalid signature error")
	}
}

func TestExpiredToken(t *testing.T) {
	s := NewService(Config{Secret: "test", AccessTTL: time.Second})

	// Directly create a token with past expiration
	tok, _ := s.generate("user-1", "access", nil, nil, -1*time.Minute)

	_, err := s.Validate(tok)
	if err == nil {
		t.Error("expected expiration error")
	}
}

func TestIssuerMismatch(t *testing.T) {
	s1 := NewService(Config{Secret: "test", Issuer: "service-a"})
	s2 := NewService(Config{Secret: "test", Issuer: "service-b"})

	tok, _ := s1.GenerateAccess("user-1", nil, nil)

	_, err := s2.Validate(tok)
	if err == nil {
		t.Error("expected issuer mismatch error")
	}
}

func TestTokenPair(t *testing.T) {
	s := svc()
	pair, err := s.GeneratePair("user-1", []string{"editor"}, map[string]string{"tenant": "t1"})
	if err != nil {
		t.Fatal(err)
	}

	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Error("tokens should not be empty")
	}
	if pair.ExpiresIn != 900 { // 15 min
		t.Errorf("expected 900s, got %d", pair.ExpiresIn)
	}

	// Validate access
	claims, _ := s.Validate(pair.AccessToken)
	if claims.Extra["tenant"] != "t1" {
		t.Error("extra claims missing")
	}
}

func TestRefresh(t *testing.T) {
	s := svc()
	pair, _ := s.GeneratePair("user-1", []string{"admin"}, nil)

	newPair, err := s.Refresh(pair.RefreshToken, []string{"admin", "editor"}, nil)
	if err != nil {
		t.Fatal(err)
	}
	if newPair.AccessToken == pair.AccessToken {
		t.Error("new access token should be different")
	}

	// Validate new access token has updated roles
	claims, _ := s.Validate(newPair.AccessToken)
	if !claims.HasRole("editor") {
		t.Error("should have editor role after refresh")
	}
}

func TestRefresh_WithAccessToken_Fails(t *testing.T) {
	s := svc()
	pair, _ := s.GeneratePair("user-1", nil, nil)

	_, err := s.Refresh(pair.AccessToken, nil, nil)
	if err == nil {
		t.Error("should reject access token as refresh token")
	}
}

func TestInvalidFormat(t *testing.T) {
	s := svc()
	_, err := s.Validate("not-a-valid-token")
	if err == nil {
		t.Error("expected format error")
	}
}

func TestHasRole(t *testing.T) {
	c := &Claims{Roles: []string{"admin", "editor"}}
	if !c.HasRole("admin") {
		t.Error("should have admin")
	}
	if c.HasRole("viewer") {
		t.Error("should not have viewer")
	}
}

func TestClaimsValid_MissingSubject(t *testing.T) {
	c := &Claims{}
	if c.Valid() == nil {
		t.Error("expected error for missing subject")
	}
}

func TestDifferentSecrets(t *testing.T) {
	s1 := NewService(Config{Secret: "secret-a"})
	s2 := NewService(Config{Secret: "secret-b"})

	tok, _ := s1.GenerateAccess("user-1", nil, nil)
	_, err := s2.Validate(tok)
	if err == nil {
		t.Error("different secret should fail validation")
	}
}
