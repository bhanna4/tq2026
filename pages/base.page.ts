import type { Page } from '@playwright/test';

export class BasePage {
  protected readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string): Promise<void> {
    // waitUntil: 'load' has been observed to hang on Firefox against the
    // live BearStore site (some slow-completing background resource seems
    // to prevent the load event from firing even after the DOM is ready);
    // domcontentloaded is enough to know the page is interactable.
    await this.page.goto(url, { waitUntil: 'domcontentloaded' });
  }
}
