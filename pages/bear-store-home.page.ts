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
    // waitUntil: 'load' has hung on Firefox against this live site — some
    // slow-completing background resource seems to prevent the load event
    // from firing there even after the DOM is ready. domcontentloaded is
    // enough to know the search results page is interactable.
    await Promise.all([
      this.page.waitForURL(/\/search\?q=/, { waitUntil: 'domcontentloaded' }),
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
    // Racing a bare waitForLoadState('load') against the click is unreliable:
    // it can resolve immediately off the still-loaded search-results page,
    // before the click's navigation actually completes (seen on Firefox).
    // Click first, then require the URL to actually leave /search.
    await this.productResultLinkLocator(productName).click();
    await this.page.waitForURL((url) => !url.pathname.startsWith('/search'), {
      waitUntil: 'domcontentloaded',
    });
  }
}
