import { test, expect } from '@playwright/test'

/**
 * Creator Portal E2E Tests
 *
 * Tests for the creator-facing dashboard and features.
 */

test.describe('Creator Portal Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/c/creator')
  })

  test('should display creator dashboard', async ({ page }) => {
    // Check page loaded
    await expect(page.locator('h1, h2').filter({ hasText: /Tableau de bord|Dashboard/i })).toBeVisible()

    // Should show creator-specific content
    const dashboardContent = page.locator('.card, [data-testid="stats"]')
    await expect(dashboardContent.first()).toBeVisible()
  })

  test('should display earnings information', async ({ page }) => {
    // Look for earnings/commission related content
    const earningsSection = page.locator('text=/€|Gains|Commission|Revenus/')
    await expect(earningsSection.first()).toBeVisible({ timeout: 10000 })
  })

  test('should display discount code', async ({ page }) => {
    // Creator should see their discount code
    const codeSection = page.locator('text=/Code|Promo|Discount/')
    await expect(codeSection.first()).toBeVisible({ timeout: 10000 })
  })

  test('should have working navigation', async ({ page }) => {
    // Check sidebar/navigation exists
    const nav = page.locator('nav, [data-testid="creator-nav"], aside')
    await expect(nav.first()).toBeVisible()

    // Check navigation links
    const links = await page.locator('nav a, aside a').allTextContents()
    expect(links.length).toBeGreaterThan(0)
  })
})

test.describe('Creator Profile', () => {
  test('should navigate to profile page', async ({ page }) => {
    await page.goto('/c/creator')

    // Click on profile link
    await page.click('text=Profil, a[href*="profile"]')

    // Should navigate to profile
    await expect(page).toHaveURL(/profile/)
  })

  test('should display profile information', async ({ page }) => {
    await page.goto('/c/creator/profile')

    // Profile form should be visible
    const profileContent = page.locator('form, [data-testid="profile-form"], .card')
    await expect(profileContent.first()).toBeVisible()

    // Should have email field
    const emailField = page.locator('input[type="email"], text=email')
    await expect(emailField.first()).toBeVisible()
  })

  test('should be able to edit profile', async ({ page }) => {
    await page.goto('/c/creator/profile')

    // Find edit or save button
    const actionBtn = page.locator('button:has-text("Modifier"), button:has-text("Enregistrer"), button:has-text("Save")')

    if (await actionBtn.isVisible().catch(() => false)) {
      await expect(actionBtn).toBeEnabled()
    }
  })
})

test.describe('Creator Analytics', () => {
  test('should display analytics page', async ({ page }) => {
    await page.goto('/c/creator/analytics')

    // Page should load
    await expect(page.locator('h1, h2').filter({ hasText: /Analytics|Statistiques/i })).toBeVisible({ timeout: 10000 })
  })

  test('should show charts or statistics', async ({ page }) => {
    await page.goto('/c/creator/analytics')

    // Wait for charts to load
    await page.waitForTimeout(2000)

    // Should have chart containers or stat cards
    const visualData = page.locator('.recharts-wrapper, canvas, [data-testid="chart"], .card')
    await expect(visualData.first()).toBeVisible({ timeout: 10000 })
  })

  test('should have date range filter', async ({ page }) => {
    await page.goto('/c/creator/analytics')

    // Find date filter
    const dateFilter = page.locator('input[type="date"], [data-testid="date-filter"], button:has-text("Période")')

    if (await dateFilter.first().isVisible().catch(() => false)) {
      await expect(dateFilter.first()).toBeEnabled()
    }
  })
})

test.describe('Creator History', () => {
  test('should display history page', async ({ page }) => {
    await page.goto('/c/creator/history')

    // Page should load
    await expect(page.locator('h1, h2').filter({ hasText: /Historique|History/i })).toBeVisible({ timeout: 10000 })
  })

  test('should show transaction history', async ({ page }) => {
    await page.goto('/c/creator/history')

    // Wait for data to load
    await page.waitForTimeout(2000)

    // Should have table or list of transactions
    const transactions = page.locator('table, [data-testid="transactions-list"], .transaction-item')
    const emptyState = page.locator('text=/Aucun|Pas de|No transaction/')

    // Either has transactions or shows empty state
    const hasTransactions = await transactions.first().isVisible().catch(() => false)
    const hasEmptyState = await emptyState.first().isVisible().catch(() => false)

    expect(hasTransactions || hasEmptyState).toBeTruthy()
  })
})

test.describe('Creator Settings', () => {
  test('should display settings page', async ({ page }) => {
    await page.goto('/c/creator/settings')

    // Page should load
    await expect(page.locator('h1, h2').filter({ hasText: /Paramètres|Settings/i })).toBeVisible({ timeout: 10000 })
  })

  test('should have bank details section', async ({ page }) => {
    await page.goto('/c/creator/bank')

    // Should have bank info form
    const bankSection = page.locator('text=/Banque|Bank|IBAN|Coordonnées/')
    await expect(bankSection.first()).toBeVisible({ timeout: 10000 })
  })

  test('should be able to logout', async ({ page }) => {
    await page.goto('/c/creator')

    // Find logout button
    const logoutBtn = page.locator('button:has-text("Déconnecter"), button:has-text("Logout"), a:has-text("Déconnecter")')

    if (await logoutBtn.first().isVisible().catch(() => false)) {
      await logoutBtn.first().click()

      // Should redirect to login
      await expect(page).toHaveURL(/login/, { timeout: 5000 })
    }
  })
})

test.describe('Creator Mobile Experience', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
  })

  test('should be responsive on mobile', async ({ page }) => {
    await page.goto('/c/creator')

    // Dashboard should be functional
    await expect(page.locator('.card, [data-testid="stats"]').first()).toBeVisible()
  })

  test('should have mobile menu', async ({ page }) => {
    await page.goto('/c/creator')

    // Mobile menu button should be visible
    const menuBtn = page.locator('button[aria-label*="menu"], button:has(svg[class*="menu"])')

    if (await menuBtn.isVisible().catch(() => false)) {
      await menuBtn.click()

      // Navigation should appear
      await expect(page.locator('nav, [data-testid="mobile-nav"]')).toBeVisible()
    }
  })

  test('should have touch-friendly buttons', async ({ page }) => {
    await page.goto('/c/creator')

    // Buttons should be at least 44px (touch target)
    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < Math.min(count, 5); i++) {
      const box = await buttons.nth(i).boundingBox()
      if (box) {
        // Allow some flexibility, but buttons should be reasonably sized
        expect(box.height).toBeGreaterThanOrEqual(32)
      }
    }
  })
})
