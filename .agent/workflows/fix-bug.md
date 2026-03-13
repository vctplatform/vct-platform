---
description: Workflow điều tra và sửa bug cho VCT Platform
---

# /fix-bug — Điều Tra & Sửa Bug

> Sử dụng khi cần điều tra nguyên nhân và sửa bug trong hệ thống.

// turbo-all

---

## Bước 1: Thu Thập Thông Tin

1. Xác định triệu chứng:
   - Error message cụ thể?
   - Trang/module nào bị ảnh hưởng?
   - Có reproduce được không? Steps to reproduce?
2. Thu thập logs:
   - Browser console errors
   - Terminal logs (backend)
   - Network requests (status codes, response body)
3. Phân loại bug:
   | Mức độ | Mô tả | Hành động |
   |--------|-------|-----------|
   | 🔴 Critical | App crash, data loss, security | Fix ngay |
   | 🟠 High | Feature không hoạt động | Fix trong ngày |
   | 🟡 Medium | UI sai, minor logic error | Fix trong sprint |
   | 🟢 Low | Cosmetic, typo | Khi có thời gian |

---

## Bước 2: Phân Tích Nguyên Nhân

1. **Trace the error** — theo dõi từ error message → file → function
2. **Search codebase**: Dùng `grep_search` để tìm code liên quan
3. **Check recent changes**: Xem có thay đổi gần đây gây bug không
4. **Identify root cause**: Phân biệt giữa:
   - Symptom (triệu chứng) vs Root cause (nguyên nhân gốc)
   - Ví dụ: "Blank page" (symptom) ← "Missing import" (root cause)
5. **Document root cause** trước khi sửa

---

## Bước 3: Viết Fix

1. Sản xuất fix nhỏ nhất có thể (minimal change)
2. **KHÔNG** refactor thêm trong cùng fix
3. Đảm bảo fix tuân thủ conventions:
   - Backend: error wrapping, parameterized SQL, no panic
   - Frontend: VCT_ components, i18n keys, theme tokens
4. Nếu bug liên quan đến:
   - **TypeScript error**: Kiểm tra types trong `packages/shared-types/`
   - **Go build error**: Kiểm tra imports, interfaces, và exports
   - **Runtime error**: Kiểm tra null checks, error handling
   - **UI bug**: Kiểm tra CSS tokens, theme compatibility
   - **API error**: Kiểm tra endpoint registration, middleware, CORS

---

## Bước 4: Verify Fix

1. Chạy build verification:
   ```bash
   # Backend
   cd backend && go build ./...
   cd backend && go vet ./...
   
   # Frontend
   npm run typecheck
   ```
2. Test fix trên browser (nếu frontend bug)
3. Kiểm tra regression:
   - Các trang/tính năng liên quan có còn hoạt động?
   - Sửa chỗ này có gây lỗi chỗ khác không?
4. Test cả Light và Dark theme (nếu UI bug)

---

## Bước 5: Document

1. Ghi lại trong walkthrough:
   - **Root cause**: Nguyên nhân gốc
   - **Fix**: Thay đổi cụ thể
   - **Files changed**: Danh sách files đã sửa
   - **Prevention**: Cách tránh bug tương tự trong tương lai
2. Nếu bug do thiếu test → note để thêm test sau

---

## Quick Reference: Common Fix Patterns

| Bug Type | Keyword tìm | Quick Fix |
|----------|------------|----------|
| 401 Auth | `ERR_INVALID_CREDENTIALS` | Check VCT_JWT_SECRET, VCT_ADMIN_PASSWORD |
| CORS | `Access-Control-Allow-Origin` | Add URL to VCT_CORS_ORIGINS |
| 404 API | `/api/api/v1/` | Fix NEXT_PUBLIC_API_BASE_URL (remove /api/v1) |
| 502 Gateway | `502 Bad Gateway` | Check backend logs, restart container |
| JSX IDE | `IntrinsicElements` | npm ls @types/react, restart TS server |
| Blank page | `Cannot read properties of null` | Add null checks, loading states |
| Import error | `Module not found` | Check path aliases, tsconfig paths |
| Go build | `undefined:` | Check exports, interface implementations |

> 💡 Xem chi tiết: sử dụng workflow `/debug-common-errors`
