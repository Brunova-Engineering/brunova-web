import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

import { footerNavigation, primaryNavigation } from "@/content/navigation"
import { workCases } from "@/content/work"
import { localizedPath } from "@/lib/i18n"

const pageRoutes = [
  {
    path: "/",
    heading: "Systems for operations that have outgrown their tools.",
    indexable: true,
  },
  {
    path: "/capabilities",
    heading: "Engineering disciplines for operational systems.",
    indexable: true,
  },
  {
    path: "/process",
    heading: "Start with what you already know.",
    indexable: true,
  },
  {
    path: "/work",
    heading: "Selected engineering experience.",
    indexable: true,
  },
  ...workCases.map((work) => ({
    path: `/work/${work.slug}`,
    heading: work.systemsTitle,
    indexable: true,
  })),
  {
    path: "/about",
    heading: "Where operations require engineering.",
    indexable: true,
  },
  { path: "/contact", heading: "Start a conversation.", indexable: true },
  { path: "/portal", heading: "Brunova Portal", indexable: false },
  { path: "/privacy", heading: "Privacy", indexable: true },
] as const

const securityHeaders = [
  "content-security-policy",
  "cross-origin-opener-policy",
  "cross-origin-resource-policy",
  "permissions-policy",
  "referrer-policy",
  "x-content-type-options",
  "x-frame-options",
] as const

async function follow(page: Page, name: string) {
  await page.getByRole("link", { name, exact: true }).first().click()
  await page.waitForLoadState("domcontentloaded")
}

test("authoritative route matrix renders with metadata, indexing and boundaries", async ({
  page,
  request,
}) => {
  for (const route of pageRoutes) {
    const response = await page.goto(route.path)
    expect(response?.status(), route.path).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      route.heading,
    )
    await expect(page.getByRole("banner"), `${route.path} header`).toBeVisible()
    await expect(
      page.getByRole("contentinfo"),
      `${route.path} footer`,
    ).toBeVisible()
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /\S/,
    )
    const canonical = await page
      .locator('link[rel="canonical"]')
      .getAttribute("href")
    expect(new URL(canonical ?? "", page.url()).pathname, route.path).toBe(
      route.path,
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /\S/,
    )
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    )

    const headers = response?.headers() ?? {}
    for (const header of securityHeaders)
      expect(headers[header], `${route.path} ${header}`).toBeTruthy()
    if (!route.indexable) {
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      )
      expect(headers["x-robots-tag"]).toBe("noindex, follow")
    }
  }

  const robots = await request.get("/robots.txt")
  expect(robots.status()).toBe(200)
  const robotsBody = await robots.text()
  expect(robotsBody).toContain("Disallow: /api/")
  expect(robotsBody).not.toContain("Disallow: /portal")

  const sitemap = await request.get("/sitemap.xml")
  const sitemapBody = await sitemap.text()
  expect(sitemap.status()).toBe(200)
  const expectedSitemapPaths = pageRoutes
    .filter((route) => route.indexable)
    .flatMap((route) => [route.path, localizedPath("es", route.path)])
  const sitemapPaths = [...sitemapBody.matchAll(/<loc>(.*?)<\/loc>/g)].map(
    (match) => new URL(match[1] ?? "", page.url()).pathname,
  )
  expect(sitemapPaths.sort()).toEqual([...expectedSitemapPaths].sort())
  expect((sitemapBody.match(/<url>/g) ?? []).length).toBe(
    expectedSitemapPaths.length,
  )
  expect(sitemapBody).not.toContain("/portal")
  expect(sitemapBody).not.toContain("/api/")

  const health = await request.get("/api/health")
  expect(health.status()).toBe(200)
  expect(health.headers()["cache-control"]).toContain("no-store")
  expect(health.headers()["x-robots-tag"]).toBe("noindex, nofollow")

  const contact = await request.get("/api/contact")
  expect(contact.status()).toBe(405)
  expect(contact.headers()["cache-control"]).toContain("no-store")
  expect(contact.headers()["x-robots-tag"]).toBe("noindex, nofollow")

  const missing = await page.goto("/not-a-brunova-route")
  expect(missing?.status()).toBe(404)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Page not found.",
  )
  const notFoundRobots = await page
    .locator('meta[name="robots"]')
    .evaluateAll((elements) =>
      elements.map((element) => element.getAttribute("content") ?? ""),
    )
  expect(notFoundRobots.length).toBeGreaterThan(0)
  expect(notFoundRobots.some((content) => content.includes("noindex"))).toBe(
    true,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveCount(0)
})

test("complete user journeys preserve navigation and browser history", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  await follow(page, "Capabilities")
  await page.locator(".selected-proof__record").first().click()
  await expect(page).toHaveURL(/\/work\//)

  await page.goto("/")
  await follow(page, "Systems")
  await page.locator(".work-record__link").first().click()
  await expect(page).toHaveURL(new RegExp(`/work/${workCases[0].slug}$`))

  await page.goto("/work")
  await page.goto(`/work/${workCases[0].slug}`)
  await page.goBack()
  await expect(page).toHaveURL(/\/work$/)
  await page.goForward()
  await expect(page).toHaveURL(new RegExp(`/work/${workCases[0].slug}$`))

  await page.goto("/")
  await follow(page, "Process")
  await follow(page, "Start a conversation")
  await expect(page).toHaveURL(/\/contact$/)

  await page.goto("/")
  const homepageCta = page
    .getByRole("main")
    .getByRole("link", { name: "Start a conversation" })
    .first()
  await homepageCta.click()
  await expect(page).toHaveURL(/\/contact$/)

  await page.goto("/")
  await page
    .getByRole("banner")
    .getByRole("link", { name: "Start a conversation" })
    .click()
  await expect(page).toHaveURL(/\/contact$/)

  await page.goto("/not-a-brunova-route")
  await follow(page, "Return to Brunova")
  await expect(page).toHaveURL(/\/$/)
})

test("header, footer and public links match their typed destinations", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto("/")
  const primaryHrefs = await page
    .getByRole("navigation", { name: "Primary navigation" })
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))
  expect(primaryHrefs).toEqual(primaryNavigation.map((item) => item.href))

  const footerHrefs = await page
    .getByRole("navigation", { name: "Footer navigation" })
    .locator("a")
    .evaluateAll((links) => links.map((link) => link.getAttribute("href")))
  expect(footerHrefs).toEqual(footerNavigation.map((item) => item.href))

  for (const route of pageRoutes) {
    await page.goto(route.path)
    const invalidLinks = await page
      .locator("a[href]")
      .evaluateAll((links) =>
        links
          .map((link) => link.getAttribute("href") ?? "")
          .filter(
            (href) =>
              href === "" || href === "#" || href.startsWith("javascript:"),
          ),
      )
    expect(invalidLinks, route.path).toEqual([])
  }
})

test("public content contains no temporary or internal implementation language", async ({
  page,
}) => {
  const forbidden =
    /\b(?:lorem ipsum|todo|fixme|placeholder|coming soon|n8n|phase [0-9]|review surface)\b/i
  for (const route of pageRoutes.filter((route) => route.indexable)) {
    await page.goto(route.path)
    const text = await page.getByRole("main").innerText()
    expect(text, route.path).not.toMatch(forbidden)
  }

  await page.goto("/capabilities")
  for (const term of [
    "Systems Architecture & Internal Platforms",
    "Data & Integration Engineering",
    "Financial & Operational Automation",
    "Workflow / Process Engineering",
    "Modernization of Fragile Automations",
  ])
    await expect(page.getByText(term, { exact: true })).toBeVisible()

  await page.goto("/process")
  for (const stage of ["Discover", "Design", "Build", "Evolve"]) {
    await expect(page.getByText(stage, { exact: true })).toBeVisible()
  }
})

test("theme choice persists across routes and system mode follows the browser", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: "dark" })
  await page.goto("/")
  await page.getByRole("button", { name: "Menu" }).click()
  await page.getByRole("button", { name: "Appearance" }).click()
  const themes = page.getByRole("group", { name: "Appearance" })
  await themes.getByText("System", { exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
  await themes.getByText("Light", { exact: true }).click()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  await page.getByRole("button", { name: "Appearance" }).click()
  await page
    .getByRole("dialog", { name: "Navigation" })
    .getByRole("link", { name: "Process" })
    .click()
  await expect(page).toHaveURL(/\/process$/)
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light")
  expect(await page.evaluate(() => localStorage.getItem("brunova-theme"))).toBe(
    "light",
  )
})

test("mobile dialog traps interaction, exposes utilities and restores focus", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  const trigger = page.getByRole("button", { name: "Menu" })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: "Navigation" })
  await expect(dialog.getByRole("link", { name: "Capabilities" })).toBeFocused()
  await expect(dialog.getByRole("link", { name: "Portal" })).toBeVisible()
  await expect(
    dialog.getByRole("link", { name: "Start a conversation" }),
  ).toBeVisible()
  await expect(dialog.getByRole("group", { name: "Appearance" })).toHaveCount(0)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])

  const footerLink = page.getByRole("contentinfo").getByRole("link").first()
  await footerLink.focus()
  await expect(footerLink).not.toBeFocused()
  await page.keyboard.press("Escape")
  await expect(trigger).toBeFocused()

  await trigger.click()
  await dialog.getByRole("button", { name: "Close" }).click()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.mouse.click(10, 420)
  await expect(trigger).toBeFocused()
})

test("contact presents controlled rejected, unavailable and unexpected states", async ({
  page,
}) => {
  async function fillAndSubmit() {
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
    await page.getByRole("button", { name: "Send the context" }).click()
  }

  for (const fixture of [
    {
      status: 403,
      body: {
        ok: false,
        code: "REQUEST_REJECTED",
        message: "Controlled rejection",
      },
      expected: "This request could not be accepted.",
    },
    {
      status: 503,
      body: {
        ok: false,
        code: "SERVICE_UNAVAILABLE",
        message: "Controlled outage",
      },
      expected: "We couldn't send this right now.",
    },
  ]) {
    await page.route("**/api/contact", (route) =>
      route.fulfill({
        status: fixture.status,
        contentType: "application/json",
        body: JSON.stringify(fixture.body),
      }),
    )
    await page.goto("/contact")
    await fillAndSubmit()
    await expect(page.getByText(fixture.expected)).toBeVisible()
    await expect(page.getByLabel("Company")).toHaveValue("Analytical Engines")
    await page.unroute("**/api/contact")
  }

  await page.route("**/api/contact", (route) =>
    route.fulfill({ status: 500, contentType: "text/plain", body: "private" }),
  )
  await page.goto("/contact")
  await fillAndSubmit()
  await expect(
    page.getByText("We couldn't complete this request."),
  ).toBeVisible()
  await expect(page.getByText("private")).toHaveCount(0)
})

test("representative integrated navigation is console-clean and same-origin", async ({
  context,
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  const consoleFailures: string[] = []
  const pageFailures: string[] = []
  const externalOrigins = new Set<string>()
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      consoleFailures.push(message.text())
  })
  page.on("pageerror", (error) => pageFailures.push(error.message))
  page.on("request", (request) => {
    const url = new URL(request.url())
    if (url.hostname !== "127.0.0.1" && url.hostname !== "localhost")
      externalOrigins.add(url.origin)
  })

  await page.goto("/")
  await follow(page, "Capabilities")
  await page.locator(".selected-proof__record").first().click()
  await page.goto("/contact")
  await page.goto("/privacy")

  expect(consoleFailures).toEqual([])
  expect(pageFailures).toEqual([])
  expect([...externalOrigins]).toEqual([])
  expect(await context.cookies()).toEqual([])
})

for (const width of [390, 768, 1280, 1440]) {
  test(`representative whole-site surfaces reflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })
    for (const path of [
      "/",
      "/capabilities",
      "/process",
      "/work",
      `/work/${workCases[0].slug}`,
      "/about",
      "/contact",
      "/portal",
      "/privacy",
    ]) {
      await page.goto(path)
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        ),
        `${path} at ${width}`,
      ).toBeLessThanOrEqual(0)
    }
  })
}
