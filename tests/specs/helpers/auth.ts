import type { Page } from '@playwright/test'

/**
 * Shared login helper. Uses a CSS selector for the submit button so this
 * helper remains robust when button text or data-testid changes (e.g., on
 * the v1.1 branch). Only the login spec tests themselves explicitly assert
 * the button's role/text, so they are the ones that will break.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/')
  await page.getByTestId('email-input').fill('test@example.com')
  await page.getByTestId('password-input').fill('password123')
  await page.locator('button[type="submit"]').click()
  await page.waitForSelector('[data-testid="transaction-row"]')
}
