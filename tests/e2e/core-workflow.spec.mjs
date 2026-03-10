import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

const loginAsAdmin = async (page) => {
  await page.goto('/login')
  await page.getByLabel('Tài khoản').fill('admin')
  await page.locator('#login-password').fill('Admin@123')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))
}

test('Core workflow: team -> athlete -> registration -> result', async ({
  page,
}, testInfo) => {
  const stamp = Date.now()
  const teamName = `E2E Team ${stamp}`
  const athleteName = `E2E Athlete ${stamp}`

  await loginAsAdmin(page)

  await page.goto('/teams')
  await page.locator('button:has-text("Thêm đơn vị")').first().click()
  await page
    .getByPlaceholder('VD: CLB Võ cổ truyền Bình Định')
    .fill(teamName)
  await page.getByPlaceholder('VD: BD-001').fill(`E2E-${stamp}`)
  await page.locator('button:has-text("Thêm mới")').first().click()
  await expect(page.getByText(teamName, { exact: true }).first()).toBeVisible()

  const csvPath = testInfo.outputPath(`athletes-${stamp}.csv`)
  writeFileSync(
    csvPath,
    [
      'id,ho_ten,gioi,ngay_sinh,can_nang,chieu_cao,doan_id,doan_ten,nd_quyen,nd_dk,trang_thai,kham_sk,bao_hiem,anh,cmnd',
      `E2E-V-${stamp},${athleteName},nam,2006-03-01,52,170,D01,Bình Định,Q01,HC01,cho_xac_nhan,true,true,true,true`,
    ].join('\n'),
    'utf8'
  )

  await page.goto('/athletes')
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    page.getByRole('button', { name: 'Import CSV/JSON' }).click(),
  ])
  await fileChooser.setFiles(csvPath)
  await expect(page.getByText(athleteName, { exact: true }).first()).toBeVisible()

  await page.goto('/registration')
  await page.getByRole('button', { name: 'Quản lý Thẻ (In-card)' }).click()
  await page.getByText(athleteName).first().click()
  const registrationDialog = page.locator('[role="dialog"]').last()
  await expect(registrationDialog).toBeVisible()
  await registrationDialog.locator('input[type="checkbox"]').first().check()
  await page.getByRole('button', { name: 'Lưu Hồ Sơ Đăng Ký' }).click()
  await expect(page.getByText(athleteName, { exact: true }).first()).toBeVisible()

  await page.goto('/results')
  await expect(
    page.getByRole('heading', { name: 'KẾT QUẢ', exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole('tab', { name: 'Bảng Tổng Sắp Huy Chương' })
  ).toBeVisible()
})
