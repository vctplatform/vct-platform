package email

import (
	"context"
	"errors"
	"log/slog"
	"os"
	"strings"
	"testing"
	"time"
)

func testLogger() *slog.Logger {
	return slog.New(slog.NewTextHandler(os.Stderr, &slog.HandlerOptions{Level: slog.LevelError}))
}

// mockProvider records sent messages.
type mockProvider struct {
	sent    []NotifMessage
	failErr error
}

func (m *mockProvider) SendNotif(_ context.Context, msg NotifMessage) error {
	if m.failErr != nil {
		return m.failErr
	}
	m.sent = append(m.sent, msg)
	return nil
}
func (m *mockProvider) ProviderName() string { return "mock" }

func TestSend_Welcome_Vietnamese(t *testing.T) {
	provider := &mockProvider{}
	svc := NewNotificationService(DefaultNotifConfig(), provider, testLogger())
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Send(Notification{
		Type:   NotifWelcome,
		To:     []string{"user@vct.com"},
		Locale: "vi",
		Data: map[string]interface{}{
			"Name":     "Nguyễn Văn A",
			"LoginURL": "https://vct-platform.com/login",
		},
	})

	time.Sleep(100 * time.Millisecond)

	if len(provider.sent) != 1 {
		t.Fatalf("expected 1 sent, got %d", len(provider.sent))
	}
	msg := provider.sent[0]
	if msg.Subject != "Chào mừng đến với VCT Platform" {
		t.Errorf("expected Vietnamese subject, got %q", msg.Subject)
	}
	if !strings.Contains(msg.HTMLBody, "Nguyễn Văn A") {
		t.Error("body should contain user name")
	}
}

func TestSend_Welcome_English(t *testing.T) {
	provider := &mockProvider{}
	svc := NewNotificationService(DefaultNotifConfig(), provider, testLogger())
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Send(Notification{
		Type:   NotifWelcome,
		To:     []string{"user@vct.com"},
		Locale: "en",
		Data:   map[string]interface{}{"Name": "John", "LoginURL": "https://vct.com"},
	})
	time.Sleep(100 * time.Millisecond)

	if provider.sent[0].Subject != "Welcome to VCT Platform" {
		t.Errorf("expected English subject, got %q", provider.sent[0].Subject)
	}
}

func TestSend_PasswordReset(t *testing.T) {
	provider := &mockProvider{}
	svc := NewNotificationService(DefaultNotifConfig(), provider, testLogger())
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Send(Notification{
		Type:   NotifPasswordReset,
		To:     []string{"user@vct.com"},
		Locale: "vi",
		Data:   map[string]interface{}{"ResetURL": "https://vct.com/reset/abc"},
	})
	time.Sleep(100 * time.Millisecond)

	if len(provider.sent) != 1 {
		t.Fatal("expected 1 sent")
	}
	if !strings.Contains(provider.sent[0].HTMLBody, "reset/abc") {
		t.Error("body should contain reset URL")
	}
}

func TestSend_ProviderFailure(t *testing.T) {
	provider := &mockProvider{failErr: errors.New("SMTP connection refused")}
	svc := NewNotificationService(DefaultNotifConfig(), provider, testLogger())
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Send(Notification{
		Type: NotifWelcome,
		To:   []string{"user@vct.com"},
		Data: map[string]interface{}{"Name": "Test", "LoginURL": "https://vct.com"},
	})
	time.Sleep(100 * time.Millisecond)

	records := svc.SentRecords()
	if len(records) != 1 || records[0].Status != "failed" {
		t.Error("expected failed status")
	}
}

func TestSend_DefaultLocale(t *testing.T) {
	provider := &mockProvider{}
	svc := NewNotificationService(DefaultNotifConfig(), provider, testLogger())
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Send(Notification{
		Type: NotifWelcome,
		To:   []string{"user@vct.com"},
		Data: map[string]interface{}{"Name": "Test", "LoginURL": "https://vct.com"},
		// No Locale set — defaults to "vi"
	})
	time.Sleep(100 * time.Millisecond)

	if provider.sent[0].Subject != "Chào mừng đến với VCT Platform" {
		t.Error("default locale should be Vietnamese")
	}
}

func TestSend_TournamentInvite(t *testing.T) {
	provider := &mockProvider{}
	svc := NewNotificationService(DefaultNotifConfig(), provider, testLogger())
	svc.Start(context.Background())
	defer svc.Stop()

	svc.Send(Notification{
		Type:   NotifTournamentInvite,
		To:     []string{"athlete@vct.com"},
		Locale: "vi",
		Data: map[string]interface{}{
			"TournamentName": "Giải VCT Toàn Quốc 2026",
			"Date":           "15/06/2026",
			"InviteURL":      "https://vct.com/tournaments/t1",
		},
	})
	time.Sleep(100 * time.Millisecond)

	if !strings.Contains(provider.sent[0].HTMLBody, "Giải VCT Toàn Quốc 2026") {
		t.Error("body should contain tournament name")
	}
}

func TestQueueFull(t *testing.T) {
	cfg := DefaultNotifConfig()
	cfg.QueueSize = 1
	cfg.Workers = 0
	provider := &mockProvider{}
	svc := NewNotificationService(cfg, provider, testLogger())

	svc.Send(Notification{Type: NotifWelcome, To: []string{"a@b.com"}, Data: map[string]interface{}{"Name": "T", "LoginURL": "x"}})
	err := svc.Send(Notification{Type: NotifWelcome, To: []string{"c@d.com"}, Data: map[string]interface{}{"Name": "T", "LoginURL": "x"}})
	if err == nil {
		t.Error("expected queue full error")
	}
}
