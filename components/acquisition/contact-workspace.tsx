"use client"

import { useEffect, useMemo, useState } from "react"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"
import {
  contactRows,
  filterContactRows,
  type ContactPreparation,
  type ContactAttempt,
  type ContactReply,
  type ContactCrmOutcome,
  type ContactDecision,
  type ContactPhase,
} from "@/lib/acquisition-contact-view"
import type { Locale } from "@/lib/i18n"
import { ContactMethods } from "./contact-methods"
import { ContactCadenceControl } from "./contact-cadence-control"

type Map = Awaited<ReturnType<typeof acquisitionApi.explorationMap>>
type Cadence = Awaited<ReturnType<typeof acquisitionApi.candidateContactCadence>>["candidates"][number]

const phaseText: Record<ContactPhase, [string, string]> = {
  PRIORITIZED: ["Priorizada para contacto", "Prioritized for contact"],
  PREPARED: ["Mensaje preparado", "Message prepared"],
  AUTHORIZED_PENDING: ["Envío autorizado · pendiente", "Authorized send · pending"],
  OUTCOME_UNKNOWN: ["Resultado por conciliar", "Outcome needs reconciliation"],
  SEND_CONFIRMED: ["Envío confirmado", "Send confirmed"],
  ATTEMPT_FAILED: ["Intento fallido sin envío", "Attempt failed before send"],
  CONTACT_UNVERIFIED: ["Contacto registrado · recibo no disponible", "Contact recorded · receipt unavailable"],
  REPLY_UNINTERPRETED: ["Respuesta recibida · sin interpretar", "Reply received · uninterpreted"],
  REPLY_POSITIVE: ["Interés positivo · CRM pendiente", "Positive interest · CRM pending"],
  REPLY_NEGATIVE: ["Respuesta negativa · cierre por revisar", "Negative reply · review closure"],
  REPLY_OPT_OUT: ["No contactar · supresión pendiente", "Do not contact · suppression pending"],
  REPLY_BAD_TIMING: ["Otro momento · seguimiento por decidir", "Bad timing · follow-up pending"],
  REPLY_QUESTION: ["Pregunta recibida · respuesta pendiente", "Question received · response pending"],
  REPLY_UNCERTAIN: ["Respuesta ambigua · revisar", "Ambiguous reply · review"],
  RETURNED_TO_CONTACT: ["Retomar conversación", "Resume conversation"],
  CRM_CONFIRMED: ["Calificada en HubSpot", "Qualified in HubSpot"],
  CRM_UPDATED: ["Estado CRM actualizado", "CRM status updated"],
  CRM_UNCERTAIN: ["Resultado CRM por conciliar", "CRM outcome needs reconciliation"],
}
const decisionText: Record<
  Exclude<ContactDecision, "NONE">,
  [string, string]
> = {
  ADD_METHOD: ["Falta un medio atribuido", "Attributed method needed"],
  PREPARE_MESSAGE: ["Preparar acercamiento", "Prepare outreach"],
  REVIEW_PREPARATION: ["Revisar mensaje y medio", "Review message and channel"],
  REVIEW_ATTEMPT: ["Revisar intento", "Review attempt"],
  WAIT_FOR_RESPONSE: ["Esperar respuesta", "Await response"],
  RECONCILE_OUTCOME: ["Conciliar resultado", "Reconcile outcome"],
  VERIFY_CONTACT: ["Verificar contacto registrado", "Verify recorded contact"],
  INTERPRET_REPLY: ["Interpretar respuesta", "Interpret reply"],
  VERIFY_CRM: ["Calificar en HubSpot", "Qualify in HubSpot"],
  REVIEW_CLOSURE: ["Revisar cierre", "Review closure"],
  ENFORCE_SUPPRESSION: ["Bloquear nuevos envíos", "Block new sends"],
  PREPARE_RESPONSE: ["Preparar respuesta", "Prepare reply"],
  REVIEW_REPLY: ["Revisar respuesta", "Review reply"],
  RECONCILE_CRM: ["Conciliar HubSpot", "Reconcile HubSpot"],
}
const channelText: Record<string, [string, string]> = {
  EMAIL: ["Correo", "Email"],
  WHATSAPP: ["WhatsApp", "WhatsApp"],
  FACEBOOK: ["Facebook", "Facebook"],
  INSTAGRAM: ["Instagram", "Instagram"],
  LINKEDIN: ["LinkedIn", "LinkedIn"],
}

export function ContactWorkspace({
  cycleId,
  locale,
  session,
  previewMap,
  previewPreparations,
  previewAttempts,
  previewReplies,
  previewCrmOutcomes,
  previewCadence,
}: {
  cycleId: string
  locale: Locale
  session?: PortalSession
  previewMap?: Map
  previewPreparations?: ContactPreparation[]
  previewAttempts?: ContactAttempt[]
  previewReplies?: ContactReply[]
  previewCrmOutcomes?: ContactCrmOutcome[]
  previewCadence?: Cadence[]
}) {
  const es = locale === "es"
  const [map, setMap] = useState<Map | null>(previewMap ?? null)
  const [preparations, setPreparations] = useState<ContactPreparation[]>(previewPreparations ?? [])
  const [attempts, setAttempts] = useState<ContactAttempt[]>(previewAttempts ?? [])
  const [replies, setReplies] = useState<ContactReply[]>(previewReplies ?? [])
  const [crmOutcomes, setCrmOutcomes] = useState<ContactCrmOutcome[]>(previewCrmOutcomes ?? [])
  const [cadence, setCadence] = useState<Cadence[]>(previewCadence ?? [])
  const [error, setError] = useState(false)
  const [phase, setPhase] = useState<ContactPhase | "ALL">("ALL")
  const [decision, setDecision] = useState<ContactDecision | "ALL">("ALL")
  const [phasePeek, setPhasePeek] = useState(false)
  const [decisionPeek, setDecisionPeek] = useState(false)
  const [query, setQuery] = useState("")
  useEffect(() => {
    if (previewMap) return
    let live = true
    Promise.all([
      acquisitionApi.explorationMap(cycleId),
      acquisitionApi.candidateContactPreparations(cycleId),
      acquisitionApi.candidateContactAttempts(cycleId),
      acquisitionApi.candidateContactReplies(cycleId),
      acquisitionApi.candidateContactCrmOutcomes(cycleId),
      acquisitionApi.candidateContactCadence(cycleId),
    ])
      .then(([value, prepared, sent, answered, crm, timing]) => {
        if (prepared.truncated || sent.truncated || answered.truncated || crm.truncated || timing.truncated) throw new Error("CONTACT_LEDGER_TRUNCATED")
        if (live) {
          setMap(value)
          setPreparations(prepared.preparations)
          setAttempts(sent.attempts)
          setReplies(answered.replies)
          setCrmOutcomes(crm.outcomes)
          setCadence(timing.candidates)
          setError(false)
        }
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [cycleId, previewMap])
  const rows = useMemo(() => (map ? contactRows(map, preparations, attempts, replies, crmOutcomes) : []), [map, preparations, attempts, replies, crmOutcomes])
  const cadenceByCompany = useMemo(() => new Map(cadence.map(item => [item.companyId, item])), [cadence])
  const visible = useMemo(() => {
    const filtered = filterContactRows(rows, phase, decision)
    const needle = query.trim().toLocaleLowerCase(locale)
    return needle ? filtered.filter(({profile}) =>
      [profile.displayName, ...(profile.aliases ?? [])].some(value =>
        value.toLocaleLowerCase(locale).includes(needle))) : filtered
  }, [rows, phase, decision, query, locale])
  const phaseCount = (value: ContactPhase | "ALL") =>
    filterContactRows(rows, value, decision).length
  const decisionCount = (value: ContactDecision | "ALL") =>
    filterContactRows(rows, phase, value).length
  if (error)
    return (
      <p role="alert">
        {es
          ? "No se pudo verificar Contacto."
          : "Contact could not be verified."}
      </p>
    )
  if (!map)
    return (
      <p role="status">{es ? "Consultando Contacto…" : "Loading Contact…"}</p>
    )
  return (
    <section
      className="acq-contact-workspace"
      aria-label={es ? "Gestión de contacto" : "Contact management"}
    >
      <header className="acq-contact-workspace-header">
        <div>
          <span className="acq-eyebrow">
            {es ? "CONTACTO / CARTERA" : "CONTACT / PORTFOLIO"}
          </span>
          <h2>{es ? "Contactar con precisión" : "Precision outreach"}</h2>
          <p className="acq-muted">
            {es
              ? "Estado acreditado y siguiente decisión, sin confundir preparación con envío."
              : "Verified state and next decision, without confusing preparation with sending."}
          </p>
        </div>
        <div className="acq-contact-header-actions">
          <ContactCadenceControl cycleId={cycleId} locale={locale} session={session} preview={!!previewMap}/>
          <strong className="acq-contact-total">
            {rows.length} {es ? "empresas" : "companies"}
          </strong>
        </div>
      </header>
      <div
        className="acq-contact-filters"
        aria-label={es ? "Filtros de contacto" : "Contact filters"}
      >
        <fieldset data-compact={phase !== "ALL"} data-reveal={phasePeek}
          onMouseMove={() => setPhasePeek(true)} onMouseLeave={() => setPhasePeek(false)}>
          <legend>{es ? "Estado" : "Stage"}</legend>
          {(["ALL", "PRIORITIZED", "PREPARED", "AUTHORIZED_PENDING", "OUTCOME_UNKNOWN",
            "SEND_CONFIRMED", "ATTEMPT_FAILED", "CONTACT_UNVERIFIED", "REPLY_UNINTERPRETED",
            "REPLY_POSITIVE", "REPLY_NEGATIVE", "REPLY_OPT_OUT", "REPLY_BAD_TIMING",
            "REPLY_QUESTION", "REPLY_UNCERTAIN", "RETURNED_TO_CONTACT",
            "CRM_CONFIRMED", "CRM_UPDATED", "CRM_UNCERTAIN"] as const).map((value) => {
            const label = value === "ALL"
                ? es
                  ? "Todas"
                  : "All"
                : phaseText[value][es ? 0 : 1]
            const count = phaseCount(value)
            if (value !== "ALL" && count === 0 && phase !== value) return null
            return (
              <button
                type="button"
                key={value}
                aria-label={`${label}: ${count}`}
                aria-pressed={phase === value}
                onClick={(event) => {
                  setPhase(phase === value ? "ALL" : value)
                  setPhasePeek(false)
                  if (event.detail > 0) event.currentTarget.blur()
                }}
              >
                {label}<span aria-hidden="true">{count}</span>
              </button>
            )
          })}
        </fieldset>
        <details className="acq-contact-filter-detail">
          <summary>{es ? "Filtrar por siguiente decisión" : "Filter by next decision"}
            {decision !== "ALL" && decision !== "NONE" ? ` · ${decisionText[decision][es ? 0 : 1]}` : ""}</summary>
        <fieldset data-compact={decision !== "ALL"} data-reveal={decisionPeek}
          onMouseMove={() => setDecisionPeek(true)} onMouseLeave={() => setDecisionPeek(false)}>
          <legend>{es ? "Siguiente decisión" : "Next decision"}</legend>
          {(["ALL", "ADD_METHOD", "PREPARE_MESSAGE", "REVIEW_PREPARATION", "REVIEW_ATTEMPT",
            "WAIT_FOR_RESPONSE", "RECONCILE_OUTCOME", "VERIFY_CONTACT", "INTERPRET_REPLY",
            "VERIFY_CRM", "REVIEW_CLOSURE", "ENFORCE_SUPPRESSION", "PREPARE_RESPONSE",
            "REVIEW_REPLY", "RECONCILE_CRM"] as const).map((value) => {
            const label = value === "ALL"
                ? es
                  ? "Todas"
                  : "All"
                : decisionText[value][es ? 0 : 1]
            const count = decisionCount(value)
            if (value !== "ALL" && count === 0 && decision !== value) return null
            return (
              <button
                type="button"
                key={value}
                aria-label={`${label}: ${count}`}
                aria-pressed={decision === value}
                onClick={(event) => {
                  setDecision(decision === value ? "ALL" : value)
                  setDecisionPeek(false)
                  if (event.detail > 0) event.currentTarget.blur()
                }}
              >
                {label}<span aria-hidden="true">{count}</span>
              </button>
            )
          })}
        </fieldset>
        </details>
      </div>
      <label className="acq-contact-search">
        <span>{es ? "Buscar empresa" : "Search company"}</span>
        <input type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder={es ? "Nombre o alias" : "Name or alias"}/>
      </label>
      <p className="acq-contact-result-count" role="status">
        {visible.length} {es ? visible.length === 1 ? "resultado" : "resultados" :
          visible.length === 1 ? "result" : "results"}
      </p>
      {visible.length === 0 && (
        <p className="acq-empty">
          {es
            ? "No hay empresas con estos filtros."
            : "No companies match these filters."}
        </p>
      )}
      <div className="acq-contact-list">
        {visible.map(
          ({ profile, phase: currentPhase, decision: nextDecision, preparation, attempt, reply, crmOutcome, chosenChannel, recipientLabel, lastActivity }) => (
            <article className="acq-contact-card" key={profile.companyId}>
              <div className="acq-contact-card-top">
                <div>
                  <span className="acq-eyebrow">
                    {profile.links
                      .map((link) => link.market)
                      .filter((v, i, a) => a.indexOf(v) === i)
                      .join(" / ") || "—"}
                  </span>
                  <h3>{profile.displayName}</h3>
                </div>
                <span className="acq-contact-stage-tag">
                  {phaseText[currentPhase][es ? 0 : 1]}
                </span>
              </div>
              <div className="acq-contact-card-main">
                <p>
                  <span>{es ? "Siguiente paso" : "Next step"}</span>
                  <strong>
                    {cadenceByCompany.get(profile.companyId)?.cadence.action === "REVIEW_CLOSE_FOR_SILENCE"
                      ? es ? "Revisar cierre por silencio" : "Review closure for no reply"
                      : cadenceByCompany.get(profile.companyId)?.cadence.action === "KEPT_OPEN_NO_MORE_SENDS"
                        ? es ? "Esperar respuesta · sin más envíos" : "Await reply · no further sends"
                      : cadenceByCompany.get(profile.companyId)?.cadence.action === "REVIEW_FOLLOW_UP"
                        ? es ? "Revisar otro acercamiento" : "Review another outreach"
                        : nextDecision === "NONE"
                      ? es
                        ? "Revisar historial de contacto"
                        : "Review contact history"
                      : decisionText[nextDecision][es ? 0 : 1]}
                  </strong>
                </p>
                {cadenceByCompany.get(profile.companyId)?.cadence.action === "WAIT" &&
                  cadenceByCompany.get(profile.companyId)?.cadence.earliestLocalDate && <p>
                    <span>{es ? "Seguimiento" : "Follow-up"}</span>
                    <strong>{es ? "No revisar antes del " : "Review no earlier than "}
                      {cadenceByCompany.get(profile.companyId)?.cadence.earliestLocalDate}
                    </strong>
                  </p>}
                <p>
                  <span>{es ? "Destinatario" : "Recipient"}</span>
                  <strong>{recipientLabel}</strong>
                </p>
                <p>
                  <span>{es ? "Canal elegido" : "Chosen channel"}</span>
                  <strong>{chosenChannel ? channelText[chosenChannel]?.[es ? 0 : 1] ?? chosenChannel
                    : es ? "Sin elegir" : "Not chosen"} <small>· {profile.contactMethods?.length ?? 0} {(profile.contactMethods?.length ?? 0) === 1 ? es ? "medio" : "method" : es ? "medios" : "methods"}</small></strong>
                </p>
                <p>
                  <span>{es ? "Última actividad" : "Last activity"}</span>
                  <strong>
                    {lastActivity
                      ? new Intl.DateTimeFormat(es ? "es-MX" : "en-US", {
                          dateStyle: "medium",
                          timeZone: "America/Mexico_City",
                        }).format(new Date(lastActivity))
                      : "—"}
                  </strong>
                </p>
              </div>
              {(reply || crmOutcome) && (
                <div className="acq-contact-executive-outcomes">
                  {reply && (
                    <p>
                      <span>{es ? "Respuesta recibida" : "Reply received"}</span>
                      <strong>{reply.originalText}</strong>
                      <small>{channelText[reply.channelType]?.[es ? 0 : 1] ?? reply.channelType} · {reply.receivedAt}</small>
                    </p>
                  )}
                  {(crmOutcome || reply?.classification === "POSITIVE" || reply?.classification === "BAD_TIMING") && (
                    <p>
                      <span>{es ? "Recibo de HubSpot" : "HubSpot receipt"}</span>
                      <strong>{crmOutcome?.outcome === "CONFIRMED" && crmOutcome.providerCompanyId
                        ? `${es ? "Confirmado" : "Confirmed"} · ${crmOutcome.providerCompanyId}`
                        : crmOutcome?.outcome === "OUTCOME_UNKNOWN"
                          ? es ? "Pendiente de conciliación" : "Reconciliation required"
                          : crmOutcome?.outcome === "DISPATCH_STARTED"
                            ? es ? "En proceso · recibo pendiente" : "In progress · receipt pending"
                            : es ? "Pendiente de confirmación" : "Awaiting confirmation"}</strong>
                    </p>
                  )}
                </div>
              )}
              <details>
                <summary>
                  {es
                    ? "Medios, tesis y trazabilidad"
                    : "Methods, thesis and evidence"}
                </summary>
                <ContactMethods
                  methods={profile.contactMethods ?? []}
                  checks={profile.whatsappChecks ?? []}
                  companyName={profile.displayName}
                  locale={locale}
                  hasContactRecord={currentPhase === "CONTACT_UNVERIFIED"}
                  receiptConfirmed={currentPhase === "SEND_CONFIRMED" || !!reply}
                  sentMethodId={reply?.methodId ?? (currentPhase === "SEND_CONFIRMED" ? attempt?.methodId : undefined)}
                />
                {preparation && (
                  <div className="acq-contact-preparation">
                    <strong>{es ? "Mensaje preparado · sin envío" : "Prepared message · not sent"}</strong>
                    <p>{preparation.channelType} · {preparation.recipientLabel}</p>
                    {preparation.subject && <p>{preparation.subject}</p>}
                    <p>{preparation.messageText}</p>
                    <p className="acq-muted">{preparation.rationale}</p>
                  </div>
                )}
                {attempt && (
                  <div className="acq-contact-preparation">
                    <strong>{es ? "Rastro del intento" : "Attempt trail"}</strong>
                    <p>{phaseText[currentPhase][es ? 0 : 1]} · {attempt.channelType}</p>
                    {attempt.providerReceiptId && <p>{es ? "Recibo" : "Receipt"}: {attempt.providerReceiptId}</p>}
                    <p className="acq-muted">{es ? "Autorizado" : "Authorized"}: {attempt.authorizedAt}</p>
                  </div>
                )}
                {reply && (
                  <div className="acq-contact-preparation">
                    <strong>{es ? "Respuesta original" : "Original reply"}</strong>
                    <p>{reply.originalText}</p>
                    <p className="acq-muted">{reply.channelType} · {reply.receivedAt}</p>
                    {reply.interestSummary && <p><strong>{es ? "Lectura de Panky" : "Panky's interpretation"}:</strong> {reply.interestSummary}</p>}
                    {reply.rationale && <p className="acq-muted">{reply.rationale}</p>}
                  </div>
                )}
                {crmOutcome && (
                  <div className="acq-contact-preparation">
                    <strong>{es ? "Resultado de HubSpot" : "HubSpot outcome"}</strong>
                    <p>{crmOutcome.outcome === "CONFIRMED" && crmOutcome.providerCompanyId
                      ? es ? "Confirmado con recibo" : "Confirmed with receipt"
                      : crmOutcome.outcome === "OUTCOME_UNKNOWN"
                        ? es ? "Pendiente de conciliación" : "Reconciliation required"
                        : es ? "Pendiente de confirmación" : "Awaiting confirmation"}</p>
                    {crmOutcome.outcome === "CONFIRMED" && crmOutcome.providerCompanyId &&
                      <p className="acq-muted">{es ? "Empresa en CRM" : "CRM company"}: {crmOutcome.providerCompanyId}</p>}
                  </div>
                )}
                {profile.fitReviews?.at(-1) && (
                  <p>
                    <strong>
                      {es ? "Hipótesis de encaje" : "Fit hypothesis"}:
                    </strong>{" "}
                    {profile.fitReviews.at(-1)!.fitHypothesis}
                  </p>
                )}
                <p className="acq-muted">
                  {currentPhase === "CRM_CONFIRMED"
                    ? es ? "La calificación en HubSpot tiene recibo confirmado."
                      : "HubSpot qualification has a confirmed receipt."
                    : reply?.classification === "POSITIVE"
                    ? es ? "La respuesta positiva está registrada; el alta en HubSpot requiere su propio recibo."
                      : "The positive reply is recorded; HubSpot qualification needs its own receipt."
                    : es
                      ? "La selección técnica anterior al contacto no acredita una respuesta positiva ni el alta en HubSpot."
                      : "Pre-contact selection does not prove a positive reply or HubSpot qualification."}
                </p>
              </details>
            </article>
          ),
        )}
      </div>
    </section>
  )
}
