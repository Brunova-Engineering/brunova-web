import type { AnalyticsEventName } from "@/lib/analytics/events"

export type SitePath = "/" | `/${string}`

export type NavigationItem = {
  label: string
  href: SitePath
  analyticsEvent?: AnalyticsEventName
}

export type SiteConfig = {
  name: string
  description: string
  descriptor: string
  primaryAction: NavigationItem
}

export type Capability = {
  slug: string
  index: string
  name: string
  navigationLabel: string
  shortDescription: string
  problemClass: string
  approach: string
  operationalConcerns: readonly string[]
  outcomes: readonly string[]
  relatedWork: readonly string[]
}

export type ProcessStage = {
  index: string
  verb: string
  name: string
  description: string
  timeline: string
  price: string
  preview: string
  commitment?: string
  problemSolved: string
  entryKnowledge: string
  establishes: readonly string[]
  nextStep: string
}

export type WorkCase = {
  slug: string
  homepageTitle: string
  title: string
  summary: string
  systemsClass: string
  systemsTitle: string
  systemsSummary: string
  systemType: string
  focus: readonly string[]
  capabilitySignals: readonly string[]
  publicationStatus: "approved-summary"
  detailStatus: "publication-review-required"
}

export type WorkSystemStep = {
  label: string
  role: string
}

export type WorkCapabilityLink = {
  label: string
  capabilitySlug: string
}

export type WorkDetail = {
  slug: WorkCase["slug"]
  context: string
  operationalProblem: string
  scalingConstraint?: string
  systemApproach: string
  systemBoundary: {
    summary: string
    steps: readonly WorkSystemStep[]
  }
  engineeringDecisions: readonly string[]
  safeguards?: readonly string[]
  outcome: string
  capabilities: readonly WorkCapabilityLink[]
}

export type HomepageSymptom = {
  name: string
  consequence: string
}

export type OperationalIntelligenceElement = {
  name: string
  role: string
}

export type Differentiator = {
  title: string
  description: string
}
