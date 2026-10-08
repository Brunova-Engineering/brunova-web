import { describe, expect, it } from "vitest"
import {
  opportunityMemo,
  opportunityQuality,
  type CandidateView,
} from "@/lib/acquisition-opportunity-intelligence"

const base = (
  name: string,
  known: string,
  extra: Partial<CandidateView> = {},
) =>
  ({
    id: `synthetic-${name}`,
    name,
    domain: null,
    reasons: [],
    nameCollision: false,
    searchMarkets: ["US"],
    identity: "UNRESOLVED",
    screen: "HOLD",
    contactState: null,
    followUpAuthority: null,
    nextReviewAt: null,
    contacted: false,
    coverage: [],
    sources: ["synthetic-source"],
    sightings: 1,
    known,
    unknown: "Synthetic bounded unknown",
    nextAction: "Synthetic bounded next action",
    lastAction: "2026-09-20T00:00:00Z",
    worthiness: "RETAIN",
    lastWorkQuality: "JUSTIFIED",
    target: null,
    discoveryReason: "Synthetic discovery reason",
    sourceHypothesis: "Synthetic source hypothesis",
    missingCodes: [],
    exactEffect: null,
    journey: undefined,
    archived: false,
    workspaceReason: null,
    workspaceActorType: null,
    workspaceChangedAt: null,
    ...extra,
  }) as unknown as CandidateView

const fixtures = [
  base(
    "SYNTHETIC 3 CG GROUP",
    "No recorded candidate-specific identity evidence was learned. Execution ran denue-directory rather than the selected company webpage.",
    {
      nameCollision: true,
      searchMarkets: ["MX"],
      nextAction:
        "Read only https://www.smartlogistics.example/ under the original stop condition; do not repeat DENUE.",
    },
  ),
  base(
    "SYNTHETIC Piedmont",
    "The bounded evaluator preserved no attributable opening evidence.",
    {
      sourceHypothesis:
        "Dated outpatient diagnostic imaging openings may reveal an operating change.",
    },
  ),
  base(
    "SYNTHETIC Lumexa",
    "The announcement reports two completed acquisitions, opened centers, more than 190 centers and 5,000 employees, and connects Wexford to UPMC.",
    { nameCollision: true, target: { why: "Wexford UPMC boundary" } as never },
  ),
  base(
    "SYNTHETIC Watsco",
    "The Jackson Supply acquisition covers $230 million annualized sales and 25 locations, with 70,000 digital users and SupplySync.",
    { target: { why: "Jackson Supply integration" } as never },
  ),
  base(
    "SYNTHETIC Scania",
    "The Tijuana move expanded from three to eleven bays, 15 units per day, MXN 13.6 million and a parts warehouse.",
    {
      searchMarkets: ["MX"],
      contacted: true,
      contactState: "AWAITING_RESPONSE",
      followUpAuthority: "NONE",
      exactEffect: { effect_status: "SUCCEEDED" } as never,
    },
  ),
]

describe("opportunity intelligence", () => {
  it.each(["en", "es"] as const)(
    "%s produces materially distinct company decision memos without changing canonical evidence",
    (locale) => {
      const before = structuredClone(fixtures)
      const memos = fixtures.map((candidate) =>
        opportunityMemo(candidate, locale),
      )
      expect(new Set(memos.map((memo) => memo.tldr)).size).toBe(5)
      expect(
        new Set(memos.map((memo) => memo.route.label)).size,
      ).toBeGreaterThanOrEqual(4)
      expect(new Set(memos.map((memo) => memo.nextStep.action)).size).toBe(5)
      expect(memos[0]?.stage).toBe(
        locale === "es" ? "Resolución de identidad" : "Identity resolution",
      )
      expect(memos[1]?.stage).toBe(
        locale === "es" ? "Evidencia de empresa" : "Company evidence",
      )
      expect(memos[2]?.unproven.join(" ")).toMatch(/homónimo|same-name/)
      expect(memos[3]?.tldr).toMatch(/Jackson/)
      expect(memos[4]?.recommendation.kind).toBe("WAIT")
      expect(memos[4]?.nextStep.action).toMatch(
        locale === "es" ? /segundo intento/ : /Attempt 2/,
      )
      expect(fixtures).toEqual(before)
    },
  )

  it("only presents a conversation when a company-specific thesis exists", () => {
    const memos = fixtures.map((candidate) => opportunityMemo(candidate, "en"))
    expect(memos[0]?.conversation).toBeNull()
    expect(memos[1]?.conversation).toBeNull()
    expect(memos[2]?.conversation?.learningQuestion).toMatch(
      /referral-to-scheduling/,
    )
    expect(memos[3]?.conversation?.learningQuestion).toMatch(/SupplySync/)
    expect(memos[4]?.conversation?.learningQuestion).toMatch(/scheduling–parts/)
    expect(
      new Set(memos.slice(2).map((memo) => memo.conversation?.thesis)).size,
    ).toBe(3)
  })

  it("summarizes decision quality rather than counts alone", () => {
    expect(opportunityQuality(fixtures, "en")).toMatchObject({
      identity: 2,
      intervention: 1,
      waiting: 1,
      review: 2,
      conversationReady: 3,
    })
  })

  it("never treats a name collision as identity proof or a direct merge", () => {
    const memo = opportunityMemo(fixtures[0]!, "en")
    expect(memo.route.changeCondition).toMatch(/independently corroborated/)
    expect(memo.nextStep.decisionChange).toMatch(/keeps both records separate/)
    expect(memo.recommendation.kind).toBe("REVIEW")
  })

  it("does not transfer one company's memo to another candidate with a similar sector signal", () => {
    const weakLumexa = base(
      "SYNTHETIC Lumexa Imaging",
      "A bounded search around outpatient imaging openings may clarify identity.",
      { nameCollision: true },
    )
    const unrelatedWarehouse = base(
      "SYNTHETIC 3 PL SERVICES",
      "Warehouse operators may have operational handoffs; DENUE produced a lead.",
      { searchMarkets: ["MX"] },
    )
    const lumexaMemo = opportunityMemo(weakLumexa, "en")
    const warehouseMemo = opportunityMemo(unrelatedWarehouse, "en")
    expect(lumexaMemo.tldr).not.toMatch(/Piedmont/)
    expect(lumexaMemo.stage).toBe("Identity resolution")
    expect(warehouseMemo.tldr).not.toMatch(/Smart Logistics/)
    expect(warehouseMemo.nextStep.action).not.toMatch(/DENUE/)
  })
})
