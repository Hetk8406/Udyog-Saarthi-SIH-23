import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright E2E Configuration for Udyog Saarthi
 * Isolated against test_e2e.sqlite3 database running on ports 8001 (API) and 3001 (Web).
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45 * 1000,
  expect: {
    timeout: 10 * 1000,
  },
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: path.resolve(__dirname, 'e2e/global-setup.ts'),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 },
      },
      testIgnore: /.*mobile\.spec\.ts/,
    },
    {
      name: 'mobile-chrome',
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
        hasTouch: true,
      },
      testMatch: /.*mobile\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'node scripts/run-python.js backend/manage.py runserver 8001 --noreload',
      url: 'http://localhost:8001/api/health/',
      reuseExistingServer: false,
      env: {
        USE_SQLITE: 'True',
        SQLITE_DB_NAME: 'test_e2e.sqlite3',
        DEBUG: 'True',
        TESTING: 'True',
        ALLOWED_HOSTS: 'localhost,127.0.0.1',
        COOKIE_SECURE: 'False',
        COOKIE_SAMESITE: 'Lax',
        CORS_ALLOW_ALL_ORIGINS: 'False',
        CORS_ALLOWED_ORIGINS: 'http://localhost:3001,http://127.0.0.1:3001',
        CSRF_TRUSTED_ORIGINS: 'http://localhost:3001,http://127.0.0.1:3001',
        FRONTEND_BASE_URL: 'http://localhost:3001',
      },
      timeout: 120 * 1000,
    },
    {
      command: 'npm --prefix frontend run dev -- -p 3001',
      url: 'http://localhost:3001',
      reuseExistingServer: false,
      env: {
        NEXT_PUBLIC_API_URL: 'http://localhost:8001/api',
        PORT: '3001',
      },
      timeout: 120 * 1000,
    },
  ],
});
