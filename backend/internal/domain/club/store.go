package club

import "context"

// ── Store Interfaces ─────────────────────────────────────────
// Each store manages one aggregate root. Adapters (in-memory or Postgres)
// implement these interfaces.

// AttendanceStore persists attendance records.
type AttendanceStore interface {
	List(ctx context.Context, clubID string) ([]Attendance, error)
	ListByClass(ctx context.Context, clubID, classID string) ([]Attendance, error)
	ListByDate(ctx context.Context, clubID, date string) ([]Attendance, error)
	GetByID(ctx context.Context, id string) (*Attendance, error)
	Create(ctx context.Context, a Attendance) (*Attendance, error)
	Delete(ctx context.Context, id string) error
}

// EquipmentStore persists equipment inventory.
type EquipmentStore interface {
	List(ctx context.Context, clubID string) ([]Equipment, error)
	GetByID(ctx context.Context, id string) (*Equipment, error)
	Create(ctx context.Context, e Equipment) (*Equipment, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}

// FacilityStore persists facility records.
type FacilityStore interface {
	List(ctx context.Context, clubID string) ([]Facility, error)
	GetByID(ctx context.Context, id string) (*Facility, error)
	Create(ctx context.Context, f Facility) (*Facility, error)
	Update(ctx context.Context, id string, patch map[string]interface{}) error
	Delete(ctx context.Context, id string) error
}
