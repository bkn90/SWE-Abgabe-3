import { test as setup, expect } from "@playwright/test";

setup("auth as admin", async ({ page }) => {
  await page.goto("/login");

  // deine Login-Seite hat 2 Textboxen + Button "Einloggen"
  await page.getByRole("textbox").nth(0).fill("admin");
  await page.getByRole("textbox").nth(1).fill("p"); // Passwort anpassen
  await page.getByRole("button", { name: /einloggen/i }).click();

  // irgendein eindeutiges Merkmal, dass du eingeloggt bist:
  await expect(page.getByText(/eingeloggt/i)).toBeVisible();

  await page.context().storageState({ path: "playwright/.auth/admin.json" });
});
