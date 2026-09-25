import { defineConfig, devices } from '@playwright/test';
import 'dotenv/config';

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
    // 'on' previously captured a trace for every test, including passing
    // ones - for the api project, that trace embeds the literal
    // Authorization: Bearer <GOREST_TOKEN> header from every request, and
    // CI uploads playwright-report/ (which includes traces) as a 30-day
    // build artifact. retain-on-failure keeps debugging value for the case
    // that matters while eliminating that exposure for passing runs.
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers (UI) and API testing */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/ui/**',
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/ui/**',
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/ui/**',
    },

    {
      name: 'api',
      use: { baseURL: 'https://gorest.co.in' },
      testMatch: '**/api/**',
    },
  ],
});
