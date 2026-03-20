---
description: Workflow deploy mobile app lên App Store và Google Play cho VCT Platform
---

# /deploy-mobile — Deploy Mobile App Lên Stores

> Sử dụng khi cần submit mobile app lên App Store (iOS) và Google Play (Android).

// turbo-all

---

## Bước 1: Pre-Deploy Checklist

### Version & Changelog
```
□ Version number updated trong app.json (hoặc autoIncrement enabled)
□ Changelog viết cho version mới
□ Release notes viết cho stores (vi + en)
□ Screenshots cập nhật nếu UI thay đổi
```

### Quality Gate
```bash
# TypeScript check
cd apps/expo && npx tsc --noEmit

# Unit tests
npx jest --testPathPattern="mobile.*test"

# Verify build không lỗi
cd apps/expo && eas build --profile production --platform all --non-interactive
```

- [ ] TypeScript clean
- [ ] All tests pass
- [ ] EAS build thành công

---

## Bước 2: App Store Assets

### iOS (App Store Connect)
```
Cần chuẩn bị:
□ App Store Screenshots (6.7", 6.1", 5.5")
□ App Store Description (vi + en)
□ Keywords (vi + en)
□ Privacy Policy URL
□ Support URL
□ Marketing URL (optional)
□ App Category: Sports / Health & Fitness
□ Age Rating: 4+ (no objectionable content)
□ Content Rights: Yes (original content)
```

### Android (Google Play Console)
```
Cần chuẩn bị:
□ Feature Graphic (1024×500)
□ Phone Screenshots (min 2, max 8)
□ Play Store Description (vi + en)
□ Short Description (80 chars)
□ Privacy Policy URL
□ Content Rating questionnaire completed
□ Category: Sports
□ Target SDK compliance
```

---

## Bước 3: Build Production Binary

```bash
# Build cho cả 2 platform
cd apps/expo && eas build --profile production --platform all --non-interactive
```

Chờ build hoàn thành trên EAS dashboard (expo.dev):
- [ ] iOS build (.ipa) thành công
- [ ] Android build (.aab) thành công

---

## Bước 4: Submit to Stores

### iOS
```bash
# Submit qua EAS
cd apps/expo && eas submit --platform ios --non-interactive

# Hoặc manual:
# 1. Download .ipa từ EAS
# 2. Upload qua Transporter app hoặc xcrun altool
```

### Android
```bash
# Submit qua EAS
cd apps/expo && eas submit --platform android --non-interactive

# Hoặc manual:
# 1. Download .aab từ EAS
# 2. Upload lên Google Play Console → Internal testing track
```

---

## Bước 5: Store Review

### iOS Review Timeline
```
Internal Testing (TestFlight): Instant
External Testing (TestFlight): 24-48h review
App Store Review: 24-48h (average)
Expedited Review: Available qua Apple request form
```

### Android Review Timeline
```
Internal Testing: Instant
Closed Testing: Few hours
Open Testing: 1-3 days
Production: 1-7 days (first submission longer)
```

### Common Rejection Reasons
```
iOS:
  □ Missing privacy policy
  □ Incomplete metadata (screenshots, description)
  □ Guideline 4.2 — minimum functionality
  □ Login wall without demo account
  → Provide demo credentials in review notes

Android:
  □ Target SDK too low
  □ Missing data safety form
  □ Inappropriate content rating
  □ Missing privacy policy
```

---

## Bước 6: Post-Release

### Monitor (24h đầu)
```
□ Crash reports (Sentry / EAS Insights)
□ User ratings & reviews
□ Download numbers
□ Performance metrics
```

### OTA Capability
```bash
# Push hotfix qua OTA (JS-only changes, không cần store review)
cd apps/expo && eas update --branch production --message "Fix: <description>"
```

### Rollback Plan
```
iOS: App Store Connect → Remove from Sale → resubmit previous
Android: Play Console → Releases → Halt rollout → revert
OTA: eas update:rollback --branch production
```

---

## Bước 7: Version Tag

```bash
# Tag release
git tag mobile-v{X.Y.Z}
git push origin mobile-v{X.Y.Z}
```

---

## Liên Quan

- **Build configuration**: Workflow `/build-mobile`
- **Store credentials setup**: Skill `vct-mobile-build` → Section 5
- **CI/CD automation**: Skill `vct-mobile-cicd`
- **Release planning**: Skill `vct-release-manager`
