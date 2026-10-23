"use client"

import { useEffect, useRef, useState } from "react"
import { acquisitionApi } from "@/lib/acquisition-api"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
import "./c6-preview.css"

type WorkKey = "discover" | "investigate" | "review" | "fit" | "select" | "resolve" | "contact"
type WorkCard = { key: WorkKey; title: string; short: string; detail: string; metric: string }
const cards: WorkCard[] = [
  { key: "discover", title: "Descubrir empresas", short: "Ampliar el mapa con candidatas nuevas", detail: "Buscar empresas atribuibles al eslabón elegido. Cada hallazgo sigue siendo una candidata hasta revisar sus fuentes.", metric: "Nuevas candidatas" },
  { key: "investigate", title: "Investigar", short: "Completar datos que faltan", detail: "Consultar fuentes pertinentes para un dato concreto de una candidata. Una lectura no llena la ficha por sí sola.", metric: "Investigaciones" },
  { key: "review", title: "Revisar evidencia", short: "Decidir qué fuentes sí sustentan hechos", detail: "Revisar recibos originales, atribución e incertidumbres antes de registrar un campo o cerrar una ruta.", metric: "Recibos por revisar" },
  { key: "fit", title: "Evaluar encaje", short: "Contrastar operación y capacidad Brunova", detail: "Formar una hipótesis comercial trazable para una empresa y un eslabón, distinguiendo hechos de supuestos.", metric: "Encajes por evaluar" },
  { key: "select", title: "Seleccionar oportunidades", short: "Tomar una decisión comercial", detail: "Revisar tesis, canal verificable y restricciones antes de seleccionar, seguir evaluando o pedir atención.", metric: "Decisiones" },
  { key: "resolve", title: "Resolver pendientes", short: "Atender bloqueos que impiden avanzar", detail: "Priorizar las excepciones con una acción concreta para Jorge o Panky. No autoriza contacto externo.", metric: "Pendientes" },
  { key: "contact", title: "Preparar contacto", short: "Elegir el mejor medio y adaptar el mensaje", detail: "Panky revisa los medios con fuente de empresas priorizadas, elige uno para preparar un mensaje apropiado y deja la decisión trazable. Esta prioridad no envía mensajes ni cambia HubSpot.", metric: "Mensajes por preparar" },
]
const initial = cards.map((card) => card.key)
type Parameter = { id: string; label: string; hint: string; choices?: { value: string; label: string }[]; placeholder?: string }
const parameters: Record<WorkKey, Parameter[]> = {
  discover: [
    { id: "scope", label: "Amplitud de búsqueda", hint: "Define cuántas ramas del mapa considera primero; nunca amplía la política autorizada del ciclo.", choices: [{ value: "focused", label: "Una especialidad del mapa" }, { value: "broad", label: "Varias especialidades del ciclo" }] },
    { id: "candidateLimit", label: "Candidatas nuevas por unidad", hint: "Tope de candidatas a revisar en una unidad. No obliga a registrar hallazgos sin fuente.", choices: [1, 3, 5].map((n) => ({ value: String(n), label: `${n} ${n === 1 ? "candidata" : "candidatas"}` })) },
  ],
  investigate: [
    { id: "source", label: "Vía preferida", hint: "Orienta la primera fuente que se intentará. Panky debe revisar pertinencia y límites antes de encargarla.", choices: [{ value: "auto", label: "La mejor fuente disponible" }, { value: "company", label: "Sitio de la empresa" }, { value: "web", label: "Web First" }, { value: "job", label: "Vacantes" }, { value: "social", label: "Redes sociales" }] },
    { id: "company", label: "Empresa de foco (opcional)", hint: "Acota la investigación a una candidata existente. No crea ni fusiona identidades.", placeholder: "Sin empresa fija" },
  ],
  review: [
    { id: "receipts", label: "Qué revisar primero", hint: "Ordena los recibos que esperan juicio; una lectura sola nunca acredita un dato.", choices: [{ value: "unreviewed", label: "Fuentes pendientes" }, { value: "conflicts", label: "Conflictos entre fuentes" }, { value: "attribution", label: "Fuentes sin atribución clara" }] },
    { id: "company", label: "Empresa de foco (opcional)", hint: "Muestra primero los recibos de esta candidata, si existe en el ciclo.", placeholder: "Sin empresa fija" },
  ],
  fit: [
    { id: "lens", label: "Perspectiva inicial", hint: "Cambia el punto de partida de la evaluación, pero la tesis sigue necesitando fuentes y dudas explícitas.", choices: [{ value: "value", label: "Valor potencial para la empresa" }, { value: "capability", label: "Capacidad comprobada de Brunova" }, { value: "uncertainty", label: "Incertidumbre que cambia la decisión" }] },
    { id: "company", label: "Empresa de foco (opcional)", hint: "Prioriza el encaje de una empresa que ya llegó a esta etapa.", placeholder: "Sin empresa fija" },
  ],
  select: [
    { id: "gate", label: "Qué comprobar primero", hint: "Ordena la revisión comercial; no decide por anticipado si la oportunidad será seleccionada.", choices: [{ value: "contact", label: "Canal de contacto verificable" }, { value: "thesis", label: "Solidez de la tesis comercial" }, { value: "restrictions", label: "Restricciones y relación previa" }] },
    { id: "company", label: "Oportunidad de foco (opcional)", hint: "Acota la revisión a una oportunidad existente; no inicia contacto.", placeholder: "Sin oportunidad fija" },
  ],
  resolve: [
    { id: "blocker", label: "Tipo de bloqueo", hint: "Filtra la cola de atención por motivo, sin cerrar ni resolver automáticamente ninguna ficha.", choices: [{ value: "all", label: "El más urgente" }, { value: "contact", label: "Falta de contacto" }, { value: "identity", label: "Identidad incierta" }, { value: "evidence", label: "Conflicto de evidencia" }, { value: "relationship", label: "Relación previa" }] },
    { id: "owner", label: "Quién puede resolverlo", hint: "Prioriza acciones disponibles para ese responsable; no transfiere permisos ni autoriza contacto.", choices: [{ value: "either", label: "Jorge o Panky" }, { value: "jorge", label: "Jorge" }, { value: "panky", label: "Panky" }] },
  ],
  contact: [
    { id: "channel", label: "Medio inicial", hint: "Orienta qué medio considerar primero. Panky debe elegir el mejor disponible y no puede usar un adaptador no autorizado.", choices: [{ value: "best", label: "El mejor medio disponible" }, { value: "email", label: "Correo" }, { value: "whatsapp", label: "WhatsApp" }, { value: "social", label: "Red social" }] },
    { id: "company", label: "Empresa de foco (opcional)", hint: "Acota la preparación a una empresa priorizada. No autoriza envío ni cambia su etapa.", placeholder: "Sin empresa fija" },
  ],
}
type Draft = { order: WorkKey[]; settings: Partial<Record<WorkKey, Record<string, string>>> }
const normalizePlan = (value: Draft): Draft | null => {
  if (!Array.isArray(value.order) || !value.order.every((key) => initial.includes(key)) || new Set(value.order).size !== value.order.length) return null
  if (value.order.length !== initial.length && !(value.order.length === initial.length - 1 && !value.order.includes("contact"))) return null
  return { order: [...value.order, ...initial.filter((key) => !value.order.includes(key))], settings: value.settings ?? {} }
}
const draftKey = "brunova-c6-local-draft-v2"
const hasActiveDraft = (draft: Draft, baseline: Draft) => draft.order.some((key, index) => key !== baseline.order[index]) || cards.some((card) =>
  parameters[card.key].some((parameter) => {
    const value = draft.settings[card.key]?.[parameter.id]?.trim()
    const published = baseline.settings[card.key]?.[parameter.id]?.trim()
    return (value || parameter.choices?.[0]?.value || "") !== (published || parameter.choices?.[0]?.value || "")
  }),
)

export function C6Preview({cycleId,csrf}: {cycleId?:string;csrf?:string}) {
  const [draft, setDraft] = useState<Draft>({ order: initial, settings: {} })
  const [baseline, setBaseline] = useState<Draft>({ order: initial, settings: {} })
  const [publishedVersion, setPublishedVersion] = useState(0)
  const [remoteReady, setRemoteReady] = useState(false)
  const [publishState, setPublishState] = useState<"idle"|"saving"|"error"|"published">("idle")
  const [sessionState, setSessionState] = useState<{status:string;phase:string|null;closesAt:string|null;detail:string|null}|null>(null)
  const [hydrated, setHydrated] = useState(false)
  const [selected, setSelected] = useState<WorkKey | null>(null)
  const [publishReview, setPublishReview] = useState(false)
  const [resetReview, setResetReview] = useState(false)
  const [dragging, setDragging] = useState<WorkKey | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle")
  const [undoStack, setUndoStack] = useState<Draft[]>([])
  const editingField = useRef<string | null>(null)
  const saveReady = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const publishDialog = useRef<HTMLDialogElement>(null)
  const resetDialog = useRef<HTMLDialogElement>(null)
  const storageKey = cycleId ? `${draftKey}:${cycleId}` : draftKey
  useEffect(() => {
    let alive = true
    const load = async () => {
      let local: Draft | null = null
      try {
        const value = window.localStorage.getItem(storageKey)
        if (value) {
          const parsed = JSON.parse(value) as Draft
          local = normalizePlan(parsed)
        }
      } catch { /* Keep the editor usable without browser storage. */ }
      let published: Draft = {order:initial,settings:{}}
      let version = 0
      if (cycleId) {
        try {
          const result = await acquisitionApi.nextWindowPlan(cycleId)
          if (result.plan) {
            const plan = result.plan.plan as Draft
            published = normalizePlan(plan) ?? published
            version = result.plan.version
          }
          if (alive) setRemoteReady(true)
        } catch { if (alive) setPublishState("error") }
      }
      if (!alive) return
      setBaseline(published); setPublishedVersion(version); setDraft(local ?? published); setHydrated(true)
    }
    void load()
    return () => { alive = false }
  }, [cycleId,storageKey])
  useEffect(() => {
    if (!cycleId) return
    let alive = true
    const refresh = () => readDiscovery().then((value) => {
      if (!alive) return
      const session = value.routineOperatingSessions?.find((entry) => entry.cycle_id === cycleId)
      setSessionState(session ? {status:session.operational_status,phase:session.activity_phase ?? null,
        closesAt:session.window_closes_at ?? null,detail:session.activity_detail ?? null} : null)
    }).catch(() => {})
    void refresh()
    const timer = setInterval(refresh,30_000)
    return () => { alive = false; clearInterval(timer) }
  }, [cycleId])
  useEffect(() => {
    if (!hydrated) return
    if (!saveReady.current) { saveReady.current = true; return }
    if (saveTimer.current) clearTimeout(saveTimer.current)
    try {
      if (hasActiveDraft(draft,baseline)) {
        window.localStorage.setItem(storageKey, JSON.stringify(draft))
        queueMicrotask(() => setSaveState("saved"))
        saveTimer.current = setTimeout(() => setSaveState("idle"), 3000)
      } else {
        window.localStorage.removeItem(storageKey)
        queueMicrotask(() => setSaveState("idle"))
      }
    } catch { queueMicrotask(() => setSaveState("error")) }
  }, [draft, baseline, hydrated, storageKey])
  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current) }, [])
  useEffect(() => { if (selected) dialog.current?.showModal(); else dialog.current?.close() }, [selected])
  useEffect(() => { if (publishReview) publishDialog.current?.showModal(); else publishDialog.current?.close() }, [publishReview])
  useEffect(() => { if (resetReview) resetDialog.current?.showModal(); else resetDialog.current?.close() }, [resetReview])
  const card = cards.find((item) => item.key === selected)
  const pushUndo = (previous: Draft) => setUndoStack((stack) => [...stack.slice(-19), previous])
  const reorder = (moving: WorkKey, before: WorkKey) => {
    if (moving === before) return
    const order = draft.order.filter((key) => key !== moving)
    order.splice(order.indexOf(before), 0, moving)
    editingField.current = null
    pushUndo(draft)
    setDraft({ ...draft, order })
  }
  const setParameter = (key: WorkKey, id: string, value: string, groupInput = false) => {
    const parameter = parameters[key].find((entry) => entry.id === id)
    const previousValue = draft.settings[key]?.[id] ?? parameter?.choices?.[0]?.value ?? ""
    if (previousValue === value) return
    const field = `${key}:${id}`
    if (!groupInput || editingField.current !== field) pushUndo(draft)
    editingField.current = groupInput ? field : null
    setDraft({ ...draft, settings: { ...draft.settings, [key]: { ...draft.settings[key], [id]: value } } })
  }
  const undo = () => {
    if (!hasActiveDraft(draft,baseline)) return
    const previous = undoStack.at(-1)
    if (!previous) return
    editingField.current = null
    setUndoStack((stack) => stack.slice(0, -1))
    setDraft(previous)
  }
  const resetDraft = () => {
    editingField.current = null
    setUndoStack([])
    setDraft(baseline)
    setResetReview(false)
  }
  const publish = async () => {
    if (!cycleId || !csrf || !remoteReady || publishState === "saving") return
    setPublishState("saving")
    try {
      const result = await acquisitionApi.publishNextWindowPlan(`c6-${crypto.randomUUID()}`,
        {cycleId,expectedVersion:publishedVersion,plan:{order:draft.order,settings:draft.settings as Record<string,Record<string,string>>}},csrf)
      const readback = await acquisitionApi.nextWindowPlan(cycleId)
      if (readback.plan?.version !== result.version) throw new Error("next_window_plan_readback_failed")
      setPublishedVersion(result.version); setBaseline(draft); setUndoStack([]); setPublishState("published"); setPublishReview(false)
    } catch { setPublishState("error") }
  }
  const changed = hasActiveDraft(draft,baseline)
  const activeWindow = sessionState?.status === "ACTIVE"
  return <section className="c6-preview">
    <header className="c6-preview-header">
      <div><span className="c6-kicker">BRUNOVA / ADQUISICIÓN / ESTADO DEL SISTEMA</span>
        <h1>Dirige la siguiente ventana</h1>
        <p>Ordena el trabajo que quieres priorizar. La primera pieza tiene preferencia; Panky decide cada unidad dentro de los límites del Engine.</p></div>
      <div className="c6-window" tabIndex={0} aria-label={activeWindow ? "Ventana activa; hasta dos horas" : "Sin sesión activa; próxima ventana hasta dos horas"}><span className="c6-led" /> {cycleId ? activeWindow ? "Ventana activa · 2 h máximo" : "Sin sesión activa · próxima hasta 2 h" : "Ventana · 2 h máximo"} <span aria-hidden>ⓘ</span><span className="c6-window-tooltip" role="tooltip">{cycleId ? "El plan publicado se toma al abrir la siguiente ventana; una edición posterior no altera una sesión en curso." : "Esta vista local todavía no muestra el estado en vivo. Cada ventana del Engine dura hasta dos horas o termina al cancelarla."}</span></div>
    </header>
    {hydrated && changed && <div className="c6-preview-label">Borrador local sin publicar</div>}
    {cycleId && publishState === "error" && <p className="c6-publish-error" role="alert">No se pudo verificar o publicar el plan. El Engine conserva la versión anterior; actualiza la página antes de reintentar.</p>}
    {cycleId && publishState === "published" && !changed && <p className="c6-publish-ok" role="status">Plan publicado para la siguiente ventana.</p>}
    <section className="c6-board" aria-label="Orden de prioridades">
      <div className="c6-board-head"><div><span className="c6-kicker">PLAN DE TRABAJO</span><h2>Primero, lo que más importa</h2></div><span>Arrastra para cambiar el orden</span></div>
      <div className="c6-cards">
        {draft.order.map((key, index) => {
          const item = cards.find((entry) => entry.key === key)!
          return <div className={`c6-card-wrap ${dragging === key ? "is-dragging" : ""}`} key={key} draggable
            onDragStart={() => setDragging(key)} onDragEnd={() => setDragging(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); if (dragging) reorder(dragging, key); setDragging(null) }}>
            <button className="c6-card" type="button" onClick={() => setSelected(key)}
              aria-label={`Prioridad ${index + 1}: ${item.title}. ${item.short}. Abrir detalles`}>
              <span className="c6-rank">{String(index + 1).padStart(2, "0")} <span>PRIORIDAD</span></span>
              <strong>{item.title}</strong>
              <span className="c6-short">{item.short}</span>
              <span className="c6-card-arrow" aria-hidden>↗</span>
            </button>
          </div>
        })}
      </div>
      <div className="c6-board-actions"><div className="c6-board-feedback"><div className="c6-save-status" aria-live="polite">{saveState === "saved" ? <span className="c6-saved">✓ Borrador guardado</span> : <span className={`c6-save-help ${saveState === "error" ? "is-error" : ""}`} tabIndex={0} aria-label={saveState === "error" ? "No se pudo guardar el borrador" : "Estado del borrador"}>{saveState === "error" ? "!" : "ⓘ"}<span className="c6-help-popover" role="tooltip">{saveState === "error" ? "No se pudo guardar en este navegador. Tus cambios podrían perderse al recargar." : cycleId ? "Los cambios se guardan aquí hasta que publiques el plan para otra ventana." : "Los cambios se guardan aquí. Publicar aún no está conectado al Engine."}</span></span>}</div>{changed && <button className="c6-undo" type="button" onClick={undoStack.length ? undo : () => setResetReview(true)} aria-label={undoStack.length ? "Deshacer último cambio" : "Restablecer borrador"}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{undoStack.length ? <><path d="m9 14-5-5 5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></> : <><path d="M3 12a9 9 0 1 0 2.6-6.4" /><path d="M3 4v5h5" /></>}</svg><span className="c6-help-popover" role="tooltip">{undoStack.length ? "Deshacer último cambio" : "Restablecer borrador"}</span></button>}</div><button type="button" disabled={Boolean(cycleId && (!remoteReady || (!changed && publishedVersion > 0)))} onClick={() => setPublishReview(true)}>Publicar</button></div>
    </section>
    <section className="c6-rail"><div><span className="c6-kicker">SUPERVISIÓN</span><h2>Qué ocurre en la ventana</h2><p>{cycleId ? activeWindow ? sessionState?.detail || "Sesión activa; todavía no se informa una unidad concreta." : "Sin sesión activa. El plan publicado espera la siguiente ventana." : "Estado, tiempo restante, resultados y decisiones que requieren a Jorge aparecerán aquí cuando haya una sesión."}</p></div><div><span className="c6-kicker">CONTROL</span><h2>Seguridad de la ejecución</h2><p>Máximo dos horas o cancelación manual. Cada envío o cambio en CRM exige un permiso exacto.</p></div></section>
    <dialog ref={dialog} className="c6-dialog" onClose={() => setSelected(null)} aria-label={card?.title ?? "Detalle de prioridad"}>
      {card && <><div className="c6-dialog-head"><div><span className="c6-kicker">CONFIGURAR PRIORIDAD</span><h2>{card.title}</h2></div><button type="button" onClick={() => setSelected(null)} aria-label="Cerrar detalle">×</button></div>
        <p className="c6-dialog-intro">{card.detail}</p>
        <div className="c6-dialog-signal"><span>{card.metric}</span><strong>Preferencia para la siguiente ventana</strong></div>
        <div className="c6-dialog-fields">{parameters[card.key].map((parameter) => <div className="c6-field" key={parameter.id}>
          <div className="c6-field-heading"><label htmlFor={`c6-${card.key}-${parameter.id}`}>{parameter.label}</label><span className="c6-field-help" tabIndex={0} aria-label={parameter.hint}>ⓘ<span role="tooltip">{parameter.hint}</span></span></div>
          {parameter.choices ? <select id={`c6-${card.key}-${parameter.id}`} value={draft.settings[card.key]?.[parameter.id] ?? parameter.choices[0]!.value}
            onChange={(event) => setParameter(card.key, parameter.id, event.target.value)}>
            {parameter.choices.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select> : <input id={`c6-${card.key}-${parameter.id}`} maxLength={160} value={draft.settings[card.key]?.[parameter.id] ?? ""}
            onChange={(event) => setParameter(card.key, parameter.id, event.target.value, true)} onBlur={() => { editingField.current = null }} placeholder={parameter.placeholder} />}
        </div>)}</div>
        <p className="c6-dialog-note">Los cambios de este bloque se conservan automáticamente en el borrador. Solo una publicación confirmada podrá afectar la siguiente ventana.</p>
        <div className="c6-dialog-actions"><button type="button" onClick={() => setSelected(null)}>Volver al tablero</button></div>
      </>}
    </dialog>
    <dialog ref={publishDialog} onClose={() => setPublishReview(false)} className="c6-dialog c6-publish-dialog" aria-label="Revisar publicación">
      <div className="c6-dialog-head"><div><span className="c6-kicker">PUBLICACIÓN</span><h2>Plan para la próxima ventana</h2></div><button type="button" onClick={() => setPublishReview(false)} aria-label="Cerrar revisión">×</button></div>
      <p className="c6-dialog-intro">El orden guardado empezará por <strong>{cards.find((item) => item.key === draft.order[0])?.title}</strong>. Cada pieza conserva sus propios parámetros.</p>
      <ol className="c6-publish-order">{draft.order.map((key) => <li key={key}>{cards.find((item) => item.key === key)?.title}</li>)}</ol>
      <p className="c6-dialog-note">{cycleId ? "Al confirmar, el Engine tomará esta versión al abrir la siguiente ventana. No cambiará una sesión activa ni autorizará contacto externo." : "La publicación real está deshabilitada en esta vista previa. El borrador no afecta producción."}</p>
      <div className="c6-dialog-actions"><button type="button" onClick={() => setPublishReview(false)}>Seguir editando</button><button type="button" disabled={!cycleId || !csrf || !remoteReady || publishState === "saving"} onClick={() => { void publish() }}>{publishState === "saving" ? "Publicando…" : "Publicar para la próxima ventana"}</button></div>
    </dialog>
    <dialog ref={resetDialog} onClose={() => setResetReview(false)} className="c6-dialog c6-reset-dialog" aria-label="Restablecer borrador">
      <div className="c6-dialog-head"><div><span className="c6-kicker">BORRADOR LOCAL</span><h2>Restablecer plan</h2></div><button type="button" onClick={() => setResetReview(false)} aria-label="Cerrar confirmación">×</button></div>
      <p className="c6-dialog-intro">Se descartarán el orden y los parámetros guardados en este navegador para volver al {cycleId ? "último plan publicado" : "plan inicial"}. El Engine no cambiará.</p>
      <div className="c6-dialog-actions"><button type="button" onClick={() => setResetReview(false)}>Conservar borrador</button><button type="button" onClick={resetDraft}>Restablecer borrador</button></div>
    </dialog>
  </section>
}
