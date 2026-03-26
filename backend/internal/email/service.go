// Package email extensions — templated notification service
// that works alongside the existing resend.go OTP service.
package email

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"log/slog"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// Notification Provider — Pluggable email backends
// ═══════════════════════════════════════════════════════════════

// NotifMessage represents an outgoing notification email.
type NotifMessage struct {
	To       []string          `json:"to"`
	From     string            `json:"from"`
	Subject  string            `json:"subject"`
	HTMLBody string            `json:"html_body"`
	TextBody string            `json:"text_body,omitempty"`
	Headers  map[string]string `json:"headers,omitempty"`
	ReplyTo  string            `json:"reply_to,omitempty"`
}

// NotifProvider sends emails via a specific backend.
type NotifProvider interface {
	SendNotif(ctx context.Context, msg NotifMessage) error
	ProviderName() string
}

// ═══════════════════════════════════════════════════════════════
// Notification Types — VCT domain notifications
// ═══════════════════════════════════════════════════════════════

type NotificationType string

const (
	NotifWelcome             NotificationType = "welcome"
	NotifPasswordReset       NotificationType = "password_reset"
	NotifTournamentInvite    NotificationType = "tournament_invite"
	NotifRegistrationConfirm NotificationType = "registration_confirm"
	NotifMatchSchedule       NotificationType = "match_schedule"
	NotifResultPublished     NotificationType = "result_published"
	NotifBeltPromotion       NotificationType = "belt_promotion"
)

// Notification is a high-level email request.
type Notification struct {
	Type     NotificationType       `json:"type"`
	To       []string               `json:"to"`
	Locale   string                 `json:"locale"` // vi, en
	Data     map[string]interface{} `json:"data"`
	Priority int                    `json:"priority"` // 0=normal, 1=high
}

// ═══════════════════════════════════════════════════════════════
// Template Engine — HTML email templates with i18n
// ═══════════════════════════════════════════════════════════════

var subjectMap = map[NotificationType]map[string]string{
	NotifWelcome: {
		"vi": "Chào mừng đến với VCT Platform",
		"en": "Welcome to VCT Platform",
	},
	NotifPasswordReset: {
		"vi": "Đặt lại mật khẩu VCT Platform",
		"en": "Reset your VCT Platform password",
	},
	NotifTournamentInvite: {
		"vi": "Bạn được mời tham gia giải đấu",
		"en": "You've been invited to a tournament",
	},
	NotifRegistrationConfirm: {
		"vi": "Xác nhận đăng ký giải đấu",
		"en": "Tournament registration confirmed",
	},
	NotifMatchSchedule: {
		"vi": "Lịch thi đấu của bạn",
		"en": "Your match schedule",
	},
	NotifResultPublished: {
		"vi": "Kết quả giải đấu đã công bố",
		"en": "Tournament results published",
	},
	NotifBeltPromotion: {
		"vi": "Chúc mừng thăng đai!",
		"en": "Congratulations on your belt promotion!",
	},
}

var templateMap = map[NotificationType]string{
	NotifWelcome: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#0891b2">{{if eq .Locale "vi"}}Chào mừng, {{.Name}}!{{else}}Welcome, {{.Name}}!{{end}}</h1>
<p>{{if eq .Locale "vi"}}Tài khoản của bạn đã được tạo thành công trên VCT Platform.{{else}}Your account has been successfully created on VCT Platform.{{end}}</p>
<a href="{{.LoginURL}}" style="background:#0891b2;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">{{if eq .Locale "vi"}}Đăng nhập{{else}}Sign In{{end}}</a>
</body></html>`,

	NotifPasswordReset: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#0891b2">{{if eq .Locale "vi"}}Đặt lại mật khẩu{{else}}Reset Password{{end}}</h1>
<p>{{if eq .Locale "vi"}}Nhấn nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong 1 giờ.{{else}}Click below to reset your password. This link expires in 1 hour.{{end}}</p>
<a href="{{.ResetURL}}" style="background:#0891b2;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">{{if eq .Locale "vi"}}Đặt lại mật khẩu{{else}}Reset Password{{end}}</a>
</body></html>`,

	NotifTournamentInvite: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
<h1 style="color:#0891b2">{{.TournamentName}}</h1>
<p>{{if eq .Locale "vi"}}Bạn được mời tham gia giải đấu <strong>{{.TournamentName}}</strong> diễn ra ngày {{.Date}}.{{else}}You've been invited to <strong>{{.TournamentName}}</strong> on {{.Date}}.{{end}}</p>
<a href="{{.InviteURL}}" style="background:#0891b2;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block">{{if eq .Locale "vi"}}Xem chi tiết{{else}}View Details{{end}}</a>
</body></html>`,
}

// ═══════════════════════════════════════════════════════════════
// NotificationService — Queued email delivery
// ═══════════════════════════════════════════════════════════════

// NotifConfig holds notification service config.
type NotifConfig struct {
	FromAddress string
	FromName    string
	QueueSize   int
	Workers     int
}

// DefaultNotifConfig returns sensible defaults.
func DefaultNotifConfig() NotifConfig {
	return NotifConfig{
		FromAddress: "noreply@vct-platform.com",
		FromName:    "VCT Platform",
		QueueSize:   500,
		Workers:     2,
	}
}

// SentRecord tracks a sent email.
type SentRecord struct {
	Type    NotificationType `json:"type"`
	To      []string         `json:"to"`
	Subject string           `json:"subject"`
	Status  string           `json:"status"`
	Error   string           `json:"error,omitempty"`
	SentAt  time.Time        `json:"sent_at"`
}

// NotificationService manages templated email notifications.
type NotificationService struct {
	cfg      NotifConfig
	provider NotifProvider
	logger   *slog.Logger
	queue    chan Notification
	sent     []SentRecord
	wg       sync.WaitGroup
	mu       sync.RWMutex
	cancel   context.CancelFunc
}

// NewNotificationService creates a notification service.
func NewNotificationService(cfg NotifConfig, provider NotifProvider, logger *slog.Logger) *NotificationService {
	return &NotificationService{
		cfg:      cfg,
		provider: provider,
		logger:   logger.With(slog.String("component", "email_notif")),
		queue:    make(chan Notification, cfg.QueueSize),
	}
}

// Send queues a notification.
func (s *NotificationService) Send(notif Notification) error {
	if notif.Locale == "" {
		notif.Locale = "vi"
	}
	select {
	case s.queue <- notif:
		return nil
	default:
		return fmt.Errorf("email queue full")
	}
}

// Start launches workers.
func (s *NotificationService) Start(ctx context.Context) {
	ctx, s.cancel = context.WithCancel(ctx)
	for i := 0; i < s.cfg.Workers; i++ {
		s.wg.Add(1)
		go s.worker(ctx)
	}
	s.logger.Info("notification service started", slog.Int("workers", s.cfg.Workers))
}

// Stop halts workers.
func (s *NotificationService) Stop() {
	s.cancel()
	s.wg.Wait()
}

// SentRecords returns delivery history.
func (s *NotificationService) SentRecords() []SentRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	result := make([]SentRecord, len(s.sent))
	copy(result, s.sent)
	return result
}

func (s *NotificationService) worker(ctx context.Context) {
	defer s.wg.Done()
	for {
		select {
		case <-ctx.Done():
			return
		case notif := <-s.queue:
			s.process(ctx, notif)
		}
	}
}

func (s *NotificationService) process(ctx context.Context, notif Notification) {
	subject := s.getSubject(notif)
	body, err := s.renderTemplate(notif)
	if err != nil {
		s.recordSent(notif, subject, "failed", err.Error())
		return
	}

	msg := NotifMessage{
		To:       notif.To,
		From:     fmt.Sprintf("%s <%s>", s.cfg.FromName, s.cfg.FromAddress),
		Subject:  subject,
		HTMLBody: body,
	}

	if err := s.provider.SendNotif(ctx, msg); err != nil {
		s.recordSent(notif, subject, "failed", err.Error())
		return
	}

	s.recordSent(notif, subject, "sent", "")
}

func (s *NotificationService) getSubject(notif Notification) string {
	subjects, ok := subjectMap[notif.Type]
	if !ok {
		return "VCT Platform Notification"
	}
	if sub, ok := subjects[notif.Locale]; ok {
		return sub
	}
	return "VCT Platform Notification"
}

func (s *NotificationService) renderTemplate(notif Notification) (string, error) {
	tmplStr, ok := templateMap[notif.Type]
	if !ok {
		return "", fmt.Errorf("no template for type %q", notif.Type)
	}
	data := make(map[string]interface{})
	for k, v := range notif.Data {
		data[k] = v
	}
	data["Locale"] = notif.Locale

	tmpl, err := template.New(string(notif.Type)).Parse(tmplStr)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func (s *NotificationService) recordSent(notif Notification, subject, status, errMsg string) {
	s.mu.Lock()
	s.sent = append(s.sent, SentRecord{
		Type: notif.Type, To: notif.To, Subject: subject,
		Status: status, Error: errMsg, SentAt: time.Now().UTC(),
	})
	s.mu.Unlock()
}
