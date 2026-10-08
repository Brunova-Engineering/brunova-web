import { render, screen, fireEvent } from "@testing-library/react"
import { it, expect, vi, afterEach } from "vitest"
import { DiscoverySection } from "@/components/acquisition/discovery"
import { acquisitionApi as api } from "@/lib/acquisition-api"
import axe from "axe-core"
afterEach(() => vi.restoreAllMocks())
it("authoritative Discovery pause overrides a waiting projection without deleting candidates", async () => {
  vi.spyOn(api, "discovery").mockResolvedValue({ ...empty, state: "WAITING" })
  vi.spyOn(api, "cycleReview").mockResolvedValue({
    schemaVersion: "1",
    review: { control: { discovery_stop_reason: "Synthetic identity review" } },
  } as Awaited<ReturnType<typeof api.cycleReview>>)
  render(<DiscoverySection locale="en" cycleId="synthetic" />)
  expect(await screen.findByText(/Discovery paused for review/)).toBeVisible()
  expect(
    screen.queryByText(/Waiting for the next authorized/),
  ).not.toBeInTheDocument()
})
const empty: Awaited<ReturnType<typeof api.discovery>> = {
  schemaVersion: "1",
  state: "NO_ACTIVE_CYCLE",
  totals: {
    observations: 0,
    candidates: 0,
    resolved: 0,
    ambiguous: 0,
    unresolved: 0,
    held: 0,
    admitted: 0,
    pending_work: 0,
  },
  sources: [],
  candidates: [],
  planning: [],
  missions: [],
  displayLimits: { missions: 50, candidates: 50, planning: 20 },
}
it("shows expiring Today/Next work as evidence dimensions awaiting Management", async () => {
  vi.spyOn(api, "discovery").mockResolvedValue({
    ...empty,
    workAllocation: [
      {
        id: "plan-1",
        cycle_id: "cycle-1",
        status: "AWAITING_MANAGEMENT",
        rationale:
          "Resolve the smallest material uncertainty before broader discovery.",
        created_at: "2026-09-16T12:00:00Z",
        expires_at: "2026-09-17T12:00:00Z",
        inventory_snapshot: { candidateCount: 1, broadDiscoveryPaused: true },
        items: [
          {
            position: 1,
            workClass: "SOCIAL_ENRICH",
            candidateId: "candidate-1",
            accountId: null,
            dimension: "SOCIAL",
            expectedInformationGain:
              "Whether executive attribution supports current attention.",
            reason:
              "This evidence can change whether a conversation is worth testing.",
            stopCondition: "Stop after one current attributed source.",
            budget: { maxRequests: 1, maxMinutes: 10 },
            status: "PROPOSED",
          },
        ],
      },
    ],
  })
  render(<DiscoverySection locale="en" />)
  fireEvent.click(await screen.findByText("Technical history and calibrations"))
  expect(await screen.findByText("Preserved work plan")).toBeVisible()
  expect(screen.getByText("Awaiting Management")).toBeVisible()
  expect(
    screen.getByText(/evidence dimensions, not additive points/),
  ).toBeVisible()
  expect(screen.getByText(/What could change the decision/)).toBeVisible()
  expect(screen.getByText(/Exhaustion condition/)).toBeVisible()
})
it("shows source reasoning and recorded investigation without promoting identity", async () => {
  vi.spyOn(api, "discovery").mockResolvedValue({
    ...empty,
    candidates: [
      {
        id: "test",
        name: "SYNTHETIC Atlas",
        domain: null,
        identity_state: "UNRESOLVED",
        screen_state: "HOLD",
        reasons: [],
        missing: [],
        market_contexts: ["MX"],
        sources: [],
        sightings: 1,
        admissions: 0,
      },
    ],
    journeys: [
      {
        candidate_id: "test",
        origins: [
          {
            source: "synthetic",
            search: { term: "bounded" },
            hypothesis: "Synthetic change hypothesis",
            reason: "Synthetic source rationale",
            sourceEntity: "synthetic:1",
            jobTitle: null,
            attempts: [],
            requests: 1,
            runStatus: "SUCCESS",
          },
        ],
        decisions: [],
        investigations: [
          {
            summary: "Synthetic identity needs corroboration",
            nextAction: "Inspect primary identity evidence",
            actorType: "PANCRACIO_GATEWAY",
            actorId: "pancracio:gateway",
            recordedAt: "2026-09-13T00:00:00Z",
            attempts: [],
            limitations: ["Not verified"],
          },
        ],
      },
    ],
  })
  render(<DiscoverySection locale="en" />)
  fireEvent.click(await screen.findByText("Technical history and calibrations"))
  expect(
    await screen.findByText(/Search market does not establish/),
  ).toBeVisible()
  fireEvent.click(await screen.findByText("Discovery journey"))
  expect(
    screen.getAllByText("Synthetic identity needs corroboration").length,
  ).toBeGreaterThan(0)
  expect(
    screen.getAllByText("Inspect primary identity evidence").length,
  ).toBeGreaterThan(0)
  expect(screen.getByText(/Current state: Identity unresolved/)).toBeVisible()
  expect(screen.getByText("Historical Management records")).toBeVisible()
  expect(screen.getByText("Action proposed at that time:")).toBeVisible()
})
it.each(["es", "en"] as const)(
  "%s Discovery is useful before an Account exists and cannot activate",
  async (locale) => {
    vi.spyOn(api, "discovery").mockResolvedValue(empty)
    render(<DiscoverySection locale={locale} />)
    expect(
      await screen.findByText(
        locale === "es"
          ? "Sin Cycle activo. La exploración real todavía no ha comenzado."
          : "No active Cycle. Real discovery has not started.",
      ),
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /activar|activate/i }),
    ).not.toBeInTheDocument()
    const accessibility = await axe.run(document.body, {
      runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
      // jsdom has no rendering engine; contrast is checked in visual QA.
      rules: { "color-contrast": { enabled: false } },
    })
    expect(accessibility.violations).toEqual([])
  },
)
it("pre-Account ambiguity is retained, not presented as qualification or a false rejection", async () => {
  vi.spyOn(api, "discovery").mockResolvedValue({
    ...empty,
    state: "WORK_PENDING",
    totals: {
      ...empty.totals,
      candidates: 1,
      ambiguous: 1,
      held: 1,
      pending_work: 1,
    },
    candidates: [
      {
        id: "synthetic",
        name: "SYNTHETIC Taller Norte",
        domain: null,
        identity_state: "AMBIGUOUS",
        screen_state: "HOLD",
        reasons: ["DOMAIN_CLAIM_CONFLICT"],
        missing: ["FIRST_PARTY_IDENTITY"],
        market_contexts: ["MX"],
        sources: ["denue-directory"],
        sightings: 2,
        admissions: 0,
      },
    ],
  })
  render(<DiscoverySection locale="es" />)
  fireEvent.click(await screen.findByText("Historial técnico y calibraciones"))
  expect(
    (await screen.findAllByText("SYNTHETIC Taller Norte"))[0],
  ).toBeVisible()
  expect(screen.getByText(/Conservada antes de admisión/)).toBeVisible()
  fireEvent.click(screen.getByText("Evidencia pendiente y procedencia"))
  expect(
    screen
      .getAllByText("FIRST_PARTY_IDENTITY")
      .some((item) => item.closest("details[open]")),
  ).toBe(true)
})
it("failed read is not an empty/healthy Discovery projection", async () => {
  vi.spyOn(api, "discovery").mockRejectedValue(Error("unavailable"))
  render(<DiscoverySection locale="en" />)
  expect(
    await screen.findByText(/Neither inactivity nor an empty pool is assumed/),
  ).toBeVisible()
  expect(
    screen.queryByText("No active Cycle. Real discovery has not started."),
  ).not.toBeInTheDocument()
})
it("supported dismissal is not mislabeled as missing-evidence retention", async () => {
  vi.spyOn(api, "discovery").mockResolvedValue({
    ...empty,
    candidates: [
      {
        id: "synthetic-dismissal",
        name: "SYNTHETIC Scope Example",
        domain: null,
        identity_state: "RESOLVED",
        screen_state: "SUPPORTED_DISMISSAL",
        reasons: ["SUPPORTED_SCOPE_INCOMPATIBILITY"],
        missing: [],
        market_contexts: ["US"],
        sources: ["synthetic-source"],
        sightings: 1,
        admissions: 0,
        first_seen: "2026-09-12T12:00:00Z",
        last_seen: "2026-09-12T12:00:00Z",
      },
    ],
  })
  render(<DiscoverySection locale="en" />)
  fireEvent.click(await screen.findByText("Technical history and calibrations"))
  expect(
    (await screen.findAllByText(/Dismissed with evidence/)).length,
  ).toBeGreaterThan(0)
  expect(
    screen.queryByText(/Retained before admission/),
  ).not.toBeInTheDocument()
  expect(screen.getAllByText(/Sightings: 1/).length).toBeGreaterThan(0)
})
