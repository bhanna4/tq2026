import { test, expect } from '../../fixtures/auth.fixture';
import { BearStoreHomePage } from '../../pages/bear-store-home.page';
import { ProductPage } from '../../pages/product.page';
import { CartPage } from '../../pages/cart.page';

test.use({ trace: 'off', video: 'off' });

test('Adding a single item shows it in the cart', async ({ authenticatedPage }) => {
  const homePage = new BearStoreHomePage(authenticatedPage);
  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);

  await homePage.open();
  await homePage.search('Epic Sub Zero Driver');
  await homePage.openSearchResult('GBB Epic Sub Zero Driver');
  await productPage.addToCart();

  await cartPage.open();

  const quantity = await cartPage.rowQuantity('GBB Epic Sub Zero Driver');
  expect(quantity).toBe(1);

  const unitPrice = await cartPage.rowUnitPrice('GBB Epic Sub Zero Driver');
  const rowTotal = await cartPage.rowTotal('GBB Epic Sub Zero Driver');
  expect(rowTotal).toBeCloseTo(unitPrice, 2);
});
