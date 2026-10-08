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
  session,
  onChanged,
  archiveEligible = false,
}: {
  candidate: CandidateView
  locale: Locale
  record?: string
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
