---
description: Workflow thêm dữ liệu seed/reference cho VCT Platform (đai, hạng cân, quy chế, etc.)
---

# /add-seed-data — Thêm Dữ Liệu Seed/Reference

> Sử dụng khi cần thêm dữ liệu chuẩn, dữ liệu tham chiếu, hoặc dữ liệu cấu hình vào hệ thống.
> Đặc biệt quan trọng cho VCT: hệ thống đai, hạng cân, nhóm tuổi, quy chế thi đấu, etc.

// turbo-all

---

## Bước 1: Xác Định Loại Dữ Liệu

| Loại | Ví dụ | Đặc điểm |
|------|------|----------|
| **Reference Data** | Hệ thống đai (belt levels), hạng cân (weight classes) | Ít thay đổi, chuẩn quốc gia |
| **Regulation Data** | Quy chế thi đấu, luật 128/2024 | Từ docs/regulations/, versioned |
| **Configuration** | System settings, feature flags | Admin quản lý |
| **Demo/Test Data** | Mock athletes, clubs, tournaments | Chỉ dùng development |
| **Lookup Data** | Tỉnh/thành, quốc gia, loại giải đấu | Tĩnh, fixed list |

---

## Bước 2: Xác Định Nguồn Dữ Liệu

1. **Regulations**: Đọc từ `docs/regulations/` 
   - Kiểm tra version/amendment nào đang áp dụng
   - Đối chiếu với BA skill (`/.agent/skills/vct-ba/SKILL.md`)
2. **Standard lists**: Từ quy chế quốc gia
   - Hệ thống đai: 10 cấp (Trắng → Đen)
   - Hạng cân: theo quy chế thi đấu
   - Nhóm tuổi: Thiếu niên, Thanh niên, Tráng niên
3. **Geographic data**: 63 tỉnh/thành
4. **Test data**: Mock data phù hợp với domain

---

## Bước 3: Tạo Seed Data

### Lựa chọn 1: Go Seed Code
File: `backend/internal/store/{module}_seed.go` hoặc trong migration

```go
func SeedBeltLevels(ctx context.Context, pool *pgxpool.Pool) error {
    belts := []struct {
        Level int
        NameVI string
        NameEN string
        Color  string
    }{
        {1, "Trắng", "White", "#FFFFFF"},
        {2, "Vàng", "Yellow", "#FFD700"},
        // ...
    }
    
    for _, b := range belts {
        _, err := pool.Exec(ctx,
            `INSERT INTO belt_levels (level, name_vi, name_en, color)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (level) DO NOTHING`,
            b.Level, b.NameVI, b.NameEN, b.Color,
        )
        if err != nil {
            return fmt.Errorf("seed belt %d: %w", b.Level, err)
        }
    }
    return nil
}
```

### Lựa chọn 2: SQL Seed File
File: `backend/migrations/{NNNN}_seed_{description}.sql`

```sql
-- Seed: Belt levels reference data
INSERT INTO belt_levels (level, name_vi, name_en, color) VALUES
    (1, 'Trắng', 'White', '#FFFFFF'),
    (2, 'Vàng', 'Yellow', '#FFD700')
ON CONFLICT (level) DO NOTHING;
```

### Quy Tắc Seed Data ⚠️
- ✅ **Idempotent**: `ON CONFLICT DO NOTHING` hoặc `UPSERT`
- ✅ **Bilingual**: Luôn có `name_vi` + `name_en` cho dữ liệu hiển thị
- ✅ **Source of truth**: Note rõ nguồn dữ liệu (quy chế nào, version nào)
- ✅ **Versioned**: Nếu dữ liệu có thể thay đổi → track `effective_date`
- ❌ **KHÔNG** hardcode dữ liệu trong frontend
- ❌ **KHÔNG** để dữ liệu test lẫn vào production seed

---

## Bước 4: Đồng Bộ Frontend Types

Nếu seed data tạo lookup/reference data mới:

### TypeScript Enums/Constants
```typescript
// packages/shared-types/src/{module}/common.ts
export const BELT_LEVELS = [
  { level: 1, nameVI: 'Trắng', nameEN: 'White', color: '#FFFFFF' },
  { level: 2, nameVI: 'Vàng', nameEN: 'Yellow', color: '#FFD700' },
  // ...
] as const
```

### API Integration
- Ưu tiên: Fetch reference data từ API endpoint
- Fallback: Constants trong shared-types (cho offline/performance)

---

## Bước 5: Verify

```bash
# Chạy seed
cd backend && go run ./cmd/migrate seed

# Verify data
# Kiểm tra database có dữ liệu đúng

# Build check
cd backend && go build ./...
npm run typecheck
```

Checklist:
- [ ] Seed chạy thành công không lỗi
- [ ] Chạy lại seed → không duplicate (idempotent)
- [ ] Dữ liệu khớp với quy chế/regulation nguồn
- [ ] Bilingual (vi + en) cho tất cả display data
- [ ] Frontend types đồng bộ
- [ ] Source of truth documented (regulation code, version)
