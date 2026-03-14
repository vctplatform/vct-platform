---
description: Workflow tạo trang frontend mới cho VCT Platform
---

# /add-page — Tạo Trang Frontend Mới

> Sử dụng khi cần tạo một trang giao diện mới trong frontend.

// turbo-all

---

## Bước 1: Xác Định Thông Tin Trang

1. **Module**: Trang thuộc module nào? (federation, athlete, tournament, etc.)
2. **Route**: URL path cho trang (e.g., `/federation/regulations`)
3. **Role**: User role nào có quyền xem? (admin, athlete, coach, etc.)
4. **Layout**: Sử dụng layout nào? (DashboardLayout, PublicLayout, etc.)
5. **Data**: Trang cần dữ liệu từ API nào? Hay dữ liệu tĩnh?

---

## Bước 2: Tạo Page Component

Tạo file theo naming convention:
```
packages/app/features/{module}/Page_{module}_{subpage}.tsx
```

Template page component:
```tsx
import { useI18n } from '@vct/shared-utils'
import { VCT_PageSkeleton } from '@vct/ui'

export function Page_{Module}_{Sub}() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Data fetching with try/catch
  useEffect(() => {
    const fetchData = async () => {
      try {
        // API call
        setLoading(false)
      } catch (err) {
        setError('Failed to load data')
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <VCT_PageSkeleton />
  if (error) return <div className="error-state">{error}</div>

  return (
    <div>
      <h1>{t('{module}.{sub}.title')}</h1>
      {/* Page content */}
    </div>
  )
}
```

### Quy tắc QUAN TRỌNG:
- ✅ Component code ở `packages/app/features/{module}/`
- ✅ Dùng `VCT_` prefix cho UI components
- ✅ Dùng `VCT_Icons` cho icons (KHÔNG import lucide-react trực tiếp)
- ✅ Dùng `VCT_PageSkeleton` cho loading state
- ✅ Dùng `t('key')` cho mọi text hiển thị
- ❌ KHÔNG đặt logic code trong `apps/next/pages/`
- ❌ KHÔNG hardcode text tiếng Việt hay tiếng Anh
- ❌ KHÔNG dùng inline styles
- ❌ KHÔNG import trực tiếp từ lucide-react

---

## Bước 3: Đăng Ký Route & Sidebar

### 3.1 Next.js Page (thin wrapper)
Tạo file trong `apps/next/pages/` — CHỈ là wrapper:
```tsx
import { Page_{Module}_{Sub} } from '@vct/app/features/{module}/Page_{module}_{sub}'
export default Page_{Module}_{Sub}
```

### 3.2 Route Registry
Thêm route vào `route-registry.ts` hoặc config tương ứng.

### 3.3 Sidebar
Thêm sidebar entry tương ứng cho role có quyền truy cập trang.
- Xác định đúng `icon`, `label` (i18n key), `href`
- Kiểm tra `isItemActive` hoạt động đúng

---

## Bước 4: Thêm i18n Keys

Thêm translation keys cho **CẢ 2 ngôn ngữ**:

```json
// Vietnamese (vi)
"{module}.{sub}.title": "Tiêu đề trang",
"{module}.{sub}.description": "Mô tả trang"

// English (en)
"{module}.{sub}.title": "Page Title",
"{module}.{sub}.description": "Page description"
```

**Kiểm tra**: Mọi text hiển thị trên trang PHẢI dùng `t('key')`.

---

## Bước 5: Styling & Theme

1. Sử dụng **CSS variable tokens** từ design system
2. **KHÔNG** dùng Tailwind `dark:` modifier
3. **KHÔNG** hardcode colors — dùng `var(--vct-color-*)` 
4. Kiểm tra:
   - [ ] Light theme hiển thị đúng
   - [ ] Dark theme hiển thị đúng
   - [ ] Responsive trên mobile
   - [ ] Skeleton loading hiển thị mượt

---

## Bước 6: Verify

1. Chạy typecheck:
   ```bash
   npm run typecheck
   ```
2. Mở browser và kiểm tra:
   - [ ] Trang load không lỗi
   - [ ] Navigation từ sidebar hoạt động
   - [ ] Sidebar item highlight đúng (only active page)
   - [ ] Loading skeleton hiển thị trước khi data load xong
   - [ ] Responsive layout
   - [ ] Cả 2 theme hoạt động

---

## Variant: Admin Page (Table + Drawer)

Nếu trang là admin page với data table + detail panel, dùng workflow `/admin-page` thay vì workflow này.

Admin pages có thêm:
- `VCT_Drawer` cho detail panel (click row → mở drawer)
- `VCT_StatBlock` cho stats row
- `VCT_Timeline` cho activity log
- `usePagination` hook
- Search/filter pattern

### Custom Hooks có sẵn:
| Hook | Dùng cho |
|------|---------|
| `useAdminAPI` | Admin CRUD operations |
| `useApiQuery` | Generic API fetching |
| `usePagination` | Client-side pagination |
| `useToast` | Toast notifications |
| `useRouteActionGuard` | Permission checks |
