import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export class LoginPage extends BasePage {
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;
  private readonly accountLink: Locator;

  constructor(page: Page) {
    super(page);
    this.usernameInput = page.getByRole('textbox', { name: 'Username or email' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password' });
    this.loginButton = page.getByRole('button', { name: 'Log in' });
    // No stable role/label/text identifies the post-login account link (its
    // text is the logged-in username), so scope on the account page href;
    // the same href also appears in a dropdown item, so pick the menubar link.
    this.accountLink = page.locator('a.menubar-link[href="/customer/info"]');
  }

  async open(): Promise<void> {
    await this.goto('https://bearstore-testsite.smartbear.com/login?returnUrl=%2F');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await Promise.all([
      this.page.waitForURL('https://bearstore-testsite.smartbear.com/'),
      this.loginButton.click(),
    ]);
  }

  accountLinkLocator(): Locator {
    return this.accountLink;
  }
}
