"use client"
import { useEffect, useState } from "react"
import { acquisitionApi as api } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"
import type { DiscoveryTruth } from "@/lib/acquisition-management-truth"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
export function EngineActivity({ locale }: { locale: Locale }) {
  const es = locale === "es",
    [state, setState] = useState<Awaited<
      ReturnType<typeof api.operatingModel>
    > | null>(null),
    [discovery, setDiscovery] = useState<DiscoveryTruth | null>(null),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    let stopped = false
    api
      .operatingModel()
      .then((s) => {
        if (!stopped) setState(s)
      })
      .catch(() => {
        if (!stopped) setFailed(true)
      })
    readDiscovery()
      .then((d) => {
        if (!stopped) setDiscovery(d)
      })
      .catch(() => {})
    return () => {
      stopped = true
    }
  }, [])
  const latestWindow = discovery?.routineOperatingSessions?.[0],
    interrupted = latestWindow?.operational_status === "INTERRUPTED",
    continuous =
      discovery?.productionOperatingState?.current === true &&
      discovery.productionOperatingState.recurrence_authorized === true,
    held = !continuous && latestWindow?.status === "HELD_REVIEW",
    listener = state?.activity.find((v) => v.mode === "listener"),
    run = state?.activity.find((v) => v.mode === "recovery"),
    schedule = listener?.schedule ?? run?.schedule
  return (
    <section className="acq-panel">
      <h2>{es ? "Actividad del Engine" : "Engine activity"}</h2>
      <p>
        {es
          ? "No necesitas dejar abierto Portal o ChatGPT. El Mac procesa trabajo autorizado; si está dormido o desconectado, el trabajo permanece guardado y espera su regreso."
          : "You do not need to keep Portal or ChatGPT open. The Mac processes authorized work; while asleep or offline, durable work waits for its return."}
      </p>
      {failed ? (
        <p role="status">
          {es
            ? "Actividad no verificable en este momento."
            : "Activity cannot be verified right now."}
        </p>
      ) : state ? (
        <>
          <p>
            {es
              ? "Recuperación diaria configurada"
              : "Configured daily recovery"}
            :{" "}
            {schedule
              ? `${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")} · ${schedule.timeZone}`
              : es
                ? "Sin observación disponible"
                : "No observation available"}
          </p>
          {held && (
            <p>
              <strong>
                {es
                  ? "Recurrencia detenida para revisión humana; el horario no implica una nueva ventana autorizada."
                  : "Recurrence held for Human review; a configured schedule does not authorize another window."}
              </strong>
            </p>
          )}
          <p>
            {es ? "Última ventana de Acquisition" : "Latest Acquisition window"}
            :{" "}
            {latestWindow?.started_at
              ? new Date(latestWindow.started_at).toLocaleString(
                  es ? "es-MX" : "en-US",
                  { timeZone: "America/Mexico_City" },
                )
              : es
                ? "Sin observación disponible"
                : "No observation available"}{" "}
            ·{" "}
            {interrupted
              ? es
                ? "interrumpida; no está ejecutándose y espera recuperación"
                : "interrupted; not executing and awaiting recovery"
              : held
              ? es
                ? "cerrada; espera revisión"
                : "closed; awaiting review"
              : continuous
                ? es
                  ? "operación continua autorizada"
                  : "continuous operation authorized"
                : (latestWindow?.status ?? "—")}
          </p>
          <details>
            <summary>
              {es ? "Recuperación técnica" : "Technical recovery"}
            </summary>
            <p>
              {es ? "Última ejecución" : "Last run"}:{" "}
              {run
                ? new Date(run.heartbeat_at).toLocaleString(
                    es ? "es-MX" : "en-US",
                    { timeZone: schedule?.timeZone },
                  )
                : "—"}
              {run && run.event !== "RUN_FINISHED"
                ? es
                  ? " · Sin finalización confirmada"
                  : " · Completion not confirmed"
                : ""}
            </p>
          </details>
          <p>
            {listener?.current
              ? es
                ? "El Mac está disponible para recibir trabajo inmediato."
                : "The Mac is available to receive immediate work."
              : es
                ? "Disponibilidad inmediata del Mac sin confirmar. Las Signals no reemplazan al trabajo durable."
                : "Immediate Mac availability unconfirmed. Signals do not replace durable work."}
          </p>
        </>
      ) : (
        <p>{es ? "Consultando actividad…" : "Loading activity…"}</p>
      )}
      <details>
        <summary>
          {es ? "Qué ocurre automáticamente" : "What happens automatically"}
        </summary>
        <p>
          {es
            ? "Las Signals despiertan al worker cuando hay trabajo comprometido. El horario diario recupera trabajo pendiente. Ambos usan el mismo Engine. Aprobar una wave, cambiar política o activar el Cycle requiere la autoridad de Management correspondiente."
            : "Signals wake the worker when work is committed. The daily schedule recovers pending work. Both use the same Engine. Wave approval, policy changes and Cycle activation require the appropriate Management authority."}
        </p>
        {state?.currentExecutionScope === "CALIBRATION_ONLY" && (
          <p>
            {es
              ? "El runtime actual está limitado a calibración. No hay ejecución de un Cycle real."
              : "The current runtime is calibration-only. No real Cycle is executing."}
          </p>
        )}
      </details>
    </section>
  )
}
