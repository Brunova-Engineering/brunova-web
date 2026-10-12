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
  ) => ({
    id,
    cycle_id: "cycle-1",
    market: "MX" as const,
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
        sourceUrl: `https://${id}.example/`,
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
    ],
    nodes: [
      node("macro", "MACRO_INDUSTRY", "Alimentos"),
      node("specialty", "SPECIALTY", "Tortillas", "macro"),
      node("specialty-2", "SPECIALTY", "Harinas", "macro"),
      node("activity", "ACTIVITY", "Molienda", "specialty"),
      node("chain", "SUPPLY_CHAIN", "Nixtamalización", "activity"),
      node("chain-2", "SUPPLY_CHAIN", "Abastecimiento", "activity"),
      node("link", "LINK", "Lavado", "chain"),
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
  }
  vi.spyOn(acquisitionApi, "explorationMap").mockResolvedValue(payload)
  render(<ExplorationMap cycleId="cycle-1" locale="es" />)

  const route = await screen.findByRole("list", {
    name: "Recorrido de industria a empresa",
  })
  expect(within(route).getAllByRole("listitem")).toHaveLength(6)
  expect(
    screen.getByRole("group", { name: "Opciones de Macroindustria" }),
  ).toHaveTextContent("Alimentos")
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
  expect(chains).toHaveTextContent("cobertura sin confirmar")
  fireEvent.click(
    within(chains).getByRole("button", { name: /Nixtamalización/ }),
  )
  fireEvent.click(
    within(
      screen.getByRole("group", { name: "Opciones de Eslabón o función" }),
    ).getByRole("button", { name: /Lavado/ }),
  )
  const companies = screen.getByRole("group", {
    name: "Opciones de Empresa candidata",
  })
  expect(companies).toHaveTextContent("Cintli")
  expect(companies).toHaveTextContent("Molino El Obrero")
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
