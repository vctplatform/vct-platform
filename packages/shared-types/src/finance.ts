// ── Finance Module Types ─────────────────────────────────────
// Covers: fee schedules, payments, invoices, sponsorships,
// tournament budgets, financial reports.

export interface FeeSchedule {
    id: string
    name: string
    type: 'hoc_phi' | 'le_phi_giai' | 'thi_dai' | 'bao_hiem' | 'other'
    amount: number
    currency: string // 'VND'
    period?: 'monthly' | 'quarterly' | 'yearly' | 'one_time'
    description?: string
    applicable_to?: string // 'athlete', 'team', 'club'
    effective_from: string
    effective_to?: string
    is_active: boolean
    metadata?: Record<string, unknown>
    created_at: string
}

export interface Payment {
    id: string
    payer_id: string
    payer_name: string
    payer_type: 'athlete' | 'team' | 'club' | 'federation'
    fee_schedule_id?: string
    amount: number
    currency: string
    method: 'cash' | 'bank_transfer' | 'momo' | 'vnpay' | 'zalopay' | 'other'
    reference_number?: string
    status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled'
    paid_at?: string
    verified_by?: string
    notes?: string
    receipt_url?: string
    tournament_id?: string
    created_at: string
}

export interface Invoice {
    id: string
    invoice_number: string
    issuer_id: string
    recipient_id: string
    recipient_name: string
    items: InvoiceItem[]
    subtotal: number
    tax: number
    total: number
    currency: string
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
    due_date: string
    paid_date?: string
    notes?: string
    created_at: string
}

export interface InvoiceItem {
    description: string
    quantity: number
    unit_price: number
    total: number
}

export interface Sponsorship {
    id: string
    sponsor_name: string
    sponsor_logo_url?: string
    contact_name?: string
    contact_email?: string
    contact_phone?: string
    level: 'kim_cuong' | 'vang' | 'bac' | 'dong' | 'other'
    amount: number
    currency: string
    start_date: string
    end_date: string
    benefits?: string[]
    tournament_ids?: string[]
    status: 'active' | 'pending' | 'expired' | 'cancelled'
    contract_url?: string
    created_at: string
}

export interface TournamentBudget {
    id: string
    tournament_id: string
    total_budget: number
    total_spent: number
    total_income: number
    currency: string
    items: BudgetItem[]
    status: 'planning' | 'approved' | 'in_progress' | 'finalized'
    approved_by?: string
    notes?: string
    created_at: string
    updated_at: string
}

export interface BudgetItem {
    id: string
    category: 'venue' | 'equipment' | 'medals' | 'catering' | 'transport' | 'personnel' | 'marketing' | 'other'
    description: string
    estimated_amount: number
    actual_amount?: number
    status: 'planned' | 'approved' | 'spent' | 'cancelled'
    notes?: string
}
