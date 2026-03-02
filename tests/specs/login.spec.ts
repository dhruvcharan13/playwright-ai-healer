import { test, expect } from '@playwright/test'

test.describe('Login', () => {
  test('successful login with valid credentials', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('email-input').fill('test@example.com')
    await page.getByTestId('password-input').fill('password123')

    // Explicitly assert the button by role+name — this locator breaks on v1.1 (button says "Log In")
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByText('Welcome back')).toBeVisible()
  })

  test('shows error with invalid credentials', async ({ page }) => {
    await page.goto('/')

    await page.getByTestId('email-input').fill('wrong@example.com')
    await page.getByTestId('password-input').fill('wrongpassword')

    // Same locator — breaks on v1.1
    await page.getByRole('button', { name: 'Sign In' }).click()

    await expect(page.getByTestId('login-error')).toBeVisible()
  })
})
