import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ContactCadenceControl } from "@/components/acquisition/contact-cadence-control"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"

const session: PortalSession = {
  authenticated: true,
  actor: { email: "jorge@example.test", capabilities: ["MANAGE_CYCLE"] },
  csrfToken: "csrf-for-local-test",
  expiresAt: "2027-01-01T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

it("publishes reviewed cadence only for Management and never dispatches contact", async () => {
  const read = vi.spyOn(acquisitionApi, "candidateContactCadencePolicy").mockResolvedValue({
    cycleId: "cycle-one", version: "c7-cadence-v1", coverageStart: null, coverageEnd: null,
    closedDates: [], secondAfterFirstBusinessDays: 3, thirdAfterSecondBusinessDays: 5,
    closeAfterThirdBusinessDays: 7, policyReason: null, recordedAt: null,
  })
  const publish = vi.spyOn(acquisitionApi, "publishCandidateContactCadence").mockResolvedValue({
    status: "recorded", calendarId: "test-calendar", externalEffect: false,
  })
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value() { this.setAttribute("open", "") },
  })
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value() { this.removeAttribute("open") },
  })

  const { rerender } = render(<ContactCadenceControl cycleId="cycle-one" locale="es"
    session={{ ...session, actor: { ...session.actor, capabilities: [] } }} />)
  expect(screen.queryByRole("button", { name: "Cadencia" })).toBeNull()
  expect(read).not.toHaveBeenCalled()

  rerender(<ContactCadenceControl cycleId="cycle-one" locale="es" session={session} />)
  const open = await screen.findByRole("button", { name: "Cadencia" })
  await waitFor(() => expect(open).toBeEnabled())
  fireEvent.click(open)
  expect(screen.getByText("Publicar no envía mensajes.", { exact: false })).toBeVisible()
  fireEvent.change(screen.getByRole("spinbutton", { name: /Segundo intento/ }),
    { target: { value: "4" } })
  fireEvent.change(screen.getByRole("textbox", { name: "Motivo del cambio" }),
    { target: { value: "Ajuste de revisión aprobado para este ciclo." } })
  fireEvent.click(screen.getByRole("button", { name: "Publicar" }))
  await waitFor(() => expect(publish).toHaveBeenCalledOnce())
  const [commandId, body, csrf] = publish.mock.calls[0]!
  expect(commandId).toMatch(/^candidate-cadence-/)
  expect(body).toMatchObject({ cycleId: "cycle-one", secondAfterFirstBusinessDays: 4,
    thirdAfterSecondBusinessDays: 5, closeAfterThirdBusinessDays: 7,
    policyReason: "Ajuste de revisión aprobado para este ciclo." })
  expect(body.coverageStart).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(body.coverageEnd).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  expect(csrf).toBe(session.csrfToken)
})
