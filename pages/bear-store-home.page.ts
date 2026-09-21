import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class BearStoreHomePage extends BasePage {
  private readonly searchInput: Locator;
  private readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('textbox', { name: 'What are you looking for?' });
    this.noResultsMessage = page.getByText('Your search did not match any products.');
  }

  async open(): Promise<void> {
    await this.goto('https://bearstore-testsite.smartbear.com/');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await Promise.all([
      this.page.waitForURL(/\/search\?q=/, { waitUntil: 'commit' }),
      this.searchInput.press('Enter'),
    ]);
  }

  noResultsMessageLocator(): Locator {
    return this.noResultsMessage;
  }
}
