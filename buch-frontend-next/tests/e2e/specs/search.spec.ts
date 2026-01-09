import { test, expect } from "../fixtures/test";

test("Suche zeigt Ergebnisse", async ({ searchPage }) => {
  await searchPage.goto();
  await searchPage.search("Alice");

  // anpassen: woran erkennst du Trefferliste?
  await expect(
    // z.B. eine Tabelle oder Karten
    // hier nur Beispiel:
    // page.getByText(/Alice/i)
    // -> besser: data-testid
    (searchPage as any).page?.getByText?.(/Alice/i) // wenn du es strikt willst: method in PageObject ergänzen
  ).toBeTruthy();
});