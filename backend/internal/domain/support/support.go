package support

import (
	"context"
	"fmt"
	"sort"
	"strings"
	"sync"
	"time"
)

// ── Domain Models ────────────────────────────────────────────

// Priority levels for support tickets.
type Priority string

const (
	PriorityLow      Priority = "low"
	PriorityMedium   Priority = "medium"
	PriorityHigh     Priority = "high"
	PriorityCritical Priority = "critical"
)

// Ticket statuses.
type Status string

const (
	StatusOpen       Status = "open"
	StatusInProgress Status = "in_progress"
	StatusWaiting    Status = "waiting_customer"
	StatusResolved   Status = "resolved"
	StatusClosed     Status = "closed"
)

// Ticket types.
type TicketType string

const (
	TypeAccount    TicketType = "account"
	TypeTechnical  TicketType = "technical"
	TypeTournament TicketType = "tournament"
	TypePayment    TicketType = "payment"
	TypeGeneral    TicketType = "general"
)

// SupportTicket represents a customer support / technical assistance request.
type SupportTicket struct {
	ID            string     `json:"id"`
	MaTicket      string     `json:"ma_ticket"`    // e.g. TK-001
	TieuDe        string     `json:"tieu_de"`      // title
	NoiDung       string     `json:"noi_dung"`     // description body
	Loai          TicketType `json:"loai"`         // type
	MucUuTien     Priority   `json:"muc_uu_tien"`  // priority
	TrangThai     Status     `json:"trang_thai"`   // status
	DanhMucID     string     `json:"danh_muc_id"`  // category id
	NguoiTaoID    string     `json:"nguoi_tao_id"` // reporter user id
	NguoiTaoTen   string     `json:"nguoi_tao_ten"`
	NguoiTaoEmail string     `json:"nguoi_tao_email"`
	NguoiXuLyID   string     `json:"nguoi_xu_ly_id,omitempty"` // assignee
	NguoiXuLyTen  string     `json:"nguoi_xu_ly_ten,omitempty"`
	SoTraLoi      int        `json:"so_tra_loi"`     // reply count
	Tags          []string   `json:"tags,omitempty"` // searchable tags
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
	FirstReplyAt  *time.Time `json:"first_reply_at,omitempty"`
	ResolvedAt    *time.Time `json:"resolved_at,omitempty"`
	ClosedAt      *time.Time `json:"closed_at,omitempty"`
}

// TicketReply represents a reply/comment on a support ticket.
type TicketReply struct {
	ID         string    `json:"id"`
	TicketID   string    `json:"ticket_id"`
	NoiDung    string    `json:"noi_dung"`
	NguoiTra   string    `json:"nguoi_tra"`    // replier name
	NguoiTraID string    `json:"nguoi_tra_id"` // replier user id
	IsStaff    bool      `json:"is_staff"`     // true if replied by support staff
	CreatedAt  time.Time `json:"created_at"`
}

// SupportCategory represents a category for organizing support topics.
type SupportCategory struct {
	ID        string    `json:"id"`
	Ten       string    `json:"ten"`       // name
	MoTa      string    `json:"mo_ta"`     // description
	Icon      string    `json:"icon"`      // icon identifier
	MauSac    string    `json:"mau_sac"`   // color hex
	ThuTu     int       `json:"thu_tu"`    // display order
	SoTicket  int       `json:"so_ticket"` // ticket count
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// FAQ represents a Frequently Asked Question entry.
type FAQ struct {
	ID        string    `json:"id"`
	CauHoi    string    `json:"cau_hoi"`     // question
	TraLoi    string    `json:"tra_loi"`     // answer
	DanhMucID string    `json:"danh_muc_id"` // category id
	DanhMuc   string    `json:"danh_muc"`    // category name
	LuotXem   int       `json:"luot_xem"`    // view count
	ThuTu     int       `json:"thu_tu"`      // display order
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Attachment represents a file attached to a ticket or reply.
type Attachment struct {
	ID        string    `json:"id"`
	TicketID  string    `json:"ticket_id"`
	ReplyID   string    `json:"reply_id,omitempty"`
	Filename  string    `json:"filename"`
	MimeType  string    `json:"mime_type"`
	SizeBytes int64     `json:"size_bytes"`
	URL       string    `json:"url"`
	CreatedAt time.Time `json:"created_at"`
}

// SupportStats holds dashboard-level statistics for the support module.
type SupportStats struct {
	TongTicket    int     `json:"tong_ticket"`
	DangMo        int     `json:"dang_mo"`
	DangXuLy      int     `json:"dang_xu_ly"`
	DaDong        int     `json:"da_dong"`
	ChoKhachHang  int     `json:"cho_khach_hang"`
	TBPhanHoiGio  float64 `json:"tb_phan_hoi_gio"`  // average response time in hours
	TyLeGiaiQuyet float64 `json:"ty_le_giai_quyet"` // resolution rate %
	TongFAQ       int     `json:"tong_faq"`
	SLAViolations int     `json:"sla_violations"` // critical tickets still open
}

// ListFilter contains query parameters for filtering ticket lists.
type ListFilter struct {
	Page     int    `json:"page"`
	Limit    int    `json:"limit"`
	Status   string `json:"status,omitempty"`
	Priority string `json:"priority,omitempty"`
	Type     string `json:"type,omitempty"`
	Search   string `json:"search,omitempty"`
	UserID   string `json:"user_id,omitempty"` // filter by creator
}

// PagedResult wraps a page of items with pagination metadata.
type PagedResult[T any] struct {
	Items      []T `json:"items"`
	Total      int `json:"total"`
	Page       int `json:"page"`
	Limit      int `json:"limit"`
	TotalPages int `json:"total_pages"`
}

// ── Repositories ─────────────────────────────────────────────

type TicketRepository interface {
	List(ctx context.Context, filter ListFilter) (*PagedResult[SupportTicket], error)
	GetByID(ctx context.Context, id string) (*SupportTicket, error)
	Create(ctx context.Context, t SupportTicket) (*SupportTicket, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*SupportTicket, error)
	Delete(ctx context.Context, id string) error
	ListReplies(ctx context.Context, ticketID string) ([]TicketReply, error)
	CreateReply(ctx context.Context, r TicketReply) (*TicketReply, error)
	CountByStatus(ctx context.Context) (map[Status]int, error)
}

type CategoryRepository interface {
	List(ctx context.Context) ([]SupportCategory, error)
	GetByID(ctx context.Context, id string) (*SupportCategory, error)
	Create(ctx context.Context, c SupportCategory) (*SupportCategory, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*SupportCategory, error)
	Delete(ctx context.Context, id string) error
}

type FAQRepository interface {
	List(ctx context.Context) ([]FAQ, error)
	GetByID(ctx context.Context, id string) (*FAQ, error)
	Create(ctx context.Context, f FAQ) (*FAQ, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) (*FAQ, error)
	Delete(ctx context.Context, id string) error
}

// ── In-Memory Repositories (with sync.RWMutex) ─────────────

type inMemTicketRepo struct {
	mu      sync.RWMutex
	tickets []SupportTicket
	replies []TicketReply
	nextSeq int
}

func NewInMemTicketRepo() TicketRepository {
	return &inMemTicketRepo{nextSeq: 1}
}

func (r *inMemTicketRepo) List(ctx context.Context, filter ListFilter) (*PagedResult[SupportTicket], error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	// Filter
	var filtered []SupportTicket
	for _, t := range r.tickets {
		if filter.Status != "" && string(t.TrangThai) != filter.Status {
			continue
		}
		if filter.Priority != "" && string(t.MucUuTien) != filter.Priority {
			continue
		}
		if filter.Type != "" && string(t.Loai) != filter.Type {
			continue
		}
		if filter.UserID != "" && t.NguoiTaoID != filter.UserID {
			continue
		}
		if filter.Search != "" {
			q := strings.ToLower(filter.Search)
			if !strings.Contains(strings.ToLower(t.TieuDe), q) &&
				!strings.Contains(strings.ToLower(t.MaTicket), q) &&
				!strings.Contains(strings.ToLower(t.NguoiTaoTen), q) {
				continue
			}
		}
		filtered = append(filtered, t)
	}

	// Sort by created_at descending (newest first)
	sort.Slice(filtered, func(i, j int) bool {
		return filtered[i].CreatedAt.After(filtered[j].CreatedAt)
	})

	total := len(filtered)
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 20
	}
	totalPages := (total + limit - 1) / limit
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	return &PagedResult[SupportTicket]{
		Items:      filtered[start:end],
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (r *inMemTicketRepo) GetByID(ctx context.Context, id string) (*SupportTicket, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for i := range r.tickets {
		if r.tickets[i].ID == id {
			t := r.tickets[i] // copy
			return &t, nil
		}
	}
	return nil, fmt.Errorf("ticket %s không tồn tại", id)
}

func (r *inMemTicketRepo) Create(ctx context.Context, t SupportTicket) (*SupportTicket, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	t.CreatedAt = now
	t.UpdatedAt = now
	r.tickets = append(r.tickets, t)
	r.nextSeq++
	return &t, nil
}

func (r *inMemTicketRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*SupportTicket, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.tickets {
		if r.tickets[i].ID == id {
			if v, ok := patch["trang_thai"].(string); ok {
				r.tickets[i].TrangThai = Status(v)
				now := time.Now()
				if Status(v) == StatusResolved {
					r.tickets[i].ResolvedAt = &now
				}
				if Status(v) == StatusClosed {
					r.tickets[i].ClosedAt = &now
				}
			}
			if v, ok := patch["nguoi_xu_ly_id"].(string); ok {
				r.tickets[i].NguoiXuLyID = v
			}
			if v, ok := patch["nguoi_xu_ly_ten"].(string); ok {
				r.tickets[i].NguoiXuLyTen = v
			}
			if v, ok := patch["muc_uu_tien"].(string); ok {
				r.tickets[i].MucUuTien = Priority(v)
			}
			if v, ok := patch["tieu_de"].(string); ok {
				r.tickets[i].TieuDe = v
			}
			if v, ok := patch["noi_dung"].(string); ok {
				r.tickets[i].NoiDung = v
			}
			r.tickets[i].UpdatedAt = time.Now()
			t := r.tickets[i]
			return &t, nil
		}
	}
	return nil, fmt.Errorf("ticket %s không tồn tại", id)
}

func (r *inMemTicketRepo) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.tickets {
		if r.tickets[i].ID == id {
			r.tickets = append(r.tickets[:i], r.tickets[i+1:]...)
			// Also remove replies
			var kept []TicketReply
			for _, rp := range r.replies {
				if rp.TicketID != id {
					kept = append(kept, rp)
				}
			}
			r.replies = kept
			return nil
		}
	}
	return fmt.Errorf("ticket %s không tồn tại", id)
}

func (r *inMemTicketRepo) ListReplies(ctx context.Context, ticketID string) ([]TicketReply, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	var result []TicketReply
	for _, reply := range r.replies {
		if reply.TicketID == ticketID {
			result = append(result, reply)
		}
	}
	return result, nil
}

func (r *inMemTicketRepo) CreateReply(ctx context.Context, reply TicketReply) (*TicketReply, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	reply.CreatedAt = time.Now()
	r.replies = append(r.replies, reply)
	// Update reply count and first reply timestamp on ticket
	for i := range r.tickets {
		if r.tickets[i].ID == reply.TicketID {
			r.tickets[i].SoTraLoi++
			r.tickets[i].UpdatedAt = time.Now()
			if r.tickets[i].FirstReplyAt == nil && reply.IsStaff {
				now := time.Now()
				r.tickets[i].FirstReplyAt = &now
			}
			break
		}
	}
	return &reply, nil
}

func (r *inMemTicketRepo) CountByStatus(ctx context.Context) (map[Status]int, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	counts := make(map[Status]int)
	for _, t := range r.tickets {
		counts[t.TrangThai]++
	}
	return counts, nil
}

// ── In-Memory Category Repo ─────────────────────────────────

type inMemCategoryRepo struct {
	mu         sync.RWMutex
	categories []SupportCategory
}

func NewInMemCategoryRepo() CategoryRepository {
	return &inMemCategoryRepo{}
}

func (r *inMemCategoryRepo) List(ctx context.Context) ([]SupportCategory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]SupportCategory, len(r.categories))
	copy(out, r.categories)
	return out, nil
}

func (r *inMemCategoryRepo) GetByID(ctx context.Context, id string) (*SupportCategory, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for i := range r.categories {
		if r.categories[i].ID == id {
			c := r.categories[i]
			return &c, nil
		}
	}
	return nil, fmt.Errorf("danh mục %s không tồn tại", id)
}

func (r *inMemCategoryRepo) Create(ctx context.Context, c SupportCategory) (*SupportCategory, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	c.CreatedAt = now
	c.UpdatedAt = now
	r.categories = append(r.categories, c)
	return &c, nil
}

func (r *inMemCategoryRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*SupportCategory, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.categories {
		if r.categories[i].ID == id {
			if v, ok := patch["ten"].(string); ok {
				r.categories[i].Ten = v
			}
			if v, ok := patch["mo_ta"].(string); ok {
				r.categories[i].MoTa = v
			}
			if v, ok := patch["icon"].(string); ok {
				r.categories[i].Icon = v
			}
			if v, ok := patch["mau_sac"].(string); ok {
				r.categories[i].MauSac = v
			}
			if v, ok := patch["is_active"].(bool); ok {
				r.categories[i].IsActive = v
			}
			r.categories[i].UpdatedAt = time.Now()
			c := r.categories[i]
			return &c, nil
		}
	}
	return nil, fmt.Errorf("danh mục %s không tồn tại", id)
}

func (r *inMemCategoryRepo) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.categories {
		if r.categories[i].ID == id {
			r.categories = append(r.categories[:i], r.categories[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("danh mục %s không tồn tại", id)
}

// ── In-Memory FAQ Repo ──────────────────────────────────────

type inMemFAQRepo struct {
	mu   sync.RWMutex
	faqs []FAQ
}

func NewInMemFAQRepo() FAQRepository {
	return &inMemFAQRepo{}
}

func (r *inMemFAQRepo) List(ctx context.Context) ([]FAQ, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	out := make([]FAQ, len(r.faqs))
	copy(out, r.faqs)
	return out, nil
}

func (r *inMemFAQRepo) GetByID(ctx context.Context, id string) (*FAQ, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	for i := range r.faqs {
		if r.faqs[i].ID == id {
			f := r.faqs[i]
			return &f, nil
		}
	}
	return nil, fmt.Errorf("FAQ %s không tồn tại", id)
}

func (r *inMemFAQRepo) Create(ctx context.Context, f FAQ) (*FAQ, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	f.CreatedAt = now
	f.UpdatedAt = now
	r.faqs = append(r.faqs, f)
	return &f, nil
}

func (r *inMemFAQRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*FAQ, error) {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.faqs {
		if r.faqs[i].ID == id {
			if v, ok := patch["cau_hoi"].(string); ok {
				r.faqs[i].CauHoi = v
			}
			if v, ok := patch["tra_loi"].(string); ok {
				r.faqs[i].TraLoi = v
			}
			if v, ok := patch["danh_muc"].(string); ok {
				r.faqs[i].DanhMuc = v
			}
			if v, ok := patch["danh_muc_id"].(string); ok {
				r.faqs[i].DanhMucID = v
			}
			if v, ok := patch["is_active"].(bool); ok {
				r.faqs[i].IsActive = v
			}
			if v, ok := patch["thu_tu"].(float64); ok {
				r.faqs[i].ThuTu = int(v)
			}
			r.faqs[i].UpdatedAt = time.Now()
			f := r.faqs[i]
			return &f, nil
		}
	}
	return nil, fmt.Errorf("FAQ %s không tồn tại", id)
}

func (r *inMemFAQRepo) Delete(ctx context.Context, id string) error {
	r.mu.Lock()
	defer r.mu.Unlock()
	for i := range r.faqs {
		if r.faqs[i].ID == id {
			r.faqs = append(r.faqs[:i], r.faqs[i+1:]...)
			return nil
		}
	}
	return fmt.Errorf("FAQ %s không tồn tại", id)
}

// ── Service ──────────────────────────────────────────────────

type Service struct {
	ticketRepo   TicketRepository
	categoryRepo CategoryRepository
	faqRepo      FAQRepository
	newID        func() string
	mu           sync.Mutex // protects ticket sequence counter
	ticketSeq    int
}

func NewService(t TicketRepository, c CategoryRepository, f FAQRepository, newID func() string) *Service {
	return &Service{ticketRepo: t, categoryRepo: c, faqRepo: f, newID: newID, ticketSeq: 0}
}

func (s *Service) nextMaTicket() string {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ticketSeq++
	return fmt.Sprintf("TK-%03d", s.ticketSeq)
}

// ── Ticket operations ────────────────────────────────────────

func (s *Service) ListTickets(ctx context.Context, filter ListFilter) (*PagedResult[SupportTicket], error) {
	return s.ticketRepo.List(ctx, filter)
}

func (s *Service) GetTicket(ctx context.Context, id string) (*SupportTicket, error) {
	return s.ticketRepo.GetByID(ctx, id)
}

func (s *Service) CreateTicket(ctx context.Context, t SupportTicket) (*SupportTicket, error) {
	if t.TieuDe == "" {
		return nil, fmt.Errorf("tiêu đề ticket không được để trống")
	}
	if t.NoiDung == "" {
		return nil, fmt.Errorf("nội dung ticket không được để trống")
	}
	if t.ID == "" {
		t.ID = s.newID()
	}
	// Auto-generate MaTicket if not provided
	if t.MaTicket == "" {
		t.MaTicket = s.nextMaTicket()
	}
	if t.TrangThai == "" {
		t.TrangThai = StatusOpen
	}
	if t.MucUuTien == "" {
		t.MucUuTien = PriorityMedium
	}
	if t.Loai == "" {
		t.Loai = TypeGeneral
	}
	return s.ticketRepo.Create(ctx, t)
}

func (s *Service) UpdateTicket(ctx context.Context, id string, patch map[string]interface{}) (*SupportTicket, error) {
	// Validate status transitions if status is being changed
	if newStatus, ok := patch["trang_thai"].(string); ok {
		ticket, err := s.ticketRepo.GetByID(ctx, id)
		if err != nil {
			return nil, err
		}
		if !isValidTransition(ticket.TrangThai, Status(newStatus)) {
			return nil, fmt.Errorf("không thể chuyển trạng thái từ %s sang %s", ticket.TrangThai, newStatus)
		}
	}
	return s.ticketRepo.Update(ctx, id, patch)
}

func (s *Service) DeleteTicket(ctx context.Context, id string) error {
	return s.ticketRepo.Delete(ctx, id)
}

func (s *Service) ListReplies(ctx context.Context, ticketID string) ([]TicketReply, error) {
	return s.ticketRepo.ListReplies(ctx, ticketID)
}

func (s *Service) CreateReply(ctx context.Context, r TicketReply) (*TicketReply, error) {
	if r.NoiDung == "" {
		return nil, fmt.Errorf("nội dung phản hồi không được để trống")
	}
	if r.ID == "" {
		r.ID = s.newID()
	}
	return s.ticketRepo.CreateReply(ctx, r)
}

// ── Category operations ──────────────────────────────────────

func (s *Service) ListCategories(ctx context.Context) ([]SupportCategory, error) {
	return s.categoryRepo.List(ctx)
}

func (s *Service) GetCategory(ctx context.Context, id string) (*SupportCategory, error) {
	return s.categoryRepo.GetByID(ctx, id)
}

func (s *Service) CreateCategory(ctx context.Context, c SupportCategory) (*SupportCategory, error) {
	if c.Ten == "" {
		return nil, fmt.Errorf("tên danh mục không được để trống")
	}
	if c.ID == "" {
		c.ID = s.newID()
	}
	// Explicitly default to active only when not set from API
	c.IsActive = true
	return s.categoryRepo.Create(ctx, c)
}

func (s *Service) UpdateCategory(ctx context.Context, id string, patch map[string]interface{}) (*SupportCategory, error) {
	return s.categoryRepo.Update(ctx, id, patch)
}

func (s *Service) DeleteCategory(ctx context.Context, id string) error {
	return s.categoryRepo.Delete(ctx, id)
}

// ── FAQ operations ───────────────────────────────────────────

func (s *Service) ListFAQs(ctx context.Context) ([]FAQ, error) {
	return s.faqRepo.List(ctx)
}

func (s *Service) GetFAQ(ctx context.Context, id string) (*FAQ, error) {
	return s.faqRepo.GetByID(ctx, id)
}

func (s *Service) CreateFAQ(ctx context.Context, f FAQ) (*FAQ, error) {
	if f.CauHoi == "" {
		return nil, fmt.Errorf("câu hỏi FAQ không được để trống")
	}
	if f.TraLoi == "" {
		return nil, fmt.Errorf("câu trả lời FAQ không được để trống")
	}
	if f.ID == "" {
		f.ID = s.newID()
	}
	f.IsActive = true
	return s.faqRepo.Create(ctx, f)
}

func (s *Service) UpdateFAQ(ctx context.Context, id string, patch map[string]interface{}) (*FAQ, error) {
	return s.faqRepo.Update(ctx, id, patch)
}

func (s *Service) DeleteFAQ(ctx context.Context, id string) error {
	return s.faqRepo.Delete(ctx, id)
}

// ── Stats ────────────────────────────────────────────────────

func (s *Service) GetStats(ctx context.Context) (*SupportStats, error) {
	// Use dedicated count method instead of loading all tickets
	counts, err := s.ticketRepo.CountByStatus(ctx)
	if err != nil {
		return nil, err
	}
	faqs, err := s.faqRepo.List(ctx)
	if err != nil {
		return nil, err
	}

	total := 0
	for _, c := range counts {
		total += c
	}
	resolved := counts[StatusResolved] + counts[StatusClosed]

	stats := &SupportStats{
		TongTicket:   total,
		DangMo:       counts[StatusOpen],
		DangXuLy:     counts[StatusInProgress],
		DaDong:       resolved,
		ChoKhachHang: counts[StatusWaiting],
		TongFAQ:      len(faqs),
	}

	if total > 0 {
		stats.TyLeGiaiQuyet = float64(resolved) / float64(total) * 100
	}

	// SLA violations: critical tickets still open
	// We need to fetch filtered for this
	criticalFilter := ListFilter{Status: string(StatusOpen), Priority: string(PriorityCritical), Page: 1, Limit: 1}
	critResult, err := s.ticketRepo.List(ctx, criticalFilter)
	if err == nil {
		stats.SLAViolations = critResult.Total
	}

	// Calculate real average response time from tickets with first reply
	allFilter := ListFilter{Page: 1, Limit: 100}
	allResult, err := s.ticketRepo.List(ctx, allFilter)
	if err == nil {
		var totalHours float64
		var count int
		for _, t := range allResult.Items {
			if t.FirstReplyAt != nil {
				diff := t.FirstReplyAt.Sub(t.CreatedAt).Hours()
				totalHours += diff
				count++
			}
		}
		if count > 0 {
			stats.TBPhanHoiGio = totalHours / float64(count)
		}
	}

	return stats, nil
}

// ── State Machine ────────────────────────────────────────────

// isValidTransition checks whether a ticket status change is allowed.
func isValidTransition(from Status, to Status) bool {
	allowed := map[Status][]Status{
		StatusOpen:       {StatusInProgress, StatusClosed},
		StatusInProgress: {StatusWaiting, StatusResolved, StatusClosed},
		StatusWaiting:    {StatusInProgress, StatusResolved, StatusClosed},
		StatusResolved:   {StatusOpen, StatusClosed}, // reopen or close
		StatusClosed:     {StatusOpen},               // reopen only
	}
	for _, s := range allowed[from] {
		if s == to {
			return true
		}
	}
	return false
}
