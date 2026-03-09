import { expect, test } from '@playwright/test'

const cases = [
  { name: 'mobile', viewport: { width: 390, height: 844 }, expectsMenuButton: true },
  { name: 'tablet', viewport: { width: 900, height: 1200 }, expectsMenuButton: true },
  { name: 'desktop', viewport: { width: 1366, height: 900 }, expectsMenuButton: false },
]

const loginAsAdmin = async (page) => {
  await page.goto('/login')
  await page.getByRole('button', { name: 'Vào hệ thống điều hành' }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

for (const scenario of cases) {
  test(`AppShell responsive on ${scenario.name}`, async ({ page }) => {
    await page.setViewportSize(scenario.viewport)
    await loginAsAdmin(page)

    await expect(page.getByRole('banner')).toBeVisible()

    const menuButton = page.getByRole('button', { name: 'Mở menu điều hướng' })
    if (scenario.expectsMenuButton) {
      await expect(menuButton).toBeVisible()
    } else {
      await expect(menuButton).toHaveCount(0)
      await expect(
        page
          .getByLabel('Điều hướng chính')
          .getByRole('heading', { name: 'Trung tâm điều hành' })
      ).toBeVisible()
    }
  })
}
