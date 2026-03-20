---
description: Playbook debug các lỗi thường gặp trong mobile app VCT Platform — crash, Metro, native build, layout, performance
---

# /mobile-debug — Debug Mobile Issues

> Sử dụng khi gặp lỗi với Expo mobile app: crash, build failure, Metro bundler, layout, performance.

// turbo-all

---

## Bước 1: Xác Định Loại Lỗi

| Triệu chứng | Loại lỗi | Skip tới |
|-------------|-----------|----------|
| Metro error khi start | Bundler | → Bước 2 |
| Build (EAS/local) thất bại | Native build | → Bước 3 |
| App crash khi chạy | Runtime crash | → Bước 4 |
| UI sai / layout lệch | Layout issue | → Bước 5 |
| App chạy chậm / lag | Performance | → Bước 6 |
| API không connect | Network | → Bước 7 |
| Module not found | Dependency | → Bước 8 |
| New Architecture issue | Fabric/TurboModules | → Bước 9 |

---

## Bước 2: Metro Bundler Errors

### "Unable to resolve module"
```bash
# Clear Metro cache
cd apps/expo && npx expo start --clear

# Verify metro.config.js watchFolders
# Phải include monorepo root cho cross-package imports
cat apps/expo/metro.config.js

# Reinstall dependencies
rm -rf node_modules apps/expo/node_modules
yarn install
```

### "Unexpected token" / Syntax error
```bash
# Check babel config
cat apps/expo/babel.config.js

# Verify react-compiler plugin compatible
# Nếu lỗi do compiler, tạm disable:
# Trong babel.config.js, comment out 'babel-plugin-react-compiler'
```

### Metro rất chậm
```bash
# Check file watcher limits (Linux/Mac)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Start with verbose logging
cd apps/expo && EXPO_DEBUG=1 npx expo start --clear
```

---

## Bước 3: Native Build Failures

### iOS Build (Xcode)
```bash
# Clean and reinstall pods
cd apps/expo/ios
pod deintegrate
pod install --repo-update

# Reset Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Rebuild
cd apps/expo && npx expo run:ios --device
```

### Android Build (Gradle)
```bash
# Clean Gradle cache
cd apps/expo/android
./gradlew clean

# Check Java version (requires JDK 17 for RN 0.81)
java -version

# Run with stacktrace for details
./gradlew assembleDebug --stacktrace
```

### EAS Build Failure
```bash
# Check build logs
eas build:list --limit 1

# View full build log URL
# Check EAS dashboard → Build → Logs tab

# Common fix: recreate prebuild
cd apps/expo && npx expo prebuild --clean
```

---

## Bước 4: Runtime Crashes

### JavaScript Crash
```bash
# Check Hermes stack trace (dev mode)
# Red screen shows error + stack trace
# Copy stack trace → analyze

# Enable verbose errors
cd apps/expo && EXPO_DEBUG=1 npx expo start

# Check for unhandled promises
# Add to App.tsx:
# import { LogBox } from 'react-native'
# LogBox.ignoreLogs(['Warning: ...']) // Suppress known warnings
```

### Native Crash (iOS)
```bash
# Check crash logs
# Xcode → Window → Devices and Simulators → Device Logs

# Symbolicate crash:
# Upload .dSYM files to error reporting service
```

### Native Crash (Android)
```bash
# Check logcat
adb logcat *:E | grep -i "vctplatform\|React\|Fatal"

# Filter for specific app
adb logcat --pid=$(adb shell pidof com.vctplatform.app)
```

---

## Bước 5: Layout Issues

### SafeArea Problems
```tsx
// Verify SafeAreaProvider is in root component
import { SafeAreaProvider } from 'react-native-safe-area-context'

// Use SafeAreaView or useSafeAreaInsets() in screens
import { useSafeAreaInsets } from 'react-native-safe-area-context'
const insets = useSafeAreaInsets()
// paddingTop: insets.top, paddingBottom: insets.bottom
```

### Keyboard Overlap
```tsx
import { KeyboardAvoidingView, Platform } from 'react-native'

<KeyboardAvoidingView
  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
>
  {/* Form content */}
</KeyboardAvoidingView>
```

### Notch / Dynamic Island
```
Verify trong SharedStyles.page:
  - Sử dụng SafeAreaView hoặc useSafeAreaInsets()
  - KHÔNG hardcode paddingTop

Test trên:
  □ iPhone 15 (Dynamic Island)
  □ iPhone SE (no notch)
  □ Android (various notch styles)
```

---

## Bước 6: Performance Issues

### Chẩn đoán nhanh
```bash
# Mở React DevTools Profiler
npx react-devtools
# → Profiler tab → Record → interact → Stop → analyze renders
```

### Frame Drops
```
Checklist:
□ FlatList thay vì ScrollView cho long lists?
□ renderItem wrapped trong memo()?
□ keyExtractor stable?
□ Inline functions trong render? → Extract
□ Object spread creating new style mỗi render? → StyleSheet.create
□ Heavy computation in render? → useMemo
```

### Memory Leak
```
Checklist:
□ useEffect cleanup return?
□ WebSocket closed on unmount?
□ setInterval cleared?
□ Event listeners removed?
□ AbortController for fetch?
```

> Đọc skill **vct-mobile-performance** (`.agents/skills/vct-mobile-performance/SKILL.md`) cho deep-dive.

---

## Bước 7: Network / API Issues

### API không connect
```bash
# Check API base URL
cd apps/expo && npx expo config --type public | grep API

# Từ device thật:
# - localhost KHÔNG work → dùng IP máy dev (192.168.x.x)
# - Hoặc dùng staging URL

# Test API accessible
curl -s http://<API_BASE>/healthz
```

### CORS Error
```
CORS chỉ relevant cho web builds.
Mobile app (React Native) KHÔNG bị CORS.
Nếu bị lỗi CORS → bạn đang chạy web, không phải mobile.
```

### SSL / Certificate Issues
```
# Dev: HTTP is OK
# Staging/Prod: HTTPS required

# Self-signed cert (dev only):
# Thêm vào network config hoặc dùng --no-install-check
```

---

## Bước 8: Dependency Issues

### Module Not Found (After Install)
```bash
# Clear all caches
cd apps/expo
npx expo start --clear
# Nếu vẫn lỗi:
rm -rf node_modules
cd ../..
rm -rf node_modules
yarn install
```

### Version Conflict
```bash
# Check compatibility
cd apps/expo && npx expo doctor

# Fix auto-resolvable issues
cd apps/expo && npx expo install --fix
```

### Monorepo Resolution
```
Verify metro.config.js:
  - watchFolders includes monorepo root
  - nodeModulesPaths includes both project AND root node_modules
```

---

## Bước 9: New Architecture Issues

### "TurboModuleRegistry has no callable function"
```bash
# Prebuild with clean
cd apps/expo && npx expo prebuild --clean

# Verify newArchEnabled: true in app.json
cat apps/expo/app.json | grep newArch
```

### Fabric Rendering Issues
```
Nếu library chưa support New Arch:
1. Check library changelog/docs cho Fabric support
2. Nếu chưa support → disable New Architecture temporarily:
   app.json: "newArchEnabled": false
3. Hoặc tìm alternative library
```

### React Compiler Issues
```
Nếu compiler gây lỗi runtime:
1. Tạm disable trong babel.config.js
2. Kiểm tra component nào gây lỗi
3. Thêm 'use no memo' directive nếu cần
```

---

## Quick Reference

| Lệnh | Mục đích |
|-------|---------|
| `npx expo start --clear` | Restart với cache sạch |
| `npx expo doctor` | Kiểm tra compatibility |
| `npx expo install --fix` | Fix version conflicts |
| `npx expo prebuild --clean` | Rebuild native projects |
| `adb logcat *:E` | Android error logs |
| `npx react-devtools` | React profiler |
| `eas build:list --limit 5` | Recent EAS builds |

---

## Liên Quan

- **Performance deep-dive**: Skill `vct-mobile-performance`
- **Build troubleshooting**: Skill `vct-mobile-build` → Section 11
- **Test debugging**: Workflow `/mobile-test`
- **Common web errors**: Workflow `/debug-common-errors`
