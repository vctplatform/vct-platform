package notifications

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — NOTIFICATION SERVICE
// In-app + Push notification system with preferences.
// Supports: match results, schedule updates, rank changes, BTC alerts.
// ═══════════════════════════════════════════════════════════════

// NotificationType categorises notification channels.
type NotificationType string

const (
	NotifMatchResult NotificationType = "match_result"
	NotifSchedule    NotificationType = "schedule"
	NotifRankChange  NotificationType = "rank_change"
	NotifBTCAlert    NotificationType = "btc_alert"
	NotifConsent     NotificationType = "consent"
	NotifGeneral     NotificationType = "general"
)

// Notification is a single notification entry.
type Notification struct {
	ID        string            `json:"id"`
	UserID    string            `json:"user_id"`
	Type      NotificationType  `json:"type"`
	Title     string            `json:"title"`
	Body      string            `json:"body"`
	Data      map[string]string `json:"data,omitempty"`
	Read      bool              `json:"read"`
	CreatedAt time.Time         `json:"created_at"`
}

// UserPreferences controls which notification types a user receives.
type UserPreferences struct {
	UserID      string                    `json:"user_id"`
	Preferences map[NotificationType]bool `json:"preferences"`
	PushEnabled bool                      `json:"push_enabled"`
	FCMToken    string                    `json:"fcm_token,omitempty"`
}

// Store persists notifications.
type Store interface {
	List(ctx context.Context, userID string, limit int) ([]Notification, error)
	Create(ctx context.Context, n *Notification) error
	MarkRead(ctx context.Context, userID, notifID string) error
	MarkAllRead(ctx context.Context, userID string) error
	CountUnread(ctx context.Context, userID string) (int, error)
	GetPreferences(ctx context.Context, userID string) (*UserPreferences, error)
	SavePreferences(ctx context.Context, prefs *UserPreferences) error
}

// PushSender sends push notifications (FCM, APNs).
type PushSender interface {
	Send(ctx context.Context, token string, title, body string, data map[string]string) error
}

// Service handles notification delivery.
type Service struct {
	store Store
	push  PushSender
	idGen func() string
	mu    sync.RWMutex
}

// NewService creates a new notification service.
func NewService(store Store, push PushSender, idGen func() string) *Service {
	return &Service{store: store, push: push, idGen: idGen}
}

// Send creates a notification and optionally pushes it.
func (s *Service) Send(ctx context.Context, userID string, typ NotificationType, title, body string, data map[string]string) error {
	// Check preferences
	prefs, _ := s.store.GetPreferences(ctx, userID)
	if prefs != nil {
		if enabled, exists := prefs.Preferences[typ]; exists && !enabled {
			return nil // User opted out
		}
	}

	n := &Notification{
		ID:        s.idGen(),
		UserID:    userID,
		Type:      typ,
		Title:     title,
		Body:      body,
		Data:      data,
		Read:      false,
		CreatedAt: time.Now().UTC(),
	}

	if err := s.store.Create(ctx, n); err != nil {
		return fmt.Errorf("save notification: %w", err)
	}

	// Push if enabled
	if s.push != nil && prefs != nil && prefs.PushEnabled && prefs.FCMToken != "" {
		go func() {
			_ = s.push.Send(context.Background(), prefs.FCMToken, title, body, data)
		}()
	}

	return nil
}

// SendBatch sends notifications to multiple users.
func (s *Service) SendBatch(ctx context.Context, userIDs []string, typ NotificationType, title, body string, data map[string]string) error {
	for _, uid := range userIDs {
		if err := s.Send(ctx, uid, typ, title, body, data); err != nil {
			// Log but don't fail batch
			continue
		}
	}
	return nil
}

// List returns recent notifications for a user.
func (s *Service) List(ctx context.Context, userID string, limit int) ([]Notification, error) {
	if limit <= 0 {
		limit = 50
	}
	return s.store.List(ctx, userID, limit)
}

// MarkRead marks a notification as read.
func (s *Service) MarkRead(ctx context.Context, userID, notifID string) error {
	return s.store.MarkRead(ctx, userID, notifID)
}

// MarkAllRead marks all notifications for a user as read.
func (s *Service) MarkAllRead(ctx context.Context, userID string) error {
	return s.store.MarkAllRead(ctx, userID)
}

// CountUnread returns unread count for badge display.
func (s *Service) CountUnread(ctx context.Context, userID string) (int, error) {
	return s.store.CountUnread(ctx, userID)
}

// GetPreferences returns notification preferences for a user.
func (s *Service) GetPreferences(ctx context.Context, userID string) (*UserPreferences, error) {
	prefs, err := s.store.GetPreferences(ctx, userID)
	if err != nil {
		// Return defaults
		return &UserPreferences{
			UserID:      userID,
			PushEnabled: true,
			Preferences: map[NotificationType]bool{
				NotifMatchResult: true,
				NotifSchedule:    true,
				NotifRankChange:  true,
				NotifBTCAlert:    true,
				NotifConsent:     true,
				NotifGeneral:     true,
			},
		}, nil
	}
	return prefs, nil
}

// SavePreferences updates notification preferences.
func (s *Service) SavePreferences(ctx context.Context, prefs *UserPreferences) error {
	return s.store.SavePreferences(ctx, prefs)
}

// ── Template Helpers ────────────────────────────────────────

// NotifyMatchResult sends a match result notification.
func (s *Service) NotifyMatchResult(ctx context.Context, userIDs []string, matchName, winner, score string) error {
	return s.SendBatch(ctx, userIDs, NotifMatchResult,
		fmt.Sprintf("🥊 Kết quả: %s", matchName),
		fmt.Sprintf("Thắng: %s | Tỉ số: %s", winner, score),
		map[string]string{"match_name": matchName, "winner": winner, "score": score},
	)
}

// NotifyRankChange sends a ranking change notification.
func (s *Service) NotifyRankChange(ctx context.Context, userID string, oldRank, newRank int, category string) error {
	direction := "🔼"
	if newRank > oldRank {
		direction = "🔽"
	}
	return s.Send(ctx, userID, NotifRankChange,
		fmt.Sprintf("%s Thay đổi hạng — %s", direction, category),
		fmt.Sprintf("Hạng %d → %d", oldRank, newRank),
		map[string]string{"old_rank": fmt.Sprintf("%d", oldRank), "new_rank": fmt.Sprintf("%d", newRank)},
	)
}

// NotifySchedule sends a schedule update notification.
func (s *Service) NotifySchedule(ctx context.Context, userIDs []string, event, date, location string) error {
	return s.SendBatch(ctx, userIDs, NotifSchedule,
		fmt.Sprintf("📅 Lịch thi đấu: %s", event),
		fmt.Sprintf("Ngày: %s | Địa điểm: %s", date, location),
		map[string]string{"event": event, "date": date, "location": location},
	)
}
