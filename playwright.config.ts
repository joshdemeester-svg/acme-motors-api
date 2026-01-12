import { defineConfig, devices } from "@playwright/test";

const isCI = !!process.env.CI;

const ciConfig = defineConfig({
  testDir: "./tests/e2e",
  forbidOnly: true,
  retries: 2,
  workers: 1,
  projects: [],
});

const localConfig = defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: false,
  retries: 0,
  workers: undefined,
  timeout: 30000,
  expect: {
    timeout: 5000,
  },
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://localhost:5000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:5000/api/health",
    reuseExistingServer: true,
    timeout: 120000,
  },
  outputDir: "test-results",
});

export default isCI ? ciConfig : localConfig;
