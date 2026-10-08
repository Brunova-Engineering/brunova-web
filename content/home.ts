import type {
  Differentiator,
  HomepageSymptom,
  OperationalIntelligenceElement,
} from "@/content/types"

export const homepage = {
  hero: {
    title: "Systems for operations that have outgrown their tools.",
    description:
      "Brunova designs and builds reliable systems that turn fragmented processes, disconnected data and fragile automations into scalable business operations.",
    primaryAction: "Start a conversation",
    secondaryAction: "Explore our work",
  },
  category:
    "Systems engineering for operations too complex to manage through tools alone.",
  problem: {
    title: "When operations become systems problems.",
    description:
      "Growth often exposes a problem that individual tools cannot solve: the operation itself no longer behaves like a system.",
    transition: "The solution is not another tool. It is a better system.",
  },
  operationalIntelligence: {
    title:
      "Operational intelligence creates visibility and control across process, data and systems.",
    description:
      "We connect how work moves, what data means and where decisions happen, so teams can see the operation clearly and act with greater control. Software, automation and AI support that operating model where they can do so safely.",
  },
  architecture: {
    question: "We don’t start with “What should we automate?”",
    answer: "We start with “How should this operation work?”",
  },
  workTitle: "Selected engineering experience",
  process: {
    title: "How Brunova works",
    entryTitle: "Brunova starts where the system needs work.",
    entryDescription:
      "Discovery is available when the problem is unclear—not a mandatory first step.",
  },
  differentiatorsTitle: "Principles we operate by",
} as const

export const homepageSymptoms = [
  {
    name: "Disconnected systems",
    consequence:
      "Critical context stays trapped between tools, making reporting and decisions harder to trust.",
  },
  {
    name: "Spreadsheet-dependent operations",
    consequence: "The operating model lives in files instead of the system.",
  },
  {
    name: "Fragile automations",
    consequence:
      "Small upstream changes produce silent downstream failures that consume management attention.",
  },
  {
    name: "Unreliable reporting",
    consequence: "Teams debate the numbers before they can act on them.",
  },
  {
    name: "Manual handoffs",
    consequence:
      "State and accountability disappear between people, making delivery and exceptions harder to control.",
  },
  {
    name: "Key-person dependency",
    consequence: "The operation relies on memory that cannot scale.",
  },
  {
    name: "Exceptions that break the process",
    consequence: "The standard process works; exceptions break it.",
  },
  {
    name: "Data without operational trust",
    consequence: "Information exists, but the business cannot rely on it.",
  },
] as const satisfies readonly HomepageSymptom[]

export const operationalIntelligenceElements = [
  { name: "Operations", role: "defines the work and its real constraints" },
  { name: "Data", role: "gives shared meaning to operational state" },
  { name: "Systems", role: "establishes boundaries, ownership and control" },
  { name: "Automation", role: "executes known paths with reliable recovery" },
  {
    name: "Software",
    role: "turns the operating model into durable capability",
  },
  { name: "AI", role: "assists where judgment can be bounded and governed" },
] as const satisfies readonly OperationalIntelligenceElement[]

export const architectureInputs = [
  "Operation",
  "System boundaries",
  "Data",
  "Decisions",
  "Failure paths",
  "Ownership",
] as const

export const differentiators = [
  {
    title: "Architecture before tools",
    description: "We understand the system before choosing the tool.",
  },
  {
    title: "Systems, not workflows",
    description:
      "We build something the business can operate and maintain—not just something that runs.",
  },
  {
    title: "Close to operations",
    description:
      "We stay close enough to the real process to understand exceptions, ownership, handoffs and failure points.",
  },
] as const satisfies readonly Differentiator[]
