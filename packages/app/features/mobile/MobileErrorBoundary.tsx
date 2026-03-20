// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Mobile Error Boundary
// Catches JS crashes in mobile screens and shows recovery UI.
// ═══════════════════════════════════════════════════════════════

import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

interface Props {
  children: ReactNode
  /** Fallback UI (overrides default crash screen) */
  fallback?: ReactNode
  /** Called when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Screen name for error reporting context */
  screenName?: string
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * React error boundary for mobile screens.
 *
 * Catches unhandled JS errors, logs them, and shows a recovery UI.
 * Wrap screens or major components to prevent full-app crashes.
 *
 * @example
 * ```tsx
 * <MobileErrorBoundary screenName="ProfileScreen">
 *   <ProfileScreen />
 * </MobileErrorBoundary>
 * ```
 */
export class MobileErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to console (captured by Sentry/Crashlytics if configured)
    console.error(
      `[MobileErrorBoundary] ${this.props.screenName ?? 'Unknown'} crashed:`,
      error,
      errorInfo.componentStack,
    )

    this.setState({ errorInfo })

    // Call external error handler
    this.props.onError?.(error, errorInfo)

    // TODO: Send to crash reporting service
    // Sentry.captureException(error, { extra: { componentStack: errorInfo.componentStack } })
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.emoji}>⚠️</Text>
            <Text style={styles.title}>Đã xảy ra lỗi</Text>
            <Text style={styles.subtitle}>
              {this.props.screenName
                ? `Màn hình "${this.props.screenName}" gặp sự cố`
                : 'Ứng dụng gặp sự cố không mong muốn'}
            </Text>

            {__DEV__ && this.state.error && (
              <ScrollView style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Info:</Text>
                <Text style={styles.debugText}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo?.componentStack && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack.slice(0, 500)}
                  </Text>
                )}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={this.handleReset}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }

    return this.props.children
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0b1120',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 360,
    width: '100%',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  debugContainer: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
    width: '100%',
    marginBottom: 24,
  },
  debugTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ef4444',
    marginBottom: 4,
  },
  debugText: {
    fontSize: 11,
    color: '#cbd5e1',
    fontFamily: 'monospace',
  },
  button: {
    backgroundColor: '#0ea5e9',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    minWidth: 160,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default MobileErrorBoundary
