package adapter

import (
	"context"
	"fmt"

	"vct-platform/backend/internal/domain/approval"
	"vct-platform/backend/internal/domain/certification"
	"vct-platform/backend/internal/domain/discipline"
	"vct-platform/backend/internal/domain/document"
	"vct-platform/backend/internal/domain/federation"
	"vct-platform/backend/internal/domain/international"
	"vct-platform/backend/internal/store"
)

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION DOMAIN STORE ADAPTERS
// Persistent adapters using StoreAdapter[T] for SQL/Postgres.
// Replace in-memory adapters when DB is ready.
// ═══════════════════════════════════════════════════════════════

var errNotFound = fmt.Errorf("not found")

// ── Federation (Province) ────────────────────────────────────

type provinceStoreRepo struct {
	*StoreAdapter[federation.Province]
}

func NewProvinceRepository(ds store.DataStore) federation.ProvinceRepository {
	return &provinceStoreRepo{NewStoreAdapter[federation.Province](ds, "federation_provinces")}
}

func (r *provinceStoreRepo) List(ctx context.Context) ([]federation.Province, error) {
	return r.StoreAdapter.List()
}
func (r *provinceStoreRepo) GetByID(ctx context.Context, id string) (*federation.Province, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *provinceStoreRepo) GetByCode(ctx context.Context, code string) (*federation.Province, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	for _, p := range all {
		if p.Code == code {
			return &p, nil
		}
	}
	return nil, errNotFound
}
func (r *provinceStoreRepo) Create(ctx context.Context, p federation.Province) (*federation.Province, error) {
	return r.StoreAdapter.Create(p)
}
func (r *provinceStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *provinceStoreRepo) ListByRegion(ctx context.Context, region federation.RegionCode) ([]federation.Province, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []federation.Province
	for _, p := range all {
		if p.Region == region {
			out = append(out, p)
		}
	}
	return out, nil
}

// ── Federation (Unit) ────────────────────────────────────────

type unitStoreRepo struct {
	*StoreAdapter[federation.FederationUnit]
}

func NewUnitRepository(ds store.DataStore) federation.FederationUnitRepository {
	return &unitStoreRepo{NewStoreAdapter[federation.FederationUnit](ds, "federation_units")}
}

func (r *unitStoreRepo) List(ctx context.Context) ([]federation.FederationUnit, error) {
	return r.StoreAdapter.List()
}
func (r *unitStoreRepo) GetByID(ctx context.Context, id string) (*federation.FederationUnit, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *unitStoreRepo) Create(ctx context.Context, u federation.FederationUnit) (*federation.FederationUnit, error) {
	return r.StoreAdapter.Create(u)
}
func (r *unitStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *unitStoreRepo) Delete(ctx context.Context, id string) error {
	return r.StoreAdapter.Delete(id)
}
func (r *unitStoreRepo) ListByType(ctx context.Context, uType federation.UnitType) ([]federation.FederationUnit, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []federation.FederationUnit
	for _, u := range all {
		if u.Type == uType {
			out = append(out, u)
		}
	}
	return out, nil
}
func (r *unitStoreRepo) ListByParent(ctx context.Context, parentID string) ([]federation.FederationUnit, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []federation.FederationUnit
	for _, u := range all {
		if u.ParentID == parentID {
			out = append(out, u)
		}
	}
	return out, nil
}

// ── Federation (Personnel) ───────────────────────────────────

type personnelStoreRepo struct {
	*StoreAdapter[federation.PersonnelAssignment]
}

func NewPersonnelRepository(ds store.DataStore) federation.PersonnelRepository {
	return &personnelStoreRepo{NewStoreAdapter[federation.PersonnelAssignment](ds, "federation_personnel")}
}

func (r *personnelStoreRepo) List(ctx context.Context, unitID string) ([]federation.PersonnelAssignment, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	if unitID == "" {
		return all, nil
	}
	var out []federation.PersonnelAssignment
	for _, a := range all {
		if a.UnitID == unitID {
			out = append(out, a)
		}
	}
	return out, nil
}
func (r *personnelStoreRepo) Create(ctx context.Context, a federation.PersonnelAssignment) error {
	_, err := r.StoreAdapter.Create(a)
	return err
}
func (r *personnelStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *personnelStoreRepo) Deactivate(ctx context.Context, id string) error {
	_, err := r.StoreAdapter.Update(id, map[string]interface{}{
		"status": "inactive",
	})
	return err
}
func (r *personnelStoreRepo) GetByUserAndUnit(ctx context.Context, userID, unitID string) (*federation.PersonnelAssignment, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	for _, a := range all {
		if a.UserID == userID && a.UnitID == unitID {
			return &a, nil
		}
	}
	return nil, errNotFound
}

// ── Approval (Workflow) ──────────────────────────────────────

type workflowStoreRepo struct {
	*StoreAdapter[approval.WorkflowDefinition]
}

func NewWorkflowRepository(ds store.DataStore) approval.WorkflowRepository {
	return &workflowStoreRepo{NewStoreAdapter[approval.WorkflowDefinition](ds, "approval_workflows")}
}

func (r *workflowStoreRepo) Create(ctx context.Context, wf approval.WorkflowDefinition) error {
	_, err := r.StoreAdapter.Create(wf)
	return err
}
func (r *workflowStoreRepo) GetByCode(ctx context.Context, code string) (*approval.WorkflowDefinition, error) {
	all, _ := r.StoreAdapter.List()
	for _, wf := range all {
		if wf.WorkflowCode == code {
			return &wf, nil
		}
	}
	return nil, errNotFound
}
func (r *workflowStoreRepo) List(ctx context.Context) ([]approval.WorkflowDefinition, error) {
	return r.StoreAdapter.List()
}

// ── Approval (Request) ───────────────────────────────────────

type requestStoreRepo struct {
	*StoreAdapter[approval.ApprovalRequest]
}

func NewRequestRepository(ds store.DataStore) approval.RequestRepository {
	return &requestStoreRepo{NewStoreAdapter[approval.ApprovalRequest](ds, "approval_requests")}
}

func (r *requestStoreRepo) Create(ctx context.Context, req approval.ApprovalRequest) (*approval.ApprovalRequest, error) {
	return r.StoreAdapter.Create(req)
}
func (r *requestStoreRepo) GetByID(ctx context.Context, id string) (*approval.ApprovalRequest, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *requestStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *requestStoreRepo) ListByRequester(ctx context.Context, userID string) ([]approval.ApprovalRequest, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalRequest
	for _, req := range all {
		if req.RequestedBy == userID {
			out = append(out, req)
		}
	}
	return out, nil
}
func (r *requestStoreRepo) ListByApproverRole(ctx context.Context, role string) ([]approval.ApprovalRequest, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalRequest
	for _, req := range all {
		if req.Status == approval.StatusPending || req.Status == approval.StatusInReview {
			out = append(out, req)
		}
	}
	return out, nil
}
func (r *requestStoreRepo) ListByStatus(ctx context.Context, status approval.RequestStatus) ([]approval.ApprovalRequest, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalRequest
	for _, req := range all {
		if req.Status == status {
			out = append(out, req)
		}
	}
	return out, nil
}

// ── Approval (Step) ──────────────────────────────────────────

type stepStoreRepo struct {
	*StoreAdapter[approval.ApprovalStep]
}

func NewStepRepository(ds store.DataStore) approval.StepRepository {
	return &stepStoreRepo{NewStoreAdapter[approval.ApprovalStep](ds, "approval_steps")}
}

func (r *stepStoreRepo) Create(ctx context.Context, step approval.ApprovalStep) error {
	_, err := r.StoreAdapter.Create(step)
	return err
}
func (r *stepStoreRepo) ListByRequest(ctx context.Context, requestID string) ([]approval.ApprovalStep, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalStep
	for _, s := range all {
		if s.RequestID == requestID {
			out = append(out, s)
		}
	}
	return out, nil
}
func (r *stepStoreRepo) GetCurrentStep(ctx context.Context, requestID string, stepNumber int) (*approval.ApprovalStep, error) {
	all, err := r.ListByRequest(ctx, requestID)
	if err != nil {
		return nil, err
	}
	for _, s := range all {
		if s.StepNumber == stepNumber {
			return &s, nil
		}
	}
	return nil, errNotFound
}
func (r *stepStoreRepo) UpdateDecision(ctx context.Context, stepID string, decision approval.StepDecision, decidedBy string, comment string) error {
	_, err := r.StoreAdapter.Update(stepID, map[string]interface{}{
		"decision":   string(decision),
		"decided_by": decidedBy,
		"comment":    comment,
	})
	return err
}

// ── Approval (History) ───────────────────────────────────────

type historyStoreRepo struct {
	*StoreAdapter[approval.ApprovalHistory]
}

func NewHistoryRepository(ds store.DataStore) approval.HistoryRepository {
	return &historyStoreRepo{NewStoreAdapter[approval.ApprovalHistory](ds, "approval_history")}
}

func (r *historyStoreRepo) Append(ctx context.Context, h approval.ApprovalHistory) error {
	_, err := r.StoreAdapter.Create(h)
	return err
}
func (r *historyStoreRepo) ListByRequest(ctx context.Context, requestID string) ([]approval.ApprovalHistory, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []approval.ApprovalHistory
	for _, h := range all {
		if h.RequestID == requestID {
			out = append(out, h)
		}
	}
	return out, nil
}

// ── Certification ────────────────────────────────────────────

type certStoreRepo struct {
	*StoreAdapter[certification.Certificate]
}

func NewCertStoreRepository(ds store.DataStore) certification.Repository {
	return &certStoreRepo{NewStoreAdapter[certification.Certificate](ds, "certifications")}
}

func (r *certStoreRepo) Create(ctx context.Context, c certification.Certificate) (*certification.Certificate, error) {
	return r.StoreAdapter.Create(c)
}
func (r *certStoreRepo) GetByID(ctx context.Context, id string) (*certification.Certificate, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *certStoreRepo) GetByVerifyCode(ctx context.Context, code string) (*certification.Certificate, error) {
	all, _ := r.StoreAdapter.List()
	for _, c := range all {
		if c.VerifyCode == code {
			return &c, nil
		}
	}
	return nil, errNotFound
}
func (r *certStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *certStoreRepo) List(ctx context.Context) ([]certification.Certificate, error) {
	return r.StoreAdapter.List()
}
func (r *certStoreRepo) ListByHolder(ctx context.Context, holderType, holderID string) ([]certification.Certificate, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	if holderType == "" && holderID == "" {
		return all, nil
	}
	var out []certification.Certificate
	for _, c := range all {
		if (holderType == "" || c.HolderType == holderType) && (holderID == "" || c.HolderID == holderID) {
			out = append(out, c)
		}
	}
	return out, nil
}
func (r *certStoreRepo) ListByType(ctx context.Context, certType certification.CertType) ([]certification.Certificate, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []certification.Certificate
	for _, c := range all {
		if c.Type == certType {
			out = append(out, c)
		}
	}
	return out, nil
}
func (r *certStoreRepo) ListByStatus(ctx context.Context, status certification.CertStatus) ([]certification.Certificate, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []certification.Certificate
	for _, c := range all {
		if c.Status == status {
			out = append(out, c)
		}
	}
	return out, nil
}
func (r *certStoreRepo) ListExpiring(ctx context.Context, daysThreshold int) ([]certification.Certificate, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []certification.Certificate
	for _, c := range all {
		if c.Status == certification.CertStatusActive || c.Status == certification.CertStatusExpiring {
			out = append(out, c)
		}
	}
	return out, nil
}

// ── Discipline ───────────────────────────────────────────────

type caseStoreRepo struct {
	*StoreAdapter[discipline.DisciplineCase]
}

func NewCaseStoreRepository(ds store.DataStore) discipline.CaseRepository {
	return &caseStoreRepo{NewStoreAdapter[discipline.DisciplineCase](ds, "discipline_cases")}
}

func (r *caseStoreRepo) Create(ctx context.Context, c discipline.DisciplineCase) (*discipline.DisciplineCase, error) {
	return r.StoreAdapter.Create(c)
}
func (r *caseStoreRepo) GetByID(ctx context.Context, id string) (*discipline.DisciplineCase, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *caseStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *caseStoreRepo) List(ctx context.Context) ([]discipline.DisciplineCase, error) {
	return r.StoreAdapter.List()
}
func (r *caseStoreRepo) ListByStatus(ctx context.Context, status discipline.CaseStatus) ([]discipline.DisciplineCase, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []discipline.DisciplineCase
	for _, c := range all {
		if c.Status == status {
			out = append(out, c)
		}
	}
	return out, nil
}
func (r *caseStoreRepo) ListBySubject(ctx context.Context, subjectType, subjectID string) ([]discipline.DisciplineCase, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []discipline.DisciplineCase
	for _, c := range all {
		if c.SubjectType == subjectType && c.SubjectID == subjectID {
			out = append(out, c)
		}
	}
	return out, nil
}

type hearingStoreRepo struct {
	*StoreAdapter[discipline.Hearing]
}

func NewHearingStoreRepository(ds store.DataStore) discipline.HearingRepository {
	return &hearingStoreRepo{NewStoreAdapter[discipline.Hearing](ds, "discipline_hearings")}
}

func (r *hearingStoreRepo) Create(ctx context.Context, h discipline.Hearing) (*discipline.Hearing, error) {
	return r.StoreAdapter.Create(h)
}
func (r *hearingStoreRepo) GetByID(ctx context.Context, id string) (*discipline.Hearing, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *hearingStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *hearingStoreRepo) ListByCase(ctx context.Context, caseID string) ([]discipline.Hearing, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	var out []discipline.Hearing
	for _, h := range all {
		if h.CaseID == caseID {
			out = append(out, h)
		}
	}
	return out, nil
}

// ── Document ─────────────────────────────────────────────────

type documentStoreRepo struct {
	*StoreAdapter[document.OfficialDocument]
}

func NewDocumentStoreRepository(ds store.DataStore) document.Repository {
	return &documentStoreRepo{NewStoreAdapter[document.OfficialDocument](ds, "official_documents")}
}

func (r *documentStoreRepo) Create(ctx context.Context, doc document.OfficialDocument) (*document.OfficialDocument, error) {
	return r.StoreAdapter.Create(doc)
}
func (r *documentStoreRepo) GetByID(ctx context.Context, id string) (*document.OfficialDocument, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *documentStoreRepo) GetByNumber(ctx context.Context, number string) (*document.OfficialDocument, error) {
	all, _ := r.StoreAdapter.List()
	for _, d := range all {
		if d.Number == number {
			return &d, nil
		}
	}
	return nil, errNotFound
}
func (r *documentStoreRepo) Update(ctx context.Context, id string, patch map[string]interface{}) error {
	_, err := r.StoreAdapter.Update(id, patch)
	return err
}
func (r *documentStoreRepo) List(ctx context.Context) ([]document.OfficialDocument, error) {
	return r.StoreAdapter.List()
}
func (r *documentStoreRepo) ListByStatus(ctx context.Context, status document.DocStatus) ([]document.OfficialDocument, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []document.OfficialDocument
	for _, d := range all {
		if d.Status == status {
			out = append(out, d)
		}
	}
	return out, nil
}
func (r *documentStoreRepo) ListByType(ctx context.Context, docType document.DocType) ([]document.OfficialDocument, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []document.OfficialDocument
	for _, d := range all {
		if d.Type == docType {
			out = append(out, d)
		}
	}
	return out, nil
}
func (r *documentStoreRepo) ListByEntity(ctx context.Context, entityType document.EntityLinkType, entityID string) ([]document.OfficialDocument, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []document.OfficialDocument
	for _, d := range all {
		for _, link := range d.EntityLinks {
			if link.EntityType == entityType && link.EntityID == entityID {
				out = append(out, d)
				break
			}
		}
	}
	return out, nil
}
func (r *documentStoreRepo) Search(ctx context.Context, input document.DocumentSearchInput) ([]document.OfficialDocument, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []document.OfficialDocument
	for _, d := range all {
		match := true
		if input.Type != "" && d.Type != input.Type {
			match = false
		}
		if input.Status != "" && d.Status != input.Status {
			match = false
		}
		if input.IssuedBy != "" && d.IssuedBy != input.IssuedBy {
			match = false
		}
		if match {
			out = append(out, d)
		}
	}
	return out, nil
}

// ── International Partners ───────────────────────────────────

type partnerStoreRepo struct {
	*StoreAdapter[international.PartnerOrganization]
}

func NewPartnerStoreRepository(ds store.DataStore) international.PartnerRepository {
	return &partnerStoreRepo{NewStoreAdapter[international.PartnerOrganization](ds, "international_partners")}
}

func (r *partnerStoreRepo) Create(ctx context.Context, p international.PartnerOrganization) (*international.PartnerOrganization, error) {
	return r.StoreAdapter.Create(p)
}
func (r *partnerStoreRepo) GetByID(ctx context.Context, id string) (*international.PartnerOrganization, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *partnerStoreRepo) Update(ctx context.Context, id string, partner international.PartnerOrganization) (*international.PartnerOrganization, error) {
	partner.ID = id
	updated, err := r.StoreAdapter.Update(id, map[string]interface{}{"_replace": partner})
	if err != nil {
		return nil, err
	}
	return updated, nil
}
func (r *partnerStoreRepo) List(ctx context.Context) ([]international.PartnerOrganization, error) {
	return r.StoreAdapter.List()
}
func (r *partnerStoreRepo) ListByCountry(ctx context.Context, country string) ([]international.PartnerOrganization, error) {
	all, err := r.List(ctx)
	if err != nil {
		return nil, err
	}
	var out []international.PartnerOrganization
	for _, p := range all {
		if p.Country == country {
			out = append(out, p)
		}
	}
	return out, nil
}

// ── International Events ─────────────────────────────────────

type intlEventStoreRepo struct {
	*StoreAdapter[international.InternationalEvent]
}

func NewInternationalEventRepository(ds store.DataStore) international.EventRepository {
	return &intlEventStoreRepo{NewStoreAdapter[international.InternationalEvent](ds, "international_events")}
}

func (r *intlEventStoreRepo) Create(ctx context.Context, e international.InternationalEvent) (*international.InternationalEvent, error) {
	return r.StoreAdapter.Create(e)
}
func (r *intlEventStoreRepo) GetByID(ctx context.Context, id string) (*international.InternationalEvent, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *intlEventStoreRepo) List(ctx context.Context) ([]international.InternationalEvent, error) {
	return r.StoreAdapter.List()
}
func (r *intlEventStoreRepo) ListUpcoming(ctx context.Context) ([]international.InternationalEvent, error) {
	return r.List(ctx)
}

// ── International Delegations ────────────────────────────────

type delegationStoreRepo struct {
	*StoreAdapter[international.Delegation]
}

func NewDelegationStoreRepository(ds store.DataStore) international.DelegationRepository {
	return &delegationStoreRepo{NewStoreAdapter[international.Delegation](ds, "international_delegations")}
}

func (r *delegationStoreRepo) Create(ctx context.Context, d international.Delegation) (*international.Delegation, error) {
	return r.StoreAdapter.Create(d)
}
func (r *delegationStoreRepo) GetByID(ctx context.Context, id string) (*international.Delegation, error) {
	return r.StoreAdapter.GetByID(id)
}
func (r *delegationStoreRepo) Update(ctx context.Context, id string, del international.Delegation) (*international.Delegation, error) {
	del.ID = id
	updated, err := r.StoreAdapter.Update(id, map[string]interface{}{"_replace": del})
	if err != nil {
		return nil, err
	}
	return updated, nil
}
func (r *delegationStoreRepo) ListByEvent(ctx context.Context, eventID string) ([]international.Delegation, error) {
	all, err := r.StoreAdapter.List()
	if err != nil {
		return nil, err
	}
	if eventID == "" {
		return all, nil
	}
	var out []international.Delegation
	for _, d := range all {
		if d.EventID == eventID {
			out = append(out, d)
		}
	}
	return out, nil
}
