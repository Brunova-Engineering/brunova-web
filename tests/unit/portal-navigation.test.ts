// @vitest-environment node
import { expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { GET } from "@/app/(site)/portal/login/route"
import { proxy } from "@/proxy"
import { equivalentLocalePath } from "@/lib/i18n"
import { portalReturnCookie, validPortalReturn } from "@/lib/portal-navigation"
import { readPortalSession } from "@/lib/portal-session"
import { cookies } from "next/headers"
vi.mock("next/headers", () => ({ cookies: vi.fn() }))
vi.mock("@/lib/env", () => ({
  getSiteUrl: () => new URL("https://brunova.mx"),
}))
it.each(["en", "es"] as const)(
  "%s preserves the route locale through the existing Google endpoint",
  (locale) => {
    const response = GET(
      new NextRequest(
        `https://brunova.mx/portal/login?locale=${locale}&returnTo=https://evil.invalid`,
      ),
    )
    expect(response.headers.get("location")).toBe(
      "https://brunova.mx/api/acquisition/v1/auth/login",
    )
    const pending = response.cookies.get(portalReturnCookie)!
    expect(pending.value).toBe(
      locale === "es" ? "/es/portal/acquisition" : "/portal/acquisition",
    )
    expect(pending.httpOnly).toBe(true)
    const arrival = proxy(
      new NextRequest("https://brunova.mx/portal/acquisition", {
        headers: { cookie: `${portalReturnCookie}=${pending.value}` },
      }),
    )
    expect(arrival.headers.get("location")).toBe(
      locale === "es" ? "https://brunova.mx/es/portal/acquisition" : null,
    )
    expect(arrival.cookies.get(portalReturnCookie)?.maxAge).toBe(0)
    expect(equivalentLocalePath("/portal/acquisition", "es")).toBe(
      "/es/portal/acquisition",
    )
    expect(equivalentLocalePath("/es/portal/acquisition", "en")).toBe(
      "/portal/acquisition",
    )
  },
)
it("never accepts external, arbitrary or malformed auth return paths", () => {
  for (const input of [
    undefined,
    "https://evil.invalid",
    "//evil.invalid",
    "/admin",
    "/es/portal/acquisition?token=x",
  ])
    expect(validPortalReturn(input)).toBe("/portal/acquisition")
})
it("uses the canonical origin behind the production reverse proxy, never the internal or supplied Host", () => {
  const response = GET(
    new NextRequest("http://0.0.0.0:3000/portal/login?locale=es", {
      headers: { host: "evil.invalid" },
    }),
  )
  expect(response.headers.get("location")).toBe(
    "https://brunova.mx/api/acquisition/v1/auth/login",
  )
  const arrival = proxy(
    new NextRequest("http://0.0.0.0:3000/portal/acquisition", {
      headers: { cookie: `${portalReturnCookie}=/es/portal/acquisition` },
    }),
  )
  expect(arrival.headers.get("location")).toBe(
    "https://brunova.mx/es/portal/acquisition",
  )
})
it("SSR only trusts a valid backend session and never exposes the session cookie", async () => {
  vi.mocked(cookies).mockResolvedValue({
    get: () => ({
      name: "__Host-brunova_portal_session",
      value: "synthetic-cookie",
    }),
  } as never)
  const fetcher = vi.fn().mockResolvedValue(new Response("{}", { status: 401 }))
  vi.stubGlobal("fetch", fetcher)
  expect(await readPortalSession()).toEqual({
    session: null,
    unavailable: false,
  })
  expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
    cache: "no-store",
    headers: { cookie: "__Host-brunova_portal_session=synthetic-cookie" },
  })
  fetcher.mockResolvedValue(
    new Response(
      JSON.stringify({ actor: { capabilities: ["VIEW_ACQUISITION"] } }),
    ),
  )
  expect(await readPortalSession()).toEqual({
    session: null,
    unavailable: true,
  })
  vi.unstubAllGlobals()
})
