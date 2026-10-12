import { afterEach, expect, it, vi } from "vitest"
import { fireEvent, render, screen, within } from "@testing-library/react"
import { acquisitionApi } from "@/lib/acquisition-api"
import { ExplorationMap } from "@/components/acquisition/exploration-map"

afterEach(() => vi.restoreAllMocks())

it("shows the six-level route and updates the company brief without flattening the map", async () => {
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
      node("activity", "ACTIVITY", "Molienda", "specialty"),
      node("chain", "SUPPLY_CHAIN", "Nixtamalización", "activity"),
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
    ],
  }
  vi.spyOn(acquisitionApi, "explorationMap").mockResolvedValue(payload)
  render(<ExplorationMap cycleId="cycle-1" locale="es" />)

  const route = await screen.findByRole("list", {
    name: "Recorrido de industria a empresa",
  })
  expect(within(route).getAllByRole("listitem")).toHaveLength(6)
  expect(within(route).getByText("Alimentos")).toBeVisible()
  expect(within(route).getByText("Nixtamalización")).toBeVisible()
  expect(within(route).getByText("Cintli")).toBeVisible()
  expect(screen.getByText("Muele maíz")).toBeVisible()
  expect(screen.getByRole("link", { name: "cintli.example" })).toHaveAttribute(
    "href",
    "https://cintli.example/",
  )
  expect(screen.getByText(/no se ha probado un contrato/)).toBeVisible()

  fireEvent.click(screen.getByRole("button", { name: /Molino El Obrero/ }))
  expect(within(route).getByText("Molino El Obrero")).toBeVisible()
  expect(screen.getByText("Produce masa")).toBeVisible()
  expect(screen.queryByText("Muele maíz")).not.toBeInTheDocument()
})
