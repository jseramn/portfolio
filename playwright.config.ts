import { defineConfig, devices } from "@playwright/test"

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 4399)
const BASE_URL = `http://127.0.0.1:${PORT}`

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  timeout: 60_000,
  webServer: {
    command: `pnpm dev --port ${PORT} --host 127.0.0.1`,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "landscape-phone",
      use: {
        ...devices["iPhone 14"],
        browserName: "chromium",
        viewport: { width: 844, height: 390 },
      },
    },
  ],
})
