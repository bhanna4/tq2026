import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface NewAccount {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
}

export class RegisterPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly emailInput: Locator;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly confirmPasswordInput: Locator;
  private readonly registerButton: Locator;
  private readonly completedMessage: Locator;
  private readonly passwordMismatchError: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByRole('textbox', { name: 'First name' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last name' });
    this.emailInput = page.getByRole('textbox', { name: 'Email *' });
    this.usernameInput = page.getByRole('textbox', { name: 'Username *' });
    this.passwordInput = page.getByRole('textbox', { name: 'Password *', exact: true });
    this.confirmPasswordInput = page.getByRole('textbox', { name: 'Confirm password *' });
    this.registerButton = page.getByRole('button', { name: 'Register' });
    this.completedMessage = page.getByText('Your registration completed');
    this.passwordMismatchError = page.getByText(
      'The password and confirmation password do not match.',
    );
  }

  async open(): Promise<void> {
    await this.goto('https://bearstore-testsite.smartbear.com/register');
  }

  async register(account: NewAccount): Promise<void> {
    await this.fillForm(account);
    await this.submit();
    await this.completedMessage.waitFor();
  }

  // Fills the form with a caller-chosen confirm-password value (defaulting
  // to a match), so callers can exercise the mismatch validation path
  // without duplicating every other field.
  async fillForm(account: NewAccount, confirmPassword: string = account.password): Promise<void> {
    await this.replace(this.firstNameInput, account.firstName);
    await this.replace(this.lastNameInput, account.lastName);
    await this.replace(this.emailInput, account.email);
    await this.replace(this.usernameInput, account.username);
    await this.replace(this.passwordInput, account.password);
    await this.replace(this.confirmPasswordInput, confirmPassword);
  }

  async submit(): Promise<void> {
    await this.registerButton.click();
  }

  completedMessageLocator(): Locator {
    return this.completedMessage;
  }

  passwordMismatchErrorLocator(): Locator {
    return this.passwordMismatchError;
  }

  private async replace(field: Locator, value: string): Promise<void> {
    await field.clear();
    await field.fill(value);
  }
}
