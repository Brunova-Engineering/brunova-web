import AxeBuilder from "@axe-core/playwright"
import { expect, test, type Page } from "@playwright/test"

async function fillContactForm(page: Page) {
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

test("contact route renders the production conversion contract", async ({
  page,
}) => {
  const response = await page.goto("/contact")
  expect(response?.status()).toBe(200)
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Start a conversation.",
  )
  await expect(page.getByRole("textbox", { name: "Name" })).toBeVisible()
  await expect(page.getByLabel("Problem category")).toHaveCount(1)
  await expect(
    page.getByRole("button", { name: "Send the context" }),
  ).toBeVisible()
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    "content",
    /index, follow/,
  )
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    /\/contact$/,
  )
  await expect(page.getByRole("region", { name: "Privacy" })).toContainText(
    "Calle Poniente 1 #16, Centro, 94730 Río Blanco, Veracruz, Mexico.",
  )
  await expect(
    page.getByRole("link", { name: "Full Privacy Notice" }),
  ).toHaveAttribute("href", "/privacy")
})

test("Spanish contact route presents the equivalent visible privacy notice", async ({
  page,
}) => {
  await page.goto("/es/contact")

  const privacy = page.getByRole("region", { name: "Privacidad" })
  await expect(privacy).toContainText(
    "Calle Poniente 1 #16, Centro, C.P. 94730, Río Blanco, Veracruz, México.",
  )
  await expect(privacy).toContainText(
    "No existen finalidades secundarias de marketing.",
  )
  await expect(
    page.getByRole("link", { name: "Aviso de Privacidad completo" }),
  ).toHaveAttribute("href", "/es/privacy")
})

test("desktop expectations align with the operation section", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 })
  await page.goto("/contact")

  const expectationsTop = await page
    .locator(".contact-expectations strong")
    .first()
    .evaluate((element) => element.getBoundingClientRect().top)
  const operationTop = await page
    .getByText("The operation", { exact: true })
    .evaluate((element) => element.getBoundingClientRect().top)

  expect(Math.abs(expectationsTop - operationTop)).toBeLessThanOrEqual(4)
})

test("contact form supports ordered keyboard completion", async ({ page }) => {
  await page.goto("/contact")
  await page.getByLabel("Name").focus()
  await page.keyboard.type("Ada Lovelace")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Work email")).toBeFocused()
  await page.keyboard.type("ada@example.com")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Company")).toBeFocused()
  await page.keyboard.type("Analytical Engines")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Role")).toBeFocused()
  await page.keyboard.type("Chief Operating Officer")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Problem category")).toBeFocused()
  await page.getByLabel("Problem category").selectOption("fragmented_systems")
  await page.keyboard.press("Tab")
  await expect(page.getByLabel("Problem description")).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("button", { name: "Send the context" }),
  ).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("link", { name: "brunova@brunova.mx" }),
  ).toBeFocused()
  await page.keyboard.press("Tab")
  await expect(
    page.getByRole("link", { name: "Full Privacy Notice" }),
  ).toBeFocused()
})

test("client validation retains stable error associations", async ({
  page,
}) => {
  await page.goto("/contact")
  await page.getByRole("button", { name: "Send the context" }).click()

  await expect(page.getByLabel("Name")).toBeFocused()
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true")
  await expect(page.getByLabel("Name")).toHaveAttribute(
    "aria-describedby",
    "name-description",
  )
  await expect(page.locator("#name-description")).toContainText(
    "Enter your name",
  )
})

test("successful submission includes first-touch UTM and browser idempotency", async ({
  page,
}) => {
  let requestBody: Record<string, unknown> | undefined
  let idempotencyKey = ""

  await page.route("**/api/contact", async (route) => {
    requestBody = route.request().postDataJSON() as Record<string, unknown>
    idempotencyKey = route.request().headers()["idempotency-key"] ?? ""
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    })
  })

  await page.goto(
    "/process?utm_source=architecture-review&utm_medium=referral&utm_campaign=br-017",
    { referer: "https://chatgpt.com/" },
  )
  await page.locator('a[href="/contact"]:visible').first().click()
  await fillContactForm(page)
  await page.getByRole("button", { name: "Send the context" }).click()

  await expect(
    page.getByRole("heading", { name: "Thanks. We received your note." }),
  ).toBeVisible()
  await expect(page.locator('.contact-result[role="status"]')).toBeFocused()
  expect(idempotencyKey).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  )
  expect(requestBody?.utm).toEqual({
    source: "architecture-review",
    medium: "referral",
    campaign: "br-017",
    term: null,
    content: null,
  })
  expect(requestBody).not.toHaveProperty("firstTouch")
})

test("recoverable retry preserves content and key until a material edit", async ({
  page,
}) => {
  const keys: string[] = []
  let attempt = 0
  await page.route("**/api/contact", async (route) => {
    attempt += 1
    keys.push(route.request().headers()["idempotency-key"] ?? "")
    const ok = attempt === 3
    await route.fulfill({
      status: ok ? 200 : 503,
      contentType: "application/json",
      body: JSON.stringify(
        ok
          ? { ok: true }
          : {
              ok: false,
              code: "SERVICE_UNAVAILABLE",
              message: "Controlled failure",
            },
      ),
    })
  })

  await page.goto("/contact")
  await fillContactForm(page)
  await page.getByRole("button", { name: "Send the context" }).click()
  await expect(page.getByText("We couldn't send this right now.")).toBeVisible()
  await expect(page.locator('.contact-result[role="status"]')).toBeFocused()
  await expect(page.getByLabel("Name")).toHaveValue("Ada Lovelace")

  await page.getByRole("button", { name: "Send the context" }).click()
  await expect.poll(() => keys.length).toBe(2)
  expect(keys[1]).toBe(keys[0])

  await page
    .getByLabel("Problem description")
    .fill(
      "Our operating data is fragmented across systems, manual handoffs and duplicate reconciliation.",
    )
  await page.getByRole("button", { name: "Send the context" }).click()
  await expect(
    page.getByRole("heading", { name: "Thanks. We received your note." }),
  ).toBeVisible()
  expect(keys[2]).not.toBe(keys[1])
})

test("network and rate-limit failures remain calm and preserve context", async ({
  page,
}) => {
  await page.route("**/api/contact", (route) => route.abort("failed"))
  await page.goto("/contact")
  await fillContactForm(page)
  await page.getByRole("button", { name: "Send the context" }).click()
  await expect(page.getByText("The connection was interrupted.")).toBeVisible()
  await expect(page.getByLabel("Company")).toHaveValue("Analytical Engines")

  await page.unroute("**/api/contact")
  await page.route("**/api/contact", async (route) => {
    await route.fulfill({
      status: 429,
      contentType: "application/json",
      headers: { "Retry-After": "900" },
      body: JSON.stringify({
        ok: false,
        code: "RATE_LIMITED",
        message: "Controlled limit",
      }),
    })
  })
  await page.getByRole("button", { name: "Send the context" }).click()
  await expect(page.getByText("Please wait before trying again.")).toBeVisible()
  await expect(page.locator('.contact-result[role="status"]')).toBeFocused()
})

test("submitting state is announced without replacing the form", async ({
  page,
}) => {
  await page.route("**/api/contact", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    })
  })

  await page.goto("/contact")
  await fillContactForm(page)
  await page.getByRole("button", { name: "Send the context" }).click()

  await expect(page.locator("form")).toHaveAttribute("aria-busy", "true")
  await expect(page.getByText("Sending your information.")).toBeAttached()
  await expect(page.getByLabel("Name")).toHaveValue("Ada Lovelace")
})

for (const theme of ["light", "dark"] as const) {
  test(`contact route passes axe in ${theme} mode`, async ({ page }) => {
    await page.addInitScript((selectedTheme) => {
      window.localStorage.setItem("brunova-theme", selectedTheme)
    }, theme)
    await page.goto("/contact")
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme)
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  })
}

for (const width of [320, 375, 390, 414, 768]) {
  test(`contact conversation has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto("/contact")
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      ),
    ).toBeLessThanOrEqual(0)
  })
}
