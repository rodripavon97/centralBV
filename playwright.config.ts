import { defineConfig, devices } from "@playwright/test";

/**
 * E2E de CentralBV.
 *
 * Los tests no dependen de un backend real: cada spec intercepta `http://localhost:3000/**`
 * con `tests/e2e/fixtures/api.ts` (un backend en memoria). Se ejecutan contra el dev server
 * de Vite, que Playwright levanta automáticamente.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }], ["junit", { outputFile: "test-results/e2e-junit.xml" }]]
    : [["list"], ["html", { open: "never" }]],
  timeout: 30_000,
  expect: { timeout: 7_500 },

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://127.0.0.1:4173",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    locale: "es-AR",
    timezoneId: "America/Argentina/Buenos_Aires",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev -- --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    // El `.env` del repo apunta a Railway; los E2E siempre hablan con el backend
    // en memoria interceptado por Playwright.
    env: { VITE_API_URL: "http://localhost:3000" },
  },
});
