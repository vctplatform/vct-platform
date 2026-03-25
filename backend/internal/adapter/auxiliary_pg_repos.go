package adapter

import (
	"context"
	"fmt"
	"strings"
	"time"

	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/domain/certification"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/international"
	"vct-platform/backend/internal/store"
)

// ════════════════════════════════════════════════════════════════
// POSTGRES IMPLEMENTATIONS FOR AUXILIARY / NATIONAL MODULES
// ════════════════════════════════════════════════════════════════

// ── APPROVAL ──────────────────────────────────────────────────

// 1. Workflow
type pgWorkflowRepo struct {
	*StoreAdapter[approval.WorkflowDefinition]
}

func NewPgWorkflowRepo(ds store.DataStore) *pgWorkflowRepo {
	return &pgWorkflowRepo{
		StoreAdapter: NewStoreAdapter[approval.WorkflowDefinition](ds, "approval_workflows"),
	}
}

func (r *pgWorkflowRepo) GetByCode(ctx context.Context, code string) (*approval.WorkflowDefinition, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].WorkflowCode == code {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("workflow %q not found", code)
}

func (r *pgWorkflowRepo) List(ctx context.Context) ([]approval.WorkflowDefinition, error) {
	return r.StoreAdapter.List()
}

func (r *pgWorkflowRepo) Create(ctx context.Context, wf approval.WorkflowDefinition) error {
	_, err := r.StoreAdapter.Create(wf)
	return err
}

// 2. Request
type pgRequestRepo struct {
	*StoreAdapter[approval.ApprovalRequest]
}

func NewPgRequestRepo(ds store.DataStore) *pgRequestRepo {
	return &pgRequestRepo{
		StoreAdapter: NewStoreAdapter[approval.ApprovalRequest](ds, "approval_requests"),
	}
}

func (r *pgRequestRepo) Create(ctx context.Context, req approval.ApprovalRequest) (*approval.ApprovalRequest, error) {
	return r.StoreAdapter.Create(req)
}

func (r *pgRequestRepo) GetByID(ctx context.Context, id string) (*approval.ApprovalRequest, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgRequestRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}

func (r *pgRequestRepo) ListByStatus(ctx context.Context, status approval.RequestStatus) ([]approval.ApprovalRequest, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []approval.ApprovalRequest
	for _, req := range items {
		if req.Status == status {
			res = append(res, req)
		}
	}
	return res, nil
}

func (r *pgRequestRepo) ListByApproverRole(ctx context.Context, role string) ([]approval.ApprovalRequest, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []approval.ApprovalRequest
	for _, req := range items {
		if req.Status == approval.StatusPending || req.Status == approval.StatusInReview {
			res = append(res, req)
		}
	}
	return res, nil
}

func (r *pgRequestRepo) ListByRequester(ctx context.Context, userID string) ([]approval.ApprovalRequest, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []approval.ApprovalRequest
	for _, req := range items {
		if req.RequestedBy == userID {
			res = append(res, req)
		}
	}
	return res, nil
}

// 3. Step
type pgStepRepo struct {
	*StoreAdapter[approval.ApprovalStep]
}

func NewPgStepRepo(ds store.DataStore) *pgStepRepo {
	return &pgStepRepo{
		StoreAdapter: NewStoreAdapter[approval.ApprovalStep](ds, "approval_steps"),
	}
}

func (r *pgStepRepo) Create(ctx context.Context, step approval.ApprovalStep) error {
	_, err := r.StoreAdapter.Create(step)
	return err
}

func (r *pgStepRepo) GetCurrentStep(ctx context.Context, requestID string, stepNumber int) (*approval.ApprovalStep, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].RequestID == requestID && items[i].StepNumber == stepNumber {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("step %d not found for request %q", stepNumber, requestID)
}

func (r *pgStepRepo) UpdateDecision(ctx context.Context, stepID string, decision approval.StepDecision, decidedBy string, comment string) error {
	now := time.Now()
	_, err := r.StoreAdapter.Update(stepID, map[string]interface{}{
		"decision":    decision,
		"decision_by": decidedBy,
		"decision_at": &now,
		"comment":     comment,
	})
	return err
}

func (r *pgStepRepo) ListByRequest(ctx context.Context, requestID string) ([]approval.ApprovalStep, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []approval.ApprovalStep
	for _, step := range items {
		if step.RequestID == requestID {
			res = append(res, step)
		}
	}
	return res, nil
}

// 4. History
type pgHistoryRepo struct {
	*StoreAdapter[approval.ApprovalHistory]
}

func NewPgHistoryRepo(ds store.DataStore) *pgHistoryRepo {
	return &pgHistoryRepo{
		StoreAdapter: NewStoreAdapter[approval.ApprovalHistory](ds, "approval_history"),
	}
}

func (r *pgHistoryRepo) Append(ctx context.Context, entry approval.ApprovalHistory) error {
	_, err := r.StoreAdapter.Create(entry)
	return err
}

func (r *pgHistoryRepo) ListByRequest(ctx context.Context, requestID string) ([]approval.ApprovalHistory, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []approval.ApprovalHistory
	for _, h := range items {
		if h.RequestID == requestID {
			res = append(res, h)
		}
	}
	return res, nil
}

// ── CERTIFICATION ──────────────────────────────────────────────

type pgCertAdminRepo struct {
	*StoreAdapter[certification.Certificate]
}

func NewPgCertAdminRepo(ds store.DataStore) certification.Repository {
	return &pgCertAdminRepo{
		StoreAdapter: NewStoreAdapter[certification.Certificate](ds, "certificates"),
	}
}

func (r *pgCertAdminRepo) Create(ctx context.Context, c certification.Certificate) (*certification.Certificate, error) {
	return r.StoreAdapter.Create(c)
}

func (r *pgCertAdminRepo) GetByID(ctx context.Context, id string) (*certification.Certificate, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgCertAdminRepo) GetByVerifyCode(ctx context.Context, code string) (*certification.Certificate, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].VerifyCode == code {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("chứng nhận không tìm thấy")
}

func (r *pgCertAdminRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}

func (r *pgCertAdminRepo) List(ctx context.Context) ([]certification.Certificate, error) {
	return r.StoreAdapter.List()
}

func (r *pgCertAdminRepo) ListByHolder(ctx context.Context, holderType, holderID string) ([]certification.Certificate, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []certification.Certificate
	for _, c := range items {
		if c.HolderType == holderType && c.HolderID == holderID {
			res = append(res, c)
		}
	}
	return res, nil
}

func (r *pgCertAdminRepo) ListByType(ctx context.Context, certType certification.CertType) ([]certification.Certificate, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []certification.Certificate
	for _, c := range items {
		if c.Type == certType {
			res = append(res, c)
		}
	}
	return res, nil
}

func (r *pgCertAdminRepo) ListByStatus(ctx context.Context, status certification.CertStatus) ([]certification.Certificate, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []certification.Certificate
	for _, c := range items {
		if c.Status == status {
			res = append(res, c)
		}
	}
	return res, nil
}

func (r *pgCertAdminRepo) ListExpiring(ctx context.Context, daysThreshold int) ([]certification.Certificate, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []certification.Certificate
	now := time.Now()
	for _, c := range items {
		if c.ValidUntil != "" {
			t, _ := time.Parse("2006-01-02", c.ValidUntil)
			if t.After(now) && t.Sub(now).Hours() < float64(daysThreshold*24) {
				res = append(res, c)
			}
		}
	}
	return res, nil
}

// ── DISCIPLINE ─────────────────────────────────────────────────

type pgCaseRepo struct {
	*StoreAdapter[discipline.DisciplineCase]
}

func NewPgCaseRepo(ds store.DataStore) *pgCaseRepo {
	return &pgCaseRepo{
		StoreAdapter: NewStoreAdapter[discipline.DisciplineCase](ds, "discipline_cases"),
	}
}

func (r *pgCaseRepo) Create(ctx context.Context, c discipline.DisciplineCase) (*discipline.DisciplineCase, error) {
	return r.StoreAdapter.Create(c)
}

func (r *pgCaseRepo) GetByID(ctx context.Context, id string) (*discipline.DisciplineCase, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgCaseRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}

func (r *pgCaseRepo) List(ctx context.Context) ([]discipline.DisciplineCase, error) {
	return r.StoreAdapter.List()
}

func (r *pgCaseRepo) ListByStatus(ctx context.Context, status discipline.CaseStatus) ([]discipline.DisciplineCase, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []discipline.DisciplineCase
	for _, c := range items {
		if c.Status == status {
			res = append(res, c)
		}
	}
	return res, nil
}

func (r *pgCaseRepo) ListBySubject(ctx context.Context, subjectType, subjectID string) ([]discipline.DisciplineCase, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []discipline.DisciplineCase
	for _, c := range items {
		if strings.EqualFold(c.SubjectType, subjectType) && c.SubjectID == subjectID {
			res = append(res, c)
		}
	}
	return res, nil
}

type pgHearingRepo struct {
	*StoreAdapter[discipline.Hearing]
}

func NewPgHearingRepo(ds store.DataStore) *pgHearingRepo {
	return &pgHearingRepo{
		StoreAdapter: NewStoreAdapter[discipline.Hearing](ds, "discipline_hearings"),
	}
}

func (r *pgHearingRepo) Create(ctx context.Context, h discipline.Hearing) (*discipline.Hearing, error) {
	return r.StoreAdapter.Create(h)
}

func (r *pgHearingRepo) GetByID(ctx context.Context, id string) (*discipline.Hearing, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgHearingRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}

func (r *pgHearingRepo) ListByCase(ctx context.Context, caseID string) ([]discipline.Hearing, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []discipline.Hearing
	for _, h := range items {
		if h.CaseID == caseID {
			res = append(res, h)
		}
	}
	return res, nil
}

// ── DOCUMENT ───────────────────────────────────────────────────

type pgDocumentRepo struct {
	*StoreAdapter[document.OfficialDocument]
}

func NewPgDocumentRepo(ds store.DataStore) document.Repository {
	return &pgDocumentRepo{
		StoreAdapter: NewStoreAdapter[document.OfficialDocument](ds, "official_documents"),
	}
}

func (r *pgDocumentRepo) Create(ctx context.Context, doc document.OfficialDocument) (*document.OfficialDocument, error) {
	return r.StoreAdapter.Create(doc)
}

func (r *pgDocumentRepo) GetByID(ctx context.Context, id string) (*document.OfficialDocument, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgDocumentRepo) GetByNumber(ctx context.Context, number string) (*document.OfficialDocument, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for i := range items {
		if items[i].Number == number {
			return &items[i], nil
		}
	}
	return nil, fmt.Errorf("document not found")
}

func (r *pgDocumentRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}

func (r *pgDocumentRepo) List(ctx context.Context) ([]document.OfficialDocument, error) {
	return r.StoreAdapter.List()
}

func (r *pgDocumentRepo) ListByStatus(ctx context.Context, status document.DocStatus) ([]document.OfficialDocument, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []document.OfficialDocument
	for _, doc := range items {
		if doc.Status == status {
			res = append(res, doc)
		}
	}
	return res, nil
}

func (r *pgDocumentRepo) ListByType(ctx context.Context, docType document.DocType) ([]document.OfficialDocument, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []document.OfficialDocument
	for _, doc := range items {
		if doc.Type == docType {
			res = append(res, doc)
		}
	}
	return res, nil
}

func (r *pgDocumentRepo) ListByEntity(ctx context.Context, entityType document.EntityLinkType, entityID string) ([]document.OfficialDocument, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []document.OfficialDocument
	for _, doc := range items {
		// Document search by linked entities
		for _, link := range doc.EntityLinks {
			if link.EntityType == entityType && link.EntityID == entityID {
				res = append(res, doc)
				break
			}
		}
	}
	return res, nil
}

func (r *pgDocumentRepo) Search(ctx context.Context, input document.DocumentSearchInput) ([]document.OfficialDocument, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []document.OfficialDocument
	for _, doc := range items {
		if input.Status != "" && doc.Status != input.Status {
			continue
		}
		if input.Type != "" && doc.Type != input.Type {
			continue
		}
		if input.IssuedBy != "" && doc.IssuedBy != input.IssuedBy {
			continue
		}
		if input.Query != "" && !strings.Contains(strings.ToLower(doc.Title), strings.ToLower(input.Query)) && !strings.Contains(strings.ToLower(doc.Number), strings.ToLower(input.Query)) {
			continue
		}
		res = append(res, doc)
	}
	return res, nil
}

// ── INTERNATIONAL ──────────────────────────────────────────────

type pgPartnerRepo struct {
	*StoreAdapter[international.PartnerOrganization]
}

func NewPgPartnerRepo(ds store.DataStore) *pgPartnerRepo {
	return &pgPartnerRepo{
		StoreAdapter: NewStoreAdapter[international.PartnerOrganization](ds, "intl_partners"),
	}
}

func (r *pgPartnerRepo) Create(ctx context.Context, p international.PartnerOrganization) (*international.PartnerOrganization, error) {
	return r.StoreAdapter.Create(p)
}

func (r *pgPartnerRepo) GetByID(ctx context.Context, id string) (*international.PartnerOrganization, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgPartnerRepo) List(ctx context.Context) ([]international.PartnerOrganization, error) {
	return r.StoreAdapter.List()
}

func (r *pgPartnerRepo) ListByCountry(ctx context.Context, country string) ([]international.PartnerOrganization, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []international.PartnerOrganization
	for _, p := range items {
		if p.Country == country {
			res = append(res, p)
		}
	}
	return res, nil
}

func (r *pgPartnerRepo) Update(ctx context.Context, id string, p international.PartnerOrganization) (*international.PartnerOrganization, error) {
	p.ID = id
	_, err := r.StoreAdapter.Update(id, p)
	if err != nil {
		return nil, err
	}
	return &p, nil
}

type pgIntlEventRepo struct {
	*StoreAdapter[international.InternationalEvent]
}

func NewPgIntlEventRepo(ds store.DataStore) *pgIntlEventRepo {
	return &pgIntlEventRepo{
		StoreAdapter: NewStoreAdapter[international.InternationalEvent](ds, "intl_events"),
	}
}

func (r *pgIntlEventRepo) Create(ctx context.Context, e international.InternationalEvent) (*international.InternationalEvent, error) {
	return r.StoreAdapter.Create(e)
}

func (r *pgIntlEventRepo) GetByID(ctx context.Context, id string) (*international.InternationalEvent, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgIntlEventRepo) List(ctx context.Context) ([]international.InternationalEvent, error) {
	return r.StoreAdapter.List()
}

func (r *pgIntlEventRepo) ListUpcoming(ctx context.Context) ([]international.InternationalEvent, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []international.InternationalEvent
	now := time.Now()
	for _, e := range items {
		if e.StartDate.After(now) {
			res = append(res, e)
		}
	}
	return res, nil
}

type pgDelegationRepo struct {
	*StoreAdapter[international.Delegation]
}

func NewPgDelegationRepo(ds store.DataStore) *pgDelegationRepo {
	return &pgDelegationRepo{
		StoreAdapter: NewStoreAdapter[international.Delegation](ds, "intl_delegations"),
	}
}

func (r *pgDelegationRepo) Create(ctx context.Context, d international.Delegation) (*international.Delegation, error) {
	return r.StoreAdapter.Create(d)
}

func (r *pgDelegationRepo) GetByID(ctx context.Context, id string) (*international.Delegation, error) {
	return r.StoreAdapter.GetByID(id)
}

func (r *pgDelegationRepo) ListByEvent(ctx context.Context, eventID string) ([]international.Delegation, error) {
	items, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var res []international.Delegation
	for _, d := range items {
		if d.EventID == eventID {
			res = append(res, d)
		}
	}
	return res, nil
}

func (r *pgDelegationRepo) Update(ctx context.Context, id string, d international.Delegation) (*international.Delegation, error) {
	d.ID = id
	_, err := r.StoreAdapter.Update(id, d)
	if err != nil {
		return nil, err
	}
	return &d, nil
}
