import AxeBuilder from "@axe-core/playwright"
import { expect, test } from "@playwright/test"

test("site shell and health endpoint are operational", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto("/")

  await expect(
    page.getByRole("heading", {
      name: "Systems for operations that have outgrown their tools.",
    }),
  ).toBeVisible()
  await expect(
    page.getByRole("navigation", { name: "Primary navigation" }),
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "Capabilities" }).first(),
  ).toHaveAttribute("href", "/capabilities")
  await expect(
    page.getByRole("link", { name: "Start a conversation" }).first(),
  ).toHaveAttribute("href", "/contact")
  await page.getByRole("button", { name: "Appearance" }).click()
  const themeControl = page.getByRole("group", { name: "Appearance" })
  await expect(
    themeControl.getByRole("radio", { name: "System" }),
  ).toBeEnabled()

  const health = await page.request.get("/api/health")
  expect(health.status()).toBe(200)
  await expect(health.json()).resolves.toEqual({ status: "ok" })

  const accessibility = await new AxeBuilder({ page }).analyze()
  expect(accessibility.violations).toEqual([])
})

test("the approved Brunova mark is published as the browser icon", async ({
  page,
}) => {
  await page.goto("/")

  const icon = page.locator('link[rel="icon"][type="image/svg+xml"]')
  await expect(icon).toHaveAttribute("type", "image/svg+xml")
  await expect(icon).toHaveAttribute("href", "/brand/brunova-mark.svg")

  const response = await page.request.get("/brand/brunova-mark.svg")
  expect(response.status()).toBe(200)
  expect(response.headers()["content-type"]).toContain("image/svg+xml")
  const svg = await response.text()
  expect(svg).toContain('viewBox="0 0 181 181"')
  expect(svg).toContain("<path")
  expect(svg).not.toMatch(/<(?:image|filter)\b/i)

  const fallback = await page.request.get("/favicon.ico")
  expect(fallback.status()).toBe(200)
  expect(fallback.headers()["content-type"]).toContain("image/x-icon")
})

test("Brunova SVG logos stay raster-free and preserve brand geometry", async ({
  page,
}) => {
  const assets = [
    {
      path: "/brand/brunova-mark.svg",
      viewBox: "0 0 181 181",
      paths: 1,
      colors: ["#14110e", "#eeeae5"],
    },
    {
      path: "/brand/brunova-wordmark-dark.svg",
      viewBox: "0 0 898.869449 180.770293",
      paths: 7,
      colors: ["#14110e"],
    },
    {
      path: "/brand/brunova-wordmark-light.svg",
      viewBox: "0 0 898.869449 180.770293",
      paths: 7,
      colors: ["#eeeae5"],
    },
  ]

  for (const asset of assets) {
    const response = await page.request.get(asset.path)
    expect(response.status()).toBe(200)
    const svg = await response.text()

    expect(svg).toContain(`viewBox="${asset.viewBox}"`)
    expect(svg.match(/<path\b/g)).toHaveLength(asset.paths)
    expect(svg).not.toMatch(/<(?:image|filter|foreignObject)\b/i)
    expect(svg).not.toContain("data:image/")
    for (const color of asset.colors) {
      expect(svg.toLowerCase()).toContain(color)
    }
  }

  await page.setViewportSize({ width: 1600, height: 900 })
  await page.goto("/")
  await page.setContent(`
    <style>body { margin: 0 } img { display: block; width: 899px; height: auto }</style>
    <img src="/brand/brunova-wordmark-dark.svg" alt="" />
  `)
  const logo = page.locator("img")
  await logo.evaluate((image: HTMLImageElement) => image.decode())
  const geometry = await logo.evaluate((image) => {
    const bounds = image.getBoundingClientRect()
    return { width: bounds.width, height: bounds.height }
  })
  expect(geometry.width).toBeCloseTo(899, 1)
  expect(geometry.height).toBeCloseTo((180.770293 * 899) / 898.869449, 1)
})

test("high-resolution Brunova PNG exports retain their native dimensions", async ({
  page,
}) => {
  const assets = [
    { path: "/brand/brunova-mark-4096.png", width: 4096, height: 4096 },
    {
      path: "/brand/brunova-wordmark-dark-8192.png",
      width: 8192,
      height: 1647,
    },
    {
      path: "/brand/brunova-wordmark-light-8192.png",
      width: 8192,
      height: 1647,
    },
  ]

  for (const asset of assets) {
    const response = await page.request.get(asset.path)
    expect(response.status()).toBe(200)
    expect(response.headers()["content-type"]).toContain("image/png")
  }

  await page.goto("/")
  const dimensions = await page.evaluate(async (pngAssets) => {
    return Promise.all(
      pngAssets.map(
        (asset) =>
          new Promise<{ width: number; height: number }>((resolve, reject) => {
            const image = new Image()
            image.onload = () =>
              resolve({
                width: image.naturalWidth,
                height: image.naturalHeight,
              })
            image.onerror = reject
            image.src = asset.path
          }),
      ),
    )
  }, assets)

  expect(dimensions).toEqual(
    assets.map(({ width, height }) => ({ width, height })),
  )
})

test("explicit theme preference persists", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 800 })
  await page.goto("/")
  await page.getByRole("button", { name: "Appearance" }).click()
  const themeControl = page.getByRole("group", { name: "Appearance" })
  await themeControl.getByText("Dark", { exact: true }).click()
  const darkOption = themeControl.getByRole("radio", { name: "Dark" })
  await expect(darkOption).toBeChecked()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")

  await darkOption.focus()
  await page.keyboard.press("ArrowLeft")
  await expect(themeControl.getByRole("radio", { name: "Light" })).toBeChecked()
  await page.keyboard.press("ArrowRight")
  await expect(darkOption).toBeChecked()

  await page.reload()
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark")
})

for (const width of [1280, 1440]) {
  test(`desktop header is a balanced single-row brand rail at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/")

    const layout = await page.locator(".site-header").evaluate((header) => {
      const bar = header.querySelector<HTMLElement>(".site-header__bar")
      const navigation = header.querySelector<HTMLElement>(
        ".desktop-navigation",
      )
      const logo = header.querySelector<HTMLElement>(".brunova-logo--header")
      const logoImage = [
        ...(logo?.querySelectorAll<HTMLImageElement>("img") ?? []),
      ].find((image) => getComputedStyle(image).display !== "none")
      const visibleItems = bar
        ? [...bar.children].filter(
            (item) => getComputedStyle(item).display !== "none",
          )
        : []
      const centers = visibleItems.map((item) => {
        const rect = item.getBoundingClientRect()
        return rect.y + rect.height / 2
      })
      const navigationRect = navigation?.getBoundingClientRect()
      const logoRect = logo?.getBoundingClientRect()
      const logoImageRect = logoImage?.getBoundingClientRect()

      return {
        centerDelta: Math.max(...centers) - Math.min(...centers),
        height: header.getBoundingClientRect().height,
        logoInsetBlock:
          logoRect && logoImageRect
            ? logoRect.height - logoImageRect.height
            : 0,
        logoInsetInline:
          logoRect && logoImageRect ? logoRect.width - logoImageRect.width : 0,
        navigationCenterDelta: navigationRect
          ? Math.abs(
              navigationRect.left + navigationRect.width / 2 - innerWidth / 2,
            )
          : Number.POSITIVE_INFINITY,
      }
    })

    if (width === 1280) {
      // The approved intermediate layout uses the compact navigation rail.
      expect(layout.height).toBeGreaterThanOrEqual(64)
      expect(layout.height).toBeLessThanOrEqual(76)
      await expect(page.getByRole("button", { name: "Menu" })).toBeVisible()
    } else {
      expect(layout.height).toBeGreaterThanOrEqual(80)
      expect(layout.height).toBeLessThanOrEqual(88)
      expect(layout.navigationCenterDelta).toBeLessThanOrEqual(1)
    }
    expect(layout.centerDelta).toBeLessThanOrEqual(1)
    expect(layout.logoInsetBlock).toBeLessThanOrEqual(1)
    expect(layout.logoInsetInline).toBeLessThanOrEqual(1)

    await page.evaluate(() => window.scrollTo(0, 700))
    await expect
      .poll(() =>
        page
          .locator(".site-header")
          .evaluate((header) => Math.round(header.getBoundingClientRect().top)),
      )
      .toBe(0)
  })
}

for (const width of [375, 390]) {
  test(`mobile header preserves its navigation behavior at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.goto("/")

    await expect(page.locator(".desktop-navigation")).toBeHidden()
    await expect(page.locator(".site-header__utilities")).toBeHidden()
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible()
    await expect(page.locator(".brunova-logo--header")).toBeVisible()
    await expect(page.locator(".site-header")).toHaveCSS("position", "sticky")

    const height = await page
      .locator(".site-header")
      .evaluate((header) => header.getBoundingClientRect().height)
    expect(height).toBeLessThanOrEqual(80)
  })
}

test("mobile navigation manages focus, Escape, explicit close, and backdrop", async ({
  page,
}) => {
  await page.setViewportSize({ width: 768, height: 900 })
  await page.goto("/")

  const trigger = page.getByRole("button", { name: "Menu" })
  await trigger.click()
  const dialog = page.getByRole("dialog", { name: "Navigation" })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole("link", { name: "Capabilities" })).toBeFocused()

  const openAccessibility = await new AxeBuilder({ page }).analyze()
  expect(openAccessibility.violations).toEqual([])

  await page.keyboard.press("Escape")
  await expect(
    page.getByRole("dialog", { name: "Navigation" }),
  ).not.toBeVisible()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.getByRole("button", { name: "Close" }).click()
  await expect(trigger).toBeFocused()

  await trigger.click()
  await page.mouse.click(40, 450)
  await expect(
    page.getByRole("dialog", { name: "Navigation" }),
  ).not.toBeVisible()
})

for (const width of [320, 375, 390, 414, 768, 960, 1024, 1280, 1440, 1920]) {
  test(`shell has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/")

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )
    expect(overflow).toBeLessThanOrEqual(0)

    if (width <= 768) {
      await page.getByRole("button", { name: "Menu" }).click()
      await expect(
        page.getByRole("dialog", { name: "Navigation" }),
      ).toBeVisible()
      const menuOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      )
      expect(menuOverflow).toBeLessThanOrEqual(0)
    }
  })
}

test("first-touch attribution avoids browser storage", async ({ page }) => {
  await page.goto("/?utm_source=architecture-review&utm_medium=referral")

  expect(
    await page.evaluate(() =>
      [
        ...Object.keys(window.localStorage),
        ...Object.keys(window.sessionStorage),
      ].filter((key) => key.startsWith("brunova:first-touch-attribution")),
    ),
  ).toEqual([])
})
