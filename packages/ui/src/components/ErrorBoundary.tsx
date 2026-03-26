import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ERROR BOUNDARY
// Catches JS errors in any child component tree.
// Shows fallback UI with retry button + error details.
// ═══════════════════════════════════════════════════════════════

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback component */
  fallback?: ReactNode
  /** Called when an error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  /** Label for the boundary (shown in error UI) */
  label?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    this.props.onError?.(error, errorInfo)

    // Log to console in development
    if (__DEV__) {
      console.error('[ErrorBoundary]', error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return <ErrorFallback error={this.state.error} onRetry={this.handleRetry} label={this.props.label} />
    }
    return this.props.children
  }
}

// ── Fallback UI ─────────────────────────────────────────────

interface ErrorFallbackProps {
  error: Error | null
  onRetry: () => void
  label?: string
}

function ErrorFallback({ error, onRetry, label }: ErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>⚠️</Text>
        <Text style={styles.title}>Đã xảy ra lỗi{label ? ` tại ${label}` : ''}</Text>
        <Text style={styles.message}>
          {error?.message || 'Một lỗi không mong đợi đã xảy ra. Vui lòng thử lại.'}
        </Text>
        <Pressable style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>🔄 Thử lại</Text>
        </Pressable>
        {__DEV__ && error?.stack && (
          <View style={styles.stackContainer}>
            <Text style={styles.stackTitle}>Stack Trace (Dev only):</Text>
            <Text style={styles.stackText} numberOfLines={10}>
              {error.stack}
            </Text>
          </View>
        )}
      </View>
    </View>
  )
}

// ── Route Wrapper ───────────────────────────────────────────

/** Wraps a page/screen component with an error boundary */
export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  label?: string
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'

  function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary label={label || displayName}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    )
  }

  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`
  return WithErrorBoundary
}

// ── Styles ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 24,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stackContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    width: '100%',
  },
  stackTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
    marginBottom: 4,
  },
  stackText: {
    fontSize: 10,
    color: '#991b1b',
    fontFamily: 'monospace',
  },
})
