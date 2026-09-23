import { test, expect } from '../../fixtures/auth.fixture';
import { BearStoreHomePage } from '../../pages/bear-store-home.page';
import { ProductPage } from '../../pages/product.page';
import { CartPage } from '../../pages/cart.page';
import { CheckoutPage } from '../../pages/checkout.page';

test.use({ trace: 'off', video: 'off' });

test('adds a Ball Chair in white and blue and completes checkout', async ({
  authenticatedPage,
}) => {
  // This flow walks five real checkout steps against the live site (search,
  // product, cart, multi-page checkout); the default 30s test timeout doesn't
  // leave enough room for that many page loads.
  test.setTimeout(90_000);

  const homePage = new BearStoreHomePage(authenticatedPage);
  const productPage = new ProductPage(authenticatedPage);
  const cartPage = new CartPage(authenticatedPage);
  const checkoutPage = new CheckoutPage(authenticatedPage);

  await homePage.open();
  await homePage.search('Ball Chair');
  await homePage.openSearchResult('Ball Chair');

  await productPage.selectVariant('Color', 'White');
  await productPage.selectVariant('Leather color', 'Blue');
  await productPage.addToCart();

  await cartPage.open();
  await cartPage.checkout();

  await checkoutPage.fillBillingAddress({
    firstName: 'TQ',
    lastName: 'Explorer',
    address1: '1 Test Street',
    city: 'Testville',
    zipCode: '12345',
    country: 'United States',
    phoneNumber: '5555555555',
  });
  await checkoutPage.useBillingAddressForShipping();
  await checkoutPage.continueWithSelectedShippingMethod();
  await checkoutPage.continueWithSelectedPaymentMethod();
  await checkoutPage.acceptTermsAndConfirmOrder();

  await expect(checkoutPage.orderReceivedHeadingLocator()).toBeVisible();
});
