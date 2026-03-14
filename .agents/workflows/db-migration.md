---
description: Workflow tạo và quản lý database migration cho VCT Platform
---

# /db-migration — Database Migration

> Sử dụng khi cần thêm/sửa/xoá bảng, cột, index, hoặc constraints trong database.

// turbo-all

---

## Bước 1: Thiết Kế Schema Changes

1. Xác định thay đổi cần thiết:
   | Loại | Ví dụ |
   |------|------|
   | Tạo bảng mới | `CREATE TABLE athletes (...)` |
   | Thêm cột | `ALTER TABLE ... ADD COLUMN ...` |
   | Thêm index | `CREATE INDEX ...` |
   | Thêm foreign key | `ALTER TABLE ... ADD CONSTRAINT ...` |
   | Xoá cột/bảng | `DROP TABLE ...` / `ALTER TABLE ... DROP COLUMN ...` |
   | Đổi tên | `ALTER TABLE ... RENAME COLUMN ...` |

2. Xác định migration number:
   - Kiểm tra file migration cuối cùng trong `backend/migrations/`
   - Number mới = số tiếp theo (e.g., `0008`, `0009`)

3. Kiểm tra ảnh hưởng:
   - Có bảng/cột nào đang reference đến không?
   - Có data cần migrate không?
   - Breaking change không?

---

## Bước 2: Viết Migration Files

### Up Migration
File: `backend/migrations/{NNNN}_{description}.sql`

```sql
-- Migration: {NNNN}_{description}
-- Description: [mô tả thay đổi]

CREATE TABLE IF NOT EXISTS {table_name} (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    -- ... other columns
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_{table}_{column} ON {table_name}({column});
```

### Down Migration
File: `backend/migrations/{NNNN}_{description}_down.sql`

```sql
-- Rollback: {NNNN}_{description}

DROP INDEX IF EXISTS idx_{table}_{column};
DROP TABLE IF EXISTS {table_name};
```

### Quy Tắc SQL ⚠️
| Quy tắc | Giải thích |
|---------|-----------|
| `IF NOT EXISTS` / `IF EXISTS` | Idempotent — chạy lại không lỗi |
| `gen_random_uuid()` | UUID primary keys |
| `NOT NULL` by default | Explicit `NULL` khi cần |
| `snake_case` | Tên bảng và cột |
| Plural table names | `athletes`, `tournaments`, ... |
| `created_at` + `updated_at` | Mọi bảng đều cần timestamps |
| `REFERENCES ... ON DELETE` | Explicit delete policy |
| Parameterized queries | KHÔNG string concatenation |

---

## Bước 3: Test Migration Forward

```bash
# Chạy migration up
cd backend && go run ./cmd/migrate up
```

Kiểm tra:
- [ ] Migration chạy thành công không lỗi
- [ ] Bảng/cột mới tồn tại trong database
- [ ] Indexes được tạo
- [ ] Constraints hoạt động đúng
- [ ] Foreign keys reference đúng

---

## Bước 4: Test Migration Rollback

```bash
# Chạy migration down
cd backend && go run ./cmd/migrate down
```

Kiểm tra:
- [ ] Rollback thành công
- [ ] Bảng/cột đã bị xoá
- [ ] Indexes đã bị xoá
- [ ] Database trở về trạng thái trước migration

Sau đó chạy migration up lại để verify roundtrip:
```bash
cd backend && go run ./cmd/migrate up
```

---

## Bước 5: Verify Data Integrity

1. **Seed data** (nếu migration thêm bảng mới cần reference data):
   ```bash
   cd backend && go run ./cmd/migrate seed
   ```

2. **Kiểm tra Go code đồng bộ**:
   - Domain models match với schema mới?
   - Repository queries match với columns mới?
   - Shared types (TypeScript) match với Go structs?

3. **Build check**:
   ```bash
   cd backend && go build ./...
   npm run typecheck
   ```

4. Checklist cuối:
   - [ ] Up migration: PASS
   - [ ] Down migration: PASS
   - [ ] Roundtrip (down → up): PASS
   - [ ] Go code synced: PASS
   - [ ] TypeScript types synced: PASS
