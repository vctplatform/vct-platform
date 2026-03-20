// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Error & Empty State Components
// Reusable UI for error recovery, empty data, and offline states.
// Themed with VCT brand and Vietnamese text.
// ═══════════════════════════════════════════════════════════════

import React, { type ReactNode } from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { useVCTTheme } from './theme-provider'

// ── Error State ──────────────────────────────────────────────

interface ErrorStateProps {
  /** Error title (default: 'Đã có lỗi xảy ra') */
  title?: string
  /** Error description */
  message?: string
  /** Retry button callback */
  onRetry?: () => void
  /** Retry button label (default: 'Thử lại') */
  retryLabel?: string
  /** Custom icon/emoji (default: '❌') */
  icon?: string
  /** Container style override */
  style?: ViewStyle
}

/**
 * Error state with retry button.
 *
 * @example
 * ```tsx
 * {error ? (
 *   <ErrorState
 *     message={error.message}
 *     onRetry={refetch}
 *   />
 * ) : (
 *   <DataView data={data} />
 * )}
 * ```
 */
export function ErrorState({
  title = 'Đã có lỗi xảy ra',
  message,
  onRetry,
  retryLabel = 'Thử lại',
  icon = '❌',
  style,
}: ErrorStateProps) {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      )}
      {onRetry && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Empty State ──────────────────────────────────────────────

interface EmptyStateProps {
  /** Title */
  title: string
  /** Description */
  message?: string
  /** Icon/emoji (default: '📭') */
  icon?: string
  /** Action button label */
  actionLabel?: string
  /** Action button callback */
  onAction?: () => void
  style?: ViewStyle
}

/**
 * Empty data state.
 *
 * @example
 * ```tsx
 * {tournaments.length === 0 ? (
 *   <EmptyState
 *     title="Chưa có giải đấu"
 *     message="Hãy tạo giải đấu đầu tiên!"
 *     icon="🏆"
 *     actionLabel="Tạo giải đấu"
 *     onAction={navigateToCreate}
 *   />
 * ) : (
 *   <TournamentList data={tournaments} />
 * )}
 * ```
 */
export function EmptyState({
  title,
  message,
  icon = '📭',
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message && (
        <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          style={[styles.button, { backgroundColor: theme.colors.primary }]}
          onPress={onAction}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Offline State ────────────────────────────────────────────

interface OfflineStateProps {
  /** Retry callback */
  onRetry?: () => void
  /** Custom message */
  message?: string
  style?: ViewStyle
}

/**
 * No network connection state.
 *
 * @example
 * ```tsx
 * {!isOnline && <OfflineState onRetry={checkConnection} />}
 * ```
 */
export function OfflineState({
  onRetry,
  message = 'Không có kết nối mạng.\nVui lòng kiểm tra WiFi hoặc dữ liệu di động.',
  style,
}: OfflineStateProps) {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>📡</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Mất kết nối
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          style={[styles.buttonOutline, { borderColor: theme.colors.primary }]}
          onPress={onRetry}
          activeOpacity={0.8}
        >
          <Text style={[styles.buttonText, { color: theme.colors.primary }]}>
            Thử lại
          </Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

// ── Loading Failed State ─────────────────────────────────────

interface LoadingFailedProps {
  /** What was being loaded */
  resource?: string
  /** Retry callback */
  onRetry?: () => void
  /** Go back callback */
  onGoBack?: () => void
  style?: ViewStyle
}

/**
 * Screen loading failed with retry + go back options.
 */
export function LoadingFailed({
  resource = 'dữ liệu',
  onRetry,
  onGoBack,
  style,
}: LoadingFailedProps) {
  const { theme } = useVCTTheme()

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={[styles.title, { color: theme.colors.text }]}>
        Không thể tải {resource}
      </Text>
      <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
        Có lỗi xảy ra khi tải {resource}. Vui lòng thử lại.
      </Text>
      <View style={styles.buttonRow}>
        {onGoBack && (
          <TouchableOpacity
            style={[styles.buttonOutline, { borderColor: theme.colors.border }]}
            onPress={onGoBack}
          >
            <Text style={[styles.buttonText, { color: theme.colors.textSecondary }]}>
              Quay lại
            </Text>
          </TouchableOpacity>
        )}
        {onRetry && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: theme.colors.primary }]}
            onPress={onRetry}
          >
            <Text style={[styles.buttonText, { color: theme.colors.textInverse }]}>
              Thử lại
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ── Guard Component ──────────────────────────────────────────

interface DataGuardProps<T> {
  data: T | null | undefined
  loading: boolean
  error: Error | null
  onRetry?: () => void
  emptyTitle?: string
  emptyIcon?: string
  loadingSkeleton?: ReactNode
  children: (data: T) => ReactNode
}

/**
 * All-in-one data guard: loading → error → empty → render.
 *
 * @example
 * ```tsx
 * <DataGuard
 *   data={athletes}
 *   loading={isLoading}
 *   error={error}
 *   onRetry={refetch}
 *   emptyTitle="Chưa có VĐV nào"
 *   loadingSkeleton={<SkeletonList />}
 * >
 *   {(data) => <AthleteList athletes={data} />}
 * </DataGuard>
 * ```
 */
export function DataGuard<T>({
  data,
  loading,
  error,
  onRetry,
  emptyTitle = 'Không có dữ liệu',
  emptyIcon = '📭',
  loadingSkeleton,
  children,
}: DataGuardProps<T>) {
  if (loading && !data) {
    return <>{loadingSkeleton ?? <View style={styles.container}><Text style={styles.icon}>⏳</Text></View>}</>
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={onRetry} />
  }

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return <EmptyState title={emptyTitle} icon={emptyIcon} />
  }

  return <>{children(data)}</>
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonOutline: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 10,
    borderWidth: 1.5,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
})
