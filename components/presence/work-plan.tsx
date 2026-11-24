"use client"

import { useState } from "react"
import type { Locale } from "@/lib/i18n"

export const workSteps = [
  { key: "RESEARCH", es: "Investigar", en: "Research", esDetail: "Buscar temas útiles y comprobar las fuentes.", enDetail: "Find useful topics and verify sources." },
  { key: "ADAPT", es: "Crear para cada red", en: "Create for each channel", esDetail: "Preparar textos y archivos propios para cada formato.", enDetail: "Prepare original copy and assets for each format." },
  { key: "REVIEW", es: "Revisar", en: "Review", esDetail: "Poner las piezas ante Natalia para que apruebe o pida cambios.", enDetail: "Put work before Natalia to approve or request changes." },
  { key: "PUBLISH", es: "Publicar", en: "Publish", esDetail: "Coordinar la publicación autorizada y guardar el enlace real.", enDetail: "Coordinate authorized publication and record its real link." },
  { key: "LEARN", es: "Aprender", en: "Learn", esDetail: "Observar resultados y conversaciones para decidir qué sigue.", enDetail: "Observe results and conversations to decide what follows." },
] as const
export type WorkStep = typeof workSteps[number]["key"]
export type WorkPlan = { version: number; order: WorkStep[]; updatedAt: string | null; actor: string | null }
const defaults = workSteps.map(step => step.key)

export function moveWorkStep(order: WorkStep[], moving: WorkStep, before: WorkStep) {
  if (moving === before || !order.includes(moving) || !order.includes(before)) return order
  const next = order.filter(key => key !== moving)
  next.splice(next.indexOf(before), 0, moving)
  return next
}

export function PresenceWorkPlan({ locale, plan, canManage, csrf, onSaved }: {
  locale: Locale; plan?: WorkPlan; canManage: boolean; csrf: string; onSaved: () => Promise<void>
}) {
  const es = locale === "es"
  const [order, setOrder] = useState<WorkStep[]>(plan?.order ?? defaults)
  const [dragged, setDragged] = useState<WorkStep | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const changed = order.some((key, index) => key !== (plan?.order ?? defaults)[index])
  async function publish() {
    if (!plan || !changed || saving) return
    setSaving(true); setMessage("")
    try {
      const response = await fetch("/api/presence/v1/work_plan", {
        method: "POST", headers: { "content-type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({ commandId: crypto.randomUUID(), expectedVersion: plan.version, order }),
      })
      if (!response.ok) throw Error(response.status === 400 || response.status === 409 ?
        (es ? "El plan cambió en otra ventana. Actualiza la página y vuelve a ordenarlo." : "The plan changed elsewhere. Refresh and reorder it.") :
        (es ? "No se pudo publicar el plan. Intenta de nuevo." : "Could not publish the plan. Please retry."))
      await onSaved()
      setMessage(es ? "Plan publicado para la siguiente corrida." : "Plan published for the next run.")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Error") }
    finally { setSaving(false) }
  }
  return <section className="presence__panel presence__panel--full presence__plan" aria-labelledby="presence-plan-title">
    <div className="presence__plan-heading"><div><p className="presence__eyebrow">{es ? "PLAN DE TRABAJO" : "WORK PLAN"}</p>
      <h2 id="presence-plan-title">{es ? "Decide qué va primero" : "Choose what comes first"}</h2>
      <p className="presence__muted">{es ? "Ordena las cinco prioridades. El Engine tomará este orden en la próxima corrida; Natalia conserva la revisión y la decisión de publicar." : "Reorder the five priorities. The Engine uses this order on its next run; Natalia keeps review and publication decisions."}</p></div>
      <span className="presence__plan-version">{plan?.version ? `${es ? "Versión" : "Version"} ${plan.version}` : es ? "Orden inicial" : "Initial order"}</span></div>
    <ol className="presence__steps presence__steps--editable">{order.map((key, index) => {
      const step = workSteps.find(item => item.key === key)!
      return <li key={key} draggable={canManage} onDragStart={() => setDragged(key)} onDragEnd={() => setDragged(null)}
        onDragOver={event => { if (canManage) event.preventDefault() }}
        onDrop={event => { event.preventDefault(); if (dragged) setOrder(moveWorkStep(order, dragged, key)); setDragged(null) }}>
        <span className="presence__step-number">{String(index + 1).padStart(2, "0")}</span>
        <strong>{es ? step.es : step.en}</strong><p>{es ? step.esDetail : step.enDetail}</p>
        {canManage && <div className="presence__step-controls">
          <button type="button" disabled={index === 0} onClick={() => setOrder(moveWorkStep(order, key, order[index - 1]!))} aria-label={`${es ? "Subir" : "Move up"} ${es ? step.es : step.en}`}>↑</button>
          <button type="button" disabled={index === order.length - 1} onClick={() => setOrder(moveWorkStep(order, order[index + 1]!, key))} aria-label={`${es ? "Bajar" : "Move down"} ${es ? step.es : step.en}`}>↓</button>
        </div>}</li>
    })}</ol>
    {canManage && <div className="presence__plan-footer"><p className="presence__muted">{es ? "Arrastra las tarjetas o usa las flechas. El orden se guarda al pulsar Publicar plan." : "Drag the cards or use the arrows. Save the order with Publish plan."}</p>
      <button type="button" onClick={() => void publish()} disabled={!changed || saving || !plan}>{saving ? es ? "Publicando…" : "Publishing…" : es ? "Publicar plan" : "Publish plan"}</button></div>}
    {message && <p role="status" className="presence__plan-message">{message}</p>}
  </section>
}
