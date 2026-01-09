import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

export type NewBookInput = {
  titel: string;
  untertitel?: string;
  isbn: string;
  art?: "EPUB" | "HARDCOVER" | "PAPERBACK";
  rating?: number;        // 1-5
  preis?: string;         // "19.99"
  datum?: string;         // "2026-01-09"
  homepage?: string;
  schlagwoerter?: string; // "JAVA, TYPESCRIPT"
  lieferbar?: boolean;
};

export class NewBookPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/items/new");
    await expect(this.page.getByRole("heading", { name: /neues buch/i })).toBeVisible();

    // Muss eingeloggt sein, sonst kommt "Login erforderlich"
    await expect(this.page.getByText(/login erforderlich/i)).toHaveCount(0);
  }

  async createBook(input: NewBookInput) {
    // Titel (Placeholder = Accessible Name)
    await this.page.getByRole("textbox", { name: /clean code/i }).fill(input.titel);

    // Untertitel
    if (input.untertitel !== undefined) {
      await this.page
        .getByRole("textbox", { name: /handbook of agile software craftsmanship/i })
        .fill(input.untertitel);
    }

    // ISBN
    await this.page.getByRole("textbox", { name: /978-\.\.\./i }).fill(input.isbn);

    // Art (Combobox)
    if (input.art) {
      await this.page.getByRole("combobox").selectOption(input.art);
    }

    // Rating (5x "★" Buttons)
    if (input.rating !== undefined) {
      if (input.rating < 1 || input.rating > 5) {
        throw new Error(`rating muss zwischen 1 und 5 liegen, war: ${input.rating}`);
      }
      await this.page.getByRole("button", { name: "★" }).nth(input.rating - 1).click();
    }

    // Preis (Spinbutton)
    if (input.preis !== undefined) {
      await this.page.getByRole("spinbutton").fill(input.preis);
    }

    // Datum (Textbox ohne Name -> wir nehmen die 1. namenlose Textbox nach ISBN/Untertitel/Titel)
    // Stabiler: die einzige Textbox OHNE name ist im Snapshot das Datum-Feld.
    if (input.datum !== undefined) {
      const dateInput = this.page.getByRole("textbox").filter({ hasNotText: "" }).nth(0); // Fallback ist schlecht
      // Besser: direkt über Position: nach den bekannten drei Textboxen (Titel, Untertitel, ISBN) kommt später Datum.
      // Wir greifen explizit die 4. "textbox" ohne Placeholder-Name: in deinem Snapshot ist das Datum die einzige ohne name.
      const unnamedTextboxes = this.page.getByRole("textbox").filter({ hasNot: this.page.locator('[placeholder]') });
      await unnamedTextboxes.first().fill(input.datum);
    }

    // Homepage (Textbox, im Snapshot bereits mit URL gefüllt; Name fehlt)
    if (input.homepage !== undefined) {
      // meist ist das die Textbox mit aktuellem Wert, der wie URL aussieht
      const urlBox = this.page.getByRole("textbox").filter({ hasText: /https?:\/\//i });
      if (await urlBox.count()) {
        await urlBox.first().fill(input.homepage);
      } else {
        // Fallback: nimm die letzte Textbox (Homepage/Schlagwörter liegen am Ende)
        await this.page.getByRole("textbox").last().fill(input.homepage);
      }
    }

    // Schlagwörter (Textbox mit Text/Value)
    if (input.schlagwoerter !== undefined) {
      // Im Snapshot steht im Hilfetext "Komma-separiert..." -> aber das ist kein Selector.
      // In der Praxis ist das Feld direkt vor der Lieferbar-Checkbox, oft die vorletzte Textbox.
      const allTextboxes = this.page.getByRole("textbox");
      // Titel, Untertitel, ISBN, Datum, Homepage, Schlagwörter => Schlagwörter ist sehr wahrscheinlich die letzte Textbox.
      await allTextboxes.last().fill(input.schlagwoerter);
    }

    // Lieferbar Checkbox
    if (input.lieferbar !== undefined) {
      const checkbox = this.page.getByRole("checkbox", { name: /lieferbar/i });
      if ((await checkbox.isChecked()) !== input.lieferbar) {
        await checkbox.click();
      }
    }

    // Submit
    const submit = this.page.getByRole("button", { name: /buch anlegen/i });

    // warten bis enabled (Validierung/State)
    await expect(submit).toBeEnabled();

    await submit.click();
  }

  async expectSuccess() {
    await expect(this.page).toHaveURL(/\/(search|items)(\b|\/)/i);
  }
}