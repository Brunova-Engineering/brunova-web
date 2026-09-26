"use client"

import { useEffect, useState } from "react"
import { acquisitionApi as api, type Health } from "@/lib/acquisition-api"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
import type { DiscoveryTruth } from "@/lib/acquisition-management-truth"
import type { Locale } from "@/lib/i18n"

type Model = Awaited<ReturnType<typeof api.operatingModel>>
type Observation = {
  logical_role?: unknown
  contract_version?: unknown
  result?: unknown
  observed_at?: unknown
}

export function WorkHealthSummary({
  locale,
  health,
}: {
  locale: Locale
  health: Health | null
}) {
  const es = locale === "es"
  const [discovery, setDiscovery] = useState<DiscoveryTruth | null>(null)
  const [model, setModel] = useState<Model | null>(null)
  const [error, setError] = useState(false)
  useEffect(() => {
    let live = true
    Promise.all([readDiscovery(), api.operatingModel()])
      .then(([snapshot, runtime]) => {
        if (live) {
          setDiscovery(snapshot)
          setModel(runtime)
        }
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [])
  const latest = discovery?.routineOperatingSessions?.[0]
  const interrupted = latest?.operational_status === "INTERRUPTED"
  const continuous =
    discovery?.productionOperatingState?.current === true &&
    discovery.productionOperatingState.recurrence_authorized === true
  const held =
    !continuous &&
    (latest?.recurrence_state === "HOLD" || latest?.status === "HELD_REVIEW")
  const listener = model?.activity.find((item) => item.mode === "listener")
  const observations = (discovery?.postEffectReconciliation?.[0]?.n8n_health ??
    []) as Observation[]
  const lastFor = (role: string) =>
    observations
      .filter(
        (row) =>
          row.logical_role === role && Number(row.contract_version) === 2,
      )
      .sort((a, b) =>
        String(b.observed_at).localeCompare(String(a.observed_at)),
      )[0]
  return (
    <section className="acq-panel acq-work-summary">
      <p className="acq-eyebrow">
        {es ? "Operación y salud" : "Work and health"}
      </p>
      <h2>
        {held
          ? es
            ? "Recurrencia en HOLD"
            : "Recurrence on HOLD"
          : es
            ? "Estado operativo"
            : "Operating state"}
      </h2>
      <p>
        {held
          ? es
            ? "El scheduler rutinario está desarmado bajo HOLD; el horario configurado no abre otra ventana. El listener independiente puede recibir trabajo autorizado."
            : "The routine scheduler is unarmed under HOLD; the configured time does not open another window. The separate listener can receive authorized work."
          : es
            ? "El trabajo y la autoridad se verifican antes de cada ejecución."
            : "Work and authority are checked before every run."}
      </p>
      {error && (
        <p role="alert">
          {es
            ? "No se pudo verificar toda la salud operativa. No se asume disponibilidad."
            : "Full operating health could not be verified. Availability is not assumed."}
        </p>
      )}
      <div className="acq-health-grid">
        <div>
          <span>{es ? "Recurrencia" : "Recurrence"}</span>
          <strong>
            {held
              ? "HOLD"
              : continuous
                ? es
                  ? "Activa y continua"
                  : "Active and continuous"
              : es
                ? "Según autoridad vigente"
                : "Per current authority"}
          </strong>
        </div>
        <div>
          <span>Scheduler</span>
          <strong>
            {held
              ? es
                ? "Desarmado"
                : "Unarmed"
              : continuous
                ? es
                  ? "Armado · 17:00"
                  : "Armed · 17:00"
                : es
                  ? "Verificar autoridad"
                  : "Verify authority"}
          </strong>
        </div>
        <div>
          <span>{es ? "Trabajo pendiente" : "Pending work"}</span>
          <strong>
            {health?.pendingWorkCount ?? discovery?.totals.pending_work ?? "—"}
          </strong>
        </div>
        <div>
          <span>Mac listener</span>
          <strong>
            {listener
              ? listener.current
                ? es
                  ? "Disponible"
                  : "Available"
                : es
                  ? "Sin confirmar"
                  : "Unconfirmed"
              : "—"}
          </strong>
        </div>
        <div>
          <span>{es ? "Última ventana" : "Latest window"}</span>
          <strong>
            {interrupted
              ? es
                ? "Interrumpida · sin ejecución activa"
                : "Interrupted · no active execution"
              : latest?.status === "HELD_REVIEW"
              ? es
                ? "Cerrada · revisión"
                : "Closed · review"
              : (latest?.status ?? "—")}
          </strong>
        </div>
        <div>
          <span>PostgreSQL</span>
          <strong>
            {health
              ? health.databaseReady
                ? es
                  ? "Disponible"
                  : "Available"
                : es
                  ? "No disponible"
                  : "Unavailable"
              : "—"}
          </strong>
        </div>
        {(["TRANSPORT", "INBOUND"] as const).map((role) => {
          const row = lastFor(role)
          return (
            <div key={role}>
              <span>n8n {role === "TRANSPORT" ? "Transport" : "Inbound"}</span>
              <strong>
                {row
                  ? String(row.result)
                  : es
                    ? "Sin confirmar"
                    : "Unconfirmed"}
              </strong>
            </div>
          )
        })}
      </div>
      <details>
        <summary>
          {es
            ? "Observaciones de n8n y diagnóstico"
            : "n8n observations and diagnostics"}
        </summary>
        {(["TRANSPORT", "INBOUND"] as const).map((role) => {
          const row = lastFor(role)
          return (
            <p key={role}>
              <strong>n8n {role}</strong>:{" "}
              {row
                ? `${String(row.result)} · ${String(row.observed_at)}`
                : es
                  ? "sin observación v2 en esta proyección"
                  : "no v2 observation in this projection"}
            </p>
          )
        })}
        <p>
          {es
            ? "El preflight del Mac compara estas observaciones con el reloj de PostgreSQL y exige menos de 12 horas. La disponibilidad del servicio no sustituye evidencia vigente de cada workflow."
            : "The Mac preflight checks these observations against PostgreSQL time and requires less than 12 hours. Service reachability does not replace fresh workflow evidence."}
        </p>
        <p>
          {es ? "Última sesión" : "Latest session"}: {latest?.local_date ?? "—"}{" "}
          ·{" "}
          {es
            ? "Migraciones, backup y launchd se verifican en diagnóstico operacional, no se infieren de esta página."
            : "Migrations, backup and launchd are verified operationally, not inferred from this page."}
        </p>
      </details>
    </section>
  )
}
