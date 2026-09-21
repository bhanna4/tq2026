import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class PlaywrightHomePage extends BasePage {
  private readonly getStartedLink: Locator;
  private readonly installationHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.getStartedLink = page.getByRole('link', { name: 'Get started' });
    this.installationHeading = page.getByRole('heading', { name: 'Installation' });
  }

  async open(): Promise<void> {
    await this.goto('https://playwright.dev/');
  }

  async clickGetStarted(): Promise<void> {
    await this.getStartedLink.click();
  }

  installationHeadingLocator(): Locator {
    return this.installationHeading;
  }
}
