import { test, expect } from '../../fixtures/auth.fixture';
import { BearStoreHomePage } from '../../pages/bear-store-home.page';
import { ProductPage } from '../../pages/product.page';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';

test.use({ trace: 'off', video: 'off' });

test('shows a validation error when First name is left blank', async ({ authenticatedPage }) => {
  test.setTimeout(60_000);
  const homePage = new BearStoreHomePage(authenticatedPage);
  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);
  const checkoutPage = new CheckoutPage(authenticatedPage);

  await homePage.open();
  await homePage.search('Epic Sub Zero Driver');
  await homePage.openSearchResult('GBB Epic Sub Zero Driver');
  await productPage.addToCart();

  await cartPage.open();
  await cartPage.checkout();

  await checkoutPage.fillBillingAddressWithoutFirstName({
    lastName: 'Explorer',
    address1: '1 Test Street',
    city: 'Testville',
    zipCode: '12345',
    country: 'United States',
  });

  await expect(checkoutPage.requiredFieldErrorLocator('First name')).toBeVisible();
});
