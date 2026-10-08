import { render, screen, cleanup } from "@testing-library/react"
import { afterEach, expect, it } from "vitest"
import { AllocationCalibration } from "@/components/acquisition/allocation-comparison"
afterEach(cleanup)
it.each(["en", "es"] as const)(
  "%s calibration explains alternatives without an execution control",
  (locale) => {
    const body = {
      plans: [
        {
          decision: "STOP",
          why: "Synthetic Company evidence is exhausted.",
          expectedResult: "No invented progression.",
          selectedAlternativeId: "defer",
          alternatives: [
            {
              id: "defer",
              workClass: "DEFER",
              uncertainty: "Internal need remains unknown.",
              possibleDecisionChange: "None without new evidence.",
              existingEvidence: "Prior bounded Company read.",
              redundancy: "Same path already exhausted.",
              sourcePath: "No new allowed path.",
              informationGain: "Low expected gain.",
              downstreamUnlock: "No admission implied.",
              recentFeedback: "No strict progression.",
              inventoryPressure: "Unresolved backlog.",
              whyNotDiscovery: "No compelling coverage gap.",
              boundedCost: { maxRequests: 0, maxMinutes: 0 },
            },
          ],
        },
      ],
    }
    render(<AllocationCalibration body={body} locale={locale} />)
    expect(screen.getByText(/Synthetic Company evidence/)).toBeVisible()
    expect(
      screen.getByText(locale === "es" ? /No ejecutada/ : /Not executed/),
    ).toBeVisible()
    expect(
      screen.getByText(
        locale === "es" ? /Opciones comparadas/ : /Alternatives compared/,
      ),
    ).toBeVisible()
    expect(screen.queryByRole("button")).toBeNull()
  },
)
