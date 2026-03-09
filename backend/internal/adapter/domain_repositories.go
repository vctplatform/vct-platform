package adapter

import (
	"context"

	"vct-platform/backend/internal/domain/community"
	"vct-platform/backend/internal/domain/finance"
	"vct-platform/backend/internal/domain/heritage"
	"vct-platform/backend/internal/domain/ranking"
	"vct-platform/backend/internal/store"
)

// ── Ranking Adapters ─────────────────────────────────────────

type athleteRankingRepo struct {
	*StoreAdapter[ranking.AthleteRanking]
}

func NewAthleteRankingRepository(ds store.DataStore) ranking.AthleteRankingRepository {
	return &athleteRankingRepo{StoreAdapter: NewStoreAdapter[ranking.AthleteRanking](ds, "athlete_rankings")}
}

func (r *athleteRankingRepo) List(ctx context.Context) ([]ranking.AthleteRanking, error) {
	return r.StoreAdapter.List()
}
func (r *athleteRankingRepo) GetByID(ctx context.Context, id string) (*ranking.AthleteRanking, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *athleteRankingRepo) Upsert(ctx context.Context, item ranking.AthleteRanking) error {
	_, err := r.StoreAdapter.Create(item)
	return err
}
func (r *athleteRankingRepo) ListByCategory(ctx context.Context, hangMuc string) ([]ranking.AthleteRanking, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []ranking.AthleteRanking
	for _, a := range all {
		if a.HangMuc == hangMuc {
			out = append(out, a)
		}
	}
	return out, nil
}

type teamRankingRepo struct {
	*StoreAdapter[ranking.TeamRanking]
}

func NewTeamRankingRepository(ds store.DataStore) ranking.TeamRankingRepository {
	return &teamRankingRepo{StoreAdapter: NewStoreAdapter[ranking.TeamRanking](ds, "team_rankings")}
}

func (r *teamRankingRepo) List(ctx context.Context) ([]ranking.TeamRanking, error) {
	return r.StoreAdapter.List()
}
func (r *teamRankingRepo) GetByID(ctx context.Context, id string) (*ranking.TeamRanking, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *teamRankingRepo) Upsert(ctx context.Context, item ranking.TeamRanking) error {
	_, err := r.StoreAdapter.Create(item)
	return err
}

// ── Heritage Adapters ────────────────────────────────────────

type beltRepo struct {
	*StoreAdapter[heritage.BeltRank]
}

func NewBeltRankRepository(ds store.DataStore) heritage.BeltRankRepository {
	return &beltRepo{StoreAdapter: NewStoreAdapter[heritage.BeltRank](ds, "belt_ranks")}
}

func (r *beltRepo) List(ctx context.Context) ([]heritage.BeltRank, error) {
	return r.StoreAdapter.List()
}
func (r *beltRepo) GetByID(ctx context.Context, id string) (*heritage.BeltRank, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *beltRepo) Create(ctx context.Context, item heritage.BeltRank) (*heritage.BeltRank, error) {
	return r.StoreAdapter.Create(item)
}
func (r *beltRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*heritage.BeltRank, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *beltRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

type techniqueRepo struct {
	*StoreAdapter[heritage.Technique]
}

func NewTechniqueRepository(ds store.DataStore) heritage.TechniqueRepository {
	return &techniqueRepo{StoreAdapter: NewStoreAdapter[heritage.Technique](ds, "techniques")}
}

func (r *techniqueRepo) List(ctx context.Context) ([]heritage.Technique, error) {
	return r.StoreAdapter.List()
}
func (r *techniqueRepo) GetByID(ctx context.Context, id string) (*heritage.Technique, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *techniqueRepo) Create(ctx context.Context, item heritage.Technique) (*heritage.Technique, error) {
	return r.StoreAdapter.Create(item)
}
func (r *techniqueRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*heritage.Technique, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *techniqueRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}
func (r *techniqueRepo) ListByCategory(ctx context.Context, loai string) ([]heritage.Technique, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []heritage.Technique
	for _, t := range all {
		if t.Loai == loai {
			out = append(out, t)
		}
	}
	return out, nil
}

// ── Finance Adapters ─────────────────────────────────────────

type transactionRepo struct {
	*StoreAdapter[finance.Transaction]
}

func NewTransactionRepository(ds store.DataStore) finance.TransactionRepository {
	return &transactionRepo{StoreAdapter: NewStoreAdapter[finance.Transaction](ds, "transactions")}
}

func (r *transactionRepo) List(ctx context.Context) ([]finance.Transaction, error) {
	return r.StoreAdapter.List()
}
func (r *transactionRepo) GetByID(ctx context.Context, id string) (*finance.Transaction, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *transactionRepo) Create(ctx context.Context, item finance.Transaction) (*finance.Transaction, error) {
	return r.StoreAdapter.Create(item)
}
func (r *transactionRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*finance.Transaction, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *transactionRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}
func (r *transactionRepo) ListByCategory(ctx context.Context, danhMuc string) ([]finance.Transaction, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []finance.Transaction
	for _, t := range all {
		if t.DanhMuc == danhMuc {
			out = append(out, t)
		}
	}
	return out, nil
}

type budgetRepo struct {
	*StoreAdapter[finance.Budget]
}

func NewBudgetRepository(ds store.DataStore) finance.BudgetRepository {
	return &budgetRepo{StoreAdapter: NewStoreAdapter[finance.Budget](ds, "budgets")}
}

func (r *budgetRepo) List(ctx context.Context) ([]finance.Budget, error) {
	return r.StoreAdapter.List()
}
func (r *budgetRepo) GetByID(ctx context.Context, id string) (*finance.Budget, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *budgetRepo) Upsert(ctx context.Context, item finance.Budget) error {
	_, err := r.StoreAdapter.Create(item)
	return err
}

// ── Community Adapters ───────────────────────────────────────

type clubRepo struct {
	*StoreAdapter[community.Club]
}

func NewClubRepository(ds store.DataStore) community.ClubRepository {
	return &clubRepo{StoreAdapter: NewStoreAdapter[community.Club](ds, "clubs")}
}

func (r *clubRepo) List(ctx context.Context) ([]community.Club, error) {
	return r.StoreAdapter.List()
}
func (r *clubRepo) GetByID(ctx context.Context, id string) (*community.Club, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *clubRepo) Create(ctx context.Context, item community.Club) (*community.Club, error) {
	return r.StoreAdapter.Create(item)
}
func (r *clubRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*community.Club, error) {
	return r.StoreAdapter.Update(id, patch)
}
func (r *clubRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}

type memberRepo struct {
	*StoreAdapter[community.Member]
}

func NewMemberRepository(ds store.DataStore) community.MemberRepository {
	return &memberRepo{StoreAdapter: NewStoreAdapter[community.Member](ds, "members")}
}

func (r *memberRepo) List(ctx context.Context) ([]community.Member, error) {
	return r.StoreAdapter.List()
}
func (r *memberRepo) GetByID(ctx context.Context, id string) (*community.Member, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *memberRepo) Create(ctx context.Context, item community.Member) (*community.Member, error) {
	return r.StoreAdapter.Create(item)
}
func (r *memberRepo) ListByClub(ctx context.Context, clubID string) ([]community.Member, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []community.Member
	for _, m := range all {
		if m.ClubID == clubID {
			out = append(out, m)
		}
	}
	return out, nil
}

type eventRepo struct {
	*StoreAdapter[community.Event]
}

func NewEventRepository(ds store.DataStore) community.EventRepository {
	return &eventRepo{StoreAdapter: NewStoreAdapter[community.Event](ds, "community_events")}
}

func (r *eventRepo) List(ctx context.Context) ([]community.Event, error) {
	return r.StoreAdapter.List()
}
func (r *eventRepo) GetByID(ctx context.Context, id string) (*community.Event, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *eventRepo) Create(ctx context.Context, item community.Event) (*community.Event, error) {
	return r.StoreAdapter.Create(item)
}
func (r *eventRepo) Update(ctx context.Context, id string, patch map[string]interface{}) (*community.Event, error) {
	return r.StoreAdapter.Update(id, patch)
}
