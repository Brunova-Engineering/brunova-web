import { defineConfig, devices } from "@playwright/test"

const e2ePort = process.env.E2E_PORT ?? "3000"
if (!/^\d{2,5}$/.test(e2ePort)) throw new Error("E2E_PORT must be numeric")
const baseURL = `http://127.0.0.1:${e2ePort}`

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `corepack pnpm dev --hostname 127.0.0.1 --port ${e2ePort}`,
    env: {
      ...process.env,
      SITE_URL: "https://brunova.mx",
      SEO_INDEXING_ENABLED: "true",
      N8N_CONTACT_WEBHOOK_URL: "",
      N8N_CONTACT_WEBHOOK_SECRET: "",
      N8N_CONTACT_BASIC_AUTH_USER: "",
      N8N_CONTACT_BASIC_AUTH_PASSWORD: "",
      CONTACT_RATE_LIMIT_SALT: "",
      PORTAL_URL: "https://portal.example.test",
    },
    url: `${baseURL}/api/health`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
