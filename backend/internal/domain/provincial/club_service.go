package provincial

import (
	"context"
	"time"
)

// ── Club Internal Service Methods ────────────────────────────
// These methods are attached to the existing provincial *Service
// via a separate file to keep service.go maintainable.

// GetClubDashboard returns KPIs for a single club.
func (s *Service) GetClubDashboard(ctx context.Context, clubID string) (*ClubDashboardStats, error) {
	club, err := s.clubs.GetByID(ctx, clubID)
	if err != nil {
		return nil, err
	}

	members, _ := s.clubMembers.List(ctx, clubID)
	classes, _ := s.clubClasses.List(ctx, clubID)
	finances, _ := s.clubFinance.List(ctx, clubID)

	active, pending := 0, 0
	for _, m := range members {
		switch m.Status {
		case MemberStatusActive:
			active++
		case MemberStatusPending:
			pending++
		}
	}

	activeCls := 0
	for _, c := range classes {
		if c.Status == "active" {
			activeCls++
		}
	}

	totalIncome, totalExpense := 0.0, 0.0
	for _, f := range finances {
		if f.Type == "income" {
			totalIncome += f.Amount
		} else {
			totalExpense += f.Amount
		}
	}

	return &ClubDashboardStats{
		ClubID:         club.ID,
		ClubName:       club.Name,
		ClubType:       club.Type,
		TotalMembers:   len(members),
		ActiveMembers:  active,
		PendingMembers: pending,
		TotalClasses:   len(classes),
		ActiveClasses:  activeCls,
		TotalIncome:    totalIncome,
		TotalExpense:   totalExpense,
		Balance:        totalIncome - totalExpense,
		RecentEntries:  len(finances),
	}, nil
}

// ── Club Members ─────────────────────────────────────────────

func (s *Service) ListClubMembers(ctx context.Context, clubID string) ([]ClubMember, error) {
	return s.clubMembers.List(ctx, clubID)
}

func (s *Service) GetClubMember(ctx context.Context, id string) (*ClubMember, error) {
	return s.clubMembers.GetByID(ctx, id)
}

func (s *Service) CreateClubMember(ctx context.Context, m ClubMember) (*ClubMember, error) {
	m.ID = s.idGen()
	m.Status = MemberStatusPending
	m.CreatedAt = time.Now()
	m.UpdatedAt = time.Now()
	return s.clubMembers.Create(ctx, m)
}

func (s *Service) ApproveClubMember(ctx context.Context, id string) error {
	return s.clubMembers.Update(ctx, id, map[string]interface{}{"status": string(MemberStatusActive)})
}

func (s *Service) RejectClubMember(ctx context.Context, id string) error {
	return s.clubMembers.Update(ctx, id, map[string]interface{}{"status": string(MemberStatusInactive)})
}

func (s *Service) UpdateClubMember(ctx context.Context, id string, patch map[string]interface{}) error {
	return s.clubMembers.Update(ctx, id, patch)
}

func (s *Service) DeleteClubMember(ctx context.Context, id string) error {
	return s.clubMembers.Delete(ctx, id)
}

// ── Club Classes ─────────────────────────────────────────────

func (s *Service) ListClubClasses(ctx context.Context, clubID string) ([]ClubClass, error) {
	return s.clubClasses.List(ctx, clubID)
}

func (s *Service) GetClubClass(ctx context.Context, id string) (*ClubClass, error) {
	return s.clubClasses.GetByID(ctx, id)
}

func (s *Service) CreateClubClass(ctx context.Context, c ClubClass) (*ClubClass, error) {
	c.ID = s.idGen()
	c.Status = "active"
	c.CreatedAt = time.Now()
	c.UpdatedAt = time.Now()
	return s.clubClasses.Create(ctx, c)
}

func (s *Service) UpdateClubClass(ctx context.Context, id string, patch map[string]interface{}) error {
	return s.clubClasses.Update(ctx, id, patch)
}

func (s *Service) DeleteClubClass(ctx context.Context, id string) error {
	return s.clubClasses.Delete(ctx, id)
}

// ── Club Finance ─────────────────────────────────────────────

func (s *Service) ListClubFinance(ctx context.Context, clubID string) ([]ClubFinanceEntry, error) {
	return s.clubFinance.List(ctx, clubID)
}

func (s *Service) CreateClubFinanceEntry(ctx context.Context, f ClubFinanceEntry) (*ClubFinanceEntry, error) {
	f.ID = s.idGen()
	f.CreatedAt = time.Now()
	return s.clubFinance.Create(ctx, f)
}

func (s *Service) GetClubFinanceSummary(ctx context.Context, clubID string) (*ClubFinanceSummary, error) {
	entries, err := s.clubFinance.List(ctx, clubID)
	if err != nil {
		return nil, err
	}
	summary := &ClubFinanceSummary{
		ClubID:            clubID,
		IncomeByCategory:  make(map[string]float64),
		ExpenseByCategory: make(map[string]float64),
	}
	for _, e := range entries {
		if e.Type == "income" {
			summary.TotalIncome += e.Amount
			summary.IncomeByCategory[e.Category] += e.Amount
		} else {
			summary.TotalExpense += e.Amount
			summary.ExpenseByCategory[e.Category] += e.Amount
		}
	}
	summary.Balance = summary.TotalIncome - summary.TotalExpense
	return summary, nil
}
