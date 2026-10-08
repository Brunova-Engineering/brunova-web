import { mkdir } from "node:fs/promises"
import path from "node:path"

import { chromium } from "@playwright/test"

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3000"
const outputDirectory = path.resolve(".qa-artifacts/phase8/screenshots")
const browser = await chromium.launch()

async function capture({
  group,
  name,
  route = "/",
  theme = "light",
  viewport = { width: 1440, height: 1000 },
  fullPage = true,
  prepare,
  resetScroll = true,
}) {
  const directory = path.join(outputDirectory, group)
  await mkdir(directory, { recursive: true })
  const context = await browser.newContext({ viewport })
  await context.addInitScript((selectedTheme) => {
    localStorage.setItem("brunova-theme", selectedTheme)
  }, theme)
  const page = await context.newPage()
  console.log(`Capturing ${group}/${name}`)
  await page.goto(new URL(route, baseUrl).href, { waitUntil: "load" })
  if (prepare) await prepare(page)
  for (const image of await page.locator("img").all())
    if (await image.isVisible()) await image.scrollIntoViewIfNeeded()
  await page.waitForFunction(
    () =>
      [...document.images]
        .filter((image) => {
          const bounds = image.getBoundingClientRect()
          return bounds.width > 0 && bounds.height > 0
        })
        .every((image) => image.complete && image.naturalWidth > 0),
    undefined,
    { timeout: 15_000 },
  )
  if (resetScroll) await page.evaluate(() => window.scrollTo(0, 0))
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  })
  await page.addStyleTag({
    content: ".skip-link { visibility: hidden !important; }",
  })
  await page.screenshot({
    fullPage,
    path: path.join(directory, `${name}.png`),
  })
  await context.close()
}

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

const desktopRoutes = [
  ["homepage", "/", "homepage"],
  ["core-routes", "/capabilities", "capabilities"],
  ["core-routes", "/process", "process"],
  ["core-routes", "/work", "work"],
  [
    "core-routes",
    "/work/multi-tenant-financial-integration-platform",
    "dossier",
  ],
  ["core-routes", "/about", "about"],
  ["contact-states", "/contact", "contact-initial"],
  ["system-states", "/portal", "portal"],
  ["system-states", "/privacy", "privacy"],
  ["system-states", "/phase-8-not-found", "404"],
]

for (const theme of ["light", "dark"])
  for (const [group, route, name] of desktopRoutes)
    await capture({ group, name: `desktop-${theme}-${name}`, route, theme })

await capture({
  group: "contact-states",
  name: "desktop-dark-contact-success",
  route: "/contact",
  theme: "dark",
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
  },
})

for (const theme of ["light", "dark"])
  await capture({
    group: "homepage",
    name: `fold-${theme}`,
    theme,
    viewport: { width: 1280, height: 800 },
    fullPage: false,
  })

const mobileRoutes = [
  ["homepage", "/", "homepage"],
  ["core-routes", "/capabilities", "capabilities"],
  ["core-routes", "/process", "process"],
  [
    "core-routes",
    "/work/multi-tenant-financial-integration-platform",
    "dossier",
  ],
  ["contact-states", "/contact", "contact"],
]

for (const theme of ["light", "dark"]) {
  for (const [group, route, name] of mobileRoutes)
    await capture({
      group,
      name: `mobile-${theme}-${name}`,
      route,
      theme,
      viewport: { width: 390, height: 844 },
    })
  await capture({
    group: "mobile",
    name: `mobile-${theme}-nav-open`,
    theme,
    viewport: { width: 390, height: 844 },
    fullPage: false,
    prepare: (page) => page.getByRole("button", { name: "Menu" }).click(),
  })
}

for (const theme of ["dark", "light"]) {
  await capture({
    group: "phase8-amendment",
    name: `desktop-${theme}-home-en-resting`,
    theme,
    fullPage: false,
  })
  await capture({
    group: "phase8-amendment",
    name: `desktop-${theme}-home-utility-expanded`,
    theme,
    fullPage: false,
    prepare: (page) => page.getByRole("button", { name: "Appearance" }).click(),
  })
  await capture({
    group: "phase8-amendment",
    name: `desktop-${theme}-home-es`,
    route: "/es",
    theme,
    fullPage: false,
  })
  await capture({
    group: "phase8-amendment",
    name: `mobile-${theme}-home-en`,
    theme,
    viewport: { width: 390, height: 844 },
    fullPage: false,
  })
  await capture({
    group: "phase8-amendment",
    name: `mobile-${theme}-utility-open`,
    theme,
    viewport: { width: 390, height: 844 },
    fullPage: false,
    prepare: (page) => page.getByRole("button", { name: "Appearance" }).click(),
  })
  await capture({
    group: "phase8-amendment",
    name: `mobile-${theme}-home-es`,
    route: "/es",
    theme,
    viewport: { width: 390, height: 844 },
    fullPage: false,
  })
}

await capture({
  group: "phase8-amendment",
  name: "desktop-dark-capabilities-es",
  route: "/es/capabilities",
  theme: "dark",
})
await capture({
  group: "phase8-amendment",
  name: "desktop-dark-contact-es",
  route: "/es/contact",
  theme: "dark",
})
for (const theme of ["dark", "light"])
  await capture({
    group: "phase8-amendment",
    name: `mobile-${theme}-contact-es`,
    route: "/es/contact",
    theme,
    viewport: { width: 390, height: 844 },
  })

await capture({
  group: "phase8-amendment",
  name: "desktop-dark-footer-utility-collision-check",
  route: "/es/privacy",
  theme: "dark",
  fullPage: false,
  resetScroll: false,
  prepare: async (page) => {
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    )
  },
})

await browser.close()
console.log(`Phase 8 screenshots written to ${outputDirectory}`)
