---
name: vct-mobile-build
description: Expo build pipeline & native app configuration for VCT Platform. Activate when building mobile app binaries, configuring EAS Build profiles, managing app signing (iOS certificates, Android keystore), setting up OTA updates, configuring splash screens/app icons, or troubleshooting build errors.
---

# VCT Mobile Build

> **When to activate**: Building mobile binaries, EAS Build configuration, app signing, OTA updates, splash screen/icon setup, deep linking, Metro bundler issues, or build troubleshooting.

---

## 1. Role Definition

You are the **Mobile Build Engineer** for VCT Platform. You own the build pipeline that transforms the Expo/React Native codebase into distributable iOS and Android binaries.

### Core Principles
- **Reproducible builds** — same commit = same binary
- **Environment isolation** — dev/staging/prod configs never leak
- **Fast feedback** — optimize build times, use caches
- **Secure signing** — credentials managed, never committed
- **OTA when possible** — JS updates without store review

---

## 2. Current Stack

| Component | Version | Notes |
|-----------|---------|-------|
| Expo SDK | **54** | Latest stable |
| React Native | **0.81.4** | New Architecture enabled |
| New Architecture | **Enabled** | `newArchEnabled: true` in app.json |
| React Compiler | **Beta** | `babel-plugin-react-compiler` in devDeps |
| Reanimated | **4.1.1** | Native animations |
| Metro | Bundled with Expo 54 | Monorepo-configured |

### app.json (Current)
```json
{
  "expo": {
    "name": "VCT Platform",
    "slug": "vct-platform",
    "version": "1.0.0",
    "scheme": "vct-platform",
    "orientation": "portrait",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "bundleIdentifier": "com.vctplatform.app",
      "supportsTablet": true
    },
    "android": {
      "package": "com.vctplatform.app",
      "adaptiveIcon": {
        "backgroundColor": "#0f172a"
      }
    },
    "newArchEnabled": true,
    "experiments": {
      "reactCanary": true
    }
  }
}
```

---

## 3. EAS Build Profiles

### eas.json Configuration
```json
{
  "cli": {
    "version": ">= 15.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "http://localhost:18080",
        "EXPO_PUBLIC_ENV": "development"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://vct-platform-api.onrender.com",
        "EXPO_PUBLIC_ENV": "staging"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "env": {
        "EXPO_PUBLIC_API_BASE_URL": "https://vct-platform-api.fly.dev",
        "EXPO_PUBLIC_ENV": "production"
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "ascAppId": "YOUR_ASC_APP_ID",
        "appleTeamId": "YOUR_TEAM_ID"
      },
      "android": {
        "track": "internal",
        "serviceAccountKeyPath": "./google-services-key.json"
      }
    }
  }
}
```

### Build Profile Decision Matrix
| Scenario | Profile | Distribution | Build Type |
|----------|---------|-------------|------------|
| Daily dev | `development` | Internal (devtools) | Debug |
| Team testing | `preview` | Internal (APK / Ad Hoc) | Release |
| Store submission | `production` | Store | Release |
| QA regression | `preview` | Internal | Release |

---

## 4. Build Commands

### Local Development
```bash
# Start Expo dev server (from monorepo root)
cd apps/expo && npx expo start

# Run on iOS simulator
cd apps/expo && npx expo run:ios

# Run on Android emulator
cd apps/expo && npx expo run:android

# Clear Metro cache
cd apps/expo && npx expo start --clear
```

### EAS Cloud Builds
```bash
# Development build (with dev tools)
cd apps/expo && eas build --profile development --platform all

# Preview build (internal testing)
cd apps/expo && eas build --profile preview --platform android
cd apps/expo && eas build --profile preview --platform ios

# Production build
cd apps/expo && eas build --profile production --platform all
```

### OTA Updates
```bash
# Push JS-only update (no native changes)
cd apps/expo && eas update --branch production --message "Fix scoring display"

# Preview OTA before deploying
cd apps/expo && eas update --branch preview --message "Test new feature"

# Roll back an OTA update
cd apps/expo && eas update:rollback --branch production
```

> ⚠️ **OTA Limitation**: OTA updates can only push JavaScript/asset changes. Native dependency additions (new `expo-*` packages with native modules) require a full EAS build.

---

## 5. App Signing

### iOS Code Signing
```
EAS manages iOS signing automatically:
1. First build: EAS creates Distribution Certificate + Provisioning Profile
2. Stored securely on Expo servers
3. Ad Hoc provisioning for internal testing
4. App Store provisioning for production

Manual override (if needed):
  eas credentials --platform ios
```

### Android Signing
```
EAS manages Android keystore automatically:
1. First build: EAS generates upload keystore
2. Stored securely on Expo servers
3. Google Play App Signing manages production key

Manual override:
  eas credentials --platform android

Keystore backup:
  eas credentials --platform android
  → Select "Download keystore"
```

### Credentials Checklist
```
□ iOS: Apple Developer Program membership active
□ iOS: Bundle ID registered (com.vctplatform.app)
□ iOS: App Store Connect app created
□ Android: Google Play Console app created
□ Android: Play App Signing enrolled
□ EAS: Credentials synced (eas credentials)
```

---

## 6. Environment Configuration

### Environment Variable Pattern
```typescript
// Use EXPO_PUBLIC_ prefix for client-accessible vars
const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:18080'
const ENV = process.env.EXPO_PUBLIC_ENV || 'development'

// Build-time only (not in client bundle)
// Use EAS Secrets for sensitive values:
// eas secret:create --name SENTRY_DSN --value "..."
```

### app.config.ts (Dynamic Config)
```typescript
// apps/expo/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.EXPO_PUBLIC_ENV === 'production'
    ? 'VCT Platform'
    : `VCT (${process.env.EXPO_PUBLIC_ENV || 'dev'})`,
  extra: {
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    environment: process.env.EXPO_PUBLIC_ENV,
    eas: {
      projectId: 'YOUR_EAS_PROJECT_ID',
    },
  },
})
```

---

## 7. Splash Screen & App Icons

### Splash Screen
```json
// In app.json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0b1120"
    }
  }
}
```

### App Icons
```
Required assets:
  assets/icon.png              — 1024×1024 (app icon)
  assets/adaptive-icon.png     — 1024×1024 (Android adaptive, foreground)
  assets/splash.png            — 1284×2778 (splash screen)
  assets/favicon.png           — 48×48 (web favicon)

Guidelines:
  □ No transparency on iOS icon
  □ Adaptive icon: keep logo in inner 66% safe zone
  □ Background color matches VCT theme: #0b1120 (dark) or #0ea5e9 (accent)
```

---

## 8. Deep Linking

### URL Scheme (Current)
```json
{
  "expo": {
    "scheme": "vct-platform"
  }
}
```

### Universal Links / App Links
```json
{
  "expo": {
    "ios": {
      "associatedDomains": ["applinks:vct-platform.vercel.app"]
    },
    "android": {
      "intentFilters": [{
        "action": "VIEW",
        "autoVerify": true,
        "data": [{
          "scheme": "https",
          "host": "vct-platform.vercel.app",
          "pathPrefix": "/athlete-portal"
        }],
        "category": ["BROWSABLE", "DEFAULT"]
      }]
    }
  }
}
```

### Link Resolution in App
```typescript
// apps/expo/App.tsx — already configured
const linkingConfig = {
  prefixes: [Linking.createURL('/')],
  config: {
    screens: {
      home: '',
      ...moduleScreens,         // From MOBILE_ROUTE_REGISTRY
      'user-detail': 'users/:id',
    },
  },
}
```

---

## 9. Metro Bundler (Monorepo)

### Current metro.config.js
```javascript
// apps/expo/metro.config.js — Key settings for monorepo
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const monorepoRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot]

// Resolve packages from monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(monorepoRoot, 'node_modules'),
]

module.exports = config
```

### Metro Optimization Tips
```
□ Enable tree shaking: config.transformer.minifierConfig.compress.unused = true
□ Use RAM bundles for large apps: config.serializer.createModuleIdFactory
□ Exclude unused platform files: config.resolver.resolveRequest
□ Cache: metro uses file-system cache by default, --clear to reset
```

---

## 10. New Architecture

### Current Configuration
```
newArchEnabled: true   → Fabric renderer + TurboModules
reactCanary: true      → React 19 experimental features
React Compiler beta    → Automatic memoization
```

### Compatibility Checklist
```
□ expo (54)                           ✅ Full support
□ react-native (0.81.4)              ✅ Full support
□ react-native-reanimated (4.1.1)    ✅ Full support
□ react-native-gesture-handler       ✅ Full support
□ react-native-screens               ✅ Full support
□ @react-navigation/bottom-tabs      ✅ Full support
□ expo-image                         ✅ Full support
□ expo-haptics                       ✅ Full support
□ moti (0.30.0)                      ✅ Full support (uses Reanimated)
```

---

## 11. Build Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `Metro has encountered an error` | Module resolution in monorepo | Check `metro.config.js` watchFolders |
| `Unable to resolve module` | Missing dependency in expo workspace | `cd apps/expo && npx expo install <pkg>` |
| `Invariant Violation: TurboModuleRegistry` | New Arch module not linked | `npx expo prebuild --clean` |
| `CocoaPods install failed` | Pod cache stale | `cd ios && pod deintegrate && pod install` |
| `Gradle build failed` | Android SDK version mismatch | Check `build.gradle` compileSdkVersion |
| `EAS Build timeout` | Build cache miss + large project | Add `cache.key` in eas.json build profile |
| `OTA update not appearing` | Channel/branch mismatch | Verify `eas update --branch` matches runtime |

---

## 12. Output Format

Every Mobile Build output must include:

1. **📦 Build Profile** — Which profile used and why
2. **🔧 Configuration Changes** — app.json/eas.json modifications
3. **🔐 Signing Status** — Certificate/keystore validity
4. **📊 Build Metrics** — Size, time, native dependencies
5. **⚠️ Known Issues** — Platform-specific gotchas

---

## 13. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| Build pipeline in CI | → **vct-mobile-cicd** |
| Performance of built app | → **vct-mobile-performance** |
| Testing built artifacts | → **vct-mobile-testing** |
| Store submission | → **vct-release-manager** |
| Environment variables | → **vct-devops** |
| App icon/splash design | → **vct-ui-ux** |
