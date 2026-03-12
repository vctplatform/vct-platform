package btc

import (
	"context"
	"testing"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — BTC (Ban Tổ Chức) Service Tests
// ═══════════════════════════════════════════════════════════════

func idGen() string { return "BTC-TEST-ID" }

var ctx = context.Background()

func newTestService() *Service {
	return NewService(NewInMemStore(), idGen)
}

// ── Member Tests ─────────────────────────────────────────────

func TestCreateMember(t *testing.T) {
	svc := newTestService()
	m := &BTCMember{Ten: "Nguyễn Văn A", Ban: "trong_tai", ChucVu: "Trưởng Ban", GiaiID: "G-001"}
	if err := svc.CreateMember(ctx, m); err != nil {
		t.Fatalf("CreateMember: %v", err)
	}
	if m.ID == "" {
		t.Error("expected ID to be generated")
	}
	if !m.IsActive {
		t.Error("expected IsActive to be true")
	}
}

func TestCreateMemberValidation(t *testing.T) {
	svc := newTestService()
	// Missing ten
	if err := svc.CreateMember(ctx, &BTCMember{Ban: "trong_tai"}); err == nil {
		t.Error("expected error for missing ten")
	}
	// Missing ban
	if err := svc.CreateMember(ctx, &BTCMember{Ten: "Test"}); err == nil {
		t.Error("expected error for missing ban")
	}
}

func TestListMembers(t *testing.T) {
	svc := newTestService()
	members, err := svc.ListMembers(ctx, "G-SEED")
	if err != nil {
		t.Fatalf("ListMembers: %v", err)
	}
	// Should have seed data
	_ = members
}

// ── Weigh-In Tests ───────────────────────────────────────────

func TestCreateWeighIn(t *testing.T) {
	svc := newTestService()
	w := &WeighInRecord{
		GiaiID:  "G-001",
		VdvID:   "VDV-001",
		VdvTen:  "Trần Văn B",
		HangCan: "55kg",
		CanNang: 54.5,
		GioiHan: 55.0,
		SaiSo:   0.5,
	}
	if err := svc.CreateWeighIn(ctx, w); err != nil {
		t.Fatalf("CreateWeighIn: %v", err)
	}
	if w.KetQua != "dat" {
		t.Errorf("expected ket_qua='dat', got %s (cân nặng %.1f <= giới hạn %.1f)", w.KetQua, w.CanNang, w.GioiHan)
	}
}

func TestCreateWeighInOverweight(t *testing.T) {
	svc := newTestService()
	w := &WeighInRecord{
		GiaiID: "G-001", VdvID: "VDV-002", VdvTen: "Test", HangCan: "55kg",
		CanNang: 57.0, GioiHan: 55.0, SaiSo: 0.5,
	}
	if err := svc.CreateWeighIn(ctx, w); err != nil {
		t.Fatalf("CreateWeighIn: %v", err)
	}
	if w.KetQua != "khong_dat" {
		t.Errorf("expected khong_dat for overweight, got %s", w.KetQua)
	}
}

func TestCreateWeighInValidation(t *testing.T) {
	svc := newTestService()
	// Missing VdvID
	if err := svc.CreateWeighIn(ctx, &WeighInRecord{HangCan: "55kg", CanNang: 50}); err == nil {
		t.Error("expected error for missing VdvID")
	}
	// Zero weight
	if err := svc.CreateWeighIn(ctx, &WeighInRecord{VdvID: "V", HangCan: "55kg", CanNang: 0}); err == nil {
		t.Error("expected error for zero weight")
	}
}

// ── Draw Tests ───────────────────────────────────────────────

func TestGenerateDraw(t *testing.T) {
	svc := newTestService()
	input := DrawInput{
		GiaiID:    "G-001",
		NoiDungID: "ND-001",
		LoaiND:    "doi_khang",
		Athletes: []DrawBranch{
			{VdvID: "V1", VdvTen: "A", DoanTen: "HN"},
			{VdvID: "V2", VdvTen: "B", DoanTen: "SG"},
			{VdvID: "V3", VdvTen: "C", DoanTen: "DN"},
			{VdvID: "V4", VdvTen: "D", DoanTen: "CT"},
		},
	}
	result, err := svc.GenerateDraw(ctx, input)
	if err != nil {
		t.Fatalf("GenerateDraw: %v", err)
	}
	if result.SoVDV != 4 {
		t.Errorf("expected 4 athletes, got %d", result.SoVDV)
	}
	if len(result.Nhanh) != 4 {
		t.Errorf("expected 4 branches, got %d", len(result.Nhanh))
	}
}

func TestGenerateDrawTooFewAthletes(t *testing.T) {
	svc := newTestService()
	input := DrawInput{Athletes: []DrawBranch{{VdvID: "V1"}}}
	_, err := svc.GenerateDraw(ctx, input)
	if err == nil {
		t.Error("expected error for < 2 athletes")
	}
}

// ── Finance Tests ────────────────────────────────────────────

func TestCreateFinance(t *testing.T) {
	svc := newTestService()
	f := &FinanceEntry{GiaiID: "G-001", Loai: "thu", SoTien: 5000000, MoTa: "Phí đăng ký"}
	if err := svc.CreateFinance(ctx, f); err != nil {
		t.Fatalf("CreateFinance: %v", err)
	}
	if f.ID == "" {
		t.Error("expected ID")
	}
}

func TestCreateFinanceValidation(t *testing.T) {
	svc := newTestService()
	if err := svc.CreateFinance(ctx, &FinanceEntry{Loai: "thu", SoTien: 0}); err == nil {
		t.Error("expected error for zero amount")
	}
	if err := svc.CreateFinance(ctx, &FinanceEntry{Loai: "invalid", SoTien: 100}); err == nil {
		t.Error("expected error for invalid type")
	}
}

func TestFinanceSummary(t *testing.T) {
	svc := newTestService()
	svc.CreateFinance(ctx, &FinanceEntry{GiaiID: "G-FS", Loai: "thu", SoTien: 10000000})
	svc.CreateFinance(ctx, &FinanceEntry{GiaiID: "G-FS", Loai: "chi", SoTien: 3000000})

	summary, err := svc.FinanceSummary(ctx, "G-FS")
	if err != nil {
		t.Fatalf("FinanceSummary: %v", err)
	}
	if summary.TongThu != 10000000 {
		t.Errorf("expected tong_thu 10M, got %.0f", summary.TongThu)
	}
	if summary.SoDu != 7000000 {
		t.Errorf("expected so_du 7M, got %.0f", summary.SoDu)
	}
}

// ── Protest Tests ────────────────────────────────────────────

func TestCreateProtest(t *testing.T) {
	svc := newTestService()
	p := &Protest{GiaiID: "G-001", LyDo: "Trọng tài thiên vị", NguoiNop: "Đoàn HN"}
	if err := svc.CreateProtest(ctx, p); err != nil {
		t.Fatalf("CreateProtest: %v", err)
	}
	if p.TrangThai != "moi" {
		t.Errorf("expected status 'moi', got %s", p.TrangThai)
	}
}

func TestCreateProtestValidation(t *testing.T) {
	svc := newTestService()
	if err := svc.CreateProtest(ctx, &Protest{GiaiID: "G-001"}); err == nil {
		t.Error("expected error for missing ly_do")
	}
}

// ── Meeting Tests ────────────────────────────────────────────

func TestCreateMeeting(t *testing.T) {
	svc := newTestService()
	m := &TechnicalMeeting{GiaiID: "G-001", TieuDe: "Họp kỹ thuật khai mạc"}
	if err := svc.CreateMeeting(ctx, m); err != nil {
		t.Fatalf("CreateMeeting: %v", err)
	}
	if m.TrangThai != "du_kien" {
		t.Errorf("expected status 'du_kien', got %s", m.TrangThai)
	}
}

func TestCreateMeetingValidation(t *testing.T) {
	svc := newTestService()
	if err := svc.CreateMeeting(ctx, &TechnicalMeeting{GiaiID: "G-1"}); err == nil {
		t.Error("expected error for missing title")
	}
}

// ── Stats Tests ──────────────────────────────────────────────

func TestGetStats(t *testing.T) {
	svc := newTestService()
	stats, err := svc.GetStats(ctx, "G-SEED")
	if err != nil {
		t.Fatalf("GetStats: %v", err)
	}
	if stats == nil {
		t.Fatal("expected non-nil stats")
	}
}

// ── Assignment Tests ─────────────────────────────────────────

func TestCreateAssignment(t *testing.T) {
	svc := newTestService()
	a := &RefereeAssignment{
		GiaiID: "G-001", TrongTaiID: "TT-001", TrongTaiTen: "Trọng tài A",
		SanID: "SAN-01", Ngay: "2026-06-15", Phien: "sang",
	}
	if err := svc.CreateAssignment(ctx, a); err != nil {
		t.Fatalf("CreateAssignment: %v", err)
	}
}

func TestCreateAssignmentConflict(t *testing.T) {
	svc := newTestService()
	a := &RefereeAssignment{
		GiaiID: "G-C", TrongTaiID: "TT-C", TrongTaiTen: "TT",
		SanID: "SAN-1", Ngay: "2026-06-15", Phien: "sang",
	}
	_ = svc.CreateAssignment(ctx, a)
	// Same referee, same time
	dup := &RefereeAssignment{
		GiaiID: "G-C", TrongTaiID: "TT-C", TrongTaiTen: "TT",
		SanID: "SAN-2", Ngay: "2026-06-15", Phien: "sang",
	}
	if err := svc.CreateAssignment(ctx, dup); err == nil {
		t.Error("expected conflict error for double-booking")
	}
}
