import { Page, Locator } from "@playwright/test";

export class LoginPage {
  private readonly page: Page;
  private readonly usernameInput: Locator;
  private readonly passwordInput: Locator;
  private readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // 1. Textbox = Benutzername, 2. Textbox = Passwort (wie im Snapshot)
    this.usernameInput = page.getByRole("textbox").nth(0);
    this.passwordInput = page.getByRole("textbox").nth(1);

    this.loginButton = page.getByRole("button", { name: /einloggen/i });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
