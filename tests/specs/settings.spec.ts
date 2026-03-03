import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()
  })

  test('can toggle dark mode', async ({ page }) => {
    const toggle = page.getByTestId('theme-toggle')
    await expect(toggle).not.toBeChecked()
    await toggle.check()
    await expect(toggle).toBeChecked()
  })

  test('can update display name and save', async ({ page }) => {
    await page.getByLabel('Display Name').fill('New Name')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('status')).toContainText('saved')
  })
})
