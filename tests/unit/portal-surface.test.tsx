import { render, screen, cleanup } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { PortalPageView } from "@/components/pages/portal-page"
import { AcquisitionPageView } from "@/components/acquisition/page-view"
import { readPortalSession } from "@/lib/portal-session"
import type { PortalSession } from "@/lib/acquisition-api"
vi.mock("@/lib/portal-session", () => ({ readPortalSession: vi.fn() }))
vi.mock("next/navigation", () => ({
  redirect: (path: string) => {
    throw new Error(`redirect:${path}`)
  },
}))
const session: PortalSession = {
  authenticated: true,
  actor: { email: "synthetic@brunova.mx", capabilities: ["VIEW_ACQUISITION"] },
  csrfToken: "synthetic",
  expiresAt: "2026-09-06T00:00:00Z",
}
afterEach(cleanup)
it.each(["en", "es"] as const)(
  "%s Portal is neutral, server capability-aware and localized",
  (locale) => {
    const es = locale === "es"
    const { rerender, container } = render(
      <PortalPageView locale={locale} session={session} />,
    )
    expect(
      screen.getByRole("heading", {
        name: es ? "Portal Brunova" : "Brunova Portal",
      }),
    ).toBeVisible()
    expect(
      screen.getByRole("link", {
        name: es ? "Adquisición" : "Acquisition",
      }),
    ).toHaveAttribute(
      "href",
      es ? "/es/portal/acquisition" : "/portal/acquisition",
    )
    expect(container.querySelector("main")).toHaveAttribute(
      "data-authenticated",
      "true",
    )
    expect(container.querySelectorAll("main a")).toHaveLength(1)
    expect(
      screen.getByRole("button", { name: es ? "Cerrar sesión" : "Logout" }),
    ).toBeVisible()
    expect(container.textContent).not.toMatch(
      /active clients|clientes activos|Client Portal|Portal de Clientes/,
    )
    expect(container.textContent).not.toContain(
      es ? "Operational access" : "Acceso operativo",
    )
    rerender(
      <PortalPageView
        locale={locale}
        session={{
          ...session,
          actor: { ...session.actor, capabilities: ["VIEW_HEALTH"] },
        }}
      />,
    )
    expect(container.querySelector('a[href$="/portal/acquisition"]')).toBeNull()
    expect(container.textContent).not.toContain("Brunova Acquisition Engine")
    rerender(<PortalPageView locale={locale} session={null} />)
    expect(
      screen.getByRole("link", {
        name: es ? "Continuar con Google" : "Continue with Google",
      }),
    ).toHaveAttribute("href", `/portal/login?locale=${locale}`)
    expect(container.querySelector('a[href$="/portal/acquisition"]')).toBeNull()
  },
)
it.each(["en", "es"] as const)(
  "%s direct Acquisition access enforces server identity/capability before rendering",
  async (locale) => {
    vi.mocked(readPortalSession).mockResolvedValue({
      session: null,
      unavailable: false,
    })
    await expect(AcquisitionPageView({ locale })).rejects.toThrow(
      `redirect:${locale === "es" ? "/es" : "/"}`,
    )
    vi.mocked(readPortalSession).mockResolvedValue({
      session: {
        ...session,
        actor: { ...session.actor, capabilities: ["VIEW_HEALTH"] },
      },
      unavailable: false,
    })
    const { container } = render(await AcquisitionPageView({ locale }))
    expect(
      screen.getByRole("heading", {
        name: locale === "es" ? "Acceso restringido" : "Access restricted",
      }),
    ).toBeVisible()
    expect(container.querySelector(".acq-metrics")).toBeNull()
    expect(container.textContent).not.toContain(session.csrfToken)
  },
)
it("session failure does not imply authorization or leak details", async () => {
  vi.mocked(readPortalSession).mockResolvedValue({
    session: null,
    unavailable: true,
  })
  render(await AcquisitionPageView({ locale: "en" }))
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Your session could not be verified",
  )
})
