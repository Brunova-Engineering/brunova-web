"use client"
import { useEffect, useState } from "react"
import { acquisitionApi as api } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type Package = Awaited<ReturnType<typeof api.buyerPackage>>["package"]
export function ProblemOwner({
  cycleId,
  accountId,
  roleHypothesis,
  locale,
}: {
  cycleId: string
  accountId: string
  roleHypothesis?: string | null
  locale: Locale
}) {
  const es = locale === "es"
  const [state, setState] = useState<{
    loaded: boolean
    error: boolean
    value: Package
  }>({ loaded: false, error: false, value: null })
  useEffect(() => {
    let cancelled = false
    void api
      .buyerPackage(cycleId, accountId)
      .then((result) => {
        if (!cancelled)
          setState({ loaded: true, error: false, value: result.package })
      })
      .catch(() => {
        if (!cancelled) setState({ loaded: true, error: true, value: null })
      })
    return () => {
      cancelled = true
    }
  }, [cycleId, accountId])
  const buyer = state.value?.result.buyer.selected
  return (
    <section
      aria-label={
        es ? "Responsable del problema y canal" : "Problem owner and channel"
      }
    >
      <h3>
        {es ? "Responsable del problema y canal" : "Problem owner and channel"}
      </h3>
      <p>
        {es ? "Hipótesis de rol" : "Role hypothesis"}:{" "}
        {roleHypothesis || (es ? "No determinada" : "Undetermined")}
      </p>
      <p>
        {es
          ? "Una hipótesis de rol no demuestra que una persona sea el buyer."
          : "A role hypothesis does not establish a person as the buyer."}
      </p>
      {!state.loaded && (
        <p>
          {es
            ? "Verificando evidencia del responsable…"
            : "Checking problem-owner evidence…"}
        </p>
      )}
      {state.error && (
        <p role="alert">
          {es
            ? "No se pudo verificar el responsable. No supongas que está resuelto."
            : "Problem-owner evidence could not be verified. Do not assume resolution."}
        </p>
      )}
      {state.loaded && !state.error && !state.value && (
        <p>
          {es
            ? "Persona todavía sin resolver; se requiere investigación."
            : "Person not yet resolved; research is required."}
        </p>
      )}
      {state.value && (
        <>
          {!state.value.current && (
            <p>
              {es
                ? "La evidencia requiere actualización antes de avanzar."
                : "Evidence needs refreshing before progression."}
            </p>
          )}
          {buyer ? (
            <>
              <p>
                <strong>{buyer.name}</strong> · {buyer.role} ·{" "}
                {buyer.companyDomain}
              </p>
              <p>
                {es
                  ? "La evidencia de identidad, relación con la empresa y rol se evalúa frente a la hipótesis de responsable; no implica intención, urgencia ni presupuesto."
                  : "Identity, company relationship and role evidence are evaluated against the problem-owner hypothesis; this does not imply intent, urgency or budget."}
              </p>
              <details>
                <summary>
                  {es ? "Evidencia del responsable" : "Problem-owner evidence"}
                </summary>
                <p>
                  {buyer.sourceUri} · {buyer.observedAt}
                </p>
              </details>
            </>
          ) : (
            <p>
              {es
                ? "No hay una persona resuelta de forma suficiente; revisa la evidencia o ambigüedad."
                : "No person is sufficiently resolved; review evidence or ambiguity."}
            </p>
          )}
          <p>
            {state.value.current &&
            state.value.result.contact?.type === "BUSINESS_EMAIL" &&
            ["SUPPORTED", "VERIFIED"].includes(state.value.result.contact.state)
              ? es
                ? "Email respaldado disponible. No es autorización para enviar."
                : "Supported email is available. This is not send authorization."
              : es
                ? "Sin canal Email actualmente ejecutable. La oportunidad puede conservarse."
                : "No currently executable Email channel. The opportunity may be retained."}
          </p>
          <details>
            <summary>
              {es ? "Estado técnico del buyer" : "Technical buyer state"}
            </summary>
            <p>
              {state.value.result.buyer.state} · {state.value.messageability}
            </p>
          </details>
        </>
      )}
    </section>
  )
}
