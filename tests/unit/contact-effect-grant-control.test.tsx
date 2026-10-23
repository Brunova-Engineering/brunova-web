import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, expect, it, vi } from "vitest"
import { ContactEffectGrantControl } from "@/components/acquisition/contact-effect-grant-control"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"

const session: PortalSession = {
  authenticated: true,
  actor: { email: "jorge@example.test", capabilities: ["MANAGE_CYCLE"] },
  csrfToken: "local-csrf",
  expiresAt: "2027-01-01T00:00:00Z",
}

afterEach(() => vi.restoreAllMocks())

it("keeps grant selection bounded by the channel policy and sends nothing", async () => {
  vi.spyOn(acquisitionApi, "candidateContactChannelPolicy").mockResolvedValue({
    cycleId: "cycle-one", baseline: { mandateId: "mandate-one",
      policyHash: "a".repeat(64), allowedChannels: ["EMAIL"], current: true },
    revisions: [],
  })
  vi.spyOn(acquisitionApi, "candidateContactEffectGrants").mockResolvedValue({
    cycleId: "cycle-one", grants: [],
  })
  const publish = vi.spyOn(acquisitionApi, "publishCandidateContactEffectGrant")
    .mockResolvedValue({ status: "recorded", grantId: "grant-one",
      policyHash: "b".repeat(64), effectKind: "SEND_EMAIL",
      providerAccountId: "brunova-mail", externalEffect: false })
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value() { this.setAttribute("open", "") },
  })
  Object.defineProperty(HTMLDialogElement.prototype, "close", {
    configurable: true, value() { this.removeAttribute("open") },
  })
  const { rerender } = render(<ContactEffectGrantControl cycleId="cycle-one" locale="es"
    session={{ ...session, actor: { ...session.actor, capabilities: [] } }} />)
  expect(screen.queryByRole("button", { name: "Revisar permisos" })).toBeNull()
  rerender(<ContactEffectGrantControl cycleId="cycle-one" locale="es" session={session} />)
  const open = await screen.findByRole("button", { name: "Revisar permisos" })
  await waitFor(() => expect(open).toBeEnabled())
  fireEvent.click(open)
  expect(screen.queryByRole("option", { name: "Facebook" })).toBeNull()
  expect(screen.getByText(/no envía mensajes ni activa un adaptador/i)).toBeVisible()
  fireEvent.change(screen.getByRole("textbox", { name: "Identificador del remitente configurado" }),
    { target: { value: "brunova-mail" } })
  fireEvent.change(screen.getByRole("textbox", { name: "Motivo del permiso" }),
    { target: { value: "Jorge autoriza el remitente de correo para el efecto exacto." } })
  fireEvent.click(screen.getByRole("button", { name: "Registrar permiso" }))
  await waitFor(() => expect(publish).toHaveBeenCalledOnce())
  expect(publish.mock.calls[0]?.[1]).toMatchObject({
    cycleId: "cycle-one", expectedMandateId: "mandate-one",
    effectKind: "SEND_EMAIL", providerAccountId: "brunova-mail",
  })
  expect(publish.mock.calls[0]?.[2]).toBe(session.csrfToken)
})

it("requires the exact Brunova Chrome sender for a social grant", async () => {
  vi.spyOn(acquisitionApi, "candidateContactChannelPolicy").mockResolvedValue({
    cycleId: "cycle-one", baseline: { mandateId: "mandate-one",
      policyHash: "a".repeat(64), allowedChannels: ["EMAIL", "FACEBOOK"], current: true },
    revisions: [],
  })
  vi.spyOn(acquisitionApi, "candidateContactEffectGrants").mockResolvedValue({
    cycleId: "cycle-one", grants: [],
  })
  const publish = vi.spyOn(acquisitionApi, "publishCandidateContactEffectGrant")
    .mockResolvedValue({ status: "recorded", grantId: "grant-facebook",
      policyHash: "b".repeat(64), externalEffect: false })
  Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
    configurable: true, value() { this.setAttribute("open", "") },
  })
  render(<ContactEffectGrantControl cycleId="cycle-one" locale="es" session={session} />)
  const open = await screen.findByRole("button", { name: "Revisar permisos" })
  await waitFor(() => expect(open).toBeEnabled())
  fireEvent.click(open)
  fireEvent.change(screen.getByRole("combobox", { name: "Acción permitida" }),
    { target: { value: "SEND_FACEBOOK" } })
  fireEvent.change(screen.getByRole("textbox", { name: "Identificador del remitente configurado" }),
    { target: { value: "jorge-facebook" } })
  fireEvent.change(screen.getByRole("textbox", { name: "Motivo del permiso" }),
    { target: { value: "Jorge confirma el perfil de Facebook desde Chrome de Brunova." } })
  const button = screen.getByRole("button", { name: "Registrar permiso" })
  expect(button).toBeDisabled()
  fireEvent.change(screen.getByRole("textbox", { name: "Perfil que enviará en Chrome de Brunova" }),
    { target: { value: "https://www.facebook.com/jorge.vera/" } })
  expect(button).toBeEnabled()
  fireEvent.click(button)
  await waitFor(() => expect(publish).toHaveBeenCalledOnce())
  expect(publish.mock.calls[0]?.[1]).toMatchObject({effectKind:"SEND_FACEBOOK",
    providerAccountId:"jorge-facebook",chromeProfile:"Brunova",
    senderUrl:"https://www.facebook.com/jorge.vera/"})
})
