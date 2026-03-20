// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — App Wrapper
// The root composition component. Wraps the app in all necessary
// contexts (Theme, Toast) and manages the async global bootstrap.
// Hides splash screen only when everything is perfectly ready.
// ═══════════════════════════════════════════════════════════════

import React, { useEffect, useState, type ReactNode } from 'react'
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native'
import * as SplashScreen from 'expo-splash-screen'
import { VCTThemeProvider } from './theme-provider'
import { ToastProvider } from './toast-notification'
import { bootstrapApp } from './app-bootstrap'
import { ErrorState } from './error-states'

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reloading the app might trigger some errors */
})

export interface AppWrapperProps {
  children: ReactNode
  /** Minimum ms to show splash screen to prevent flashing (default: 1500) */
  minSplashDuration?: number
}

/**
 * Root Application Wrapper.
 * Must be mounted at the very top of `App.tsx` or `app/_layout.tsx`.
 *
 * @example
 * ```tsx
 * export default function RootLayout() {
 *   return (
 *     <AppWrapper>
 *       <Slot /> // Expo Router children
 *     </AppWrapper>
 *   )
 * }
 * ```
 */
export function AppWrapper({ children, minSplashDuration = 1500 }: AppWrapperProps) {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState('Khởi động...')

  useEffect(() => {
    let isMounted = true
    const start = Date.now()

    async function prepare() {
      try {
        // Run the 9-step massive bootstrap defined in Phase 13
        const result = await bootstrapApp({
          appVersion: '1.0.0', // Read from expo-constants normally
          timeoutMs: 15000,
          onProgress: (pct, currentStep) => {
            if (isMounted) {
              setProgress(pct)
              setStep(currentStep)
            }
          },
        })

        if (!result.success) {
          // A critical failure happened (e.g., config loading failed)
          // `bootstrapApp` guarantees it only returns success=false if a critical step fails
          throw new Error('Critical bootstrap failure')
        }

      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        // Enforce minimum splash duration to show branding
        const elapsed = Date.now() - start
        if (elapsed < minSplashDuration) {
          await new Promise((resolve) => setTimeout(resolve, minSplashDuration - elapsed))
        }

        if (isMounted) {
          setIsReady(true)
          // Hide native splash screen
          await SplashScreen.hideAsync().catch(() => {})
        }
      }
    }

    prepare()

    return () => {
      isMounted = false
    }
  }, [minSplashDuration])

  if (error) {
    // If we failed critically to boot, show a fatal error screen outside of normal routing
    return (
      <View style={styles.fatalContainer}>
        <ErrorState
          title="Lỗi Khởi Động"
          message="Không thể khởi động hệ thống VCT Platform. Vui lòng kiểm tra kết nối mạng và thử lại."
          retryLabel="Khởi động lại"
          onRetry={() => {
            // Trigger a full app reload if in Expo Go, or just reset state
            setError(null)
            setIsReady(false)
            // Hard reload logic could be inserted here
            import('react-native').then((rn) => {
              rn.DevSettings?.reload?.()
            })
          }}
        />
      </View>
    )
  }

  if (!isReady) {
    // Optional fallback if the native splash screen goes away too early,
    // or if we want to show a custom loading animation with progress.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#00E5CC" />
        <Text style={styles.loadingText}>{step}</Text>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    )
  }

  return (
    <VCTThemeProvider defaultMode="system">
      <ToastProvider>
        {children}
      </ToastProvider>
    </VCTThemeProvider>
  )
}

const styles = StyleSheet.create({
  fatalContainer: {
    flex: 1,
    backgroundColor: '#0A0E14', // Fallback to raw dark color if theme fails
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0A0E14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  progressText: {
    color: '#F0F4F8',
    marginTop: 8,
    fontSize: 12,
  },
})
