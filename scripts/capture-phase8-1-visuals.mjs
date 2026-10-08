import { mkdir } from "node:fs/promises"
import path from "node:path"

import { chromium } from "@playwright/test"

const baseUrl = process.env.QA_BASE_URL ?? "http://127.0.0.1:3101"
const outputDirectory = path.resolve(".qa-artifacts/phase8-1/screenshots")
const browser = await chromium.launch()

async function capture({
  name,
  route,
  theme = "light",
  viewport = { width: 1440, height: 1000 },
}) {
  await mkdir(outputDirectory, { recursive: true })
  const context = await browser.newContext({ viewport })
  await context.addInitScript((selectedTheme) => {
    localStorage.setItem("brunova-theme", selectedTheme)
  }, theme)
  const page = await context.newPage()
  await page.goto(new URL(route, baseUrl).href, { waitUntil: "load" })
  await page.evaluate(() => {
    if (document.activeElement instanceof HTMLElement)
      document.activeElement.blur()
  })
  await page.addStyleTag({
    content: ".skip-link { visibility: hidden !important; }",
  })
  await page.screenshot({
    fullPage: true,
    path: path.join(outputDirectory, `${name}.png`),
  })
  await context.close()
}

const evidence = [
  { name: "home-desktop-en-dark", route: "/", theme: "dark" },
  { name: "home-desktop-en-light", route: "/", theme: "light" },
  { name: "home-desktop-es", route: "/es", theme: "light" },
  {
    name: "home-mobile-en",
    route: "/",
    viewport: { width: 390, height: 844 },
  },
  {
    name: "home-mobile-es",
    route: "/es",
    viewport: { width: 390, height: 844 },
  },
  { name: "capabilities-desktop", route: "/capabilities" },
  {
    name: "capabilities-mobile",
    route: "/es/capabilities",
    viewport: { width: 390, height: 844 },
  },
  { name: "process-desktop", route: "/process" },
  {
    name: "process-mobile",
    route: "/es/process",
    viewport: { width: 390, height: 844 },
  },
  { name: "work-index", route: "/work" },
  {
    name: "work-dossier",
    route: "/work/multi-tenant-financial-integration-platform",
  },
  { name: "about-desktop", route: "/about" },
  { name: "contact-desktop", route: "/contact" },
]

for (const item of evidence) await capture(item)

await browser.close()
console.log(`Phase 8.1 screenshots written to ${outputDirectory}`)
