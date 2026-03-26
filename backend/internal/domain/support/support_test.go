package support

import (
	"context"
	"testing"
)

func newTestService() *Service {
	seq := 0
	return NewService(
		NewInMemTicketRepo(),
		NewInMemCategoryRepo(),
		NewInMemFAQRepo(),
		func() string { seq++; return "id-" + string(rune('0'+seq)) },
	)
}

// ── CreateTicket ─────────────────────────────────────────────

func TestCreateTicket_Success(t *testing.T) {
	svc := newTestService()
	ticket, err := svc.CreateTicket(context.Background(), SupportTicket{
		TieuDe:  "Test ticket",
		NoiDung: "Mô tả chi tiết",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if ticket.TrangThai != StatusOpen {
		t.Errorf("expected status open, got %s", ticket.TrangThai)
	}
	if ticket.MucUuTien != PriorityMedium {
		t.Errorf("expected priority medium, got %s", ticket.MucUuTien)
	}
	if ticket.MaTicket == "" {
		t.Error("expected auto-generated MaTicket, got empty")
	}
	if ticket.Loai != TypeGeneral {
		t.Errorf("expected type general, got %s", ticket.Loai)
	}
}

func TestCreateTicket_AutoMaTicket(t *testing.T) {
	svc := newTestService()
	t1, _ := svc.CreateTicket(context.Background(), SupportTicket{TieuDe: "A", NoiDung: "A"})
	t2, _ := svc.CreateTicket(context.Background(), SupportTicket{TieuDe: "B", NoiDung: "B"})
	if t1.MaTicket == t2.MaTicket {
		t.Error("MaTicket should be unique for each ticket")
	}
	if t1.MaTicket != "TK-001" {
		t.Errorf("expected TK-001, got %s", t1.MaTicket)
	}
	if t2.MaTicket != "TK-002" {
		t.Errorf("expected TK-002, got %s", t2.MaTicket)
	}
}

func TestCreateTicket_ValidationErrors(t *testing.T) {
	svc := newTestService()

	_, err := svc.CreateTicket(context.Background(), SupportTicket{NoiDung: "test"})
	if err == nil {
		t.Error("expected error for empty title")
	}

	_, err = svc.CreateTicket(context.Background(), SupportTicket{TieuDe: "test"})
	if err == nil {
		t.Error("expected error for empty content")
	}
}

// ── ListTickets with Pagination/Filtering ────────────────────

func TestListTickets_Pagination(t *testing.T) {
	svc := newTestService()
	for i := 0; i < 25; i++ {
		svc.CreateTicket(context.Background(), SupportTicket{
			TieuDe:  "Ticket " + string(rune('A'+i)),
			NoiDung: "Content",
		})
	}
	result, err := svc.ListTickets(context.Background(), ListFilter{Page: 1, Limit: 10})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Total != 25 {
		t.Errorf("expected total 25, got %d", result.Total)
	}
	if len(result.Items) != 10 {
		t.Errorf("expected 10 items, got %d", len(result.Items))
	}
	if result.TotalPages != 3 {
		t.Errorf("expected 3 pages, got %d", result.TotalPages)
	}
}

func TestListTickets_FilterByStatus(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	t1, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "A"})
	svc.CreateTicket(ctx, SupportTicket{TieuDe: "B", NoiDung: "B"})

	// Put t1 in_progress
	svc.UpdateTicket(ctx, t1.ID, map[string]interface{}{"trang_thai": string(StatusInProgress)})

	result, err := svc.ListTickets(ctx, ListFilter{Status: string(StatusOpen)})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if result.Total != 1 {
		t.Errorf("expected 1 open ticket, got %d", result.Total)
	}
}

func TestListTickets_FilterBySearch(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	svc.CreateTicket(ctx, SupportTicket{TieuDe: "Không thể đăng nhập", NoiDung: "...", NguoiTaoTen: "Nguyễn Văn An"})
	svc.CreateTicket(ctx, SupportTicket{TieuDe: "Lỗi thanh toán", NoiDung: "...", NguoiTaoTen: "Trần Bình"})

	result, _ := svc.ListTickets(ctx, ListFilter{Search: "đăng nhập"})
	if result.Total != 1 {
		t.Errorf("expected 1 result for search, got %d", result.Total)
	}
}

// ── UpdateTicket + State Machine ─────────────────────────────

func TestUpdateTicket_ValidTransition(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	ticket, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})

	// open -> in_progress (valid)
	updated, err := svc.UpdateTicket(ctx, ticket.ID, map[string]interface{}{"trang_thai": string(StatusInProgress)})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if updated.TrangThai != StatusInProgress {
		t.Errorf("expected in_progress, got %s", updated.TrangThai)
	}
}

func TestUpdateTicket_InvalidTransition(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	ticket, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})

	// open -> resolved (invalid, must go through in_progress first)
	_, err := svc.UpdateTicket(ctx, ticket.ID, map[string]interface{}{"trang_thai": string(StatusResolved)})
	if err == nil {
		t.Error("expected error for invalid state transition open -> resolved")
	}
}

func TestUpdateTicket_SetResolvedAt(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	ticket, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})

	svc.UpdateTicket(ctx, ticket.ID, map[string]interface{}{"trang_thai": string(StatusInProgress)})
	resolved, _ := svc.UpdateTicket(ctx, ticket.ID, map[string]interface{}{"trang_thai": string(StatusResolved)})
	if resolved.ResolvedAt == nil {
		t.Error("expected ResolvedAt to be set")
	}
}

// ── DeleteTicket ─────────────────────────────────────────────

func TestDeleteTicket(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	ticket, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})

	err := svc.DeleteTicket(ctx, ticket.ID)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	_, err = svc.GetTicket(ctx, ticket.ID)
	if err == nil {
		t.Error("expected error getting deleted ticket")
	}
}

// ── Replies ──────────────────────────────────────────────────

func TestCreateReply_IncrementsCount(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	ticket, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})

	svc.CreateReply(ctx, TicketReply{TicketID: ticket.ID, NoiDung: "Reply 1", IsStaff: true})
	svc.CreateReply(ctx, TicketReply{TicketID: ticket.ID, NoiDung: "Reply 2", IsStaff: false})

	updated, _ := svc.GetTicket(ctx, ticket.ID)
	if updated.SoTraLoi != 2 {
		t.Errorf("expected 2 replies, got %d", updated.SoTraLoi)
	}
}

func TestCreateReply_SetsFirstReplyAt(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()
	ticket, _ := svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})

	// Non-staff reply should NOT set FirstReplyAt
	svc.CreateReply(ctx, TicketReply{TicketID: ticket.ID, NoiDung: "Customer reply", IsStaff: false})
	t1, _ := svc.GetTicket(ctx, ticket.ID)
	if t1.FirstReplyAt != nil {
		t.Error("FirstReplyAt should not be set by non-staff reply")
	}

	// Staff reply SHOULD set FirstReplyAt
	svc.CreateReply(ctx, TicketReply{TicketID: ticket.ID, NoiDung: "Staff reply", IsStaff: true})
	t2, _ := svc.GetTicket(ctx, ticket.ID)
	if t2.FirstReplyAt == nil {
		t.Error("FirstReplyAt should be set by staff reply")
	}
}

func TestCreateReply_Validation(t *testing.T) {
	svc := newTestService()
	_, err := svc.CreateReply(context.Background(), TicketReply{TicketID: "x"})
	if err == nil {
		t.Error("expected error for empty reply content")
	}
}

// ── Categories ───────────────────────────────────────────────

func TestCategoryCRUD(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	// Create
	cat, err := svc.CreateCategory(ctx, SupportCategory{Ten: "Kỹ thuật", MoTa: "Hỗ trợ kỹ thuật"})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !cat.IsActive {
		t.Error("new category should be active by default")
	}

	// List
	cats, _ := svc.ListCategories(ctx)
	if len(cats) != 1 {
		t.Errorf("expected 1 category, got %d", len(cats))
	}

	// Update
	updated, err := svc.UpdateCategory(ctx, cat.ID, map[string]interface{}{"ten": "Kỹ thuật v2"})
	if err != nil {
		t.Fatalf("update error: %v", err)
	}
	if updated.Ten != "Kỹ thuật v2" {
		t.Errorf("expected updated name, got %s", updated.Ten)
	}

	// Delete
	err = svc.DeleteCategory(ctx, cat.ID)
	if err != nil {
		t.Fatalf("delete error: %v", err)
	}
	cats, _ = svc.ListCategories(ctx)
	if len(cats) != 0 {
		t.Errorf("expected 0 categories after delete, got %d", len(cats))
	}
}

func TestCreateCategory_Validation(t *testing.T) {
	svc := newTestService()
	_, err := svc.CreateCategory(context.Background(), SupportCategory{})
	if err == nil {
		t.Error("expected error for empty category name")
	}
}

// ── FAQs ─────────────────────────────────────────────────────

func TestFAQCRUD(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	// Create
	faq, err := svc.CreateFAQ(ctx, FAQ{CauHoi: "Câu hỏi test?", TraLoi: "Trả lời test."})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !faq.IsActive {
		t.Error("new FAQ should be active by default")
	}

	// Update
	updated, err := svc.UpdateFAQ(ctx, faq.ID, map[string]interface{}{"cau_hoi": "Updated?"})
	if err != nil {
		t.Fatalf("update error: %v", err)
	}
	if updated.CauHoi != "Updated?" {
		t.Errorf("expected updated question, got %s", updated.CauHoi)
	}

	// Delete
	err = svc.DeleteFAQ(ctx, faq.ID)
	if err != nil {
		t.Fatalf("delete error: %v", err)
	}
	faqs, _ := svc.ListFAQs(ctx)
	if len(faqs) != 0 {
		t.Errorf("expected 0 FAQs after delete, got %d", len(faqs))
	}
}

func TestCreateFAQ_Validation(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	_, err := svc.CreateFAQ(ctx, FAQ{TraLoi: "answer"})
	if err == nil {
		t.Error("expected error for empty question")
	}

	_, err = svc.CreateFAQ(ctx, FAQ{CauHoi: "question"})
	if err == nil {
		t.Error("expected error for empty answer")
	}
}

// ── Stats ────────────────────────────────────────────────────

func TestGetStats(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	svc.CreateTicket(ctx, SupportTicket{TieuDe: "A", NoiDung: "B"})
	svc.CreateTicket(ctx, SupportTicket{TieuDe: "C", NoiDung: "D"})
	svc.CreateFAQ(ctx, FAQ{CauHoi: "Q?", TraLoi: "A."})

	stats, err := svc.GetStats(ctx)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if stats.TongTicket != 2 {
		t.Errorf("expected 2 tickets, got %d", stats.TongTicket)
	}
	if stats.DangMo != 2 {
		t.Errorf("expected 2 open, got %d", stats.DangMo)
	}
	if stats.TongFAQ != 1 {
		t.Errorf("expected 1 FAQ, got %d", stats.TongFAQ)
	}
}

// ── State Machine ────────────────────────────────────────────

func TestStateTransitions(t *testing.T) {
	tests := []struct {
		from  Status
		to    Status
		valid bool
	}{
		{StatusOpen, StatusInProgress, true},
		{StatusOpen, StatusClosed, true},
		{StatusOpen, StatusResolved, false}, // must go through in_progress
		{StatusInProgress, StatusResolved, true},
		{StatusInProgress, StatusWaiting, true},
		{StatusInProgress, StatusClosed, true},
		{StatusWaiting, StatusInProgress, true},
		{StatusWaiting, StatusResolved, true},
		{StatusResolved, StatusOpen, true}, // reopen
		{StatusResolved, StatusClosed, true},
		{StatusClosed, StatusOpen, true}, // reopen
		{StatusClosed, StatusInProgress, false},
	}
	for _, tc := range tests {
		got := isValidTransition(tc.from, tc.to)
		if got != tc.valid {
			t.Errorf("transition %s -> %s: expected %v, got %v", tc.from, tc.to, tc.valid, got)
		}
	}
}

// ── Thread Safety ────────────────────────────────────────────

func TestConcurrentCreateTickets(t *testing.T) {
	svc := newTestService()
	ctx := context.Background()

	done := make(chan error, 50)
	for i := 0; i < 50; i++ {
		go func(n int) {
			_, err := svc.CreateTicket(ctx, SupportTicket{
				TieuDe:  "Concurrent ticket",
				NoiDung: "Content",
			})
			done <- err
		}(i)
	}

	for i := 0; i < 50; i++ {
		if err := <-done; err != nil {
			t.Fatalf("concurrent create failed: %v", err)
		}
	}

	result, _ := svc.ListTickets(ctx, ListFilter{Page: 1, Limit: 100})
	if result.Total != 50 {
		t.Errorf("expected 50 tickets, got %d", result.Total)
	}
}
