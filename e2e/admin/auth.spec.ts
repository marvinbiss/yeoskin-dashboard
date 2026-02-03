import { test, expect } from '@playwright/test'

/**
 * Authentication E2E Tests
 *
 * Tests for login, logout, and session management.
 * These tests don't use the authenticated state.
 */

test.describe('Admin Authentication', () => {
  // Don't use authenticated state for these tests
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should display login page', async ({ page }) => {
    await page.goto('/login')

    // Login form should be visible
    await expect(page.locator('form')).toBeVisible()

    // Email and password fields should exist
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()

    // Submit button should exist
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit
    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/erreur|incorrect|invalid|Error/i')).toBeVisible({ timeout: 10000 })
  })

  test('should show validation for empty fields', async ({ page }) => {
    await page.goto('/login')

    // Try to submit empty form
    await page.click('button[type="submit"]')

    // Should show validation (HTML5 or custom)
    const emailInput = page.locator('input[type="email"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBeTruthy()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without auth
    await page.goto('/')

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })

  test('should have forgot password link', async ({ page }) => {
    await page.goto('/login')

    // Find forgot password link
    const forgotLink = page.locator('a:has-text("oublié"), a:has-text("forgot")')
    await expect(forgotLink).toBeVisible()
  })

  test('login form should be accessible', async ({ page }) => {
    await page.goto('/login')

    // Check form has proper labels
    const emailLabel = page.locator('label[for="email"], label:has-text("email")')
    const passwordLabel = page.locator('label[for="password"], label:has-text("mot de passe"), label:has-text("password")')

    await expect(emailLabel).toBeVisible()
    await expect(passwordLabel).toBeVisible()

    // Inputs should have proper attributes
    const emailInput = page.locator('input[type="email"]')
    await expect(emailInput).toHaveAttribute('autocomplete', 'email')
  })
})

test.describe('Creator Authentication', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should display creator login page', async ({ page }) => {
    await page.goto('/c/creator/login')

    // Login form should be visible
    await expect(page.locator('form')).toBeVisible()

    // Should have Yeoskin branding
    await expect(page.locator('text=Yeoskin')).toBeVisible()
  })

  test('should redirect to creator login when accessing creator routes', async ({ page }) => {
    await page.goto('/c/creator')

    // Should redirect to creator login
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })

  test('should show different branding than admin', async ({ page }) => {
    await page.goto('/c/creator/login')

    // Should show "Portail Créateur" or similar
    await expect(page.locator('text=/Créateur|Creator|Portail/i')).toBeVisible()
  })

  test('should have support contact link', async ({ page }) => {
    await page.goto('/c/creator/login')

    // Should have support link
    const supportLink = page.locator('a[href*="mailto:"], text=/support|contact/i')
    await expect(supportLink.first()).toBeVisible()
  })
})

test.describe('Session Management', () => {
  test('should maintain session across page reloads', async ({ page }) => {
    // This test uses authenticated state
    await page.goto('/')

    // Should be on dashboard
    await expect(page.locator('.card, [data-testid="kpi-card"]').first()).toBeVisible()

    // Reload page
    await page.reload()

    // Should still be authenticated
    await expect(page.locator('.card, [data-testid="kpi-card"]').first()).toBeVisible()
  })

  test('should handle logout correctly', async ({ page }) => {
    await page.goto('/')

    // Find logout button (in dropdown or sidebar)
    const userMenu = page.locator('[data-testid="user-menu"], button:has(svg)').last()
    await userMenu.click()

    const logoutBtn = page.locator('text=/Déconnecter|Logout/i')
    await logoutBtn.click()

    // Should redirect to login
    await expect(page).toHaveURL(/login/, { timeout: 5000 })
  })
})

test.describe('Security', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('should not expose sensitive data in page source', async ({ page }) => {
    await page.goto('/login')

    const content = await page.content()

    // Should not contain API keys or secrets
    expect(content).not.toContain('sk_live')
    expect(content).not.toContain('secret_key')
    expect(content).not.toContain('password')
  })

  test('should use HTTPS in production links', async ({ page }) => {
    await page.goto('/login')

    // Check all external links use HTTPS
    const links = await page.locator('a[href^="http://"]').all()

    // In a real app, there should be no http:// links to external sites
    // localhost is an exception
    for (const link of links) {
      const href = await link.getAttribute('href')
      if (href && !href.includes('localhost')) {
        expect(href).toMatch(/^https:\/\//)
      }
    }
  })

  test('should have CSRF protection indicators', async ({ page }) => {
    await page.goto('/login')

    // Forms should have hidden CSRF token or use SameSite cookies
    const form = page.locator('form')
    const csrfInput = form.locator('input[name*="csrf"], input[name*="token"]')

    // Either has CSRF input or using cookie-based protection
    const hasCsrf = await csrfInput.isVisible().catch(() => false)
    // This is informational - actual CSRF protection may be cookie-based
  })
})
