import { defineConfig, devices } from "@playwright/test";
import { loadE2eEnv } from "./e2e/env";

loadE2eEnv();

export default defineConfig({
  testDir: "./e2e",
  testMatch: "*.spec.ts",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  globalSetup: "./e2e/global-setup.ts",
  reporter: process.env.CI ? "github" : "list",
  use: {
    // 127.0.0.1 だと next dev --hostname 0.0.0.0 の allowedDevOrigins に弾かれる
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    locale: "ja-JP",
    viewport: { width: 375, height: 812 },
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 375, height: 812 },
      },
    },
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
