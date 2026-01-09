import { test as base, type Page } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { SearchPage } from "../pages/SearchPage";
import { NewBookPage } from "../pages/NewBookPage";

type Fixtures = {
  loginPage: LoginPage;
  searchPage: SearchPage;
  newBookPage: NewBookPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  searchPage: async ({ page }, use) => {
    await use(new SearchPage(page));
  },
  newBookPage: async ({ page }, use) => {
    await use(new NewBookPage(page));
  },
});

export { expect } from "@playwright/test";