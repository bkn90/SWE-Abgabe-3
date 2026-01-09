import { test, expect } from "../fixtures/test";

test.describe("Login", () => {
  test("erfolgreicher Login als Admin", async ({ page, loginPage }) => {
    await loginPage.goto();
    await loginPage.login("admin", "admin");

    await expect(page.getByRole("button", { name: /logout/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /neu/i })).toBeVisible();
  });

  test.describe("ohne storageState", () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test("Login mit falschen Daten schlägt fehl", async ({
      page,
      loginPage,
    }) => {
      await loginPage.goto();

      await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();

      await loginPage.login("admin", "falsch");

      await expect(page.getByText("Fehler")).toBeVisible();
      await expect(
        page.getByText(/falscher benutzername oder falsches passwort/i),
      ).toBeVisible();

      await expect(
        page.getByRole("button", { name: /einloggen/i }),
      ).toBeVisible();
    });
  });
});
