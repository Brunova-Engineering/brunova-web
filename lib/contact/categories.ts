export const problemCategories = [
  { value: "fragmented_systems", label: "Fragmented systems" },
  {
    value: "manual_operational_process",
    label: "Manual operational process",
  },
  { value: "fragile_automation", label: "Fragile automation" },
  {
    value: "data_reporting_reliability",
    label: "Data / reporting reliability",
  },
  { value: "financial_operations", label: "Financial operations" },
  { value: "internal_platform", label: "Internal platform" },
  { value: "something_else", label: "Something else" },
] as const

export const problemCategoryValues = problemCategories.map(
  ({ value }) => value,
) as [
  (typeof problemCategories)[number]["value"],
  ...(typeof problemCategories)[number]["value"][],
]

export type ProblemCategory = (typeof problemCategories)[number]["value"]
