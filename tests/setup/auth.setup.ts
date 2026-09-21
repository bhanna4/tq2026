import { test as setup, expect } from '@playwright/test';
import { LoginPage } from '../../pages/login.page';
import { AUTH_STORAGE_STATE_PATH } from '../../fixtures/auth-storage';

setup('authenticate', async ({ page }) => {
  const username = process.env.BEARSTORE_USERNAME;
  const password = process.env.BEARSTORE_PASSWORD;
  if (!username || !password) {
    throw new Error(
      'BEARSTORE_USERNAME and BEARSTORE_PASSWORD must be set to run the auth setup project.',
    );
  }

  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(username, password);

  await expect(loginPage.accountLinkLocator()).toBeVisible();

  await page.context().storageState({ path: AUTH_STORAGE_STATE_PATH });
});
