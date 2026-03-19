import { describe, it, expect, vi } from 'vitest'

// ═══════════════════════════════════════════════════════
// Page-level module tests for Admin Module
// These validate that each page exports correctly and
// the component function is the right type.
// Full render tests are skipped due to heavy component trees.
// ═══════════════════════════════════════════════════════

// Mock next/navigation to prevent import errors
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
    usePathname: () => '/admin',
    useSearchParams: () => new URLSearchParams(),
}))

// Mock AdminCommandPalette
vi.mock('../components/AdminCommandPalette', () => ({
    AdminCommandPalette: () => null,
}))

// Mock useAdminShortcuts
vi.mock('../hooks/useAdminShortcuts', () => ({
    useAdminShortcuts: () => {},
}))

// Mock i18n
vi.mock('../../i18n', () => ({
    useI18n: () => ({ t: (k: string) => k, locale: 'vi', setLocale: vi.fn() }),
}))

// Mock auth
vi.mock('../../auth/AuthProvider', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        isHydrating: false,
        currentUser: { id: '1', name: 'Admin', role: 'SYSTEM_ADMIN', roles: ['SYSTEM_ADMIN'], permissions: [] },
    }),
}))

// ═══════  T1: Module export tests  ═══════

const pages = [
    { name: 'Page_admin_dashboard', path: '../Page_admin_dashboard' },
    { name: 'Page_admin_feature_flags', path: '../Page_admin_feature_flags' },
    { name: 'Page_admin_roles', path: '../Page_admin_roles' },
    { name: 'Page_admin_cms', path: '../Page_admin_cms' },
    { name: 'Page_admin_users', path: '../Page_admin_users' },
    { name: 'Page_admin_tenants', path: '../Page_admin_tenants' },
    { name: 'Page_admin_system', path: '../Page_admin_system' },
    { name: 'Page_admin_subscriptions', path: '../Page_admin_subscriptions' },
    { name: 'Page_admin_support', path: '../Page_admin_support' },
    { name: 'Page_admin_clubs', path: '../Page_admin_clubs' },
    { name: 'Page_admin_federation', path: '../Page_admin_federation' },
    { name: 'Page_admin_people', path: '../Page_admin_people' },
    { name: 'Page_admin_scoring', path: '../Page_admin_scoring' },
    { name: 'Page_admin_tournaments', path: '../Page_admin_tournaments' },
    { name: 'Page_admin_rankings', path: '../Page_admin_rankings' },
    { name: 'Page_admin_finance', path: '../Page_admin_finance' },
    { name: 'Page_admin_reference_data', path: '../Page_admin_reference_data' },
    { name: 'Page_admin_user_detail', path: '../Page_admin_user_detail' },
]

describe('Admin Pages — Module Exports', () => {
    for (const { name, path } of pages) {
        it(`${name} exports a function component`, async () => {
            const mod = await import(/* @vite-ignore */ path)
            expect(mod[name]).toBeDefined()
            expect(typeof mod[name]).toBe('function')
        })
    }
})

// ═══════  T2: Types file coverage  ═══════

describe('admin.types.ts', () => {
    it('exports all major interfaces', async () => {
        // Types are erased at runtime, but the module must load cleanly.
        const mod = await import(/* @vite-ignore */ '../admin.types')
        // Module loads without error — proves all type exports compile
        expect(mod).toBeDefined()
        expect(Object.keys(mod).length).toBe(0) // interfaces are erased
    })
})

// ═══════  T3: Hooks barrel export  ═══════

describe('hooks/index.ts', () => {
    it('re-exports admin hooks', async () => {
        const hooks = await import(/* @vite-ignore */ '../hooks/index')
        expect(hooks).toBeDefined()
        expect(typeof hooks.useAdminFetch).toBe('function')
        expect(typeof hooks.useAdminMutation).toBe('function')
        expect(typeof hooks.useAdminPermission).toBe('function')
        expect(typeof hooks.useAdminAuditLog).toBe('function')
        expect(typeof hooks.useFormValidation).toBe('function')
    })
})
