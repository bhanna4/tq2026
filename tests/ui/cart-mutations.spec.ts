import { test, expect } from '../../fixtures/auth.fixture';
import { BearStoreHomePage } from '../../pages/bear-store-home.page';
import { ProductPage } from '../../pages/product.page';
import { CartPage } from '../../pages/cart.page';

test.use({ trace: 'off', video: 'off' });

test('removes a single item from a multi-item cart', async ({ authenticatedPage }) => {
  test.setTimeout(60_000);
  const homePage = new BearStoreHomePage(authenticatedPage);
  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);

  await homePage.open();
  await homePage.search('Epic Sub Zero Driver');
  await homePage.openSearchResult('GBB Epic Sub Zero Driver');
  await productPage.addToCart();

  await homePage.open();
  await homePage.search('Ball Chair');
  await homePage.openSearchResult('Ball Chair');
  await productPage.addToCart();

  await cartPage.open();
  await cartPage.removeItem('GBB Epic Sub Zero Driver');

  const remainingTotal = await cartPage.rowTotal('Ball Chair');
  const cartTotal = await cartPage.total();
  expect(cartTotal).toBeCloseTo(remainingTotal, 2);
});

test('updates the row total after increasing quantity', async ({ authenticatedPage }) => {
  const homePage = new BearStoreHomePage(authenticatedPage);
  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);

  await homePage.open();
  await homePage.search('Epic Sub Zero Driver');
  await homePage.openSearchResult('GBB Epic Sub Zero Driver');
  await productPage.addToCart();

  await cartPage.open();
  const unitPrice = await cartPage.rowUnitPrice('GBB Epic Sub Zero Driver');

  await cartPage.increaseQuantity('GBB Epic Sub Zero Driver');

  const quantity = await cartPage.rowQuantity('GBB Epic Sub Zero Driver');
  expect(quantity).toBe(2);

  const rowTotal = await cartPage.rowTotal('GBB Epic Sub Zero Driver');
  expect(rowTotal).toBeCloseTo(unitPrice * 2, 2);
});
