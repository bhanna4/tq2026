import { test, expect } from '@playwright/test';
import { RegisterPage } from '../../pages/register.page';
import { generateSeedAccount } from '../../fixtures/seed-account';

test.use({ trace: 'off', video: 'off' });

test('successfully registers a new account', async ({ page }, testInfo) => {
  const registerPage = new RegisterPage(page);
  const account = generateSeedAccount(testInfo.workerIndex);

  await registerPage.open();
  await registerPage.register(account);

  await expect(registerPage.completedMessageLocator()).toBeVisible();
});

test('shows an error when passwords do not match', async ({ page }, testInfo) => {
  const registerPage = new RegisterPage(page);
  const account = generateSeedAccount(testInfo.workerIndex);

  await registerPage.open();
  await registerPage.fillForm(account, `${account.password}-mismatch`);
  await registerPage.submit();

  await expect(registerPage.passwordMismatchErrorLocator()).toBeVisible();
  await expect(registerPage.completedMessageLocator()).toBeHidden();
});
