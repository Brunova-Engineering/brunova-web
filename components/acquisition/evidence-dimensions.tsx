import type { Locale } from "@/lib/i18n"

type Assertion = {
  id: string
  statement: string
  epistemic_status: string
  confidence: string
  falsifier?: string | null
  known_unknowns?: string[]
  context?: { dimension?: string; signalClass?: string }
}

/** Classifies only explicit Engine context, never keywords in evidence text. */
export function EvidenceDimensions({
  assertions,
  locale,
}: {
  assertions: Assertion[]
  locale: Locale
}) {
  const es = locale === "es"
  const statuses: Record<string, string> = es
    ? {
        OBSERVED_FACT: "Hecho observado",
        SUPPORTED_INFERENCE: "Inferencia respaldada",
        WORKING_HYPOTHESIS: "Hipótesis",
        UNKNOWN: "Desconocido",
        CONFLICT_OR_STALE: "Conflicto o evidencia desactualizada",
      }
    : {
        OBSERVED_FACT: "Observed fact",
        SUPPORTED_INFERENCE: "Supported inference",
        WORKING_HYPOTHESIS: "Working hypothesis",
        UNKNOWN: "Unknown",
        CONFLICT_OR_STALE: "Conflicted or stale evidence",
      }
  return (
    <section aria-label={es ? "Por qué esta empresa" : "Why this company"}>
      <h3>{es ? "Por qué esta empresa" : "Why this company"}</h3>
      {(["CAPACITY", "COMPLEXITY", "INTERVENTION_SIGNAL"] as const).map(
        (dimension) => {
          const evidence = assertions.filter(
            (a) => a.context?.dimension === dimension,
          )
          return (
            <section key={dimension}>
              <h4>
                {
                  {
                    CAPACITY: es ? "Capacidad" : "Capacity",
                    COMPLEXITY: es ? "Complejidad" : "Complexity",
                    INTERVENTION_SIGNAL: es
                      ? "Señal de intervención"
                      : "Intervention signal",
                  }[dimension]
                }
              </h4>
              {!evidence.length && (
                <p>
                  {es
                    ? "No hay evidencia explícita registrada para esta dimensión. No equivale a falta de oportunidad."
                    : "No explicit evidence is recorded for this dimension. This does not establish lack of opportunity."}
                </p>
              )}
              {evidence.map((a) => (
                <div key={a.id}>
                  <p>{a.statement}</p>
                  <p>
                    {statuses[a.epistemic_status] ??
                      (es
                        ? "Clasificación por verificar"
                        : "Classification needs verification")}{" "}
                    · {es ? "Confianza" : "Confidence"}:{" "}
                    {(
                      {
                        HIGH: es ? "Alta" : "High",
                        MEDIUM: es ? "Media" : "Medium",
                        LOW: es ? "Baja" : "Low",
                      } as Record<string, string>
                    )[a.confidence] ?? (es ? "No determinada" : "Undetermined")}
                  </p>
                  {dimension === "INTERVENTION_SIGNAL" && (
                    <p>
                      {a.context?.signalClass === "DIRECT"
                        ? es
                          ? "Señal directa; no demuestra por sí sola dolor, urgencia o presupuesto."
                          : "Direct signal; does not itself prove pain, urgency or budget."
                        : a.context?.signalClass === "CHANGE_PRESSURE"
                          ? es
                            ? "Cambio o presión; justifica investigar, no presumir dolor."
                            : "Change or pressure; supports investigation, not assumed pain."
                          : es
                            ? "Clase de señal no determinada."
                            : "Signal class is undetermined."}
                    </p>
                  )}
                  {a.known_unknowns?.length ? (
                    <p>
                      {es ? "Desconocido" : "Unknown"}:{" "}
                      {a.known_unknowns.join(" · ")}
                    </p>
                  ) : null}
                  {a.falsifier && (
                    <p>
                      {es ? "Qué la falsificaría" : "What would falsify it"}:{" "}
                      {a.falsifier}
                    </p>
                  )}
                </div>
              ))}
            </section>
          )
        },
      )}
    </section>
  )
}
