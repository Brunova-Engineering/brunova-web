"use client"

import { useEffect, useRef, useState } from "react"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
import { acquisitionApi } from "@/lib/acquisition-api"
import type { DiscoveryTruth } from "@/lib/acquisition-management-truth"
import type { Health } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type Session = NonNullable<DiscoveryTruth["routineOperatingSessions"]>[number]
type Direction = Awaited<ReturnType<typeof acquisitionApi.routineSupervision>>["direction"]
type Priority = "AUTO" | "DISCOVERY" | "ENRICHMENT" | "FIT" | "FILTERING" | "ATTENTION"
const defaultOrder = ["focus", "investigate", "review", "decide", "attention", "continue"]
const priorityLabels: Record<Priority, string> = {
  AUTO: "Que Panky elija", DISCOVERY: "Exploración", ENRICHMENT: "Enriquecimiento",
  FIT: "Evaluación de encaje", FILTERING: "Selección", ATTENTION: "Necesita tu atención",
}
export function moveExecutivePiece(order: string[], moving: string, before: string) {
  if (moving === before || !order.includes(moving) || !order.includes(before)) return order
  const next = order.filter((item) => item !== moving)
  next.splice(next.indexOf(before), 0, moving)
  return next
}
type FlowState = "current" | "waiting" | "done" | "needs-attention" | "unknown"
type FlowPiece = {
  key: string
  title: string
  state: FlowState
  summary: string
  detail: string
}

const clean = (value: string | null | undefined, fallback: string) =>
  value?.trim() || fallback

export function executiveFlowPieces(
  session: Session | undefined,
  health: Health | null,
  locale: Locale,
): FlowPiece[] {
  const es = locale === "es"
  const running = session?.operational_status === "ACTIVE"
  const interrupted = session?.operational_status === "INTERRUPTED"
  const finished = session?.operational_status === "TERMINAL"
  const activePiece = running
    ? ({
        ALLOCATOR_REASONING: "focus",
        WAITING_FOR_MODEL: "focus",
        SOURCE_EXECUTION: "investigate",
        EVIDENCE_EVALUATION: "review",
        CANDIDATE_ACCOUNT_UPDATE: "decide",
        CLOSING_SESSION: "continue",
      } as Record<string, string>)[session?.activity_phase ?? ""]
    : undefined
  const activity = clean(session?.activity_detail, es ? "Aún no se informa una tarea específica." : "No specific task is reported yet.")
  const result = clean(session?.latest_meaningful_result, es ? "Todavía no se publica un resultado de esta ventana." : "No result has been published for this window yet.")
  const completed = clean(session?.latest_completed_action, es ? "Todavía no se publica una acción terminada." : "No completed action has been published yet.")
  const waiting = clean(session?.wait_reason, es ? "No se publica una siguiente tarea concreta." : "No specific next task is published.")
  return [
    {
      key: "focus",
      title: es ? "Foco y prioridad" : "Focus and priority",
      state: activePiece === "focus" ? "current" : "waiting",
      summary: activePiece === "focus"
        ? es ? "Comparando prioridades" : "Comparing priorities"
        : es ? "Criterios bajo revisión de Panky" : "Priorities reviewed by Panky",
      detail: es
        ? "Panky decide la siguiente unidad permitida con la autoridad, la evidencia y el tiempo disponibles. El orden concreto de candidatas aún no se publica en esta vista."
        : "Panky chooses the next permitted unit from current authority, evidence and time. Candidate order is not yet published in this view.",
    },
    {
      key: "investigate",
      title: es ? "Investigar" : "Investigate",
      state: activePiece === "investigate" ? "current" : interrupted ? "needs-attention" : "waiting",
      summary: activePiece === "investigate" ? es ? "Lectura en curso" : "Reading in progress" : es ? "Sin lectura activa" : "No active read",
      detail: activePiece === "investigate" ? activity : es ? "La última sesión no registra una lectura activa en este momento." : "The latest session does not report an active read now.",
    },
    {
      key: "review",
      title: es ? "Revisar evidencia" : "Review evidence",
      state: activePiece === "review" ? "current" : session?.latest_meaningful_result ? "done" : "waiting",
      summary: activePiece === "review" ? es ? "Evaluando fuentes" : "Evaluating sources" : session?.latest_meaningful_result
        ? es ? "Resultado disponible" : "Result available"
        : es ? "Sin resultado nuevo" : "No new result",
      detail: result,
    },
    {
      key: "decide",
      title: es ? "Decidir siguiente paso" : "Decide next step",
      state: activePiece === "decide" ? "current" : session?.latest_completed_action ? "done" : "waiting",
      summary: activePiece === "decide" ? es ? "Actualizando expediente" : "Updating record" : session?.latest_completed_action
        ? es ? "Acción registrada" : "Action recorded"
        : es ? "Aún sin decisión publicada" : "No decision published yet",
      detail: completed,
    },
    {
      key: "attention",
      title: es ? "Atención de Jorge" : "Jorge's attention",
      state: interrupted ? "needs-attention" : "unknown",
      summary: interrupted
        ? es ? "Revisión operativa necesaria" : "Operational review needed"
        : es ? "Ver decisiones pendientes" : "View pending decisions",
      detail: es
        ? "Las excepciones comerciales se revisan en «Necesita tu atención». El trabajo pendiente global no equivale a decisiones para Jorge."
        : "Commercial exceptions live in the Attention section. Global pending work is not the count of decisions for Jorge.",
    },
    {
      key: "continue",
      title: es ? "Continuar o cerrar" : "Continue or close",
      state: finished ? "done" : activePiece === "continue" ? "current" : "waiting",
      summary: finished
        ? es ? "Ventana concluida" : "Window complete"
        : running ? es ? "La ventana sigue abierta" : "Window remains open"
        : es ? "En espera de otra ventana" : "Awaiting another window",
      detail: `${waiting}${health?.pendingWorkCount != null ? ` · ${es ? "Trabajo pendiente" : "Pending work"}: ${health.pendingWorkCount}` : ""}`,
    },
  ]
}

function remainingTime(session: Session | undefined, now: number, es: boolean) {
  if (!session || session.operational_status !== "ACTIVE") return null
  const end = Date.parse(session.window_closes_at)
  if (!Number.isFinite(end)) return null
  const minutes = Math.max(0, Math.ceil((end - now) / 60_000))
  return es ? `${minutes} min restantes` : `${minutes} min remaining`
}

function currentPhase(session: Session, es: boolean) {
  const phases: Record<string, [string,string]> = {
    ALLOCATOR_REASONING: ["Panky compara el siguiente trabajo permitido.", "Panky is comparing the next permitted work."],
    WAITING_FOR_MODEL: ["Panky prepara la siguiente decisión.", "Panky is preparing the next decision."],
    SOURCE_EXECUTION: ["El Engine investiga una fuente.", "The Engine is researching a source."],
    EVIDENCE_EVALUATION: ["Panky revisa la evidencia.", "Panky is reviewing the evidence."],
    CANDIDATE_ACCOUNT_UPDATE: ["El Engine actualiza el expediente.", "The Engine is updating the record."],
    CLOSING_SESSION: ["El Engine prepara el cierre de la ventana.", "The Engine is preparing to close the window."],
  }
  const value = phases[session.activity_phase ?? ""]
  return value ? value[es ? 0 : 1] : es ? "El Engine aún no publica una unidad concreta." : "The Engine has not published a specific unit yet."
}

export function ExecutiveSystemStatus({
  locale,
  health,
  csrf,
  onAttention,
}: {
  locale: Locale
  health: Health | null
  csrf: string
  onAttention: () => void
}) {
  const es = locale === "es"
  const [data, setData] = useState<DiscoveryTruth | null>(null)
  const [error, setError] = useState(false)
  const [now, setNow] = useState(() => Date.now())
  const [openPiece, setOpenPiece] = useState<string | null>(null)
  const [direction, setDirection] = useState<Direction>(null)
  const [priority, setPriority] = useState<Priority>("AUTO")
  const [maxMinutes, setMaxMinutes] = useState(15)
  const [order, setOrder] = useState(defaultOrder)
  const [dragged, setDragged] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [companies, setCompanies] = useState<{id:string;name:string}[]>([])
  const [focusCompanyId, setFocusCompanyId] = useState("")
  const [companySearch, setCompanySearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const synced = useRef("")
  useEffect(() => {
    let active = true
    readDiscovery()
      .then((value) => { if (active) setData(value) })
      .catch(() => { if (active) setError(true) })
    const tick = setInterval(() => {
      setNow(Date.now())
      readDiscovery().then((value) => { if (active) setData(value) }).catch(() => { if (active) setError(true) })
    }, 30_000)
    return () => { active = false; clearInterval(tick) }
  }, [])
  const session = data?.routineOperatingSessions?.[0]
  const pieces = data ? executiveFlowPieces(session, health, locale) : []
  const remaining = remainingTime(session, now, es)
  const active = session?.operational_status === "ACTIVE"
  useEffect(() => {
    if (!session?.id) return
    if (!synced.current.startsWith(`${session.id}:`)) {
      synced.current = `${session.id}:0`
      setDirection(null); setPriority("AUTO"); setMaxMinutes(15); setOrder(defaultOrder)
      setFocusCompanyId(""); setReason("")
    }
    let alive = true
    const refresh = () => acquisitionApi.routineSupervision(session.id)
      .then(({direction: value}) => {
        if (!alive) return
        setDirection(value)
        if (value && synced.current !== `${session.id}:${value.version}`) {
          synced.current = `${session.id}:${value.version}`
          setPriority(value.priority_block)
          setMaxMinutes(value.max_unit_minutes)
          if (value.display_order.length === 6) setOrder(value.display_order)
          setReason(value.reason)
          setFocusCompanyId(value.focus_company_id ?? "")
        }
      })
      .catch(() => { if (alive) setMessage(es ? "No se pudo verificar la prioridad." : "Priority could not be verified.") })
    void refresh()
    const timer = setInterval(refresh, 15_000)
    return () => { alive = false; clearInterval(timer) }
  }, [session?.id, es])
  useEffect(() => {
    if (!session?.cycle_id || !active) return
    let alive = true
    acquisitionApi.explorationMap(session.cycle_id).then((map) => {
      if (alive) setCompanies((map.companyProfiles ?? []).map((profile) => ({id:profile.companyId,name:profile.displayName})))
    }).catch(() => {})
    return () => { alive = false }
  }, [session?.cycle_id, active])
  const ordered = order.map((key) => pieces.find((piece) => piece.key === key)).filter((piece): piece is FlowPiece => Boolean(piece))
  const draftChanged = active && (direction
    ? priority !== direction.priority_block || maxMinutes !== direction.max_unit_minutes
      || focusCompanyId !== (direction.focus_company_id ?? "") || reason.trim() !== direction.reason
      || order.some((key, index) => key !== direction.display_order[index])
    : priority !== "AUTO" || maxMinutes !== 15 || focusCompanyId !== "" || reason.trim() !== ""
      || order.some((key, index) => key !== defaultOrder[index]))
  const save = async () => {
    if (!session || !active || saving || reason.trim().length < 20) return
    setSaving(true); setMessage("")
    try {
      const result = await acquisitionApi.setRoutineSupervision(`c6-${crypto.randomUUID()}`, {
        sessionId: session.id, cycleId: session.cycle_id, expectedVersion: direction?.version ?? 0,
        priorityBlock: priority, maxUnitMinutes: maxMinutes, displayOrder: order, reason: reason.trim(),
        ...(focusCompanyId && priority !== "DISCOVERY" ? {focusCompanyId} : {}),
      }, csrf)
      const fresh = await acquisitionApi.routineSupervision(session.id)
      setDirection(fresh.direction)
      synced.current = `${session.id}:${result.version}`
      setMessage(es ? `Prioridad aceptada, versión ${result.version}. El Engine la aplicará al terminar la unidad actual.`
        : `Priority accepted, version ${result.version}. The Engine will apply it after the current unit.`)
    } catch {
      setMessage(es ? "No se pudo confirmar el cambio. Actualiza la sesión antes de intentarlo de nuevo."
        : "The change could not be confirmed. Refresh the session before trying again.")
    } finally { setSaving(false) }
  }
  return (
    <section className="acq-executive" aria-labelledby="acq-executive-title">
      <div className="acq-executive-head">
        <div>
          <p className="acq-eyebrow">{es ? "Centro de control" : "Control center"}</p>
          <h2 id="acq-executive-title">{es ? "La ventana, de un vistazo" : "The window at a glance"}</h2>
          <p className="acq-muted">
            {es
              ? "Seis bloques resumen el trabajo. Abre uno para ver su evidencia y límites."
              : "Six blocks summarize the work. Open one for its evidence and limits."}
          </p>
        </div>
        <div className="acq-executive-session" role="status">
          <span className={`acq-executive-state ${active ? "is-active" : ""}`}>
            {active ? es ? "En curso" : "In progress" : session?.operational_status === "INTERRUPTED" ? es ? "Interrumpida" : "Interrupted" : session ? es ? "Sin sesión activa" : "No active session" : es ? "Sin sesión publicada" : "No published session"}
          </span>
          <strong>{remaining ?? (es ? "Ventana de hasta 2 horas" : "Up to 2-hour window")}</strong>
        </div>
      </div>
      {error && <p role="alert">{es ? "No se pudo verificar la actividad del Engine. No se infiere que esté trabajando." : "Engine activity could not be verified. Running status is not assumed."}</p>}
      {!data && !error && <p role="status">{es ? "Consultando la sesión…" : "Loading session…"}</p>}
      <div className="acq-executive-flow" aria-label={es ? "Flujo de la ventana" : "Window flow"}>
        {ordered.map((piece, index) => (
          <div className="acq-executive-step" key={piece.key} draggable={active}
            onDragStart={() => setDragged(piece.key)} onDragEnd={() => setDragged(null)}
            onDragOver={(event) => { if (active) event.preventDefault() }}
            onDrop={(event) => { event.preventDefault(); if (dragged) setOrder(moveExecutivePiece(order, dragged, piece.key)); setDragged(null) }}>
            <button
              type="button"
              className={`acq-executive-piece is-${piece.state}`}
              aria-expanded={openPiece === piece.key}
              aria-controls={openPiece === piece.key ? "acq-executive-detail" : undefined}
              onClick={() => setOpenPiece(openPiece === piece.key ? null : piece.key)}
              title={piece.detail}
            >
              <span className="acq-executive-number">{String(index + 1).padStart(2, "0")}</span>
              <strong>{piece.title}</strong>
              <span>{piece.summary}</span>
            </button>
            {index < ordered.length - 1 && <span className="acq-executive-connector" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>
      {openPiece && (
        <div id="acq-executive-detail" className="acq-executive-detail">
          <p className="acq-eyebrow">{es ? "Detalle del bloque" : "Block detail"}</p>
          <h3>{pieces.find((piece) => piece.key === openPiece)?.title}</h3>
          <p>{pieces.find((piece) => piece.key === openPiece)?.detail}</p>
          {active && <div className="acq-executive-reorder">
            <button type="button" disabled={order.indexOf(openPiece) === 0} onClick={() => setOrder(moveExecutivePiece(order, openPiece, order[order.indexOf(openPiece)-1]!))}>
              {es ? "Mover antes" : "Move earlier"}
            </button>
            <button type="button" disabled={order.indexOf(openPiece) === order.length-1} onClick={() => setOrder(moveExecutivePiece(order, order[order.indexOf(openPiece)+1]!, openPiece))}>
              {es ? "Mover después" : "Move later"}
            </button>
          </div>}
          {openPiece === "attention" && <button type="button" onClick={onAttention}>{es ? "Abrir Necesita tu atención" : "Open Attention"}</button>}
        </div>
      )}
      <div className="acq-executive-editor">
        <div>
          <p className="acq-eyebrow">{es ? "Dirección de esta ventana" : "Direction for this window"}</p>
          <h3>{direction ? priorityLabels[direction.priority_block] : es ? "Panky prioriza con la información actual" : "Panky prioritizes with current information"}</h3>
          <p className="acq-muted">{direction
            ? direction.applied_at ? es ? "Aplicada por el Engine en un límite de unidad." : "Applied by the Engine at a unit boundary."
              : es ? "Aceptada; espera el siguiente límite de unidad." : "Accepted; waiting for the next unit boundary."
            : es ? "Todavía no hay una prioridad humana registrada para esta sesión." : "No human priority has been recorded for this session."}</p>
          {direction && <p className="acq-executive-why"><strong>{es ? "Por qué:" : "Why:"}</strong> {direction.reason}</p>}
          {active && <p className="acq-executive-now"><strong>{es ? "Ahora:" : "Now:"}</strong> {currentPhase(session, es)}</p>}
          {draftChanged && <p className="acq-executive-draft" role="status">{es
            ? "Borrador sin confirmar · la orden vigente no cambia hasta que confirmes."
            : "Unconfirmed draft · the current direction does not change until you confirm."}</p>}
        </div>
        {active && <div className="acq-executive-controls">
          <label>{es ? "Qué priorizar" : "Priority"}<select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
            {Object.entries(priorityLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label>{es ? "Máximo por unidad" : "Maximum per unit"}<select value={maxMinutes} onChange={(event) => setMaxMinutes(Number(event.target.value))}>
            {[5,10,15,20,30].map((value) => <option key={value} value={value}>{value} min</option>)}
          </select></label>
          <label className="acq-executive-reason">{es ? "Por qué cambiar el foco" : "Reason for changing focus"}
            <textarea value={reason} maxLength={1000} onChange={(event) => setReason(event.target.value)}
              placeholder={es ? "Explica qué decisión esperas facilitar dentro de esta ventana." : "Explain which decision this window should help resolve."} />
          </label>
          {priority !== "DISCOVERY" && <details className="acq-executive-company">
            <summary>{es ? "Acotar a una empresa (opcional)" : "Focus on a company (optional)"}</summary>
            <label>{es ? "Buscar empresa" : "Find company"}
              <input value={companySearch} onChange={(event) => setCompanySearch(event.target.value)}
                placeholder={es ? "Nombre de empresa" : "Company name"} />
            </label>
            <label>{es ? "Empresa" : "Company"}
              <select value={focusCompanyId} onChange={(event) => setFocusCompanyId(event.target.value)}>
                <option value="">{es ? "Sin empresa fija" : "No fixed company"}</option>
                {companies.filter((company) => company.id === focusCompanyId || company.name.toLocaleLowerCase().includes(companySearch.toLocaleLowerCase()))
                  .slice(0,30).map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </label>
          </details>}
          <button type="button" disabled={saving || reason.trim().length < 20} onClick={save}>
            {saving ? es ? "Confirmando…" : "Confirming…" : es ? "Confirmar dirección" : "Confirm direction"}
          </button>
        </div>}
      </div>
      <p role="status" aria-live="polite">{message}</p>
      <p className="acq-executive-boundary">{es
        ? "Arrastra los bloques para ordenar la vista. La prioridad solo cambia al confirmarla. Panky decide cada unidad y el Engine valida permisos, tiempo y evidencia. Sin contacto externo."
        : "Drag blocks to arrange the view. Priority changes only when confirmed. Panky chooses each unit and the Engine validates authority, time and evidence. No external contact."}</p>
    </section>
  )
}
