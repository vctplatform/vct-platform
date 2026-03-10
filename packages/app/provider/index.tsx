import type { ReactNode } from 'react'
import { SafeArea } from 'app/provider/safe-area'
import { NavigationProvider } from './navigation'
import { I18nProvider } from '../features/i18n'

export function Provider({ children }: { children: ReactNode }) {
  return (
    <SafeArea>
      <I18nProvider>
        <NavigationProvider>{children}</NavigationProvider>
      </I18nProvider>
    </SafeArea>
  )
}
