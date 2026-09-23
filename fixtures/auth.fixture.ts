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

const REGISTER_ATTEMPTS = 3;

// Each worker gets its own freshly registered BearStore account, so parallel
// workers never share a cart/session (a shared login caused cross-test races).
export const test = base.extend<AuthFixtures, AuthWorkerFixtures>({
  workerStorageState: [
    async ({ browser }, use, workerInfo) => {
      // The chromium project defaults every context to the
      // shared static account's storageState; override it here so this
      // context starts as a genuine anonymous session, otherwise the
      // registration is submitted while already logged in as that account.
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      const registerPage = new RegisterPage(page);

      let lastError: unknown;
      for (let attempt = 1; attempt <= REGISTER_ATTEMPTS; attempt++) {
        try {
          // A fresh random account each attempt, in case the prior failure
          // was caused by a collision rather than a one-off server error.
          await registerPage.open();
          await registerPage.register(generateSeedAccount(workerInfo.workerIndex));
          lastError = undefined;
          break;
        } catch (error) {
          // BearStore's demo backend intermittently returns a 500 when many
          // workers register concurrently; retrying a fresh registration
          // works around that transient server fault.
          lastError = error;
        }
      }
      if (lastError) {
        // Best-effort cleanup: teardown may have already closed the context
        // (e.g. the outer fixture timeout fired), and that shouldn't mask
        // the real registration failure below.
        await context.close().catch(() => undefined);
        throw lastError;
      }

      const storageState = await context.storageState();
      await context.close();
      await use(storageState);
    },
    // Registration is a real round trip to the live BearStore site (page load,
    // form submit, confirmation), and up to REGISTER_ATTEMPTS of those happen
    // serially on failure; the default 30s test timeout doesn't leave room
    // for that, so this worker-scoped fixture gets its own headroom.
    { scope: 'worker', timeout: 90_000 },
  ],

  authenticatedPage: async ({ browser, workerStorageState }, use) => {
    const context = await browser.newContext({ storageState: workerStorageState });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
