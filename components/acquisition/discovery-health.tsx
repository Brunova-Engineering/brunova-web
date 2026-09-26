"use client"

import { useEffect, useState } from "react"
import type { DiscoveryTruth } from "@/lib/acquisition-management-truth"
import type { Locale } from "@/lib/i18n"
import { readDiscovery } from "@/lib/acquisition-discovery-read"

export function DiscoveryHealth({ locale }: { locale: Locale }) {
  const es = locale === "es"
  const [data, setData] = useState<DiscoveryTruth | null>(null),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    readDiscovery()
      .then((d) => {
        if (live) setData(d)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [])
  if (failed)
    return (
      <p role="alert">
        {es
          ? "No se pudo verificar la salud de Discovery."
          : "Discovery health could not be verified."}
      </p>
    )
  if (!data)
    return (
      <p>
        {es ? "Consultando salud de Discovery…" : "Loading Discovery health…"}
      </p>
    )
  const session = data.routineOperatingSessions?.[0]
  const held =
    data.productionOperatingState?.recurrence_authorized !== true &&
    session?.status === "HELD_REVIEW"
  const interrupted = session?.operational_status === "INTERRUPTED"
  return (
    <section className="acq-panel">
      <h2>
        {es
          ? "Discovery · operación y fuentes"
          : "Discovery · operation and sources"}
      </h2>
      <p>
        {es ? "Trabajo pendiente" : "Pending work"}: {data.totals.pending_work}{" "}
        · {es ? "Candidatas conservadas" : "Retained candidates"}:{" "}
        {data.totals.candidates}
      </p>
      {session && (
        <p>
          {es ? "Última ventana" : "Latest window"}:{" "}
          {String(session.local_date).slice(0, 10)} ·{" "}
          {interrupted
            ? es
              ? "interrumpida; recuperación pendiente"
              : "interrupted; recovery pending"
            : held
            ? es
              ? "cerrada y detenida para revisión"
              : "closed and held for review"
            : data.productionOperatingState?.recurrence_authorized
              ? es
                ? "operación continua autorizada"
                : "continuous operation authorized"
              : session.status.replaceAll("_", " ")}
          . {es ? "Nuevos efectos autorizados" : "New effects authorized"}:{" "}
          {session.prospect_effects_authorized ? (es ? "Sí" : "Yes") : "0"}.
        </p>
      )}
      <details>
        <summary>
          {es ? "Estado observado por fuente" : "Observed source status"}
        </summary>
        <ul>
          {data.sources.map((s) => (
            <li key={s.id}>
              {s.id} · {s.health} ·{" "}
              {s.available
                ? es
                  ? "disponible según última observación"
                  : "available at last observation"
                : es
                  ? "no disponible"
                  : "unavailable"}
            </li>
          ))}
        </ul>
        <p>
          {es
            ? "Un fallo de acceso no prueba ausencia de oportunidades. La disponibilidad debe comprobarse antes de otra ejecución."
            : "An access failure is not evidence of no opportunities. Availability must be rechecked before another execution."}
        </p>
      </details>
    </section>
  )
}
