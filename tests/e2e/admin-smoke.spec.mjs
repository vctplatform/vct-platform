import { expect, test } from '@playwright/test'

/**
 * Admin Module — E2E Smoke Tests
 * Navigates to each admin page and verifies it renders without crashing.
 * Uses loginAsAdmin helper from the existing E2E pattern.
 */

const loginAsAdmin = async (page) => {
  await page.goto('/login')
  await page.getByLabel('Tài khoản').fill('admin')
  await page.locator('#login-password').fill('Admin@123')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

// All admin routes discovered from apps/next/app/admin/**
const ADMIN_ROUTES = [
  { path: '/admin',               name: 'Dashboard' },
  { path: '/admin/clubs',         name: 'Câu lạc bộ' },
  { path: '/admin/federation',    name: 'Liên đoàn' },
  { path: '/admin/people',        name: 'Nhân sự' },
  { path: '/admin/finance',       name: 'Tài chính' },
  { path: '/admin/tournaments',   name: 'Giải đấu' },
  { path: '/admin/tenants',       name: 'Tổ chức' },
  { path: '/admin/support',       name: 'Hỗ trợ' },
  { path: '/admin/users',         name: 'Người dùng' },
  { path: '/admin/roles',         name: 'Vai trò' },
  { path: '/admin/feature-flags', name: 'Feature Flags' },
  { path: '/admin/system',        name: 'Hệ thống' },
  { path: '/admin/subscriptions', name: 'Gói dịch vụ' },
  { path: '/admin/rankings',      name: 'Xếp hạng' },
  { path: '/admin/scoring',       name: 'Chấm điểm' },
  { path: '/admin/reference-data',name: 'Dữ liệu tham chiếu' },
  { path: '/admin/audit-logs',    name: 'Nhật ký' },
  { path: '/admin/notifications', name: 'Thông báo' },
  { path: '/admin/documents',     name: 'Tài liệu' },
  { path: '/admin/data-quality',  name: 'Chất lượng dữ liệu' },
  { path: '/admin/integrity',     name: 'Toàn vẹn' },
]

test.describe('Admin Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  for (const route of ADMIN_ROUTES) {
    test(`${route.name} (${route.path}) renders without error`, async ({ page }) => {
      await page.goto(route.path)

      // Verify page loaded — no unhandled error overlay
      await expect(page.locator('body')).toBeVisible()

      // Should NOT show Next.js error overlay
      const errorOverlay = page.locator('#nextjs__container_errors_label')
      await expect(errorOverlay).toHaveCount(0)

      // Should NOT show our AdminErrorBoundary error state
      const adminError = page.getByText('Đã xảy ra lỗi')
      // Using count check instead of toBeHidden to avoid strict mode issues
      const errorCount = await adminError.count()
      expect(errorCount).toBe(0)

      // Should show some meaningful content (not blank page)
      const bodyText = await page.locator('body').innerText()
      expect(bodyText.length).toBeGreaterThan(10)
    })
  }

  test('Dashboard has navigation cards to other admin pages', async ({ page }) => {
    await page.goto('/admin')
    // Dashboard should have clickable nav links/cards
    const links = page.locator('a[href*="/admin/"]')
    const count = await links.count()
    expect(count).toBeGreaterThanOrEqual(5)
  })

  test('Admin pages show AdminPageShell header', async ({ page }) => {
    // Verify a sample page has the shell structure
    await page.goto('/admin/clubs')
    // Should have a title heading
    const heading = page.locator('h1, h2').first()
    await expect(heading).toBeVisible()
    // Should have stat cards (AdminPageShell stats)
    const main = page.locator('main, [role="main"], .admin-page-shell').first()
    await expect(main).toBeVisible()
  })
})
