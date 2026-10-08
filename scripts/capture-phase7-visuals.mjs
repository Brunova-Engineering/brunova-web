import { mkdir } from "node:fs/promises"
import path from "node:path"

import { chromium } from "@playwright/test"

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000"
const outputDirectory = path.resolve(".qa-artifacts/phase7/screenshots")

await mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch()

async function capture({
  name,
  route,
  theme = "light",
  viewport = { width: 1440, height: 1000 },
  prepare,
}) {
  const context = await browser.newContext({ viewport })
  await context.addInitScript((selectedTheme) => {
    localStorage.setItem("brunova-theme", selectedTheme)
  }, theme)
  const page = await context.newPage()
  await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle" })
  if (prepare) await prepare(page)
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  })
  // Chromium can stitch an off-canvas fixed skip link into full-page captures.
  // Its keyboard behavior is covered independently by Playwright assertions.
  await page.addStyleTag({
    content: ".skip-link { visibility: hidden !important; }",
  })
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, `${name}.png`),
  })
  await context.close()
}

const desktop = { width: 1440, height: 1000 }
const mobile = { width: 390, height: 844 }
const dossier = "/work/multi-tenant-financial-integration-platform"

await capture({ name: "homepage-desktop-light", route: "/", viewport: desktop })
await capture({
  name: "homepage-desktop-dark",
  route: "/",
  theme: "dark",
  viewport: desktop,
})
await capture({ name: "homepage-mobile-light", route: "/", viewport: mobile })
await capture({
  name: "homepage-mobile-dark",
  route: "/",
  theme: "dark",
  viewport: mobile,
})
for (const [name, route] of [
  ["capabilities-desktop", "/capabilities"],
  ["process-desktop", "/process"],
  ["work-desktop", "/work"],
  ["work-dossier-desktop", dossier],
  ["about-desktop", "/about"],
  ["contact-desktop-initial", "/contact"],
  ["portal-desktop", "/portal"],
  ["privacy-desktop", "/privacy"],
  ["not-found-desktop", "/phase-7-not-found"],
])
  await capture({ name, route, viewport: desktop })

await capture({ name: "contact-mobile", route: "/contact", viewport: mobile })
await capture({
  name: "mobile-navigation-open",
  route: "/",
  viewport: mobile,
  prepare: (page) => page.getByRole("button", { name: "Menu" }).click(),
})

async function fillContact(page) {
  await page.getByLabel("Name").fill("Ada Lovelace")
  await page.getByLabel("Work email").fill("ada@example.com")
  await page.getByLabel("Company").fill("Analytical Engines")
  await page.getByLabel("Role").fill("Chief Operating Officer")
  await page.getByLabel("Problem category").selectOption("fragmented_systems")
  await page
    .getByLabel("Problem description")
    .fill(
      "Our operating data is fragmented across systems and manual handoffs.",
    )
}

await capture({
  name: "contact-desktop-success",
  route: "/contact",
  viewport: desktop,
  prepare: async (page) => {
    await page.route("**/api/contact", (request) =>
      request.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true }),
      }),
    )
    await fillContact(page)
    await page.getByRole("button", { name: "Send the context" }).click()
    await page
      .getByRole("heading", { name: "Thanks. We received your note." })
      .waitFor()
    await page.waitForFunction(() =>
      document.activeElement?.classList.contains("contact-result"),
    )
  },
})

await capture({
  name: "contact-desktop-error",
  route: "/contact",
  viewport: desktop,
  prepare: async (page) => {
    await page.route("**/api/contact", (request) =>
      request.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          ok: false,
          code: "SERVICE_UNAVAILABLE",
          message: "Controlled failure",
        }),
      }),
    )
    await fillContact(page)
    await page.getByRole("button", { name: "Send the context" }).click()
    await page.getByText("We couldn't send this right now.").waitFor()
    await page.waitForFunction(() =>
      document.activeElement?.classList.contains("contact-result"),
    )
  },
})

await browser.close()
console.log(`Phase 7 screenshots written to ${outputDirectory}`)
