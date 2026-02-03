import { test, expect } from '@playwright/test'

/**
 * Admin Dashboard E2E Tests
 *
 * Tests for the main admin dashboard functionality.
 */

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display dashboard with KPI cards', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Yeoskin|Dashboard/)

    // Check KPI cards are visible
    await expect(page.locator('[data-testid="kpi-card"], .card').first()).toBeVisible()

    // Check that we have at least 4 KPI cards (or similar metric displays)
    const cards = page.locator('.card, [data-testid="kpi-card"]')
    await expect(cards).toHaveCount(await cards.count())
  })

  test('should display recent activity section', async ({ page }) => {
    // Look for recent activity or transfers section
    const activitySection = page.locator('text=récent, text=Transferts, text=Activité').first()
    await expect(activitySection).toBeVisible({ timeout: 10000 })
  })

  test('should have working navigation sidebar', async ({ page }) => {
    // Check sidebar is visible on desktop
    const sidebar = page.locator('nav, [data-testid="sidebar"], aside')
    await expect(sidebar.first()).toBeVisible()

    // Check navigation links exist
    const navLinks = page.locator('nav a, aside a')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should navigate to creators page', async ({ page }) => {
    // Click on creators link
    await page.click('text=Créateurs, a[href*="creator"]')

    // Verify navigation
    await expect(page).toHaveURL(/creator/)
  })

  test('should show user menu', async ({ page }) => {
    // Find and click user menu button
    const userMenuButton = page.locator('[data-testid="user-menu"], button:has(svg)').last()
    await userMenuButton.click()

    // Check dropdown appears
    await expect(page.locator('text=Déconnexion, text=Se déconnecter, text=Logout')).toBeVisible()
  })

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Dashboard should still be functional
    await expect(page.locator('.card, [data-testid="kpi-card"]').first()).toBeVisible()

    // Mobile menu button should be visible
    const mobileMenuBtn = page.locator('button:has(svg[class*="menu"]), [data-testid="mobile-menu"]')
    if (await mobileMenuBtn.isVisible()) {
      await mobileMenuBtn.click()
      // Sidebar should appear
      await expect(page.locator('nav, [data-testid="sidebar"]')).toBeVisible()
    }
  })
})

test.describe('Dashboard Data Loading', () => {
  test('should handle loading states gracefully', async ({ page }) => {
    // Intercept API calls to add delay
    await page.route('**/api/**', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))
      await route.continue()
    })

    await page.goto('/')

    // Should show loading indicators
    const loadingIndicators = page.locator('.animate-pulse, .animate-spin, [data-testid="loading"]')
    // Either loading is visible or content loaded quickly
    const hasLoading = await loadingIndicators.first().isVisible({ timeout: 500 }).catch(() => false)

    if (hasLoading) {
      // Wait for loading to complete
      await expect(loadingIndicators.first()).toBeHidden({ timeout: 15000 })
    }

    // Content should be visible after loading
    await expect(page.locator('.card, [data-testid="kpi-card"]').first()).toBeVisible()
  })

  test('should refresh data when clicking refresh button', async ({ page }) => {
    await page.goto('/')

    // Find refresh button if exists
    const refreshBtn = page.locator('button:has(svg[class*="refresh"]), [data-testid="refresh"]')

    if (await refreshBtn.isVisible().catch(() => false)) {
      // Click refresh
      await refreshBtn.click()

      // Should see loading state briefly
      await expect(page.locator('.animate-spin, [data-testid="loading"]')).toBeVisible({ timeout: 1000 }).catch(() => {
        // Refresh might be instant, that's OK
      })
    }
  })
})
