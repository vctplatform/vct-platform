# VCT Platform Mobile App Architecture

This document defines the strictly enforced rules for the Expo/React Native mobile application. Given the challenging networking conditions of martial arts stadiums and the demand for high-performance scrolling across rosters, the VCT Mobile App must adhere strictly to these offline-first and performance paradigms.

## 1. Unified Framework & Monorepo Boundaries
- **Expo Managed Workflow**: Working directly inside `/ios` or `/android` raw native directories is categorically banned. We rely 100% on Expo Prebuild (Managed Workflow) config plugins.
- **Expo Router (File-Based Routing)**: Manual `react-navigation` configurations are deprecated. All navigation runs through `expo-router` to enforce 1:1 parity with Next.js web URLs, enabling seamless deep linking.
- **Shared Business Logic**: The mobile app must not duplicate domain models or API definitions. It must import pure logic from `packages/app/features/` or `packages/core/` within the monorepo workspace.

## 2. FAANG-Level Mobile Performance
- **List Virtualization (`FlashList`)**: Standard `<FlatList>` components are banned for rendering Athlete/Tournament rosters. You MUST use `@shopify/flash-list`. This recycles views and prevents memory crashes explicitly on lower-end Android devices.
- **Image Caching (`expo-image`)**: Standard React Native `<Image>` is banned for fetching network imagery. Use `<Image>` from `expo-image` exclusively to leverage powerful disk-based caching and blurhash loading placeholders.
- **UI Thread Animations**: JavaScript-driven animations (`Animated.timing`) are banned. All layout shifts, sidebars, and fluid animations must run on the dedicated UI thread using `react-native-reanimated`.

## 3. The Offline-First Shield (Stadium Resilience)
- **Local Persistence**: Relying solely on real-time `fetch` calls for critical data (like Match Scoring or Brackets) is banned. The Mobile app must implement a Local Database (WatermelonDB / SQLite / AsyncStorage + TanStack Persister) to hydrate the UI instantly upon launch.
- **Fail-Safe Mutation Sync**: When referees input scores offline, mutations MUST NOT throw an error. They must be saved locally into a robust Offline Sync Queue (e.g., WatermelonDB sync or TanStack offline queues) and automatically re-broadcasted the second standard cellular connection is restored.
- **Stale-While-Revalidate**: Always render cached UI states instantaneously. Background tasks fetch to revalidate without presenting full-page loading spinners blocking the UI.

## 4. Continuous Delivery & OTA Updates
- **EAS Build Automation**: Developers must not build standard production binaries from local Xcode/Android Studio. All RC (Release Candidate) and Production binaries must be generated deterministically via Expo Application Services (EAS Build).
- **Instant Hotfixing via OTA (Over The Air)**: Critical bug fixes addressing pure JavaScript logic or UI errors MUST utilize EAS Update for instant deployment, bypassing the multi-day Apple App Store or Google Play Store review delays.

## 5. Mobile UI & Accessibility Parity
- **Safe Areas & Notches**: The app must mathematically respect modern hardware bezels. Direct rendering into the top/bottom 30 pixels is banned unless wrapped inside `<SafeAreaView>` or explicitly padding out safe insets.
- **Accessibility Attributes**: Screen readers (Apple VoiceOver / Google TalkBack) must be fully supported. All interactive custom elements (buttons, pressable cards) must strictly provide `accessible={true}`, an `accessibilityRole`, and an `accessibilityLabel`.
