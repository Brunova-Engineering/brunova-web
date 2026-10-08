import { expect, test } from "@playwright/test"

import { workCases } from "@/content/work"

const completeRoutes = [
  "/",
  "/capabilities",
  "/process",
  "/work",
  ...workCases.map((work) => `/work/${work.slug}`),
  "/about",
  "/contact",
  "/portal",
  "/privacy",
  "/phase-8-not-found",
  "/es",
  "/es/capabilities",
  "/es/process",
  "/es/work",
  ...workCases.map((work) => `/es/work/${work.slug}`),
  "/es/about",
  "/es/contact",
  "/es/portal",
  "/es/privacy",
  "/es/phase-8-not-found",
] as const

for (const width of [320, 375, 414, 768]) {
  test(`final visual surfaces satisfy Hallmark mobile gates at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 })

    for (const route of completeRoutes) {
      await page.goto(route)

      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - window.innerWidth,
        ),
        `${route} horizontal overflow`,
      ).toBeLessThanOrEqual(0)

      const unsafeDisplayHeadings = await page
        .locator("h1, h2, h3, h4, h5, h6")
        .evaluateAll((headings) =>
          headings
            .filter((heading) => {
              const style = getComputedStyle(heading)
              return (
                heading.getBoundingClientRect().width > 0 &&
                Number.parseFloat(style.fontSize) >= 24 &&
                (style.minWidth !== "0px" || style.overflowWrap !== "anywhere")
              )
            })
            .map((heading) => heading.textContent?.trim()),
        )
      expect(unsafeDisplayHeadings, `${route} display wrapping`).toEqual([])

      const wrappedAffordances = await page
        .locator("a, button, [role='button']")
        .evaluateAll((elements) =>
          elements
            .filter((element) => {
              const style = getComputedStyle(element)
              const text = element.textContent?.trim() ?? ""
              return (
                text.length > 0 &&
                style.display !== "none" &&
                element.getBoundingClientRect().width > 0 &&
                !element.matches(".selected-proof__record") &&
                style.whiteSpace !== "nowrap"
              )
            })
            .map((element) => element.textContent?.trim()),
        )
      expect(wrappedAffordances, `${route} clickable wrapping`).toEqual([])

      const unlabeledVisuals = await page
        .locator("main svg")
        .evaluateAll(
          (elements) =>
            elements.filter(
              (element) =>
                element.getBoundingClientRect().width > 0 &&
                !element.hasAttribute("aria-label") &&
                !element.hasAttribute("aria-labelledby") &&
                element.getAttribute("aria-hidden") !== "true",
            ).length,
        )
      expect(unlabeledVisuals, `${route} SVG semantics`).toBe(0)
    }
  })
}

test("homepage hero remains a complete deliberate 1280 by 800 composition", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto("/")

  const geometry = await page.evaluate(() => {
    const inner = document.querySelector<HTMLElement>(".home-hero__inner")
    const actions = document.querySelector<HTMLElement>(".home-hero__actions")
    const visual = document.querySelector<HTMLImageElement>(
      ".home-visual--hero .home-visual__asset",
    )
    if (!inner || !actions || !visual) throw new Error("Hero is incomplete")
    const style = getComputedStyle(inner)
    return {
      actionsBottom: actions.getBoundingClientRect().bottom,
      visualWidth: visual.naturalWidth,
      visualHeight: visual.naturalHeight,
      visualSource: visual.getAttribute("src"),
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingBottom: Number.parseFloat(style.paddingBottom),
    }
  })

  expect(geometry.actionsBottom).toBeLessThanOrEqual(800)
  expect(geometry.visualWidth).toBe(1440)
  expect(geometry.visualHeight).toBe(420)
  expect(geometry.visualSource).toBe("/brand/visuals/hero-operating-model.svg")
  expect(geometry.paddingBottom).toBeGreaterThanOrEqual(geometry.paddingTop)
})

test("transparent wordmarks remain wired and visible in both themes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 })

  for (const theme of ["light", "dark"] as const) {
    await page.goto("/")
    await page.evaluate((selectedTheme) => {
      localStorage.setItem("brunova-theme", selectedTheme)
    }, theme)
    await page.reload()
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
    const visibleLogos = page.locator(".brunova-logo img:visible")
    const expectedAsset =
      theme === "light"
        ? /brunova-wordmark-dark\.svg/
        : /brunova-wordmark-light\.svg/
    await expect(visibleLogos).toHaveCount(2)
    for (const logo of await visibleLogos.all()) {
      await expect(logo).toBeVisible()
      await expect(logo).toHaveAttribute("src", expectedAsset)
      await expect(logo).toHaveAttribute("width", "899")
      await expect(logo).toHaveAttribute("height", "181")
    }

    await expect(page.locator(".brunova-logo--header")).toHaveCSS(
      "background-color",
      "rgba(0, 0, 0, 0)",
    )
  }

  for (const asset of ["light", "dark"] as const) {
    const response = await page.request.get(
      `/brand/brunova-wordmark-${asset}.svg`,
    )
    const source = await response.text()

    expect(response.ok()).toBe(true)
    expect(source.match(/<path\b/g)).toHaveLength(7)
    // The approved vector uses a clipping rect; embedded raster and effects
    // remain prohibited.
    expect(source).not.toMatch(/<(?:image|text|filter|foreignObject)\b/)
  }
})
