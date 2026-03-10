package orchestrator

import (
	"context"
	"fmt"
	"time"

	"vct-platform/backend/internal/domain"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — TOURNAMENT ORCHESTRATOR
// Cross-service coordination for tournament lifecycle.
// ═══════════════════════════════════════════════════════════════

// ── Dependencies (interfaces for loose coupling) ─────────────

// TournamentRepo manages tournament state.
type TournamentRepo interface {
	GetByID(ctx context.Context, id string) (*domain.Tournament, error)
	UpdateStatus(ctx context.Context, id string, status domain.TrangThaiGiai) error
}

// TeamRepo manages team (đoàn) operations.
type TeamRepo interface {
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Team, error)
	UpdateStatus(ctx context.Context, id string, status domain.TrangThaiDoan) error
}

// RegistrationRepo manages content registrations.
type RegistrationRepo interface {
	ListByTournament(ctx context.Context, tournamentID string) ([]domain.Registration, error)
	FreezeAll(ctx context.Context, tournamentID string) error
}

// NotificationSender sends notifications.
type NotificationSender interface {
	NotifyTeams(ctx context.Context, tournamentID string, message string) error
	NotifyUser(ctx context.Context, userID string, title, message string) error
}

// EventPublisher publishes domain events for async processing.
type EventPublisher interface {
	Publish(ctx context.Context, event DomainEvent) error
}

// DomainEvent represents a domain-level event.
type DomainEvent struct {
	ID            string         `json:"id"`
	EventType     string         `json:"event_type"`
	AggregateID   string         `json:"aggregate_id"`
	AggregateType string         `json:"aggregate_type"`
	Payload       map[string]any `json:"payload"`
	OccurredAt    time.Time      `json:"occurred_at"`
	TriggeredBy   string         `json:"triggered_by"`
}

// ── Orchestrator ─────────────────────────────────────────────

// TournamentOrchestrator coordinates cross-service operations.
type TournamentOrchestrator struct {
	tournamentRepo   TournamentRepo
	teamRepo         TeamRepo
	registrationRepo RegistrationRepo
	notifier         NotificationSender
	publisher        EventPublisher
	idGenerator      func() string
}

// NewTournamentOrchestrator creates a tournament orchestrator.
func NewTournamentOrchestrator(
	tournament TournamentRepo,
	team TeamRepo,
	registration RegistrationRepo,
	notifier NotificationSender,
	publisher EventPublisher,
	idGen func() string,
) *TournamentOrchestrator {
	return &TournamentOrchestrator{
		tournamentRepo:   tournament,
		teamRepo:         team,
		registrationRepo: registration,
		notifier:         notifier,
		publisher:        publisher,
		idGenerator:      idGen,
	}
}

// ── Lifecycle Operations ─────────────────────────────────────

// OpenRegistration transitions tournament from "nhap" → "dang_ky".
// Prerequisites: Tournament exists and is in "nhap" status.
func (o *TournamentOrchestrator) OpenRegistration(ctx context.Context, tournamentID, triggeredBy string) error {
	tournament, err := o.tournamentRepo.GetByID(ctx, tournamentID)
	if err != nil {
		return fmt.Errorf("không tìm thấy giải: %w", err)
	}

	if err := domain.ValidateTransition(domain.TournamentTransitions, string(tournament.TrangThai), "dang_ky"); err != nil {
		return fmt.Errorf("không thể mở đăng ký: %w", err)
	}

	if err := o.tournamentRepo.UpdateStatus(ctx, tournamentID, domain.TrangThaiGiaiDangKy); err != nil {
		return err
	}

	// Publish event
	o.publishEvent(ctx, "tournament.registration_opened", tournamentID, "tournament", triggeredBy, nil)

	// Notify
	if o.notifier != nil {
		_ = o.notifier.NotifyTeams(ctx, tournamentID, fmt.Sprintf("Giải %s đã mở đăng ký", tournament.TenGiai))
	}

	return nil
}

// LockRegistration transitions tournament from "dang_ky" → "khoa_dk".
// Side effects:
//  1. Freeze all registrations
//  2. Generate invoices for unpaid teams
//  3. Notify all teams
func (o *TournamentOrchestrator) LockRegistration(ctx context.Context, tournamentID, triggeredBy string) error {
	tournament, err := o.tournamentRepo.GetByID(ctx, tournamentID)
	if err != nil {
		return fmt.Errorf("không tìm thấy giải: %w", err)
	}

	if err := domain.ValidateTransition(domain.TournamentTransitions, string(tournament.TrangThai), "khoa_dk"); err != nil {
		return fmt.Errorf("không thể khóa đăng ký: %w", err)
	}

	// 1. Freeze all registrations
	if err := o.registrationRepo.FreezeAll(ctx, tournamentID); err != nil {
		return fmt.Errorf("không thể đóng băng đăng ký: %w", err)
	}

	// 2. Update tournament status
	if err := o.tournamentRepo.UpdateStatus(ctx, tournamentID, domain.TrangThaiGiaiKhoaDK); err != nil {
		return err
	}

	// 3. Publish event (finance service will listen to generate invoices)
	o.publishEvent(ctx, "tournament.registration_locked", tournamentID, "tournament", triggeredBy, map[string]any{
		"ten_giai": tournament.TenGiai,
	})

	// 4. Notify
	if o.notifier != nil {
		_ = o.notifier.NotifyTeams(ctx, tournamentID, fmt.Sprintf("Đăng ký giải %s đã đóng", tournament.TenGiai))
	}

	return nil
}

// StartCompetition transitions from "khoa_dk" → "thi_dau".
// Prerequisites: All brackets generated, schedule finalized.
func (o *TournamentOrchestrator) StartCompetition(ctx context.Context, tournamentID, triggeredBy string) error {
	tournament, err := o.tournamentRepo.GetByID(ctx, tournamentID)
	if err != nil {
		return fmt.Errorf("không tìm thấy giải: %w", err)
	}

	if err := domain.ValidateTransition(domain.TournamentTransitions, string(tournament.TrangThai), "thi_dau"); err != nil {
		return fmt.Errorf("không thể bắt đầu thi đấu: %w", err)
	}

	if err := o.tournamentRepo.UpdateStatus(ctx, tournamentID, domain.TrangThaiGiaiThiDau); err != nil {
		return err
	}

	o.publishEvent(ctx, "tournament.competition_started", tournamentID, "tournament", triggeredBy, nil)

	return nil
}

// EndTournament transitions from "thi_dau" → "ket_thuc".
// Side effects:
//  1. Finalize all brackets
//  2. Calculate team rankings (medal tally)
//  3. Calculate referee allowances
func (o *TournamentOrchestrator) EndTournament(ctx context.Context, tournamentID, triggeredBy string) error {
	tournament, err := o.tournamentRepo.GetByID(ctx, tournamentID)
	if err != nil {
		return fmt.Errorf("không tìm thấy giải: %w", err)
	}

	if err := domain.ValidateTransition(domain.TournamentTransitions, string(tournament.TrangThai), "ket_thuc"); err != nil {
		return fmt.Errorf("không thể kết thúc giải: %w", err)
	}

	if err := o.tournamentRepo.UpdateStatus(ctx, tournamentID, domain.TrangThaiGiaiKetThuc); err != nil {
		return err
	}

	// Publish event — downstream services listen for:
	//   - ranking service: aggregate team medals
	//   - finance service: calculate referee allowances
	//   - report service: generate summary report
	o.publishEvent(ctx, "tournament.ended", tournamentID, "tournament", triggeredBy, map[string]any{
		"ten_giai": tournament.TenGiai,
	})

	return nil
}

// ── Team Approval Operations ─────────────────────────────────

// ApproveTeam transitions team from "cho_duyet" → "da_xac_nhan".
func (o *TournamentOrchestrator) ApproveTeam(ctx context.Context, teamID, approverID string) error {
	// Validate transition
	if err := domain.ValidateTransition(domain.TeamTransitions, "cho_duyet", "da_xac_nhan"); err != nil {
		return err
	}

	if err := o.teamRepo.UpdateStatus(ctx, teamID, domain.TrangThaiDoanXacNhan); err != nil {
		return err
	}

	o.publishEvent(ctx, "team.approved", teamID, "team", approverID, nil)
	return nil
}

// RejectTeam transitions team from "cho_duyet" → "tu_choi".
func (o *TournamentOrchestrator) RejectTeam(ctx context.Context, teamID, approverID, reason string) error {
	if reason == "" {
		return fmt.Errorf("lý do từ chối là bắt buộc")
	}

	if err := domain.ValidateTransition(domain.TeamTransitions, "cho_duyet", "tu_choi"); err != nil {
		return err
	}

	if err := o.teamRepo.UpdateStatus(ctx, teamID, domain.TrangThaiDoanTuChoi); err != nil {
		return err
	}

	o.publishEvent(ctx, "team.rejected", teamID, "team", approverID, map[string]any{"reason": reason})
	return nil
}

// RequestTeamRevision transitions team from "cho_duyet" → "yeu_cau_bo_sung".
func (o *TournamentOrchestrator) RequestTeamRevision(ctx context.Context, teamID, approverID, note string) error {
	if err := domain.ValidateTransition(domain.TeamTransitions, "cho_duyet", "yeu_cau_bo_sung"); err != nil {
		return err
	}

	if err := o.teamRepo.UpdateStatus(ctx, teamID, domain.TrangThaiDoanYCBS); err != nil {
		return err
	}

	o.publishEvent(ctx, "team.revision_requested", teamID, "team", approverID, map[string]any{"note": note})
	return nil
}

// ConfirmPayment transitions team from "da_xac_nhan" → "da_dong_phi".
func (o *TournamentOrchestrator) ConfirmPayment(ctx context.Context, teamID, confirmerID string) error {
	if err := domain.ValidateTransition(domain.TeamTransitions, "da_xac_nhan", "da_dong_phi"); err != nil {
		return err
	}
	if err := o.teamRepo.UpdateStatus(ctx, teamID, "da_dong_phi"); err != nil {
		return err
	}
	o.publishEvent(ctx, "team.payment_confirmed", teamID, "team", confirmerID, nil)
	return nil
}

// CheckinTeam transitions team from "da_dong_phi" → "da_checkin".
func (o *TournamentOrchestrator) CheckinTeam(ctx context.Context, teamID, staffID string) error {
	if err := domain.ValidateTransition(domain.TeamTransitions, "da_dong_phi", "da_checkin"); err != nil {
		return err
	}
	if err := o.teamRepo.UpdateStatus(ctx, teamID, domain.TrangThaiDoanCheckin); err != nil {
		return err
	}
	o.publishEvent(ctx, "team.checked_in", teamID, "team", staffID, nil)
	return nil
}

// ── Helpers ──────────────────────────────────────────────────

func (o *TournamentOrchestrator) publishEvent(ctx context.Context, eventType, aggregateID, aggregateType, triggeredBy string, payload map[string]any) {
	if o.publisher == nil {
		return
	}
	_ = o.publisher.Publish(ctx, DomainEvent{
		ID:            o.idGenerator(),
		EventType:     eventType,
		AggregateID:   aggregateID,
		AggregateType: aggregateType,
		Payload:       payload,
		OccurredAt:    time.Now().UTC(),
		TriggeredBy:   triggeredBy,
	})
}
