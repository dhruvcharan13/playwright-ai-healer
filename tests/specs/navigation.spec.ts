import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Navigation', () => {
  test('can navigate between Dashboard and Settings', async ({ page }) => {
    await login(page)

    // Navigate to Settings
    await page.getByRole('button', { name: 'Settings' }).click()
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

    // Navigate back to Dashboard
    await page.getByRole('button', { name: 'Dashboard' }).click()
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
  })
})
