---
description: Auto-generate TypeScript types from Go backend models for frontend type safety
---

## Steps

1. Find all Go domain model files
```bash
Get-ChildItem -Path "backend\internal\domain" -Recurse -Include "*.go" | Where-Object { $_.Name -notmatch "_test\.go$" } | Select-Object -ExpandProperty FullName
```

2. Extract exported struct definitions
```bash
Select-String -Path (Get-ChildItem -Path "backend\internal\domain" -Recurse -Include "*.go" | Where-Object { $_.Name -notmatch "_test\.go$" }).FullName -Pattern "^type \w+ struct" | ForEach-Object { $_.Line }
```

3. Compare with existing TypeScript types
```bash
Get-Content "packages\types\src\common.ts" | Select-String -Pattern "^export (interface|type) "
```

4. Generate/update TypeScript interfaces
- For each Go struct, create a corresponding TypeScript interface in `packages/types/src/`
- Map Go types to TypeScript:
  - `string` → `string`
  - `int`, `int64`, `float64` → `number`
  - `bool` → `boolean`
  - `time.Time` → `string` (ISO 8601)
  - `uuid.UUID` → `string`
  - `[]T` → `T[]`
  - `*T` → `T | null`
  - `map[string]any` → `Record<string, unknown>`

5. Run TypeScript check to verify generated types
```bash
npx tsc --noEmit
```
