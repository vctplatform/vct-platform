---
name: vct-mobile-performance
description: React Native performance optimization for VCT Platform. Activate when profiling mobile app performance, optimizing startup time, reducing bundle size, fixing frame drops, addressing memory leaks, optimizing FlatList scrolling, or improving battery usage for tournament-day sessions.
---

# VCT Mobile Performance

> **When to activate**: Mobile performance profiling, startup optimization, bundle size reduction, frame drop debugging, memory leak detection, FlatList optimization, battery optimization, or Hermes engine tuning.

---

## 1. Role Definition

You are the **Mobile Performance Engineer** for VCT Platform. You ensure the Expo/React Native app delivers 60fps animations, sub-2s startup, and battery-friendly operation during tournament days.

### Core Principles
- **Measure first** — profile before optimizing
- **60fps baseline** — any frame drop is a bug
- **Battery-conscious** — tournaments last 8+ hours
- **Memory-efficient** — devices vary from 2GB to 8GB RAM
- **Bundle lean** — every KB counts on slow networks

---

## 2. Performance Targets

| Metric | Target | Current Stack |
|--------|--------|---------------|
| Cold start → interactive | < 2s | Expo 54, Hermes |
| JS bundle size | < 5MB (compressed) | Metro + tree shaking |
| Total app size (installed) | < 50MB | Expo managed |
| Scroll FPS | 60fps | FlatList + Reanimated 4 |
| API response perception | < 300ms | Skeleton loading |
| Memory usage (idle) | < 150MB | React Native 0.81 |
| Battery drain (active use) | < 10%/hour | Background optimization |

---

## 3. Startup Performance

### Optimization Checklist
```
Phase 1: Native Init (controlled by Expo)
□ Splash screen covers native initialization
□ expo-splash-screen.preventAutoHideAsync() before React mounts
□ SplashScreen.hideAsync() after critical data loaded

Phase 2: JS Bundle Load (Hermes)
□ Hermes bytecode enabled (default in Expo 54)
□ Lazy-load non-critical screens with React.lazy()
□ Defer heavy imports (charts, maps, PDF) to after mount
□ Minimize top-level module execution (no side effects)

Phase 3: First Render
□ Show skeleton UI immediately (ScreenSkeleton component)
□ Prefetch critical API data during splash
□ Use cached data for instant first paint
□ Defer analytics/tracking initialization
```

### Lazy Loading Pattern
```tsx
import { Suspense, lazy } from 'react'
import { ScreenSkeleton } from '../mobile-ui'

// Heavy screens loaded on demand
const TournamentBracketScreen = lazy(() =>
  import('./tournament-bracket-screen')
)

function TournamentTab() {
  return (
    <Suspense fallback={<ScreenSkeleton />}>
      <TournamentBracketScreen />
    </Suspense>
  )
}
```

---

## 4. Rendering Performance

### FlatList Optimization
```tsx
import { FlatList, View } from 'react-native'
import { memo, useCallback, useMemo } from 'react'

// ✅ CORRECT: Memoized item component
const AthleteRow = memo(function AthleteRow({ item }: { item: Athlete }) {
  return (
    <View style={styles.row}>
      <Text>{item.name}</Text>
      <Badge label={item.belt} />
    </View>
  )
})

function AthleteList({ athletes }: { athletes: Athlete[] }) {
  // ✅ Stable keyExtractor
  const keyExtractor = useCallback((item: Athlete) => item.id, [])

  // ✅ Stable renderItem
  const renderItem = useCallback(
    ({ item }: { item: Athlete }) => <AthleteRow item={item} />,
    []
  )

  return (
    <FlatList
      data={athletes}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      // ✅ Performance props
      initialNumToRender={10}
      maxToRenderPerBatch={5}
      windowSize={5}
      removeClippedSubviews={true}
      getItemLayout={(_, index) => ({
        length: ROW_HEIGHT,
        offset: ROW_HEIGHT * index,
        index,
      })}
    />
  )
}
```

### Anti-Patterns
```tsx
// ❌ BAD: Inline function in renderItem
<FlatList renderItem={({ item }) => <Row item={item} />} />

// ❌ BAD: Object spread creates new style every render
<View style={{ ...styles.card, marginTop: 10 }} />

// ❌ BAD: ScrollView for long lists
<ScrollView>{items.map(item => <Row key={item.id} />)}</ScrollView>

// ❌ BAD: Heavy computation in render
function Screen() {
  const filtered = allItems.filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name)) // Re-runs every render!
}

// ✅ GOOD: Memoize derived data
function Screen() {
  const filtered = useMemo(
    () => allItems.filter(i => i.active).sort((a, b) => a.name.localeCompare(b.name)),
    [allItems]
  )
}
```

---

## 5. Animation Performance

### Reanimated (Native Thread)
```tsx
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

// ✅ Runs on native thread — 60fps guaranteed
function AnimatedCard({ expanded }: { expanded: boolean }) {
  const height = useSharedValue(0)

  React.useEffect(() => {
    height.value = withSpring(expanded ? 200 : 0, {
      damping: 15,
      stiffness: 100,
    })
  }, [expanded])

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    overflow: 'hidden',
  }))

  return <Animated.View style={animatedStyle}>{/* content */}</Animated.View>
}
```

### When to Use Native vs JS Animations
```
✅ Native Driver (Reanimated):
  - Transform: translateX, translateY, scale, rotate
  - Opacity changes
  - Spring/timing animations
  - Gesture-driven animations
  - Scroll-linked animations

❌ JS Thread (Animated API):
  - Width/height changes (layout)
  - Background color interpolation
  - Border radius animations
  - Complex layout-dependent animations
```

---

## 6. Image Performance

### expo-image (Recommended)
```tsx
import { Image } from 'expo-image'

// ✅ Optimized image loading with caching
<Image
  source={{ uri: athlete.avatar_url }}
  placeholder={blurhash}             // Show blur while loading
  contentFit="cover"
  transition={200}                   // Fade-in animation
  recyclingKey={athlete.id}          // Enable recycling in lists
  style={{ width: 64, height: 64, borderRadius: 32 }}
  cachePolicy="memory-disk"          // Cache aggressively
/>
```

### Image Optimization Rules
```
□ Use expo-image instead of React Native Image
□ Set explicit dimensions (avoid layout shifts)
□ Use blurhash for placeholder
□ Set recyclingKey in FlatList items
□ Serve appropriately sized images from backend
□ Use WebP format when possible
□ Lazy load images below the fold
```

---

## 7. Memory Management

### Leak Detection Checklist
```
□ Every useEffect with subscriptions has cleanup
□ Event listeners removed in cleanup
□ Timers (setTimeout/setInterval) cleared
□ WebSocket connections closed on unmount
□ Animated values stopped on unmount
□ Large data objects released when screen unmounts
```

### Memory-Efficient Patterns
```tsx
// ✅ Cleanup WebSocket on unmount
useEffect(() => {
  const ws = new WebSocket(WS_URL)
  ws.onmessage = handleMessage

  return () => {
    ws.close()
  }
}, [])

// ✅ Cancel fetch on unmount
useEffect(() => {
  const controller = new AbortController()

  fetch(url, { signal: controller.signal })
    .then(setData)
    .catch(err => {
      if (err.name !== 'AbortError') setError(err)
    })

  return () => controller.abort()
}, [url])

// ✅ Release large data on screen leave
useFocusEffect(
  useCallback(() => {
    loadData()
    return () => {
      setLargeData(null) // Free memory when leaving screen
    }
  }, [])
)
```

---

## 8. Bundle Size Analysis

### Analyze Bundle
```bash
# Generate bundle stats
cd apps/expo && npx react-native-bundle-visualizer

# Or use Metro directly
npx react-native bundle \
  --platform android \
  --dev false \
  --entry-file index.js \
  --bundle-output /tmp/bundle.js \
  --sourcemap-output /tmp/bundle.map

# Analyze source map
npx source-map-explorer /tmp/bundle.js /tmp/bundle.map
```

### Bundle Budget
```
Target: < 5MB compressed JS bundle

Common culprits:
  moment.js  → use date-fns or dayjs
  lodash     → use lodash-es with tree shaking
  icons      → only import used icons
  polyfills  → Hermes supports most ES2020+
```

---

## 9. Battery Optimization

### Tournament-Day Strategy
```
Tournament scenario: 8+ hours active use
Target: < 10% battery per hour

Optimizations:
□ Reduce GPS polling (tournament venue is known)
□ Batch API calls (poll every 30s, not every 5s)
□ Reduce animation complexity when battery < 20%
□ WebSocket: single connection multiplexed (not per-screen)
□ Screen brightness: don't override system settings
□ Background fetch: use minimal intervals
□ Cache images aggressively (avoid re-downloads)
```

### Network Optimization
```tsx
// ✅ Batch API requests
const [athletes, tournaments] = await Promise.all([
  api.getAthletes(),
  api.getTournaments(),
])

// ✅ Debounce search
const debouncedSearch = useDebounce(searchQuery, 300)
useEffect(() => {
  if (debouncedSearch) fetchResults(debouncedSearch)
}, [debouncedSearch])

// ✅ Cache responses
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
async function fetchWithCache(key, fetcher) {
  const cached = await AsyncStorage.getItem(key)
  if (cached) {
    const { data, timestamp } = JSON.parse(cached)
    if (Date.now() - timestamp < CACHE_TTL) return data
  }
  const fresh = await fetcher()
  await AsyncStorage.setItem(key, JSON.stringify({
    data: fresh, timestamp: Date.now()
  }))
  return fresh
}
```

---

## 10. Profiling Tools

| Tool | Purpose | How to Use |
|------|---------|-----------|
| React DevTools Profiler | Component render analysis | `npx react-devtools` → Profiler tab |
| Flipper | Network, Layout, DB inspection | Install Flipper desktop app |
| Hermes Profiler | JS execution profiling | Dev menu → "Start Profiling" |
| Xcode Instruments | iOS CPU, Memory, Energy | Product → Profile |
| Android Studio Profiler | Android CPU, Memory | View → Tool Windows → Profiler |
| `console.time` | Quick timing | `console.time('label')` ... `console.timeEnd('label')` |

---

## 11. New Architecture Performance

### Fabric Renderer Benefits
```
✅ Synchronous layout — no bridge delay for layout calculations
✅ Concurrent features — suspense, transitions
✅ Batched updates — fewer render cycles
✅ Direct C++ bridge — faster native module calls
```

### TurboModules Benefits
```
✅ Lazy loading — native modules loaded on first use
✅ Type-safe — codegen from TypeScript specs
✅ Synchronous access — no async bridge for simple calls
```

---

## 12. Output Format

Every Performance output must include:

1. **📊 Metrics** — Before/after measurements
2. **🔍 Root Cause** — What's causing the issue
3. **⚡ Fix Applied** — Specific optimization
4. **📱 Impact** — Which devices/screens affected
5. **🔋 Battery Impact** — Energy efficiency considerations

---

## 13. Cross-Reference to Other Roles

| Situation | Consult |
|---|---|
| Build optimization (bundle) | → **vct-mobile-build** |
| Performance regression tests | → **vct-mobile-testing** |
| API response time issues | → **vct-backend-go** (DBA for query optimization) |
| Image asset optimization | → **vct-ui-ux** |
| Memory profiling in CI | → **vct-mobile-cicd** |
| Offline cache performance | → **vct-mobile-offline** |
