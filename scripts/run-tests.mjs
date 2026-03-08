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
  'packages/app/features/hooks/use-toast.ts',
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

const adapters = readFileSync(resolve(root, 'packages/app/features/data/repository/adapters.ts'), 'utf8')
assert.match(adapters, /arenas:\s*{/, 'Adapters should expose arenas repository')
assert.match(adapters, /referees:\s*{/, 'Adapters should expose referees repository')
assert.match(adapters, /appeals:\s*{/, 'Adapters should expose appeals repository')

const uiPrimitives = readFileSync(resolve(root, 'packages/app/features/components/vct-ui.tsx'), 'utf8')
assert.match(uiPrimitives, /role="dialog"/, 'Modal should expose dialog semantics')
assert.match(uiPrimitives, /aria-live="polite"/, 'Toast should expose polite live region')

const entityCollection = readFileSync(resolve(root, 'packages/app/features/data/repository/use-entity-collection.ts'), 'utf8')
assert.match(entityCollection, /const previous = itemsRef\.current/, 'Entity collection should snapshot previous state before persist')
assert.match(entityCollection, /setItems\(previous\)/, 'Entity collection should rollback state if persist fails')

console.log('Smoke tests passed')
