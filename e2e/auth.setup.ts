import { test as setup, expect } from '@playwright/test'

const ADMIN_AUTH_FILE = 'e2e/.auth/admin.json'
const CREATOR_AUTH_FILE = 'e2e/.auth/creator.json'

/**
 * Authentication Setup
 *
 * This setup runs before all tests to authenticate users
 * and save their session state for reuse.
 */

// Admin authentication
setup('authenticate as admin', async ({ page }) => {
  // Navigate to admin login
  await page.goto('/login')

  // Wait for the login form to be visible
  await expect(page.locator('form')).toBeVisible()

  // Fill in credentials (using test credentials)
  await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@yeoskin.com')
  await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'testpassword123')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await page.waitForURL('/', { timeout: 10000 })

  // Verify we're logged in
  await expect(page.locator('[data-testid="user-menu"], [data-testid="sidebar"]')).toBeVisible({ timeout: 5000 })

  // Save authentication state
  await page.context().storageState({ path: ADMIN_AUTH_FILE })
})

// Creator authentication
setup('authenticate as creator', async ({ page }) => {
  // Navigate to creator login
  await page.goto('/c/creator/login')

  // Wait for the login form to be visible
  await expect(page.locator('form')).toBeVisible()

  // Fill in credentials (using test credentials)
  await page.fill('input[type="email"]', process.env.TEST_CREATOR_EMAIL || 'creator@test.com')
  await page.fill('input[type="password"]', process.env.TEST_CREATOR_PASSWORD || 'testpassword123')

  // Submit the form
  await page.click('button[type="submit"]')

  // Wait for redirect to creator dashboard
  await page.waitForURL('/c/creator', { timeout: 10000 })

  // Verify we're logged in
  await expect(page.locator('[data-testid="creator-dashboard"], h1')).toBeVisible({ timeout: 5000 })

  // Save authentication state
  await page.context().storageState({ path: CREATOR_AUTH_FILE })
})
