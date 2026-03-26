# VCT Platform Finance & Billing Architecture

This document establishes the unbreakable rules for handling financial operations, subscription payments, tournament fees, and invoicing within the VCT Platform. Because the platform processes money, these rules prioritize absolute safety, auditability, and mathematical precision over developer convenience.

## 1. The Integer/Decimal Rule (No Floats)
- **Absolute Ban on Floating Point**: Using `float32`, `float64`, or JavaScript `Number` for currency calculations is Strictly Banned.
- **Backend Standard**: The Go backend MUST handle currency in either the lowest possible denomination as `int64` (e.g., Vietnam Dong directly, or US Cents) OR use an arbitrary-precision library like `shopspring/decimal`.
- **Database Standard**: All financial columns in PostgreSQL MUST use precision data types: `NUMERIC(15,2)` or `BIGINT`. Never use `REAL` or `DOUBLE PRECISION`.

## 2. Idempotency (Preventing Double Charges)
- **Mandatory Idempotency Keys**: Any API endpoint that mutates financial state (Create Invoice, Pay Bill, Process Refund) MUST require an `Idempotency-Key` header provided by the client.
- **Execution Locking**: The backend MUST store this key in an `idempotency_keys` table using a `SELECT FOR UPDATE` lock (or Redis `SETNX`) to ensure that if a user clicks the "Pay" button 5 times due to lag, the transaction is only executed exactly once. Subsequent identical requests within 24 hours must return the cached result of the first successful request.

## 3. Financial State Machine Strictness
- **Immutable State Progression**: An `Invoice` or `PaymentIntent` must strictly transition through: `DRAFT -> PENDING -> PROCESSING -> (SUCCESS | FAILED | REFUNDED)`.
- **Enforced Locking**: Transitioning into `SUCCESS` must validate the current state inline using compare-and-swap SQL (e.g., `UPDATE payments SET status='SUCCESS' WHERE id=$1 AND status='PROCESSING'`).
- **No Skipping States**: Manually updating a FAILED payment directly to SUCCESS is banned. A new payment attempt must be initiated.

## 4. Zero-Trust Webhooks & Verification
- **Untrusted Frontend**: The client UI returning with `?status=success` from a payment gateway (e.g., VNPay, MoMo) is completely untrusted and MUST NOT change the database status.
- **Webhook Middleware**: Server-to-server webhook callbacks MUST pass through a middleware that cryptographically validates the HMAC/RSA signature comparing it with the Gateway's secret key. Invalid signatures result in an immediate `401 Unauthorized` without database processing.
- **Amount Validation**: The webhook handler MUST verify that the precise `Amount` reported by the gateway matches the expected `Amount` in the local database invoice before marking it paid.

## 5. Append-Only Ledgers (GAAP Compliance)
- **Immutability of History**: Once a financial transaction reaches a terminal state (`SUCCESS`, `FAILED`, `REFUNDED`), the `amount`, `currency`, and `tax` fields become read-only.
- **Correcting Mistakes**: If a payment amount was recorded incorrectly, it is explicitly forbidden to run an `UPDATE` statement to fix the `amount`. The system must issue a compensating transaction (a `Credit Note` or `Reversal`) to balance the ledger, preserving the strict append-only audit trail required by accounting standards.
