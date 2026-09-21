import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

// Minimal shape for an <img> element, used only inside page.evaluate; the
// project's tsconfig has no "dom" lib, so HTMLImageElement isn't available.
interface LoadableImage {
  complete: boolean;
  addEventListener(type: 'load', listener: () => void, options?: { once?: boolean }): void;
}

export class ProductPage extends BasePage {
  private readonly addToCartLink: Locator;
  private readonly productImage: Locator;

  constructor(page: Page) {
    super(page);
    this.addToCartLink = page.getByRole('link', { name: 'Add to cart' });
    this.productImage = page.getByRole('img', { name: /^Picture of/ }).first();
  }

  async addToCart(): Promise<void> {
    // The add-to-cart request can fire before the product image has finished
    // loading, which has caused it to be dropped; wait for the image to load
    // first so the click lands on a fully rendered page.
    await this.productImage.waitFor({ state: 'visible' });
    await this.productImage.evaluate((img: LoadableImage) => {
      if (img.complete) {
        return undefined;
      }
      return new Promise<void>((resolve) =>
        img.addEventListener('load', () => resolve(), { once: true }),
      );
    });

    // Adding to cart fires an async request; wait for that request to
    // complete before navigating away, otherwise it can be cancelled in-flight.
    await Promise.all([
      this.page.waitForResponse(
        (response) => response.url().includes('/cart/addproduct/') && response.ok(),
      ),
      this.addToCartLink.click(),
    ]);
  }
}
