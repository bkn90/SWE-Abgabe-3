// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  // Damit sowohl setup/ als auch specs/ gefunden werden
  testDir: "./tests/e2e",

  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    // 1) Setup: erzeugt playwright/.auth/admin.json
    {
      name: "setup",
      testMatch: "setup/auth.setup.ts",
    },

    // 2) Chromium: läuft danach und nutzt storageState
    {
      name: "chromium",
      dependencies: ["setup"],
      testMatch: "specs/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "playwright/.auth/admin.json",
      },
    },
  ],

  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : [
        {
          command: "npm run dev",
          port: 3001,
          reuseExistingServer: true,
        },
      ],
});
