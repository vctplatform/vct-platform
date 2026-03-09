import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const root = process.cwd()

const requiredFiles = [
  'packages/app/features/layout/route-registry.ts',
  'packages/app/features/data/repository/adapters.ts',
  'apps/next/app/loading.tsx',
  'apps/next/app/error.tsx',
  'apps/next/app/not-found.tsx',
  'packages/app/features/tournament/Page_san_dau.tsx',
  'packages/app/features/tournament/Page_referees.tsx',
  'packages/app/features/tournament/Page_appeals.tsx',
  'packages/app/features/auth/AuthProvider.tsx',
  'packages/app/features/auth/Page_login.tsx',
  'packages/app/features/auth/auth-client.ts',
  'packages/app/features/hooks/use-toast.ts',
  'packages/app/features/mobile/mobile-routes.ts',
  'packages/app/features/components/vct-ui.legacy.tsx',
  'packages/app/features/components/vct-ui-layout.tsx',
  'packages/app/features/components/vct-ui-form.tsx',
  'packages/app/features/components/vct-ui-data-display.tsx',
  'packages/app/features/components/vct-ui-overlay.tsx',
  'playwright.config.mjs',
  'tests/e2e/appshell.breakpoints.spec.mjs',
  'tests/e2e/core-workflow.spec.mjs',
  'apps/next/app/login/page.tsx',
  'backend/cmd/server/main.go',
  'backend/internal/httpapi/server.go',
  'backend/internal/auth/service.go',
  'backend/internal/store/store.go',
  'backend/go.mod',
]

requiredFiles.forEach((file) => {
  assert.ok(existsSync(resolve(root, file)), `Missing file: ${file}`)
})

const routeRegistry = readFileSync(resolve(root, 'packages/app/features/layout/route-registry.ts'), 'utf8')
assert.match(routeRegistry, /hop-chuyen-mon/, 'Route registry must include hop-chuyen-mon path')
assert.match(routeRegistry, /getPageTitle/, 'Route registry must expose getPageTitle')
assert.match(routeRegistry, /roles\?:/, 'Route registry should support RBAC roles metadata')
assert.match(routeRegistry, /isRouteAccessible/, 'Route registry should expose access guard helper')

const appShell = readFileSync(resolve(root, 'packages/app/features/layout/AppShell.tsx'), 'utf8')
assert.match(appShell, /aria-label="Mở menu điều hướng"/, 'AppShell should provide accessible mobile menu label')
assert.match(appShell, /AuthProvider/, 'AppShell should wire auth provider')
assert.match(appShell, /RoleSwitcher/, 'AppShell should expose role switcher for RBAC simulation')
assert.match(appShell, /AccessDenied/, 'AppShell should render access denied state')
assert.match(appShell, /PUBLIC_ROUTES/, 'AppShell should support public routes (login)')
assert.match(appShell, /router\.replace\(`\/login/, 'AppShell should redirect unauthenticated users to login')

const arenaPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_san_dau.tsx'), 'utf8')
assert.match(arenaPage, /Thêm sàn đấu|Thêm Sàn/, 'Arena page should contain add arena flow')
assert.match(arenaPage, /removeArena/, 'Arena page should contain delete arena flow')
assert.match(
  arenaPage,
  /useEntityCollection\(repositories\.arenas\.mock\)/,
  'Arena page should use repository-backed collection'
)

const refereesPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_referees.tsx'), 'utf8')
assert.match(
  refereesPage,
  /useEntityCollection\(repositories\.referees\.mock\)/,
  'Referees page should use repository-backed collection'
)

const appealsPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_appeals.tsx'), 'utf8')
assert.match(
  appealsPage,
  /useEntityCollection\(repositories\.appeals\.mock\)/,
  'Appeals page should use repository-backed collection'
)

const athletesPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_athletes.tsx'), 'utf8')
assert.match(
  athletesPage,
  /parseCsvRows/,
  'Athletes page should parse CSV input for import flow'
)
assert.match(
  athletesPage,
  /accept="\.csv,\.json"/,
  'Athletes page should accept CSV/JSON import files'
)

const reportsPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_reports.tsx'), 'utf8')
assert.match(
  reportsPage,
  /downloadRowsAsExcel/,
  'Reports page should support Excel export'
)
assert.match(
  reportsPage,
  /openPrintWindow/,
  'Reports page should support print/PDF export'
)

const resultsPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_results.tsx'), 'utf8')
assert.match(
  resultsPage,
  /downloadRowsAsExcel/,
  'Results page should support Excel export'
)
assert.match(
  resultsPage,
  /openPrintWindow/,
  'Results page should support print/PDF export'
)

const adapters = readFileSync(resolve(root, 'packages/app/features/data/repository/adapters.ts'), 'utf8')
assert.match(adapters, /arenas:\s*{/, 'Adapters should expose arenas repository')
assert.match(adapters, /referees:\s*{/, 'Adapters should expose referees repository')
assert.match(adapters, /appeals:\s*{/, 'Adapters should expose appeals repository')
assert.match(adapters, /weighIns:\s*{/, 'Adapters should expose weigh-ins repository')
assert.match(adapters, /combatMatches:\s*{/, 'Adapters should expose combat matches repository')
assert.match(adapters, /formPerformances:\s*{/, 'Adapters should expose form performances repository')

const uiBarrel = readFileSync(resolve(root, 'packages/app/features/components/vct-ui.tsx'), 'utf8')
assert.match(uiBarrel, /vct-ui-layout/, 'vct-ui barrel should export layout domain')
assert.match(uiBarrel, /vct-ui-form/, 'vct-ui barrel should export form domain')
assert.match(uiBarrel, /vct-ui-data-display/, 'vct-ui barrel should export data-display domain')
assert.match(uiBarrel, /vct-ui-overlay/, 'vct-ui barrel should export overlay domain')

const uiLegacy = readFileSync(resolve(root, 'packages/app/features/components/vct-ui.legacy.tsx'), 'utf8')
assert.match(uiLegacy, /role="dialog"/, 'Modal should expose dialog semantics')
assert.match(uiLegacy, /aria-live="polite"/, 'Toast should expose polite live region')

const entityCollection = readFileSync(resolve(root, 'packages/app/features/data/repository/use-entity-collection.ts'), 'utf8')
assert.match(entityCollection, /const previous = itemsRef\.current/, 'Entity collection should snapshot previous state before persist')
assert.match(entityCollection, /setItems\(previous\)/, 'Entity collection should rollback state if persist fails')

const entityRepository = readFileSync(resolve(root, 'packages/app/features/data/repository/entity-repository.ts'), 'utf8')
assert.match(entityRepository, /ApiEndpointMap/, 'Entity repository should expose ApiEndpointMap contract')
assert.match(entityRepository, /ApiAdapterConfig/, 'Entity repository should expose ApiAdapterConfig contract')
assert.match(entityRepository, /const request = async <R>/, 'Api adapter should use shared request helper')

const authProvider = readFileSync(resolve(root, 'packages/app/features/auth/AuthProvider.tsx'), 'utf8')
assert.match(authProvider, /isAuthenticated/, 'Auth provider should expose authentication state')
assert.match(authProvider, /login:\s*async|const login = useCallback/, 'Auth provider should expose login action')
assert.match(authProvider, /logout:\s*async|const logout = useCallback/, 'Auth provider should expose logout action')

const loginPage = readFileSync(resolve(root, 'packages/app/features/auth/Page_login.tsx'), 'utf8')
assert.match(loginPage, /Đăng nhập tài khoản điều hành/, 'Login page should include operations login heading')
assert.match(loginPage, /tournamentCode/, 'Login page should support tournament code input')

const backendMain = readFileSync(resolve(root, 'backend/cmd/server/main.go'), 'utf8')
assert.match(backendMain, /http\.Server/, 'Backend should run HTTP server')

const backendAPI = readFileSync(resolve(root, 'backend/internal/httpapi/server.go'), 'utf8')
assert.match(backendAPI, /\/api\/v1\/auth\/login/, 'Backend should expose auth login endpoint')
assert.match(backendAPI, /handleEntityRoutes/, 'Backend should expose generic entity routes')

const backendAuth = readFileSync(resolve(root, 'backend/internal/auth/service.go'), 'utf8')
assert.match(backendAuth, /Login\(/, 'Backend auth service should implement login')
assert.match(backendAuth, /AuthenticateAccessToken\(/, 'Backend auth service should validate access tokens')
assert.match(backendAuth, /Refresh\(/, 'Backend auth service should implement refresh token rotation')
assert.match(backendAuth, /Revoke\(/, 'Backend auth service should support token revocation')
assert.match(backendAuth, /GetAuditLogs\(/, 'Backend auth service should expose audit logs')

const nativeNavigation = readFileSync(resolve(root, 'packages/app/navigation/native/index.tsx'), 'utf8')
assert.match(nativeNavigation, /AuthProvider/, 'Native navigation should include AuthProvider')
assert.match(nativeNavigation, /GuardedScreen/, 'Native navigation should enforce route guard')

const mobileRoutes = readFileSync(resolve(root, 'packages/app/features/mobile/mobile-routes.ts'), 'utf8')
assert.match(mobileRoutes, /MOBILE_ROUTE_REGISTRY/, 'Mobile routes registry should be defined')
assert.match(mobileRoutes, /canAccessMobileRoute/, 'Mobile routes should expose role guard helper')

const mobileScreens = readFileSync(resolve(root, 'packages/app/features/mobile/tournament-screens.tsx'), 'utf8')
assert.match(
  mobileScreens,
  /useEntityCollection<DonVi>\(repositories\.teams\.mock\)/,
  'Mobile Teams screen should use repository-backed data'
)
assert.match(
  mobileScreens,
  /useEntityCollection<VanDongVien>\(\s*repositories\.athletes\.mock\s*\)/,
  'Mobile Athletes screen should use repository-backed data'
)

const weighInPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_weigh_in.tsx'), 'utf8')
assert.match(weighInPage, /repositories\.weighIns\.mock/, 'Weigh-in page should use weigh-ins repository')

const combatPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_combat.tsx'), 'utf8')
assert.match(combatPage, /repositories\.combatMatches\.mock/, 'Combat page should use combat matches repository')

const formsPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_forms.tsx'), 'utf8')
assert.match(formsPage, /repositories\.formPerformances\.mock/, 'Forms page should use form performances repository')

const registrationPage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_registration.tsx'), 'utf8')
assert.match(registrationPage, /useEntityCollection\(repositories\.athletes\.mock\)/, 'Registration page should use athletes repository')
assert.match(registrationPage, /useEntityCollection\(repositories\.teams\.mock\)/, 'Registration page should use teams repository')

console.log('Smoke tests passed')
