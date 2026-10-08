"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  acquisitionApi as api,
  type CyclePolicyDefinition,
  type CycleReview,
  type CyclePoolItem,
  type PortalSession,
} from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"
import { readinessText } from "@/lib/acquisition-readiness"

/** Transient presentation only. All decisions, versions and accounting are Engine projections. */
export function CycleControlSection({
  cycleId,
  session,
  locale,
  onInspect,
}: {
  cycleId: string
  session: PortalSession
  locale: Locale
  onInspect?: (accountId: string) => void
}) {
  const es = locale === "es"
  const [policy, setPolicy] = useState<CyclePolicyDefinition | null>(null),
    [review, setReview] = useState<CycleReview | null>(null)
  const [error, setError] = useState(false),
    [pending, setPending] = useState(false),
    [reason, setReason] = useState("")
  const retry = useRef<{ key: string; id: string } | null>(null)
  const [pool, setPool] = useState<CyclePoolItem[]>([])
  const [hasNext, setHasNext] = useState(false)
  const [commandNotice, setCommandNotice] = useState(false)
  const load = useCallback(async () => {
    setError(false)
    try {
      const definition = await api.cyclePolicy()
      setPolicy(definition)
      setReview(cycleId ? (await api.cycleReview(cycleId)).review : null)
      const page = cycleId ? (await api.cyclePool(cycleId)).items : []
      setPool(page)
      setHasNext(page.length === 25)
    } catch {
      setError(true)
      setReview(null)
      setPool([])
    }
  }, [cycleId])
  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (!cancelled) void load()
    })
    return () => {
      cancelled = true
    }
  }, [load])
  const names: Record<string, string> = es
    ? {
        READY_NOW: "Listas ahora",
        RETAINED: "Retenidas",
        HOLD: "En revisión",
        REJECTED: "Rechazadas con evidencia",
        PLANNED: "Compuesta, sin aprobación",
        APPROVED: "Aprobada",
        REVIEW_REQUIRED: "Revisión requerida",
        COMPLETE: "Completa",
        STOPPED: "Detenida",
        CONFIGURED: "Configurada",
      }
    : {
        READY_NOW: "Ready now",
        RETAINED: "Retained",
        HOLD: "On hold",
        REJECTED: "Evidence-supported rejection",
        PLANNED: "Composed, not approved",
        APPROVED: "Approved",
        REVIEW_REQUIRED: "Review required",
        COMPLETE: "Complete",
        STOPPED: "Stopped",
        CONFIGURED: "Configured",
      }
  const current = review?.waves.at(-1)
  const previouslySelected = new Set(
    review?.waves.flatMap((wave) =>
      wave.composition.map((member) => member.personId),
    ) ?? [],
  )
  const canPrepare =
    hasNext ||
    pool.some(
      (item) =>
        item.readiness_reason === "EXECUTABLE_CANDIDATE" &&
        (!item.binding?.personId ||
          !previouslySelected.has(item.binding.personId)),
    )
  const compositionCurrent =
    !!current?.members?.length &&
    current.members.length === current.composition.length &&
    current.members.every(
      (member) => member.readinessReason === "EXECUTABLE_CANDIDATE",
    ) &&
    !review?.control?.technical_halt &&
    review?.control?.state !== "STOPPED"
  async function operate(operation: string, item?: CyclePoolItem) {
    if (!review || pending) return
    const reconsider = ["DEEPER_RESEARCH", "RECONSIDER_BUYER"].includes(
      operation,
    )
    if (operation !== "COMPOSE_WAVE" && !reason.trim()) return
    if (reconsider && !item?.research_version) return
    const body = {
      cycleId,
      operation,
      expectedVersion: reconsider
        ? item!.research_version
        : (review.control?.version ?? 1),
      ...(item ? { accountId: item.account_id } : {}),
      ...(operation === "COMPOSE_WAVE" ? {} : { reason: reason.trim() }),
    }
    const key = JSON.stringify(body)
    if (retry.current?.key !== key)
      retry.current = { key, id: crypto.randomUUID() }
    setPending(true)
    setCommandNotice(false)
    try {
      await (reconsider ? api.reconsiderAccount : api.cycleCommand)(
        retry.current.id,
        body,
        session.csrfToken,
      )
      retry.current = null
      setReason("")
      await load()
    } catch {
      await load()
      setCommandNotice(true)
    } finally {
      setPending(false)
    }
  }
  async function approve() {
    if (!review?.control || !current || pending || !compositionCurrent) return
    const body = {
      cycleId,
      expectedVersion: review.control.version,
      waveId: current.id,
      compositionHash: current.composition_hash,
    }
    const key = JSON.stringify(body)
    if (retry.current?.key !== key)
      retry.current = { key, id: crypto.randomUUID() }
    setPending(true)
    try {
      await api.approveWave(retry.current.id, body, session.csrfToken)
      retry.current = null
      await load()
    } catch {
      await load()
      setCommandNotice(true)
    } finally {
      setPending(false)
    }
  }
  async function decide(decision: "CONTINUE" | "ADJUST" | "STOP") {
    if (!review?.control || !current || pending || !reason.trim()) return
    const body = {
      cycleId,
      operation: "REVIEW_WAVE",
      expectedVersion: review.control.version,
      waveId: current.id,
      decision,
      reason: reason.trim(),
    }
    const key = JSON.stringify(body)
    if (retry.current?.key !== key)
      retry.current = { key, id: crypto.randomUUID() }
    setPending(true)
    try {
      await api.cycleCommand(retry.current.id, body, session.csrfToken)
      retry.current = null
      setReason("")
      await load()
    } catch {
      await load()
      setCommandNotice(true)
    } finally {
      setPending(false)
    }
  }
  return (
    <section
      className="acq-cycle"
      aria-label={es ? "Control del Cycle" : "Cycle control"}
    >
      <h2>
        {es
          ? "Contacto · Composición y revisión gobernada"
          : "Outreach · Governed composition and review"}
      </h2>
      {commandNotice && (
        <p role="alert">
          {es
            ? "No se confirmó la acción. Consulta el estado actualizado y los requisitos de preparación o aprobación antes de reintentar. No se sustituyó ninguna empresa."
            : "The action was not confirmed. Check current state and preparation or approval requirements before retrying. No company was substituted."}
        </p>
      )}
      {error && (
        <p>
          {es
            ? "No se pudo verificar el estado actual. Actualiza antes de decidir."
            : "Current state could not be verified. Refresh before deciding."}
        </p>
      )}
      {!policy && !error && (
        <p>
          {es
            ? "Consultando la política del Engine…"
            : "Loading Engine policy…"}
        </p>
      )}
      {policy && !cycleId && (
        <>
          <p>
            {es
              ? "Una wave aparecerá cuando el Engine identifique candidatos ejecutables. Prepararla no autoriza contactar."
              : "A wave appears when the Engine identifies executable candidates. Preparing it does not authorize outreach."}
          </p>
          <p>
            {es
              ? "Email listo pero deshabilitado. Sin activación desde esta pantalla."
              : "Email ready but disabled. No activation from this screen."}
          </p>
        </>
      )}
      {review && (
        <details open={review.waves.length > 0 || (review.discovery?.admitted ?? 0) > 0}>
          <summary>
            {es
              ? "Waves de Accounts · controles y presupuesto"
              : "Account waves · controls and budget"}
            {(review.discovery?.admitted ?? 0) === 0 &&
              (es ? " · todavía sin Accounts admitidos" : " · no admitted Accounts yet")}
          </summary>
          <p role="status">
            {review.control?.technical_halt ||
            review.control?.state === "STOPPED"
              ? es
                ? "El Cycle está pausado: no se permite avanzar."
                : "The Cycle is paused: progression is not permitted."
              : current?.state === "PLANNED"
                ? !compositionCurrent
                  ? es
                    ? "La composición necesita revalidación. Revisa los requisitos pendientes antes de aprobar."
                    : "The composition needs revalidation. Review unmet requirements before approval."
                  : es
                    ? "Siguiente paso: revisa las empresas y aprueba la wave si estás de acuerdo."
                    : "Next: review the companies and approve the wave if you agree."
                : current &&
                    ["APPROVED", "REVIEW_REQUIRED"].includes(current.state)
                  ? es
                    ? "Siguiente paso: revisa resultados y decide continuar, ajustar o detener. Email de producción sigue deshabilitado."
                    : "Next: review outcomes and decide to continue, adjust or stop. Production Email remains disabled."
                  : !canPrepare
                    ? es
                      ? "No hay nuevos prospectos ejecutables disponibles. Conserva las oportunidades y revisa qué evidencia o preparación falta."
                      : "No new executable prospects are available. Opportunities remain retained; review missing evidence or preparation."
                    : es
                      ? "Siguiente paso: revisa las oportunidades y prepara las mejores disponibles. Preparar no autoriza ejecutar."
                      : "Next: review opportunities and prepare the strongest available. Preparation does not authorize execution."}
          </p>
          <div className="acq-metrics">
            {["READY_NOW", "RETAINED", "HOLD", "REJECTED"].map((state) => (
              <div key={state}>
                <span>{names[state]}</span>
                <strong>{review.pool[state] ?? 0}</strong>
              </div>
            ))}
          </div>
          <p>
            {es
              ? "Prospectos nuevos / intentos / intentos hoy UTC"
              : "New prospects / attempts / attempts today UTC"}
            : {review.newProspects} / {review.attempts} / {review.attemptsToday}
          </p>
          {policy && (
            <p>
              {es ? "Presupuesto restante" : "Remaining budget"}:{" "}
              {Math.max(
                0,
                policy.policy.limits.outboundApproved - review.newProspects,
              )}{" "}
              {es ? "prospectos nuevos" : "new prospects"} ·{" "}
              {Math.max(0, 24 - review.attempts)}{" "}
              {es ? "intentos en el Cycle" : "Cycle attempts"}
            </p>
          )}
          {session.actor.capabilities.includes("MANAGE_CYCLE") && (
            <fieldset disabled={pending || error}>
              <legend>{es ? "Acciones del Cycle" : "Cycle actions"}</legend>
              {(!current ||
                !["APPROVED", "REVIEW_REQUIRED"].includes(current.state)) && (
                <label>
                  {es
                    ? "Razón basada en evidencia"
                    : "Evidence-grounded reason"}
                  <textarea
                    value={reason}
                    maxLength={1000}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              )}
              <p>
                {es
                  ? "Para reconsiderar o conservar una empresa, escribe la razón y elige la acción en la lista de oportunidades."
                  : "To reconsider or retain a company, enter the reason and choose its action in the opportunity list."}
              </p>
              {(!current || current.state === "COMPLETE") &&
                canPrepare &&
                !review.control?.technical_halt &&
                review.control?.state !== "STOPPED" && (
                  <button onClick={() => void operate("COMPOSE_WAVE")}>
                    {es
                      ? "Preparar las mejores disponibles (hasta cuatro)"
                      : "Prepare strongest available (up to four)"}
                  </button>
                )}
              <button
                disabled={!reason.trim() || !!review.control?.technical_halt}
                onClick={() => void operate("TECHNICAL_HALT")}
              >
                {es
                  ? "Pausar por problema técnico"
                  : "Pause for a technical issue"}
              </button>
            </fieldset>
          )}
          <details>
            <summary>
              {es
                ? "Oportunidades y explicación"
                : "Opportunity pool and explanation"}
            </summary>
            <ul>
              {pool.map((item) => (
                <li key={item.account_id}>
                  <strong>{item.display_name}</strong> ·{" "}
                  {names[item.pool_state] ?? item.pool_state}
                  <p>
                    {item.canonical_domain} ·{" "}
                    {item.country ??
                      (es ? "Mercado sin confirmar" : "Market unconfirmed")}
                  </p>
                  {onInspect && (
                    <button onClick={() => onInspect(item.account_id)}>
                      {es
                        ? "Ver evidencia y explicación"
                        : "Inspect evidence and explanation"}
                    </button>
                  )}
                  <p>
                    {readinessText(
                      item.pool_state === "REJECTED"
                        ? "SUPPORTED_NONFIT"
                        : item.readiness_reason,
                      locale,
                    )}
                  </p>
                  <p>
                    {typeof item.rationale?.summary === "string"
                      ? item.rationale.summary
                      : ""}
                  </p>
                  {item.known_unknowns?.length ? (
                    <p>
                      {es ? "Desconocido: " : "Unknown: "}
                      {item.known_unknowns.join(" · ")}
                    </p>
                  ) : null}
                  <fieldset disabled={pending || error || !reason.trim()}>
                    <legend>{es ? "Siguiente acción" : "Next action"}</legend>
                    {session.actor.capabilities.includes("REQUEST_RESEARCH") &&
                      item.research_version && (
                        <>
                          <button
                            onClick={() =>
                              void operate("DEEPER_RESEARCH", item)
                            }
                          >
                            {es ? "Investigar más" : "Investigate more"}
                          </button>
                          <button
                            onClick={() =>
                              void operate("RECONSIDER_BUYER", item)
                            }
                          >
                            {es
                              ? "Reconsiderar responsable"
                              : "Reconsider problem owner"}
                          </button>
                        </>
                      )}
                    {session.actor.capabilities.includes("MANAGE_CYCLE") &&
                      (current &&
                      ["PLANNED", "APPROVED", "REVIEW_REQUIRED"].includes(
                        current.state,
                      ) &&
                      current.composition.some(
                        (m) => m.accountId === item.account_id,
                      ) ? (
                        <>
                          <p>
                            {es
                              ? "Retirar esta empresa cancela la wave completa sin sustituciones. Su número queda consumido y se requiere nueva composición y aprobación. Si ya hubo intentos, debes revisar la wave."
                              : "Removing this company cancels the entire wave without substitution. Its number remains consumed and a new composition and approval are required. If attempts already exist, review the wave instead."}
                          </p>
                          <button
                            onClick={() =>
                              void operate("REMOVE_FROM_WAVE", item)
                            }
                          >
                            {es
                              ? "Retirar empresa y cancelar esta wave"
                              : "Remove company and cancel this wave"}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => void operate("RETAIN_ACCOUNT", item)}
                        >
                          {es ? "Conservar para después" : "Retain for later"}
                        </button>
                      ))}
                  </fieldset>
                  <details>
                    <summary>
                      {es ? "Auditoría técnica" : "Technical audit"}
                    </summary>
                    <p>
                      {item.account_id} · {item.readiness_reason}
                    </p>
                  </details>
                </li>
              ))}
            </ul>
            {hasNext && (
              <button
                disabled={pending}
                onClick={async () => {
                  setPending(true)
                  try {
                    const page = (
                      await api.cyclePool(cycleId, pool.at(-1)?.account_id)
                    ).items
                    setPool(page)
                    setHasNext(page.length === 25)
                  } catch {
                    setError(true)
                  } finally {
                    setPending(false)
                  }
                }}
              >
                {es ? "Siguiente página" : "Next page"}
              </button>
            )}
          </details>
          <ul>
            {review.markets.map((m) => (
              <li key={m.country ?? "unknown"}>
                {m.country ?? (es ? "País desconocido" : "Country unknown")}:{" "}
                {m.discovered} {es ? "Accounts admitidos;" : "admitted Accounts;"}{" "}
                {m.qualified} {es ? "Accounts calificados" : "qualified Accounts"}
              </li>
            ))}
          </ul>
          <p>
            {es
              ? "La cobertura de ambos mercados requiere revisión; pocas observaciones no prueban falta de oportunidad."
              : "Both-market coverage requires review; few observations do not establish lack of opportunity."}
          </p>
          {review.control?.technical_halt && (
            <p role="alert">
              {es ? "Alto técnico:" : "Technical halt:"}{" "}
              {review.control.technical_halt}
            </p>
          )}
          {review.control?.discovery_stop_reason && (
            <p>
              {es ? "Discovery detenido:" : "Discovery stopped:"}{" "}
              {review.control.discovery_stop_reason}
            </p>
          )}
          {current ? (
            <p>
              Wave {current.number}: {names[current.state] ?? current.state} ·{" "}
              {current.composition.length}{" "}
              {es ? "prospectos seleccionados" : "selected prospects"}
            </p>
          ) : (
            <p>{es ? "Sin wave compuesta." : "No wave composed."}</p>
          )}
          {current && (
            <section aria-label={es ? "Empresas de la wave" : "Wave companies"}>
              <ul>
                {current.members?.map((member) => (
                  <li key={member.accountId}>
                    <strong>{member.company}</strong> · {member.domain}
                    {onInspect && (
                      <button onClick={() => onInspect(member.accountId)}>
                        {es ? "Ver empresa" : "Inspect company"}
                      </button>
                    )}
                    <p>
                      {es ? "Responsable" : "Problem owner"}:{" "}
                      {member.buyer ?? (es ? "Sin resolver" : "Unresolved")} ·{" "}
                      {member.channel}
                    </p>
                    <p>
                      {member.reason ??
                        (es
                          ? "Explicación pendiente de verificar."
                          : "Explanation needs verification.")}
                    </p>
                    <p>
                      {readinessText(
                        member.readinessReason ?? "UNKNOWN",
                        locale,
                      )}
                    </p>
                  </li>
                ))}
              </ul>
              {!current.members && (
                <p>
                  {es
                    ? "Actualiza para verificar las empresas antes de aprobar."
                    : "Refresh to verify the companies before approving."}
                </p>
              )}
              {current.state === "PLANNED" &&
                compositionCurrent &&
                session.actor.capabilities.includes("MANAGE_CYCLE") && (
                  <fieldset
                    disabled={pending || error || !current.members?.length}
                  >
                    <legend>
                      {es
                        ? "Aprobar esta composición exacta"
                        : "Approve this exact composition"}
                    </legend>
                    <p>
                      {es
                        ? "Autoriza a Pancracio sólo para estas empresas y esta wave durante 14 días, bajo los límites vigentes. No activa Email ni datos reales."
                        : "Authorizes Pancracio only for these companies and this wave for 14 days, under current limits. Does not activate Email or real data."}
                    </p>
                    <button onClick={() => void approve()}>
                      {es ? "Aprobar wave" : "Approve wave"}
                    </button>
                  </fieldset>
                )}
            </section>
          )}
          <p>
            {es
              ? "Sin respuesta no significa fracaso. CONTINUE o ADJUST no aprueban automáticamente la siguiente wave."
              : "No response is not failure. CONTINUE or ADJUST does not automatically approve the next wave."}
          </p>
          <section
            aria-label={es ? "Resultados para revisión" : "Outcomes for review"}
          >
            <h3>
              {es
                ? "Resultados acumulados del Cycle"
                : "Cumulative Cycle outcomes"}
            </h3>
            <p>
              {es ? "Entregas de wave de Accounts" : "Account-wave deliveries"}:{" "}
              {review.delivery?.SUCCEEDED ?? 0}
            </p>
            <p>
              {es ? "Handoffs / aceptados" : "Handoffs / accepted"}:{" "}
              {review.funnel?.handoffs ?? 0} /{" "}
              {review.funnel?.acceptedHandoffs ?? 0}
            </p>
            <ul>
              {Object.entries(review.responses).map(([kind, count]) => {
                const labels: Record<string, readonly [string, string]> = {
                  INTERESTED: ["Interés expresado", "Expressed interest"],
                  UNKNOWN: [
                    "Respuesta que requiere interpretación",
                    "Response requiring interpretation",
                  ],
                  QUESTION: ["Pregunta", "Question"],
                  DO_NOT_CONTACT: ["No contactar", "Do not contact"],
                  COMPLAINT: ["Queja", "Complaint"],
                  BOUNCE: ["Rebote", "Bounce"],
                  OUT_OF_OFFICE: ["Fuera de oficina", "Out of office"],
                  NOT_INTERESTED: ["Sin interés", "Not interested"],
                }
                return (
                  <li key={kind}>
                    {labels[kind]?.[es ? 0 : 1] ??
                      (es
                        ? "Respuesta pendiente de revisión"
                        : "Response pending review")}
                    : {count}
                  </li>
                )
              })}
            </ul>
            {Object.keys(review.responses).length === 0 && (
              <p>
                {es
                  ? "Todavía no hay respuestas observadas; no significa fracaso."
                  : "No responses observed yet; this does not mean failure."}
              </p>
            )}
            <details>
              <summary>
                {es ? "Qué necesita revisión" : "What needs review"}
              </summary>
              <ul>
                {Object.entries(review.quality).map(([code, count]) => (
                  <li key={code}>
                    {readinessText(code, locale)} · {count}
                  </li>
                ))}
              </ul>
            </details>
            <p>
              {es
                ? "Revisa evidencia, targeting, responsable, canal y mensaje antes de decidir. Los resultados sintéticos no son aprendizaje de mercado."
                : "Review evidence, targeting, problem owner, channel and message before deciding. Synthetic results are not market learning."}
            </p>
          </section>
          <details>
            <summary>
              {es
                ? "Auditoría técnica de resultados y composición"
                : "Technical audit of outcomes and composition"}
            </summary>
            <pre>
              {JSON.stringify(
                {
                  waves: review.waves,
                  responses: review.responses,
                  quality: review.quality,
                },
                null,
                2,
              )}
            </pre>
          </details>
          {current &&
            ["APPROVED", "REVIEW_REQUIRED"].includes(current.state) &&
            session.actor.capabilities.includes("MANAGE_CYCLE") && (
              <fieldset disabled={pending || error}>
                <legend>
                  {es ? "Revisión de Management" : "Management review"}
                </legend>
                <label>
                  {es
                    ? "Razón basada en evidencia"
                    : "Evidence-grounded reason"}
                  <textarea
                    value={reason}
                    maxLength={1000}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                {(["CONTINUE", "ADJUST", "STOP"] as const).map((d) => (
                  <button
                    key={d}
                    disabled={!reason.trim()}
                    onClick={() => void decide(d)}
                  >
                    {es
                      ? {
                          CONTINUE: "Continuar",
                          ADJUST: "Ajustar",
                          STOP: "Detener",
                        }[d]
                      : {
                          CONTINUE: "Continue",
                          ADJUST: "Adjust",
                          STOP: "Stop",
                        }[d]}
                  </button>
                ))}
              </fieldset>
            )}
        </details>
      )}
      <button disabled={pending} onClick={() => void load()}>
        {es ? "Actualizar control del Cycle" : "Refresh Cycle control"}
      </button>
    </section>
  )
}
