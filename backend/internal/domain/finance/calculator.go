package finance

import (
	"fmt"
	"math"
	"time"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEE CALCULATOR
// Auto-calculation engine for tournament fees, referee allowances.
// ═══════════════════════════════════════════════════════════════

// ── Fee Calculation ──────────────────────────────────────────

// TeamFeeInput contains the input for team fee calculation.
type TeamFeeInput struct {
	TournamentID     string
	TeamID           string
	TeamName         string
	AthleteCount     int
	ContentCount     int
	FeeSchedules     []FeeSchedule
	RegistrationDate time.Time
}

// FeeBreakdown contains the calculated fee details.
type FeeBreakdown struct {
	Items    []FeeLineItem `json:"items"`
	Subtotal float64       `json:"subtotal"`
	Discount float64       `json:"discount"`
	Total    float64       `json:"total"`
	Currency string        `json:"currency"`
}

// FeeLineItem is a single line in the fee breakdown.
type FeeLineItem struct {
	FeeCode     string  `json:"fee_code"`
	Description string  `json:"description"`
	Quantity    int     `json:"quantity"`
	UnitPrice   float64 `json:"unit_price"`
	Amount      float64 `json:"amount"`
}

// CalculateTeamFees computes total fees for a team registering in a tournament.
//
// Fee schedule codes:
//   - "team_entry":    flat fee per team
//   - "athlete_entry": per athlete
//   - "content_entry": per content registration
//   - "appeal":        per appeal (not included in registration)
func CalculateTeamFees(input TeamFeeInput) (FeeBreakdown, error) {
	if len(input.FeeSchedules) == 0 {
		return FeeBreakdown{}, fmt.Errorf("không có biểu phí cho giải đấu")
	}

	var items []FeeLineItem
	var subtotal float64
	currency := "VND"

	for _, fs := range input.FeeSchedules {
		if fs.FeeCode == "appeal" {
			continue // appeal fees are calculated separately
		}
		currency = fs.Currency

		var qty int
		switch fs.Unit {
		case "per_team", "flat":
			qty = 1
		case "per_athlete":
			qty = input.AthleteCount
		case "per_content":
			qty = input.ContentCount
		default:
			continue
		}

		if qty <= 0 {
			continue
		}

		amount := roundTo2(float64(qty) * fs.Amount)
		items = append(items, FeeLineItem{
			FeeCode:     fs.FeeCode,
			Description: fs.FeeName,
			Quantity:    qty,
			UnitPrice:   fs.Amount,
			Amount:      amount,
		})
		subtotal += amount
	}

	// Calculate early bird discount
	discount := calculateDiscount(input.FeeSchedules, input.RegistrationDate, subtotal)

	return FeeBreakdown{
		Items:    items,
		Subtotal: roundTo2(subtotal),
		Discount: roundTo2(discount),
		Total:    roundTo2(subtotal - discount),
		Currency: currency,
	}, nil
}

// calculateDiscount checks for early-bird or other discount rules.
func calculateDiscount(schedules []FeeSchedule, regDate time.Time, subtotal float64) float64 {
	for _, fs := range schedules {
		if fs.DiscountRules == nil {
			continue
		}
		eb, ok := fs.DiscountRules["early_bird"]
		if !ok {
			continue
		}
		ebMap, ok := eb.(map[string]any)
		if !ok {
			continue
		}
		beforeStr, _ := ebMap["before"].(string)
		pctVal, _ := ebMap["percent"].(float64)

		if beforeStr == "" || pctVal <= 0 {
			continue
		}

		deadline, err := time.Parse("2006-01-02", beforeStr)
		if err != nil {
			continue
		}

		if regDate.Before(deadline) {
			return subtotal * pctVal / 100
		}
	}
	return 0
}

// ── Invoice Generation ───────────────────────────────────────

// GenerateInvoiceFromFees creates an Invoice from a fee breakdown.
func GenerateInvoiceFromFees(
	invoiceID string,
	invoiceNumber string,
	teamID string,
	teamName string,
	tournamentID string,
	fees FeeBreakdown,
	createdBy string,
) Invoice {
	now := time.Now().UTC()
	dueDate := now.AddDate(0, 0, 15) // 15 days due

	invoice := Invoice{
		ID:            invoiceID,
		InvoiceNumber: invoiceNumber,
		Direction:     DirectionReceivable,
		IssuerType:    "tournament",
		IssuerID:      tournamentID,
		RecipientType: "team",
		RecipientID:   teamID,
		RecipientName: teamName,
		Title:         fmt.Sprintf("Lệ phí đăng ký - %s", teamName),
		TournamentID:  tournamentID,
		Subtotal:      fees.Subtotal,
		Discount:      fees.Discount,
		Tax:           0,
		Total:         fees.Total,
		PaidAmount:    0,
		Balance:       fees.Total,
		Currency:      fees.Currency,
		Status:        InvoiceStatusDraft,
		IssueDate:     now.Format("2006-01-02"),
		DueDate:       dueDate.Format("2006-01-02"),
		CreatedBy:     createdBy,
		CreatedAt:     now,
		UpdatedAt:     now,
	}

	for i, item := range fees.Items {
		invoice.Items = append(invoice.Items, InvoiceItem{
			ID:          fmt.Sprintf("%s-item-%d", invoiceID, i+1),
			InvoiceID:   invoiceID,
			Description: item.Description,
			Quantity:    item.Quantity,
			UnitPrice:   item.UnitPrice,
			Amount:      item.Amount,
			SortOrder:   i + 1,
		})
	}

	return invoice
}

// ── Referee Allowance Calculator ─────────────────────────────

// AllowanceConfig defines rates for referee allowances.
type AllowanceConfig struct {
	CombatRatePerMatch float64 `json:"combat_rate_per_match"`
	FormsRatePerMatch  float64 `json:"forms_rate_per_match"`
	MealRatePerDay     float64 `json:"meal_rate_per_day"`
	ChiefBonus         float64 `json:"chief_bonus_per_match"` // trưởng sàn
}

// DefaultAllowanceConfigQG returns default rates for national tournaments.
func DefaultAllowanceConfigQG() AllowanceConfig {
	return AllowanceConfig{
		CombatRatePerMatch: 200_000,
		FormsRatePerMatch:  150_000,
		MealRatePerDay:     200_000,
		ChiefBonus:         50_000,
	}
}

// DefaultAllowanceConfigTinh returns default rates for provincial tournaments.
func DefaultAllowanceConfigTinh() AllowanceConfig {
	return AllowanceConfig{
		CombatRatePerMatch: 100_000,
		FormsRatePerMatch:  80_000,
		MealRatePerDay:     150_000,
		ChiefBonus:         30_000,
	}
}

// RefereeAssignment describes a referee's work in a tournament.
type RefereeAssignment struct {
	RefereeID     string
	RefereeName   string
	CombatMatches int
	FormsMatches  int
	IsChief       bool // trưởng sàn
	ChiefMatches  int  // number of matches as chief
	DaysPresent   int
	TravelAmount  float64 // reimbursement
}

// CalculateRefereeAllowance computes the allowance for a single referee.
func CalculateRefereeAllowance(
	tournamentID string,
	assignment RefereeAssignment,
	config AllowanceConfig,
	idGen func() string,
) RefereeAllowance {
	combatPay := float64(assignment.CombatMatches) * config.CombatRatePerMatch
	formsPay := float64(assignment.FormsMatches) * config.FormsRatePerMatch
	matchAllowance := roundTo2(combatPay + formsPay)

	mealTotal := roundTo2(float64(assignment.DaysPresent) * config.MealRatePerDay)

	var bonus float64
	if assignment.IsChief {
		bonus = roundTo2(float64(assignment.ChiefMatches) * config.ChiefBonus)
	}

	total := roundTo2(matchAllowance + mealTotal + assignment.TravelAmount + bonus)

	return RefereeAllowance{
		ID:             idGen(),
		TournamentID:   tournamentID,
		RefereeID:      assignment.RefereeID,
		RefereeName:    assignment.RefereeName,
		TotalMatches:   assignment.CombatMatches + assignment.FormsMatches,
		RatePerMatch:   config.CombatRatePerMatch, // primary rate
		MatchAllowance: matchAllowance,
		MealDays:       assignment.DaysPresent,
		MealRate:       config.MealRatePerDay,
		TravelAmount:   assignment.TravelAmount,
		Bonus:          bonus,
		Total:          total,
		PaymentStatus:  "pending",
	}
}

// ── Budget Enforcement ───────────────────────────────────────

// BudgetCheckResult contains the result of a budget check.
type BudgetCheckResult struct {
	Allowed        bool    `json:"allowed"`
	Available      float64 `json:"available"`
	Requested      float64 `json:"requested"`
	UtilizationPct float64 `json:"utilization_pct"`
	Warning        string  `json:"warning,omitempty"`
}

// CheckBudget validates if a spending amount is within budget.
func CheckBudget(budget BudgetV2, amount float64) BudgetCheckResult {
	if budget.Status != "approved" {
		return BudgetCheckResult{
			Allowed:   false,
			Available: 0,
			Requested: amount,
			Warning:   "Ngân sách chưa được phê duyệt",
		}
	}

	available := budget.Allocated - budget.Spent - budget.Committed
	utilizationAfter := ((budget.Spent + budget.Committed + amount) / budget.Allocated) * 100

	result := BudgetCheckResult{
		Allowed:        amount <= available,
		Available:      roundTo2(available),
		Requested:      amount,
		UtilizationPct: roundTo2(utilizationAfter),
	}

	if !result.Allowed {
		result.Warning = fmt.Sprintf(
			"Vượt ngân sách! Còn lại: %s, yêu cầu: %s",
			formatVND(available), formatVND(amount),
		)
	} else if utilizationAfter >= budget.WarningPct {
		result.Warning = fmt.Sprintf(
			"Cảnh báo: Ngân sách đã sử dụng %.1f%% (ngưỡng cảnh báo: %.0f%%)",
			utilizationAfter, budget.WarningPct,
		)
	}

	return result
}

// ── Helpers ──────────────────────────────────────────────────

func roundTo2(v float64) float64 {
	return math.Round(v*100) / 100
}

func formatVND(amount float64) string {
	return fmt.Sprintf("%.0fđ", amount)
}
