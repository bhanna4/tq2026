import { test, expect } from '@playwright/test';
import { PlaywrightHomePage } from '../pages/playwright-home.page';

test('has title', async ({ page }) => {
  const home = new PlaywrightHomePage(page);
  await home.open();

  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  const home = new PlaywrightHomePage(page);
  await home.open();
  await home.clickGetStarted();

  await expect(home.installationHeadingLocator()).toBeVisible();
});
