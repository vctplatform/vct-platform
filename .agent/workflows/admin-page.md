---
description: Workflow tạo admin page với pattern Table + Drawer detail panel cho VCT Platform
---

# /admin-page — Tạo Admin Page

> Sử dụng khi cần tạo trang admin mới với data table, search, filter, và Drawer detail panel.
> Khác với `/add-page`: chuyên biệt cho admin workspace với data-heavy pattern.

// turbo-all

---

## Bước 1: Xác Định Thông Tin

1. **Tên page**: Page_admin_{feature}.tsx hoặc Page_{feature}.tsx
2. **Data source**: API endpoint nào? Hook nào? (useAdminAPI, useApiQuery, etc.)
3. **Columns**: Những cột nào cho data table?
4. **Drawer content**: Hiển thị gì trong detail panel?
5. **Actions**: Tạo/sửa/xóa? Bulk actions?

---

## Bước 2: Tạo Page Component

File: `packages/app/features/admin/Page_admin_{feature}.tsx`

### Template:
```tsx
'use client'
import { useState, useEffect, useMemo } from 'react'
import { VCT_Card, VCT_Input, VCT_Badge, VCT_Drawer, VCT_Button,
         VCT_PageSkeleton, VCT_InfoGrid, VCT_Timeline,
         VCT_StatBlock } from '@vct/ui'
import { VCT_Icons } from '../components/vct-icons'
import { useI18n } from '../i18n'

// Types
interface Item {
  id: string
  name: string
  status: string
  created_at: string
}

export function Page_admin_{feature}() {
  const { t } = useI18n()
  
  // Data state
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Drawer state
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  
  // Fetch data
  useEffect(() => {
    // API call here
    setLoading(false)
  }, [])
  
  // Filter
  const filteredItems = useMemo(() =>
    items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    ),
    [items, searchTerm]
  )

  if (loading) return <VCT_PageSkeleton />

  return (
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-vct-text">
          {t('admin.{feature}.title')}
        </h1>
        <p className="text-vct-text-muted">
          {t('admin.{feature}.subtitle')}
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <VCT_StatBlock
          label={t('admin.stats.total')}
          value={items.length}
          icon={<VCT_Icons.Database size={18} />}
        />
        {/* More stats... */}
      </div>

      {/* Search & Filters */}
      <VCT_Card>
        <div style={{ padding: 16, display: 'flex', gap: 12 }}>
          <VCT_Input
            placeholder={t('admin.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<VCT_Icons.Search size={16} />}
          />
        </div>

        {/* Data Table */}
        <table className="w-full">
          <thead>
            <tr>
              <th>{t('admin.column.name')}</th>
              <th>{t('admin.column.status')}</th>
              <th>{t('admin.column.created')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr
                key={item.id}
                onClick={() => setSelectedItem(item)}
                style={{ cursor: 'pointer' }}
              >
                <td>{item.name}</td>
                <td><VCT_Badge>{item.status}</VCT_Badge></td>
                <td>{new Date(item.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </VCT_Card>

      {/* Drawer Detail Panel */}
      <VCT_Drawer
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name || ''}
      >
        {selectedItem && (
          <>
            <VCT_InfoGrid data={[
              { label: t('admin.field.id'), value: selectedItem.id },
              { label: t('admin.field.status'), value: selectedItem.status },
              { label: t('admin.field.created'), value: selectedItem.created_at },
            ]} />
            
            <div style={{ marginTop: 24 }}>
              <h3>{t('admin.activity')}</h3>
              <VCT_Timeline events={[]} />
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
              <VCT_Button variant="primary">{t('actions.edit')}</VCT_Button>
              <VCT_Button variant="danger">{t('actions.delete')}</VCT_Button>
            </div>
          </>
        )}
      </VCT_Drawer>
    </div>
  )
}
```

---

## Bước 3: Kết Nối API

### Sử dụng hook có sẵn (nếu đã có):
```tsx
import { useAdminAPI } from '../hooks/useAdminAPI'

const { data, loading, error, refetch } = useAdminAPI().useFeature()
```

### Hoặc dùng useApiQuery:
```tsx
import { useApiQuery } from '../hooks/useApiQuery'

const { data, loading, error } = useApiQuery<Item[]>('/api/v1/admin/feature')
```

---

## Bước 4: Đăng Ký Route & Sidebar

1. **Next.js page** (thin wrapper):
   ```tsx
   // apps/next/pages/admin/{feature}.tsx
   import { Page_admin_{feature} } from '@vct/app/features/admin/Page_admin_{feature}'
   export default Page_admin_{feature}
   ```

2. **Route registry**: Thêm vào `route-registry.ts`
3. **Sidebar**: Thêm entry cho admin role trong sidebar groups
4. **i18n keys**: Thêm keys cho cả `vi` và `en`

---

## Bước 5: Verify

```bash
# TypeScript check
npm run typecheck
```

Checklist:
- [ ] Page render không lỗi
- [ ] Data table hiển thị đúng
- [ ] Search/filter hoạt động
- [ ] Click row → Drawer mở đúng data
- [ ] Drawer close hoạt động
- [ ] Loading skeleton hiển thị
- [ ] Light & Dark theme OK
- [ ] Sidebar navigation hoạt động
- [ ] i18n keys đầy đủ (vi + en)

---

## Existing Admin Pages (Reference)

| Page | File | Key Pattern |
|------|------|-------------|
| Users | `Page_admin_users.tsx` | Table + Drawer + Search |
| Roles | `Page_admin_roles.tsx` | Permission matrix |
| System | `Page_admin_system.tsx` | Health metrics + config |
| Documents | `Page_documents.tsx` | Upload + Drawer preview |
| Notifications | `Page_notifications_admin.tsx` | List + Drawer + Create form |
| Integrity | `Page_integrity.tsx` | Validation checks |
| Data Quality | `Page_data_quality.tsx` | Quality metrics |
| Audit Logs | `Page_audit_logs.tsx` | Activity trail |
