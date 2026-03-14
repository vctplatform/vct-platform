---
description: Workflow tạo UI component mới trong @vct/ui cho VCT Platform
---

# /add-component — Tạo UI Component Mới

> Sử dụng khi cần tạo component tái sử dụng trong `@vct/ui` hoặc component riêng cho module.

// turbo-all

---

## Bước 1: Xác Định Component

1. **Loại component**:
   | Loại | Vị trí | Khi nào dùng |
   |------|--------|-------------|
   | Shared (toàn app) | `packages/ui/src/` | Button, Modal, Card, Table, ... |
   | Module-specific | `packages/app/features/{module}/components/` | Component chỉ dùng trong 1 module |

2. **Thông tin cần xác định**:
   - Tên component (với `VCT_` prefix)
   - Props interface
   - Có cần variants không? (size, color, state)
   - Có cần responsive không?
   - Cần hỗ trợ Light + Dark theme không? (mặc định: CÓ)

---

## Bước 2: Tạo Component File

### Naming Convention
```
VCT_{ComponentName}.tsx

Ví dụ:
VCT_DataTable.tsx
VCT_StatusBadge.tsx  
VCT_ActionMenu.tsx
VCT_StatCard.tsx
```

### Template Component
```tsx
import { ReactNode } from 'react'

interface VCT_{ComponentName}Props {
  // Define props
  children?: ReactNode
  className?: string
}

/**
 * VCT_{ComponentName} — [mô tả ngắn gọn chức năng]
 * 
 * @example
 * <VCT_{ComponentName} prop1="value">
 *   Content
 * </VCT_{ComponentName}>
 */
export function VCT_{ComponentName}({ children, className, ...props }: VCT_{ComponentName}Props) {
  return (
    <div className={`vct-{component-name} ${className || ''}`} {...props}>
      {children}
    </div>
  )
}
```

### Quy Tắc QUAN TRỌNG ⚠️
- ✅ **`VCT_` prefix** bắt buộc cho tất cả components
- ✅ **Icons**: chỉ dùng `VCT_Icons`, KHÔNG import `lucide-react` trực tiếp
- ✅ **CSS variable tokens**: `var(--vct-color-*)`, `var(--vct-spacing-*)`
- ✅ **TypeScript**: Props interface rõ ràng, có doc comments
- ✅ **Export**: Export function component (không default export)
- ❌ **KHÔNG** inline styles
- ❌ **KHÔNG** hardcode colors — dùng design system tokens
- ❌ **KHÔNG** Tailwind `dark:` modifier
- ❌ **KHÔNG** import trực tiếp từ icon libraries

---

## Bước 3: Styling

### CSS Tokens
```css
/* Sử dụng design system tokens */
.vct-{component-name} {
  /* Colors */
  color: var(--vct-color-text);
  background: var(--vct-color-surface);
  border-color: var(--vct-color-border);
  
  /* Spacing */
  padding: var(--vct-spacing-md);
  gap: var(--vct-spacing-sm);
  
  /* Typography */
  font-size: var(--vct-font-size-sm);
  
  /* Border radius */
  border-radius: var(--vct-radius-md);
}
```

### Theme Compatibility
- Component PHẢI hiển thị đúng trên cả Light và Dark theme
- Chỉ dùng CSS variable tokens (tự động switch theo theme)
- Test visual trên cả 2 theme

### Responsive
- Mobile-first approach
- Sử dụng relative units (`rem`, `em`, `%`)
- Test trên các breakpoints chính

---

## Bước 4: Export & Registration

### Shared Component
Thêm export vào `packages/ui/src/index.ts`:
```typescript
export { VCT_{ComponentName} } from './{filename}'
export type { VCT_{ComponentName}Props } from './{filename}'
```

### Module Component
Import trực tiếp trong page files:
```typescript
import { VCT_{ComponentName} } from './components/VCT_{ComponentName}'
```

---

## Bước 5: i18n

- Nếu component có text hiển thị → dùng `t('key')` qua `useI18n()`
- Nếu component nhận text qua props → caller chịu trách nhiệm i18n
- Labels, placeholders, tooltips → i18n keys

---

## Bước 6: Verify

```bash
npm run typecheck
```

Checklist:
- [ ] `VCT_` prefix đúng
- [ ] Props interface rõ ràng với TypeScript types
- [ ] CSS variable tokens (không hardcode colors)
- [ ] Light theme: hiển thị đúng
- [ ] Dark theme: hiển thị đúng
- [ ] Responsive layout
- [ ] Icons dùng `VCT_Icons`
- [ ] Text qua i18n
- [ ] Export trong index.ts (nếu shared)
- [ ] No inline styles
