---
name: vct-state-machine
description: State machine patterns for VCT Platform — centralized transition validation, 12 entity lifecycles, guard conditions, side effects, testing state transitions, and extending with new states.
---

# VCT Platform State Machine Patterns

> **When to activate**: Adding/modifying entity states, implementing approval workflows, fixing transition bugs, or extending lifecycle rules for any domain entity.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

All state machines are defined in `backend/internal/domain/state_machine.go` using `TransitionMap`:

```go
type TransitionMap map[string][]string  // from → []to

func (t TransitionMap) CanTransition(from, to string) bool
func ValidateTransition(transitions TransitionMap, from, to string) error
func GetAllowedTransitions(transitions TransitionMap, from string) []string
func IsTerminalState(transitions TransitionMap, status string) bool
```

---

## 2. Entity Lifecycle Catalog (12 State Machines)

| Entity | Variable | States | Terminal |
|--------|----------|--------|----------|
| Tournament | `TournamentTransitions` | nhập→đăng_ký→khóa_đk→thi_đấu→kết_thúc | kết_thúc |
| Team (Đoàn) | `TeamTransitions` | nhập→chờ_duyệt→đã_xác_nhận→đã_đóng_phí→đã_checkin | đã_checkin |
| Athlete (VĐV) | `AthleteTransitions` | nhập→chờ_xác_nhận→đủ_điều_kiện→đã_cân→đủ_đk_thi→đang_thi→hoàn_thành | hoàn_thành, rút_lui |
| Registration | `RegistrationTransitions` | nhập→chờ_duyệt→đã_duyệt→đã_cân_ký→đủ_đk_thi→đang_thi→hoàn_thành | hoàn_thành, rút_lui |
| Club | `ClubTransitions` | chờ_xem_xét→LĐ_tỉnh_duyệt→LĐ_quốc_gia_duyệt→hoạt_động | giải_thể |
| Transaction | `TransactionTransitions` | nhập→chờ_duyệt→đã_duyệt→đã_thực_hiện | đã_thực_hiện |
| Invoice | `InvoiceTransitions` | draft→pending→approved→sent→paid→completed | completed, cancelled |
| Belt Exam | `BeltExamTransitions` | đăng_ký_thi→chờ_duyệt→đủ_đk→thi_thực_hành→đạt→chờ_cấp_bằng→đã_thăng_đai | đã_thăng_đai, không_đạt |
| Appeal | `AppealTransitions` | nộp→tiếp_nhận→xem_xét→chấp_nhận/bác_bỏ→hoàn_tất | hoàn_tất |
| Match | `MatchTransitions` | scheduled→ready→in_progress↔paused→completed→confirmed→published | published, cancelled |
| Protest | `ProtestTransitions` | mới→tiếp_nhận→xem_xét→chấp_nhận/bác_bỏ→hoàn_tất | hoàn_tất |
| Weigh-In | `WeighInTransitions` | chờ_cân→đang_cân→đạt/không_đạt↔cân_lại | đạt |
| Sponsorship | `SponsorshipTransitions` | prospecting→negotiating→signed→active→completed | completed, terminated, lost |

---

## 3. Using in Service Layer

```go
func (s *Service) UpdateStatus(id, newStatus string) error {
    entity, err := s.repo.GetByID(id)
    if err != nil { return err }

    // Validate transition
    if err := domain.ValidateTransition(domain.EntityTransitions, entity.Status, newStatus); err != nil {
        return fmt.Errorf("invalid transition: %w", err)
    }

    entity.Status = newStatus
    entity.UpdatedAt = time.Now().UTC()
    return s.repo.Update(entity)
}
```

---

## 4. Adding New States

### Step 1: Add to TransitionMap
```go
var MyTransitions = TransitionMap{
    "new_status": {"next_status1", "next_status2"},
    // ...
}
```

### Step 2: Update Database Migration
```sql
-- If using CHECK constraint on status column
ALTER TABLE entities DROP CONSTRAINT IF EXISTS entities_status_check;
ALTER TABLE entities ADD CONSTRAINT entities_status_check
  CHECK (status IN ('status1', 'status2', 'new_status'));
```

### Step 3: Update Frontend i18n
```typescript
// Add status label in vi.ts and en.ts
'status.new_status': 'Trạng thái mới',
```

### Step 4: Add Tests
```go
func TestMyTransitions(t *testing.T) {
    tests := []struct{ from, to string; valid bool }{
        {"new_status", "next_status1", true},
        {"new_status", "invalid", false},
    }
    for _, tt := range tests {
        err := domain.ValidateTransition(domain.MyTransitions, tt.from, tt.to)
        if (err == nil) != tt.valid {
            t.Errorf("%s→%s: expected valid=%v", tt.from, tt.to, tt.valid)
        }
    }
}
```

---

## 5. Side Effects on Transition

When a state transition occurs, publish a domain event:

```go
s.eventBus.Publish(events.DomainEvent{
    Type:       events.EventStatusChanged,
    EntityType: "tournament",
    EntityID:   entity.ID,
    Payload:    map[string]any{"from": oldStatus, "to": newStatus},
})
```

Common side effects:
| Transition | Side Effect |
|------------|-------------|
| `chờ_duyệt` → `đã_duyệt` | Send approval notification |
| `đã_đóng_phí` → `đã_checkin` | Generate competition badge |
| `in_progress` → `completed` | Calculate final scores |
| `completed` → `confirmed` | Lock score editing |

---

## 6. Anti-Patterns

1. ❌ **NEVER** change status without `ValidateTransition()` — always validate
2. ❌ **NEVER** modify `TransitionMap` at runtime — it's defined at compile time
3. ❌ **NEVER** add cycles without explicit escape (risk infinite loops)
4. ❌ **NEVER** skip domain events on status changes — they drive notifications/integrations
5. ❌ **NEVER** hardcode status strings in handlers — use constants
