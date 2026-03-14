// NavigationContainer is now provided by the Expo App.tsx entry point
// This provider is kept as a pass-through for compatibility
import type { ReactNode } from 'react'

export function NavigationProvider({
  children,
}: {
  children: ReactNode
}) {
  return <>{children}</>
}
