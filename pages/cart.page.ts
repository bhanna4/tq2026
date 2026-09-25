import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './base.page';

function parsePrice(text: string): number {
  return Number.parseFloat(text.replace(/[^0-9.]/g, ''));
}

export class CartPage extends BasePage {
  private readonly itemRows: Locator;
  private readonly totalValue: Locator;
  private readonly checkoutButton: Locator;

  constructor(page: Page) {
    super(page);
    // .cart-row is also used by the table header (.cart-head), so scope to
    // .cart-body to only match actual line items.
    this.itemRows = page.locator('.cart-body .cart-row');
    this.totalValue = page.locator('.cart-summary-total .cart-summary-value');
    this.checkoutButton = page.getByRole('button', { name: 'Checkout' });
  }

  async open(): Promise<void> {
    await this.goto('https://bearstore-testsite.smartbear.com/cart');
  }

  async checkout(): Promise<void> {
    // Racing a wait against the click is unreliable if the current page is
    // already in the awaited load state before navigation starts (seen on
    // Firefox for this same pattern elsewhere); click first, then wait.
    await this.checkoutButton.click();
    await this.page.waitForURL(/\/checkout\/billingaddress/, { waitUntil: 'domcontentloaded' });
  }

  async removeAllItems(): Promise<void> {
    const maxRemovals = 20;
    for (let i = 0; i < maxRemovals; i += 1) {
      const countBefore = await this.itemRows.count();
      if (countBefore === 0) {
        break;
      }
      // itemRows.first() is a live locator: once this removal completes, a
      // different row becomes "first". Waiting for that row to detach would
      // hang forever whenever another row remains to take its place, so
      // wait for the total row count to actually decrease instead.
      await this.itemRows.first().getByRole('link', { name: '×' }).click();
      await expect(this.itemRows).toHaveCount(countBefore - 1);
    }
  }

  async removeItem(productName: string): Promise<void> {
    const countBefore = await this.itemRows.count();
    await this.rowLocator(productName).getByRole('link', { name: '×' }).click();
    await expect(this.itemRows).toHaveCount(countBefore - 1);
  }

  async increaseQuantity(productName: string): Promise<void> {
    // The +/- controls are icon-only with no accessible name or label, so a
    // scoped CSS locator is the only option (locator priority: last resort).
    // Clicking "+" fires an immediate AJAX request that updates the row's
    // quantity/subtotal; wait for that response so the row reflects the new
    // state before the caller reads it.
    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes('/shoppingcart/updatecartitem') && response.ok(),
      ),
      this.rowLocator(productName).locator('.bootstrap-touchspin-up').click(),
    ]);
  }

  private rowLocator(productName: string): Locator {
    return this.itemRows.filter({
      has: this.page.getByRole('link', { name: productName, exact: true }),
    });
  }

  async rowUnitPrice(productName: string): Promise<number> {
    const text = await this.rowLocator(productName)
      .locator('.cart-col-price:not(.cart-col-subtotal) .price')
      .innerText();
    return parsePrice(text);
  }

  async rowQuantity(productName: string): Promise<number> {
    const value = await this.rowLocator(productName).locator('.cart-col-qty input').inputValue();
    return Number.parseInt(value, 10);
  }

  async rowTotal(productName: string): Promise<number> {
    const text = await this.rowLocator(productName)
      .locator('.cart-col-subtotal .price')
      .innerText();
    return parsePrice(text);
  }

  async total(): Promise<number> {
    return parsePrice(await this.totalValue.innerText());
  }
}
