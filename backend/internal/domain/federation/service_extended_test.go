package federation_test

import (
	"context"
	"testing"

	"vct-platform/backend/internal/domain/federation"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — UNIT TESTS FOR PR / INTERNATIONAL / WORKFLOW
// ═══════════════════════════════════════════════════════════════

func setupExtended() *federation.Service {
	svc := setup()
	svc.SetExtendedStores(
		federation.NewMemPRStore(),
		federation.NewMemIntlStore(),
		federation.NewMemWorkflowStore(),
	)
	return svc
}

// ── PR: Article CRUD ─────────────────────────────────────────

func TestListArticles(t *testing.T) {
	svc := setupExtended()
	articles, err := svc.ListArticles(context.Background())
	if err != nil {
		t.Fatalf("ListArticles failed: %v", err)
	}
	if len(articles) < 5 {
		t.Errorf("expected at least 5 seeded articles, got %d", len(articles))
	}
}

func TestCreateAndGetArticle(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	article := federation.NewsArticle{
		Title:    "Bài viết test mới",
		Summary:  "Tóm tắt bài viết",
		Category: "Giải đấu",
		Author:   "Test Author",
	}
	if err := svc.CreateArticle(ctx, article); err != nil {
		t.Fatalf("CreateArticle failed: %v", err)
	}

	articles, _ := svc.ListArticles(ctx)
	found := false
	for _, a := range articles {
		if a.Title == "Bài viết test mới" {
			found = true
			if a.Status != federation.ArticleStatusDraft {
				t.Errorf("expected default status %q, got %q", federation.ArticleStatusDraft, a.Status)
			}
			if a.CreatedAt.IsZero() {
				t.Error("created_at should not be zero")
			}
		}
	}
	if !found {
		t.Error("created article not found in list")
	}
}

func TestUpdateArticle(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	articles, _ := svc.ListArticles(ctx)
	if len(articles) == 0 {
		t.Fatal("no articles to update")
	}
	original := articles[0]
	original.Title = "Tiêu đề đã cập nhật"
	if err := svc.UpdateArticle(ctx, original); err != nil {
		t.Fatalf("UpdateArticle failed: %v", err)
	}

	updated, err := svc.GetArticle(ctx, original.ID)
	if err != nil {
		t.Fatalf("GetArticle failed: %v", err)
	}
	if updated.Title != "Tiêu đề đã cập nhật" {
		t.Errorf("expected updated title, got %q", updated.Title)
	}
}

func TestDeleteArticle(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	articles, _ := svc.ListArticles(ctx)
	original := len(articles)
	if err := svc.DeleteArticle(ctx, articles[0].ID); err != nil {
		t.Fatalf("DeleteArticle failed: %v", err)
	}

	after, _ := svc.ListArticles(ctx)
	if len(after) != original-1 {
		t.Errorf("expected %d articles after delete, got %d", original-1, len(after))
	}
}

func TestPublishArticle(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	// Find a draft article
	articles, _ := svc.ListArticles(ctx)
	var draftID string
	for _, a := range articles {
		if a.Status == federation.ArticleStatusDraft {
			draftID = a.ID
			break
		}
	}
	if draftID == "" {
		t.Skip("no draft article found")
	}

	if err := svc.PublishArticle(ctx, draftID); err != nil {
		t.Fatalf("PublishArticle failed: %v", err)
	}

	published, _ := svc.GetArticle(ctx, draftID)
	if published.Status != federation.ArticleStatusPublished {
		t.Errorf("expected published status, got %q", published.Status)
	}
	if published.PublishedAt == nil {
		t.Error("published_at should be set")
	}
}

// ── International: Partner CRUD ──────────────────────────────

func TestListPartners(t *testing.T) {
	svc := setupExtended()
	partners, err := svc.ListPartners(context.Background())
	if err != nil {
		t.Fatalf("ListPartners failed: %v", err)
	}
	if len(partners) < 4 {
		t.Errorf("expected at least 4 seeded partners, got %d", len(partners))
	}
}

func TestCreateAndGetPartner(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	partner := federation.InternationalPartner{
		Name:    "Test Partner Organization",
		Country: "Nhật Bản",
		Type:    "Lưỡng phương",
		Status:  federation.PartnerStatusActive,
	}
	if err := svc.CreatePartner(ctx, partner); err != nil {
		t.Fatalf("CreatePartner failed: %v", err)
	}

	partners, _ := svc.ListPartners(ctx)
	found := false
	for _, p := range partners {
		if p.Name == "Test Partner Organization" {
			found = true
			if p.CreatedAt.IsZero() {
				t.Error("created_at should not be zero")
			}
		}
	}
	if !found {
		t.Error("created partner not found in list")
	}
}

func TestDeletePartner(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	partners, _ := svc.ListPartners(ctx)
	original := len(partners)
	if err := svc.DeletePartner(ctx, partners[0].ID); err != nil {
		t.Fatalf("DeletePartner failed: %v", err)
	}
	after, _ := svc.ListPartners(ctx)
	if len(after) != original-1 {
		t.Errorf("expected %d partners, got %d", original-1, len(after))
	}
}

// ── International: Event CRUD ────────────────────────────────

func TestListIntlEvents(t *testing.T) {
	svc := setupExtended()
	events, err := svc.ListIntlEvents(context.Background())
	if err != nil {
		t.Fatalf("ListIntlEvents failed: %v", err)
	}
	if len(events) < 2 {
		t.Errorf("expected at least 2 seeded events, got %d", len(events))
	}
}

func TestCreateAndGetIntlEvent(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	event := federation.InternationalEvent{
		Name:     "World Championship 2026",
		Location: "Tokyo",
		Country:  "Nhật Bản",
		Status:   federation.IntlEventPlanning,
	}
	if err := svc.CreateIntlEvent(ctx, event); err != nil {
		t.Fatalf("CreateIntlEvent failed: %v", err)
	}

	events, _ := svc.ListIntlEvents(ctx)
	found := false
	for _, e := range events {
		if e.Name == "World Championship 2026" {
			found = true
		}
	}
	if !found {
		t.Error("created event not found")
	}
}

func TestDeleteIntlEvent(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	events, _ := svc.ListIntlEvents(ctx)
	original := len(events)
	svc.DeleteIntlEvent(ctx, events[0].ID)
	after, _ := svc.ListIntlEvents(ctx)
	if len(after) != original-1 {
		t.Errorf("expected %d events, got %d", original-1, len(after))
	}
}

// ── Workflow: Definition CRUD ────────────────────────────────

func TestListWorkflows(t *testing.T) {
	svc := setupExtended()
	workflows, err := svc.ListWorkflows(context.Background())
	if err != nil {
		t.Fatalf("ListWorkflows failed: %v", err)
	}
	if len(workflows) < 6 {
		t.Errorf("expected at least 6 seeded workflows, got %d", len(workflows))
	}
}

func TestCreateAndGetWorkflow(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	wf := federation.WorkflowDefinition{
		Code:     "test_workflow",
		Name:     "Quy trình Test",
		Category: "CLB",
		Steps: []federation.WorkflowStep{
			{Order: 1, Name: "Bước 1", RoleCode: "club_admin"},
			{Order: 2, Name: "Bước 2", RoleCode: "provincial_admin"},
		},
		IsActive: true,
	}
	if err := svc.CreateWorkflow(ctx, wf); err != nil {
		t.Fatalf("CreateWorkflow failed: %v", err)
	}

	workflows, _ := svc.ListWorkflows(ctx)
	found := false
	for _, w := range workflows {
		if w.Code == "test_workflow" {
			found = true
			if len(w.Steps) != 2 {
				t.Errorf("expected 2 steps, got %d", len(w.Steps))
			}
		}
	}
	if !found {
		t.Error("created workflow not found")
	}
}

func TestToggleWorkflow(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	workflows, _ := svc.ListWorkflows(ctx)
	// Find an active workflow
	var activeID string
	for _, w := range workflows {
		if w.IsActive {
			activeID = w.ID
			break
		}
	}
	if activeID == "" {
		t.Fatal("no active workflow found")
	}

	// Toggle off
	if err := svc.ToggleWorkflow(ctx, activeID, false); err != nil {
		t.Fatalf("ToggleWorkflow(false) failed: %v", err)
	}
	wf, _ := svc.GetWorkflow(ctx, activeID)
	if wf.IsActive {
		t.Error("expected workflow to be inactive")
	}

	// Toggle back on
	if err := svc.ToggleWorkflow(ctx, activeID, true); err != nil {
		t.Fatalf("ToggleWorkflow(true) failed: %v", err)
	}
	wf, _ = svc.GetWorkflow(ctx, activeID)
	if !wf.IsActive {
		t.Error("expected workflow to be active")
	}
}

func TestDeleteWorkflow(t *testing.T) {
	svc := setupExtended()
	ctx := context.Background()

	workflows, _ := svc.ListWorkflows(ctx)
	original := len(workflows)
	svc.DeleteWorkflow(ctx, workflows[0].ID)
	after, _ := svc.ListWorkflows(ctx)
	if len(after) != original-1 {
		t.Errorf("expected %d workflows, got %d", original-1, len(after))
	}
}

// ── Edge Cases ───────────────────────────────────────────────

func TestNilStoresReturnEmpty(t *testing.T) {
	svc := setup() // No extended stores wired
	ctx := context.Background()

	articles, err := svc.ListArticles(ctx)
	if err != nil {
		t.Fatalf("ListArticles with nil store should not error: %v", err)
	}
	if articles != nil {
		t.Errorf("expected nil, got %v", articles)
	}

	partners, _ := svc.ListPartners(ctx)
	if partners != nil {
		t.Error("expected nil partners")
	}

	events, _ := svc.ListIntlEvents(ctx)
	if events != nil {
		t.Error("expected nil events")
	}

	workflows, _ := svc.ListWorkflows(ctx)
	if workflows != nil {
		t.Error("expected nil workflows")
	}
}
