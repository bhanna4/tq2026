import type { Locator, Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface BillingAddress {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  zipCode: string;
  country: string;
  phoneNumber?: string;
}

export class CheckoutPage extends BasePage {
  private readonly firstNameInput: Locator;
  private readonly lastNameInput: Locator;
  private readonly address1Input: Locator;
  private readonly address2Input: Locator;
  private readonly cityInput: Locator;
  private readonly zipCodeInput: Locator;
  private readonly countrySelect: Locator;
  private readonly phoneNumberInput: Locator;
  private readonly nextButton: Locator;
  private readonly shipToThisAddressButton: Locator;
  private readonly termsCheckbox: Locator;
  private readonly confirmButton: Locator;
  private readonly orderReceivedHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.firstNameInput = page.getByRole('textbox', { name: 'First name *' });
    this.lastNameInput = page.getByRole('textbox', { name: 'Last name *' });
    this.address1Input = page.getByRole('textbox', { name: 'Address 1' });
    this.address2Input = page.getByRole('textbox', { name: 'Address 2' });
    this.cityInput = page.getByRole('textbox', { name: 'City' });
    this.zipCodeInput = page.getByRole('textbox', { name: 'Zip / postal code' });
    this.countrySelect = page.getByRole('combobox', { name: 'Country' });
    this.phoneNumberInput = page.getByRole('textbox', { name: 'Phone number' });
    this.nextButton = page.getByRole('button', { name: 'Next' });
    this.shipToThisAddressButton = page.getByRole('button', { name: 'Ship to this address' });
    this.termsCheckbox = page.getByRole('checkbox', { name: /I agree with the terms of service/ });
    this.confirmButton = page.getByRole('button', { name: 'Confirm' });
    this.orderReceivedHeading = page.getByRole('heading', { name: 'Your order has been received' });
  }

  async fillBillingAddress(address: BillingAddress): Promise<void> {
    await this.firstNameInput.fill(address.firstName);
    await this.lastNameInput.fill(address.lastName);
    await this.address1Input.fill(address.address1);
    if (address.address2) {
      await this.address2Input.fill(address.address2);
    }
    await this.cityInput.fill(address.city);
    await this.zipCodeInput.fill(address.zipCode);
    await this.selectCountry(address.country);
    if (address.phoneNumber) {
      await this.phoneNumberInput.fill(address.phoneNumber);
    }
    await this.nextButton.click();
  }

  // The country field is a native <select> until the page's Select2 script
  // enhances it into a combobox span (seen intermittently on the live site);
  // selectOption() only works against the native element, so detect which
  // form is present and drive the Select2 dropdown directly otherwise. Its
  // opened dropdown exposes each country as a `treeitem` (confirmed via a
  // Playwright accessibility snapshot), not the `option` role a standard
  // listbox would use.
  private async selectCountry(country: string): Promise<void> {
    const tagName = await this.countrySelect.evaluate((element) => element.tagName);
    if (tagName === 'SELECT') {
      await this.countrySelect.selectOption({ label: country });
      return;
    }

    await this.countrySelect.click();
    await this.page.getByRole('treeitem', { name: country, exact: true }).click();
  }

  async useBillingAddressForShipping(): Promise<void> {
    await this.shipToThisAddressButton.click();
  }

  async continueWithSelectedShippingMethod(): Promise<void> {
    await this.nextButton.click();
  }

  async continueWithSelectedPaymentMethod(): Promise<void> {
    await this.nextButton.click();
  }

  async acceptTermsAndConfirmOrder(): Promise<void> {
    await this.termsCheckbox.check();
    await this.confirmButton.click();
  }

  orderReceivedHeadingLocator(): Locator {
    return this.orderReceivedHeading;
  }
}
