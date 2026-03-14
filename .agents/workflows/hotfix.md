---
description: Workflow sửa lỗi khẩn cấp production cho VCT Platform
---

# /hotfix — Sửa Lỗi Khẩn Cấp Production

> Sử dụng khi phát hiện lỗi nghiêm trọng trên production cần fix ngay lập tức.
> Khác với `/fix-bug`: nhanh hơn, tập trung hơn, có rollback plan.

// turbo-all

---

## Bước 1: Đánh Giá Mức Độ & Quyết Định

### Tiêu chí Hotfix (ít nhất 1 điều kiện):
- 🔴 App crash / không truy cập được
- 🔴 Data corruption / mất dữ liệu
- 🔴 Security vulnerability bị exploit
- 🔴 Feature core hoàn toàn không hoạt động
- 🔴 Ảnh hưởng > 50% users

### KHÔNG phải Hotfix (dùng `/fix-bug`):
- 🟡 UI hiển thị sai nhưng vẫn dùng được
- 🟡 Performance chậm nhưng vẫn hoạt động
- 🟡 Edge case ảnh hưởng < 5% users
- 🟡 Typo, i18n missing

---

## Bước 2: Root Cause Analysis (Nhanh)

**Thời gian tối đa: 15 phút phân tích**

1. Xác định error message / symptom chính xác
2. Trace đến file + function gây lỗi
3. Xác định root cause (KHÔNG cần hiểu toàn bộ, chỉ cần đủ để fix)
4. Xác định scope ảnh hưởng (files nào cần sửa)

### Quick debugging tools:
```bash
# Backend logs
# Check terminal running backend server

# Frontend errors  
# Check browser console

# Build errors
cd backend && go build ./...
npm run typecheck
```

---

## Bước 3: Minimal Fix

### Nguyên tắc Hotfix:
- ✅ **Fix nhỏ nhất có thể** — chỉ sửa bug, không refactor
- ✅ **1-3 files tối đa** — nếu cần sửa nhiều hơn → re-evaluate
- ✅ **Backward compatible** — không break API contracts
- ✅ **Safe to deploy** — không cần database migration nếu có thể tránh
- ❌ **KHÔNG** thêm tính năng mới
- ❌ **KHÔNG** refactor code
- ❌ **KHÔNG** thay đổi database schema (trừ khi bắt buộc)
- ❌ **KHÔNG** update dependencies

### Nếu cần database change:
- Chỉ dùng `ALTER TABLE ... ADD COLUMN` (backward compatible)
- KHÔNG `DROP` hay `RENAME` columns
- Phải có DOWN migration

---

## Bước 4: Verify (Nhanh)

```bash
# MUST PASS — không deploy nếu fail
cd backend && go build ./...
cd backend && go vet ./...
npm run typecheck
```

Quick checklist:
- [ ] Fix giải quyết đúng root cause
- [ ] Build pass (Go + TypeScript)
- [ ] Không break các feature khác
- [ ] Không có `console.log` / debug code

---

## Bước 5: Rollback Plan

Luôn chuẩn bị rollback TRƯỚC khi deploy:

### Code Rollback
```bash
# Git: revert commit nếu cần
git revert HEAD
```

### Database Rollback (nếu có migration)
```bash
cd backend && go run ./cmd/migrate down
```

### Document
```markdown
## Hotfix Report
- **Issue**: [mô tả ngắn]
- **Root Cause**: [nguyên nhân]
- **Fix**: [thay đổi gì]
- **Files**: [list files changed]
- **Rollback**: [cách rollback nếu cần]
- **Follow-up**: [proper fix / test cần thêm sau]
```

> ⚠️ Sau hotfix, LUÔN tạo follow-up task để:
> 1. Viết test cho case gây bug
> 2. Review code kỹ hơn (dùng `/code-review`)
> 3. Refactor nếu cần (dùng `/refactor`)
