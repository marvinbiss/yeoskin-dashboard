import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E Test Configuration
 *
 * Run with: npm run test:e2e
 * Debug: npm run test:e2e:debug
 * UI Mode: npm run test:e2e:ui
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Test file pattern
  testMatch: '**/*.spec.ts',

  // Maximum time per test
  timeout: 30 * 1000,

  // Maximum time for expect assertions
  expect: {
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'reports/playwright' }],
    ['list'],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Shared settings for all projects
  use: {
    // Base URL for navigation
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Viewport
    viewport: { width: 1280, height: 720 },

    // Emulate user preferences
    colorScheme: 'light',

    // Slow down actions (useful for debugging)
    // actionTimeout: 10000,
  },

  // Configure projects for major browsers
  projects: [
    // Setup project - runs authentication
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Mobile viewports
    {
      name: 'mobile-chrome',
      use: {
        ...devices['Pixel 5'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'mobile-safari',
      use: {
        ...devices['iPhone 12'],
        storageState: 'e2e/.auth/admin.json',
      },
      dependencies: ['setup'],
    },

    // Creator portal tests
    {
      name: 'creator-chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/creator.json',
      },
      testMatch: '**/creator/**/*.spec.ts',
      dependencies: ['setup'],
    },
  ],

  // Run local dev server before starting the tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },

  // Output folder for test artifacts
  outputDir: 'test-results/',
})
