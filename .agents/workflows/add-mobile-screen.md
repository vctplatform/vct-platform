---
description: Workflow tạo mobile screen mới với navigation integration cho VCT Platform
---

# /add-mobile-screen — Tạo Mobile Screen Mới

> Sử dụng khi cần tạo một screen mới cho Expo mobile app, bao gồm component, navigation, i18n.

// turbo-all

---

## Bước 1: Xác Định Screen

### Thông tin cần xác định:
```
Screen name: [tên screen, viết PascalCase, vd: TournamentDetailScreen]
Module: [thuộc area nào, vd: admin-mobile, tournament, athlete]
Navigation type:
  □ Tab screen (hiện trên bottom tab bar)
  □ Stack screen (push từ screen khác)
  □ Modal (overlay trên screen hiện tại)
Requires auth: [true/false]
Works offline: [true/false]
```

### Kiểm tra trước khi tạo:
```
□ Screen này đã có trên web chưa? → Share logic từ packages/app/features/
□ Có mobile screen tương tự chưa? → Extend thay vì tạo mới
□ Data source: API endpoint sẵn có? → Verify với backend
```

---

## Bước 2: Tạo Screen Component

### File location:
```
packages/app/features/mobile/{module}/{screen-name}.tsx
```

### Template chuẩn:
```tsx
import * as React from 'react'
import { ScrollView, View, Text } from 'react-native'
import { SharedStyles, Space } from '../mobile-theme'
import { useThemeColors } from '../mobile-theme'
import { ScreenHeader, ScreenSkeleton, EmptyState, OfflineBanner } from '../mobile-ui'
import { useI18n } from '../../i18n'

interface Props {
  navigation: any
}

export function {ScreenName}Screen({ navigation }: Props) {
  const { colors } = useThemeColors()
  const { t } = useI18n()
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  // TODO: Fetch data
  React.useEffect(() => {
    // fetchData().then(setData).catch(e => setError(e.message)).finally(() => setLoading(false))
    setLoading(false)
  }, [])

  if (loading) return <ScreenSkeleton />

  return (
    <View style={[SharedStyles.page, { backgroundColor: colors.bgBase }]}>
      <ScrollView contentContainerStyle={SharedStyles.scrollContent}>
        <ScreenHeader
          title={t('{module}.{screen}.title')}
          subtitle={t('{module}.{screen}.subtitle')}
          onBack={() => navigation.goBack()}
        />

        {error ? (
          <EmptyState
            icon="alertCircle"
            title={t('common.error')}
            message={error}
            ctaLabel={t('common.retry')}
            onCta={() => {/* refetch */}}
          />
        ) : (
          <View>
            {/* Screen content here */}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
```

### Quy tắc bắt buộc:
- ✅ Import UI components từ `mobile-ui.tsx`
- ✅ Sử dụng `useThemeColors()` cho dynamic theming
- ✅ Sử dụng `useI18n()` cho tất cả text
- ✅ Loading state với `ScreenSkeleton`
- ✅ Error state với `EmptyState`
- ✅ `accessibilityRole` trên interactive elements
- ✅ Touch targets ≥ 44×44 (`Touch.minSize`)
- ❌ KHÔNG hardcode colors — dùng `colors.*`
- ❌ KHÔNG hardcode text — dùng `t('key')`

---

## Bước 3: Đăng Ký Navigation

### Nếu là Tab screen:
Cập nhật `apps/expo/App.tsx` hoặc `packages/app/navigation/native/`:
```tsx
// Thêm vào Tab.Navigator
<Tab.Screen
  name="{screen-key}"
  component={{ScreenName}Screen}
  options={{
    tabBarLabel: t('{module}.{screen}.tab_label'),
    tabBarIcon: ({ color }) => <Icon name={iconName} color={color} size={24} />,
  }}
/>
```

### Nếu là Stack screen:
```tsx
// Thêm vào Stack.Navigator tương ứng
<Stack.Screen
  name="{screen-key}"
  component={{ScreenName}Screen}
  options={{ headerShown: false }}
/>
```

### Cập nhật mobile-routes.ts (nếu cần):
Nếu screen map từ web route, nó sẽ tự động được include qua `MOBILE_ROUTE_REGISTRY`.

---

## Bước 4: Thêm i18n Keys

Cập nhật cả 2 locale files:

```typescript
// packages/app/i18n/locales/vi.ts
{module}: {
  {screen}: {
    title: 'Tiêu đề screen',
    subtitle: 'Mô tả ngắn',
    tab_label: 'Tab label',
    // ... more keys
  }
}

// packages/app/i18n/locales/en.ts
{module}: {
  {screen}: {
    title: 'Screen Title',
    subtitle: 'Short description',
    tab_label: 'Tab Label',
    // ... more keys
  }
}
```

---

## Bước 5: Tạo Data Hook (nếu cần)

```typescript
// packages/app/features/mobile/{module}/use{Module}Data.ts
import { useState, useEffect } from 'react'

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:18080'

export function use{Module}Data() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/v1/{module}/`)
      .then(r => r.json())
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  return { data, loading, error }
}
```

---

## Bước 6: Export & Index

Cập nhật `index.ts` của module:
```typescript
// packages/app/features/mobile/{module}/index.ts
export { {ScreenName}Screen } from './{screen-name}'
```

---

## Bước 7: Verify

```bash
# TypeScript check
cd apps/expo && npx tsc --noEmit

# Start dev server
cd apps/expo && npx expo start --clear
```

Checklist:
- [ ] Screen render không lỗi
- [ ] Navigation tới screen hoạt động
- [ ] Loading state hiển thị
- [ ] Error state hiển thị khi API fail
- [ ] Dark theme đúng
- [ ] Light theme đúng
- [ ] Text hiển thị tiếng Việt (default)
- [ ] Touch targets ≥ 44×44
- [ ] Back button hoạt động
- [ ] VoiceOver/TalkBack đọc được nội dung

---

## Liên Quan

- **Design system reference**: Skill `vct-mobile-lead` → Section 4
- **Mobile UI components**: `packages/app/features/mobile/mobile-ui.tsx`
- **Offline support**: Skill `vct-mobile-offline`
- **Testing screen**: Workflow `/mobile-test`
