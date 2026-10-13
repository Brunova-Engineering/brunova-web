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

it("shows one conceptual route with separate market observations and company contexts", async () => {
  const now = "2026-10-13T12:00:00Z"
  const make = (id: string, market: "MX" | "US", kind: string,
    label: string, concept: string | null, canonical: string | null,
    parentId?: string) => ({
    id,cycle_id:"cycle-shared",market,kind,label,state:"PENDING",attributes:{},
    concept_id:concept,concept_label:canonical,concept_status:concept?"PROVISIONAL":null,
    parents:parentId?[{parentId,relation:"Possible role"}]:[],
    claims:[],created_at:now,updated_at:now,
  })
  const nodes = [
    make("mx-root","MX","MACRO_INDUSTRY","MX — Alimentos","root","Alimentos"),
    make("us-root","US","MACRO_INDUSTRY","US — Foods","root","Alimentos"),
    make("mx-specialty","MX","SPECIALTY","MX — Refrigerados","specialty","Almacenamiento refrigerado","mx-root"),
    make("us-specialty","US","SPECIALTY","US — Cold storage","specialty","Almacenamiento refrigerado","us-root"),
    make("mx-activity","MX","ACTIVITY","MX — Congelación","activity","Congelación rápida","mx-specialty"),
    make("us-activity","US","ACTIVITY","US — Blast freezing","activity","Congelación rápida","us-specialty"),
    make("mx-chain","MX","SUPPLY_CHAIN","MX — Cadena fría","chain","Cadena de frío","mx-activity"),
    make("us-chain","US","SUPPLY_CHAIN","US — Cold chain","chain","Cadena de frío","us-activity"),
    make("mx-link","MX","LINK","MX — Recepción","link","Recepción y preparación","mx-chain"),
    make("us-link","US","LINK","US — Receiving","link","Recepción y preparación","us-chain"),
    make("us-dispatch","US","LINK","US — Dispatch","dispatch","Despacho en frío","us-chain"),
    make("mx-lead","MX","COMPANY_LEAD","Operador México",null,null,"mx-link"),
    make("us-lead","US","COMPANY_LEAD","US Operator",null,null,"us-link"),
    make("us-lead-dispatch","US","COMPANY_LEAD","US Operator",null,null,"us-dispatch"),
  ]
  vi.spyOn(acquisitionApi,"explorationMap").mockResolvedValue({
    cycleId:"cycle-shared",headers:[],nodes,directives:[],chainProgress:[],
    governance:[],marketPresence:[],chainEquivalences:[],chainCoverage:[],
    companyProfiles:[],
  } as unknown as Awaited<ReturnType<typeof acquisitionApi.explorationMap>>)
  render(<ExplorationMap cycleId="cycle-shared" locale="es" session={{
    authenticated:true,actor:{email:"viewer@example.com",capabilities:[]},
    csrfToken:"synthetic-csrf",expiresAt:now,
  }}/>)
  const roots = await screen.findByRole("group",{name:"Opciones de Macroindustria"})
  expect(within(roots).getAllByRole("button")).toHaveLength(1)
  expect(roots).toHaveTextContent("Alimentos")
  expect(roots).toHaveTextContent("MX · US")
  expect(roots).not.toHaveTextContent("US — Foods")
  const globalSearch = screen.getByRole("searchbox",{name:"Buscar empresa en todo el mapa"})
  fireEvent.change(globalSearch,{target:{value:"US Operator"}})
  expect(within(screen.getByRole("group",{name:"Resultados de búsqueda global"}))
    .getAllByRole("button")).toHaveLength(2)
  fireEvent.click(screen.getByRole("button",{name:"México"}))
  expect(screen.getByRole("group",{name:"Resultados de búsqueda global"}))
    .toHaveTextContent("0 ubicaciones encontradas")
  expect(screen.getByRole("group",{name:"Opciones de Macroindustria"})).toHaveTextContent("MX")
  expect(screen.getByRole("group",{name:"Opciones de Macroindustria"})).not.toHaveTextContent("US")
  fireEvent.click(screen.getByRole("button",{name:"Todos"}))
  fireEvent.change(globalSearch,{target:{value:""}})
  for(const [stage,name] of ([
    ["Macroindustria","Alimentos"],["Especialidad","Almacenamiento refrigerado"],
    ["Actividad o mercado","Congelación rápida"],["Cadena de suministro","Cadena de frío"],
    ["Eslabón o función","Recepción y preparación"],
  ] as const)) {
    fireEvent.click(within(screen.getByRole("group",{name:`Opciones de ${stage}`}))
      .getByRole("button",{name:new RegExp(name)}))
  }
  const companies = screen.getByRole("group",{name:"Opciones de Empresa candidata"})
  expect(companies).toHaveTextContent("Operador México")
  expect(companies).toHaveTextContent("US Operator")
  fireEvent.click(within(companies).getByRole("button",{name:/US Operator/}))
  expect(screen.getByRole("heading",{name:"US Operator",level:4})).toBeVisible()
  expect(screen.getByLabelText("Contexto del eslabón seleccionado"))
    .toHaveTextContent("Cadena de frío › Recepción y preparación")
  expect(screen.getByRole("heading",{name:"US Operator",level:4}).closest("aside"))
    .toHaveTextContent("US · Estados Unidos")
  fireEvent.click(screen.getByRole("button",{name:"México"}))
  expect(screen.getByRole("group",{name:"Opciones de Empresa candidata"}))
    .toHaveTextContent("Operador México")
  expect(screen.getByRole("group",{name:"Opciones de Empresa candidata"}))
    .not.toHaveTextContent("US Operator")
  expect(screen.getByText("Nivel 6 de 6")).toBeVisible()
  expect(screen.getByRole("button",{name:/5\. Eslabón o función/}))
    .toHaveTextContent("Recepción y preparación")
  expect(screen.queryByRole("heading",{name:"US Operator",level:4})).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole("button",{name:"Estados Unidos"}))
  expect(screen.getByRole("group",{name:"Opciones de Empresa candidata"}))
    .toHaveTextContent("US Operator")
  expect(screen.getByRole("group",{name:"Opciones de Empresa candidata"}))
    .not.toHaveTextContent("Operador México")
  fireEvent.click(screen.getByRole("button",{name:"Todos"}))
  expect(screen.getByRole("group",{name:"Opciones de Empresa candidata"}))
    .toHaveTextContent("Operador México")
  expect(screen.getByRole("group",{name:"Opciones de Empresa candidata"}))
    .toHaveTextContent("US Operator")
  expect(screen.getByText("Nivel 6 de 6")).toBeVisible()
  fireEvent.change(screen.getByRole("searchbox",{name:"Buscar empresa en todo el mapa"}),
    {target:{value:"US Operator"}})
  const globalResults = screen.getByRole("group",{name:"Resultados de búsqueda global"})
  expect(within(globalResults).getAllByRole("button")).toHaveLength(2)
  fireEvent.click(within(globalResults).getByRole("button",{name:/US Operator.*Despacho en frío/}))
  expect(screen.getByRole("button",{name:/5\. Eslabón o función/}))
    .toHaveTextContent("Despacho en frío")
  expect(screen.getByRole("heading",{name:"US Operator",level:4})).toBeVisible()
  fireEvent.click(screen.getByRole("button",{name:"Volver a resultados"}))
  fireEvent.click(within(screen.getByRole("group",{name:"Resultados de búsqueda global"}))
    .getByRole("button",{name:/US Operator.*Recepción y preparación/}))
  expect(screen.getByRole("button",{name:/5\. Eslabón o función/}))
    .toHaveTextContent("Recepción y preparación")
})

it("reveals every recorded branch one level at a time and keeps company context", async () => {
  const now = "2026-10-12T17:05:40Z"
  const node = (
    id: string,
    kind: string,
    label: string,
    parentId?: string,
    attributes: Record<string, string | string[]> = {},
    market: "MX" | "US" = "MX",
  ) => ({
    id,
    cycle_id: "cycle-1",
    market,
    kind,
    label,
    state: "PENDING",
    attributes,
    parents: parentId
      ? [{ parentId, relation: "Possible relationship pending research" }]
      : [],
    claims: [
      {
        statement: label,
        source_url: `https://${id}.example/`,
        excerpt: null,
        searchQuery: null,
        status: "UNVERIFIED" as const,
        observedAt: now,
      },
    ],
    created_at: now,
    updated_at: now,
  })
  const payload = {
    cycleId: "cycle-1",
    headers: [
      {
        cycle_id: "cycle-1",
        market: "MX" as const,
        version: 2,
        active_node_id: null,
        updated_at: now,
        focus_chain_id: null,
      },
      {
        cycle_id: "cycle-1",
        market: "US" as const,
        version: 4,
        active_node_id: null,
        updated_at: now,
        focus_chain_id: null,
      },
    ],
    nodes: [
      node("macro", "MACRO_INDUSTRY", "Alimentos"),
      node("specialty", "SPECIALTY", "Tortillas", "macro"),
      node("specialty-2", "SPECIALTY", "Harinas", "macro"),
      node("activity", "ACTIVITY", "Molienda", "specialty"),
      node("chain", "SUPPLY_CHAIN", "Nixtamalización", "activity"),
      node("chain-us", "SUPPLY_CHAIN", "Nixtamalization", "activity", {}, "US"),
      node("chain-2", "SUPPLY_CHAIN", "Abastecimiento", "activity"),
      node("link", "LINK", "Lavado", "chain"),
      node("link-2", "LINK", "Secado", "chain"),
      node("link-3", "LINK", "Recepción", "chain-2"),
      node("link-us", "LINK", "Grinding", "chain-us", {}, "US"),
      node("cintli", "COMPANY_LEAD", "Cintli", "link", {
        activity: "Muele maíz",
        scaleSignal: "Operación local",
        accessRoute: "Correo público",
        chainRole: "PROSPECT",
        observedAliases: ["Cintli CDMX"],
      }),
      node("molino", "COMPANY_LEAD", "Molino El Obrero", "link", {
        activity: "Produce masa",
        scaleSignal: "Molino local",
        chainRole: "PROSPECT",
      }),
      node(
        "mill-us",
        "COMPANY_LEAD",
        "Midwest Milling",
        "link-us",
        {
          activity: "Corn milling",
          chainRole: "PROSPECT",
        },
        "US",
      ),
    ],
    companyProfiles: [
      {
        companyId: "cintli",
        cycleId: "cycle-1",
        displayName: "Cintli",
        identityStatus: "PROVISIONAL",
        aliases: ["Cintli CDMX"],
        leadNodeIds: ["cintli"],
        fields: [
          {
            key: "canonicalName",
            dimension: "identity",
            value: "Cintli Alimentos",
            status: "KNOWN" as const,
            sourceUrl: null,
            observedAt: now,
            nextQuestion: "What legal name can be confirmed?",
          },
          {
            key: "activity",
            dimension: "activity",
            value: "Muele maíz",
            status: "HYPOTHESIS" as const,
            sourceUrl: null,
            observedAt: now,
            nextQuestion: "What processes does it offer?",
          },
          {
            key: "markets",
            dimension: "presence",
            value: "México",
            status: "HYPOTHESIS" as const,
            sourceUrl: null,
            observedAt: now,
            nextQuestion: "Which markets does it operate in directly?",
          },
          {
            key: "fitProcess",
            dimension: "fit",
            value: "Molienda",
            status: "PENDING" as const,
            sourceUrl: null,
            observedAt: now,
            nextQuestion: "Which process could it support?",
          },
          {
            key: "channel",
            dimension: "outreach",
            value: "Correo público",
            status: "PENDING" as const,
            sourceUrl: null,
            observedAt: now,
            nextQuestion: "What public channel is appropriate?",
          },
        ],
        tags: ["nixtamal"],
        links: [
          {
            linkId: "link",
            market: "MX" as const,
            function: "Molienda",
            evidenceStatus: "UNVERIFIED" as const,
            contexts: [
              {
                statement: "Corn milling appears in this link",
                sourceUrl: "https://milling.example/evidence",
                observedAt: now,
                status: "INFERRED" as const,
              },
              {
                statement: "Molienda",
                sourceUrl: "https://milling.example/role-one",
                observedAt: now,
                status: "INFERRED" as const,
              },
              {
                statement: "Molienda",
                sourceUrl: "https://milling.example/role-two",
                observedAt: now,
                status: "INFERRED" as const,
              },
              {
                statement:
                  "Cold storage PROSPECT UNVERIFIED READY_FOR_REVIEW TRAVERSED",
                sourceUrl: "https://milling.example/markers",
                observedAt: now,
                status: "INFERRED" as const,
              },
              {
                statement: "Possible relationship pending research",
                sourceUrl: "https://milling.example/generic",
                observedAt: now,
                status: "UNVERIFIED" as const,
              },
            ],
          },
          {
            linkId: "link-2",
            market: "MX" as const,
            function: null,
            functions: ["Secado", "Tratamiento"],
            roleConflict: true,
            evidenceStatus: "UNVERIFIED" as const,
            contexts: [
              {
                statement: "Secado",
                sourceUrl: "https://drying.example/role",
                observedAt: now,
                status: "OBSERVED" as const,
              },
              {
                statement: "Drying capacity appears in this link",
                sourceUrl: "https://drying.example/evidence",
                observedAt: now,
                status: "OBSERVED" as const,
              },
            ],
          },
          {
            linkId: "link-3",
            market: "MX" as const,
            function: "Recepción en frío",
            evidenceStatus: "OBSERVED" as const,
            contexts: [
              {
                statement: "Receives refrigerated shipments",
                sourceUrl: "https://receiving.example/evidence",
                observedAt: now,
                status: "OBSERVED" as const,
              },
            ],
          },
        ],
        disposition: [
          {
            scope: "GLOBAL" as const,
            branchId: null,
            status: "DISCARDED" as const,
            reason: "Review before resuming",
            actorId: "manager",
            updatedAt: now,
          },
        ],
      },
      {
        companyId: "molino",
        cycleId: "cycle-1",
        displayName: "Molino El Obrero",
        identityStatus: "PROVISIONAL",
        aliases: [],
        leadNodeIds: ["molino"],
        fields: [
          {
            key: "activity",
            dimension: "activity",
            value: "Produce masa",
            status: "HYPOTHESIS" as const,
            sourceUrl: null,
            observedAt: now,
            nextQuestion: null,
            conflict: true,
            conflictValues: [
              {
                companyId: "molino",
                value: "Produce masa",
                status: "HYPOTHESIS" as const,
                sourceUrl: "https://mill.example/source",
                observedAt: now,
              },
              {
                companyId: "mill-alias",
                value: "Produce harina",
                status: "KNOWN" as const,
                sourceUrl: null,
                observedAt: now,
              },
            ],
          },
        ],
        tags: [],
        links: [
          {
            linkId: "link",
            market: "MX" as const,
            function: "Molienda",
            evidenceStatus: "UNVERIFIED" as const,
          },
          {
            linkId: "link",
            market: "MX" as const,
            function: "Molienda",
            evidenceStatus: "UNVERIFIED" as const,
          },
        ],
      },
    ],
    directives: [],
    chainProgress: [
      {
        cycle_id: "cycle-1",
        market: "MX" as const,
        chain_id: "chain",
        chain_label: "Nixtamalización",
        link_count: 1,
        company_lead_count: 2,
        anchor_hint_count: 0,
        prospect_hint_count: 2,
        focused: false,
        delivery_status: "DELIVERED" as const,
      },
      {
        cycle_id: "cycle-1",
        market: "MX" as const,
        chain_id: "chain-2",
        chain_label: "Abastecimiento",
        link_count: 1,
        company_lead_count: 1,
        anchor_hint_count: 0,
        prospect_hint_count: 0,
        focused: false,
        delivery_status: "IN_PROGRESS" as const,
      },
    ],
    governance: [
      {
        node_id: "macro",
        decision: "REOPENED",
        priority: 3,
        reason: "Strategic fit",
        actor_id: "actor-1",
        updated_at: now,
        history: [
          {
            operation: "PAUSE_BRANCH",
            reason: "Earlier review",
            actor_id: "actor-2",
            recorded_at: now,
          },
        ],
      },
    ],
    marketPresence: [
      {
        node_id: "link",
        market: "US" as const,
        status: "OBSERVED",
        relation: "Equivalent function",
        source_url: "https://evidence.example/us-function",
      },
      {
        node_id: "cintli",
        market: "MX" as const,
        status: "UNVERIFIED",
        relation: "Legacy discovery market: MX",
        source_url: "https://evidence.example/legacy-market",
      },
      {
        node_id: "cintli",
        market: "MX" as const,
        status: "UNVERIFIED",
        relation: "Possible relationship pending research",
        source_url: null,
      },
    ],
    chainEquivalences: [
      {
        chain_id: "chain",
        counterpart_id: "chain-us",
        reason: "Same transformation stage",
      },
      {
        chain_id: "chain-us",
        counterpart_id: "chain",
        reason: "Same transformation stage",
      },
    ],
    chainCoverage: [
      {
        chain_id: "chain",
        market: "MX" as const,
        status: "ATTEMPTED" as const,
        summary: "Initial supplier search completed",
        open_gaps: ["Regional processors", "Transport providers"],
        directive_ids: ["directive-1"],
        actor_id: "actor-1",
        updated_at: now,
      },
      {
        chain_id: "chain-us",
        market: "US" as const,
        status: "EXHAUSTED" as const,
        summary: "Current research avenues exhausted",
        open_gaps: ["Secondary processors"],
        directive_ids: [],
        actor_id: "actor-2",
        updated_at: now,
      },
    ],
  }
  payload.nodes
    .find((item) => item.id === "cintli")!
    .parents.push({
      parentId: "link-2",
      relation: "Possible second link",
    })
  payload.nodes
    .find((item) => item.id === "cintli")!
    .parents.push({
      parentId: "link-3",
      relation: "Possible role in another chain",
    })
  vi.spyOn(acquisitionApi, "explorationMap").mockResolvedValue(payload)
  const humanDecision = vi
    .spyOn(acquisitionApi, "explorationHumanDecision")
    .mockResolvedValue({ status: "RECORDED", mapVersion: 3 })
  const companyDisposition = vi
    .spyOn(acquisitionApi, "explorationCompanyDisposition")
    .mockResolvedValue({
      status: "accepted",
      companyId: "cintli",
      externalEffect: false,
    })
  render(
    <ExplorationMap
      cycleId="cycle-1"
      locale="es"
      session={{
        authenticated: true,
        actor: { email: "manager@example.com", capabilities: ["MANAGE_CYCLE"] },
        csrfToken: "synthetic-csrf",
        expiresAt: now,
      }}
    />,
  )

  const route = await screen.findByRole("list", {
    name: "Recorrido de industria a empresa",
  })
  expect(within(route).getAllByRole("listitem")).toHaveLength(6)
  fireEvent.change(screen.getByRole("searchbox",{name:"Buscar empresa en todo el mapa"}),
    {target:{value:"Cintli CDMX"}})
  expect(screen.getByRole("group",{name:"Resultados de búsqueda global"}))
    .toHaveTextContent("Cintli")
  fireEvent.change(screen.getByRole("searchbox",{name:"Buscar empresa en todo el mapa"}),
    {target:{value:""}})
  expect(
    screen.getByRole("group", { name: "Opciones de Macroindustria" }),
  ).toHaveTextContent("Alimentos")
  expect(screen.getByText("Strategic fit")).toBeVisible()
  expect(screen.getByText(/Rama reabierta/)).toBeVisible()
  expect(screen.getByText(/Anterior: PAUSE BRANCH/)).toBeVisible()
  const decisionForm = screen
    .getByText("Registrar decisión")
    .closest("details")!
  fireEvent.click(screen.getByText("Registrar decisión"))
  fireEvent.change(within(decisionForm).getByLabelText("Acción"), {
    target: { value: "PAUSE_BRANCH" },
  })
  fireEvent.change(within(decisionForm).getByLabelText("Motivo requerido"), {
    target: { value: "Pause pending evidence" },
  })
  fireEvent.click(
    within(decisionForm).getByRole("button", { name: "Guardar decisión" }),
  )
  await vi.waitFor(() =>
    expect(humanDecision).toHaveBeenCalledWith(
      expect.any(String),
      {
        cycleId: "cycle-1",
        market: "MX",
        nodeId: "macro",
        operation: "PAUSE_BRANCH",
        reason: "Pause pending evidence",
        expectedVersion: 2,
      },
      "synthetic-csrf",
    ),
  )
  expect(
    screen.queryByRole("group", { name: "Opciones de Cadena de suministro" }),
  ).not.toBeInTheDocument()

  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Macroindustria" }),
    ).getByRole("button", { name: /Alimentos/ }),
  )
  const specialties = screen.getByRole("group", {
    name: "Opciones de Especialidad",
  })
  expect(specialties).toHaveTextContent("Tortillas")
  expect(specialties).toHaveTextContent("Harinas")
  fireEvent.click(
    within(specialties).getByRole("button", { name: /Tortillas/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Actividad o mercado" }),
    ).getByRole("button", { name: /Molienda/ }),
  )
  const chains = screen.getByRole("group", {
    name: "Opciones de Cadena de suministro",
  })
  expect(chains).toHaveTextContent("Nixtamalización")
  expect(chains).toHaveTextContent("Abastecimiento")
  expect(chains).toHaveTextContent(
    "2 funciones registradas · 2 pistas de empresas · cobertura sin confirmar",
  )
  expect(chains).toHaveTextContent("US · Nixtamalization")
  expect(
    within(chains).getAllByText(/^Cadena equivalente explícita/),
  ).toHaveLength(1)
  expect(chains).toHaveTextContent("cobertura sin confirmar")
  expect(chains).toHaveTextContent("Búsqueda intentada")
  expect(chains).toHaveTextContent("Investigación agotada")
  expect(chains).toHaveTextContent("Regional processors")
  expect(chains).toHaveTextContent(
    "no confirma que se hayan encontrado todos los eslabones",
  )
  fireEvent.click(
    within(chains).getByRole("button", { name: /Nixtamalización/ }),
  )
  const links = screen.getByRole("group", {
    name: "Opciones de Eslabón o función",
  })
  expect(links).toHaveTextContent("Lavado")
  expect(links).toHaveTextContent("Grinding")
  expect(links).toHaveTextContent("MX")
  expect(links).toHaveTextContent("US")
  expect(
    screen.getByText(/Observado · evidencia/).closest("p"),
  ).toHaveTextContent("Equivalent function")
  expect(
    screen.getByRole("link", { name: "Fuente: evidence.example" }),
  ).toHaveAttribute("href", "https://evidence.example/us-function")
  fireEvent.click(within(links).getByRole("button", { name: /Grinding/ }))
  let companies = screen.getByRole("group", {
    name: "Opciones de Empresa candidata",
  })
  expect(companies).toHaveTextContent("Midwest Milling")
  expect(companies).toHaveTextContent("US · Estados Unidos")
  fireEvent.click(
    within(route).getByRole("button", { name: /5\. Eslabón o función/ }),
  )
  fireEvent.click(within(links).getByRole("button", { name: /Lavado/ }))
  companies = screen.getByRole("group", {
    name: "Opciones de Empresa candidata",
  })
  expect(companies).toHaveTextContent("Cintli")
  expect(companies).toHaveTextContent("Molino El Obrero")
  expect(companies).toHaveTextContent("MX · México")
  expect(companies).toHaveTextContent(
    "Registro heredado de descubrimiento; presencia pendiente de verificación.",
  )
  expect(companies).not.toHaveTextContent("Legacy discovery market")
  expect(companies).not.toHaveTextContent(
    "Possible relationship pending research",
  )
  fireEvent.click(within(companies).getByRole("button", { name: /Cintli/ }))
  expect(within(route).getByText("Cintli")).toBeVisible()
  const companyCard = screen
    .getByRole("heading", { name: "Cintli", level: 4 })
    .closest("aside")!
  const dimensionCards = [
    ...companyCard.querySelectorAll("details.acq-company-dimension"),
  ]
  expect(dimensionCards).toHaveLength(5)
  for (const card of dimensionCards) {
    if (!card.hasAttribute("open")) fireEvent.click(card.querySelector("summary")!)
  }
  expect(screen.getByText("Muele maíz")).toBeVisible()
  expect(
    screen.getByText(/¿Qué procesos o servicios ofrece exactamente\?/),
  ).toBeVisible()
  expect(
    screen.getByText(/¿Cuál es el nombre legal o comercial confirmado\?/),
  ).toBeVisible()
  expect(
    screen.getByText(/¿En qué mercados opera directamente\?/),
  ).toBeVisible()
  expect(
    screen.getByText(/¿Qué proceso específico podría atender\?/),
  ).toBeVisible()
  expect(
    screen.getByText(/¿Cuál es el canal público apropiado para contactarla\?/),
  ).toBeVisible()
  expect(screen.getByText(/Descartada · Empresa completa/)).toBeVisible()
  expect(
    within(companyCard).getByText(/Registro heredado de descubrimiento/),
  ).toBeVisible()
  const crosslinkCards = companyCard.querySelectorAll(
    ".acq-company-crosslinks button",
  )
  const dryingReference = [...crosslinkCards].find((button) =>
    button.textContent?.includes("Secado"),
  )
  expect(dryingReference).toBeDefined()
  expect(dryingReference?.querySelector("small")).toBeNull()
  expect(companyCard).not.toHaveTextContent("Legacy discovery market")
  expect(companyCard).not.toHaveTextContent(
    "Possible relationship pending research",
  )
  const linkEvidence = within(
    screen.getByLabelText("Contexto del eslabón seleccionado"),
  ).getByText("Observaciones y fuentes (4)")
  expect(linkEvidence.closest("details")).not.toHaveAttribute("open")
  fireEvent.click(linkEvidence)
  const selectedLink = screen.getByLabelText(
    "Contexto del eslabón seleccionado",
  )
  expect(selectedLink).toHaveTextContent("Cold storage Empresa candidata")
  expect(selectedLink).toHaveTextContent("Sin verificar")
  expect(selectedLink).not.toHaveTextContent("PROSPECT")
  expect(selectedLink).not.toHaveTextContent("UNVERIFIED")
  expect(selectedLink).not.toHaveTextContent("READY_FOR_REVIEW")
  expect(selectedLink).not.toHaveTextContent("TRAVERSED")
  expect(selectedLink).not.toHaveTextContent(
    "Possible relationship pending research",
  )
  expect(selectedLink).toHaveTextContent(
    "La función indicada también aparece en estas fuentes.",
  )
  expect(selectedLink.textContent?.match(/Molienda/g)).toHaveLength(1)
  expect(
    within(selectedLink).getAllByRole("link", { name: "Abrir fuente" }),
  ).toHaveLength(4)
  const decisionSummary = within(companyCard).getByText(
    "Tomar una decisión sobre esta empresa",
  )
  expect(decisionSummary.closest("details")).not.toHaveAttribute("open")
  fireEvent.click(decisionSummary)
  const scopeControl = screen.getByLabelText("¿Dónde aplicar este cambio?")
  const dispositionReason = screen.getByLabelText(
    "Motivo (8 caracteres mínimo)",
  )
  fireEvent.change(scopeControl, { target: { value: "LINK" } })
  fireEvent.change(dispositionReason, {
    target: { value: "Outside this link" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Descartar eslabón" }))
  await waitFor(() => expect(companyDisposition).toHaveBeenCalledTimes(1))
  expect(companyDisposition.mock.calls[0]?.[1]).toMatchObject({
    companyId: "cintli",
    scope: "LINK",
    branchId: "link",
    operation: "DISCARD",
    expectedVersions: { MX: 2 },
  })
  expect(companyDisposition.mock.calls[0]?.[2]).toBe("synthetic-csrf")
  fireEvent.change(scopeControl, { target: { value: "CHAIN" } })
  fireEvent.change(dispositionReason, {
    target: { value: "Outside this chain" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Descartar cadena" }))
  await waitFor(() => expect(companyDisposition).toHaveBeenCalledTimes(2))
  expect(companyDisposition.mock.calls[1]?.[1]).toMatchObject({
    companyId: "cintli",
    scope: "CHAIN",
    branchId: "chain",
    operation: "DISCARD",
    expectedVersions: { MX: 2 },
  })
  fireEvent.change(scopeControl, { target: { value: "GLOBAL" } })
  fireEvent.change(dispositionReason, {
    target: { value: "Outside this company" },
  })
  fireEvent.click(
    screen.getByRole("button", { name: "Reabrir empresa completa" }),
  )
  await waitFor(() => expect(companyDisposition).toHaveBeenCalledTimes(3))
  expect(companyDisposition.mock.calls[2]?.[1]).toMatchObject({
    companyId: "cintli",
    scope: "GLOBAL",
    operation: "REOPEN",
    expectedVersions: { MX: 2 },
  })
  expect(companyDisposition.mock.calls[2]?.[1]).not.toHaveProperty("branchId")
  expect(
    screen.getByRole("group", { name: "Opciones de Empresa candidata" }),
  ).toHaveTextContent("Molino El Obrero")
  expect(
    screen.getByRole("heading", { name: "Referencias en otros eslabones" }),
  ).toBeVisible()
  expect(screen.getByText("Nixtamalización › Lavado")).toBeVisible()
  expect(
    screen.getByLabelText("Contexto del eslabón seleccionado"),
  ).toHaveTextContent("Corn milling appears in this link")
  fireEvent.click(
    screen.getByRole("button", {
      name: /MX · México · Nixtamalización · Secado · Secado \/ Tratamiento/,
    }),
  )
  expect(within(route).getByText("Secado")).toBeVisible()
  expect(within(route).getByText("Cintli")).toBeVisible()
  expect(
    screen.getByLabelText("Contexto del eslabón seleccionado"),
  ).toHaveTextContent("Drying capacity appears in this link")
  expect(screen.getByText("Nixtamalización › Secado")).toBeVisible()
  expect(
    screen.getByText(/Funciones en conflicto para este eslabón/),
  ).toBeVisible()
  fireEvent.click(
    screen.getByRole("button", {
      name: /MX · México · Nixtamalización · Lavado · Molienda/,
    }),
  )
  expect(within(route).getByText("Lavado")).toBeVisible()
  expect(screen.getByRole("link", { name: "cintli.example" })).toHaveAttribute(
    "href",
    "https://cintli.example/",
  )
  expect(screen.getByText(/no se ha probado un contrato/)).toBeVisible()

  fireEvent.click(
    within(route).getByRole("button", { name: /4\. Cadena de suministro/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Cadena de suministro" }),
    ).getByRole("button", { name: /Abastecimiento/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Eslabón o función" }),
    ).getByRole("button", { name: /Recepción/ }),
  )
  companies = screen.getByRole("group", {
    name: "Opciones de Empresa candidata",
  })
  fireEvent.click(within(companies).getByRole("button", { name: /Cintli/ }))
  expect(screen.getByText("Abastecimiento › Recepción")).toBeVisible()
  expect(
    screen.getByLabelText("Contexto del eslabón seleccionado"),
  ).toHaveTextContent("Receives refrigerated shipments")
  expect(
    screen.getByRole("heading", { name: "Referencias en otros eslabones" }),
  ).toBeVisible()
  expect(
    screen.getByRole("button", { name: /Nixtamalización · Lavado · Molienda/ }),
  ).toBeVisible()
  fireEvent.click(
    within(route).getByRole("button", { name: /4\. Cadena de suministro/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Cadena de suministro" }),
    ).getByRole("button", { name: /Nixtamalización/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Eslabón o función" }),
    ).getByRole("button", { name: /Lavado/ }),
  )
  companies = screen.getByRole("group", {
    name: "Opciones de Empresa candidata",
  })

  fireEvent.click(
    within(companies).getByRole("button", { name: /Molino El Obrero/ }),
  )
  expect(within(route).getByText("Molino El Obrero")).toBeVisible()
  expect(screen.getAllByText("Produce masa")).toHaveLength(2)
  expect(screen.getByText("En conflicto · provisional")).toBeVisible()
  fireEvent.click(screen.getByText("Datos en conflicto"))
  expect(screen.getByText("Produce harina")).toBeVisible()
  expect(screen.getByRole("link", { name: "Fuente" })).toHaveAttribute(
    "href",
    "https://mill.example/source",
  )
  expect(
    screen.queryByRole("heading", { name: "Referencias en otros eslabones" }),
  ).not.toBeInTheDocument()
  expect(screen.queryByText("Muele maíz")).not.toBeInTheDocument()

  fireEvent.click(
    within(route).getByRole("button", { name: /4\. Cadena de suministro/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Cadena de suministro" }),
    ).getByRole("button", { name: /Abastecimiento/ }),
  )
  expect(within(route).getByText("Abastecimiento")).toBeVisible()
  expect(within(route).queryByText("Molino El Obrero")).not.toBeInTheDocument()
  expect(
    screen.getByRole("group", { name: "Opciones de Eslabón o función" }),
  ).toHaveTextContent("Recepción")
})
