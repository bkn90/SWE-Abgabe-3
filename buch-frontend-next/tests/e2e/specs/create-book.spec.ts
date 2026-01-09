import { test } from "../fixtures/test";

test("Admin kann Buch anlegen", async ({ newBookPage }) => {
  await newBookPage.goto();

  await newBookPage.createBook({
    titel: "Playwright Buch",
    untertitel: "E2E Tests sauber aufgebaut",
    isbn: "978-1-4028-9462-6", // andere ISBN als Beispiel ✅
    art: "EPUB",
    rating: 4,
    preis: "19.99",
    datum: "2026-01-09",
    homepage: "https://acme.at",
    schlagwoerter: "JAVA, TYPESCRIPT",
    lieferbar: true,
  });

  await newBookPage.expectSuccess();
});
