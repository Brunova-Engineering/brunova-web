import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ContactChannelPolicyControl } from "@/components/acquisition/contact-channel-policy-control"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"

const session: PortalSession = {
  authenticated: true,
  actor: { email: "jorge@example.test", capabilities: ["MANAGE_CYCLE"] },
  csrfToken: "local-csrf",
  expiresAt: "2027-01-01T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

it("lets Management publish reviewed channels for the next session without sending", async () => {
  const read = vi.spyOn(acquisitionApi, "candidateContactChannelPolicy").mockResolvedValue({
    cycleId: "cycle-one",
    baseline: { mandateId: "mandate-one", policyHash: "a".repeat(64),
      allowedChannels: ["EMAIL"], current: true },
    revisions: [],
  })
  const publish = vi.spyOn(acquisitionApi, "publishCandidateContactChannelPolicy")
    .mockResolvedValue({ status: "recorded", revisionId: "revision-one",
      policyHash: "b".repeat(64), allowedChannels: ["EMAIL", "FACEBOOK"],
      externalEffect: false })
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value() { this.setAttribute("open", "") },
  })
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value() { this.removeAttribute("open") },
  })
  const { rerender } = render(<ContactChannelPolicyControl cycleId="cycle-one"
    locale="es" session={{ ...session, actor: { ...session.actor, capabilities: [] } }} />)
  expect(screen.queryByRole("button", { name: "Revisar canales" })).toBeNull()
  expect(read).not.toHaveBeenCalled()

  rerender(<ContactChannelPolicyControl cycleId="cycle-one" locale="es" session={session} />)
  const open = await screen.findByRole("button", { name: "Revisar canales" })
  await waitFor(() => expect(open).toBeEnabled())
  fireEvent.click(open)
  expect(screen.getByText(/publicar no envía mensajes/i)).toBeVisible()
  fireEvent.click(screen.getByRole("checkbox", { name: "Facebook" }))
  fireEvent.change(screen.getByRole("textbox", { name: "Motivo de la revisión" }),
    { target: { value: "Jorge aprueba Facebook con control por envío exacto." } })
  fireEvent.click(screen.getByRole("button", { name: "Publicar" }))
  await waitFor(() => expect(publish).toHaveBeenCalledOnce())
  expect(publish.mock.calls[0]?.[1]).toMatchObject({
    cycleId: "cycle-one", expectedMandateId: "mandate-one",
    allowedChannels: ["EMAIL", "FACEBOOK"],
  })
  expect(publish.mock.calls[0]?.[2]).toBe(session.csrfToken)
})
