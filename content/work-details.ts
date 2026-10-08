import type { WorkDetail } from "@/content/types"

export const workDetails = [
  {
    slug: "multi-tenant-financial-integration-platform",
    context:
      "Several operating entities needed one consistent way to access accounting information and recurring financial reports.",
    operationalProblem:
      "Connections, financial updates and reporting were managed without one shared system across entities.",
    systemApproach:
      "A reusable system lets each entity access and update accounting information and produce recurring reports through one controlled point.",
    systemBoundary: {
      summary:
        "One shared point controls how entities connect to accounting operations and reporting.",
      steps: [
        {
          label: "Operating entities",
          role: "Multiple entities requiring consistent accounting access",
        },
        {
          label: "Connection lifecycle",
          role: "Centralized account connections (OAuth) and record matching",
        },
        {
          label: "Financial operations",
          role: "Reading and updating accounting information, plus recurring reports",
        },
        {
          label: "Operational access",
          role: "Reusable downstream access to the shared layer",
        },
      ],
    },
    engineeringDecisions: [
      "Centralize account connections and record matching in one shared integration layer.",
      "Support reading and updating accounting information inside the same controlled boundary.",
      "Provide recurring reporting and operational access through reusable platform services.",
    ],
    outcome:
      "Multiple entities can work with financial information through one consistent, reusable system.",
    capabilities: [
      {
        label: "Systems Architecture",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
      {
        label: "Financial Automation",
        capabilitySlug: "financial-operational-automation",
      },
      {
        label: "API / Integration Engineering",
        capabilitySlug: "data-integration-engineering",
      },
    ],
  },
  {
    slug: "operational-finance-data-infrastructure",
    context:
      "Recurring financial reports relied on information spread across accounting and operational systems.",
    operationalProblem:
      "Each reporting task assembled information separately, making consistent access difficult for business teams.",
    systemApproach:
      "One shared reporting system collects and prepares source information before delivering it to the spreadsheets teams already use.",
    systemBoundary: {
      summary:
        "Accounting and operational information is prepared once in a shared data foundation before it reaches business reports.",
      steps: [
        {
          label: "Source systems",
          role: "Accounting and operational information",
        },
        {
          label: "Extraction pipeline",
          role: "Automated collection and preparation of source information",
        },
        {
          label: "Data warehouse",
          role: "Shared reporting foundation",
        },
        {
          label: "Business access",
          role: "Consistent information in familiar spreadsheets",
        },
      ],
    },
    engineeringDecisions: [
      "Connect accounting and operational sources through one reporting pipeline.",
      "Use the warehouse as shared infrastructure rather than a final user interface.",
      "Preserve business-facing spreadsheet access for non-technical teams.",
    ],
    outcome:
      "Business teams get consistent access to recurring financial information in familiar spreadsheets.",
    capabilities: [
      {
        label: "Data Engineering",
        capabilitySlug: "data-integration-engineering",
      },
      {
        label: "Financial Automation",
        capabilitySlug: "financial-operational-automation",
      },
      {
        label: "Systems Architecture",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
    ],
  },
  {
    slug: "document-intelligence-workflow",
    context:
      "Sensitive operational documents needed consistent processing without removing human oversight.",
    operationalProblem:
      "Automated classification and extraction did not by themselves ensure that information was ready for the next operational process.",
    systemApproach:
      "An AI-assisted document process requires validation and human review before information can move forward.",
    systemBoundary: {
      summary:
        "AI prepares structured information; validation and human review determine whether it proceeds.",
      steps: [
        {
          label: "Document intake",
          role: "Operationally sensitive source documents",
        },
        {
          label: "Classification + extraction",
          role: "AI-assisted structured processing",
        },
        {
          label: "Validation + review",
          role: "Control boundary with human judgment",
        },
        {
          label: "Downstream workflow",
          role: "Reviewed information enters the operating process",
        },
      ],
    },
    engineeringDecisions: [
      "Separate classification and structured extraction from validation.",
      "Keep human review inside the system boundary rather than treating it as an exception outside the workflow.",
      "Integrate reviewed outputs with the downstream operational process.",
    ],
    safeguards: [
      "Structured validation before downstream use",
      "Human review for operationally sensitive documents",
      "A defined handoff into the downstream workflow",
    ],
    outcome:
      "Documents can be processed with AI assistance while human judgment remains part of the operation.",
    capabilities: [
      {
        label: "Workflow Engineering",
        capabilitySlug: "workflow-process-engineering",
      },
      {
        label: "Systems Architecture",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
    ],
  },
  {
    slug: "fragile-automation-modernization",
    context:
      "Existing automations still supported the operation but had become fragile, difficult to understand and dependent on one person.",
    operationalProblem:
      "Unclear responsibilities and weak operating controls made changes and recovery risky.",
    scalingConstraint:
      "Rewriting what still worked was not justified, but the existing operating model could not support continued change.",
    systemApproach:
      "Brunova preserved the working behavior and added the controls needed to operate, recover and change it with less risk.",
    systemBoundary: {
      summary:
        "The automation remains in place, with explicit governance and controls for failure, recovery and deployment.",
      steps: [
        {
          label: "Working behavior",
          role: "Existing automation worth preserving",
        },
        {
          label: "Clear boundaries",
          role: "Defined responsibilities and ownership",
        },
        {
          label: "Operability controls",
          role: "Monitoring, recovery and duplicate-processing prevention (idempotency)",
        },
        {
          label: "Managed system",
          role: "Disciplined deployment and operational documentation",
        },
      ],
    },
    engineeringDecisions: [
      "Preserve working behavior instead of rewriting it without cause.",
      "Introduce clearer system boundaries before extending capability.",
      "Treat deployment discipline and documentation as part of the system.",
    ],
    safeguards: [
      "Observability",
      "Recovery",
      "Duplicate-processing prevention (idempotency)",
      "Operational documentation",
    ],
    outcome:
      "The operation keeps the value of its existing automations with clearer governance and a system that is easier to maintain.",
    capabilities: [
      {
        label: "Modernization",
        capabilitySlug: "modernization-fragile-automations",
      },
      {
        label: "Systems Architecture",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
    ],
  },
] as const satisfies readonly WorkDetail[]

export function getWorkDetail(slug: string): WorkDetail | undefined {
  return workDetails.find((detail) => detail.slug === slug)
}
