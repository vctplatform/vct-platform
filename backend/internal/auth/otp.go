package auth

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"log/slog"
	"math/big"
	"time"

	"vct-platform/backend/internal/apierror"
)

// ── OTP Verification ──────────────────────────────────────────

// OTPEntry holds a pending OTP code and its associated registration data.
type OTPEntry struct {
	Code        string
	Email       string
	DisplayName string
	Phone       string
	Password    string // plaintext, hashed on verification
	Role        UserRole
	ExpiresAt   time.Time
	Attempts    int
}

// OTPStore manages pending OTP codes in cache.
type OTPStore struct {
	cache CacheClient
}

func NewOTPStore(cache CacheClient) *OTPStore {
	return &OTPStore{cache: cache}
}

func otpKey(email string) string {
	return "auth:otp:" + email
}

// Set stores an OTP for the given email, replacing any existing one.
func (s *OTPStore) Set(ctx context.Context, entry *OTPEntry) error {
	if s.cache == nil {
		slog.Warn("OTPStore invoked without cache configured - storing locally is not supported")
		return nil
	}
	data, err := json.Marshal(entry)
	if err != nil {
		return err
	}
	ttl := time.Until(entry.ExpiresAt)
	if ttl <= 0 {
		return nil
	}
	return s.cache.Set(ctx, otpKey(entry.Email), string(data), ttl)
}

// Verify checks the code for the given email. Returns the entry on success.
// Deletes the entry after successful verification or too many attempts.
func (s *OTPStore) Verify(ctx context.Context, emailAddr, code string) (*OTPEntry, error) {
	if s.cache == nil {
		return nil, apierror.New("AUTH_500_NO_CACHE", "hệ thống không cấu hình cache")
	}

	dataStr, err := s.cache.Get(ctx, otpKey(emailAddr))
	if err != nil || dataStr == "" {
		return nil, apierror.New("AUTH_401_OTP_MISSING", "không tìm thấy mã OTP cho email này")
	}

	var entry OTPEntry
	if err := json.Unmarshal([]byte(dataStr), &entry); err != nil {
		return nil, err
	}

	if time.Now().After(entry.ExpiresAt) {
		s.cache.Delete(ctx, otpKey(emailAddr))
		return nil, apierror.New("AUTH_401_OTP_EXPIRED", "mã OTP đã hết hạn, vui lòng gửi lại")
	}

	entry.Attempts++
	if entry.Attempts >= 5 {
		s.cache.Delete(ctx, otpKey(emailAddr))
		return nil, apierror.New("AUTH_429_OTP_LOCK", "vượt quá số lần thử, vui lòng gửi mã mới")
	}

	if entry.Code != code {
		// Update attempts back to redis
		s.Set(ctx, &entry)
		return nil, apierror.New("AUTH_401_OTP_INVALID", "mã OTP không chính xác")
	}

	// Success — remove entry
	s.cache.Delete(ctx, otpKey(emailAddr))
	return &entry, nil
}

// Cleanup removes expired entries (noop for Redis TTL).
func (s *OTPStore) Cleanup() {
}

// generateOTP creates a cryptographically random 6-digit code.
func generateOTP() string {
	n, err := rand.Int(rand.Reader, big.NewInt(1000000))
	if err != nil {
		// fallback
		return fmt.Sprintf("%06d", time.Now().UnixNano()%1000000)
	}
	return fmt.Sprintf("%06d", n.Int64())
}

// ── Send OTP Request/Response ─────────────────────────────────

type SendOTPRequest struct {
	Email       string   `json:"email"`
	DisplayName string   `json:"displayName"`
	Phone       string   `json:"phone"`
	Password    string   `json:"password"`
	Role        UserRole `json:"role"`
}

type SendOTPResponse struct {
	Message string `json:"message"`
	Email   string `json:"email"`
}

type VerifyOTPRequest struct {
	Email string `json:"email"`
	Code  string `json:"code"`
}

// ── Service Integration ───────────────────────────────────────

// OTPSender is anything that can send an OTP email.
type OTPSender interface {
	SendOTP(to, code, displayName string) error
}

// SendOTP generates an OTP, stores the pending registration, and sends the email.
func (svc *Service) SendOTP(input SendOTPRequest, emailService OTPSender) (SendOTPResponse, error) {
	emailAddr := input.Email
	if emailAddr == "" {
		return SendOTPResponse{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "email là bắt buộc")
	}
	if input.Password == "" || len(input.Password) < 8 {
		return SendOTPResponse{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "mật khẩu phải có ít nhất 8 ký tự")
	}
	if input.DisplayName == "" {
		return SendOTPResponse{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "họ tên là bắt buộc")
	}

	role := input.Role
	if role == "" {
		role = RoleAthlete
	}

	// Check if username (email) already registered — database first
	if svc.userStore != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		existing, err := svc.userStore.FindByUsername(ctx, emailAddr)
		if err != nil {
			slog.Warn("DB lookup error during OTP", slog.String("email", emailAddr), slog.String("error", err.Error()))
		}
		if existing != nil {
			return SendOTPResponse{}, wrapCodedError(ErrConflict, CodeConflict, "email đã được đăng ký")
		}
	}

	// Fallback: check in-memory credentials
	svc.mu.RLock()
	_, exists := svc.credentials[emailAddr]
	svc.mu.RUnlock()
	if exists {
		return SendOTPResponse{}, wrapCodedError(ErrConflict, CodeConflict, "email đã được đăng ký")
	}

	code := generateOTP()
	svc.otpStore.Set(context.Background(), &OTPEntry{
		Code:        code,
		Email:       emailAddr,
		DisplayName: input.DisplayName,
		Phone:       input.Phone,
		Password:    input.Password,
		Role:        role,
		ExpiresAt:   time.Now().Add(10 * time.Minute),
	})

	if err := emailService.SendOTP(emailAddr, code, input.DisplayName); err != nil {
		slog.Warn("OTP email send failed", slog.String("email", emailAddr), slog.String("error", err.Error()))
		return SendOTPResponse{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "gửi email thất bại, vui lòng thử lại")
	}

	return SendOTPResponse{
		Message: "Mã OTP đã được gửi đến email của bạn",
		Email:   emailAddr,
	}, nil
}

// VerifyOTP checks the OTP code and completes registration if valid.
func (svc *Service) VerifyOTP(input VerifyOTPRequest, requestCtx RequestContext) (LoginResult, error) {
	if input.Email == "" || input.Code == "" {
		return LoginResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, "email và mã OTP là bắt buộc")
	}

	entry, err := svc.otpStore.Verify(context.Background(), input.Email, input.Code)
	if err != nil {
		return LoginResult{}, wrapCodedError(ErrBadRequest, CodeBadRequest, err.Error())
	}

	// OTP verified — register the user using existing Register flow
	result, regErr := svc.Register(RegisterRequest{
		Username:    entry.Email,
		Password:    entry.Password,
		DisplayName: entry.DisplayName,
		Role:        entry.Role,
	}, requestCtx)
	if regErr != nil {
		return LoginResult{}, regErr
	}

	return result, nil
}
