import type { Locator, Page } from '@playwright/test';
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
    await Promise.all([
      this.page.waitForURL(/\/checkout\/billingaddress/, { waitUntil: 'load' }),
      this.checkoutButton.click(),
    ]);
  }

  async removeAllItems(): Promise<void> {
    const maxRemovals = 20;
    for (let i = 0; i < maxRemovals; i += 1) {
      const row = this.itemRows.first();
      if ((await row.count()) === 0) {
        break;
      }
      await row.getByRole('link', { name: '×' }).click();
      await row.waitFor({ state: 'detached' });
    }
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
