package domain

import "fmt"

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — STATE MACHINE
// Centralized state transition validation for all entities.
// ═══════════════════════════════════════════════════════════════

// TransitionMap maps each status to its valid next statuses.
type TransitionMap map[string][]string

// ── Tournament Lifecycle ─────────────────────────────────────

var TournamentTransitions = TransitionMap{
	"nhap":     {"dang_ky"},
	"dang_ky":  {"khoa_dk"},
	"khoa_dk":  {"thi_dau", "dang_ky"}, // can reopen registration
	"thi_dau":  {"ket_thuc"},
	"ket_thuc": {}, // terminal
}

// ── Team (Đoàn) Registration ─────────────────────────────────

var TeamTransitions = TransitionMap{
	"nhap":            {"cho_duyet"},
	"cho_duyet":       {"da_xac_nhan", "yeu_cau_bo_sung", "tu_choi"},
	"yeu_cau_bo_sung": {"cho_duyet"},
	"da_xac_nhan":     {"da_dong_phi"},
	"da_dong_phi":     {"da_checkin"},
	"da_checkin":      {},
	"tu_choi":         {"nhap"}, // can re-submit
}

// ── Athlete (VĐV) Status ────────────────────────────────────

var AthleteTransitions = TransitionMap{
	"nhap":         {"cho_xac_nhan"},
	"cho_xac_nhan": {"du_dieu_kien", "thieu_ho_so", "tu_choi"},
	"thieu_ho_so":  {"cho_xac_nhan"},
	"du_dieu_kien": {"da_can", "rut_lui"},
	"da_can":       {"du_dk_thi"},
	"du_dk_thi":    {"dang_thi", "rut_lui"},
	"dang_thi":     {"hoan_thanh"},
	"hoan_thanh":   {},
	"rut_lui":      {},
	"tu_choi":      {"nhap"},
}

// ── Registration (Đăng ký Nội dung) ─────────────────────────

var RegistrationTransitions = TransitionMap{
	"nhap":            {"cho_duyet"},
	"cho_duyet":       {"da_duyet", "tu_choi", "yeu_cau_bo_sung"},
	"yeu_cau_bo_sung": {"cho_duyet"},
	"da_duyet":        {"da_can_ky"},
	"da_can_ky":       {"du_dk_thi"},
	"du_dk_thi":       {"dang_thi", "rut_lui"},
	"dang_thi":        {"hoan_thanh"},
	"hoan_thanh":      {},
	"rut_lui":         {},
	"tu_choi":         {"nhap"},
}

// ── Club (CLB) ──────────────────────────────────────────────

var ClubTransitions = TransitionMap{
	"cho_xem_xet":       {"ld_tinh_duyet", "yeu_cau_bs", "tu_choi"},
	"yeu_cau_bs":        {"cho_xem_xet"},
	"ld_tinh_duyet":     {"ld_quoc_gia_duyet"},
	"ld_quoc_gia_duyet": {"hoat_dong"},
	"hoat_dong":         {"tam_nghi", "giai_the"},
	"tam_nghi":          {"hoat_dong", "giai_the"},
	"giai_the":          {},
	"tu_choi":           {"cho_xem_xet"}, // can re-apply
}

// ── Finance Transaction ─────────────────────────────────────

var TransactionTransitions = TransitionMap{
	"nhap":         {"cho_duyet"},
	"cho_duyet":    {"da_duyet", "tu_choi"},
	"da_duyet":     {"da_thuc_hien"},
	"da_thuc_hien": {},
	"tu_choi":      {"nhap"},
}

// ── Invoice ─────────────────────────────────────────────────

var InvoiceTransitions = TransitionMap{
	"draft":          {"pending", "cancelled"},
	"pending":        {"approved", "returned", "cancelled"},
	"returned":       {"draft"},
	"approved":       {"sent"},
	"sent":           {"partially_paid", "paid", "overdue"},
	"partially_paid": {"paid"},
	"paid":           {"completed"},
	"overdue":        {"paid", "cancelled"},
	"completed":      {},
	"cancelled":      {},
}

// ── Belt Exam ───────────────────────────────────────────────

var BeltExamTransitions = TransitionMap{
	"dang_ky_thi":   {"cho_duyet_dk"},
	"cho_duyet_dk":  {"du_dk", "khong_du"},
	"khong_du":      {},
	"du_dk":         {"thi_thuc_hanh"},
	"thi_thuc_hanh": {"dat", "khong_dat"},
	"dat":           {"cho_cap_bang"},
	"khong_dat":     {},
	"cho_cap_bang":  {"da_thang_dai"},
	"da_thang_dai":  {},
}

// ── Appeal (Khiếu nại) ──────────────────────────────────────

var AppealTransitions = TransitionMap{
	"nop":         {"tiep_nhan"},
	"tiep_nhan":   {"xem_xet"},
	"xem_xet":     {"chap_nhan", "bac_bo"},
	"chap_nhan":   {"sua_ket_qua", "hoan_tat"},
	"sua_ket_qua": {"hoan_tat"},
	"bac_bo":      {"hoan_tat"},
	"hoan_tat":    {},
}

// ── Match ───────────────────────────────────────────────────

var MatchTransitions = TransitionMap{
	"scheduled":   {"ready", "cancelled"},
	"ready":       {"in_progress"},
	"in_progress": {"paused", "completed", "cancelled"},
	"paused":      {"in_progress", "cancelled"},
	"completed":   {"confirmed"},
	"confirmed":   {"published"},
	"published":   {},
	"cancelled":   {},
}

// ── Sponsorship ─────────────────────────────────────────────

var SponsorshipTransitions = TransitionMap{
	"prospecting": {"negotiating", "lost"},
	"negotiating": {"signed", "lost"},
	"signed":      {"active"},
	"active":      {"completed", "terminated"},
	"completed":   {},
	"terminated":  {},
	"lost":        {},
}

// ── Transition Validator ─────────────────────────────────────

// ValidateTransition checks if a status transition is allowed.
func ValidateTransition(transitions TransitionMap, from, to string) error {
	allowed, exists := transitions[from]
	if !exists {
		return fmt.Errorf("trạng thái '%s' không hợp lệ", from)
	}
	for _, s := range allowed {
		if s == to {
			return nil
		}
	}
	return fmt.Errorf("không thể chuyển từ '%s' sang '%s'", from, to)
}

// GetAllowedTransitions returns the valid next statuses for a given status.
func GetAllowedTransitions(transitions TransitionMap, from string) []string {
	allowed, exists := transitions[from]
	if !exists {
		return nil
	}
	return allowed
}

// IsTerminalState returns true if no further transitions are possible.
func IsTerminalState(transitions TransitionMap, status string) bool {
	allowed, exists := transitions[status]
	if !exists {
		return true
	}
	return len(allowed) == 0
}
