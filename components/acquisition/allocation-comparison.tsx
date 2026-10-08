import type { Locale } from "@/lib/i18n"

export function AllocationComparison({
  alternatives,
  selected,
  locale,
}: {
  alternatives: Record<string, unknown>[]
  selected: string
  locale: Locale
}) {
  const es = locale === "es"
  const fields = [
    ["uncertainty", es ? "Qué falta saber" : "Missing evidence"],
    [
      "possibleDecisionChange",
      es ? "Qué decisión podría cambiar" : "Possible decision change",
    ],
    ["existingEvidence", es ? "Evidencia disponible" : "Existing evidence"],
    ["redundancy", es ? "Riesgo de repetir trabajo" : "Redundancy risk"],
    ["sourcePath", es ? "Fuente y dimensión" : "Source and dimension"],
    [
      "informationGain",
      es ? "Información que podría aportar" : "Potential information gain",
    ],
    [
      "downstreamUnlock",
      es ? "Qué permitiría después" : "Downstream potential",
    ],
    ["recentFeedback", es ? "Resultado anterior" : "Previous outcome"],
    ["inventoryPressure", es ? "Presión del inventario" : "Inventory pressure"],
    [
      "whyNotDiscovery",
      es ? "Comparación con Discovery" : "Discovery comparison",
    ],
  ] as const
  return (
    <details>
      <summary>
        {es ? "Opciones comparadas" : "Alternatives compared"} (
        {alternatives.length})
      </summary>
      <ul>
        {alternatives.map((a, index) => (
          <li key={String(a.id ?? index)}>
            <h5>
              {String(a.workClass ?? "").replaceAll("_", " ")}
              {a.id === selected
                ? es
                  ? " · Seleccionada"
                  : " · Selected"
                : ""}
            </h5>
            <dl>
              {fields.map(([key, label]) => (
                <div key={key}>
                  <dt>{label}</dt>
                  <dd>{String(a[key] ?? "—")}</dd>
                </div>
              ))}
            </dl>
            {a.boundedCost && typeof a.boundedCost === "object" ? (
              <p>
                {es ? "Límite previsto" : "Reserved limit"}:{" "}
                {String((a.boundedCost as Record<string, unknown>).maxRequests)}{" "}
                {es ? "lecturas" : "reads"} ·{" "}
                {String((a.boundedCost as Record<string, unknown>).maxMinutes)}{" "}
                min
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </details>
  )
}

export function AllocationCalibration({
  body,
  locale,
}: {
  body: Record<string, unknown>
  locale: Locale
}) {
  const es = locale === "es"
  const plans = (Array.isArray(body.plans) ? body.plans : []) as Record<
    string,
    unknown
  >[]
  return (
    <section
      aria-label={es ? "Calibración de asignación" : "Allocation calibration"}
    >
      <h3>{es ? "Calibración de asignación" : "Allocation calibration"}</h3>
      <p>
        {es
          ? "Simulación contrafactual · No ejecutada. La recurrencia sigue en pausa para revisión Humana."
          : "Counterfactual simulation · Not executed. Recurrence remains held for Human review."}
      </p>
      <ol>
        {plans.map((plan, index) => (
          <li key={index}>
            <h4>
              {plan.decision === "STOP"
                ? es
                  ? "Diferir trabajo"
                  : "Defer work"
                : String(plan.workClass).replaceAll("_", " ")}
            </h4>
            <p>{String(plan.why ?? "")}</p>
            <p>
              <strong>
                {es
                  ? "Resultado posible, no observado:"
                  : "Possible result, not observed:"}
              </strong>{" "}
              {String(plan.expectedResult ?? "")}
            </p>
            <AllocationComparison
              locale={locale}
              selected={String(plan.selectedAlternativeId)}
              alternatives={
                (plan.alternatives ?? []) as Record<string, unknown>[]
              }
            />
          </li>
        ))}
      </ol>
    </section>
  )
}
