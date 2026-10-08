import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

const publicRoutes = [
  "/",
  "/capabilities",
  "/process",
  "/work",
  "/work/multi-tenant-financial-integration-platform",
  "/work/operational-finance-data-infrastructure",
  "/work/document-intelligence-workflow",
  "/work/fragile-automation-modernization",
  "/about",
  "/contact",
  "/privacy",
] as const

async function expectOrderedHeadings(page: Page, path: string) {
  const levels = await page
    .locator("main h1, main h2, main h3, main h4, main h5, main h6")
    .evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.slice(1))),
    )

  expect(
    levels.filter((level) => level === 1),
    `${path} h1 count`,
  ).toHaveLength(1)
  levels.slice(1).forEach((level, index) => {
    const previousLevel = levels[index]
    expect(previousLevel).toBeDefined()
    expect(
      level,
      `${path} heading jump at position ${index + 1}`,
    ).toBeLessThanOrEqual((previousLevel ?? 0) + 1)
  })
}

test("public routes expose unique, complete metadata", async ({ page }) => {
  const titles = new Set<string>()
  const descriptions = new Set<string>()
  const canonicals = new Set<string>()

  for (const path of publicRoutes) {
    const response = await page.goto(path)
    expect(response?.status(), path).toBe(200)

    const title = await page.title()
    const description =
      (await page
        .locator('meta[name="description"]')
        .getAttribute("content")) ?? ""
    const canonical =
      (await page.locator('link[rel="canonical"]').getAttribute("href")) ?? ""

    expect(title, `${path} title`).not.toBe("")
    expect(description, `${path} description`).not.toBe("")
    expect(new URL(canonical).pathname, `${path} canonical`).toBe(path)
    expect(titles.has(title), `${path} unique title`).toBe(false)
    expect(descriptions.has(description), `${path} unique description`).toBe(
      false,
    )
    expect(canonicals.has(canonical), `${path} unique canonical`).toBe(false)

    titles.add(title)
    descriptions.add(description)
    canonicals.add(canonical)

    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /\S/,
    )
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute("content", /\S/)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    )
    await expectOrderedHeadings(page, path)
  }
})

test("structured data is conservative and truthful", async ({ page }) => {
  await page.goto("/")
  const scripts = page.locator('script[type="application/ld+json"]')
  await expect(scripts).toHaveCount(1)

  const structuredData = JSON.parse((await scripts.textContent()) ?? "{}") as {
    "@context": string
    "@graph": Array<Record<string, unknown>>
  }
  expect(structuredData).toMatchObject({
    "@context": "https://schema.org",
  })
  expect(structuredData["@graph"]).toHaveLength(3)
  expect(structuredData["@graph"].map((node) => node["@type"])).toEqual([
    "WebSite",
    "Organization",
    "Person",
  ])
  expect(JSON.stringify(structuredData)).not.toContain("sameAs")
})

test("robots, sitemap and private boundaries follow the route policy", async ({
  page,
  request,
}) => {
  const robots = await request.get("/robots.txt")
  expect(robots.status()).toBe(200)
  const robotsBody = await robots.text()
  expect(robotsBody).toContain("Disallow: /api/")
  expect(robotsBody).not.toContain("Disallow: /portal")
  expect(robotsBody).not.toContain("Disallow: /es/portal")

  const sitemap = await request.get("/sitemap.xml")
  const sitemapBody = await sitemap.text()
  expect(sitemap.status()).toBe(200)
  for (const path of publicRoutes) {
    expect(sitemapBody, path).toContain(
      new URL(path, "https://brunova.mx").href,
    )
  }
  expect(sitemapBody).not.toContain("/portal")
  expect(sitemapBody).not.toContain("/api/")

  const portal = await page.goto("/portal")
  expect(portal?.headers()["x-robots-tag"]).toBe("noindex, follow")
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  )

  const health = await request.get("/api/health")
  expect(health.headers()["x-robots-tag"]).toBe("noindex, nofollow")
  expect(health.headers()["cache-control"]).toContain("no-store")
})

test("security headers and keyboard entry point are present", async ({
  page,
}) => {
  const response = await page.goto("/")
  const headers = response?.headers() ?? {}

  expect(headers["content-security-policy"]).toContain("default-src 'self'")
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'")
  expect(headers["x-content-type-options"]).toBe("nosniff")
  expect(headers["x-frame-options"]).toBe("DENY")
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  expect(headers["cross-origin-opener-policy"]).toBe("same-origin")
  expect(headers["cross-origin-resource-policy"]).toBe("same-origin")

  await page.keyboard.press("Tab")
  const skipLink = page.getByRole("link", { name: "Skip to content" })
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await skipLink.press("Enter")
  await expect(page.locator("#main-content")).toBeFocused()
})

for (const theme of ["light", "dark"] as const) {
  test(`every indexable route passes axe in ${theme} mode`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem("brunova-theme", selectedTheme)
    }, theme)

    for (const path of publicRoutes) {
      await page.goto(path)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
      const accessibility = await new AxeBuilder({ page }).analyze()
      expect(accessibility.violations, path).toEqual([])
    }
  })
}
