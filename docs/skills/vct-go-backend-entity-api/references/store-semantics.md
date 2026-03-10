# Store Semantics

## Data Shape

- Store entities in `map[string]map[string]map[string]any`.
- Key hierarchy: `entity -> id -> document`.
- Clone payload maps on read/write boundaries.

## Method Expectations

- `EnsureEntity(entity)`: create bucket when missing.
- `List(entity)`: return deterministic ID-sorted slice.
- `GetByID(entity, id)`: return `(item, true)` or `(nil, false)`.
- `Create(entity, item)`: require non-empty string `id`; reject duplicate ID.
- `Update(entity, id, patch)`: ignore patch `id`, preserve original ID.
- `Delete(entity, id)`: no-op when entity or record missing.
- `ReplaceAll(entity, items)`: rebuild bucket from input list; reject invalid IDs.
- `Import(entity, payload)`: append rejected item report instead of failing whole request.
- `ExportJSON(entity)`: pretty JSON output.
- `ExportCSV(entity)`: CSV with sorted headers from first row.

## Validation Rules

- Enforce `id` presence and non-empty string in `requireID`.
- Treat invalid payload types as rejected import items.

## Concurrency Rules

- Guard writes with `mu.Lock`.
- Guard reads with `mu.RLock`.
- Avoid returning internal map references directly.
