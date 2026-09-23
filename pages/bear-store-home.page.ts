import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class BearStoreHomePage extends BasePage {
  private readonly searchInput: Locator;
  private readonly noResultsMessage: Locator;
  private readonly searchResultsHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByRole('textbox', { name: 'What are you looking for?' });
    this.noResultsMessage = page.getByText('Your search did not match any products.');
    this.searchResultsHeading = page.getByRole('heading', { name: /^Search result for/ });
  }

  async open(): Promise<void> {
    await this.goto('https://bearstore-testsite.smartbear.com/');
  }

  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
    await Promise.all([
      this.page.waitForURL(/\/search\?q=/, { waitUntil: 'load' }),
      this.searchInput.press('Enter'),
    ]);
  }

  noResultsMessageLocator(): Locator {
    return this.noResultsMessage;
  }

  searchResultsHeadingLocator(): Locator {
    return this.searchResultsHeading;
  }

  productResultLinkLocator(productName: string): Locator {
    return this.page.getByRole('link', { name: productName, exact: true });
  }

  async openSearchResult(productName: string): Promise<void> {
    await Promise.all([
      this.page.waitForLoadState('load'),
      this.productResultLinkLocator(productName).click(),
    ]);
  }
}
