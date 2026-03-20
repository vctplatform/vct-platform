// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — Core UI Components
// Universal heavily-themed input & button components.
// Built to mirror web design tokens with native feel.
// ═══════════════════════════════════════════════════════════════

import React, { forwardRef } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  type TextInputProps,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
} from 'react-native'
import { useVCTTheme } from './theme-provider'
import { haptic } from './haptic-feedback'

// ── VctButton ────────────────────────────────────────────────

export interface VctButtonProps extends TouchableOpacityProps {
  label: string
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export const VctButton = forwardRef<View, VctButtonProps>(
  (
    {
      label,
      variant = 'primary',
      size = 'md',
      isLoading,
      iconLeft,
      iconRight,
      fullWidth = false,
      disabled,
      style,
      onPress,
      ...props
    },
    ref,
  ) => {
    const { theme } = useVCTTheme()

    const handlePress = (e: any) => {
      // Light haptic for buttons
      haptic('selection')
      onPress?.(e)
    }

    // Colors
    let bgColor = theme.colors.primary
    let labelColor = theme.colors.surface
    let borderColor = 'transparent'

    switch (variant) {
      case 'primary':
        bgColor = theme.colors.primary
        labelColor = '#0F172A' // Dark text on bright cyan
        break
      case 'secondary':
        bgColor = theme.colors.surfaceElevated
        labelColor = theme.colors.text
        break
      case 'outline':
        bgColor = 'transparent'
        borderColor = theme.colors.border
        labelColor = theme.colors.text
        break
      case 'ghost':
        bgColor = 'transparent'
        labelColor = theme.colors.primary
        break
      case 'danger':
        bgColor = theme.colors.error
        labelColor = '#FFFFFF'
        break
    }

    if (disabled) {
      bgColor = variant === 'outline' || variant === 'ghost' ? 'transparent' : theme.colors.surfaceElevated
      borderColor = variant === 'outline' ? theme.colors.borderLight : 'transparent'
      labelColor = theme.colors.textMuted
    }

    // Sizing
    const paddingV = size === 'sm' ? theme.spacing.sm : size === 'lg' ? theme.spacing.lg : theme.spacing.md
    const paddingH = size === 'sm' ? theme.spacing.md : size === 'lg' ? theme.spacing.xl : theme.spacing.lg
    const fontSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

    return (
      <TouchableOpacity
        ref={ref}
        disabled={disabled || isLoading}
        onPress={handlePress}
        activeOpacity={0.7}
        style={[
          styles.buttonBase,
          {
            backgroundColor: bgColor,
            borderColor,
            borderWidth: variant === 'outline' ? 1 : 0,
            paddingVertical: paddingV,
            paddingHorizontal: paddingH,
            borderRadius: theme.radius.md,
            alignSelf: fullWidth ? 'stretch' : 'flex-start',
          },
          style,
        ]}
        {...props}
      >
        {isLoading ? (
          <ActivityIndicator color={labelColor} size="small" />
        ) : (
          <>
            {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
            <Text
              style={[
                styles.buttonText,
                { color: labelColor, fontSize },
                (theme.typography as Record<string, any>)['button'] || (theme.typography as Record<string, any>)['body'],
              ]}
            >
              {label}
            </Text>
            {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
          </>
        )}
      </TouchableOpacity>
    )
  },
)

VctButton.displayName = 'VctButton'

// ── VctTextInput ─────────────────────────────────────────────

export interface VctTextInputProps extends TextInputProps {
  label?: string
  error?: string
  hint?: string
  iconLeft?: React.ReactNode
  iconRight?: React.ReactNode
  containerStyle?: ViewStyle
}

export const VctTextInput = forwardRef<TextInput, VctTextInputProps>(
  (
    {
      label,
      error,
      hint,
      iconLeft,
      iconRight,
      containerStyle,
      style,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const { theme } = useVCTTheme()
    const [isFocused, setIsFocused] = React.useState(false)

    // Dynamic styling
    const borderColor = error
      ? theme.colors.error
      : isFocused
      ? theme.colors.primary
      : theme.colors.border

    const bgColor = isFocused ? theme.colors.surface : theme.colors.surfaceElevated

    return (
      <View style={[styles.inputContainer, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
            {label}
          </Text>
        )}
        
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: bgColor,
              borderColor,
              borderWidth: 1.5,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          {iconLeft && <View style={styles.iconLeft}>{iconLeft}</View>}
          <TextInput
            ref={ref}
            placeholderTextColor={theme.colors.textMuted}
            selectionColor={theme.colors.primary}
            onFocus={(e) => {
              setIsFocused(true)
              onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              onBlur?.(e)
            }}
            style={[
              styles.input,
              { color: theme.colors.text },
              theme.typography.body as any,
              style,
            ]}
            {...props}
          />
          {iconRight && <View style={styles.iconRight}>{iconRight}</View>}
        </View>

        {error ? (
          <Text style={[styles.helperText, { color: theme.colors.error }]}>
            {error}
          </Text>
        ) : hint ? (
          <Text style={[styles.helperText, { color: theme.colors.textMuted }]}>
            {hint}
          </Text>
        ) : null}
      </View>
    )
  },
)

VctTextInput.displayName = 'VctTextInput'

// ── VctCard ──────────────────────────────────────────────────

export interface VctCardProps {
  children: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
  elevated?: boolean
}

export function VctCard({ children, style, onPress, elevated = true }: VctCardProps) {
  const { theme } = useVCTTheme()
  const BaseView = onPress ? TouchableOpacity : View
  const pressProps = onPress ? { onPress, activeOpacity: 0.8 } : {}

  return (
    <BaseView
      {...pressProps}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderColor: theme.colors.border,
          borderWidth: elevated ? 0 : 1,
        },
        elevated ? theme.shadows.sm : null,
        style,
      ]}
    >
      {children}
    </BaseView>
  )
}

// ── VctBadge ─────────────────────────────────────────────────

export interface VctBadgeProps {
  label: string
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  style?: ViewStyle
  textStyle?: TextStyle
}

export function VctBadge({
  label,
  variant = 'neutral',
  style,
  textStyle,
}: VctBadgeProps) {
  const { theme, isDark } = useVCTTheme()

  let bgColor = theme.colors.surfaceElevated
  let textColor = theme.colors.text

  if (variant === 'primary') {
    bgColor = isDark ? 'rgba(0, 229, 204, 0.2)' : 'rgba(0, 179, 160, 0.1)'
    textColor = theme.colors.primaryDark
  } else if (variant === 'success') {
    bgColor = isDark ? 'rgba(34, 197, 94, 0.2)' : 'rgba(22, 163, 74, 0.1)'
    textColor = theme.colors.success
  } else if (variant === 'warning') {
    bgColor = isDark ? 'rgba(245, 158, 11, 0.2)' : 'rgba(217, 119, 6, 0.1)'
    textColor = theme.colors.warning
  } else if (variant === 'error') {
    bgColor = isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(220, 38, 38, 0.1)'
    textColor = theme.colors.error
  }

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: bgColor, borderRadius: theme.radius.full },
        style,
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: textColor },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  )
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Button
  buttonBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // Input
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingVertical: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 6,
  },
  
  // Card
  card: {
    padding: 16,
    overflow: 'hidden',
  },
  
  // Badge
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Utils
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
})
