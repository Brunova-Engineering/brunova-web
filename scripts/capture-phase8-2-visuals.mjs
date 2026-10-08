import { mkdir } from "node:fs/promises"
import path from "node:path"

import { chromium } from "@playwright/test"

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3101"
const outputDirectory = path.resolve(".qa-artifacts/phase8-2/screenshots")
const browser = await chromium.launch()

async function capture({
  name,
  route,
  selector,
  theme = "light",
  viewport = { width: 1440, height: 1000 },
}) {
  await mkdir(outputDirectory, { recursive: true })
  const context = await browser.newContext({ viewport })
  await context.addInitScript((selectedTheme) => {
    localStorage.setItem("brunova-theme", selectedTheme)
  }, theme)
  const page = await context.newPage()
  await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle" })
  await page.addStyleTag({
    content: ".skip-link { visibility: hidden !important; }",
  })

  const screenshotPath = path.join(outputDirectory, `${name}.png`)
  if (selector) {
    await page.locator(selector).screenshot({ path: screenshotPath })
  } else {
    await page.screenshot({ fullPage: true, path: screenshotPath })
  }
  await context.close()
}

const evidence = [
  { name: "home-desktop-en-dark", route: "/", theme: "dark" },
  { name: "home-desktop-en-light", route: "/" },
  { name: "home-desktop-es", route: "/es" },
  { name: "hero-focused", route: "/", selector: ".home-hero" },
  {
    name: "operational-intelligence-focused",
    route: "/",
    selector: ".operational-intelligence",
  },
  {
    name: "selected-work-focused",
    route: "/",
    selector: ".selected-work",
  },
  {
    name: "architecture-before-tools-focused",
    route: "/",
    selector: ".architecture-hinge",
  },
  {
    name: "home-mobile-en-dark",
    route: "/",
    theme: "dark",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "home-mobile-es",
    route: "/es",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "hero-mobile",
    route: "/",
    selector: ".home-hero",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "operational-intelligence-mobile",
    route: "/",
    selector: ".operational-intelligence",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "cta-mobile",
    route: "/",
    selector: ".home-final-cta",
    viewport: { width: 390, height: 844 },
  },
]

for (const item of evidence) await capture(item)

await browser.close()
console.log(`Phase 8.2 screenshots written to ${outputDirectory}`)
