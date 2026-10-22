import { expect, it, vi } from "vitest"
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { acquisitionApi } from "@/lib/acquisition-api"
import { ExplorationMap } from "@/components/acquisition/exploration-map"

it("requires the exact original company reply before enabling a Human decision", async () => {
  const now = "2026-10-22T16:00:00Z"
  const node = (id: string, kind: string, label: string, parent?: string) => ({
    id, cycle_id: "cycle", market: "MX", kind, label, state: "PENDING", attributes: {},
    concept_id: null, concept_label: null, concept_status: null,
    parents: parent ? [{ parentId: parent, relation: "registered" }] : [],
    claims: [], created_at: now, updated_at: now,
  })
  const nodes = [node("sector", "MACRO_INDUSTRY", "Logística"),
    node("specialty", "SPECIALTY", "Frío", "sector"),
    node("activity", "ACTIVITY", "Conservación", "specialty"),
    node("chain", "SUPPLY_CHAIN", "Servicios", "activity"),
    node("link", "LINK", "Almacenamiento", "chain"),
    node("lead", "COMPANY_LEAD", "Empresa de prueba", "link")]
  const profile = {companyId: "lead", cycleId: "cycle", displayName: "Empresa de prueba",
    identityStatus: "RESOLVED", aliases: [], leadNodeIds: ["lead"], fields: [], tags: [],
    links: [{linkId: "link", market: "MX", function: "Almacenamiento", evidenceStatus: "OBSERVED",
      sourceUrl: "https://example.test", observedAt: now, contexts: []}],
    fitReviews: [], filteringDecisions: [], contactMethods: [], whatsappChecks: [],
    attention: {status: "OPEN", primaryReasonCode: "CONTACT_NEGATIVE_REPLY", stageVersion: 6,
      reasons: [{code: "CONTACT_NEGATIVE_REPLY", replyId: "reply-1", linkId: "link",
        summary: "Respuesta negativa · vista resumida", evidenceRefs: ["contact-reply:reply-1"],
        openedAt: now, stageVersion: 6,
        actions: [{code: "CONFIRM_CONTACT_CLOSE", label: "Confirmar cierre", actor: "MANAGEMENT", enabled: true}]}],
      actions: [{code: "CONFIRM_CONTACT_CLOSE", label: "Confirmar cierre", actor: "MANAGEMENT", enabled: true}]},
    enrichment: {stage: "CONTACTED", version: 6, discoveredAt: now, lastTouchedAt: now,
      contactedAt: now, closedAt: null, closureReason: null, stageHistory: [], minimumsByLink: {}, attempts: []}}
  vi.spyOn(acquisitionApi, "explorationMap").mockResolvedValue({cycleId: "cycle", headers: [], nodes,
    directives: [], chainProgress: [], governance: [], marketPresence: [], chainEquivalences: [],
    chainCoverage: [], companyProfiles: [profile]} as unknown as Awaited<ReturnType<typeof acquisitionApi.explorationMap>>)
  let resolveReply!: (value: Awaited<ReturnType<typeof acquisitionApi.candidateContactReply>>) => void
  const replyPromise = new Promise<Awaited<ReturnType<typeof acquisitionApi.candidateContactReply>>>(resolve => {
    resolveReply = resolve
  })
  vi.spyOn(acquisitionApi, "candidateContactReply").mockReturnValue(replyPromise)
  render(<ExplorationMap cycleId="cycle" locale="es" mode="attention" session={{
    authenticated: true, actor: {email: "jorge@example.test", capabilities: ["MANAGE_CYCLE"]},
    csrfToken: "fixture", expiresAt: now,
  }}/>)
  const search = await screen.findByRole("searchbox", {name: "Buscar empresa en todo el mapa"})
  fireEvent.change(search, {target: {value: "Empresa de prueba"}})
  const results = screen.getByRole("group", {name: "Resultados de búsqueda global"})
  fireEvent.click(within(results).getByRole("button", {name: /Empresa de prueba/}))
  const decision = screen.getByRole("combobox", {name: "Elige qué hacer"})
  expect(screen.getByText("Elige qué hacer", {selector: "label"})).toBeInTheDocument()
  expect(within(decision).queryByRole("option", {name: "Elige qué hacer"})).not.toBeInTheDocument()
  expect(decision.querySelector('option[value=""]')).toBeDisabled()
  fireEvent.change(decision,
    {target: {value: "CONFIRM_CLOSE"}})
  expect(screen.getByRole("button", {name: "Confirmar decisión"})).toBeDisabled()
  resolveReply({replyId: "reply-1", companyId: "lead", channelType: "EMAIL",
    providerMessageId: "provider-1", originalText: "No nos interesa en este momento. Gracias.",
    receivedAt: now, classification: "NEGATIVE", interestSummary: "No hay interés actual.",
    rationale: "Respuesta explícita.", interpretedAt: now})
  await waitFor(() => expect(screen.getByText("No nos interesa en este momento. Gracias.")).toBeInTheDocument())
  expect(screen.getByRole("button", {name: "Confirmar decisión"})).toBeEnabled()
  expect(acquisitionApi.candidateContactReply).toHaveBeenCalledWith("cycle", "lead", "reply-1")
  vi.restoreAllMocks()
})
