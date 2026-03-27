// Package token provides HMAC-based token generation and validation
// with typed claims, expiration, issuer checks, and token refresh.
package token

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"strings"
	"time"

	"vct-platform/backend/internal/apierror"
)

// ═══════════════════════════════════════════════════════════════
// Claims
// ═══════════════════════════════════════════════════════════════

// Claims holds token payload data.
type Claims struct {
	Subject   string            `json:"sub"`
	Issuer    string            `json:"iss,omitempty"`
	Audience  string            `json:"aud,omitempty"`
	IssuedAt  int64             `json:"iat"`
	ExpiresAt int64             `json:"exp"`
	TokenType string            `json:"typ,omitempty"` // "access", "refresh"
	Roles     []string          `json:"roles,omitempty"`
	Extra     map[string]string `json:"ext,omitempty"`
}

// Valid checks if claims are not expired and have required fields.
func (c *Claims) Valid() error {
	if c.Subject == "" {
		return apierror.New("AUTH_401_INVALID", "thiếu chủ thể trong token")
	}
	now := time.Now().Unix()
	if c.ExpiresAt > 0 && now > c.ExpiresAt {
		return apierror.Newf("AUTH_401_EXPIRED", "token đã hết hạn vào lúc %s", time.Unix(c.ExpiresAt, 0).Format(time.RFC3339))
	}
	if c.IssuedAt > now+60 { // 60s clock skew tolerance
		return apierror.New("AUTH_401_FUTURE", "token được cấp phát vào thời điểm trong tương lai")
	}
	return nil
}

// HasRole checks if claims include a specific role.
func (c *Claims) HasRole(role string) bool {
	for _, r := range c.Roles {
		if r == role {
			return true
		}
	}
	return false
}

// ═══════════════════════════════════════════════════════════════
// Service
// ═══════════════════════════════════════════════════════════════

// Service handles token creation and validation.
type Service struct {
	secret     []byte
	issuer     string
	accessTTL  time.Duration
	refreshTTL time.Duration
}

// Config for token service.
type Config struct {
	Secret     string        // HMAC signing secret
	Issuer     string        // Issuer identifier
	AccessTTL  time.Duration // Access token lifetime
	RefreshTTL time.Duration // Refresh token lifetime
}

// NewService creates a token service.
func NewService(cfg Config) *Service {
	if cfg.AccessTTL <= 0 {
		cfg.AccessTTL = 15 * time.Minute
	}
	if cfg.RefreshTTL <= 0 {
		cfg.RefreshTTL = 7 * 24 * time.Hour
	}
	return &Service{
		secret:     []byte(cfg.Secret),
		issuer:     cfg.Issuer,
		accessTTL:  cfg.AccessTTL,
		refreshTTL: cfg.RefreshTTL,
	}
}

// GenerateAccess creates a signed access token.
func (s *Service) GenerateAccess(subject string, roles []string, extra map[string]string) (string, error) {
	return s.generate(subject, "access", roles, extra, s.accessTTL)
}

// GenerateRefresh creates a signed refresh token.
func (s *Service) GenerateRefresh(subject string) (string, error) {
	return s.generate(subject, "refresh", nil, nil, s.refreshTTL)
}

// TokenPair holds both access and refresh tokens.
type TokenPair struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
}

// GeneratePair creates both access and refresh tokens.
func (s *Service) GeneratePair(subject string, roles []string, extra map[string]string) (*TokenPair, error) {
	access, err := s.GenerateAccess(subject, roles, extra)
	if err != nil {
		return nil, err
	}
	refresh, err := s.GenerateRefresh(subject)
	if err != nil {
		return nil, err
	}
	return &TokenPair{
		AccessToken:  access,
		RefreshToken: refresh,
		ExpiresIn:    int64(s.accessTTL.Seconds()),
	}, nil
}

// Validate parses and verifies a token, returning claims.
func (s *Service) Validate(tokenStr string) (*Claims, error) {
	parts := strings.SplitN(tokenStr, ".", 2)
	if len(parts) != 2 {
		return nil, apierror.New("AUTH_401_FORMAT", "định dạng token không hợp lệ")
	}

	payloadB64 := parts[0]
	signature := parts[1]

	// Verify signature
	expectedSig := s.sign(payloadB64)
	if !hmac.Equal([]byte(signature), []byte(expectedSig)) {
		return nil, apierror.New("AUTH_401_SIGNATURE", "chữ ký token không hợp lệ")
	}

	// Decode payload
	payload, err := base64.RawURLEncoding.DecodeString(payloadB64)
	if err != nil {
		return nil, apierror.Wrap(err, "AUTH_401_DECODE", "lỗi giải mã token")
	}

	var claims Claims
	if err := json.Unmarshal(payload, &claims); err != nil {
		return nil, apierror.Wrap(err, "AUTH_401_UNMARSHAL", "lỗi phân tích dữ liệu token")
	}

	// Validate claims
	if err := claims.Valid(); err != nil {
		return nil, err
	}

	// Check issuer
	if s.issuer != "" && claims.Issuer != s.issuer {
		return nil, apierror.Newf("AUTH_401_ISSUER", "mismatch người cấp phát (nhận %q, mong đợi %q)", claims.Issuer, s.issuer)
	}

	return &claims, nil
}

// Refresh generates new access token from a valid refresh token.
func (s *Service) Refresh(refreshToken string, roles []string, extra map[string]string) (*TokenPair, error) {
	claims, err := s.Validate(refreshToken)
	if err != nil {
		return nil, apierror.Wrap(err, "AUTH_401_REFRESH", "lỗi làm mới token")
	}
	if claims.TokenType != "refresh" {
		return nil, apierror.New("AUTH_401_TYPE", "không phải là refresh token")
	}
	return s.GeneratePair(claims.Subject, roles, extra)
}

// ── Internal ─────────────────────────────────────

func (s *Service) generate(subject, tokenType string, roles []string, extra map[string]string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		Subject:   subject,
		Issuer:    s.issuer,
		IssuedAt:  now.Unix(),
		ExpiresAt: now.Add(ttl).Unix(),
		TokenType: tokenType,
		Roles:     roles,
		Extra:     extra,
	}

	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}

	payloadB64 := base64.RawURLEncoding.EncodeToString(payload)
	signature := s.sign(payloadB64)

	return payloadB64 + "." + signature, nil
}

func (s *Service) sign(data string) string {
	mac := hmac.New(sha256.New, s.secret)
	mac.Write([]byte(data))
	return base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
}
