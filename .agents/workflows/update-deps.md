---
description: Workflow cập nhật dependencies cho VCT Platform (Go modules + npm packages)
---

# /update-deps — Cập Nhật Dependencies

> Sử dụng khi cần update Go modules, npm packages, hoặc kiểm tra outdated dependencies.

// turbo-all

---

## Bước 1: Kiểm Tra Dependencies Hiện Tại

### Go Modules
```bash
# Xem dependencies hiện tại
cd backend && cat go.mod

# Kiểm tra outdated
cd backend && go list -m -u all
```

### npm Packages
```bash
# Kiểm tra outdated packages
npm outdated

# Kiểm tra security vulnerabilities  
npm audit
```

---

## Bước 2: Đánh Giá Rủi Ro

### Trước khi update, kiểm tra cho MỖI dependency:

| Câu hỏi | Nếu YES |
|---------|---------|
| Có breaking changes không? (major version bump) | ⚠️ Đọc changelog kỹ |
| Có security fix không? | 🔴 Update ngay |
| Có bug fix quan trọng không? | 🟠 Ưu tiên update |
| Chỉ là minor/patch? | 🟢 Safe to update |

### Approved Stack (KHÔNG ĐƯỢC THAY ĐỔI)
Tham chiếu CTO skill — các technology sau KHÔNG được thay thế:

| Technology | Current | Có thể update minor? |
|-----------|---------|---------------------|
| Go | 1.26+ | ✅ Patch/minor OK |
| `pgx/v5` | 5.x | ✅ Within v5 |
| `golang-jwt/v5` | 5.x | ✅ Within v5 |
| Next.js | 14.x | ⚠️ Careful with 15 |
| React | 19.x | ✅ Within 19 |
| Expo | SDK 52+ | ⚠️ Major SDK changes |

### Dependency Addition Policy
```
Trước khi thêm dependency MỚI:
1. Có thể dùng stdlib Go không? → Dùng stdlib
2. Đã có dependency nào cover không? → Dùng existing
3. Library có >1000 stars, maintained gần đây? → Consider
4. Có dependency tree lớn không? → Reject nếu có
5. Có security audit không? → Ưu tiên audited
```

---

## Bước 3: Thực Hiện Update

### Go Modules
```bash
# Update specific module
cd backend && go get github.com/package/name@latest

# Update all modules  
cd backend && go get -u ./...

# Tidy up (remove unused)
cd backend && go mod tidy
```

### npm Packages
```bash
# Update specific package
npm update package-name

# Update all (minor + patch only, safe)
npm update

# Update to latest (including major, DANGEROUS)
npm install package-name@latest
```

### Quy tắc:
- ✅ Update **một dependency tại một thời điểm** khi major version
- ✅ Test sau mỗi update
- ✅ Commit riêng cho mỗi major update
- ❌ KHÔNG update tất cả cùng lúc nếu có major changes

---

## Bước 4: Verify

### Build Check
```bash
# Go
cd backend && go build ./...
cd backend && go vet ./...
cd backend && go test ./...

# Frontend
npm run typecheck
npm run build
```

### Security Check
```bash
# Go vulnerabilities
cd backend && govulncheck ./...

# npm vulnerabilities
npm audit
```

### Runtime Check
- [ ] Backend server khởi động bình thường
- [ ] Frontend render đúng
- [ ] API calls hoạt động
- [ ] Auth flow hoạt động
- [ ] Database connections OK

---

## Bước 5: Document

### Update Changelog
```markdown
## Dependencies Updated — [date]

### Go Modules
- `github.com/package` v1.0.0 → v1.1.0 — [reason]

### npm Packages  
- `package-name` 2.0.0 → 2.1.0 — [reason]

### Security Fixes
- [CVE-YYYY-NNNNN] Fixed by updating [package] — [description]
```

### Checklist cuối:
- [ ] Go build: PASS
- [ ] Go tests: PASS
- [ ] npm typecheck: PASS
- [ ] npm build: PASS
- [ ] npm audit: clean (hoặc documented exceptions)
- [ ] Runtime testing: PASS
- [ ] Changelog updated
- [ ] `go.mod` / `go.sum` committed
- [ ] `package.json` / `yarn.lock` committed
