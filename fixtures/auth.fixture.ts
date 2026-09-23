import { test as base } from '@playwright/test';
import type { BrowserContext, Page } from '@playwright/test';
import { RegisterPage } from '../pages/register.page';
import { CartPage } from '../pages/cart.page';
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
          // works around that transient server fault. A short backoff before
          // the next attempt gives the shared backend a moment to recover
          // instead of hammering it again immediately under the same load.
          lastError = error;
          if (attempt < REGISTER_ATTEMPTS) {
            await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
          }
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

  authenticatedPage: [
    async ({ browser, workerStorageState }, use) => {
      const context = await browser.newContext({ storageState: workerStorageState });
      const page = await context.newPage();
      await use(page);

      // The worker's account (and its cart) is reused across every test that
      // lands on this worker, including CI retries; without clearing it here,
      // an item left over from a previous test would leak into the next
      // one's cart assertions. Best-effort: a test that already left the
      // browser in a broken state shouldn't fail cleanup and mask the real
      // failure.
      const cartPage = new CartPage(page);
      await cartPage
        .open()
        .then(() => cartPage.removeAllItems())
        .catch(() => undefined);
      await context.close();
    },
    // A dedicated budget for this fixture's teardown, independent of the
    // test body's own timeout (which some tests override down to as little
    // as 30s) — cleanup shouldn't compete with the test for the same clock.
    { timeout: 30_000 },
  ],
});

export { expect } from '@playwright/test';
