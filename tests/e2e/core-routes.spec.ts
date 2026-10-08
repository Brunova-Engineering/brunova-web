import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

const indexRoutes = [
  {
    path: "/capabilities",
    heading: "Engineering disciplines for operational systems.",
  },
  { path: "/process", heading: "Start with what you already know." },
  { path: "/work", heading: "Selected engineering experience." },
  { path: "/about", heading: "Where operations require engineering." },
  { path: "/portal", heading: "Brunova Portal" },
  { path: "/privacy", heading: "Privacy" },
] as const

const workRoutes = [
  {
    slug: "multi-tenant-financial-integration-platform",
    heading: "Shared access to financial operations across multiple entities",
  },
  {
    slug: "operational-finance-data-infrastructure",
    heading:
      "Financial reporting that updates from one shared source of information",
  },
  {
    slug: "document-intelligence-workflow",
    heading: "AI-assisted document processing with human review built in",
  },
  {
    slug: "fragile-automation-modernization",
    heading: "Critical automations made easier to operate, recover and change",
  },
] as const

test("core routes expose their approved content contracts", async ({
  page,
}) => {
  for (const route of indexRoutes) {
    const response = await page.goto(route.path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      route.heading,
    )
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`${route.path}$`),
    )
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1)
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary",
    )
  }

  await page.goto("/capabilities")
  await expect(page.locator(".capability-spread")).toHaveCount(5)

  await page.goto("/process")
  await expect(page.locator(".process-stage")).toHaveCount(4)
  await expect(page.getByText("Known problem", { exact: true })).toBeVisible()
  await expect(
    page.getByText("Defined architecture", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByText("Existing production system", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText("USD 999", { exact: true })).toBeVisible()
  await expect(page.getByText("From USD 1,999", { exact: true })).toBeVisible()
  await expect(page.getByText("From USD 2,999", { exact: true })).toBeVisible()
  await expect(
    page.getByText("From USD 1,999/month", { exact: true }),
  ).toBeVisible()
  await expect(page.getByText("3-month minimum", { exact: true })).toBeVisible()
  await expect(
    page.getByText(/produces a defined system problem/),
  ).toBeVisible()
  await expect(page.getByText(/USD 1,999–2,999/)).toHaveCount(0)
  await expect(page.getByText(/USD 2,999–7,999\+/)).toHaveCount(0)

  await page.goto("/work")
  await expect(page.locator(".work-folio article")).toHaveCount(4)
  await expect(page.locator(".work-record__link")).toHaveCount(4)
  await expect(page.getByText("View system", { exact: true })).toHaveCount(0)
  await expect(
    page.getByText(
      "A selection of systems designed and built through our founder’s prior engineering work on complex operational problems.",
    ),
  ).toBeVisible()
  await expect(page.getByText(/anonymized/i)).toHaveCount(0)
  await expect(
    page.getByText("Multi-entity Financial Operations Platform"),
  ).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    "A selection of systems from our founder's prior engineering work on complex operational problems.",
  )

  await page.goto("/portal")
  await expect(
    page.getByText("A secure workspace for the systems and operations available to you."),
  ).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /noindex/,
  )

  await page.goto("/contact")
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Start a conversation.",
  )
  await expect(page.locator("form")).toHaveCount(1)
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/contact$/,
  )
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /index, follow/,
  )
})

test("all four typed work routes progressively disclose technical depth", async ({
  page,
}) => {
  for (const work of workRoutes) {
    const response = await page.goto(`/work/${work.slug}`)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      work.heading,
    )
    const technicalDepth = page.locator(".case-technical")
    await expect(technicalDepth).not.toHaveAttribute("open", "")
    await expect(page.locator(".case-evidence__territory")).toHaveCount(3)
    const breadcrumb = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}",
    ) as { "@type": string; itemListElement: unknown[] }
    expect(breadcrumb["@type"]).toBe("BreadcrumbList")
    expect(breadcrumb.itemListElement).toHaveLength(2)
    await expect(
      page.getByRole("heading", { name: "What was happening" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "System approach" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "What changed" }),
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Key engineering decisions" }),
    ).toBeHidden()
    await technicalDepth.locator("summary").click()
    await expect(technicalDepth).toHaveAttribute("open", "")
    await expect(page.locator(".system-flow li")).toHaveCount(4)
    await expect(
      page.getByRole("heading", { name: "Key engineering decisions" }),
    ).toBeVisible()
  }
})

test("Spanish dossiers preserve the same progressive-disclosure hierarchy", async ({
  page,
}) => {
  await page.goto("/es/work/document-intelligence-workflow")
  await expect(page.getByRole("heading", { name: "Qué cambió" })).toBeVisible()
  const technicalDepth = page.locator(".case-technical")
  await expect(
    page.getByRole("heading", { name: "Decisiones clave de ingeniería" }),
  ).toBeHidden()
  await technicalDepth.locator("summary").focus()
  await expect(technicalDepth.locator("summary")).toBeFocused()
  await technicalDepth.locator("summary").press("Enter")
  await expect(technicalDepth).toHaveAttribute("open", "")
  await expect(
    page.getByRole("heading", { name: "Decisiones clave de ingeniería" }),
  ).toBeVisible()
})

test("system dossier wayfinding establishes active context and editorial continuation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/work/document-intelligence-workflow")

  const sectionNavigation = page.getByRole("navigation", {
    name: "On this system",
  })
  const overview = sectionNavigation.getByRole("link", {
    name: "Overview",
  })
  const technicalDetail = sectionNavigation.getByRole("link", {
    name: "Technical detail",
  })
  const relatedSystems = sectionNavigation.getByRole("link", {
    name: "Related systems",
  })

  await expect(overview).toHaveAttribute("aria-current", "location")
  await expect(
    sectionNavigation.getByRole("link", { name: "Situation", exact: true }),
  ).toHaveCount(0)
  await expect(
    sectionNavigation.getByRole("link", { name: "System", exact: true }),
  ).toHaveCount(0)
  await expect(
    sectionNavigation.getByRole("link", { name: "Result", exact: true }),
  ).toHaveCount(0)

  await technicalDetail.focus()
  await technicalDetail.press("Enter")
  await expect(page.locator("#technical-detail")).toHaveAttribute("open", "")
  await expect(technicalDetail).toHaveAttribute("aria-current", "location")
  await expect(page).toHaveURL(/#technical-detail$/)

  const headerBottom = await page
    .locator(".site-header")
    .evaluate((element) => element.getBoundingClientRect().bottom)
  const technicalTop = await page
    .locator("#technical-detail")
    .evaluate((element) => element.getBoundingClientRect().top)
  expect(technicalTop).toBeGreaterThanOrEqual(headerBottom)

  await page.locator("#technical-detail summary").click()
  await expect(page.locator("#technical-detail")).not.toHaveAttribute(
    "open",
    "",
  )
  await expect(overview).toHaveAttribute("aria-current", "location")
  await expect(page).toHaveURL(/#overview$/)

  const continuation = page.locator(".case-related")
  await expect(continuation.locator(".case-related__link")).toHaveCount(2)
  await expect(
    continuation.getByText("View system", { exact: true }),
  ).toHaveCount(0)

  await relatedSystems.click()
  await expect(relatedSystems).toHaveAttribute("aria-current", "location")
  await expect(page).toHaveURL(/#related-systems$/)
})

test("system dossier exposes supported context metadata in both locales", async ({
  page,
}) => {
  await page.goto("/work/operational-finance-data-infrastructure")
  const rail = page.locator(".case-dossier__index")

  await expect(
    rail.getByText("Operational Finance Data Infrastructure"),
  ).toBeVisible()
  await expect(rail.getByText("Operational reporting")).toBeVisible()
  await expect(
    rail.getByText("Financial reporting", { exact: true }),
  ).toBeVisible()
  await expect(
    rail.getByText("Data Engineering", { exact: true }),
  ).toBeVisible()

  await page.goto("/es/work/document-intelligence-workflow")
  const spanishRail = page.locator(".case-dossier__index")
  await expect(
    spanishRail.getByText("Procesamiento documental", { exact: true }),
  ).toBeVisible()
  await expect(
    spanishRail.getByText("Validación y revisión humana", { exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "En este sistema" }),
  ).toBeVisible()
})

test("technical-detail deep link opens disclosure and respects the sticky header", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await page.goto("/work/fragile-automation-modernization#technical-detail")

  const technicalDetail = page.locator("#technical-detail")
  await expect(technicalDetail).toHaveAttribute("open", "")
  await expect(
    page
      .getByRole("navigation", { name: "On this system" })
      .getByRole("link", { name: "Technical detail" }),
  ).toHaveAttribute("aria-current", "location")

  const headerBottom = await page
    .locator(".site-header")
    .evaluate((element) => element.getBoundingClientRect().bottom)
  const technicalTop = await technicalDetail.evaluate(
    (element) => element.getBoundingClientRect().top,
  )
  expect(technicalTop).toBeGreaterThanOrEqual(headerBottom)
})

for (const width of [320, 375, 390, 414, 768, 1024, 1280, 1440]) {
  for (const locale of [
    { prefix: "", navigation: "On this system", theme: "dark" },
    { prefix: "/es", navigation: "En este sistema", theme: "light" },
  ] as const) {
    test(`all ${locale.prefix || "EN"} dossiers expose the shared brief at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width < 768 ? 844 : 900 })
      await page.addInitScript((theme) => {
        window.localStorage.setItem("brunova-theme", theme)
      }, locale.theme)

      for (const work of workRoutes) {
        await page.goto(`${locale.prefix}/work/${work.slug}`)
        await expect(page.locator("html")).toHaveAttribute(
          "data-theme",
          locale.theme,
        )

        const rail = page.locator(".case-dossier__index")
        await expect(rail.locator("dt")).toHaveCount(3)
        await expect(
          page.getByRole("navigation", { name: locale.navigation }),
        ).toBeVisible()
        await expect(
          rail.locator(
            'a[href="#context"], a[href="#engineered-system"], a[href="#operational-capability"]',
          ),
        ).toHaveCount(0)

        const layout = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - window.innerWidth,
          railPosition: window.getComputedStyle(
            document.querySelector<HTMLElement>(".case-dossier__index")!,
          ).position,
        }))
        expect(
          layout.overflow,
          `${work.slug} overflow at ${width}px`,
        ).toBeLessThanOrEqual(0)
        expect(layout.railPosition).toBe(width >= 960 ? "sticky" : "static")
      }
    })
  }
}

test("capability index controls one expanded discipline and its semantic hash", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/capabilities")

  const architectureIndex = page
    .getByRole("navigation", { name: "Capability sections" })
    .getByRole("link", { name: /01 Architecture/ })
  const dataIndex = page
    .getByRole("navigation", { name: "Capability sections" })
    .getByRole("link", { name: /02 Data & integration/ })
  const architecture = page.locator("#systems-architecture")
  const data = page.locator("#data-integration")

  await expect(architectureIndex).toHaveAttribute("aria-expanded", "false")
  await architectureIndex.focus()
  await architectureIndex.press("Enter")
  await expect(architecture).toHaveAttribute("data-open", "true")
  await expect(architectureIndex).toHaveAttribute("aria-current", "location")
  await expect(page).toHaveURL(/#systems-architecture$/)
  await expect(
    architecture.getByRole("heading", { name: "The class of problem" }),
  ).toBeVisible()

  await dataIndex.click()
  await expect(architecture).not.toHaveAttribute("data-open", "true")
  await expect(data).toHaveAttribute("data-open", "true")
  await expect(dataIndex).toHaveAttribute("aria-current", "location")
  await expect(page).toHaveURL(/#data-integration$/)

  const headerBottom = await page
    .locator(".site-header")
    .evaluate((element) => element.getBoundingClientRect().bottom)
  const capabilityTop = await data.evaluate(
    (element) => element.getBoundingClientRect().top,
  )
  expect(capabilityTop).toBeGreaterThanOrEqual(headerBottom)

  await dataIndex.click()
  await expect(data).not.toHaveAttribute("data-open", "true")
  await expect(page).not.toHaveURL(/#data-integration$/)
})

test("valid capability hashes expand on load and preserve reduced motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/capabilities#data-integration")

  const data = page.locator("#data-integration")
  await expect(data).toHaveAttribute("data-open", "true")
  await expect(data.locator(".capability-spread__reveal")).toHaveCSS(
    "transition-duration",
    /(?:1e-05|0\.00001)s/,
  )
})

test("process stage navigation controls one expanded stage and its semantic hash", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/process")

  const stageNavigation = page.getByRole("navigation", {
    name: "Process stages",
  })
  const discoverLink = stageNavigation.getByRole("link", {
    name: /01 Discover Systems Discovery/,
  })
  const designLink = stageNavigation.getByRole("link", {
    name: /02 Design Architecture Blueprint/,
  })
  const discover = page.locator("#systems-discovery")
  const design = page.locator("#architecture-blueprint")

  await expect(discoverLink).toHaveAttribute("aria-expanded", "false")
  await discoverLink.focus()
  await discoverLink.press("Enter")
  await expect(discover).toHaveAttribute("data-open", "true")
  await expect(discoverLink).toHaveAttribute("aria-current", "step")
  await expect(page).toHaveURL(/#systems-discovery$/)
  await expect(
    discover.getByRole("heading", { name: "What you have" }),
  ).toBeVisible()
  await expect(discover.locator(".process-stage__territory")).toHaveCount(3)
  await expect(
    discover.getByRole("heading", { name: "What Brunova establishes" }),
  ).toBeVisible()
  await expect(
    discover.getByRole("heading", { name: "Resulting state" }),
  ).toBeVisible()

  await designLink.click()
  await expect(discover).not.toHaveAttribute("data-open", "true")
  await expect(design).toHaveAttribute("data-open", "true")
  await expect(designLink).toHaveAttribute("aria-current", "step")
  await expect(page).toHaveURL(/#architecture-blueprint$/)

  const headerBottom = await page
    .locator(".site-header")
    .evaluate((element) => element.getBoundingClientRect().bottom)
  const stageTop = await design.evaluate(
    (element) => element.getBoundingClientRect().top,
  )
  expect(stageTop).toBeGreaterThanOrEqual(headerBottom)

  await designLink.click()
  await expect(design).not.toHaveAttribute("data-open", "true")
  await expect(page).not.toHaveURL(/#architecture-blueprint$/)
})

test("process deep links, Spanish parity and reduced motion remain accessible", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/es/process#implementation-sprint")

  const implementation = page.locator("#implementation-sprint")
  await expect(implementation).toHaveAttribute("data-open", "true")
  await expect(
    implementation.getByRole("heading", { name: "Lo que ya tiene" }),
  ).toBeVisible()
  await expect(
    page
      .getByRole("navigation", { name: "Etapas del proceso" })
      .getByRole("link", { name: /03 Construir Sprint de implementación/ }),
  ).toHaveAttribute("aria-expanded", "true")
  await expect(implementation.locator(".process-stage__reveal")).toHaveCSS(
    "transition-duration",
    /(?:1e-05|0\.00001)s/,
  )

  const lateralEntry = page.locator(".entry-map")
  await expect(lateralEntry.getByText("Lo que ya tiene")).toBeVisible()
  await expect(lateralEntry.getByText("Entrar en")).toBeVisible()
  await expect(lateralEntry.getByRole("link")).toHaveCount(0)
  await expect(lateralEntry.getByRole("button")).toHaveCount(0)
  await expect(lateralEntry.locator("dd").first()).toHaveCSS(
    "cursor",
    "default",
  )
})

test("global back-to-top appears after a useful scroll distance in both locales", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 700 })
  await page.goto("/capabilities")
  const backToTop = page.getByRole("button", { name: "Back to top" })
  await expect(backToTop).not.toHaveAttribute("data-visible", "true")

  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
  await expect(backToTop).toHaveAttribute("data-visible", "true")
  await backToTop.press("Enter")
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(8)

  await page.goto("/es/capabilities#systems-architecture")
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 1.5))
  await expect(
    page.getByRole("button", { name: "Volver arriba" }),
  ).toHaveAttribute("data-visible", "true")
})

test("an unknown work slug returns the branded not-found state", async ({
  page,
}) => {
  const response = await page.goto("/work/not-an-approved-system")
  expect(response?.status()).toBe(404)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Page not found.",
  )
  await expect(
    page.getByRole("link", { name: "Return to Brunova" }),
  ).toHaveAttribute("href", "/")
})

for (const theme of ["light", "dark"] as const) {
  for (const path of [
    "/capabilities",
    "/process",
    "/work/document-intelligence-workflow",
    "/about",
    "/portal",
    "/privacy",
  ]) {
    test(`${path} has no detectable accessibility violations in ${theme} mode`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 900 })
      await page.addInitScript((selectedTheme) => {
        window.localStorage.setItem("brunova-theme", selectedTheme)
      }, theme)
      await page.goto(path)
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme)

      const accessibility = await new AxeBuilder({ page }).analyze()
      expect(accessibility.violations).toEqual([])
    })
  }
}

for (const width of [320, 375, 390, 414, 768, 1024, 1280, 1440, 1920]) {
  test(`Phase 4 routes recompose without overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    const paths = [
      ...indexRoutes.map((route) => route.path),
      "/work/document-intelligence-workflow",
      "/contact",
    ]

    for (const path of paths) {
      await page.goto(path)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(overflow, `${path} overflow at ${width}px`).toBeLessThanOrEqual(0)
    }
  })
}

test("representative routes preserve focus and 400-percent-equivalent reflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 })

  for (const path of [
    "/capabilities",
    "/process",
    "/work/document-intelligence-workflow",
    "/about",
    "/portal",
    "/privacy",
  ]) {
    await page.goto(path)
    const firstMainLink = page.getByRole("main").getByRole("link").first()
    if ((await firstMainLink.count()) > 0) {
      await firstMainLink.focus()
      await expect(firstMainLink).toBeFocused()
      expect(
        await firstMainLink.evaluate(
          (element) => window.getComputedStyle(element).outlineStyle,
        ),
      ).not.toBe("none")
    }

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)
  }
})
