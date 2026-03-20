---
description: Workflow build và distribute mobile app (dev/preview/production) cho VCT Platform
---

# /build-mobile — Build & Distribute Mobile App

> Sử dụng khi cần build mobile app Expo cho phát triển, testing nội bộ, hoặc publish lên stores.

// turbo-all

---

## Bước 1: Pre-Build Verification

```bash
# TypeScript check
cd apps/expo && npx tsc --noEmit

# Verify dependencies
cd apps/expo && npx expo doctor
```

Checklist:
- [ ] TypeScript không lỗi
- [ ] `expo doctor` pass (no critical issues)
- [ ] Expo SDK version match trong `app.json`

---

## Bước 2: Chọn Build Profile

| Mục đích | Profile | Command |
|----------|---------|---------|
| Dev với devtools | `development` | `eas build --profile development` |
| Test nội bộ (team) | `preview` | `eas build --profile preview` |
| Submit lên Store | `production` | `eas build --profile production` |

> ⚠️ Đọc skill **vct-mobile-build** (`.agents/skills/vct-mobile-build/SKILL.md`) nếu cần cấu hình chi tiết EAS profiles.

---

## Bước 3: Kiểm Tra Environment

```bash
# Xem current app.json config
cd apps/expo && npx expo config --type public
```

Verify environment variables theo profile:
```
Development:
  □ EXPO_PUBLIC_API_BASE_URL = http://localhost:18080
  □ EXPO_PUBLIC_ENV = development

Preview (Staging):
  □ EXPO_PUBLIC_API_BASE_URL = https://vct-platform-api.onrender.com
  □ EXPO_PUBLIC_ENV = staging

Production:
  □ EXPO_PUBLIC_API_BASE_URL = https://vct-platform-api.fly.dev
  □ EXPO_PUBLIC_ENV = production
```

---

## Bước 4: Build

### 4.1 Local Build (Dev)
```bash
# Start dev server
cd apps/expo && npx expo start --clear

# Run on simulator/emulator
cd apps/expo && npx expo run:ios
cd apps/expo && npx expo run:android
```

### 4.2 EAS Cloud Build
```bash
# Build cho cả 2 platform
cd apps/expo && eas build --profile <profile> --platform all --non-interactive

# Hoặc từng platform
cd apps/expo && eas build --profile <profile> --platform android
cd apps/expo && eas build --profile <profile> --platform ios
```

### 4.3 OTA Update (JS-only changes)
```bash
# Chỉ khi KHÔNG thay đổi native dependencies
cd apps/expo && eas update --branch <branch> --message "<description>"
```

> ⚠️ OTA chỉ dùng cho thay đổi JS/assets. Nếu thêm native dependency mới → phải full build.

---

## Bước 5: Distribute

### Development
```
Build tự sẵn trên EAS dashboard (expo.dev)
Hoặc dùng dev server: npx expo start
```

### Preview (Internal Testing)
```
Android: Download APK từ EAS build page
iOS: Install qua Ad Hoc provisioning
Chia sẻ link qua internal distribution
```

### Production
```bash
# Submit lên App Store / Google Play
cd apps/expo && eas submit --platform ios
cd apps/expo && eas submit --platform android
```

---

## Bước 6: Post-Build Verification

Checklist:
- [ ] App install thành công trên device thật
- [ ] Splash screen hiển thị đúng
- [ ] Login flow hoạt động
- [ ] Navigation giữa các tab OK
- [ ] API calls trả về data (không 401/403/CORS)
- [ ] Dark/Light theme đúng
- [ ] Offline banner hiển thị khi mất mạng
- [ ] Touch targets đủ lớn (≥ 44×44)

---

## Liên Quan

- **Build config chi tiết**: `/build-mobile` → Skill `vct-mobile-build`
- **Deploy lên Store**: → Workflow `/deploy-mobile`
- **Debug build errors**: → Workflow `/mobile-debug`
- **CI/CD automation**: → Skill `vct-mobile-cicd`
