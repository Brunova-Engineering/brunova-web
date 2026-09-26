"use client"

import { useEffect, useState } from "react"
import { acquisitionApi as api, type CycleReview } from "@/lib/acquisition-api"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
import {
  candidateManagementTruth,
  marketContextCounts,
  type DiscoveryTruth,
} from "@/lib/acquisition-management-truth"
import { opportunityQuality } from "@/lib/acquisition-opportunity-intelligence"
import type { Locale } from "@/lib/i18n"

const countExecuted = (
  session: NonNullable<DiscoveryTruth["routineOperatingSessions"]>[number],
) =>
  session.decisions.filter((decision) => {
    const outcome = decision.outcome
    return (
      decision.decision !== "STOP" &&
      outcome &&
      typeof outcome === "object" &&
      !Array.isArray(outcome) &&
      ("work_item_id" in outcome || "workItemId" in outcome)
    )
  }).length

const formatOperatingTime = (
  value: string | null | undefined,
  locale: Locale,
  timeZone = "America/Mexico_City",
) => {
  if (!value) return null
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return null
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(date)
}

const elapsedMinutes = (
  startedAt: string | null | undefined,
  closedAt: string | null | undefined,
) => {
  if (!startedAt || !closedAt) return null
  const elapsed = new Date(closedAt).getTime() - new Date(startedAt).getTime()
  return Number.isFinite(elapsed) && elapsed >= 0
    ? Math.max(1, Math.round(elapsed / 60_000))
    : null
}

export function ManagementOverview({
  cycleId,
  cycleStatus,
  locale,
  onNavigate,
}: {
  cycleId: string
  cycleStatus: string
  locale: Locale
  onNavigate: (tab: string) => void
}) {
  const es = locale === "es"
  const [review, setReview] = useState<CycleReview | null>(null)
  const [discovery, setDiscovery] = useState<DiscoveryTruth | null>(null)
  const [reviewError, setReviewError] = useState(false)
  const [discoveryError, setDiscoveryError] = useState(false)
  useEffect(() => {
    let live = true
    Promise.allSettled([api.cycleReview(cycleId), readDiscovery()]).then(
      ([reviewResult, discoveryResult]) => {
        if (!live) return
        setReviewError(reviewResult.status === "rejected")
        setDiscoveryError(discoveryResult.status === "rejected")
        if (reviewResult.status === "fulfilled")
          setReview(reviewResult.value.review)
        if (discoveryResult.status === "fulfilled")
          setDiscovery(discoveryResult.value)
      },
    )
    return () => {
      live = false
    }
  }, [cycleId])
  if (discoveryError)
    return (
      <section role="alert" className="acq-panel">
        {es
          ? "No se pudo verificar el estado operativo. Actualiza antes de decidir."
          : "Operating state could not be verified. Refresh before deciding."}
      </section>
    )
  if (!discovery || (!review && !reviewError))
    return (
      <p role="status">
        {es ? "Consultando estado del ciclo…" : "Loading Cycle state…"}
      </p>
    )

  const candidates = candidateManagementTruth(discovery)
  const quality = opportunityQuality(
    candidates.filter((candidate) => !candidate.archived),
    locale,
    new Set(
      (discovery.archiveEligibility ?? []).map((item) => item.candidate_id),
    ),
  )
  const contacted = candidates.filter((candidate) => candidate.contacted)
  const latest = discovery.routineOperatingSessions?.[0]
  const interrupted = latest?.operational_status === "INTERRUPTED"
  const executed = latest ? countExecuted(latest) : 0
  const deferred = latest?.decisions.at(-1)?.decision === "STOP"
  const acceptedFourthWindow =
    deferred && String(latest?.local_date ?? "").startsWith("2026-09-20")
  const requests = Number(latest?.capacity.requestsUsed ?? 0)
  const unitsUsed = Number(latest?.capacity.unitsUsed ?? 0)
  const unitBudget = Number(latest?.capacity.workUnitBudget ?? 0)
  const requestBudget = Number(latest?.capacity.sourceRequestBudget ?? 0)
  const minutesUsed = Number(latest?.capacity.minutesUsed ?? 0)
  const minuteBudget = Number(latest?.capacity.timeCapacityMinutes ?? 0)
  const latestTimestamp = latest?.closed_at ?? latest?.started_at
  const latestTime = formatOperatingTime(
    latestTimestamp,
    locale,
    latest?.timezone,
  )
  const duration = elapsedMinutes(latest?.started_at, latest?.closed_at)
  const closingBoundary =
    unitBudget > 0 && unitsUsed >= unitBudget
      ? es
        ? `límite de ${unitBudget} slots alcanzado`
        : `${unitBudget}-slot limit reached`
      : requestBudget > 0 && requests >= requestBudget
        ? es
          ? `límite de ${requestBudget} consultas alcanzado`
          : `${requestBudget}-request limit reached`
        : minuteBudget > 0 && minutesUsed >= minuteBudget
          ? es
            ? `límite de ${minuteBudget} minutos efectivos alcanzado`
            : `${minuteBudget}-effective-minute limit reached`
          : latest?.early_stop_reason
            ? latest.early_stop_reason.replaceAll("_", " ").toLocaleLowerCase()
            : null
  const markets = marketContextCounts(discovery)
  const continuous =
    discovery.productionOperatingState?.current === true &&
    discovery.productionOperatingState.recurrence_authorized === true
  const held = !continuous && latest?.status === "HELD_REVIEW"
  const wave = review?.waves.at(-1)
  const technicalHalt =
    review?.control?.technical_halt || review?.control?.state === "STOPPED"
  const decisionNeeded =
    interrupted ||
    !!technicalHalt ||
    wave?.state === "REVIEW_REQUIRED" ||
    wave?.state === "PLANNED"
  return (
    <div className="acq-overview">
      {reviewError ? (
        <p role="status" className="acq-muted">
          {es
            ? "La revisión de Dirección no está disponible; se muestra sólo el estado operativo verificado."
            : "Management review is unavailable; only verified operating state is shown."}
        </p>
      ) : null}
      <section className="acq-summary acq-panel">
        <div>
          <p className="acq-eyebrow">
            {es ? "Estado actual" : "Current state"}
          </p>
          <h2>
            {es ? "Ciclo 1" : "Cycle 1"} ·{" "}
            {cycleStatus === "ACTIVE"
              ? es
                ? "activo"
                : "active"
              : cycleStatus.toLocaleLowerCase()}
          </h2>
          <p>
            {held
              ? es
                ? "La última ventana fue aceptada técnicamente; la recurrencia continúa detenida."
                : "The latest window was technically accepted; recurrence remains held."
              : es
                ? "El ciclo conserva su investigación y sus límites de Dirección."
                : "The Cycle retains its research and Management boundaries."}
          </p>
        </div>
        <div
          className="acq-summary-metrics"
          aria-label={es ? "Estado del ciclo" : "Cycle state"}
        >
          <div>
            <strong>{discovery.totals.candidates}</strong>
            <span>{es ? "candidatas" : "candidates"}</span>
          </div>
          <div>
            <strong>
              {review?.discovery?.admitted ?? discovery.totals.admitted}
            </strong>
            <span>{es ? "cuentas admitidas" : "admitted Accounts"}</span>
          </div>
          <div>
            <strong>{contacted.length}</strong>
            <span>{es ? "contactadas" : "contacted"}</span>
          </div>
          <div>
            <strong>{discovery.totals.pending_work}</strong>
            <span>{es ? "trabajos pendientes" : "pending work"}</span>
          </div>
        </div>
        <p className="acq-boundary-line">
          <strong>{es ? "Recurrencia" : "Recurrence"}:</strong>{" "}
          {held
            ? es
              ? "detenida (HOLD)"
              : "HOLD"
            : continuous
              ? es
                ? "activa · diaria 17:00"
                : "active · daily 17:00"
              : (latest?.recurrence_state ?? "—")}{" "}
          ·{" "}
          <strong>{es ? "Efectos comerciales" : "Commercial effects"}:</strong>{" "}
          {continuous
            ? es
              ? "Pancracio + validación exacta del Engine"
              : "Pancracio + exact Engine validation"
            : es
              ? "deshabilitados"
              : "disabled"}
        </p>
      </section>

      <div className="acq-overview-grid">
        <section className="acq-panel">
          <p className="acq-eyebrow">
            {es ? "Último resultado" : "Latest outcome"}
          </p>
          <h2>
            {held
              ? es
                ? "La ventana se cerró sin nueva investigación"
                : "Window closed without new research"
              : es
                ? "Última ventana"
                : "Latest window"}
          </h2>
          {latest ? (
            <>
              <p>
                {deferred
                  ? es
                    ? "El sistema decidió esperar. El trabajo restante no justificaba otra unidad de capacidad."
                    : "The Engine deferred. Remaining work did not justify another capacity unit."
                  : es
                    ? "La ejecución registrada y sus límites están disponibles en Oportunidades."
                    : "Recorded execution and its limits are available in Opportunities."}
              </p>
              <div className="acq-inline-facts">
                <span>
                  {executed}{" "}
                  {es
                    ? "tareas de investigación ejecutadas"
                    : "research tasks executed"}
                </span>
                <span>
                  {requests} {es ? "consultas de fuente" : "source requests"}
                </span>
              </div>
              <p className="acq-muted">
                {acceptedFourthWindow && executed === 0 && requests === 0
                  ? es
                    ? "No hubo evidencia nueva de empresas. A1 aceptado; A2 no aplica porque no hubo ejecución."
                    : "No new company evidence. A1 accepted; A2 does not apply because nothing executed."
                  : es
                    ? "El detalle de evidencia está en Oportunidades; no se infiere calidad sólo por completar trabajo."
                    : "Evidence details are in Opportunities; completing work alone does not prove information quality."}
              </p>
              <details>
                <summary>
                  {es ? "Contabilidad técnica" : "Technical accounting"}
                </summary>
                <p>
                  {es
                    ? "Las decisiones comparativas consumen un slot de decisión, no una unidad de investigación ejecutada."
                    : "Comparative decisions consume a decision slot, not an executed research unit."}{" "}
                  {es ? "Slots registrados" : "Recorded slots"}:{" "}
                  {unitBudget > 0 ? `${unitsUsed} / ${unitBudget}` : unitsUsed}.{" "}
                  {requestBudget > 0 &&
                    `${requests} / ${requestBudget} ${es ? "consultas" : "requests"}. `}
                  {minuteBudget > 0 &&
                    `${minutesUsed} / ${minuteBudget} ${es ? "minutos efectivos" : "effective minutes"}.`}
                </p>
                <p>
                  {es ? "Estado" : "State"}:{" "}
                  {interrupted
                    ? es
                      ? "INTERRUMPIDA"
                      : "INTERRUPTED"
                    : latest.status}{" "}
                  · {es ? "Cierre" : "Closed"}: {latestTime ?? "—"}
                  {duration !== null &&
                    ` · ${es ? "duración" : "duration"}: ${duration} min`}
                  {closingBoundary &&
                    ` · ${es ? "límite determinante" : "binding limit"}: ${closingBoundary}`}
                </p>
                <p className="acq-muted">
                  {es
                    ? "La ventana de 110 minutos es capacidad máxima, no una duración obligatoria; la sesión cierra cuando alcanza primero un límite o ya no existe trabajo autorizado con valor suficiente."
                    : "The 110-minute window is maximum capacity, not a required duration; the session closes when it first reaches a limit or no sufficiently valuable authorized work remains."}
                </p>
              </details>
            </>
          ) : (
            <p>
              {es
                ? "Todavía no hay una ventana registrada."
                : "No operating window has been recorded yet."}
            </p>
          )}
        </section>
        <section className="acq-panel">
          <p className="acq-eyebrow">
            {es ? "Qué sigue" : "What happens next"}
          </p>
          <h2>
            {decisionNeeded
              ? es
                ? "Dirección debe revisar"
                : "Management review required"
              : continuous
                ? es
                  ? "El Engine continúa automáticamente"
                  : "The Engine continues automatically"
                : es
                  ? "Aceptación del Portal pendiente"
                  : "Portal acceptance pending"}
          </h2>
          <p>
            {decisionNeeded
              ? es
                ? "Revisa la decisión vigente antes de autorizar progresión."
                : "Review the current decision before authorizing progression."
              : continuous
                ? es
                  ? "La siguiente ventana abre diariamente a las 17:00. No se requiere aprobación por unidad; cualquier efecto comercial exige razonamiento de Pancracio y validación exacta del Engine."
                  : "The next window opens daily at 17:00. No per-unit approval is required; every commercial effect requires Pancracio reasoning and exact Engine validation."
                : es
                  ? "La recurrencia permanece detenida. No hay una siguiente acción comercial automática ni autoridad de seguimiento."
                  : "Recurrence remains held. There is no automatic next commercial action or follow-up authority."}
          </p>
          <button
            onClick={() =>
              onNavigate(continuous ? "Opportunities" : "Attention")
            }
          >
            {decisionNeeded
              ? es
                ? "Ver decisión"
                : "View decision"
              : continuous
                ? es
                  ? "Ver oportunidades"
                  : "View opportunities"
                : es
                  ? "Revisar frontera de aceptación"
                  : "Review acceptance boundary"}
          </button>
        </section>
      </div>
      <section className="acq-overview-strip">
        <div>
          <span>{es ? "Mercados explorados" : "Markets explored"}</span>
          <strong>
            MX {markets.MX} · US {markets.US} · {es ? "mixto" : "mixed"}{" "}
            {markets.ambiguous}
          </strong>
          <small>
            {es
              ? "Contexto de búsqueda, no domicilio confirmado."
              : "Search context, not confirmed domicile."}
          </small>
        </div>
        <div>
          <span>{es ? "Lo que tenemos" : "What we have"}</span>
          <strong>
            {discovery.totals.resolved}{" "}
            {es ? "identidad respaldada" : "supported identity"} ·{" "}
            {discovery.totals.unresolved} {es ? "sin resolver" : "unresolved"}
          </strong>
          <small>
            {es
              ? "La incertidumbre permanece en el conjunto."
              : "Uncertainty remains in the pool."}
          </small>
        </div>
        <div>
          <span>{es ? "Lo aprendido" : "What we learned"}</span>
          <strong>
            {executed === 0
              ? es
                ? "Sin nueva evidencia en la última ventana"
                : "No new evidence in the latest window"
              : es
                ? "Ver resultado por candidata"
                : "See candidate-level outcomes"}
          </strong>
          <small>
            {es
              ? "La abstención no equivale a rechazo."
              : "Deferral does not mean rejection."}
          </small>
        </div>
      </section>
      <section
        className="acq-quality-strip"
        aria-label={es ? "Calidad del conjunto" : "Pool quality"}
      >
        <div>
          <span>{es ? "Resolviendo identidad" : "Resolving identity"}</span>
          <strong>{quality.identity}</strong>
          <small>
            {es
              ? "Aún no son oportunidades atribuibles."
              : "Not yet attributable opportunities."}
          </small>
        </div>
        <div>
          <span>
            {es ? "Validando intervención" : "Validating intervention"}
          </span>
          <strong>{quality.intervention}</strong>
          <small>
            {es
              ? "Señal concreta; necesidad aún falsable."
              : "Concrete signal; need remains falsifiable."}
          </small>
        </div>
        <div>
          <span>{es ? "Tesis conversacional" : "Conversation thesis"}</span>
          <strong>{quality.conversationReady}</strong>
          <small>
            {es
              ? "No equivale a autorización de contacto."
              : "Does not equal outreach authority."}
          </small>
        </div>
        <div>
          <span>{es ? "Esperando / revisión" : "Waiting / review"}</span>
          <strong>
            {quality.waiting} / {quality.review}
          </strong>
          <small>
            {es
              ? "Incluye límites que evitan gastar capacidad."
              : "Includes boundaries that prevent wasted capacity."}
          </small>
        </div>
      </section>
      {contacted.length > 0 && (
        <section className="acq-panel acq-contact-strip">
          <h2>{es ? "Contacto en espera" : "Contact waiting"}</h2>
          {contacted.map((candidate) => (
            <p key={candidate.id}>
              <strong>{candidate.name}</strong> ·{" "}
              {es
                ? "un mensaje enviado; esperando respuesta"
                : "one message sent; waiting for reply"}{" "}
              · {es ? "seguimiento" : "follow-up"}:{" "}
              <strong>
                {candidate.followUpAuthority === "NONE"
                  ? es
                    ? "sin autorización"
                    : "not authorized"
                  : es
                    ? "requiere autorización exacta"
                    : "requires exact authorization"}
              </strong>
            </p>
          ))}
        </section>
      )}
    </div>
  )
}
