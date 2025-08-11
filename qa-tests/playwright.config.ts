/**
 * Playwright Configuration for E2E Testing
 * MedCor Healthcare Platform
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './e2e',
  
  // Test match pattern
  testMatch: '**/*.test.ts',
  
  // Timeout for each test
  timeout: 60 * 1000,
  
  // Timeout for each assertion
  expect: {
    timeout: 10 * 1000
  },
  
  // Number of workers
  workers: process.env.CI ? 2 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'junit.xml' }],
    ['list']
  ],
  
  // Shared settings for all projects
  use: {
    // Base URL for testing
    baseURL: process.env.BASE_URL || 'http://localhost:5000',
    
    // Collect trace when retrying failed test
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
    
    // Action timeout
    actionTimeout: 15 * 1000,
    
    // Navigation timeout
    navigationTimeout: 30 * 1000,
    
    // Viewport size
    viewport: { width: 1280, height: 720 },
    
    // Ignore HTTPS errors
    ignoreHTTPSErrors: true,
    
    // Accept downloads
    acceptDownloads: true,
    
    // Locale
    locale: 'en-US',
    
    // Timezone
    timezoneId: 'America/New_York',
    
    // User agent
    userAgent: 'MedCor E2E Test Agent',
    
    // Extra HTTP headers
    extraHTTPHeaders: {
      'X-Test-Suite': 'E2E'
    }
  },
  
  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] }
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] }
    },
    {
      name: 'tablet',
      use: { ...devices['iPad Pro'] }
    }
  ],
  
  // Global setup
  globalSetup: './global-setup.ts',
  
  // Global teardown
  globalTeardown: './global-teardown.ts',
  
  // Output folder for test artifacts
  outputDir: 'test-results',
  
  // Retry failed tests
  retries: process.env.CI ? 2 : 1,
  
  // Parallel execution
  fullyParallel: true,
  
  // Fail on console errors
  use: {
    // Fail test on JavaScript errors in console
    strict: true
  },
  
  // Web server configuration
  webServer: [
    {
      command: 'npm run dev',
      port: 5000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test'
      }
    },
    {
      command: 'cd medcor_backend && python manage.py runserver',
      port: 8000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
      env: {
        DJANGO_SETTINGS_MODULE: 'medcor_backend.settings.test'
      }
    }
  ]
});