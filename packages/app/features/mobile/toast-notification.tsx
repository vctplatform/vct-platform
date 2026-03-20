// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Toast Notification System
// In-app toast/snackbar with queue, auto-dismiss, and theming.
// ═══════════════════════════════════════════════════════════════

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react'
import {
  Animated,
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { useVCTTheme, type VCTTheme } from './theme-provider'
import { haptic } from './haptic-feedback'

// ── Types ────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface ToastOptions {
  /** Toast message */
  message: string
  /** Visual type (default: 'info') */
  type?: ToastType
  /** Auto-dismiss duration in ms (default: 3000, 0 = sticky) */
  duration?: number
  /** Action button label */
  actionLabel?: string
  /** Action button callback */
  onAction?: () => void
  /** Haptic feedback (default: true for error/warning) */
  hapticFeedback?: boolean
}

interface ToastItem extends Required<Pick<ToastOptions, 'message' | 'type' | 'duration'>> {
  id: number
  actionLabel?: string
  onAction?: () => void
  anim: Animated.Value
}

// ── Context ──────────────────────────────────────────────────

interface ToastContextValue {
  show: (options: ToastOptions) => void
  success: (message: string) => void
  error: (message: string) => void
  warning: (message: string) => void
  info: (message: string) => void
  dismiss: (id: number) => void
  dismissAll: () => void
}

const ToastContext = createContext<ToastContextValue>({
  show: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
  dismiss: () => {},
  dismissAll: () => {},
})

// ── Provider ─────────────────────────────────────────────────

let nextId = 1

/**
 * Toast notification provider. Wrap near app root.
 *
 * @example
 * ```tsx
 * <VCTThemeProvider>
 *   <ToastProvider>
 *     <App />
 *   </ToastProvider>
 * </VCTThemeProvider>
 * ```
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const { theme } = useVCTTheme()
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id)
      if (toast) {
        Animated.timing(toast.anim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setToasts((p) => p.filter((t) => t.id !== id))
        })
      }
      return prev
    })
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const dismissAll = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  const show = useCallback(
    (options: ToastOptions) => {
      const id = nextId++
      const type = options.type ?? 'info'
      const duration = options.duration ?? 3000
      const anim = new Animated.Value(0)

      const item: ToastItem = {
        id,
        message: options.message,
        type,
        duration,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
        anim,
      }

      // Haptic
      if (options.hapticFeedback !== false) {
        if (type === 'error') haptic('error')
        else if (type === 'warning') haptic('warning')
        else if (type === 'success') haptic('success')
      }

      setToasts((prev) => [...prev.slice(-3), item]) // Max 4 visible

      // Animate in
      Animated.spring(anim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start()

      // Auto-dismiss
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timersRef.current.set(id, timer)
      }
    },
    [dismiss],
  )

  const success = useCallback((message: string) => show({ message, type: 'success' }), [show])
  const error = useCallback((message: string) => show({ message, type: 'error', duration: 5000 }), [show])
  const warning = useCallback((message: string) => show({ message, type: 'warning' }), [show])
  const info = useCallback((message: string) => show({ message, type: 'info' }), [show])

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <View style={styles.container} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastView key={toast.id} toast={toast} theme={theme} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  )
}

// ── Toast View ───────────────────────────────────────────────

function ToastView({
  toast,
  theme,
  onDismiss,
}: {
  toast: ToastItem
  theme: VCTTheme
  onDismiss: (id: number) => void
}) {
  const bgColor = {
    success: theme.colors.success,
    error: theme.colors.error,
    warning: theme.colors.warning,
    info: theme.colors.info,
  }[toast.type]

  const icon = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' }[toast.type]

  const translateY = toast.anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-60, 0],
  })

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: bgColor,
          opacity: toast.anim,
          transform: [{ translateY }],
        },
      ]}
    >
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message} numberOfLines={2}>
        {toast.message}
      </Text>
      {toast.actionLabel && (
        <TouchableOpacity
          onPress={() => {
            toast.onAction?.()
            onDismiss(toast.id)
          }}
          style={styles.action}
        >
          <Text style={styles.actionText}>{toast.actionLabel}</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity onPress={() => onDismiss(toast.id)} style={styles.close}>
        <Text style={styles.closeText}>✕</Text>
      </TouchableOpacity>
    </Animated.View>
  )
}

// ── Hook ─────────────────────────────────────────────────────

/**
 * Hook to show toast notifications.
 *
 * @example
 * ```tsx
 * function SaveButton() {
 *   const toast = useToast()
 *   return (
 *     <Button onPress={async () => {
 *       try {
 *         await save()
 *         toast.success('Đã lưu thành công!')
 *       } catch {
 *         toast.error('Lưu thất bại!')
 *       }
 *     }} />
 *   )
 * }
 * ```
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext)
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  icon: {
    fontSize: 16,
    marginRight: 10,
  },
  message: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  action: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  close: {
    marginLeft: 8,
    padding: 4,
  },
  closeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
})
