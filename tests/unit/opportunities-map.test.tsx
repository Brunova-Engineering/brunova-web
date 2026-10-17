import { afterEach, expect, it, vi } from "vitest"
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { acquisitionApi } from "@/lib/acquisition-api"
import { ExplorationMap } from "@/components/acquisition/exploration-map"

afterEach(() => vi.restoreAllMocks())

it("moves one identity between exclusive active maps and leads with its link thesis", async () => {
  const now = "2026-10-16T12:00:00Z"
  const make = (
    id: string,
    kind: string,
    label: string,
    parentId?: string,
  ) => ({
    id,
    cycle_id: "cycle-fit",
    market: "MX",
    kind,
    label,
    state: "PENDING",
    attributes: {},
    concept_id: null,
    concept_label: null,
    concept_status: null,
    parents: parentId ? [{ parentId, relation: "registered" }] : [],
    claims: [],
    created_at: now,
    updated_at: now,
  })
  const nodes = [
    make("root", "MACRO_INDUSTRY", "Alimentos"),
    make("specialty", "SPECIALTY", "Frío", "root"),
    make("activity", "ACTIVITY", "Congelación", "specialty"),
    make("chain", "SUPPLY_CHAIN", "Cadena fría", "activity"),
    make("link", "LINK", "Congelación rápida", "chain"),
    make("discovery", "COMPANY_LEAD", "Pista Nueva", "link"),
    make("opportunity", "COMPANY_LEAD", "Empresa Avanzada", "link"),
    make("attention", "COMPANY_LEAD", "Empresa en Revisión", "link"),
    make("closed", "COMPANY_LEAD", "Empresa Cerrada", "link"),
  ]
  const profile = (id: string, stage: string) => ({
    companyId: id,
    cycleId: "cycle-fit",
    displayName: nodes.find((node) => node.id === id)!.label,
    identityStatus: "PROVISIONAL",
    aliases: [],
    leadNodeIds: [id],
    fields: [],
    tags: [],
    links: [
      {
        linkId: "link",
        market: "MX",
        function: "Congelación rápida",
        evidenceStatus: "OBSERVED",
        sourceUrl: "https://empresa.example/servicios",
        observedAt: now,
        contexts: [],
      },
    ],
    fitReviews:
      id === "opportunity" || id === "attention"
        ? [
            {
              linkId: "link",
              reviewId: "review",
              stageVersion: 3,
              decision: "ADVANCE",
              process: "Congelación rápida",
              brunovaCapability: "Inteligencia operacional",
              proposedOffer: "Visibilidad del proceso de congelación",
              fitHypothesis: "Podría aportar visibilidad al proceso observado",
              commercialQuestion: "¿Cómo supervisan hoy el proceso?",
              uncertainty: "Desconocemos sus prioridades actuales",
              counterevidence:
                "No hay refutación pública en las fuentes revisadas",
              companySourceUrl: "https://empresa.example/servicios",
              brunovaSourceUrl: "https://brunova.mx/",
              reason: "Revisión sustentada",
              recordedAt: now,
            },
          ]
        : [],
    filteringDecisions:
      id === "opportunity"
        ? [
            {
              linkId: "link",
              decisionId: "decision-selected",
              stageVersion: 4,
              decision: "SELECT",
              reason:
                "La operación acreditada permite una conversación concreta sobre el relevo.",
              sourceUrl: "https://empresa.example/servicios",
              question: null,
              reviewAt: null,
              scope: null,
              branchId: null,
              actorType: "PANCRACIO_GATEWAY",
              recordedAt: now,
            },
          ]
        : [],
    attention:
      id === "attention"
        ? {
            status: "OPEN",
            primaryReasonCode: "NO_VERIFIED_CONTACT",
            reasons: [
              {
                code: "NO_VERIFIED_CONTACT",
                summary: "No hay un medio de contacto atribuible",
                linkId: null,
                evidenceRefs: ["https://empresa.example/contacto"],
                checkedChannels: ["email", "Facebook", "Instagram", "WhatsApp"],
                openedAt: now,
              },
            ],
            actions: [
              {
                code: "REGISTER_CONTACT",
                label: "Registrar un medio",
                actor: "MANAGEMENT",
                resultHint: "Medio atribuido y comprobado",
              },
              {
                code: "REQUEST_CONTACT_RESEARCH",
                label: "Pedir búsqueda de contacto",
                actor: "PANKY",
                resultHint: "Hallazgos con fuente o ausencia acotada",
              },
              {
                code: "CLOSE_CANDIDATE",
                label: "Cerrar empresa",
                actor: "MANAGEMENT",
                resultHint: "Decisión de cierre con motivo y alcance",
                enabled: true,
              },
            ],
            stageVersion: 4,
          }
        : null,
    enrichment: {
      stage,
      version: stage === "FILTERING" ? 4 : 1,
      discoveredAt: now,
      lastTouchedAt: now,
      contactedAt: null,
      closedAt: stage === "CLOSED" ? now : null,
      closureReason: stage === "CLOSED" ? "Sin información" : null,
      closedBy: null,
      stageHistory: [],
      minimumsByLink: {},
      attempts: [],
    },
  })
  vi.spyOn(acquisitionApi, "explorationMap").mockResolvedValue({
    cycleId: "cycle-fit",
    headers: [],
    nodes,
    directives: [],
    chainProgress: [],
    governance: [],
    marketPresence: [
      {
        node_id: "opportunity",
        market: "MX",
        status: "UNVERIFIED",
        relation:
          "Discovered in this market; operating presence remains unconfirmed",
        source_url: null,
      },
    ],
    chainEquivalences: [],
    chainCoverage: [],
    companyProfiles: [
      profile("discovery", "DISCOVERY"),
      { ...profile("opportunity", "FILTERING"), contactScreenRequired: true },
      profile("attention", "FILTERING"),
      profile("closed", "CLOSED"),
    ],
  } as unknown as Awaited<ReturnType<typeof acquisitionApi.explorationMap>>)
  const props = {
    cycleId: "cycle-fit",
    locale: "es" as const,
    session: {
      authenticated: true as const,
      actor: { email: "viewer@example.com", capabilities: ["MANAGE_CYCLE"] },
      csrfToken: "fixture",
      expiresAt: now,
    },
  }
  const first = render(<ExplorationMap {...props} />)
  const search = await screen.findByRole("searchbox", {
    name: "Buscar empresa en todo el mapa",
  })
  fireEvent.change(search, { target: { value: "Pista" } })
  await waitFor(() =>
    expect(
      screen.getByRole("group", { name: "Resultados de búsqueda global" }),
    ).toHaveTextContent("Pista Nueva"),
  )
  expect(
    screen.getByRole("group", { name: "Resultados de búsqueda global" }),
  ).not.toHaveTextContent("Empresa Avanzada")
  expect(
    screen.getByRole("group", { name: "Resultados de búsqueda global" }),
  ).not.toHaveTextContent("Empresa Cerrada")
  first.unmount()
  const second = render(<ExplorationMap {...props} mode="opportunities" />)
  const opportunitySearch = await screen.findByRole("searchbox", {
    name: "Buscar empresa en todo el mapa",
  })
  fireEvent.change(opportunitySearch, { target: { value: "Empresa" } })
  const results = screen.getByRole("group", {
    name: "Resultados de búsqueda global",
  })
  expect(results).toHaveTextContent("Empresa Avanzada")
  expect(results).not.toHaveTextContent("Pista Nueva")
  expect(results).not.toHaveTextContent("Empresa Cerrada")
  expect(results).not.toHaveTextContent("Empresa en Revisión")
  fireEvent.click(
    within(results).getByRole("button", { name: /Empresa Avanzada/ }),
  )
  const brief = screen.getByRole("complementary")
  expect(
    within(brief).getByText(
      /Pendiente revisar correo, Facebook, Instagram y WhatsApp/,
    ),
  ).toBeInTheDocument()
  expect(screen.queryByText(/Pista encontrada en este mercado/)).toBeNull()
  expect(within(brief).queryByText(/Sin verificar/)).toBeNull()
  expect(
    within(brief).getByText("Evidencia, límites y fuentes"),
  ).toBeInTheDocument()
  expect(within(brief).getByLabelText("Encaje propuesto")).toHaveTextContent(
    "Visibilidad del proceso de congelación",
  )
  expect(within(brief).getByLabelText("Encaje propuesto")).toHaveTextContent(
    "¿Cómo supervisan hoy el proceso?",
  )
  expect(within(brief).getByLabelText("Decisión comercial")).toHaveTextContent(
    "La operación acreditada permite una conversación concreta sobre el relevo.",
  )
  expect(
    within(brief)
      .getByLabelText("Encaje propuesto")
      .compareDocumentPosition(
        within(brief).getByLabelText("Contexto del eslabón seleccionado"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  second.unmount()
  const third = render(<ExplorationMap {...props} mode="attention" />)
  const attentionSearch = await screen.findByRole("searchbox", {
    name: "Buscar empresa en todo el mapa",
  })
  fireEvent.change(attentionSearch, { target: { value: "Empresa" } })
  const attentionResults = screen.getByRole("group", {
    name: "Resultados de búsqueda global",
  })
  expect(attentionResults).toHaveTextContent("Empresa en Revisión")
  expect(attentionResults).not.toHaveTextContent("Empresa Avanzada")
  fireEvent.click(
    within(attentionResults).getByRole("button", {
      name: /Empresa en Revisión/,
    }),
  )
  const attentionBrief = screen.getByRole("complementary")
  const reasons = within(attentionBrief).getByLabelText(
    "Motivos y opciones de atención",
  )
  expect(reasons).toHaveTextContent("No hay un medio de contacto atribuible")
  expect(reasons).toHaveTextContent("Pedir búsqueda de contacto")
  expect(reasons).toHaveTextContent("Encargar a Panky")
  vi.spyOn(acquisitionApi, "candidateContactMethod").mockResolvedValue({
    status: "recorded",
    methodId: "contact-command",
    externalEffect: false,
  })
  vi.spyOn(acquisitionApi, "candidateAttentionCommand").mockResolvedValue({
    status: "attention_resolved",
    eventId: "resolution-command",
    externalEffect: false,
  })
  vi.spyOn(
    acquisitionApi,
    "candidateAttentionResearchRequest",
  ).mockResolvedValue({
    status: "queued",
    requestId: "research-command",
    externalEffect: false,
  })
  vi.spyOn(acquisitionApi, "candidateFilteringDecision").mockResolvedValue({
    status: "recorded",
    decisionId: "close-command",
    externalEffect: false,
  })
  fireEvent.click(
    within(reasons).getByRole("button", {
      name: "Preparar decisión de cierre",
    }),
  )
  fireEvent.change(within(reasons).getByLabelText("Motivo sustentado"), {
    target: {
      value:
        "No existe un canal atribuible y Dirección decide cerrar la empresa.",
    },
  })
  fireEvent.click(
    within(reasons).getByRole("button", {
      name: "Registrar decisión para el Engine",
    }),
  )
  await waitFor(() =>
    expect(acquisitionApi.candidateFilteringDecision).toHaveBeenCalledOnce(),
  )
  expect(
    vi.mocked(acquisitionApi.candidateFilteringDecision).mock.calls[0]![1],
  ).toMatchObject({
    companyId: "attention",
    decision: "CLOSE",
    scope: "COMPANY",
  })
  fireEvent.click(
    within(reasons).getByRole("button", { name: "Preparar encargo acotado" }),
  )
  fireEvent.change(within(reasons).getByLabelText("Pregunta concreta"), {
    target: { value: "¿Existe un correo atribuible en el sitio oficial?" },
  })
  fireEvent.click(
    within(reasons).getByRole("button", { name: "Poner encargo en cola" }),
  )
  await waitFor(() =>
    expect(
      acquisitionApi.candidateAttentionResearchRequest,
    ).toHaveBeenCalledOnce(),
  )
  expect(
    vi.mocked(acquisitionApi.candidateAttentionResearchRequest).mock
      .calls[0]![1],
  ).toMatchObject({
    companyId: "attention",
    reasonCode: "NO_VERIFIED_CONTACT",
    maxMinutes: 10,
  })
  fireEvent.click(
    within(reasons).getByRole("button", { name: "Registrar medio con fuente" }),
  )
  fireEvent.change(within(reasons).getByLabelText("Correo, perfil o número"), {
    target: { value: "contacto@empresa.example" },
  })
  fireEvent.change(within(reasons).getByLabelText("Fuente original HTTPS"), {
    target: { value: "https://empresa.example/contacto" },
  })
  fireEvent.change(
    within(reasons).getByLabelText("Cómo se atribuye a esta empresa"),
    {
      target: {
        value: "El sitio oficial identifica este correo para la misma empresa.",
      },
    },
  )
  fireEvent.click(
    within(reasons).getByRole("button", {
      name: "Guardar y resolver este motivo",
    }),
  )
  await waitFor(() =>
    expect(acquisitionApi.candidateAttentionCommand).toHaveBeenCalledOnce(),
  )
  expect(acquisitionApi.candidateContactMethod).toHaveBeenCalledOnce()
  expect(
    vi.mocked(acquisitionApi.candidateAttentionCommand).mock.calls[0]![1],
  ).toMatchObject({
    companyId: "attention",
    reasonCode: "NO_VERIFIED_CONTACT",
    action: "RESOLVE",
    expectedStageVersion: 4,
  })
  expect(
    reasons.compareDocumentPosition(
      within(attentionBrief).getByLabelText("Encaje propuesto"),
    ) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy()
  third.unmount()
  const currentMap = await acquisitionApi.explorationMap("cycle-fit")
  const materialProfile = {
    ...currentMap.companyProfiles![2]!,
    attention: {
      status: "OPEN" as const,
      primaryReasonCode: "IDENTITY_CONFLICT",
      stageVersion: 4,
      reasons: [
        {
          code: "IDENTITY_CONFLICT",
          summary: "Dos identidades de la empresa requieren conciliación",
          linkId: "link",
          evidenceRefs: ["https://empresa.example/registro"],
          relatedRecordRef: null,
        },
      ],
      actions: [
        {
          code: "CONFIRM_IDENTITY",
          label: "Confirmar identidad",
          actor: "MANAGEMENT" as const,
          enabled: true,
          supportingActionId: "reconcile-command",
          resultHint: "Conciliación registrada",
        },
      ],
    },
  }
  vi.mocked(acquisitionApi.explorationMap).mockResolvedValue({
    ...currentMap,
    companyProfiles: [materialProfile],
  })
  vi.mocked(acquisitionApi.candidateAttentionCommand).mockClear()
  render(<ExplorationMap {...props} mode="attention" />)
  const materialSearch = await screen.findByRole("searchbox", {
    name: "Buscar empresa en todo el mapa",
  })
  fireEvent.change(materialSearch, { target: { value: "Empresa" } })
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Resultados de búsqueda global" }),
    ).getByRole("button", { name: /Empresa en Revisión/ }),
  )
  const materialBrief = within(
    screen.getByRole("complementary"),
  ).getByLabelText("Motivos y opciones de atención")
  fireEvent.click(
    within(materialBrief).getByRole("button", {
      name: "Registrar resolución sustentada",
    }),
  )
  fireEvent.change(
    within(materialBrief).getByLabelText("Evidencia revisada (URL o recibo)"),
    { target: { value: "https://empresa.example/registro" } },
  )
  fireEvent.change(
    within(materialBrief).getByLabelText("Explicación de la decisión"),
    {
      target: {
        value:
          "La conciliación gobernada acredita una sola identidad para la empresa.",
      },
    },
  )
  fireEvent.click(
    within(materialBrief).getByRole("button", {
      name: "Resolver motivo con evidencia",
    }),
  )
  await waitFor(() =>
    expect(acquisitionApi.candidateAttentionCommand).toHaveBeenCalledOnce(),
  )
  expect(
    vi.mocked(acquisitionApi.candidateAttentionCommand).mock.calls[0]![1],
  ).toMatchObject({
    reasonCode: "IDENTITY_CONFLICT",
    resolutionAction: "CONFIRM_IDENTITY",
    supportingActionId: "reconcile-command",
  })
})
