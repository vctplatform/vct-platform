import { StylesProvider } from './styles-provider'
import { VCT_AppShell } from 'app/features/layout/AppShell'
import './globals.css'

export const metadata = {
  title: 'VCT PLATFORM',
  description: 'Tournament management system',
}

export default function RootLayout({
  children,
}: {
  children: any
}) {
  return (
    <html lang="en">
      <body>
        <StylesProvider>
          <VCT_AppShell>
            {children}
          </VCT_AppShell>
        </StylesProvider>
      </body>
    </html>
  )
}
