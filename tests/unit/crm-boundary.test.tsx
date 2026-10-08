import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { CrmBoundarySection } from "@/components/acquisition/crm-boundary"
import {
  acquisitionApi as api,
  type CrmBoundary,
  type PortalSession,
} from "@/lib/acquisition-api"
const session: PortalSession = {
  authenticated: true,
  actor: {
    email: "synthetic@brunova.mx",
    capabilities: ["VIEW_ACQUISITION", "MANAGE_CRM_BOUNDARY"],
  },
  csrfToken: "synthetic-csrf",
  expiresAt: "2026-09-06T23:59:00Z",
}
const row: CrmBoundary = {
  intent_id: "intent",
  status: "SYNCED",
  version: 3,
  reason: null,
  company_id: "101",
  contact_id: "202",
  company_name: "SYNTHETIC Company",
  contact_name: "SYNTHETIC Person",
  association_observed: true,
  authority: "ACQUISITION_PRE_HUMAN",
  handoffs: [
    {
      handoffId: "handoff",
      reason: "INTERESTED",
      status: "RECOMMENDED",
      accepted: false,
    },
  ],
}
afterEach(() => vi.restoreAllMocks())
it.each(["en", "es"] as const)(
  "bounded CRM/handoff inspection preserves %s meaning and no Deal/send action",
  async (locale) => {
    vi.spyOn(api, "crm").mockResolvedValue({ schemaVersion: "1", items: [row] })
    render(
      <CrmBoundarySection
        cycleId="c"
        accountId="a"
        session={session}
        locale={locale}
      />,
    )
    expect(await screen.findByText("SYNTHETIC Company")).toBeVisible()
    expect(screen.getByText("SYNTHETIC Person")).toBeVisible()
    expect(
      screen.getByText(
        locale === "es"
          ? "Listo para aceptación · Interés expresado"
          : "Ready for acceptance · Expressed interest",
      ),
    ).toBeVisible()
    expect(
      screen.getByRole("button", {
        name: locale === "es" ? "Aceptar handoff" : "Accept handoff",
      }),
    ).toBeDisabled()
    expect(
      screen.queryByRole("button", { name: /send|enviar|create deal/i }),
    ).not.toBeInTheDocument()
  },
)
it("uncertain Human retry keeps exact command identity and refreshes current truth", async () => {
  vi.spyOn(api, "crm").mockResolvedValue({ schemaVersion: "1", items: [row] })
  const command = vi
    .spyOn(api, "crmCommand")
    .mockRejectedValue(new Error("temporary"))
  render(
    <CrmBoundarySection
      cycleId="c"
      accountId="a"
      session={session}
      locale="en"
    />,
  )
  await screen.findByText("SYNTHETIC Company")
  fireEvent.change(screen.getByLabelText("Decision reason"), {
    target: { value: "Synthetic acceptance" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Accept handoff" }))
  await screen.findByRole("alert")
  fireEvent.click(screen.getByRole("button", { name: "Accept handoff" }))
  await waitFor(() => expect(command).toHaveBeenCalledTimes(2))
  expect(command.mock.calls[0]).toEqual(command.mock.calls[1])
  expect(command.mock.calls[0]?.[3]).toBe("synthetic-csrf")
})
it("unavailable CRM is not represented as not synced or successful", async () => {
  vi.spyOn(api, "crm").mockRejectedValue(new Error("unavailable"))
  render(
    <CrmBoundarySection
      cycleId="c"
      accountId="a"
      session={session}
      locale="en"
    />,
  )
  await screen.findByRole("alert")
  expect(screen.queryByText("No CRM sync recorded.")).not.toBeInTheDocument()
  expect(
    screen.queryByRole("button", { name: "Request controlled sync" }),
  ).not.toBeInTheDocument()
})
