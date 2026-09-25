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
    // Racing waitForURL against the triggering keypress is unreliable on
    // Firefox: it has been observed to report the navigation completing
    // ("navigated to ...") while the raced waitForURL call still hangs.
    // press() first, then wait, matching the fix already applied to
    // openSearchResult()/checkout() for the same underlying issue.
    await this.searchInput.press('Enter');
    await this.page.waitForURL(/\/search\?q=/, { waitUntil: 'domcontentloaded' });
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
