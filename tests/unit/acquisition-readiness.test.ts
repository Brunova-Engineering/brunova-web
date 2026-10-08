import { describe, expect, it } from "vitest"
import { readinessText } from "@/lib/acquisition-readiness"

describe("business readiness presentation", () => {
  it("does not describe supported non-fit as merely missing evidence", () => {
    expect(readinessText("SUPPORTED_NONFIT", "es")).toContain(
      "respalda un no-fit",
    )
    expect(readinessText("SUPPORTED_NONFIT", "en")).toContain(
      "material new evidence",
    )
  })
  it("preserves no-channel retention and does not promise permission to send", () => {
    expect(readinessText("NO_EXECUTABLE_CHANNEL", "es")).toContain("conserva")
    expect(readinessText("EXECUTABLE_CANDIDATE", "en")).toContain(
      "requires current approval",
    )
  })
  it("fails closed in both languages for an unfamiliar state", () => {
    for (const locale of ["en", "es"] as const) {
      const text = readinessText("NEW_UNRECOGNIZED_CODE", locale)
      expect(text).not.toContain("NEW_UNRECOGNIZED_CODE")
      expect(text).toMatch(/review|revisión/)
    }
  })
  it("distinguishes Management HOLD from rejection", () => {
    expect(readinessText("MANAGEMENT_HOLD", "es")).toContain(
      "no está rechazada",
    )
    expect(readinessText("MANAGEMENT_HOLD", "en")).toContain("not rejected")
  })
})
