"use client"

import { useMemo, useState } from "react"
import type { Locale } from "@/lib/i18n"
import {
  acquisitionApi as api,
  type PortalSession,
} from "@/lib/acquisition-api"
import {
  candidateManagementTruth,
  candidateNameGroups,
  type DiscoveryTruth,
} from "@/lib/acquisition-management-truth"
import { opportunityMemo } from "@/lib/acquisition-opportunity-intelligence"

type CandidateView = ReturnType<typeof candidateManagementTruth>[number]

function Opportunity({
  candidate,
  locale,
  record,
  preparations,
  messageBinding,
  route,
  preview,
  contactEvidence,
  session,
  onChanged,
  archiveEligible = false,
}: {
  candidate: CandidateView
  locale: Locale
  record?: string
  preparations?: DiscoveryTruth["conversationPreparations"]
  messageBinding?: NonNullable<DiscoveryTruth["candidateMessageBindings"]>[number]
  route?: NonNullable<DiscoveryTruth["commercialRoutes"]>[number]
  preview?: NonNullable<DiscoveryTruth["buyerMessagePreviews"]>[number]
  contactEvidence?: NonNullable<DiscoveryTruth["contactEvidencePreviews"]>[number]
  session?: PortalSession
  onChanged?: () => void
  archiveEligible?: boolean
}) {
  const es = locale === "es"
  const memo = opportunityMemo(candidate, locale, archiveEligible)
  const [reason, setReason] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const originalSignal =
    candidate.target?.why ||
    (candidate.lastWorkQuality === "JUSTIFIED" ? candidate.known : "") ||
    candidate.sourceHypothesis ||
    candidate.discoveryReason ||
    candidate.known
  return (
    <article className="acq-opportunity-row" data-candidate-id={candidate.id}>
      <div className="acq-record-head">
        <div>
          {record && <span className="acq-eyebrow">{record}</span>}
          <h3>{candidate.name}</h3>
          <p className="acq-company-tldr">{memo.tldr}</p>
        </div>
        <div className="acq-state-stack">
          <span className="acq-state">{memo.stage}</span>
          <span
            className={`acq-recommendation acq-recommendation-${memo.recommendation.kind.toLocaleLowerCase()}`}
          >
            {memo.recommendation.label}
          </span>
        </div>
      </div>
      {preparations?.[0] && (
        <ConversationPreparation
          preparation={preparations[0]}
          messageBinding={messageBinding}
          route={route}
          preview={preview}
          locale={locale}
          session={session}
          onChanged={onChanged}
        />
      )}
      {contactEvidence && (
        <p className="acq-muted">
          <strong>{es ? "Evidencia de contacto" : "Contact evidence"}:</strong>{" "}
          {(
            {
              CANDIDATE_IDENTITY_REQUIRED: es
                ? "resolver identidad de la organización"
                : "resolve organization identity",
              ACCOUNT_ADMISSION_REQUIRED: es
                ? "admitir la cuenta con evidencia"
                : "admit the Account with evidence",
              CANDIDATE_ACCOUNT_IDENTITY_MISMATCH: es
                ? "resolver diferencia de identidad"
                : "resolve identity mismatch",
              ACCOUNT_QUALIFICATION_REQUIRED: es
                ? "evaluar la cuenta"
                : "evaluate the Account",
              PERSON_EVIDENCE_REQUIRED: es
                ? "identificar una persona"
                : "identify a person",
              PERSON_EVIDENCE_STALE: es
                ? "actualizar evidencia de la persona"
                : "refresh person evidence",
              CONTACT_EVIDENCE_CONFLICT: es
                ? "resolver conflicto del correo"
                : "resolve email evidence conflict",
              EMAIL_EVIDENCE_STALE: es
                ? "actualizar evidencia del correo"
                : "refresh email evidence",
              SUPPORTED_EMAIL_REQUIRED: es
                ? "verificar un correo de trabajo"
                : "verify a business email",
              BUYER_ROLE_EVIDENCE_REQUIRED: es
                ? "corroborar quién decide; el correo no prueba el rol"
                : "corroborate who decides; an email does not prove the role",
              SUPPRESSED: es ? "contacto suprimido" : "contact suppressed",
              ARCHIVED_CANDIDATE: es
                ? "candidata archivada"
                : "archived Candidate",
              EXTERNAL_EFFECTS_MODE_UNSAFE: es
                ? "revisar configuración de efectos"
                : "review effect settings",
            } as Record<string, string>
          )[contactEvidence.next_gate] ??
            (es ? "revisión pendiente" : "review pending")}
          . {es ? "No autoriza CRM ni contacto." : "This does not authorize CRM or contact."}
        </p>
      )}
      <div className="acq-memo-grid">
        <section>
          <h4>{es ? "Por qué importa" : "Why it matters"}</h4>
          <ul>
            {memo.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
        <section>
          <h4>{es ? "Qué sigue sin probarse" : "What remains unproven"}</h4>
          <ul>
            {memo.unproven.map((unknown) => (
              <li key={unknown}>{unknown}</li>
            ))}
          </ul>
        </section>
      </div>
      <section className="acq-route">
        <p className="acq-eyebrow">{es ? "Ruta del Engine" : "Engine route"}</p>
        <h4>{memo.route.label}</h4>
        <p>{memo.route.why}</p>
        <p className="acq-muted">
          <strong>{es ? "Cambia cuando" : "Route changes when"}:</strong>{" "}
          {memo.route.changeCondition}
        </p>
      </section>
      <div className="acq-dimension-row">
        <p>
          <span>{es ? "Etapa" : "Stage"}</span>
          <strong>{memo.stage}</strong>
        </p>
        <p>
          <span>{es ? "Dimensión actual" : "Current dimension"}</span>
          <strong>{memo.currentDimension}</strong>
        </p>
        <p>
          <span>{es ? "Siguiente dimensión" : "Next dimension"}</span>
          <strong>{memo.nextDimension}</strong>
        </p>
      </div>
      <section className="acq-next-step">
        <p className="acq-eyebrow">
          {es ? "Siguiente paso exacto" : "Exact next step"}
        </p>
        <h4>{memo.nextStep.action}</h4>
        <dl>
          <div>
            <dt>{es ? "Propósito" : "Purpose"}</dt>
            <dd>{memo.nextStep.purpose}</dd>
          </div>
          <div>
            <dt>{es ? "Cambio esperado" : "Expected decision change"}</dt>
            <dd>{memo.nextStep.decisionChange}</dd>
          </div>
          <div>
            <dt>{es ? "Condición de parada" : "Stop condition"}</dt>
            <dd>{memo.nextStep.stopCondition}</dd>
          </div>
        </dl>
      </section>
      <p className="acq-archive-recommendation">
        <span>{es ? "Recomendación" : "Recommendation"}</span>
        <strong>{memo.recommendation.label}</strong> —{" "}
        {memo.recommendation.reason}
      </p>
      {(candidate.nextAction || originalSignal || candidate.unknown) && (
        <details>
          <summary>
            {es
              ? "Texto original del Engine y evidencia"
              : "Original Engine text and evidence"}
          </summary>
          {originalSignal && (
            <p>
              <strong>{es ? "Motivo original" : "Original reason"}:</strong>{" "}
              {originalSignal}
            </p>
          )}
          {candidate.unknown && (
            <p>
              <strong>
                {es ? "Incertidumbre original" : "Original unknown"}:
              </strong>{" "}
              {candidate.unknown}
            </p>
          )}
          {candidate.nextAction && (
            <p>
              <strong>
                {es ? "Siguiente paso original" : "Original next step"}:
              </strong>{" "}
              {candidate.nextAction}
            </p>
          )}
          {candidate.known && (
            <p>
              <strong>{es ? "Observado" : "Observed"}:</strong>{" "}
              {candidate.known}
            </p>
          )}
        </details>
      )}
      {session?.actor.capabilities.includes("MANAGE_CYCLE") && onChanged && (
        <details>
          <summary>
            {candidate.archived
              ? es
                ? "Restaurar"
                : "Restore"
              : es
                ? "Quitar de la vista activa"
                : "Remove from active view"}
          </summary>
          <p className="acq-muted">
            {candidate.archived
              ? es
                ? "La restauración devuelve la organización al espacio activo sin borrar el historial."
                : "Restoring returns the organization to the active workspace without deleting history."
              : es
                ? "Archivar no rechaza, elimina ni fusiona la organización. Conserva toda la evidencia."
                : "Archiving does not reject, delete, or merge the organization. All evidence remains."}
          </p>
          <label>
            {es ? "Motivo" : "Reason"}
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              maxLength={1000}
            />
          </label>
          <button
            disabled={pending || reason.trim().length < 10}
            onClick={async () => {
              setPending(true)
              setError(false)
              try {
                await api.candidateWorkspace(
                  crypto.randomUUID(),
                  candidate.id,
                  candidate.archived
                    ? "RESTORE_CANDIDATE"
                    : "ARCHIVE_CANDIDATE",
                  reason.trim(),
                  session.csrfToken,
                )
                onChanged()
              } catch {
                setError(true)
                setPending(false)
              }
            }}
          >
            {pending
              ? es
                ? "Guardando…"
                : "Saving…"
              : candidate.archived
                ? es
                  ? "Restaurar organización"
                  : "Restore organization"
                : es
                  ? "Archivar organización"
                  : "Archive organization"}
          </button>
          {error && (
            <p role="alert">
              {es
                ? "No se pudo cambiar la vista activa."
                : "The active-view state could not be changed."}
            </p>
          )}
        </details>
      )}
    </article>
  )
}

export function ConversationPreparation({
  preparation,
  messageBinding,
  route,
  preview,
  locale,
  session,
  onChanged,
}: {
  preparation: NonNullable<DiscoveryTruth["conversationPreparations"]>[number]
  messageBinding?: NonNullable<DiscoveryTruth["candidateMessageBindings"]>[number]
  route?: NonNullable<DiscoveryTruth["commercialRoutes"]>[number]
  preview?: NonNullable<DiscoveryTruth["buyerMessagePreviews"]>[number]
  locale: Locale
  session?: PortalSession
  onChanged?: () => void
}) {
  const es = locale === "es"
  const [decision, setDecision] = useState<"APPROVE" | "COMMENT" | "CORRECT">(
    "COMMENT",
  )
  const [target, setTarget] = useState<
    "PATTERN" | "POSITION" | "EVIDENCE" | "QUESTION" | "MESSAGE" | "GENERAL"
  >("GENERAL")
  const [comment, setComment] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <section
      className="acq-route"
      aria-label={
        es ? "Preparación de conversación" : "Conversation preparation"
      }
    >
      <p className="acq-eyebrow">
        {es ? "Preparación de Pancracio" : "Pancracio preparation"} · v
        {preparation.version}
      </p>
      <p className="acq-muted">
        {es
          ? "Borrador basado en evidencia. Tu comentario es opcional; Pancracio decide el siguiente paso dentro del mandato. No autoriza contacto."
          : "Evidence-based draft. Your feedback is optional; Pancracio decides the next step within its mandate. This does not authorize contact."}
      </p>
      {messageBinding?.proposal_id === preparation.id && (
        <p className="acq-muted">
          <strong>{es ? "Mensaje vinculado" : "Linked message"}:</strong> v
          {messageBinding.message_version}.{" "}
          {messageBinding.proposal_current &&
          messageBinding.message_current &&
          messageBinding.mandate_current
            ? es
              ? "Vigente sólo para ensayo; no autoriza CRM real ni contacto."
              : "Current for rehearsal only; this does not authorize real CRM or contact."
            : es
              ? "Requiere nueva validación antes de CRM; no autoriza contacto."
              : "Requires new validation before CRM; this does not authorize contact."}
        </p>
      )}
      {preview?.proposal_id === preparation.id && (
        <p className="acq-muted">
          <strong>{es ? "Vista Buyer y mensaje" : "Buyer and message preview"}:</strong>{" "}
          {preview.buyer_current &&
          preview.buyer_messageability === "READY" &&
          preview.buyer_state === "RESOLVED"
            ? es
              ? "Buyer vigente como evidencia."
              : "Current Buyer evidence."
            : es
              ? "Buyer sin resolver o sin vigencia."
              : "Buyer unresolved or not current."}{" "}
          {preview.preview_gate === "CURRENT_MESSAGE_BINDING_REQUIRED"
            ? es
              ? "Falta vincular un mensaje vigente."
              : "A current message binding is required."
            : es
              ? "La ruta conserva sus bloqueos actuales."
              : "Current route blockers still apply."}{" "}
          {es ? "No autoriza CRM ni contacto." : "This does not authorize CRM or contact."}
        </p>
      )}
      {route && (
        <p className="acq-muted">
          <strong>{es ? "Siguiente frontera" : "Next gate"}:</strong>{" "}
          {(
            {
              EXTERNAL_EFFECTS_MODE_UNSAFE: es
                ? "detener y revisar configuración de efectos"
                : "stop and review effect settings",
              ACTIVE_CYCLE_REQUIRED: es
                ? "confirmar ciclo activo"
                : "confirm the active cycle",
              ARCHIVED_CANDIDATE: es
                ? "revisar candidata archivada"
                : "review archived Candidate",
              UNCERTAIN_EFFECT_RECONCILIATION_REQUIRED: es
                ? "conciliar un resultado incierto"
                : "reconcile an uncertain outcome",
              PRIOR_EFFECT_ATTEMPT_REVIEW_REQUIRED: es
                ? "revisar intentos previos"
                : "review prior attempts",
              CANDIDATE_IDENTITY_REQUIRED: es
                ? "resolver identidad de la organización"
                : "resolve organization identity",
              ACCOUNT_ADMISSION_REQUIRED: es
                ? "confirmar identidad y admisión de cuenta"
                : "confirm identity and Account admission",
              CANDIDATE_ACCOUNT_IDENTITY_MISMATCH: es
                ? "resolver diferencia de identidad entre Candidate y cuenta"
                : "resolve Candidate and Account identity mismatch",
              ACCOUNT_QUALIFICATION_REQUIRED: es
                ? "completar evaluación de cuenta"
                : "complete Account evaluation",
              PERSON_EVIDENCE_REQUIRED: es
                ? "identificar una persona con evidencia"
                : "identify a person with evidence",
              SUPPORTED_EMAIL_REQUIRED: es
                ? "verificar un contacto de email"
                : "verify an email contact",
              CURRENT_BUYER_PACKAGE_REQUIRED: es
                ? "obtener un paquete Buyer vigente"
                : "obtain a current Buyer package",
              SUPPRESSED: es ? "contacto suprimido" : "contact suppressed",
              GENERIC_CRM_BOUNDARY_REQUIRED: es
                ? "validar el límite genérico de CRM"
                : "validate the generic CRM boundary",
            } as Record<string, string>
          )[route.next_gate] ?? (es ? "revisión pendiente" : "review pending")}
          .{" "}
          {es
            ? "La ruta a CRM y email no es ejecutable."
            : "The CRM and email route is not executable."}
        </p>
      )}
      <p>
        <strong>{es ? "Hipótesis" : "Hypothesis"}:</strong>{" "}
        {preparation.body.hypothesis}
      </p>
      <p>
        <strong>{es ? "Pregunta" : "Question"}:</strong>{" "}
        {preparation.body.question}
      </p>
      <details>
        <summary>
          {es
            ? "Borrador, posiciones y fuentes"
            : "Draft, positions and sources"}
        </summary>
        <p>
          <strong>{es ? "Asunto" : "Subject"}:</strong>{" "}
          {preparation.body.subject}
        </p>
        <p>{preparation.body.message}</p>
        <ol>
          {preparation.body.positions.map((position, index) => (
            <li key={index}>
              {position.role}:{" "}
              {position.actor ?? (es ? "sin identificar" : "unidentified")} —{" "}
              {position.epistemicStatus}. {position.reason}
              {index + 1 === preparation.body.chosenPosition
                ? ` (${es ? "posición elegida" : "chosen position"})`
                : ""}
            </li>
          ))}
        </ol>
        <ul>
          {preparation.body.claims.map((claim, index) => (
            <li key={index}>
              {claim.text} ({claim.observationId})
            </li>
          ))}
        </ul>
      </details>
      {preparation.feedback.length > 0 && (
        <details>
          <summary>
            {es ? "Comentarios registrados" : "Recorded feedback"} (
            {preparation.feedback.length})
          </summary>
          <ul>
            {preparation.feedback.map((item) => (
              <li key={item.id}>
                {item.decision} · {item.target}: {item.comment}
              </li>
            ))}
          </ul>
        </details>
      )}
      {session && onChanged && (
        <details>
          <summary>
            {es ? "Dejar comentario opcional" : "Leave optional feedback"}
          </summary>
          <label>
            {es ? "Opinión" : "Response"}
            <select
              value={decision}
              onChange={(event) =>
                setDecision(event.target.value as typeof decision)
              }
            >
              <option value="COMMENT">{es ? "Comentar" : "Comment"}</option>
              <option value="CORRECT">{es ? "Corregir" : "Correct"}</option>
              <option value="APPROVE">
                {es ? "Estoy de acuerdo" : "Agree"}
              </option>
            </select>
          </label>
          <label>
            {es ? "Sobre" : "About"}
            <select
              value={target}
              onChange={(event) =>
                setTarget(event.target.value as typeof target)
              }
            >
              {(
                [
                  "GENERAL",
                  "PATTERN",
                  "POSITION",
                  "EVIDENCE",
                  "QUESTION",
                  "MESSAGE",
                ] as const
              ).map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            {es ? "Comentario" : "Comment"}
            <textarea
              maxLength={2000}
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>
          <button
            disabled={
              pending || (decision !== "APPROVE" && comment.trim().length < 3)
            }
            onClick={async () => {
              setPending(true)
              setError(false)
              setSaved(false)
              try {
                await api.conversationFeedback(
                  crypto.randomUUID(),
                  preparation.id,
                  decision,
                  target,
                  comment.trim(),
                  session.csrfToken,
                )
                setComment("")
                setSaved(true)
                onChanged()
              } catch {
                setError(true)
              } finally {
                setPending(false)
              }
            }}
          >
            {pending
              ? es
                ? "Guardando…"
                : "Saving…"
              : es
                ? "Guardar comentario"
                : "Save feedback"}
          </button>
          {error && (
            <p role="alert">
              {es
                ? "No se pudo guardar el comentario."
                : "Feedback could not be saved."}
            </p>
          )}
          {saved && (
            <p role="status">
              {es ? "Comentario registrado." : "Feedback recorded."}
            </p>
          )}
        </details>
      )}
    </section>
  )
}

export function CandidateOpportunities({
  data,
  locale,
  session,
  onChanged,
}: {
  data: DiscoveryTruth
  locale: Locale
  session?: PortalSession
  onChanged?: () => void
}) {
  const es = locale === "es"
  const [showArchived, setShowArchived] = useState(false)
  const candidates = useMemo(() => candidateManagementTruth(data), [data])
  const visible = candidates.filter((candidate) =>
    showArchived ? candidate.archived : !candidate.archived,
  )
  const groups = candidateNameGroups(visible)
  const archivedCount = candidates.filter(
    (candidate) => candidate.archived,
  ).length
  const archiveEligibleIds = new Set(
    (data.archiveEligibility ?? []).map((item) => item.candidate_id),
  )
  return (
    <section aria-label={es ? "Conjunto de oportunidades" : "Opportunity pool"}>
      <div className="acq-section-heading">
        <div>
          <h3>
            {es
              ? "Organizaciones conservadas para consideración"
              : "Organizations retained for consideration"}
          </h3>
          <p className="acq-muted">
            {es
              ? "Antes de admitir una cuenta, una candidata puede seguir siendo valiosa sin estar lista para contacto."
              : "Before Account admission, a Candidate can remain valuable without being ready for contact."}
          </p>
        </div>
        <strong>{visible.length}</strong>
      </div>
      <button onClick={() => setShowArchived((value) => !value)}>
        {showArchived
          ? es
            ? "Ver espacio activo"
            : "View active workspace"
          : `${es ? "Ver archivadas" : "View archived"} (${archivedCount})`}
      </button>
      {data.archivePolicy && (
        <details>
          <summary>{es ? "Política de archivo" : "Archive policy"}</summary>
          <p>
            {data.archivePolicy.enabled
              ? es
                ? `Política v${data.archivePolicy.version} habilitada. Sólo ${data.archiveEligibility?.length ?? 0} organizaciones terminales cumplen hoy sus reglas; esperar o estar en HOLD no basta.`
                : `Policy v${data.archivePolicy.version} is enabled. Only ${data.archiveEligibility?.length ?? 0} terminal organizations currently meet its rules; waiting or HOLD is insufficient.`
              : es
                ? `Política v${data.archivePolicy.version} deshabilitada. No se archivará automáticamente ninguna organización.`
                : `Policy v${data.archivePolicy.version} is disabled. No organization will be archived automatically.`}
          </p>
        </details>
      )}
      {!groups.length && (
        <p className="acq-empty">
          {showArchived
            ? es
              ? "No hay organizaciones archivadas."
              : "No archived organizations."
            : es
              ? "No hay organizaciones en el espacio activo."
              : "No organizations in the active workspace."}
        </p>
      )}
      <div className="acq-opportunity-list">
        {groups.map((group) =>
          group.length === 1 ? (
            <Opportunity
              key={group[0].id}
              candidate={group[0]}
              preparations={data.conversationPreparations
                ?.filter((item) => item.candidate_id === group[0].id)
                .sort((a, b) => b.version - a.version)}
              messageBinding={data.candidateMessageBindings?.find(
                (item) => item.candidate_id === group[0].id,
              )}
              route={data.commercialRoutes?.find(
                (item) => item.candidate_id === group[0].id,
              )}
              preview={data.buyerMessagePreviews?.find(
                (item) => item.candidate_id === group[0].id,
              )}
              contactEvidence={data.contactEvidencePreviews?.find(
                (item) => item.candidate_id === group[0].id,
              )}
              locale={locale}
              session={session}
              onChanged={onChanged}
              archiveEligible={archiveEligibleIds.has(group[0].id)}
            />
          ) : (
            <section className="acq-same-name" key={group[0].id}>
              <h3>
                {group[0].name} — {group.length}{" "}
                {es ? "registros sin resolver" : "unresolved records"}
              </h3>
              <p className="acq-muted">
                {es
                  ? "Mismo nombre; identidades no fusionadas."
                  : "Same name; identities are not merged."}
              </p>
              {group.map((candidate, index) => (
                <Opportunity
                  key={candidate.id}
                  candidate={candidate}
                  preparations={data.conversationPreparations
                    ?.filter((item) => item.candidate_id === candidate.id)
                    .sort((a, b) => b.version - a.version)}
                  messageBinding={data.candidateMessageBindings?.find(
                    (item) => item.candidate_id === candidate.id,
                  )}
                  route={data.commercialRoutes?.find(
                    (item) => item.candidate_id === candidate.id,
                  )}
                  preview={data.buyerMessagePreviews?.find(
                    (item) => item.candidate_id === candidate.id,
                  )}
                  contactEvidence={data.contactEvidencePreviews?.find(
                    (item) => item.candidate_id === candidate.id,
                  )}
                  locale={locale}
                  session={session}
                  onChanged={onChanged}
                  archiveEligible={archiveEligibleIds.has(candidate.id)}
                  record={`${es ? "Registro" : "Record"} ${String.fromCharCode(65 + index)}`}
                />
              ))}
            </section>
          ),
        )}
      </div>
    </section>
  )
}
