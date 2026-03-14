---
description: Workflow refactoring code cho VCT Platform
---

# /refactor — Refactoring Code

> Sử dụng khi cần cải thiện cấu trúc code mà KHÔNG thay đổi behavior.

// turbo-all

---

## Bước 1: Phân Tích Code Hiện Tại

1. Xác định mục tiêu refactor:
   | Loại | Ví dụ |
   |------|------|
   | Extract function | Hàm quá dài → tách thành functions nhỏ |
   | Extract component | Component quá lớn → tách thành components con |
   | Remove duplication | Code copy-paste → extract shared utility |
   | Rename | Tên biến/function không rõ nghĩa → rename |
   | Move file | File sai vị trí → di chuyển đúng package |
   | Fix architecture | Logic ở sai layer → di chuyển đúng layer |

2. Kiểm tra scope ảnh hưởng:
   - File nào reference đến code này?
   - Có ảnh hưởng đến API contract không?
   - Có ảnh hưởng đến database không?

3. **NGUYÊN TẮC VÀNG**: Refactor KHÔNG thay đổi behavior.
   - Input/Output vẫn giữ nguyên
   - Không thêm tính năng mới
   - Không sửa bug (sửa bug dùng `/fix-bug`)

---

## Bước 2: Lên Kế Hoạch

1. Liệt kê chính xác:
   - Files cần sửa
   - Changes cụ thể cho từng file
   - Thứ tự thực hiện (dependencies first)
2. Kiểm tra Clean Architecture:
   - Domain layer không depend vào adapter/handler
   - Handler không chứa business logic
   - Adapter implement domain interfaces
3. Viết implementation plan nếu refactor lớn (> 5 files)

---

## Bước 3: Thực Hiện Refactor

### Backend (Go)
- Đảm bảo error wrapping: `fmt.Errorf("context: %w", err)`
- Naming: camelCase private, PascalCase exported
- Max ~500 LOC per file
- Exported functions phải có doc comments
- Imports: stdlib → external → internal

### Frontend (TypeScript/React)
- Components dùng `VCT_` prefix
- Text dùng `t('key')` qua `useI18n()`
- Styles dùng CSS variable tokens
- Loading states dùng `VCT_PageSkeleton`
- Icons dùng `VCT_Icons` only

### Thực hiện từng bước nhỏ:
1. Rename / Move → update all imports
2. Extract → verify callers updated
3. Clean up → remove unused code

---

## Bước 4: Verify Behavior Unchanged

```bash
# Backend
cd backend && go build ./...
cd backend && go vet ./...

# Frontend
npm run typecheck
```

Kiểm tra thêm:
- [ ] Không có TypeScript errors mới
- [ ] Không có Go build errors mới
- [ ] API endpoints vẫn hoạt động giống hệt
- [ ] UI render giống hệt trước refactor
- [ ] Không có `console.log` hoặc dead code

---

## Bước 5: Document

Ghi lại trong walkthrough:
- **Mục tiêu**: Tại sao refactor?
- **Thay đổi**: Files nào đã sửa, sửa gì?
- **Kết quả**: Code structure tốt hơn như thế nào?
- **Verify**: Build pass, behavior unchanged
