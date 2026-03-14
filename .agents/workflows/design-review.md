---
description: Workflow review UI/UX design trước khi implementation cho VCT Platform
---

# /design-review — UI/UX Design Review

> Sử dụng khi cần review thiết kế giao diện trước khi code, hoặc audit UI đang có.
> Tham chiếu skills: **ui-ux-pro-max**, **vct-ui-ux**, **web-design-guidelines**.

// turbo-all

---

## Bước 1: Xác Định Scope Review

| Scope | Khi nào |
|-------|---------|
| **Page mới** | Trước khi code page → review layout, components |
| **Feature mới** | Trước khi implement → review user flow |
| **UI audit** | Kiểm tra trang hiện có → tìm vấn đề |
| **Theme check** | Verify light/dark theme | 
| **Responsive check** | Verify mobile/tablet/desktop |

---

## Bước 2: Design System Compliance

### VCT Design System Checklist
- [ ] **Components**: Sử dụng `VCT_` prefix components
- [ ] **Icons**: `VCT_Icons` only (KHÔNG import lucide-react trực tiếp)
- [ ] **Colors**: CSS variable tokens (`var(--vct-color-*)`)
- [ ] **Spacing**: Design system spacing tokens
- [ ] **Typography**: Font tokens (không custom fonts)
- [ ] **Borders**: Radius tokens (`var(--vct-radius-*)`)
- [ ] **No inline styles**: Tất cả styling qua CSS tokens
- [ ] **No Tailwind dark:**: Theme via CSS variables only

### Theme Compliance
- [ ] Light theme: Tất cả elements readable, proper contrast
- [ ] Dark theme: Tất cả elements readable, proper contrast
- [ ] Theme switch: Transition mượt, không flash
- [ ] No hardcoded colors: Tất cả dùng CSS variables

---

## Bước 3: Layout & Responsiveness

### Layout Standards
- [ ] Page structure rõ ràng: Header → Content → Footer
- [ ] Sidebar navigation nhất quán across pages
- [ ] Content area không bị overflow
- [ ] Proper spacing và padding
- [ ] Grid/flex layout responsive

### Responsive Breakpoints
| Breakpoint | Width | Kiểm tra |
|-----------|-------|----------|
| Mobile | < 640px | Sidebar collapsed, single column |
| Tablet | 640–1024px | Sidebar collapsible, 2 columns |
| Desktop | > 1024px | Full sidebar, multi-column |

### Kiểm tra:
- [ ] Mobile: Layout không bị vỡ, text không bị cắt
- [ ] Tablet: Elements sắp xếp hợp lý
- [ ] Desktop: Sử dụng không gian hiệu quả
- [ ] No horizontal scroll (trừ tables)

---

## Bước 4: UX Flow Review

### Navigation
- [ ] Sidebar item highlight đúng (chỉ active page)
- [ ] Breadcrumb rõ ràng (nếu có)
- [ ] Back navigation hoạt động
- [ ] Không có dead-end pages

### Loading & Error States
- [ ] **Loading**: `VCT_PageSkeleton` hiển thị mượt
- [ ] **Empty state**: Có thông báo khi không có data
- [ ] **Error state**: Hiển thị thông báo lỗi thân thiện
- [ ] **Success feedback**: Toast/notification khi action thành công

### Accessibility
- [ ] Contrast ratio đủ (AA standard: 4.5:1)
- [ ] Interactive elements có focus states
- [ ] Images có alt text
- [ ] Forms có labels
- [ ] Keyboard navigation hoạt động

---

## Bước 5: Visual Quality Check

### Typography
- [ ] Heading hierarchy rõ ràng (h1 > h2 > h3)
- [ ] Font size readable (min 14px body)
- [ ] Line height comfortable (1.5–1.6)
- [ ] Text alignment nhất quán

### Visual Hierarchy
- [ ] CTA (Call to Action) nổi bật
- [ ] Secondary actions ít prominent hơn
- [ ] Information hierarchy rõ ràng
- [ ] White space sử dụng hiệu quả

### Consistency
- [ ] Button styles nhất quán across pages
- [ ] Card styles nhất quán
- [ ] Table styles nhất quán
- [ ] Form styles nhất quán
- [ ] Icon sizes nhất quán

---

## Bước 6: Output Design Review Report

```markdown
## 🎨 Design Review Report

### Page/Feature: [name]

### ✅ Passed
- [Items that meet standards]

### ⚠️ Issues Found
| # | Issue | Severity | Location | Fix |
|---|-------|----------|----------|-----|
| 1 | [issue] | High/Med/Low | [page/component] | [suggestion] |

### 📱 Responsive Status
- Mobile: ✅/❌
- Tablet: ✅/❌
- Desktop: ✅/❌

### 🌗 Theme Status
- Light: ✅/❌
- Dark: ✅/❌

### 📋 Recommendations
1. [recommendation]
2. [recommendation]
```
