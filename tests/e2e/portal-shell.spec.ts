import { expect, test } from "@playwright/test"

test("authenticated Portal uses only its focused workspace shell", async ({
  page,
}) => {
  for (const path of ["/portal", "/es/portal"]) {
    await page.goto(path)
    await expect(page.locator(".site-header")).toBeVisible()

    // Exercise the server-derived authenticated style without creating a login.
    await page.locator("main.portal-page").evaluate((main) => {
      main.setAttribute("data-authenticated", "true")
    })

    await expect(page.locator(".site-header")).toBeHidden()
    await expect(page.locator(".site-footer")).toBeHidden()
    await expect(page.locator(".site-utilities--shell")).toBeHidden()
    await expect(page.locator(".back-to-top")).toBeHidden()
  }
})
