"use client"
import { useEffect, useState, useRef } from "react"
import {
  acquisitionApi as api,
  type PortalSession,
} from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

export function PolicySettings({
  locale,
  session,
  cycleId,
}: {
  locale: Locale
  session: PortalSession
  cycleId?: string
}) {
  const es = locale === "es",
    [state, setState] = useState<Awaited<
      ReturnType<typeof api.policySettings>
    > | null>(null),
    [value, setValue] = useState(""),
    [reason, setReason] = useState(""),
    [pending, setPending] = useState(false),
    [notice, setNotice] = useState(""),
    [loadFailed, setLoadFailed] = useState(false),
    [proposal, setProposal] = useState<{
      id: string
      hash: string
      value: number
    } | null>(null)
  const retry = useRef<{ body: string; id: string } | null>(null)
  const [snapshotMaximum, setSnapshotMaximum] = useState<number | null>(null)
  useEffect(() => {
    let live = true
    if (cycleId)
      api
        .cycleReview(cycleId)
        .then((r) => {
          if (live) setSnapshotMaximum(r.review.discovery?.maximum ?? null)
        })
        .catch(() => {
          if (live) setSnapshotMaximum(null)
        })
    return () => {
      live = false
    }
  }, [cycleId])
  useEffect(() => {
    let stopped = false
    api
      .policySettings()
      .then((s) => {
        if (!stopped) {
          setState(s)
          setValue(
            String(
              s.settings.find((v) => v.key === "discoveryMaximum")?.value ?? "",
            ),
          )
        }
      })
      .catch(() => {
        if (!stopped) {
          setLoadFailed(true)
          setNotice(
            es
              ? "No pudimos consultar la configuración. Intenta de nuevo."
              : "Settings could not be verified. Try again.",
          )
        }
      })
    return () => {
      stopped = true
    }
  }, [es])
  const setting = state?.settings.find((v) => v.key === "discoveryMaximum")
  async function submit(confirm: boolean) {
    if (!state || pending) return
    const n = Number(value)
    if (!confirm && (!Number.isInteger(n) || n < 1 || n > 75)) {
      setNotice(
        es
          ? "El límite aprobado permite de 1 a 75 empresas. Aumentarlo requiere una revisión de política."
          : "The approved envelope allows 1–75 companies. Increasing it requires policy review.",
      )
      return
    }
    const body =
      confirm && proposal
        ? {
            operation: "CONFIRM",
            expectedVersion: state.version,
            proposalId: proposal.id,
            proposalHash: proposal.hash,
          }
        : {
            operation: "PROPOSE",
            expectedVersion: state.version,
            discoveryMaximum: n,
            reason: reason.trim(),
          }
    const key = JSON.stringify(body)
    if (retry.current?.body !== key)
      retry.current = { body: key, id: crypto.randomUUID() }
    setPending(true)
    setNotice("")
    try {
      const result = await api.policyChange(
        retry.current.id,
        body,
        session.csrfToken,
      )
      if (confirm) {
        setState(await api.policySettings())
        setProposal(null)
        setReason("")
        setNotice(
          es
            ? "Nueva versión guardada. El Cycle sigue sin activarse."
            : "New version saved. The Cycle remains inactive.",
        )
      } else if (result.proposalId && result.proposalHash)
        setProposal({
          id: result.proposalId,
          hash: result.proposalHash,
          value: n,
        })
      retry.current = null
    } catch {
      setNotice(
        es
          ? "No se confirmó el cambio. Actualiza la configuración: puede haber cambiado, vencido o estar bloqueada por un Cycle existente."
          : "Change not confirmed. Refresh settings: they may have changed, expired or been locked by an existing Cycle.",
      )
    } finally {
      setPending(false)
    }
  }
  return (
    <section className="acq-panel">
      <h2>{es ? "Política vigente" : "Current policy"}</h2>
      <p className="acq-muted">
        {es
          ? "El snapshot del Cycle es de consulta. Sólo aparecen controles cuando existe una propuesta versionada y gobernada."
          : "The Cycle snapshot is read-only. Controls appear only where a governed, versioned proposal exists."}
      </p>
      <p>
        {cycleId
          ? es
            ? "Este Cycle ya conserva su política aprobada. Su snapshot no puede editarse; una propuesta futura no altera la ejecución actual."
            : "This Cycle already holds its approved policy. Its snapshot cannot be edited; a future proposal does not alter current execution."
          : es
            ? "Reglas aprobadas, no permisos de ejecución. Activar el Cycle es una decisión posterior."
            : "Approved rules, not execution permission. Cycle activation is a later decision."}
      </p>
      {notice && <p role="status">{notice}</p>}
      <button
        disabled={pending}
        onClick={async () => {
          setPending(true)
          try {
            const current = await api.policySettings()
            setState(current)
            setValue(
              String(
                current.settings.find((v) => v.key === "discoveryMaximum")
                  ?.value ?? "",
              ),
            )
            setProposal(null)
            retry.current = null
            setNotice("")
            setLoadFailed(false)
          } catch {
            setNotice(
              es
                ? "No pudimos verificar la configuración. No se cambió nada."
                : "Settings could not be verified. Nothing changed.",
            )
          } finally {
            setPending(false)
          }
        }}
      >
        {es ? "Actualizar configuración" : "Refresh settings"}
      </button>
      {!state ? (
        <p role={loadFailed ? "alert" : "status"}>
          {loadFailed
            ? es
              ? "Configuración no verificable. Usa Actualizar configuración para reintentar."
              : "Settings unavailable. Use Refresh settings to retry."
            : es
              ? "Consultando configuración…"
              : "Loading settings…"}
        </p>
      ) : (
        <>
          <div className="acq-settings-grid">
            <section>
              <span className="acq-eyebrow">{es ? "Mercado" : "Market"}</span>
              <h3>
                {es ? "México y Estados Unidos" : "Mexico and United States"}
              </h3>
              <p>
                {es
                  ? "Sin cuotas por país. Cambiar mercados exige revisión material de política."
                  : "No country quotas. Changing markets requires material policy review."}
              </p>
              <small>
                {es
                  ? "No editable en este Cycle"
                  : "Not editable in this Cycle"}
              </small>
            </section>
            <section>
              <span className="acq-eyebrow">Discovery</span>
              <h3>
                {cycleId
                  ? (snapshotMaximum ?? (es ? "Verificando…" : "Checking…"))
                  : String(setting?.value ?? "—")}{" "}
                {es ? "empresas máximo" : "companies maximum"}
              </h3>
              <p>
                {es
                  ? "Es un techo de admisión, no una meta que deba llenarse."
                  : "An admission ceiling, not a target to fill."}
              </p>
              <small>
                {cycleId
                  ? es
                    ? "Snapshot actual inmutable; una versión futura no lo altera"
                    : "Current snapshot immutable; a future version does not change it"
                  : setting?.editable
                    ? es
                      ? "Propuesta gobernada disponible antes de activar"
                      : "Governed proposal available before activation"
                    : es
                      ? "Bloqueado"
                      : "Locked"}
              </small>
            </section>
            <section>
              <span className="acq-eyebrow">
                {es ? "Calificación" : "Qualification"}
              </span>
              <h3>{es ? "Evidencia, no score" : "Evidence, not a score"}</h3>
              <p>
                {es
                  ? "Capacidad + complejidad + señal de intervención. La incertidumbre se conserva para revisión."
                  : "Capacity + complexity + intervention signal. Uncertainty remains available for review."}
              </p>
              <small>
                {es ? "Cambio material de política" : "Material policy change"}
              </small>
            </section>
            <section>
              <span className="acq-eyebrow">
                {es ? "Ejecución" : "Execution"}
              </span>
              <h3>12 {es ? "prospectos" : "prospects"} · 3 waves × 4</h3>
              <p>
                {es
                  ? "Cada wave necesita aprobación exacta. Estos límites no se editan operativamente."
                  : "Each wave needs exact approval. These limits are not operational edits."}
              </p>
              <small>
                {es ? "Snapshot del Cycle bloqueado" : "Cycle snapshot locked"}
              </small>
            </section>
            <section>
              <span className="acq-eyebrow">Email</span>
              <h3>
                {es ? "Listo, sin envío activo" : "Ready, sending inactive"}
              </h3>
              <p>
                {es
                  ? "2 nuevos contactos y 4 intentos por día UTC; 24 intentos por Cycle. Mínimo 30 minutos; un seguimiento tras 7 días, sin respuesta y con autorización nueva."
                  : "2 new contacts and 4 attempts per UTC day; 24 attempts per Cycle. At least 30 minutes apart; one follow-up after 7 days, without a response and with new authorization."}
              </p>
              <small>
                {es
                  ? "No editable en este Cycle"
                  : "Not editable in this Cycle"}
              </small>
            </section>
            <section>
              <span className="acq-eyebrow">Management</span>
              <h3>{es ? "Autonomía por wave" : "Wave-bounded autonomy"}</h3>
              <p>
                {es
                  ? "Pancracio opera sólo dentro de una wave aprobada; la siguiente exige revisión y autorización nuevas."
                  : "Pancracio operates only within an approved wave; the next requires new review and authorization."}
              </p>
              <small>
                {es
                  ? "La reorientación operativa no cambia la política"
                  : "Operational reorientation does not change policy"}
              </small>
            </section>
          </div>
          {setting?.editable &&
            session.actor.capabilities.includes("MANAGE_CYCLE") && (
              <fieldset disabled={pending}>
                <legend>
                  {es
                    ? "Proponer límite de discovery"
                    : "Propose discovery limit"}
                </legend>
                {!proposal ? (
                  <>
                    <label>
                      {es ? "Nuevo máximo" : "New maximum"}
                      <input
                        type="number"
                        min={1}
                        max={75}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                      />
                    </label>
                    <label>
                      {es ? "Motivo del cambio" : "Reason for change"}
                      <textarea
                        value={reason}
                        maxLength={1000}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                    <button
                      disabled={
                        !reason.trim() || Number(value) === setting.value
                      }
                      onClick={() => void submit(false)}
                    >
                      {es ? "Revisar impacto" : "Review impact"}
                    </button>
                  </>
                ) : (
                  <>
                    <h4>{es ? "Impacto del cambio" : "Change impact"}</h4>
                    <p>
                      {String(setting.value)} → {proposal.value}
                    </p>
                    <p>
                      {es
                        ? "Se creará una versión nueva. No elimina empresas, no cambia snapshots y no activa investigación ni Email. La activación futura deberá elegir una versión exacta."
                        : "Creates a new version. Does not delete companies, change snapshots or activate research or Email. Future activation must choose an exact version."}
                    </p>
                    <button onClick={() => setProposal(null)}>
                      {es ? "Cancelar" : "Cancel"}
                    </button>
                    <button onClick={() => void submit(true)}>
                      {es ? "Confirmar nueva versión" : "Confirm new version"}
                    </button>
                  </>
                )}
              </fieldset>
            )}
          <details>
            <summary>{es ? "Detalle técnico" : "Technical detail"}</summary>
            <p>
              v{state.version} · {state.policyHash}
            </p>
          </details>
        </>
      )}
    </section>
  )
}
