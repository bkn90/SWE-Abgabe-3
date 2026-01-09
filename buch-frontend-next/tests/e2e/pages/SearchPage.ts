import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

export class SearchPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/search");
    await expect(
      this.page.getByRole("heading", { name: /suche/i }),
    ).toBeVisible();
  }

  async search(text: string) {
    // Nimm das erste Textfeld auf der Seite (wenn’s weiter unten ist -> scroll)
    const input = this.page.getByRole("textbox").first();
    await input.scrollIntoViewIfNeeded();
    await expect(input).toBeVisible();

    await input.fill(text);

    // Falls es einen "Suchen"-Button gibt -> klicken, sonst Enter
    const button = this.page.getByRole("button", { name: /suchen|search/i });
    if (await button.count()) {
      await button.first().click();
    } else {
      await input.press("Enter");
    }
  }

  async openFirstResult() {
    // NICHT einfach "link.first()" (das trifft sonst Home/Suche/Neu/Logout)
    // Erstmal: nimm den ersten Link im Hauptbereich unterhalb der Überschrift.
    const mainLinks = this.page.locator("main").getByRole("link");

    if (await mainLinks.count()) {
      await mainLinks.first().click();
      return;
    }

    // Fallback, falls kein <main> existiert:
    const contentLinks = this.page
      .locator("body")
      .getByRole("link")
      .filter({ hasNot: this.page.getByRole("button") }); // grober Fallback

    await contentLinks.nth(0).click();
  }
}
