"use client"

import { useEffect, useState } from "react"
import type { Locale } from "@/lib/i18n"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
import {
  candidateManagementTruth,
  type DiscoveryTruth,
} from "@/lib/acquisition-management-truth"
import { opportunityMemo } from "@/lib/acquisition-opportunity-intelligence"

/** Current outreach truth. Historical exploratory wave proposals are not live approvals. */
export function OutreachState({ locale }: { locale: Locale }) {
  const es = locale === "es"
  const [data, setData] = useState<DiscoveryTruth | null>(null)
  const [failed, setFailed] = useState(false)
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
          ? "No se pudo verificar el estado de contacto."
          : "Outreach state could not be verified."}
      </p>
    )
  if (!data) return <p>{es ? "Consultando contacto…" : "Loading outreach…"}</p>
  const candidates = candidateManagementTruth(data)
  const contacted = candidates.filter((c) => c.contacted)
  const proposed = candidates.filter(
    (c) =>
      !c.archived &&
      !c.contacted &&
      c.target &&
      opportunityMemo(c, locale).conversation?.worthHaving,
  )
  const current = data.routineOperatingSessions?.[0]
  return (
    <section
      className="acq-panel"
      aria-label={es ? "Gestión de contacto" : "Outreach management"}
    >
      <h2>{es ? "Contacto" : "Outreach"}</h2>
      <p>
        {es
          ? "Separa lo que podría proponerse, el contacto activo y el historial. Nada en esta vista autoriza un envío."
          : "Separates what could be proposed, active outreach, and history. Nothing in this view authorizes a send."}
      </p>
      <h3>{es ? "Listas / propuestas" : "Ready / proposed"}</h3>
      {!proposed.length && (
        <p className="acq-empty">
          {es
            ? "No hay organizaciones listas para proponer contacto. Investigación pendiente no equivale a autorización."
            : "No organizations are ready to propose for outreach. Pending research is not authorization."}
        </p>
      )}
      {proposed.map((candidate) => (
        <article
          className="acq-panel acq-conversation-brief"
          key={candidate.id}
        >
          <h4>{candidate.name}</h4>
          {(() => {
            const conversation = opportunityMemo(
              candidate,
              locale,
            ).conversation!
            return (
              <>
                <p>
                  <strong>
                    {es ? "Tesis de conversación" : "Conversation thesis"}:
                  </strong>{" "}
                  {conversation.thesis}
                </p>
                <p>
                  <strong>
                    {es ? "Pregunta de aprendizaje" : "Learning question"}:
                  </strong>{" "}
                  {conversation.learningQuestion}
                </p>
                <p>
                  <strong>{es ? "Por qué ahora" : "Why now"}:</strong>{" "}
                  {conversation.whyNow}
                </p>
                <p>
                  <strong>
                    {es ? "Responsable probable" : "Likely buyer"}:
                  </strong>{" "}
                  {conversation.buyer}
                </p>
                <p>
                  <strong>
                    {es ? "Preparación de contacto" : "Readiness"}:
                  </strong>{" "}
                  {conversation.readiness}
                </p>
                <p className="acq-record-next">
                  <span>
                    {es ? "Siguiente paso exacto" : "Exact next step"}
                  </span>
                  {conversation.nextStep}
                </p>
              </>
            )
          })()}
          <p>
            <strong>{es ? "Canal" : "Channel"}:</strong>{" "}
            {candidate.contactState ?? (es ? "sin resolver" : "unresolved")}
          </p>
          <p>
            <strong>{es ? "Autorización" : "Authorization"}:</strong>{" "}
            {es
              ? "requiere composición y aprobación exactas"
              : "exact composition and approval required"}
          </p>
          {candidate.target && (
            <details>
              <summary>
                {es
                  ? "Evidencia original de selección"
                  : "Original selection evidence"}
              </summary>
              <p>{candidate.target.why}</p>
              <p>
                <strong>
                  {es ? "Hipótesis original" : "Original hypothesis"}:
                </strong>{" "}
                {candidate.target.hypothesis}
              </p>
            </details>
          )}
        </article>
      ))}
      <h3>{es ? "Activas" : "Active"}</h3>
      {contacted.length === 0 && (
        <p>
          {es
            ? "No hay contactos exploratorios registrados."
            : "No exploratory contacts recorded."}
        </p>
      )}
      {contacted.map((c) => (
        <article className="acq-panel" key={c.id}>
          <h3>{c.name}</h3>
          {opportunityMemo(c, locale).conversation && (
            <p>
              <strong>{es ? "Tesis vigente" : "Current thesis"}:</strong>{" "}
              {opportunityMemo(c, locale).conversation!.thesis}
            </p>
          )}
          <p>
            {es
              ? "Conservada · Contactada · Esperando respuesta"
              : "Retained · Contacted · Waiting for reply"}
          </p>
          <p>
            {es
              ? "Un mensaje enviado · seguimiento:"
              : "One message sent · follow-up:"}{" "}
            <strong>
              {c.followUpAuthority === "NONE"
                ? es
                  ? "no autorizado"
                  : "not authorized"
                : c.followUpAuthority
                  ? es
                    ? "Sólo con autorización exacta"
                    : "Only with exact authorization"
                  : es
                    ? "Sin confirmar"
                    : "Unconfirmed"}
            </strong>
          </p>
          {c.nextReviewAt && (
            <p>
              <strong>
                {es ? "Elegible para revisión desde" : "Review eligible from"}:
              </strong>{" "}
              {new Intl.DateTimeFormat(es ? "es-MX" : "en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "America/Mexico_City",
              }).format(new Date(c.nextReviewAt))}{" "}
              {es
                ? "La fecha no autoriza otro envío."
                : "The date does not authorize another send."}
            </p>
          )}
          <details>
            <summary>
              {es
                ? "Contexto, mensaje y evidencia"
                : "Context, message and evidence"}
            </summary>
            {c.target?.hypothesis && (
              <p>
                <strong>
                  {es ? "Hipótesis original" : "Original hypothesis"}:
                </strong>{" "}
                {c.target.hypothesis}
              </p>
            )}
            {c.known && (
              <p>
                <strong>
                  {es ? "Evidencia original" : "Original evidence"}:
                </strong>{" "}
                {c.known}
              </p>
            )}
            <p>
              {es ? "Intentos técnicos" : "Technical attempts"}:{" "}
              {c.exactEffect?.logical_attempts ?? "—"}.{" "}
              {es
                ? "No equivalen a mensajes distintos."
                : "They are not distinct messages."}
            </p>
            {c.exactEffect?.subject && (
              <p>
                <strong>{es ? "Asunto" : "Subject"}:</strong>{" "}
                {c.exactEffect.subject}
              </p>
            )}
            <p>{c.exactEffect?.text}</p>
            <p>
              {es ? "Estado del efecto" : "Effect status"}:{" "}
              {c.exactEffect?.effect_status}
            </p>
          </details>
        </article>
      ))}
      <details>
        <summary>
          {es ? "Historial y detalle técnico" : "History and technical detail"}
        </summary>
        <p>
          {es ? "Última ventana" : "Latest window"}:{" "}
          {current
            ? `${String(current.local_date).slice(0, 10)} · ${current.status.replaceAll("_", " ")}`
            : es
              ? "sin ventana reciente"
              : "no recent window"}
        </p>
        <p>
          {es
            ? "Waves y propuestas anteriores se conservan como auditoría; no constituyen autoridad vigente."
            : "Prior waves and proposals remain audit history; they are not current authority."}
        </p>
      </details>
    </section>
  )
}
