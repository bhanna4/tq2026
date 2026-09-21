import { test, expect } from '@playwright/test';
import { BearStoreHomePage } from '../../pages/bear-store-home.page';

test('Search Bear', async ({ page }) => {
  /**
   * @test
   * Search item called Bear from this website: https://bearstore-testsite.smartbear.com/
   * Ensure there is no results
   */
  const homePage = new BearStoreHomePage(page);

  await homePage.open();
  await homePage.search('Bear');

  await expect(homePage.noResultsMessageLocator()).toBeVisible({ timeout: 15000 });
});
