import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('displays welcome heading after login', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible()
  })

  test('renders transaction table with 5 rows', async ({ page }) => {
    await expect(page.getByTestId('transaction-row')).toHaveCount(5)
  })

  test('shows correct total amount', async ({ page }) => {
    await expect(page.getByTestId('transaction-total')).toContainText('$1,250.00')
  })
})
