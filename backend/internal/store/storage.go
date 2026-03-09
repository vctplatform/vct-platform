package store

type DataStore interface {
	EnsureEntity(entity string)
	List(entity string) []map[string]any
	GetByID(entity, id string) (map[string]any, bool)
	Create(entity string, item map[string]any) (map[string]any, error)
	Update(entity, id string, patch map[string]any) (map[string]any, error)
	Delete(entity, id string)
	ReplaceAll(entity string, items []map[string]any) ([]map[string]any, error)
	Import(entity string, payload []any) ImportReport
	ExportJSON(entity string) (string, error)
	ExportCSV(entity string) (string, error)
	Close() error
}
