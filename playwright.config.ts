import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';
import { AUTH_STORAGE_STATE_PATH } from './fixtures/auth-storage';

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Collect trace for every test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on',
    /* Record video for every test. See https://playwright.dev/docs/test-configuration#recording-options */
    video: 'on',
  },

  /* Configure projects for major browsers (UI) and API testing */
  projects: [
    {
      name: 'setup',
      testMatch: '**/setup/**',
    },

    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: AUTH_STORAGE_STATE_PATH },
      testMatch: '**/ui/**',
      dependencies: ['setup'],
    },

    {
      name: 'api',
      use: { baseURL: 'https://gorest.co.in' },
      testMatch: '**/api/**',
    },
  ],
});
