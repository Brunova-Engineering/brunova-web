import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import { it, expect, vi, afterEach } from "vitest"
import { ActivationPreflight } from "@/components/acquisition/activation-preflight"
import {
  CycleAttention,
  OpportunityPool,
} from "@/components/acquisition/operating-overview"
import {
  CandidateOpportunities,
  ConversationPreparation,
} from "@/components/acquisition/candidate-opportunities"
import { ManagementOverview } from "@/components/acquisition/management-overview"
import { acquisitionApi as api } from "@/lib/acquisition-api"
import type { DiscoveryTruth } from "@/lib/acquisition-management-truth"
afterEach(() => vi.restoreAllMocks())
it("keeps Jorge feedback optional and non-authorizing", async () => {
  const command = vi.spyOn(api, "conversationFeedback").mockResolvedValue({
    status: "accepted",
    proposalId: "proposal-1",
    candidateId: "candidate-1",
    effectCreated: false,
    wakeRequired: false,
    blocking: false,
  })
  const changed = vi.fn()
  render(
    <ConversationPreparation
      locale="es"
      preparation={{
        id: "proposal-1",
        cycle_id: "cycle-1",
        candidate_id: "candidate-1",
        version: 1,
        evidence_snapshot: [],
        body_hash: "hash",
        created_at: "2026-10-07T00:00:00Z",
        authority_state: "PREPARATION_ONLY",
        effect_authorized: false,
        feedback: [],
        body: {
          signalKind: "OTHER",
          hypothesis: "Hipótesis sintética basada en evidencia",
          unknowns: ["Necesidad interna"],
          question: "¿Quién coordina esta relación?",
          subject: "Pregunta",
          message: "Mensaje sintético de exploración.",
          positions: [],
          chosenPosition: 1,
          claims: [],
        },
      }}
      session={{
        authenticated: true,
        actor: { email: "jorge@brunova.mx", capabilities: ["MANAGE_CYCLE"] },
        csrfToken: "csrf",
        expiresAt: "2099-01-01T00:00:00Z",
      }}
      onChanged={changed}
    />,
  )
  expect(screen.getByText(/Tu comentario es opcional/)).toBeVisible()
  expect(screen.getByText(/No autoriza contacto/)).toBeVisible()
  fireEvent.click(screen.getByText("Dejar comentario opcional"))
  fireEvent.change(screen.getByLabelText("Comentario"), {
    target: { value: "Aclarar la evidencia de la relación." },
  })
  fireEvent.click(screen.getByRole("button", { name: "Guardar comentario" }))
  await waitFor(() =>
    expect(command).toHaveBeenCalledWith(
      expect.any(String),
      "proposal-1",
      "COMMENT",
      "GENERAL",
      "Aclarar la evidencia de la relación.",
      "csrf",
    ),
  )
  expect(changed).toHaveBeenCalledOnce()
})
it.each(["en", "es"] as const)(
  "%s preflight is read-only and missing evidence is not healthy",
  async (locale) => {
    vi.spyOn(api, "activationPreflight").mockResolvedValue({
      ready: false,
      executable: false,
      activationAvailable: false,
      policyVersion: 3,
      observedAt: "2026-09-08T12:00:00Z",
      checks: [
        { component: "INBOUND", ready: false, reason: "PROBE_STALE" },
        { component: "DISCOVERY_MX", ready: false, reason: "PROBE_REQUIRED" },
        {
          component: "DISCOVERY_ZERO_STATE",
          ready: false,
          reason: "PROBE_REQUIRED",
        },
      ],
    })
    render(<ActivationPreflight locale={locale} />)
    expect(
      await screen.findByText(
        locale === "es"
          ? "Requiere verificación antes de activar."
          : "Verification required before activation.",
      ),
    ).toBeVisible()
    expect(
      screen.queryByRole("button", { name: /activate|activar/i }),
    ).not.toBeInTheDocument()
    expect(
      screen.getByText(/observation expired|observación vencida/),
    ).toBeVisible()
    expect(
      screen.getAllByText(
        locale === "es" ? /Discovery en México/ : /Mexico discovery/,
      ).length,
    ).toBeGreaterThan(0)
    expect(
      screen.getAllByText(
        locale === "es" ? /Discovery desde cero/ : /Zero-state discovery/,
      ).length,
    ).toBeGreaterThan(0)
  },
)
it("opportunity groups retain uncertainty and supported context without a fabricated channel", async () => {
  vi.spyOn(api, "cyclePool").mockResolvedValue({
    schemaVersion: "1",
    items: [
      {
        account_id: "synthetic",
        display_name: "SYNTHETIC Norte",
        country: "MX",
        pool_state: "RETAINED",
        readiness_reason: "NO_EXECUTABLE_CHANNEL",
        rationale: null,
        known_unknowns: ["Responsable pendiente"],
        research_version: 1,
        buyer_role_hypothesis: "Directora de Operaciones",
        intervention_hypothesis: "Hipótesis sintética de coordinación",
        channel: "NO_EXECUTABLE_CHANNEL",
      },
    ],
  })
  const inspect = vi.fn()
  render(
    <OpportunityPool cycleId="synthetic" locale="es" onInspect={inspect} />,
  )
  expect(await screen.findByText("SYNTHETIC Norte")).toBeVisible()
  expect(
    screen.getByText(
      "Existe una hipótesis de intervención respaldada; revisa la evidencia antes de decidir.",
    ),
  ).toBeVisible()
  fireEvent.click(screen.getByText("Texto original del Engine"))
  expect(screen.getByText(/Hipótesis sintética de coordinación/)).toBeVisible()
  expect(screen.getByText("Sin canal ejecutable confirmado.")).toBeVisible()
  fireEvent.click(
    screen.getByRole("button", {
      name: "Revisar evidencia y siguiente acción",
    }),
  )
  expect(inspect).toHaveBeenCalledWith("synthetic")
})

it.each(["en", "es"] as const)(
  "%s attention treats the accepted operating decision as evidence, not the current blocker",
  async (locale) => {
    vi.spyOn(api, "cycleReview").mockResolvedValue({
      schemaVersion: "1",
      review: {
        cycleId: "real-cycle",
        control: null,
        pool: {},
        markets: [],
        waves: [],
        attempts: 0,
        newProspects: 0,
        attemptsToday: 0,
        responses: {},
        quality: {},
        zeroResponseMeansFailure: false,
        automaticIcpMutation: false,
        productionExecution: "DISABLED",
      },
    })
    vi.spyOn(api, "discovery").mockResolvedValue({
      schemaVersion: "1",
      state: "WAITING",
      displayLimits: { missions: 50, candidates: 50, planning: 20 },
      totals: {
        observations: 0,
        candidates: 17,
        resolved: 7,
        ambiguous: 0,
        unresolved: 10,
        held: 17,
        admitted: 0,
        pending_work: 0,
      },
      sources: [],
      missions: [],
      planning: [],
      candidates: [],
      routineOperatingSessions: [
        {
          session_id: "session-accepted",
          local_date: "2026-09-20",
          status: "HELD_REVIEW",
          recurrence_state: "HOLD",
          capacity: { unitsUsed: 1, requestsUsed: 0 },
          decisions: [
            {
              decision: "STOP",
              strongestAlternative: { workClass: "DISCOVERY", requests: 6 },
              outcome: { informationYield: "NONE" },
            },
          ],
          report: { learning: "No candidate information gained." },
        },
      ],
    } as never)
    const navigate = vi.fn()
    render(
      <CycleAttention
        cycleId="real-cycle"
        locale={locale}
        onNavigate={navigate}
      />,
    )
    expect(
      await screen.findByRole("heading", {
        name:
          locale === "es"
            ? "Aceptación humana del Portal pendiente"
            : "Human Portal acceptance pending",
      }),
    ).toBeVisible()
    fireEvent.click(
      screen.getByRole("button", {
        name: locale === "es" ? "Inspeccionar decisión" : "Inspect decision",
      }),
    )
    expect(
      screen.getByRole("heading", {
        name: locale === "es" ? "Qué ocurrió" : "What happened",
      }),
    ).toBeVisible()
    expect(
      screen.getByText(
        locale === "es"
          ? /única decisión actual es la aceptación humana del Portal/
          : /only current decision is Human Portal acceptance/,
      ),
    ).toBeVisible()
    expect(navigate).not.toHaveBeenCalled()
  },
)

it("archives through the governed command while preserving an explicit disabled automatic policy", async () => {
  const command = vi.spyOn(api, "candidateWorkspace").mockResolvedValue({
    status: "accepted",
    candidateId: "candidate-synthetic",
    workspaceState: "ARCHIVED",
    wakeRequired: false,
  })
  const changed = vi.fn()
  const data = {
    candidates: [
      {
        id: "candidate-synthetic",
        name: "Synthetic Operations Group",
        domain: null,
        identity_state: "UNRESOLVED",
        screen_state: "HOLD",
        reasons: [],
        missing: ["identity"],
        market_contexts: ["MX"],
        sources: ["synthetic-source"],
        sightings: 1,
        admissions: 0,
        archived: false,
      },
    ],
    journeys: [],
    workExecution: [],
    batchCandidates: [],
    routineOperatingSessions: [],
    learningWaves: [],
    firstExploratoryEffect: [],
    archivePolicy: {
      version: 1,
      enabled: false,
      terminal_retention_days: 30,
      stale_unresolved_retention_days: 180,
      definition: {},
      definition_hash: "a".repeat(64),
    },
    archiveEligibility: [],
  } as unknown as DiscoveryTruth
  render(
    <CandidateOpportunities
      data={data}
      locale="en"
      session={{
        authenticated: true,
        actor: { email: "human@brunova.mx", capabilities: ["MANAGE_CYCLE"] },
        csrfToken: "csrf",
        expiresAt: "2099-01-01T00:00:00Z",
      }}
      onChanged={changed}
    />,
  )
  fireEvent.click(screen.getByText("Archive policy"))
  expect(screen.getByText(/Policy v1 is disabled/)).toBeVisible()
  fireEvent.click(screen.getByText("Remove from active view"))
  fireEvent.change(screen.getByLabelText("Reason"), {
    target: { value: "No current workspace value; preserve evidence." },
  })
  fireEvent.click(screen.getByRole("button", { name: "Archive organization" }))
  await waitFor(() =>
    expect(command).toHaveBeenCalledWith(
      expect.any(String),
      "candidate-synthetic",
      "ARCHIVE_CANDIDATE",
      "No current workspace value; preserve evidence.",
      "csrf",
    ),
  )
  expect(changed).toHaveBeenCalledOnce()
})

it("shows the actual local close time, elapsed duration and binding capacity limit", async () => {
  vi.spyOn(api, "cycleReview").mockResolvedValue({
    schemaVersion: "1",
    review: {
      cycleId: "real-cycle",
      control: null,
      pool: {},
      markets: [],
      waves: [],
      attempts: 0,
      newProspects: 0,
      attemptsToday: 0,
      responses: {},
      quality: {},
      zeroResponseMeansFailure: false,
      automaticIcpMutation: false,
      productionExecution: "DISABLED",
    },
  })
  vi.spyOn(api, "discovery").mockResolvedValue({
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
    candidates: [],
    routineOperatingSessions: [
      {
        id: "manual-session",
        cycle_id: "real-cycle",
        local_date: "2026-09-26T00:00:00.000Z",
        timezone: "America/Mexico_City",
        window_opens_at: "2026-09-26T19:06:58.384Z",
        window_closes_at: "2026-09-26T20:56:58.345Z",
        status: "COMPLETE",
        started_at: "2026-09-26T19:06:58.384Z",
        closed_at: "2026-09-26T19:18:21.143Z",
        opened_late: false,
        early_stop_reason: "DAILY_OR_WORK_BUDGET_EXHAUSTED",
        close_reason: "DAILY_CONTINUOUS_WINDOW_COMPLETE",
        decisions: [],
        report: {},
        capacity: {
          unitsUsed: 4,
          workUnitBudget: 4,
          requestsUsed: 6,
          sourceRequestBudget: 12,
          minutesUsed: 5,
          timeCapacityMinutes: 110,
        },
        recurrence_state: "CONTINUOUS_INTERNAL",
        prospect_effects_authorized: false,
        lease_expires_at: null,
        operational_status: "TERMINAL",
      },
    ],
    productionOperatingState: {
      current: true,
      recurrence_authorized: true,
    },
    archiveEligibility: [],
  } as never)
  render(
    <ManagementOverview
      cycleId="real-cycle"
      cycleStatus="ACTIVE"
      locale="es"
      onNavigate={vi.fn()}
    />,
  )
  fireEvent.click(await screen.findByText("Contabilidad técnica"))
  expect(screen.getByText(/26 sep 2026, 1:18 p\.m\./i)).toBeVisible()
  expect(screen.getByText(/duración: 11 min/i)).toBeVisible()
  expect(screen.getByText(/límite de 4 slots alcanzado/i)).toBeVisible()
  expect(screen.getByText(/4 \/ 4/)).toBeVisible()
  expect(screen.getByText(/6 \/ 12 consultas/)).toBeVisible()
  expect(screen.getByText(/5 \/ 110 minutos efectivos/)).toBeVisible()
})
