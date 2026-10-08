import { describe, expect, it } from "vitest"

import { capabilities } from "@/content/capabilities"
import { aboutNarrative, companyModel, operationalLens } from "@/content/about"
import {
  differentiators,
  homepage,
  homepageSymptoms,
  operationalIntelligenceElements,
} from "@/content/home"
import { primaryNavigation } from "@/content/navigation"
import { processStages } from "@/content/process"
import { privacyContent } from "@/content/privacy"
import {
  esPrivacyContent,
  esProcessStages,
  esWorkCases,
  esWorkDetails,
} from "@/content/es"
import { workCases } from "@/content/work"
import { workDetails } from "@/content/work-details"

describe("typed public content", () => {
  it("contains the approved record counts and unique slugs", () => {
    expect(capabilities).toHaveLength(5)
    expect(processStages).toHaveLength(4)
    expect(workCases).toHaveLength(4)
    expect(homepageSymptoms).toHaveLength(8)
    expect(differentiators).toHaveLength(3)
    expect(primaryNavigation.map((item) => item.label)).toEqual([
      "Capabilities",
      "Process",
      "Systems",
      "About",
    ])

    expect(new Set(capabilities.map((item) => item.slug)).size).toBe(5)
    expect(new Set(workCases.map((item) => item.slug)).size).toBe(4)
    expect(workDetails.map((item) => item.slug)).toEqual(
      workCases.map((item) => item.slug),
    )
  })

  it("provides Phase 4 depth without adding top-level records", () => {
    for (const capability of capabilities) {
      expect(capability.problemClass.length).toBeGreaterThan(40)
      expect(capability.approach.length).toBeGreaterThan(40)
      expect(capability.operationalConcerns.length).toBeGreaterThanOrEqual(3)
    }

    for (const stage of processStages) {
      expect(stage.problemSolved.length).toBeGreaterThan(30)
      expect(stage.entryKnowledge.length).toBeGreaterThan(30)
      expect(stage.establishes.length).toBeGreaterThanOrEqual(3)
      expect(stage.nextStep.length).toBeGreaterThan(30)
    }

    for (const detail of workDetails) {
      expect(detail.systemBoundary.steps).toHaveLength(4)
      expect(detail.engineeringDecisions.length).toBeGreaterThanOrEqual(3)
      expect(detail.capabilities.length).toBeGreaterThanOrEqual(2)
    }
  })

  it("preserves the approved company and privacy boundaries", () => {
    expect(aboutNarrative.observation).toBe(
      "As companies grow, critical operations often spread across spreadsheets, SaaS tools, scripts and automations before anyone designs the system behind them.",
    )
    expect(aboutNarrative.boundary).toBe(
      "Brunova works where process, data, software and automation meet to build systems that can be trusted, operated and evolved.",
    )
    expect(companyModel).toHaveLength(3)
    expect(operationalLens.description).toContain(
      "connects process, data, systems and automation",
    )
    expect(privacyContent.reviewStatus).toBe(
      "approved-controller-information-2026-08-25",
    )

    const englishPrivacy = JSON.stringify(privacyContent)
    const spanishPrivacy = JSON.stringify(esPrivacyContent)

    for (const notice of [englishPrivacy, spanishPrivacy]) {
      expect(notice).toContain("Jorge Alfredo Vera Fuentes")
      expect(notice).toContain("brunova@brunova.mx")
      expect(notice).toContain("24")
      expect(notice).toContain("20")
      expect(notice).toContain("15")
    }
    expect(englishPrivacy).toContain(
      "Calle Poniente 1 #16, Centro, 94730 Río Blanco, Veracruz, Mexico",
    )
    expect(englishPrivacy).toContain("operating as Brunova")
    expect(englishPrivacy).not.toContain("trading as Brunova")
    expect(englishPrivacy).toContain("not a statutory Mexican retention period")
    expect(spanishPrivacy).toContain(
      "Calle Poniente 1 #16, Centro, C.P. 94730, Río Blanco, Veracruz, México",
    )
    expect(spanishPrivacy).toContain(
      "no es un plazo de conservación establecido por la legislación mexicana",
    )
  })

  it("preserves the approved homepage content contract", () => {
    expect(homepage.hero.title).toBe(
      "Systems for operations that have outgrown their tools.",
    )
    expect(homepage.hero.primaryAction).toBe("Start a conversation")
    expect(homepage.hero.secondaryAction).toBe("Explore our work")
    expect(workCases.map((work) => work.homepageTitle)).toEqual([
      "Multi-tenant Financial Integration Platform",
      "Operational Finance Data Infrastructure",
      "Document Intelligence Workflow",
      "Fragile Automation Modernization",
    ])
    expect(differentiators.map((item) => item.title)).toEqual([
      "Architecture before tools",
      "Systems, not workflows",
      "Close to operations",
    ])
    expect(homepageSymptoms.at(-2)?.consequence).toBe(
      "The standard process works; exceptions break it.",
    )
    expect(operationalIntelligenceElements.at(-1)?.role).toBe(
      "assists where judgment can be bounded and governed",
    )
  })

  it("keeps Systems business meaning ahead of technical classification", () => {
    const englishPrimaryCopy = workCases
      .flatMap((work) => [
        work.systemsClass,
        work.systemsTitle,
        work.systemsSummary,
      ])
      .join(" ")
      .toLowerCase()
    const spanishPrimaryCopy = esWorkCases
      .flatMap((work) => [
        work.systemsClass,
        work.systemsTitle,
        work.systemsSummary,
      ])
      .join(" ")
      .toLowerCase()
    const englishFirstView = workDetails
      .flatMap((detail) => [
        detail.context,
        detail.operationalProblem,
        detail.systemApproach,
        detail.systemBoundary.summary,
        detail.outcome,
      ])
      .join(" ")
      .toLowerCase()
    const spanishFirstView = esWorkDetails
      .flatMap((detail) => [
        detail.context,
        detail.operationalProblem,
        detail.systemApproach,
        detail.systemBoundary.summary,
        detail.outcome,
      ])
      .join(" ")
      .toLowerCase()

    expect(englishPrimaryCopy).not.toMatch(
      /anonymized|multi-tenant|oauth|pipeline|warehouse|idempotency|reference resolution|integration layer|reads and writes/,
    )
    expect(spanishPrimaryCopy).not.toMatch(
      /anonimiz|oauth|pipeline|almacén de datos|idempotencia|resolución de referencias|capa de integración|lecturas y escrituras/,
    )
    expect(englishFirstView).not.toMatch(
      /oauth|pipeline|warehouse|idempotency|reference resolution|integration layer|reads and writes/,
    )
    expect(spanishFirstView).not.toMatch(
      /oauth|pipeline|almacén de datos|idempotencia|resolución de referencias|capa de integración|lecturas y escrituras/,
    )

    expect(JSON.stringify(workDetails)).toContain("OAuth")
    expect(JSON.stringify(workDetails)).toContain("Data warehouse")
    expect(JSON.stringify(workDetails)).toContain("idempotency")
    expect(JSON.stringify(esWorkDetails)).toContain("OAuth")
    expect(JSON.stringify(esWorkDetails)).toContain("Almacén de datos")
    expect(JSON.stringify(esWorkDetails)).toContain("idempotencia")
  })

  it("publishes approved offer starting prices without exposing client identifiers", () => {
    const publicContent = JSON.stringify({
      capabilities,
      processStages,
      workCases,
      homepage,
      homepageSymptoms,
      differentiators,
      workDetails,
      aboutNarrative,
      companyModel,
      privacyContent,
    })

    expect(processStages.map((stage) => stage.price)).toEqual([
      "USD 999",
      "From USD 1,999",
      "From USD 2,999",
      "From USD 1,999/month",
    ])
    expect(esProcessStages.map((stage) => stage.price)).toEqual([
      "USD 999",
      "Desde USD 1,999",
      "Desde USD 2,999",
      "Desde USD 1,999/mes",
    ])
    expect(processStages.at(-1)).toMatchObject({
      commitment: "3-month minimum",
    })
    expect(esProcessStages.at(-1)).toMatchObject({
      commitment: "Mínimo 3 meses",
    })
    expect(publicContent).not.toContain("$")
    expect(publicContent).not.toContain("HQ")
    expect(publicContent).not.toContain("OTW")
  })
})
