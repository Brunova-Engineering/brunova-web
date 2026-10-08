import type { Locale } from "@/lib/i18n"
import {
  candidateManagementTruth,
  candidateNameGroups,
  marketContextCounts,
  type DiscoveryTruth,
} from "@/lib/acquisition-management-truth"

type CandidateView = ReturnType<typeof candidateManagementTruth>[number]
const quality = (value: string, es: boolean) =>
  ({
    JUSTIFIED: es ? "justificada" : "justified",
    QUESTIONABLE: es ? "cuestionable" : "questionable",
    WASTED: es ? "sin valor proporcional" : "not proportionate",
    BLOCKED: es ? "bloqueada" : "blocked",
  })[value] ?? value.toLocaleLowerCase()
const dimension = (value: string, es: boolean) =>
  ({
    COMPANY: es ? "empresa" : "company",
    JOB: es ? "vacantes" : "jobs",
    SOCIAL: "social",
  })[value] ?? value.toLocaleLowerCase()
const preview = (value: string, limit = 120) =>
  value.length <= limit
    ? value
    : `${value.slice(0, limit).replace(/\s+\S*$/, "")}…`

function CandidateRecord({
  candidate,
  locale,
  label,
}: {
  candidate: CandidateView
  locale: Locale
  label?: string
}) {
  const es = locale === "es"
  const identity =
    candidate.identity === "RESOLVED"
      ? es
        ? "Identidad respaldada"
        : "Identity supported"
      : candidate.identity === "AMBIGUOUS"
        ? es
          ? "Identidad ambigua"
          : "Identity ambiguous"
        : es
          ? "Identidad pendiente"
          : "Identity unresolved"
  const state = candidate.contacted
    ? es
      ? "Conservada · Contactada · Esperando respuesta"
      : "Retained · Contacted · Waiting for reply"
    : candidate.screen === "SUPPORTED_DISMISSAL"
      ? es
        ? "Descartada con evidencia · Reconsiderable"
        : "Dismissed with evidence · Reconsiderable"
      : es
        ? "Conservada · Investigación pendiente"
        : "Retained · Research pending"
  return (
    <article className="acq-candidate-record">
      <div className="acq-record-head">
        <div>
          {label && <span className="acq-eyebrow">{label}</span>}
          <h4>{candidate.name}</h4>
        </div>
        <span className="acq-state">{state}</span>
      </div>
      <p className="acq-record-context">
        {es ? "Búsqueda" : "Search"}:{" "}
        {candidate.searchMarkets.join(" / ") ||
          (es ? "sin confirmar" : "unconfirmed")}
        <span aria-hidden="true"> · </span>
        {identity}
        <span aria-hidden="true"> · </span>
        {es ? "Evidencia" : "Evidence"}:{" "}
        {candidate.coverage.length
          ? candidate.coverage.map((value) => dimension(value, es)).join(" / ")
          : es
            ? "sin dimensión confirmada"
            : "no confirmed dimension"}
      </p>
      <p className="acq-record-question">
        <span>{es ? "Pregunta abierta" : "Open question"}</span>
        {preview(
          candidate.unknown ||
            (es
              ? "Identidad e intervención aún por corroborar."
              : "Identity and intervention still need corroboration."),
        )}
      </p>
      {candidate.nextAction && (
        <p className="acq-record-next">
          <span>{es ? "Siguiente paso" : "Next step"}</span>
          {preview(candidate.nextAction)}
        </p>
      )}
      {candidate.contacted && (
        <p className="acq-record-boundary">
          {es
            ? "Un mensaje físico · esperando respuesta · seguimiento: "
            : "One physical message · waiting for reply · follow-up: "}
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
      )}
      <details>
        <summary>
          {es ? "Evidencia y recorrido" : "Evidence and journey"}
        </summary>
        {candidate.known && (
          <p>
            <strong>{es ? "Observado" : "Observed"}:</strong> {candidate.known}
          </p>
        )}
        {candidate.target?.why && (
          <p>
            <strong>{es ? "Por qué se consideró" : "Why considered"}:</strong>{" "}
            {candidate.target.why}
          </p>
        )}
        {candidate.sourceHypothesis && (
          <p>
            <strong>{es ? "Hipótesis de fuente" : "Source hypothesis"}:</strong>{" "}
            {candidate.sourceHypothesis}
          </p>
        )}
        {candidate.discoveryReason && (
          <p>
            <strong>{es ? "Origen" : "Origin"}:</strong>{" "}
            {candidate.discoveryReason}
          </p>
        )}
        {candidate.lastWorkQuality && (
          <p>
            {es ? "Calidad de investigación" : "Research quality"}:{" "}
            {quality(candidate.lastWorkQuality, es)}
          </p>
        )}
        <p>
          {es ? "Fuentes" : "Sources"}: {candidate.sources.join(", ") || "—"} ·{" "}
          {es ? "Avistamientos" : "Sightings"}: {candidate.sightings}
        </p>
        <p>
          {es ? "Última observación" : "Last observation"}:{" "}
          {candidate.lastAction ?? "—"}
        </p>
        {candidate.contacted && (
          <p>
            {es
              ? "Próxima revisión, no autorización de envío"
              : "Next review, not send authority"}
            : {candidate.nextReviewAt ?? "—"} ·{" "}
            {es ? "Intentos técnicos" : "Technical attempts"}:{" "}
            {candidate.exactEffect?.logical_attempts ?? "—"}
          </p>
        )}
        <details>
          <summary>{es ? "Detalle técnico" : "Technical detail"}</summary>
          <p>
            {es ? "Registro" : "Record"}: {candidate.id}
          </p>
          <p>{candidate.missingCodes.join(" · ") || "—"}</p>
        </details>
      </details>
    </article>
  )
}

export function CandidateInventory({
  data,
  locale,
}: {
  data: DiscoveryTruth
  locale: Locale
  compact?: boolean
}) {
  const es = locale === "es"
  const candidates = candidateManagementTruth(data)
  const groups = candidateNameGroups(candidates)
  const markets = marketContextCounts(data)
  return (
    <section
      aria-label={es ? "Inventario de candidatas" : "Candidate inventory"}
    >
      <div className="acq-section-heading">
        <div>
          <h3>{es ? "Inventario descubierto" : "Discovered inventory"}</h3>
          <p className="acq-muted">
            {data.totals.resolved}{" "}
            {es ? "identidad respaldada" : "supported identity"} ·{" "}
            {data.totals.unresolved} {es ? "por resolver" : "unresolved"}
          </p>
        </div>
        <p>
          {es ? "Contexto de búsqueda" : "Search context"}: MX {markets.MX} · US{" "}
          {markets.US} · {es ? "mixto" : "mixed"} {markets.ambiguous}
        </p>
      </div>
      <p className="acq-muted">
        {es
          ? "El contexto de búsqueda no confirma domicilio; una candidata aún no es un Account calificado."
          : "Search context does not establish domicile; a candidate is not yet a qualified Account."}
      </p>
      <div className="acq-inventory-list">
        {groups.map((group) =>
          group.length === 1 ? (
            <CandidateRecord
              key={group[0].id}
              candidate={group[0]}
              locale={locale}
            />
          ) : (
            <section
              className="acq-same-name"
              key={group[0].name.toLocaleLowerCase()}
            >
              <div className="acq-record-head">
                <h4>
                  {group[0].name} — {group.length}{" "}
                  {es ? "registros sin resolver" : "unresolved records"}
                </h4>
                <span className="acq-state">
                  {es ? "Identidad sin fusionar" : "Identity not merged"}
                </span>
              </div>
              <p className="acq-muted">
                {es
                  ? "Comparten nombre, no identidad demostrada. Se conservan separados hasta obtener evidencia que permita vincularlos."
                  : "They share a name, not a proven identity. Records remain separate until evidence supports linking them."}
              </p>
              <div className="acq-same-name-records">
                {group.map((candidate, index) => (
                  <CandidateRecord
                    key={candidate.id}
                    candidate={candidate}
                    locale={locale}
                    label={`${es ? "Registro" : "Record"} ${String.fromCharCode(65 + index)}`}
                  />
                ))}
              </div>
            </section>
          ),
        )}
      </div>
      {data.totals.candidates > candidates.length && (
        <p className="acq-muted">
          {es
            ? "Se muestran los registros recientes; el total incluye toda la memoria."
            : "Recent records shown; the total covers durable memory."}
        </p>
      )}
    </section>
  )
}
