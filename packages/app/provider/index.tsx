import type { ReactNode } from 'react'
import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <SafeArea>
      <NavigationProvider>{children}</NavigationProvider>
    </SafeArea>
  )
}
