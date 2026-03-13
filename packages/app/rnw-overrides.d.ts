// override react-native types with react-native-web types
import 'react-native'

// Re-export React DOM JSX types into the global JSX namespace.
// @types/react@19 no longer populates the global JSX namespace (using react-jsx transform instead),
// but importing react-native creates a global JSX namespace with only RN components.
// This merges the DOM intrinsic elements back so HTML elements (div, span, table, etc.) work.
import type { JSX as ReactJSX } from 'react'

declare global {
  namespace JSX {
    interface IntrinsicElements extends ReactJSX.IntrinsicElements {}
  }
}

declare module 'react-native' {
  interface PressableStateCallbackType {
    hovered?: boolean
    focused?: boolean
  }
  interface ViewStyle {
    transitionProperty?: string
    transitionDuration?: string
  }
  interface TextProps {
    accessibilityComponentType?: never
    accessibilityTraits?: never
    href?: string
    hrefAttrs?: {
      rel: 'noreferrer'
      target?: '_blank'
    }
  }
  interface ViewProps {
    accessibilityRole?: string
    href?: string
    hrefAttrs?: {
      rel: 'noreferrer'
      target?: '_blank'
    }
    onClick?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void
  }
}
