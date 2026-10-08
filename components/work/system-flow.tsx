import type { WorkSystemStep } from "@/content/types"

export function SystemFlow({
  description,
  id,
  steps,
}: {
  description: string
  id: string
  steps: readonly WorkSystemStep[]
}) {
  return (
    <figure aria-labelledby={`${id}-caption`} className="system-flow">
      <figcaption id={`${id}-caption`}>{description}</figcaption>
      <ol>
        {steps.map((step) => (
          <li key={step.label}>
            <strong>{step.label}</strong>
            <span>{step.role}</span>
          </li>
        ))}
      </ol>
    </figure>
  )
}
