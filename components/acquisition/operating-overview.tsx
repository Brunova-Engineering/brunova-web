"use client"
import { useEffect, useState } from "react"
import {
  acquisitionApi as api,
  type CycleReview,
  type CyclePoolItem,
  type PortalSession,
} from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"
import { readinessText } from "@/lib/acquisition-readiness"
import { EngineActivity } from "./engine-activity"
import { CandidateOpportunities } from "./candidate-opportunities"
import { readDiscovery } from "@/lib/acquisition-discovery-read"
import {
  candidateManagementTruth,
  marketContextCounts,
  type DiscoveryTruth,
} from "@/lib/acquisition-management-truth"

export function OperatingOverview({
  cycleId,
  locale,
  onNavigate,
}: {
  cycleId: string
  locale: Locale
  onNavigate: (tab: string) => void
}) {
  const es = locale === "es",
    [review, setReview] = useState<CycleReview | null>(null),
    [discovery, setDiscovery] = useState<DiscoveryTruth | null>(null),
    [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    Promise.all([api.cycleReview(cycleId), readDiscovery()])
      .then(([r, d]) => {
        if (live) {
          setReview(r.review)
          setDiscovery(d)
        }
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [cycleId])
  if (failed)
    return (
      <p role="alert">
        {es
          ? "No se pudo verificar el progreso. Actualiza antes de decidir."
          : "Progress could not be verified. Refresh before deciding."}
      </p>
    )
  if (!review || !discovery)
    return <p>{es ? "Consultando progreso…" : "Loading progress…"}</p>
  const candidates = candidateManagementTruth(discovery)
  const markets = marketContextCounts(discovery)
  const contacted = candidates.filter((c) => c.contacted)
  const latestSession = discovery.routineOperatingSessions?.[0]
  const recurrenceHeld =
    discovery.productionOperatingState?.recurrence_authorized !== true &&
    latestSession?.status === "HELD_REVIEW"
  const recordedLearning =
    typeof latestSession?.report?.learning === "string"
      ? latestSession.report.learning
      : ""
  const wave = review.waves.at(-1),
    halt =
      !!review.control?.technical_halt || review.control?.state === "STOPPED",
    needsReview = wave?.state === "REVIEW_REQUIRED",
    waveReady = wave?.state === "PLANNED",
    revalidation =
      waveReady &&
      (!wave.members?.length ||
        wave.members.some((m) => m.readinessReason !== "EXECUTABLE_CANDIDATE"))
  return (
    <>
      <section className="acq-panel">
        <h2>{es ? "Qué sigue" : "What happens next"}</h2>
        <p>
          {halt
            ? es
              ? "El ciclo está pausado. Inspecciona el motivo antes de continuar."
              : "The Cycle is paused. Inspect the issue before continuing."
            : needsReview
              ? es
                ? "El grupo de contacto terminó su ventana inicial. Dirección debe revisar resultados."
                : "The wave completed its initial window. Management review is required."
              : revalidation
                ? es
                  ? "El grupo de contacto propuesto necesita revalidación. Revisa sus condiciones pendientes; aún no se puede aprobar."
                  : "The proposed wave needs revalidation. Review its unmet requirements; it cannot be approved yet."
                : waveReady
                  ? es
                    ? "La composición está lista para revisión; aún no autoriza contacto."
                    : "The composition is ready for review; it does not authorize outreach yet."
                  : recurrenceHeld
                    ? es
                      ? "La ventana terminó y la recurrencia está detenida para revisión humana. Las candidatas y la evidencia se conservan."
                      : "The window ended and recurrence is held for Human review. Candidates and evidence remain available."
                    : es
                      ? "El sistema procesa trabajo interno autorizado. El próximo grupo de contacto requiere aprobación exacta."
                      : "The Engine processes authorized internal work. The next wave requires exact approval."}
        </p>
        <button
          onClick={() =>
            onNavigate(
              halt
                ? "SystemStatus"
                : recurrenceHeld
                  ? "Attention"
                  : "Outreach",
            )
          }
        >
          {halt
            ? es
              ? "Inspeccionar problema"
              : "Inspect issue"
            : needsReview
              ? es
                ? "Revisar resultados"
                : "Review results"
              : recurrenceHeld
                ? es
                  ? "Revisar exploración"
                  : "Review discovery"
                : waveReady
                  ? es
                    ? "Revisar grupo de contacto"
                    : "Review wave"
                  : es
                    ? "Ver preparación del grupo"
                    : "View wave preparation"}
        </button>
      </section>
      <section
        className="acq-metrics"
        aria-label={es ? "Progreso del ciclo" : "Cycle progress"}
      >
        <div>
          <span>
            {es ? "Candidatas descubiertas" : "Discovered candidates"}
          </span>
          <strong>{discovery.totals.candidates}</strong>
        </div>
        <div>
          <span>{es ? "Cuentas admitidas" : "Admitted Accounts"}</span>
          <strong>
            {review.discovery?.admitted ?? discovery.totals.admitted} /{" "}
            {review.discovery?.maximum ?? "—"}
          </strong>
        </div>
        <div>
          <span>
            {es ? "Contactadas en exploración" : "Exploratory contacts"}
          </span>
          <strong>{contacted.length}</strong>
        </div>
        {Object.values(review.pool).some((n) => n > 0) &&
          [
            ["READY_NOW", es ? "Listas ahora" : "Ready now"],
            ["RETAINED", es ? "Retenidas" : "Retained"],
            ["HOLD", es ? "Requieren revisión" : "Needs review"],
            ["REJECTED", es ? "Rechazadas" : "Rejected"],
          ].map(([key, label]) => (
            <div key={key}>
              <span>{label}</span>
              <strong>{review.pool[key!] ?? 0}</strong>
            </div>
          ))}
        {Object.values(review.pool).some((n) => n > 0) && (
          <div>
            <span>
              {es
                ? "Contacto activo / intentos gobernados"
                : "Active outreach / governed attempts"}
            </span>
            <strong>
              {review.newProspects} / {review.attempts}
            </strong>
          </div>
        )}
      </section>
      <section className="acq-panel">
        <h2>{es ? "Exploración de mercado" : "Market exploration"}</h2>
        <dl>
          <div>
            <dt>
              {es ? "México · contexto de búsqueda" : "Mexico · search context"}
            </dt>
            <dd>
              {markets.MX} {es ? "candidatas" : "candidates"}
            </dd>
          </div>
          <div>
            <dt>
              {es
                ? "Estados Unidos · contexto de búsqueda"
                : "United States · search context"}
            </dt>
            <dd>
              {markets.US} {es ? "candidatas" : "candidates"}
            </dd>
          </div>
          <div>
            <dt>{es ? "Mixto o incierto" : "Mixed or uncertain"}</dt>
            <dd>{markets.ambiguous}</dd>
          </div>
        </dl>
        <p>
          {es
            ? "Poca evidencia de un mercado significa exploración limitada, no falta de oportunidad. No hay cuotas por país."
            : "Little evidence from a market means limited exploration, not lack of opportunity. There are no country quotas."}
        </p>
      </section>
      {contacted.length > 0 && (
        <section className="acq-panel">
          <h2>{es ? "Contacto y espera" : "Contact and waiting"}</h2>
          {contacted.map((c) => (
            <p key={c.id}>
              <strong>{c.name}</strong> ·{" "}
              {es
                ? "contactada; esperando respuesta"
                : "contacted; waiting for reply"}{" "}
              · {es ? "seguimiento autorizado" : "follow-up authorized"}:{" "}
              {c.followUpAuthority === "NONE"
                ? "No"
                : c.followUpAuthority
                  ? es
                    ? "sólo con autorización exacta"
                    : "only with exact authorization"
                  : es
                    ? "sin confirmar"
                    : "unconfirmed"}
            </p>
          ))}
        </section>
      )}
      <EngineActivity locale={locale} />
      <section className="acq-panel">
        <h2>{es ? "Aprendizaje y resultados" : "Learning and outcomes"}</h2>
        {recordedLearning && (
          <p>
            <strong>
              {es
                ? "Último aprendizaje registrado (idioma original)"
                : "Latest recorded learning"}
              :
            </strong>{" "}
            {recordedLearning.length > 420
              ? `${recordedLearning.slice(0, 420).replace(/\s+\S*$/, "")}…`
              : recordedLearning}
          </p>
        )}
        <p>
          {review.attempts === 0 && contacted.length === 0
            ? es
              ? "Todavía no hay resultados de contacto. La evidencia de investigación y sus límites permanecen disponibles en Oportunidades."
              : "There are no outreach outcomes yet. Research evidence and its limits remain available in Opportunities."
            : `${es ? "Contactos exploratorios registrados" : "Recorded exploratory contacts"}: ${contacted.length} · ${es ? "Respuestas" : "Responses"}: ${Object.values(review.responses).reduce((n, v) => n + v, 0)} · ${es ? "Handoffs" : "Handoffs"}: ${review.funnel?.handoffs ?? 0}`}
        </p>
        <p>
          {es
            ? "No responder no prueba falta de compatibilidad. Las conclusiones de mercado requieren interpretación de Dirección; los ensayos sintéticos no son aprendizaje comercial."
            : "No response does not prove non-fit. Market conclusions require Management interpretation; synthetic rehearsals are not commercial learning."}
        </p>
      </section>
    </>
  )
}

export function OpportunityPool({
  cycleId,
  locale,
  onInspect,
  session,
  onChanged,
}: {
  cycleId: string
  locale: Locale
  onInspect: (id: string) => void
  session?: PortalSession
  onChanged?: () => void
}) {
  const es = locale === "es",
    [items, setItems] = useState<CyclePoolItem[]>([]),
    [discovery, setDiscovery] = useState<DiscoveryTruth | null>(null),
    [discoveryFailed, setDiscoveryFailed] = useState(false),
    [failed, setFailed] = useState(false),
    [more, setMore] = useState(false),
    [pending, setPending] = useState(false)
  useEffect(() => {
    let live = true
    if (!cycleId) return
    readDiscovery()
      .then((d) => {
        if (live) setDiscovery(d)
      })
      .catch(() => {
        if (live) setDiscoveryFailed(true)
      })
    api
      .cyclePool(cycleId)
      .then((r) => {
        if (live) {
          setItems(r.items)
          setMore(r.items.length === 25)
        }
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    return () => {
      live = false
    }
  }, [cycleId])
  async function next() {
    setPending(true)
    try {
      const r = await api.cyclePool(cycleId, items.at(-1)?.account_id)
      setItems((old) => [...old, ...r.items])
      setMore(r.items.length === 25)
    } catch {
      setFailed(true)
    } finally {
      setPending(false)
    }
  }
  return (
    <section>
      <h2>{es ? "Oportunidades" : "Opportunities"}</h2>
      <p>
        {es
          ? "No seleccionada no significa rechazada. La evidencia y las oportunidades se conservan fuera del grupo de contacto."
          : "Not selected does not mean rejected. Evidence and opportunities remain available outside the wave."}
      </p>
      {discovery && (
        <CandidateOpportunities
          data={discovery}
          locale={locale}
          session={session}
          onChanged={onChanged}
        />
      )}
      {discoveryFailed && (
        <p role="alert">
          {es
            ? "No se pudo verificar el inventario de candidatas; el conjunto de cuentas no representa toda la oportunidad."
            : "Candidate inventory could not be verified; the Account pool is not the whole opportunity."}
        </p>
      )}
      <h3>{es ? "Cuentas admitidas" : "Admitted Accounts"}</h3>
      {!items.length && (
        <p className="acq-muted">
          {es
            ? "Todavía no hay cuentas admitidas. El conjunto de candidatas se conserva."
            : "No Accounts admitted yet. The Candidate pool above remains durable."}
        </p>
      )}
      {failed && (
        <p role="alert">
          {es
            ? "No se pudo verificar el conjunto completo."
            : "The complete pool could not be verified."}
        </p>
      )}
      {!cycleId && (
        <p className="acq-empty">
          {es
            ? "Todavía no se han investigado empresas reales."
            : "No real companies have been researched yet."}
        </p>
      )}
      {items.length > 0 &&
        [
          ["READY_NOW", es ? "Listas ahora" : "Ready now"],
          ["RETAINED", es ? "Retenidas" : "Retained"],
          ["HOLD", es ? "Requieren revisión" : "Needs review"],
          [
            "REJECTED",
            es ? "Rechazadas con evidencia" : "Evidence-supported rejection",
          ],
        ].map(([key, label]) => (
          <section className="acq-panel" key={key}>
            <h3>{label}</h3>
            {!items.some((i) => i.pool_state === key) && (
              <p>
                {es
                  ? "Sin oportunidades en esta página."
                  : "No opportunities on this page."}
              </p>
            )}
            <div className="acq-cards">
              {items
                .filter((i) => i.pool_state === key)
                .map((i) => (
                  <article key={i.account_id}>
                    <h4>{i.display_name}</h4>
                    <p>
                      {i.country ??
                        (es
                          ? "País sin confirmar"
                          : "Country unconfirmed")}{" "}
                      · {i.canonical_domain}
                    </p>
                    <p>
                      {i.intervention_hypothesis
                        ? es
                          ? "Existe una hipótesis de intervención respaldada; revisa la evidencia antes de decidir."
                          : "A supported intervention hypothesis exists; review the evidence before deciding."
                        : es
                          ? "La hipótesis de intervención todavía necesita evidencia."
                          : "The intervention hypothesis still needs evidence."}
                    </p>
                    <p>
                      {es ? "Responsable" : "Problem owner"}:{" "}
                      {i.buyer_name ??
                        i.buyer_role_hypothesis ??
                        (es ? "Sin resolver" : "Unresolved")}
                    </p>
                    <p>
                      {i.channel === "EMAIL"
                        ? es
                          ? "Email respaldado; sujeto a los gates de ejecución."
                          : "Supported email; execution gates still apply."
                        : es
                          ? "Sin canal ejecutable confirmado."
                          : "No confirmed executable channel."}
                    </p>
                    <p>{readinessText(i.readiness_reason, locale)}</p>
                    {(i.intervention_hypothesis || i.buyer_role_hypothesis) && (
                      <details>
                        <summary>
                          {es
                            ? "Texto original del Engine"
                            : "Original Engine text"}
                        </summary>
                        {i.intervention_hypothesis && (
                          <p>
                            {es ? "Hipótesis original" : "Original hypothesis"}:{" "}
                            {i.intervention_hypothesis}
                          </p>
                        )}
                        {i.buyer_role_hypothesis && (
                          <p>
                            {es
                              ? "Rol comprador original"
                              : "Original buyer role"}
                            : {i.buyer_role_hypothesis}
                          </p>
                        )}
                      </details>
                    )}
                    <button onClick={() => onInspect(i.account_id)}>
                      {es
                        ? "Revisar evidencia y siguiente acción"
                        : "Review evidence and next action"}
                    </button>
                  </article>
                ))}
            </div>
          </section>
        ))}
      {more && (
        <button disabled={pending} onClick={() => void next()}>
          {es ? "Mostrar más oportunidades" : "Show more opportunities"}
        </button>
      )}
    </section>
  )
}

/** Management decisions only; routine queued research is not Human Attention. */
export function CycleAttention({
  cycleId,
  locale,
  onNavigate,
}: {
  cycleId: string
  locale: Locale
  onNavigate: (tab: string) => void
}) {
  const [review, setReview] = useState<CycleReview | null>(null),
    [discovery, setDiscovery] = useState<DiscoveryTruth | null>(null),
    [failed, setFailed] = useState(false),
    [discoveryFailed, setDiscoveryFailed] = useState(false),
    [inspectWindow, setInspectWindow] = useState(false)
  useEffect(() => {
    let live = true
    api
      .cycleReview(cycleId)
      .then((r) => {
        if (live) setReview(r.review)
      })
      .catch(() => {
        if (live) setFailed(true)
      })
    readDiscovery()
      .then((d) => {
        if (live) setDiscovery(d)
      })
      .catch(() => {
        if (live) setDiscoveryFailed(true)
      })
    return () => {
      live = false
    }
  }, [cycleId])
  const es = locale === "es",
    wave = review?.waves.at(-1),
    latest = discovery?.routineOperatingSessions?.[0],
    halt =
      review?.control?.technical_halt || review?.control?.state === "STOPPED"
  if (failed)
    return (
      <p role="alert">
        {es
          ? "No se pudo verificar la revisión del ciclo."
          : "Cycle review could not be verified."}
      </p>
    )
  if (discoveryFailed)
    return (
      <p role="alert">
        {es
          ? "No se pudo verificar la ventana vigente; no se asume que no haya decisiones pendientes."
          : "The current window could not be verified; no-decision is not assumed."}
      </p>
    )
  if (!review)
    return <p>{es ? "Consultando decisiones…" : "Loading decisions…"}</p>
  const waveDecision = ["PLANNED", "REVIEW_REQUIRED"].includes(
    wave?.state ?? "",
  )
  const continuous =
    discovery?.productionOperatingState?.current === true &&
    discovery.productionOperatingState.recurrence_authorized === true
  const portalAcceptancePending = !continuous && !halt && !waveDecision
  const lastDecision = latest?.decisions.at(-1)
  const strongestValue =
    lastDecision?.strongestAlternative ?? lastDecision?.strongest_alternative
  const strongest =
    strongestValue && typeof strongestValue === "object"
      ? (strongestValue as Record<string, unknown>)
      : null
  const executed = latest
    ? latest.decisions.filter((decision) => {
        const outcome = decision.outcome
        return (
          decision.decision !== "STOP" &&
          outcome &&
          typeof outcome === "object" &&
          ("work_item_id" in outcome || "workItemId" in outcome)
        )
      }).length
    : 0
  const requests = Number(latest?.capacity.requestsUsed ?? 0)
  return (
    <section className="acq-panel">
      <h2>
        {halt
          ? es
            ? "Ciclo pausado"
            : "Cycle paused"
          : wave?.state === "REVIEW_REQUIRED"
            ? es
              ? "Revisar resultados del grupo de contacto"
              : "Review wave outcomes"
            : wave?.state === "PLANNED"
              ? es
                ? "Revisar preparación del grupo de contacto"
                : "Review wave preparation"
              : continuous
                ? es
                  ? "El Engine continúa automáticamente"
                  : "The Engine continues automatically"
                : es
                  ? "Aceptación humana del Portal pendiente"
                  : "Human Portal acceptance pending"}
      </h2>
      <p>
        {halt
          ? es
            ? "Una condición técnica o de Dirección impide continuar."
            : "A technical or Management condition prevents progression."
          : waveDecision
            ? es
              ? "La composición y su evidencia necesitan una decisión de Dirección; el planificador no aprueba grupos de contacto."
              : "Composition and evidence require a Management decision; the scheduler does not approve waves."
            : continuous
              ? es
                ? "La aceptación del Portal está registrada y la recurrencia diaria está activa. El Engine trabaja dentro de sus límites y se detiene donde se requiere Dirección."
                : "Portal acceptance is recorded and daily recurrence is active. The Engine works within its limits and stops where Management is required."
              : es
                ? "La decisión operacional anterior ya fue aceptada técnicamente. Ahora se requiere revisar si este Portal permite entender y dirigir Acquisition."
                : "The prior operating decision has already been technically accepted. The remaining review is whether this Portal makes Acquisition understandable and manageable."}
      </p>
      {review.control?.technical_halt && <p>{review.control.technical_halt}</p>}
      {portalAcceptancePending ? (
        <>
          <p className="acq-muted">
            {es
              ? "Después de la aceptación, habilitar recurrencia seguirá siendo una decisión humana separada. No hay seguimiento ni acción comercial pendientes."
              : "After acceptance, enabling recurrence remains a separate Human decision. No follow-up or commercial action is pending."}
          </p>
          <button
            aria-expanded={inspectWindow}
            onClick={() => setInspectWindow((value) => !value)}
          >
            {es ? "Inspeccionar decisión" : "Inspect decision"}
          </button>
          {inspectWindow && (
            <div
              className="acq-decision"
              aria-label={es ? "Decisión operativa" : "Operating decision"}
            >
              <h3>{es ? "Qué ocurrió" : "What happened"}</h3>
              <p>
                {es
                  ? "La última ventana cerró después de una decisión comparativa. El sistema decidió no gastar capacidad de investigación."
                  : "The latest window closed after one comparative decision. The Engine chose not to spend research capacity."}
              </p>
              <h3>
                {es ? "Alternativas consideradas" : "Alternatives considered"}
              </h3>
              <ul>
                <li>
                  {es
                    ? "Una lectura de identidad de bajo costo, descartada por redundancia."
                    : "A low-cost identity read, declined because it was redundant."}
                </li>
                <li>
                  {es
                    ? "Nueva exploración dirigida, disponible pero sin suficiente valor esperado para justificar seis consultas."
                    : "New targeted discovery, available but without enough expected value to justify six requests."}
                </li>
                <li>
                  {es
                    ? "Esperar y conservar capacidad."
                    : "Defer and preserve capacity."}
                </li>
              </ul>
              <h3>{es ? "Decisión y motivo" : "Decision and reason"}</h3>
              <p>
                <strong>{es ? "Esperar." : "Defer."}</strong>{" "}
                {es
                  ? "Ninguna alternativa superó el umbral de información capaz de cambiar una decisión."
                  : "No alternative cleared the threshold for information capable of changing a decision."}
              </p>
              <h3>
                {es ? "Ejecución y aprendizaje" : "Execution and learning"}
              </h3>
              <p>
                {executed} {es ? "tareas ejecutadas" : "tasks executed"} ·{" "}
                {requests} {es ? "consultas de fuente" : "source requests"}.{" "}
                {es
                  ? "No hubo evidencia nueva de empresas; sólo se confirmó que repetir rutas redundantes no justificaba capacidad."
                  : "No new company evidence was obtained; the result only confirmed that repeating redundant paths did not justify capacity."}
              </p>
              <h3>
                {es
                  ? "Autoridad y decisión pendiente"
                  : "Authority and pending decision"}
              </h3>
              <p>
                {es
                  ? "La recurrencia continúa detenida, el seguimiento de Scania no está autorizado y no hay acción comercial pendiente. La única decisión actual es la aceptación humana del Portal."
                  : "Recurrence remains held, Scania follow-up is unauthorized, and no commercial action is pending. The only current decision is Human Portal acceptance."}
              </p>
              {(latest?.report || strongest) && (
                <details>
                  <summary>
                    {es
                      ? "Registro original del Engine"
                      : "Original Engine record"}
                  </summary>
                  {strongest && <pre>{JSON.stringify(strongest, null, 2)}</pre>}
                  {latest?.report && (
                    <pre>{JSON.stringify(latest.report, null, 2)}</pre>
                  )}
                </details>
              )}
            </div>
          )}
        </>
      ) : (
        <button onClick={() => onNavigate("Outreach")}>
          {es ? "Inspeccionar decisión" : "Inspect decision"}
        </button>
      )}
    </section>
  )
}
