import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type NewBookInput = {
  titel: string;
  untertitel?: string;
  isbn: string;
  art?: "EPUB" | "HARDCOVER" | "PAPERBACK";
  rating?: number; // 1–5
  preis?: string; // "19.99"
  datum?: string; // "2026-01-09"
  homepage?: string;
  schlagwoerter?: string; // "JAVA, TYPESCRIPT"
  lieferbar?: boolean;
};

export class NewBookPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/items/new");

    await expect(
      this.page.getByRole("heading", { name: /neues buch/i }),
    ).toBeVisible();

    // darf nicht ausgeloggt sein
    await expect(this.page.getByText(/login erforderlich/i)).toHaveCount(0);
  }

  async createBook(input: NewBookInput) {
    // Titel
    await this.page
      .getByRole("textbox", { name: /clean code/i })
      .fill(input.titel);

    // Untertitel
    if (input.untertitel !== undefined) {
      await this.page
        .getByRole("textbox", {
          name: /handbook of agile software craftsmanship/i,
        })
        .fill(input.untertitel);
    }

    // ISBN
    await this.page
      .getByRole("textbox", { name: /978-\.\.\./i })
      .fill(input.isbn);

    // Art
    if (input.art) {
      await this.page.getByRole("combobox").selectOption(input.art);
    }

    // Rating (★ Buttons)
    if (input.rating !== undefined) {
      if (input.rating < 1 || input.rating > 5) {
        throw new Error(
          `rating muss zwischen 1 und 5 liegen, war: ${input.rating}`,
        );
      }

      await this.page
        .getByRole("button", { name: "★" })
        .nth(input.rating - 1)
        .click();
    }

    // Preis
    if (input.preis !== undefined) {
      await this.page.getByRole("spinbutton").fill(input.preis);
    }

    // Datum (einzige Textbox ohne placeholder im Snapshot)
    if (input.datum !== undefined) {
      const dateBox = this.page
        .getByRole("textbox")
        .filter({ hasNot: this.page.locator("[placeholder]") })
        .first();

      await dateBox.fill(input.datum);
    }

    // Homepage
    if (input.homepage !== undefined) {
      const urlBox = this.page
        .getByRole("textbox")
        .filter({ hasText: /https?:\/\//i });

      if (await urlBox.count()) {
        await urlBox.first().fill(input.homepage);
      } else {
        await this.page.getByRole("textbox").last().fill(input.homepage);
      }
    }

    // Schlagwörter
    if (input.schlagwoerter !== undefined) {
      const allTextboxes = this.page.getByRole("textbox");
      await allTextboxes.last().fill(input.schlagwoerter);
    }

    // Lieferbar
    if (input.lieferbar !== undefined) {
      const checkbox = this.page.getByRole("checkbox", { name: /lieferbar/i });
      if ((await checkbox.isChecked()) !== input.lieferbar) {
        await checkbox.click();
      }
    }

    // Submit
    const submit = this.page.getByRole("button", { name: /buch anlegen/i });

    await expect(submit).toBeEnabled();
    await submit.click();
  }

  async expectSuccess() {
    await expect(this.page).toHaveURL(/\/(search|items)(\b|\/)/i);
  }
}
