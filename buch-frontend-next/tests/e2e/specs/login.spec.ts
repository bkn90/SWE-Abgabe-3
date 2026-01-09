import { test, expect } from "../fixtures/test";

test.describe("Login", () => {
  test("erfolgreicher Login als Admin", async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login("admin", "p");

    // Nicht mehr auf irgendwelche URLs raten, sondern auf UI, die es nur eingeloggt gibt
    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /neu/i })).toBeVisible();

    // Optional: eingeloggt-Statusbox (bei /items/new gesehen)
    // await expect(page.getByText(/eingeloggt/i)).toBeVisible();
  });

    test("Login mit falschen Daten schlägt fehl", async ({ page, loginPage }) => {
        await loginPage.goto();
        await loginPage.login("admin", "falsch");

        await expect(page.getByText("Fehler")).toBeVisible();
        await expect(
            page.getByText(/Login fehlgeschlagen \(401\): Unauthorized/i),
        ).toBeVisible();
    });
});