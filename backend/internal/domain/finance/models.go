package finance

import "time"

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FINANCE MODELS (Extended)
// 7 new models for comprehensive financial management.
// ═══════════════════════════════════════════════════════════════

// ── Fee Schedule (Biểu phí) ──────────────────────────────────

// FeeSchedule defines pricing rules for a tournament.
type FeeSchedule struct {
	ID            string         `json:"id"`
	TournamentID  string         `json:"tournament_id"`
	FeeCode       string         `json:"fee_code"` // "team_entry","athlete_entry","content_entry","appeal"
	FeeName       string         `json:"fee_name"`
	Amount        float64        `json:"amount"`
	Currency      string         `json:"currency"` // "VND"
	Unit          string         `json:"unit"`     // "per_team","per_athlete","per_content","flat"
	IsRequired    bool           `json:"is_required"`
	DiscountRules map[string]any `json:"discount_rules,omitempty"` // {"early_bird":{"before":"2026-03-01","percent":10}}
	ValidFrom     string         `json:"valid_from"`
	ValidUntil    string         `json:"valid_until,omitempty"`
	CreatedBy     string         `json:"created_by"`
	CreatedAt     time.Time      `json:"created_at"`
}

// ── Invoice (Hóa đơn) ───────────────────────────────────────

type InvoiceDirection string

const (
	DirectionReceivable InvoiceDirection = "receivable" // thu
	DirectionPayable    InvoiceDirection = "payable"    // chi
)

type InvoiceStatus string

const (
	InvoiceStatusDraft         InvoiceStatus = "draft"
	InvoiceStatusPending       InvoiceStatus = "pending"
	InvoiceStatusApproved      InvoiceStatus = "approved"
	InvoiceStatusSent          InvoiceStatus = "sent"
	InvoiceStatusPartiallyPaid InvoiceStatus = "partially_paid"
	InvoiceStatusPaid          InvoiceStatus = "paid"
	InvoiceStatusOverdue       InvoiceStatus = "overdue"
	InvoiceStatusCompleted     InvoiceStatus = "completed"
	InvoiceStatusCancelled     InvoiceStatus = "cancelled"
)

// Invoice represents a financial document (thu/chi).
type Invoice struct {
	ID            string           `json:"id"`
	InvoiceNumber string           `json:"invoice_number"` // "INV-2026-0001"
	Direction     InvoiceDirection `json:"direction"`
	IssuerType    string           `json:"issuer_type"` // "federation","tournament"
	IssuerID      string           `json:"issuer_id,omitempty"`
	RecipientType string           `json:"recipient_type"` // "team","sponsor","vendor","referee"
	RecipientID   string           `json:"recipient_id,omitempty"`
	RecipientName string           `json:"recipient_name"`
	Title         string           `json:"title"`
	TournamentID  string           `json:"tournament_id,omitempty"`
	Subtotal      float64          `json:"subtotal"`
	Discount      float64          `json:"discount"`
	Tax           float64          `json:"tax"`
	Total         float64          `json:"total"`
	PaidAmount    float64          `json:"paid_amount"`
	Balance       float64          `json:"balance"` // total - paid_amount
	Currency      string           `json:"currency"`
	Status        InvoiceStatus    `json:"status"`
	IssueDate     string           `json:"issue_date"`
	DueDate       string           `json:"due_date,omitempty"`
	CreatedBy     string           `json:"created_by"`
	ApprovedBy    string           `json:"approved_by,omitempty"`
	ApprovedAt    *time.Time       `json:"approved_at,omitempty"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
	Items         []InvoiceItem    `json:"items,omitempty"`
}

// InvoiceItem is a line item in an invoice.
type InvoiceItem struct {
	ID            string  `json:"id"`
	InvoiceID     string  `json:"invoice_id"`
	FeeScheduleID string  `json:"fee_schedule_id,omitempty"`
	Description   string  `json:"description"`
	Quantity      int     `json:"quantity"`
	UnitPrice     float64 `json:"unit_price"`
	Amount        float64 `json:"amount"`                   // quantity × unit_price
	ReferenceType string  `json:"reference_type,omitempty"` // "athlete","content","team"
	ReferenceID   string  `json:"reference_id,omitempty"`
	SortOrder     int     `json:"sort_order"`
}

// ── Payment (Thanh toán) ─────────────────────────────────────

type PaymentMethod string

const (
	PaymentBankTransfer PaymentMethod = "bank_transfer"
	PaymentCash         PaymentMethod = "cash"
	PaymentQRCode       PaymentMethod = "qr_code"
	PaymentGateway      PaymentMethod = "gateway"
)

type PaymentStatus string

const (
	PaymentStatusPending   PaymentStatus = "pending"
	PaymentStatusConfirmed PaymentStatus = "confirmed"
	PaymentStatusRejected  PaymentStatus = "rejected"
	PaymentStatusRefunded  PaymentStatus = "refunded"
)

// Payment represents a single payment against an invoice.
type Payment struct {
	ID              string        `json:"id"`
	InvoiceID       string        `json:"invoice_id"`
	Method          PaymentMethod `json:"method"`
	Amount          float64       `json:"amount"`
	Currency        string        `json:"currency"`
	ReferenceCode   string        `json:"reference_code,omitempty"` // bank transaction code
	ProofURL        string        `json:"proof_url,omitempty"`      // receipt image
	BankName        string        `json:"bank_name,omitempty"`
	Status          PaymentStatus `json:"status"`
	ConfirmedBy     string        `json:"confirmed_by,omitempty"`
	ConfirmedAt     *time.Time    `json:"confirmed_at,omitempty"`
	RejectionReason string        `json:"rejection_reason,omitempty"`
	GatewayID       string        `json:"gateway_id,omitempty"`
	GatewayStatus   string        `json:"gateway_status,omitempty"`
	PaidAt          time.Time     `json:"paid_at"`
	CreatedAt       time.Time     `json:"created_at"`
}

// ── Sponsorship (Tài trợ) ────────────────────────────────────

type SponsorshipStatus string

const (
	SponsorProspecting SponsorshipStatus = "prospecting"
	SponsorNegotiating SponsorshipStatus = "negotiating"
	SponsorSigned      SponsorshipStatus = "signed"
	SponsorActive      SponsorshipStatus = "active"
	SponsorCompleted   SponsorshipStatus = "completed"
	SponsorTerminated  SponsorshipStatus = "terminated"
)

// Sponsorship represents a sponsorship contract.
type Sponsorship struct {
	ID             string            `json:"id"`
	PartnerName    string            `json:"partner_name"`
	PartnerContact string            `json:"partner_contact,omitempty"`
	PartnerLogo    string            `json:"partner_logo,omitempty"`
	ContractType   string            `json:"contract_type"` // "cash","in_kind","service","mixed"
	TotalValue     float64           `json:"total_value"`
	Currency       string            `json:"currency"`
	Terms          string            `json:"terms,omitempty"`
	Benefits       map[string]any    `json:"benefits,omitempty"`   // counter-benefits
	ScopeType      string            `json:"scope_type,omitempty"` // "tournament","federation"
	ScopeID        string            `json:"scope_id,omitempty"`
	StartDate      string            `json:"start_date"`
	EndDate        string            `json:"end_date"`
	Status         SponsorshipStatus `json:"status"`
	Installments   []Installment     `json:"installments,omitempty"`
	ReceivedTotal  float64           `json:"received_total"`
	ManagedBy      string            `json:"managed_by,omitempty"`
	CreatedAt      time.Time         `json:"created_at"`
}

// Installment is a payment tranche in a sponsorship.
type Installment struct {
	DueDate string  `json:"due_date"`
	Amount  float64 `json:"amount"`
	Status  string  `json:"status"` // "pending","received","overdue"
	PaidAt  string  `json:"paid_at,omitempty"`
}

// ── Referee Allowance ────────────────────────────────────────

// RefereeAllowance tracks allowances for referees per tournament.
type RefereeAllowance struct {
	ID             string     `json:"id"`
	TournamentID   string     `json:"tournament_id"`
	RefereeID      string     `json:"referee_id"`
	RefereeName    string     `json:"referee_name"`
	TotalMatches   int        `json:"total_matches"`
	RatePerMatch   float64    `json:"rate_per_match"`
	MatchAllowance float64    `json:"match_allowance"` // total_matches × rate_per_match
	MealDays       int        `json:"meal_days"`
	MealRate       float64    `json:"meal_rate"`
	TravelAmount   float64    `json:"travel_amount"`
	Bonus          float64    `json:"bonus"`
	Total          float64    `json:"total"`
	PaymentStatus  string     `json:"payment_status"` // "pending","approved","paid","confirmed"
	InvoiceID      string     `json:"invoice_id,omitempty"`
	PaidAt         *time.Time `json:"paid_at,omitempty"`
	ConfirmedAt    *time.Time `json:"confirmed_at,omitempty"`
}

// ── Enhanced Budget ──────────────────────────────────────────

// BudgetV2 extends Budget with scope, enforcement, and approval.
type BudgetV2 struct {
	ID           string     `json:"id"`
	ScopeType    string     `json:"scope_type"` // "federation","tournament","provincial"
	ScopeID      string     `json:"scope_id,omitempty"`
	FiscalYear   int        `json:"fiscal_year"`
	CategoryCode string     `json:"category_code"` // "giai_thuong","trong_tai","hanh_chinh"
	CategoryName string     `json:"category_name"`
	Allocated    float64    `json:"allocated"`
	Spent        float64    `json:"spent"`
	Committed    float64    `json:"committed"`   // approved but not yet spent
	Available    float64    `json:"available"`   // allocated - spent - committed
	WarningPct   float64    `json:"warning_pct"` // default 80
	ApprovedBy   string     `json:"approved_by,omitempty"`
	ApprovedAt   *time.Time `json:"approved_at,omitempty"`
	Status       string     `json:"status"` // "draft","approved","closed"
}

// ── Repositories ─────────────────────────────────────────────

// (Extended repositories will be added as needed during Wave 3)
