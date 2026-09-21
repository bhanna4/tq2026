import { test as base } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { RegisterPage } from '../pages/register.page';
import { generateSeedAccount } from './seed-account';

type StorageState = Awaited<ReturnType<BrowserContext['storageState']>>;

interface AuthFixtures {
  authenticatedPage: Page;
}

interface AuthWorkerFixtures {
  workerStorageState: StorageState;
}

// Each worker gets its own freshly registered BearStore account, so parallel
// workers never share a cart/session (a shared login caused cross-test races).
export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  workerStorageState: [
    async ({ browser }, use, workerInfo) => {
      const account = generateSeedAccount(workerInfo.workerIndex);
      // The chromium/firefox/webkit projects default every context to the
      // shared static account's storageState; override it here so this
      // context starts as a genuine anonymous session, otherwise the
      // registration is submitted while already logged in as that account.
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      const registerPage = new RegisterPage(page);
      await registerPage.open();
      await registerPage.register(account);
      const storageState = await context.storageState();
      await context.close();
      await use(storageState);
    },
    { scope: 'worker' },
  ],

  authenticatedPage: async ({ browser, workerStorageState }, use) => {
    const context = await browser.newContext({ storageState: workerStorageState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
