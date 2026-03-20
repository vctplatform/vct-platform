import { readFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'

const root = process.cwd()
const smokeOnly = process.argv.includes('--smoke-only')

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
  'packages/app/features/auth/entity-authz.generated.ts',
  'packages/app/features/auth/auth-client.ts',
  'packages/app/features/hooks/use-route-action-guard.ts',
  'packages/app/features/hooks/use-toast.ts',
  'packages/app/features/layout/entity-action-matrix.ts',
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
  'backend/internal/authz/policy.go',
  'backend/internal/authz/policy.contract.json',
  'backend/internal/auth/service.go',
  'backend/internal/store/store.go',
  'backend/go.mod',
]

requiredFiles.forEach((file) => {
  assert.ok(existsSync(resolve(root, file)), `Missing file: ${file}`)
})

const hadCheckArg = process.argv.includes('--check')
if (!hadCheckArg) {
  process.argv.push('--check')
}
await import(pathToFileURL(resolve(root, 'scripts/generate-authz-contract.mjs')).href)
if (!hadCheckArg) {
  process.argv.pop()
}

const routeRegistry = readFileSync(resolve(root, 'packages/app/features/layout/route-registry.ts'), 'utf8')
const routesFile = readFileSync(resolve(root, 'packages/app/features/layout/routes.ts'), 'utf8')
const routeTypes = readFileSync(resolve(root, 'packages/app/features/layout/route-types.ts'), 'utf8')
assert.match(routesFile, /hop-chuyen-mon/, 'Routes definition must include hop-chuyen-mon path')
assert.match(routeRegistry, /getPageTitle/, 'Route registry must expose getPageTitle')
assert.match(routeTypes, /roles\?:/, 'Route types should support RBAC roles metadata')
assert.match(routeRegistry, /isRouteAccessible/, 'Route registry should expose access guard helper')

const appShell = readFileSync(resolve(root, 'packages/app/features/layout/AppShell.tsx'), 'utf8')
assert.match(appShell, /aria-label=\{t\('shell\.openMobileNav'\)\}|aria-label="Mở menu điều hướng"/, 'AppShell should provide accessible mobile menu label')
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
assert.match(adapters, /const createRepositoryBundle = <T extends \{ id: string \}>/, 'Adapters should define repository bundle helper')
assert.match(adapters, /arenas:\s*createRepositoryBundle<SanDau>\(/, 'Adapters should expose arenas repository bundle')
assert.match(adapters, /referees:\s*createRepositoryBundle<TrongTai>\(/, 'Adapters should expose referees repository bundle')
assert.match(adapters, /appeals:\s*createRepositoryBundle<KhieuNai>\(/, 'Adapters should expose appeals repository bundle')
assert.match(adapters, /weighIns:\s*createRepositoryBundle<CanKy>\(/, 'Adapters should expose weigh-ins repository bundle')
assert.match(adapters, /combatMatches:\s*createRepositoryBundle<TranDauDK>\(/, 'Adapters should expose combat matches repository bundle')
assert.match(adapters, /formPerformances:\s*createRepositoryBundle<LuotThiQuyen>\(/, 'Adapters should expose form performances repository bundle')

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

const actionGuard = readFileSync(resolve(root, 'packages/app/features/hooks/use-route-action-guard.ts'), 'utf8')
assert.match(actionGuard, /requireAction/, 'Route action guard should expose requireAction helper')
assert.match(actionGuard, /canPerformRouteAction/, 'Route action guard should rely on route action matrix')
assert.match(actionGuard, /canPerformEntityRouteAction/, 'Route action guard should enforce backend entity matrix for shared actions')

const entityActionMatrix = readFileSync(resolve(root, 'packages/app/features/layout/entity-action-matrix.ts'), 'utf8')
assert.match(entityActionMatrix, /\/giai-dau/, 'Entity route matrix should map tournament configuration route')
assert.match(entityActionMatrix, /\/noi-dung/, 'Entity route matrix should map content categories route')
assert.match(entityActionMatrix, /\/referee-assignments/, 'Entity route matrix should map referee assignment route')
assert.match(entityActionMatrix, /\/medals/, 'Entity route matrix should map medals route')
assert.match(entityActionMatrix, /\/bracket/, 'Entity route matrix should map bracket route')

const generatedAuthz = readFileSync(resolve(root, 'packages/app/features/auth/entity-authz.generated.ts'), 'utf8')
assert.match(generatedAuthz, /ENTITY_AUTHZ_POLICY/, 'Generated frontend authz contract should expose policy map')
assert.match(generatedAuthz, /EntityAuthzAction/, 'Generated frontend authz contract should expose action type')

const loginPage = readFileSync(resolve(root, 'packages/app/features/auth/Page_login.tsx'), 'utf8')
assert.match(loginPage, /Đăng nhập tài khoản điều hành|t\('loginTitle'\)/, 'Login page should include operations login heading')
assert.match(loginPage, /tournamentCode|username/, 'Login page should support login credentials input')

const nextPackage = readFileSync(resolve(root, 'apps/next/package.json'), 'utf8')
assert.match(nextPackage, /prebuild/, 'Next app should run prebuild gate before build')
assert.match(nextPackage, /generate-authz-contract\.mjs --check/, 'Next app prebuild should enforce authz contract check')

const backendMain = readFileSync(resolve(root, 'backend/cmd/server/main.go'), 'utf8')
assert.match(backendMain, /http\.Server/, 'Backend should run HTTP server')

const backendAPI = readFileSync(resolve(root, 'backend/internal/httpapi/server.go'), 'utf8')
const backendEntityHandler = readFileSync(resolve(root, 'backend/internal/httpapi/entity_handler.go'), 'utf8')
const backendHelpers = readFileSync(resolve(root, 'backend/internal/httpapi/helpers.go'), 'utf8')
assert.match(backendAPI, /\/api\/v1\/auth\/login/, 'Backend should expose auth login endpoint')
assert.match(backendAPI, /handleEntityRoutes/, 'Backend should expose generic entity routes')
assert.match(backendEntityHandler, /authorizeEntityAction/, 'Backend should enforce authorization for entity actions')
assert.match(backendHelpers, /"medals"/, 'Backend entity set should include medals')
assert.match(backendHelpers, /"brackets"/, 'Backend entity set should include brackets')

const backendAuthz = readFileSync(resolve(root, 'backend/internal/authz/policy.go'), 'utf8')
assert.match(backendAuthz, /CanEntityAction/, 'Backend authz should expose entity action policy check')
assert.match(backendAuthz, /ActionCreate/, 'Backend authz should define action vocabulary')

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
assert.match(registrationPage, /useRouteActionGuard\('\/registration'/, 'Registration page should use route action guard')

const athletesPageWithGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_athletes.tsx'), 'utf8')
assert.match(athletesPageWithGuard, /useRouteActionGuard\('\/athletes'/, 'Athletes page should use route action guard')

const schedulePage = readFileSync(resolve(root, 'packages/app/features/tournament/Page_schedule.tsx'), 'utf8')
assert.match(schedulePage, /useRouteActionGuard\('\/schedule'/, 'Schedule page should use route action guard')

const resultsPageAfterGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_results.tsx'), 'utf8')
assert.match(resultsPageAfterGuard, /useRouteActionGuard\('\/results'/, 'Results page should use route action guard')

const medalsPageAfterGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_medals.tsx'), 'utf8')
assert.match(medalsPageAfterGuard, /useRouteActionGuard\('\/medals'/, 'Medals page should use route action guard')

const bracketPageAfterGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_bracket.tsx'), 'utf8')
assert.match(bracketPageAfterGuard, /useRouteActionGuard\('\/bracket'/, 'Bracket page should use route action guard')

const refereeAssignmentsPageAfterGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_referee_assignments.tsx'), 'utf8')
assert.match(refereeAssignmentsPageAfterGuard, /useRouteActionGuard\('\/referee-assignments'/, 'Referee assignments page should use route action guard')

const tournamentPageAfterGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_giai_dau.tsx'), 'utf8')
assert.match(tournamentPageAfterGuard, /useRouteActionGuard\('\/giai-dau'/, 'Tournament config page should use route action guard')

const contentPageAfterGuard = readFileSync(resolve(root, 'packages/app/features/tournament/Page_noi_dung.tsx'), 'utf8')
assert.match(contentPageAfterGuard, /useRouteActionGuard\('\/noi-dung'/, 'Content category page should use route action guard')

console.log('Smoke tests passed')

if (!smokeOnly) {
  const vitestEntrypoint = resolve(root, 'node_modules/vitest/vitest.mjs')
  assert.ok(existsSync(vitestEntrypoint), 'Missing Vitest entrypoint')

  const vitestResult = spawnSync(
    process.execPath,
    [
      vitestEntrypoint,
      'run',
      '--environment',
      'jsdom',
      '--globals',
      'packages/app/features/admin/__tests__',
    ],
    {
      cwd: root,
      stdio: 'inherit',
      env: process.env,
    }
  )

  assert.equal(vitestResult.status, 0, 'Vitest suite failed')
}
