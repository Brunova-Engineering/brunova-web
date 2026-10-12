import { afterEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { acquisitionApi } from "@/lib/acquisition-api"
import { ExplorationMap } from "@/components/acquisition/exploration-map"

afterEach(() => vi.restoreAllMocks())

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
        link_count: 0,
        company_lead_count: 0,
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
  vi.spyOn(acquisitionApi, "explorationMap").mockResolvedValue(payload)
  const humanDecision = vi
    .spyOn(acquisitionApi, "explorationHumanDecision")
    .mockResolvedValue({ status: "RECORDED", mapVersion: 3 })
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
  expect(links).toHaveTextContent("MX · México")
  expect(links).toHaveTextContent("US · Estados Unidos")
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
  fireEvent.click(within(companies).getByRole("button", { name: /Cintli/ }))
  expect(within(route).getByText("Cintli")).toBeVisible()
  expect(screen.getByText("Muele maíz")).toBeVisible()
  expect(screen.getByRole("link", { name: "cintli.example" })).toHaveAttribute(
    "href",
    "https://cintli.example/",
  )
  expect(screen.getByText(/no se ha probado un contrato/)).toBeVisible()

  fireEvent.click(
    within(companies).getByRole("button", { name: /Molino El Obrero/ }),
  )
  expect(within(route).getByText("Molino El Obrero")).toBeVisible()
  expect(screen.getByText("Produce masa")).toBeVisible()
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
  expect(screen.getByText(/no demuestra que esté agotada/)).toBeVisible()
})
