import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import { beforeAll, beforeEach, expect, it, vi } from "vitest"
import { AcquisitionPortal } from "@/components/acquisition/portal"
import {
  acquisitionText as text,
  acquisitionCode,
} from "@/content/acquisition-locale"
import {
  acquisitionApi as api,
  AcquisitionError,
  type Attention,
  type AccountDetail,
  type PortalSession,
} from "@/lib/acquisition-api"

const session: PortalSession = {
  authenticated: true,
  actor: {
    email: "synthetic@brunova.mx",
    capabilities: [
      "VIEW_ACQUISITION",
      "VIEW_HEALTH",
      "RECORD_ATTENTION_DISPOSITION",
    ],
  },
  csrfToken: "synthetic-csrf",
  expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
}
const item = (name = "SYNTHETIC First"): Attention => ({
  schemaVersion: "1",
  attention_id: name,
  account_id: name,
  cycle_id: "synthetic",
  displayName: name,
  domain: "account.synthetic.local",
  status: "ACTIVE",
  version: 2,
  eligible: true,
  stale: false,
  reconsideration_required: false,
  next_stage_ready: false,
  human: null,
  allowedDispositions: ["CONTINUE", "HOLD", "REJECT"],
  result: {
    tier: "HIGH",
    evidenceConfidence: "HIGH",
    hypothesisConfidence: "MEDIUM",
    recommendation: "REVIEW_ACCOUNT_PRIORITY",
    whyNow: [
      {
        assertionId: "fact",
        observedContext: "SYNTHETIC current QBO close signal",
        validAsOf: null,
      },
    ],
    hardStops: [],
    limitingFactors: ["UNKNOWNS_REMAIN_EXPLICIT"],
    supportingAssertionIds: ["fact"],
    knownUnknowns: ["Current burden is unknown"],
    materialUnknowns: [],
    policyId: "brunova-systems-account-priority",
    policyVersion: "1",
    hypothesisRefs: [
      {
        assertionId: "hypothesis",
        falsifier: "The process is already automated",
      },
    ],
  },
})
const research: AccountDetail = {
  sourceObservations: [],
  schemaVersion: "1",
  accountId: "SYNTHETIC First",
  cycleId: "synthetic",
  canonicalIdentity: {
    domain: "account.synthetic.local",
    displayName: "SYNTHETIC First",
  },
  researchOutcome: "QUALIFIED",
  stage: "RESEARCH_DECIDED",
  latestMaterialActivityAt: null,
  rationale: { summary: "Supported synthetic premise" },
  knownUnknowns: ["Current burden is unknown"],
  materialEvents: [],
  assertions: [
    {
      id: "fact",
      epistemic_status: "OBSERVED_FACT",
      statement: "SYNTHETIC observed fact",
      confidence: "HIGH",
    },
    {
      id: "hypothesis",
      epistemic_status: "WORKING_HYPOTHESIS",
      statement: "SYNTHETIC working hypothesis",
      confidence: "MEDIUM",
      falsifier: "The process is already automated",
    },
    {
      id: "unknown",
      epistemic_status: "UNKNOWN",
      statement: "SYNTHETIC unknown",
      confidence: "HIGH",
    },
  ],
}
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "")
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open")
  }
})
beforeEach(() => {
  vi.spyOn(api, "discovery").mockResolvedValue({
    schemaVersion: "1",
    state: "WAITING",
    displayLimits: { missions: 50, candidates: 50, planning: 20 },
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
    missions: [],
    planning: [],
    candidates: [],
  })
  vi.spyOn(api, "cyclePool").mockResolvedValue({
    schemaVersion: "1",
    items: [],
  })
  vi.spyOn(api, "cycleReview").mockResolvedValue({
    schemaVersion: "1",
    review: {
      cycleId: "synthetic",
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
  vi.spyOn(api, "operatingModel").mockResolvedValue({
    currentExecutionScope: "ADMITTED_INTERNAL_ROUTINE_WORK",
    chatRequiredForRuntime: false,
    portalRequiredForRuntime: false,
    activity: [],
  })
  vi.spyOn(api, "activationPreflight").mockResolvedValue({
    ready: false,
    executable: false,
    activationAvailable: false,
    observedAt: "2026-09-08T00:00:00Z",
    policyVersion: 3,
    checks: [],
  })
  vi.spyOn(api, "contract").mockResolvedValue({
    schemaVersion: "1",
    attentionSurfaceVersion: "3g-v1",
  })
  vi.spyOn(api, "cycles").mockResolvedValue({ items: [], nextCursor: null })
  vi.spyOn(api, "health").mockResolvedValue({
    schemaVersion: "1",
    databaseReady: true,
    realAcquisitionDataAllowed: false,
    externalEffectsMode: "disabled",
    pendingWorkCount: 0,
    oldestPendingAt: null,
  })
  vi.spyOn(api, "accounts").mockResolvedValue({ items: [], nextCursor: null })
  vi.spyOn(api, "attention").mockResolvedValue({
    schemaVersion: "1",
    items: [item()],
  })
  vi.spyOn(api, "attentionDetail").mockResolvedValue(item())
  vi.spyOn(api, "detail").mockResolvedValue(research)
  vi.spyOn(api, "counts").mockResolvedValue({
    schemaVersion: "1",
    configured: true,
    counts: {
      capacity: 5,
      prioritized_count: 25,
      active_count: 1,
      overflow_count: 14,
      eligible_unresolved_count: 19,
      candidate_count: 18,
    },
    tiers: { high: 10, medium: 9, low: 6 },
  })
  vi.spyOn(api, "work").mockResolvedValue({ items: [], nextCursor: null })
})
function populated() {
  vi.mocked(api.cycles).mockResolvedValue({
    items: [
      {
        schemaVersion: "1",
        cycleId: "synthetic",
        status: "CALIBRATION",
        policy: { id: "cycle", version: "1" },
        outcomeCounts: { qualified: 25 },
        stageCounts: { total: 25 },
      },
    ],
    nextCursor: null,
  })
}
it("shows intentional empty state and disabled gates, no fake accounts", async () => {
  const { container } = render(<AcquisitionPortal session={session} locale="es" />)
  expect(container.querySelector("main.acq")).toHaveAttribute("data-authenticated", "true")
  expect(
    await screen.findByText("Aún no hay un ciclo de Adquisición."),
  ).toBeVisible()
  expect(
    screen.getByText(/DATOS REALES DE ADQUISICIÓN: DESHABILITADOS/),
  ).toBeVisible()
  expect(screen.getByText(/EFECTOS EXTERNOS: DESHABILITADOS/)).toBeVisible()
  expect(screen.queryByText("SYNTHETIC First")).not.toBeInTheDocument()
})
it("401 and unavailable/loading states are explicit", async () => {
  vi.mocked(api.contract).mockRejectedValue(new AcquisitionError(401))
  render(<AcquisitionPortal session={session} locale="es" />)
  expect(screen.getByText(/Actualizando estado/)).toBeVisible()
  expect(
    await screen.findByRole("link", { name: "Volver a Brunova" }),
  ).toHaveAttribute("href", "/es")
  expect(screen.getByRole("alert")).toHaveTextContent("Tu sesión terminó")
})
it("shows epistemic distinctions, confirms disposition and displays Engine refill", async () => {
  populated()
  const decide = vi.spyOn(api, "disposition").mockImplementation(async () => {
    vi.mocked(api.attention).mockResolvedValue({
      schemaVersion: "1",
      items: [item("SYNTHETIC Next")],
    })
    return {
      schemaVersion: "1",
      status: "accepted",
      nextStageReady: true,
      refill: { activated: ["next"], withdrawn: [] },
    }
  })
  render(<AcquisitionPortal session={session} locale="es" />)
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Necesita tu atención" }),
    ).toBeEnabled(),
  )
  if (
    screen.queryByRole("button", { name: "Necesita tu atención" }) &&
    !screen.queryByText("Aún no hay un ciclo de Adquisición.")
  )
    fireEvent.click(
      screen.getByRole("button", { name: "Necesita tu atención" }),
    )
  fireEvent.click(
    await screen.findByRole("button", { name: "Revisar evidencia y decisión" }),
  )
  const modal = within(screen.getByRole("dialog"))
  expect(await modal.findByText("SYNTHETIC observed fact")).toBeVisible()
  expect(modal.getByText("Hipótesis de trabajo")).toBeVisible()
  expect(modal.getByText("Lo que no sabemos")).toBeVisible()
  fireEvent.click(modal.getByRole("button", { name: "Continuar" }))
  fireEvent.change(modal.getByLabelText("Motivo (obligatorio)"), {
    target: { value: "Synthetic review complete" },
  })
  fireEvent.click(modal.getByRole("button", { name: "Confirmar Continuar" }))
  expect(
    await screen.findByRole("heading", { name: "SYNTHETIC Next" }),
  ).toBeVisible()
  expect(
    screen.getByText(/siguiente cuenta elegible fue promovida/),
  ).toBeVisible()
  expect(decide).toHaveBeenCalledTimes(1)
  expect(decide.mock.calls[0]?.[0]).toMatchObject({
    expectedVersion: 2,
    disposition: "CONTINUE",
  })
})
it("409 refreshes current state without retrying with a new version", async () => {
  populated()
  const decide = vi
    .spyOn(api, "disposition")
    .mockRejectedValue(new AcquisitionError(409))
  render(<AcquisitionPortal session={session} locale="es" />)
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Necesita tu atención" }),
    ).toBeEnabled(),
  )
  if (
    screen.queryByRole("button", { name: "Necesita tu atención" }) &&
    !screen.queryByText("Aún no hay un ciclo de Adquisición.")
  )
    fireEvent.click(
      screen.getByRole("button", { name: "Necesita tu atención" }),
    )
  fireEvent.click(
    await screen.findByRole("button", { name: "Revisar evidencia y decisión" }),
  )
  const modal = within(screen.getByRole("dialog"))
  fireEvent.click(await modal.findByRole("button", { name: "Poner en espera" }))
  fireEvent.change(modal.getByLabelText("Motivo (obligatorio)"), {
    target: { value: "Need more evidence" },
  })
  vi.mocked(api.attentionDetail).mockResolvedValue({
    ...item(),
    version: 3,
    allowedDispositions: [],
  })
  fireEvent.click(
    modal.getByRole("button", { name: "Confirmar Poner en espera" }),
  )
  expect(
    await modal.findByText("No hay acciones permitidas en el estado actual."),
  ).toBeVisible()
  expect(decide).toHaveBeenCalledTimes(1)
  expect(
    modal.queryByRole("button", { name: "Confirmar Poner en espera" }),
  ).not.toBeInTheDocument()
})
it("network retry retains command ID and payload; read-only users have no decisions", async () => {
  populated()
  const decide = vi
    .spyOn(api, "disposition")
    .mockRejectedValue(new AcquisitionError(503))
  render(<AcquisitionPortal session={session} locale="es" />)
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Necesita tu atención" }),
    ).toBeEnabled(),
  )
  if (
    screen.queryByRole("button", { name: "Necesita tu atención" }) &&
    !screen.queryByText("Aún no hay un ciclo de Adquisición.")
  )
    fireEvent.click(
      screen.getByRole("button", { name: "Necesita tu atención" }),
    )
  fireEvent.click(
    await screen.findByRole("button", { name: "Revisar evidencia y decisión" }),
  )
  const modal = within(screen.getByRole("dialog"))
  fireEvent.click(await modal.findByRole("button", { name: "Rechazar" }))
  fireEvent.change(modal.getByLabelText("Motivo (obligatorio)"), {
    target: { value: "Synthetic not suitable" },
  })
  fireEvent.click(modal.getByRole("button", { name: "Confirmar Rechazar" }))
  fireEvent.click(
    await modal.findByRole("button", { name: "Reintentar la misma decisión" }),
  )
  await waitFor(() => expect(decide).toHaveBeenCalledTimes(2))
  expect(decide.mock.calls[0]).toEqual(decide.mock.calls[1])
})
it("transport rejects incompatible contract and does not leak raw errors", async () => {
  vi.mocked(api.contract).mockRestore()
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          schemaVersion: "1",
          attentionSurfaceVersion: "future",
        }),
        { status: 200 },
      ),
    ),
  )
  await expect(api.contract()).rejects.toMatchObject({ status: 502 })
  vi.unstubAllGlobals()
})

it.each(["en", "es"] as const)(
  "%s covers populated tabs, evidence, actions and unchanged Engine payloads",
  async (locale) => {
    populated()
    vi.mocked(api.accounts).mockResolvedValue({
      items: [research],
      nextCursor: null,
    })
    vi.mocked(api.work).mockResolvedValue({
      items: [
        {
          workItemId: "synthetic-work",
          schemaVersion: "1",
          workType: "ACCOUNT_RESEARCH",
          state: "QUEUED",
          attemptCount: 0,
          maxAttempts: 3,
          availableAt: "2026-09-05T12:00:00Z",
          correlationId: null,
        },
      ],
      nextCursor: null,
    })
    const decide = vi.spyOn(api, "disposition").mockResolvedValue({
      schemaVersion: "1",
      status: "accepted",
      nextStageReady: true,
      refill: { activated: ["next"], withdrawn: [] },
    })
    const { container } = render(
      <AcquisitionPortal session={session} locale={locale} />,
    )
    const t = (key: Parameters<typeof text>[1]) => text(locale, key)
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: t("Necesita tu atención") }),
      ).toBeEnabled(),
    )
    fireEvent.click(
      screen.getByRole("button", { name: t("Necesita tu atención") }),
    )
    await screen.findByRole("button", {
      name: t("Revisar evidencia y decisión"),
    })
    expect(screen.getByRole("main")).toHaveAttribute("lang", locale)
    expect(container.textContent).not.toMatch(
      locale === "en"
        ? /Actualizar|Cerrar sesión|Por qué ahora|Qué falta saber|Cargando evidencia|Sin actividad/
        : /Refresh|Logout|Why now|What remains unknown|Loading evidence|No activity/,
    )
    fireEvent.click(
      screen.getByRole("button", {
        name: locale === "es" ? "Resumen" : "Overview",
      }),
    )
    expect(
      await screen.findByRole("heading", {
        name: locale === "es" ? /Ciclo 1/ : /Cycle 1/,
      }),
    ).toBeVisible()
    fireEvent.click(
      screen.getByRole("button", {
        name: locale === "es" ? "Oportunidades" : "Opportunities",
      }),
    )
    expect(
      await screen.findByRole("heading", {
        name:
          locale === "es"
            ? "Organizaciones conservadas para consideración"
            : "Organizations retained for consideration",
      }),
    ).toBeVisible()
    fireEvent.click(
      screen.getByRole("button", {
        name: locale === "es" ? "Estado del sistema" : "System status",
      }),
    )
    expect(
      await screen.findByRole("heading", {
        name: locale === "es" ? "Estado del sistema" : "System status",
      }),
    ).toBeVisible()
    fireEvent.click(
      screen.getByText(
        locale === "es" ? "Actividad y auditoría" : "Activity and audit",
      ),
    )
    fireEvent.change(screen.getByLabelText(t("Estado del trabajo")), {
      target: { value: "WORKING" },
    })
    await waitFor(() =>
      expect(api.work).toHaveBeenCalledWith("synthetic", "", "WORKING"),
    )
    fireEvent.click(
      screen.getByRole("button", { name: t("Necesita tu atención") }),
    )
    fireEvent.click(
      screen.getByRole("button", { name: t("Revisar evidencia y decisión") }),
    )
    const modal = within(screen.getByRole("dialog"))
    expect(await modal.findByText("SYNTHETIC observed fact")).toBeVisible()
    for (const title of [
      "Lo que sabemos · Hechos observados",
      "Lo que respalda la evidencia · Inferencias",
      "Hipótesis de trabajo",
      "Lo que no sabemos",
      "Evidencia desactualizada / en conflicto",
    ] as const)
      expect(modal.getByText(t(title))).toBeVisible()
    for (const action of ["CONTINUE", "HOLD", "REJECT"])
      expect(
        modal.getByRole("button", { name: acquisitionCode(locale, action) }),
      ).toBeVisible()
    fireEvent.click(
      modal.getByRole("button", { name: acquisitionCode(locale, "CONTINUE") }),
    )
    fireEvent.change(modal.getByLabelText(t("Motivo (obligatorio)")), {
      target: { value: "SYNTHETIC unchanged reason" },
    })
    fireEvent.click(
      modal.getByRole("button", {
        name: `${t("Confirmar")} ${acquisitionCode(locale, "CONTINUE")}`,
      }),
    )
    await waitFor(() => expect(decide).toHaveBeenCalledTimes(1))
    expect(decide.mock.calls[0]?.[0]).toMatchObject({
      disposition: "CONTINUE",
      expectedVersion: 2,
      reason: "SYNTHETIC unchanged reason",
    })
    expect(
      await screen.findByText(new RegExp(t("Decisión confirmada:"))),
    ).toHaveTextContent(
      t(
        "La siguiente cuenta elegible fue promovida según la política vigente.",
      ),
    )
  },
)

it("navigation keeps the selected section aligned with its content without a page refresh", async () => {
  populated()
  const { container } = render(
    <AcquisitionPortal session={session} locale="en" />,
  )
  expect(screen.getByRole("button", { name: "System status" })).toBeDisabled()
  await screen.findByRole("heading", { name: /Cycle 1/ })
  await waitFor(() =>
    expect(
      screen.queryByText(text("en", "Actualizando estado del Engine…")),
    ).not.toBeInTheDocument(),
  )
  expect(screen.getByRole("button", { name: "System status" })).toBeEnabled()
  expect(
    within(
      screen.getByRole("navigation", { name: "Acquisition sections" }),
    ).queryByRole("button", { name: "System status" }),
  ).not.toBeInTheDocument()
  const panel = container.querySelector<HTMLElement>("#acq-active-panel")!
  const sections = [
    ["Opportunities", "Organizations retained for consideration"],
    ["Outreach", "Outreach"],
    ["Needs your attention", "Needs your attention"],
    ["System status", "Operating state"],
    ["Overview", "Cycle 1"],
  ] as const
  for (const [tab, heading] of sections) {
    const button = screen.getByRole("button", { name: tab })
    fireEvent.click(button)
    expect(button).toHaveAttribute("aria-current", "page")
    expect(
      await within(panel).findByRole("heading", {
        name: new RegExp(heading, "i"),
      }),
    ).toBeVisible()
    if (tab === "System status") {
      expect(
        within(panel).queryByRole("heading", { name: "Outreach" }),
      ).not.toBeInTheDocument()
    }
  }
})

it.each(["en", "es"] as const)(
  "%s empty UI has no opposite-locale navigation or gate labels",
  async (locale) => {
    const { container } = render(
      <AcquisitionPortal session={session} locale={locale} />,
    )
    await screen.findByText(text(locale, "Aún no hay un ciclo de Adquisición."))
    expect(container.textContent).not.toMatch(
      locale === "en"
        ? /Sin ciclo|Calificadas|Priorizadas|Atención activa|Trabajo pendiente|Base de datos|DESHABILITADOS/
        : /No cycle|Qualified|Prioritized|Active Attention|Pending Work|Database|DISABLED/,
    )
  },
)

it.each([401, 403, 409, 422, 429, 502, 503, 500])(
  "EN renders localized safe HTTP %i errors",
  async (status) => {
    const error = new AcquisitionError(status)
    vi.mocked(api.contract).mockRejectedValue(error)
    render(<AcquisitionPortal session={session} locale="en" />)
    expect(await screen.findByRole("alert")).not.toHaveTextContent(
      error.message,
    )
    expect(screen.getByRole("alert").textContent?.trim()).toBeTruthy()
  },
)
