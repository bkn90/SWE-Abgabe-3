import { test as base } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { SearchPage } from "../pages/SearchPage";
import { NewBookPage } from "../pages/NewBookPage";

type Fixtures = {
  loginPage: LoginPage;
  searchPage: SearchPage;
  newBookPage: NewBookPage;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, provide) => {
    await provide(new LoginPage(page));
  },
  searchPage: async ({ page }, provide) => {
    await provide(new SearchPage(page));
  },
  newBookPage: async ({ page }, provide) => {
    await provide(new NewBookPage(page));
  },
});

export { expect } from "@playwright/test";
