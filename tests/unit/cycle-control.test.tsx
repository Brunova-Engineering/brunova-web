import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import { beforeEach, expect, it, vi } from "vitest"
import { CycleControlSection } from "@/components/acquisition/cycle-control"
import {
  acquisitionApi as api,
  type CyclePolicyDefinition,
  type CycleReview,
  type PortalSession,
} from "@/lib/acquisition-api"
const session: PortalSession = {
  authenticated: true,
  actor: {
    email: "synthetic@brunova.mx",
    capabilities: ["VIEW_ACQUISITION", "MANAGE_CYCLE"],
  },
  csrfToken: "synthetic-csrf",
  expiresAt: "2026-09-08T00:00:00Z",
}
const policy: CyclePolicyDefinition = {
  schemaVersion: "1",
  implementationReadiness: "COMPLETE",
  readyForRehearsal: true,
  executable: false,
  policyHash: "synthetic",
  policy: {
    policyId: "brunova-systems-cycle-1",
    policyVersion: "3",
    configurationState: "CONFIGURED",
    productionExecution: "DISABLED",
    geography: ["MX", "US"],
    limits: {
      researchUniverse: 75,
      outboundApproved: 12,
      waveSize: 4,
      waveCount: 3,
    },
  },
}
const review: CycleReview = {
  cycleId: "synthetic-7c",
  control: {
    version: 3,
    state: "CONFIGURED",
    technical_halt: null,
    discovery_stop_reason: null,
  },
  pool: { READY_NOW: 4, RETAINED: 71 },
  markets: [
    { country: "MX", discovered: 35, qualified: 35 },
    { country: "US", discovered: 40, qualified: 40 },
  ],
  waves: [
    {
      id: "wave-synthetic",
      number: 1,
      state: "APPROVED",
      composition_hash: "exact",
      composition: [{ accountId: "synthetic-a" }],
    },
  ],
  attempts: 0,
  newProspects: 0,
  attemptsToday: 0,
  responses: {},
  quality: {},
  zeroResponseMeansFailure: false,
  automaticIcpMutation: false,
  productionExecution: "DISABLED",
}
beforeEach(() => {
  vi.spyOn(api, "approveWave").mockResolvedValue({
    cycleVersion: 4,
    wakeRequired: false,
  })
  vi.spyOn(api, "cyclePool").mockResolvedValue({
    schemaVersion: "1",
    items: [],
  })
  vi.spyOn(api, "cyclePolicy").mockResolvedValue(policy)
  vi.spyOn(api, "cycleReview").mockResolvedValue({ schemaVersion: "1", review })
  vi.spyOn(api, "cycleCommand").mockResolvedValue({
    cycleVersion: 4,
    wakeRequired: false,
  })
})
it("withholds approval when a displayed buyer or readiness binding needs revalidation", async () => {
  vi.mocked(api.cycleReview).mockResolvedValue({
    schemaVersion: "1",
    review: {
      ...review,
      waves: [
        {
          ...review.waves[0]!,
          state: "PLANNED",
          members: [
            {
              accountId: "synthetic-a",
              company: "SYNTHETIC stale buyer",
              domain: "a.synthetic.local",
              buyer: null,
              channel: "EMAIL",
              readinessReason: "BUYER_REVALIDATION",
              poolState: "RETAINED",
              tier: "HIGH",
              reason: null,
              knownUnknowns: [],
            },
          ],
        },
      ],
    },
  })
  render(
    <CycleControlSection
      cycleId="synthetic-7c"
      session={session}
      locale="en"
    />,
  )
  expect(
    await screen.findByText(/composition needs revalidation/),
  ).toBeVisible()
  expect(
    screen.queryByRole("button", { name: "Approve wave" }),
  ).not.toBeInTheDocument()
  expect(api.approveWave).not.toHaveBeenCalled()
})
it("does not offer another composition when all executable people already belong to a wave", async () => {
  vi.mocked(api.cycleReview).mockResolvedValue({
    schemaVersion: "1",
    review: {
      ...review,
      waves: [
        {
          ...review.waves[0]!,
          state: "COMPLETE",
          composition: [
            { accountId: "synthetic-a", personId: "synthetic-person" },
          ],
        },
      ],
    },
  })
  vi.mocked(api.cyclePool).mockResolvedValue({
    schemaVersion: "1",
    items: [
      {
        account_id: "synthetic-a",
        display_name: "SYNTHETIC retained",
        pool_state: "RETAINED",
        readiness_reason: "EXECUTABLE_CANDIDATE",
        binding: { personId: "synthetic-person" },
        rationale: null,
        known_unknowns: [],
        research_version: 1,
      },
    ],
  })
  render(
    <CycleControlSection
      cycleId="synthetic-7c"
      session={session}
      locale="en"
    />,
  )
  expect(
    await screen.findByText(/No new executable prospects are available/),
  ).toBeVisible()
  expect(
    screen.queryByRole("button", {
      name: "Prepare strongest available (up to four)",
    }),
  ).not.toBeInTheDocument()
  expect(api.cycleCommand).not.toHaveBeenCalled()
})
it("shows review outcomes in business language before technical JSON", async () => {
  vi.mocked(api.cycleReview).mockResolvedValue({
    schemaVersion: "1",
    review: {
      ...review,
      delivery: { SUCCEEDED: 1 },
      funnel: { handoffs: 1, acceptedHandoffs: 1 },
      responses: { UNKNOWN: 1 },
    },
  })
  render(
    <CycleControlSection
      cycleId="synthetic-7c"
      session={session}
      locale="en"
    />,
  )
  expect(await screen.findByText("Account-wave deliveries: 1")).toBeInTheDocument()
  expect(
    screen.getByText("Response requiring interpretation: 1"),
  ).toBeInTheDocument()
  expect(screen.getByText("Handoffs / accepted: 1 / 1")).toBeInTheDocument()
})
it("approves the exact displayed companies without asking for technical references", async () => {
  vi.mocked(api.cycleReview).mockResolvedValue({
    schemaVersion: "1",
    review: {
      ...review,
      waves: [
        {
          ...review.waves[0]!,
          state: "PLANNED",
          members: [
            {
              accountId: "synthetic-a",
              company: "SYNTHETIC Monterrey Logistics",
              domain: "mx.synthetic.local",
              buyer: "SYNTHETIC Operations Director",
              channel: "EMAIL",
              poolState: "READY_NOW",
              readinessReason: "EXECUTABLE_CANDIDATE",
              tier: "HIGH",
              reason: "Observed coordination warrants investigation",
              knownUnknowns: ["Budget"],
            },
          ],
        },
      ],
    },
  })
  render(
    <CycleControlSection
      cycleId="synthetic-7c"
      session={session}
      locale="en"
    />,
  )
  expect(await screen.findByText("SYNTHETIC Monterrey Logistics")).toBeVisible()
  expect(
    screen.getByText(/SYNTHETIC Operations Director/, { selector: "p" }),
  ).toBeVisible()
  fireEvent.click(screen.getByRole("button", { name: "Approve wave" }))
  await waitFor(() =>
    expect(api.approveWave).toHaveBeenCalledWith(
      expect.any(String),
      {
        cycleId: "synthetic-7c",
        expectedVersion: 3,
        waveId: "wave-synthetic",
        compositionHash: "exact",
      },
      "synthetic-csrf",
    ),
  )
  expect(
    screen.queryByRole("textbox", { name: /objective|hash|identifier/i }),
  ).not.toBeInTheDocument()
})
it.each(["en", "es"] as const)(
  "shows configured/not-active policy without inventing a real Cycle (%s)",
  async (locale) => {
    render(<CycleControlSection cycleId="" session={session} locale={locale} />)
    expect(
      await screen.findByText(
        locale === "es"
          ? "Una wave aparecerá cuando el Engine identifique candidatos ejecutables. Prepararla no autoriza contactar."
          : "A wave appears when the Engine identifies executable candidates. Preparing it does not authorize outreach.",
      ),
    ).toBeVisible()
    expect(api.cycleReview).not.toHaveBeenCalled()
    expect(
      screen.queryByRole("button", { name: /^(Activate|Activar)$/ }),
    ).not.toBeInTheDocument()
  },
)
it("keeps a pool larger than twelve and binds Management review to exact current version", async () => {
  render(
    <CycleControlSection
      cycleId="synthetic-7c"
      session={session}
      locale="es"
    />,
  )
  expect(await screen.findByText("71")).toBeVisible()
  expect(screen.getByText(/Sin respuesta no significa fracaso/)).toBeVisible()
  fireEvent.change(screen.getByRole("textbox"), {
    target: { value: "SYNTHETIC evidence-grounded adjustment" },
  })
  fireEvent.click(screen.getByRole("button", { name: "Ajustar" }))
  await waitFor(() =>
    expect(api.cycleCommand).toHaveBeenCalledWith(
      expect.any(String),
      {
        cycleId: "synthetic-7c",
        operation: "REVIEW_WAVE",
        expectedVersion: 3,
        waveId: "wave-synthetic",
        decision: "ADJUST",
        reason: "SYNTHETIC evidence-grounded adjustment",
      },
      "synthetic-csrf",
    ),
  )
})
it("never fabricates current counters or actions when Engine read fails", async () => {
  vi.mocked(api.cycleReview).mockRejectedValue(Error("unavailable"))
  render(
    <CycleControlSection
      cycleId="synthetic-7c"
      session={session}
      locale="en"
    />,
  )
  expect(
    await screen.findByText(
      "Current state could not be verified. Refresh before deciding.",
    ),
  ).toBeVisible()
  expect(screen.queryByText("71")).not.toBeInTheDocument()
  expect(screen.queryByRole("button", { name: "Stop" })).not.toBeInTheDocument()
})
