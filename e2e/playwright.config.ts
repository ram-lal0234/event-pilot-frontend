import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3000);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: ".",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  timeout: 60_000,
  reporter: [["html", { open: "never" }], ["line"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "setup",
      testMatch: "**/fixtures/auth.setup.ts",
    },
    {
      name: "chromium-public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["**/auth/login.spec.ts", "**/public/**", "**/smoke/**"],
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
      testMatch: ["**/guests/**", "**/voice/**", "**/checkin/**", "**/operations/**"],
    },
    {
      name: "mobile-chrome",
      use: {
        ...devices["Pixel 7"],
      },
      testMatch: ["**/auth/login.spec.ts", "**/public/**", "**/smoke/**"],
    },
    {
      name: "mobile-safari",
      use: {
        ...devices["iPhone 13"],
      },
      testMatch: ["**/auth/login.spec.ts", "**/public/**", "**/smoke/**"],
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `npm run dev -- --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
