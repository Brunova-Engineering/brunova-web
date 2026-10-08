"use client"
import { useEffect, useState } from "react"
import { acquisitionApi as api } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

const labels: Record<string, [string, string]> = {
  POLICY: ["Política aprobada", "Approved policy"],
  DATABASE: ["Base de datos", "Database"],
  MIGRATIONS: ["Versión del sistema", "System version"],
  MAC_LISTENER: ["Disponibilidad del Mac", "Mac availability"],
  MAC_WORKER: ["Última ejecución", "Last execution"],
  SCHEDULER: ["Horario automático", "Automatic schedule"],
  SIGNALS: ["Avisos de trabajo", "Work signals"],
  PENDING_SIGNALS: ["Sin avisos pendientes", "No pending signals"],
  EMAIL_READINESS: ["Email preparado", "Email readiness"],
  PRODUCTION_EMAIL: [
    "Envío de producción deshabilitado",
    "Production sending disabled",
  ],
  REAL_DATA: ["Datos reales deshabilitados", "Real data disabled"],
  EXTERNAL_EFFECTS: [
    "Efectos externos deshabilitados",
    "External effects disabled",
  ],
  PENDING_WORK: ["Sin trabajo pendiente", "No pending work"],
  REAL_CYCLE: ["Cycle real no iniciado", "Real Cycle not started"],
  GATEWAY: ["Pancracio / Gateway", "Pancracio / Gateway"],
  BACKEND: ["Portal Backend", "Portal Backend"],
  INBOUND: ["Recepción automática", "Automatic inbound"],
  HUBSPOT: ["Límite CRM", "CRM boundary"],
  MANAGEMENT_AUTHORITY: ["Autoridad de Management", "Management authority"],
  DISCOVERY_AUTONOMY: [
    "Reposición autónoma de búsquedas",
    "Autonomous search replenishment",
  ],
  DISCOVERY_CODEX: ["Planificación de Discovery", "Discovery planning"],
  DISCOVERY_COMPANY_ROUTE: [
    "Fuente empresarial operativa",
    "Operational company source",
  ],
  DISCOVERY_MX: ["Discovery en México", "Mexico discovery"],
  DISCOVERY_US: ["Discovery en Estados Unidos", "United States discovery"],
  DISCOVERY_IDENTITY: [
    "Identidad empresarial respaldada",
    "Supported company identity",
  ],
  DISCOVERY_ZERO_STATE: ["Discovery desde cero", "Zero-state discovery"],
  DISCOVERY_RECOVERY: ["Recuperación de Discovery", "Discovery recovery"],
}
export function ActivationPreflight({ locale }: { locale: Locale }) {
  const es = locale === "es",
    [state, setState] = useState<Awaited<
      ReturnType<typeof api.activationPreflight>
    > | null>(null),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    api
      .activationPreflight()
      .then((r) => {
        if (live) setState(r)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [])
  return (
    <section
      className="acq-panel"
      aria-label={
        es ? "Preparación para el siguiente paso" : "Next-step readiness"
      }
    >
      <h2>{es ? "Preparación del sistema" : "System readiness"}</h2>
      <p role="status">
        {failed
          ? es
            ? "No se pudo verificar. No se asume disponibilidad."
            : "Could not verify. Readiness is not assumed."
          : !state
            ? es
              ? "Verificando…"
              : "Checking…"
            : state.ready
              ? es
                ? "Preparado para solicitar activación; todavía inactivo."
                : "Ready to request activation; still inactive."
              : es
                ? "Requiere verificación antes de activar."
                : "Verification required before activation."}
      </p>
      {state && (
        <>
          {!state.ready && (
            <ul>
              {state.checks
                .filter((c) => !c.ready)
                .map((c) => (
                  <li key={c.component}>
                    {labels[c.component]?.[es ? 0 : 1] ??
                      (es ? "Componente del sistema" : "System component")}{" "}
                    —{" "}
                    {c.reason === "PROBE_STALE"
                      ? es
                        ? "observación vencida"
                        : "observation expired"
                      : c.reason === "PROBE_REQUIRED"
                        ? es
                          ? "verificación pendiente"
                          : "verification pending"
                        : es
                          ? "condición no confirmada"
                          : "condition not confirmed"}
                  </li>
                ))}
            </ul>
          )}
          <details>
            <summary>
              {es
                ? "Ver condiciones de preparación"
                : "Inspect readiness conditions"}
            </summary>
            <dl>
              {state.checks.map((c) => (
                <div key={c.component}>
                  <dt>{labels[c.component]?.[es ? 0 : 1] ?? c.component}</dt>
                  <dd>
                    {c.ready
                      ? es
                        ? "Confirmada"
                        : "Confirmed"
                      : es
                        ? "Requiere revisión"
                        : "Needs review"}
                  </dd>
                </div>
              ))}
            </dl>
            <small>
              {new Date(state.observedAt).toLocaleString(
                es ? "es-MX" : "en-US",
              )}
            </small>
          </details>
        </>
      )}
      <p>
        {es
          ? "7E-A autorizará Discovery e investigación reales. La primera wave tendrá una revisión de Management antes de que 7E-B autorice contacto alguno. Esta vista no activa nada."
          : "7E-A will authorize real discovery and research. Management reviews the first wave before 7E-B authorizes any outreach. This view activates nothing."}
      </p>
    </section>
  )
}
