import { afterEach, expect, it, vi } from "vitest"
import { acquisitionApi } from "@/lib/acquisition-api"

afterEach(() => vi.unstubAllGlobals())

it("accepts Engine claim sourceUrl and exposes the normalized source link", async () => {
  const now = "2026-10-12T22:00:00Z"
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          cycleId: "cycle-1",
          headers: [
            {
              cycle_id: "cycle-1",
              market: "MX",
              version: 2,
              active_node_id: null,
              updated_at: now,
              focus_chain_id: null,
            },
          ],
          nodes: [
            {
              id: "company-1",
              cycle_id: "cycle-1",
              market: "MX",
              kind: "COMPANY_LEAD",
              label: "Empresa ejemplo",
              state: "PENDING",
              attributes: {},
              parents: [],
              claims: [
                {
                  statement: "Actividad reportada",
                  sourceUrl: "https://example.com/source",
                  excerpt: "Extracto",
                  searchQuery: null,
                  status: "UNVERIFIED",
                  observedAt: now,
                },
              ],
              created_at: now,
              updated_at: now,
            },
          ],
          directives: [],
          chainProgress: [],
          governance: [],
          marketPresence: [],
          chainEquivalences: [],
          chainCoverage: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    ),
  )

  const map = await acquisitionApi.explorationMap("cycle-1")
  expect(map.nodes[0]?.claims[0]?.source_url).toBe("https://example.com/source")
})
