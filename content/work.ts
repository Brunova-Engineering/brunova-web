import type { WorkCase } from "@/content/types"

export const workCases = [
  {
    slug: "multi-tenant-financial-integration-platform",
    homepageTitle: "Multi-tenant Financial Integration Platform",
    title:
      "A shared financial integration layer across multiple operating entities",
    summary:
      "A reusable accounting integration platform centralizing OAuth lifecycle, financial reads and writes, reference resolution, recurring reporting and downstream operational access.",
    systemsClass: "Multi-entity Financial Operations Platform",
    systemsTitle:
      "Shared access to financial operations across multiple entities",
    systemsSummary:
      "Connects multiple entities so they can access and update accounting information and produce recurring reports through one reusable system, instead of managing a separate connection for each entity.",
    systemType: "Financial operations",
    focus: ["Multi-entity accounting", "Recurring financial reporting"],
    capabilitySignals: [
      "Systems Architecture",
      "Financial Automation",
      "API / Integration Engineering",
      "Reliability",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
  {
    slug: "operational-finance-data-infrastructure",
    homepageTitle: "Operational Finance Data Infrastructure",
    title:
      "Turning recurring financial reporting into shared operational infrastructure",
    summary:
      "Automated extraction and reporting pipelines connecting accounting and operational systems to a data warehouse and business-facing spreadsheets, giving non-technical teams consistent access to financial information.",
    systemsClass: "Financial Reporting System",
    systemsTitle:
      "Financial reporting that updates from one shared source of information",
    systemsSummary:
      "Connects accounting and operational information so recurring reports can be prepared consistently in the spreadsheets teams already use, without rebuilding the same data for separate reporting tasks.",
    systemType: "Operational reporting",
    focus: ["Financial reporting", "Business data access"],
    capabilitySignals: [
      "Data Engineering",
      "Operational Intelligence",
      "Reporting Infrastructure",
      "Integration Engineering",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
  {
    slug: "document-intelligence-workflow",
    homepageTitle: "Document Intelligence Workflow",
    title: "AI-assisted document processing with control built in",
    summary:
      "A document-processing system combining classification, structured extraction, validation, human review and downstream workflow integration for operationally sensitive documents.",
    systemsClass: "Controlled Document Processing System",
    systemsTitle: "AI-assisted document processing with human review built in",
    systemsSummary:
      "Classifies and extracts information from operationally sensitive documents, then requires validation and human review before that information moves into the next operational process.",
    systemType: "Document processing",
    focus: [
      "Document classification and extraction",
      "Validation and human review",
      "Downstream workflows",
    ],
    capabilitySignals: [
      "Workflow Engineering",
      "AI-enabled Systems",
      "Human-in-the-loop",
      "Reliability",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
  {
    slug: "fragile-automation-modernization",
    homepageTitle: "Fragile Automation Modernization",
    title: "From person-dependent workflows to operable systems",
    summary:
      "Modernization of automation estates by introducing clearer boundaries, observability, recovery, idempotency, deployment discipline and operational documentation without rewriting working behavior unnecessarily.",
    systemsClass: "Operational Automation Modernization",
    systemsTitle:
      "Critical automations made easier to operate, recover and change",
    systemsSummary:
      "Preserves automations that still work while adding clearer governance, recovery controls, deployment discipline and operational documentation.",
    systemType: "Automation operations",
    focus: [
      "Existing automations",
      "Recovery and observability",
      "Managed deployment",
    ],
    capabilitySignals: [
      "Modernization",
      "Systems Architecture",
      "Reliability",
      "Operational Engineering",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
] as const satisfies readonly WorkCase[]

export function getWorkCase(slug: string): WorkCase | undefined {
  return workCases.find((workCase) => workCase.slug === slug)
}
