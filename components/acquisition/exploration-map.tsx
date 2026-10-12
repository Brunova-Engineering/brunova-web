"use client"

import { useEffect, useMemo, useState } from "react"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type MapData = Awaited<ReturnType<typeof acquisitionApi.explorationMap>>
type MapNode = MapData["nodes"][number]
type Chain = MapData["chainProgress"][number]

const stages = [
  "MACRO_INDUSTRY",
  "SPECIALTY",
  "ACTIVITY",
  "SUPPLY_CHAIN",
  "LINK",
  "COMPANY_LEAD",
] as const

const stageNames = {
  es: [
    "Macroindustria",
    "Especialidad",
    "Actividad o mercado",
    "Cadena de suministro",
    "Eslabón o función",
    "Empresa candidata",
  ],
  en: [
    "Macro industry",
    "Specialty",
    "Activity or market",
    "Supply chain",
    "Link or function",
    "Candidate company",
  ],
}

function field(node: MapNode, key: string): string | null {
  const value = node.attributes[key]
  return typeof value === "string" && value.trim() ? value : null
}

function sourceLinks(node: MapNode) {
  const urls = new Set<string>()
  for (const claim of node.claims) {
    if (!claim.source_url) continue
    try {
      const url = new URL(claim.source_url)
      if (url.protocol === "https:" || url.protocol === "http:")
        urls.add(url.href)
    } catch {
      // Malformed source text remains in the record without becoming a link.
    }
  }
  return [...urls]
}

function safeHttpUrl(value: string | null | undefined): URL | null {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:" ? url : null
  } catch {
    return null
  }
}

function presenceStatus(status: string, locale: Locale) {
  if (status === "OBSERVED")
    return locale === "es" ? "Observado · evidencia" : "Observed · evidence"
  if (status === "INFERRED") return locale === "es" ? "Inferido" : "Inferred"
  if (status === "UNVERIFIED")
    return locale === "es" ? "Sin verificar" : "Unverified"
  return status.replaceAll("_", " ")
}

function childrenOf(nodes: MapNode[], parent: MapNode, kind: string) {
  return nodes.filter(
    (node) =>
      node.kind === kind &&
      node.parents.some((relation) => relation.parentId === parent.id),
  )
}

function optionDetail(
  node: MapNode,
  stage: number,
  nodes: MapNode[],
  progress: Map<string, Chain>,
  locale: Locale,
) {
  if (stage === 5)
    return field(node, "chainRole") === "ANCHOR"
      ? locale === "es"
        ? "Actor ancla · referencia de la cadena"
        : "Anchor · chain reference"
      : locale === "es"
        ? "Empresa candidata · pista"
        : "Candidate company · lead"

  const nextKind = stages[stage + 1]
  if (!nextKind) return ""
  const count = childrenOf(nodes, node, nextKind).length
  if (stage === 3) {
    const chain = progress.get(node.id)
    return locale === "es"
      ? `${count} ${count === 1 ? "eslabón registrado" : "eslabones registrados"} · ${chain?.company_lead_count ?? 0} pistas de empresas · cobertura sin confirmar`
      : `${count} recorded ${count === 1 ? "link" : "links"} · ${chain?.company_lead_count ?? 0} company leads · coverage unconfirmed`
  }
  const nextName = (stageNames[locale][stage + 1] ?? "").toLowerCase()
  return locale === "es"
    ? `${count} ${count === 1 ? "rama registrada" : "ramas registradas"} de ${nextName}`
    : `${count} recorded ${count === 1 ? "branch" : "branches"} of ${nextName}`
}

function mapState(node: MapNode, locale: Locale) {
  if (node.state === "TRAVERSED")
    return locale === "es"
      ? "Recorrida · cobertura no confirmada"
      : "Traversed · coverage unconfirmed"
  if (node.state === "ACTIVE")
    return locale === "es" ? "En exploración" : "Being explored"
  return locale === "es"
    ? "Pendiente de profundizar"
    : "Further exploration pending"
}

export function ExplorationMap({
  cycleId,
  locale,
  session,
}: {
  cycleId: string
  locale: Locale
  session: PortalSession
}) {
  const [data, setData] = useState<MapData | null>(null)
  const [error, setError] = useState(false)
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>(
    stages.map(() => null),
  )
  const [activeStage, setActiveStage] = useState(0)
  const [decisionReason, setDecisionReason] = useState<Record<string, string>>(
    {},
  )
  const [decisionOperation, setDecisionOperation] = useState<
    Record<string, DecisionOperation>
  >({})
  const [decisionPending, setDecisionPending] = useState<string | null>(null)
  const [decisionNotice, setDecisionNotice] = useState("")

  type DecisionOperation =
    "PRIORITIZE" | "PAUSE_BRANCH" | "DISCARD_BRANCH" | "REOPEN_BRANCH"

  useEffect(() => {
    let live = true
    acquisitionApi
      .explorationMap(cycleId)
      .then((value) => {
        if (live) {
          setData(value)
          setError(false)
        }
      })
      .catch(() => {
        if (live) setError(true)
      })
    return () => {
      live = false
    }
  }, [cycleId])

  const nodes = useMemo(() => data?.nodes ?? [], [data])
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  )
  const progress = useMemo(
    () =>
      new Map(
        (data?.chainProgress ?? []).map((chain) => [chain.chain_id, chain]),
      ),
    [data],
  )
  const governance = data?.governance ?? []
  const canManage = session.actor.capabilities.includes("MANAGE_CYCLE")

  function equivalentChainIds(chainId: string) {
    const counterparts = new Set<string>()
    for (const relation of data?.chainEquivalences ?? []) {
      if (relation.chain_id === chainId)
        counterparts.add(relation.counterpart_id)
      if (relation.counterpart_id === chainId)
        counterparts.add(relation.chain_id)
    }
    return counterparts
  }

  function equivalencesForChain(chainId: string) {
    const unique = new Map<string, MapData["chainEquivalences"][number]>()
    for (const relation of data?.chainEquivalences ?? []) {
      if (relation.chain_id !== chainId && relation.counterpart_id !== chainId)
        continue
      const first =
        relation.chain_id < relation.counterpart_id
          ? relation.chain_id
          : relation.counterpart_id
      const second =
        relation.chain_id < relation.counterpart_id
          ? relation.counterpart_id
          : relation.chain_id
      const key = `${first}|${second}`
      if (!unique.has(key))
        unique.set(key, {
          ...relation,
          chain_id: first,
          counterpart_id: second,
        })
    }
    return [...unique.values()].filter(
      (relation) => relation.chain_id === chainId,
    )
  }
  const selected = stages.map((kind, index) => {
    const node = byId.get(selectedIds[index] ?? "")
    return node?.kind === kind ? node : null
  })
  const parent = activeStage > 0 ? selected[activeStage - 1] : null
  const options = (() => {
    const allowedParentIds =
      activeStage === 4 && parent
        ? new Set([parent.id, ...equivalentChainIds(parent.id)])
        : parent
          ? new Set([parent.id])
          : new Set<string>()
    const candidates = nodes.filter((node) => {
      if (node.kind !== stages[activeStage]) return false
      if (activeStage === 0) return node.parents.length === 0
      return parent
        ? node.parents.some((item) => allowedParentIds.has(item.parentId))
        : false
    })
    const deduplicated = [
      ...new Map(candidates.map((node) => [node.id, node])).values(),
    ]
    return deduplicated.sort((a, b) => {
      if (activeStage === 0 && a.market !== b.market)
        return a.market === "MX" ? -1 : 1
      if (activeStage === 5) {
        const aAnchor = field(a, "chainRole") === "ANCHOR"
        const bAnchor = field(b, "chainRole") === "ANCHOR"
        if (aAnchor !== bAnchor) return aAnchor ? 1 : -1
      }
      const nextKind = stages[activeStage + 1]
      if (nextKind) {
        const difference =
          childrenOf(nodes, b, nextKind).length -
          childrenOf(nodes, a, nextKind).length
        if (difference) return difference
      }
      return a.label.localeCompare(b.label, locale)
    })
  })()
  const company = selected[5]
  const currentStageName = stageNames[locale][activeStage] ?? ""

  function choose(node: MapNode) {
    setSelectedIds((previous) =>
      previous.map((id, index) =>
        index < activeStage ? id : index === activeStage ? node.id : null,
      ),
    )
    if (activeStage < stages.length - 1) setActiveStage(activeStage + 1)
  }

  async function recordDecision(node: MapNode) {
    const reason = decisionReason[node.id]?.trim() ?? ""
    if (!reason || !canManage) return
    const header = data?.headers.find((item) => item.market === node.market)
    if (!header) {
      setDecisionNotice(
        locale === "es"
          ? "No hay versión vigente para este mercado."
          : "No current version is available for this market.",
      )
      return
    }
    const operation = decisionOperation[node.id] ?? "PRIORITIZE"
    setDecisionPending(node.id)
    setDecisionNotice("")
    try {
      await acquisitionApi.explorationHumanDecision(
        crypto.randomUUID(),
        {
          cycleId,
          market: node.market,
          nodeId: node.id,
          operation,
          reason,
          expectedVersion: header.version,
        },
        session.csrfToken,
      )
      const updated = await acquisitionApi.explorationMap(cycleId)
      setData(updated)
      setDecisionReason((previous) => ({ ...previous, [node.id]: "" }))
      setDecisionNotice(
        locale === "es" ? "Decisión registrada." : "Decision recorded.",
      )
    } catch {
      setDecisionNotice(
        locale === "es"
          ? "No se pudo registrar la decisión. Revisa la versión vigente e inténtalo de nuevo."
          : "The decision could not be recorded. Check the current version and try again.",
      )
    } finally {
      setDecisionPending(null)
    }
  }

  function nodeDecision(node: MapNode) {
    const matching = governance.filter((item) => item.node_id === node.id)
    if (!matching.length) return null
    return (
      <div
        className="acq-exploration-governance"
        aria-label={
          locale === "es" ? "Decisiones de gestión" : "Management decisions"
        }
      >
        {matching.map((item, index) => (
          <p key={`${item.node_id}:${item.updated_at}:${index}`}>
            <strong>
              {item.decision === "REOPENED"
                ? locale === "es"
                  ? "Rama reabierta"
                  : "Branch reopened"
                : item.decision.replaceAll("_", " ")}
              {item.priority ? ` · ${item.priority}` : ""}
            </strong>
            {item.reason && <span>{item.reason}</span>}
            <small>
              {item.actor_id ? `${item.actor_id} · ` : ""}
              {new Date(item.updated_at).toLocaleString(
                locale === "es" ? "es-MX" : "en-US",
              )}
            </small>
            {item.history?.slice(-1).map((entry) => (
              <small key={entry.recorded_at}>
                {locale === "es" ? "Anterior" : "Previous"}:{" "}
                {entry.operation.replaceAll("_", " ")}
                {entry.reason ? ` · ${entry.reason}` : ""}
                {entry.actor_id ? ` · ${entry.actor_id}` : ""} ·{" "}
                {new Date(entry.recorded_at).toLocaleString(
                  locale === "es" ? "es-MX" : "en-US",
                )}
              </small>
            ))}
          </p>
        ))}
      </div>
    )
  }

  function coverageForChain(node: MapNode) {
    const counterpartIds = [...equivalentChainIds(node.id)]
    const relatedIds = new Set([node.id, ...counterpartIds])
    const entries = (data?.chainCoverage ?? []).filter((item) =>
      relatedIds.has(item.chain_id),
    )
    if (!entries.length) return null
    return (
      <div
        className="acq-exploration-coverage"
        aria-label={
          locale === "es"
            ? "Esfuerzo de exploración por mercado"
            : "Exploration effort by market"
        }
      >
        <strong>
          {locale === "es"
            ? "Esfuerzo registrado por mercado"
            : "Recorded effort by market"}
        </strong>
        {entries.map((item) => {
          const gaps = Array.isArray(item.open_gaps)
            ? item.open_gaps
                .map((gap) =>
                  typeof gap === "string" ? gap : JSON.stringify(gap),
                )
                .join("; ")
            : item.open_gaps == null
              ? ""
              : typeof item.open_gaps === "string"
                ? item.open_gaps
                : JSON.stringify(item.open_gaps)
          return (
            <div key={`${item.chain_id}:${item.market}:${item.updated_at}`}>
              <p>
                <span className="acq-market-badge">{item.market}</span>{" "}
                <strong>
                  {item.status === "ATTEMPTED"
                    ? locale === "es"
                      ? "Búsqueda intentada"
                      : "Search attempted"
                    : locale === "es"
                      ? "Investigación agotada"
                      : "Research exhausted"}
                </strong>
              </p>
              <p>{item.summary}</p>
              <p>
                {locale === "es" ? "Brechas abiertas" : "Open gaps"}:{" "}
                {gaps ||
                  (locale === "es" ? "Ninguna registrada" : "None recorded")}
              </p>
              <small>
                {locale === "es"
                  ? "Este estado no confirma que se hayan encontrado todos los eslabones."
                  : "This status does not confirm that all links were found."}
                {item.actor_id ? ` · ${item.actor_id}` : ""} ·{" "}
                {new Date(item.updated_at).toLocaleString(
                  locale === "es" ? "es-MX" : "en-US",
                )}
              </small>
            </div>
          )
        })}
      </div>
    )
  }

  function decisionControls(node: MapNode) {
    if (!canManage) return null
    const operations: DecisionOperation[] = [
      "PRIORITIZE",
      "PAUSE_BRANCH",
      "DISCARD_BRANCH",
      "REOPEN_BRANCH",
    ]
    const labels: Record<DecisionOperation, string> =
      locale === "es"
        ? {
            PRIORITIZE: "Priorizar",
            PAUSE_BRANCH: "Pausar rama",
            DISCARD_BRANCH: "Descartar rama",
            REOPEN_BRANCH: "Reabrir rama",
          }
        : {
            PRIORITIZE: "Prioritize",
            PAUSE_BRANCH: "Pause branch",
            DISCARD_BRANCH: "Discard branch",
            REOPEN_BRANCH: "Reopen branch",
          }
    return (
      <details className="acq-exploration-decision">
        <summary>
          {locale === "es" ? "Registrar decisión" : "Record a decision"}
        </summary>
        <label>
          <span>{locale === "es" ? "Acción" : "Action"}</span>
          <select
            value={decisionOperation[node.id] ?? "PRIORITIZE"}
            onChange={(event) =>
              setDecisionOperation((previous) => ({
                ...previous,
                [node.id]: event.target.value as DecisionOperation,
              }))
            }
          >
            {operations.map((operation) => (
              <option key={operation} value={operation}>
                {labels[operation]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>
            {locale === "es" ? "Motivo requerido" : "Reason required"}
          </span>
          <textarea
            rows={2}
            value={decisionReason[node.id] ?? ""}
            onChange={(event) =>
              setDecisionReason((previous) => ({
                ...previous,
                [node.id]: event.target.value,
              }))
            }
          />
        </label>
        <button
          type="button"
          disabled={
            !decisionReason[node.id]?.trim() || decisionPending !== null
          }
          onClick={() => void recordDecision(node)}
        >
          {decisionPending === node.id
            ? locale === "es"
              ? "Guardando…"
              : "Saving…"
            : locale === "es"
              ? "Guardar decisión"
              : "Save decision"}
        </button>
      </details>
    )
  }

  return (
    <section
      className="acq-panel acq-exploration"
      aria-label={locale === "es" ? "Mapa de exploración" : "Exploration map"}
    >
      <span className="acq-eyebrow">
        {locale === "es" ? "Exploración dirigida" : "Directed exploration"}
      </span>
      <h2>
        {locale === "es"
          ? "De la industria a la empresa"
          : "From industry to company"}
      </h2>
      <p className="acq-muted">
        {locale === "es"
          ? "Selecciona una rama en cada nivel para ver todas sus vertientes registradas. Una entrega de cadena no demuestra que se hayan encontrado todos sus eslabones."
          : "Select a branch at each level to see all recorded alternatives. A chain delivery does not prove that all its links have been found."}
      </p>
      {error && (
        <p role="alert" className="acq-muted">
          {locale === "es"
            ? "No se pudo leer el mapa actual."
            : "The current map could not be loaded."}
        </p>
      )}
      {!error && !data && (
        <p className="acq-muted">
          {locale === "es" ? "Cargando mapa…" : "Loading map…"}
        </p>
      )}
      {data && (
        <>
          <ol
            className="acq-zoom-path"
            aria-label={
              locale === "es"
                ? "Recorrido de industria a empresa"
                : "Path from industry to company"
            }
          >
            {stages.map((kind, index) => (
              <li
                key={kind}
                className={selected[index] ? "" : "acq-zoom-missing"}
              >
                <button
                  type="button"
                  disabled={index > 0 && !selected[index - 1]}
                  aria-current={activeStage === index ? "step" : undefined}
                  onClick={() => setActiveStage(index)}
                >
                  <span>
                    {index + 1}. {stageNames[locale][index]}
                  </span>
                  <strong>
                    {selected[index]?.label ??
                      (locale === "es" ? "Por elegir" : "Choose a branch")}
                  </strong>
                </button>
              </li>
            ))}
          </ol>

          <div className="acq-zoom-grid">
            <div className="acq-zoom-directory">
              <div className="acq-zoom-summary">
                <div>
                  <span className="acq-eyebrow">
                    {locale === "es"
                      ? `Nivel ${activeStage + 1} de ${stages.length}`
                      : `Level ${activeStage + 1} of ${stages.length}`}
                  </span>
                  <h3>{currentStageName}</h3>
                </div>
                <span className="acq-state">
                  {locale === "es"
                    ? `${options.length} ${options.length === 1 ? "opción registrada" : "opciones registradas"}`
                    : `${options.length} recorded ${options.length === 1 ? "option" : "options"}`}
                </span>
              </div>
              {parent && <p className="acq-muted">{parent.label}</p>}
              {activeStage === 0 && options.length === 0 && (
                <p className="acq-muted">
                  {locale === "es"
                    ? "Aún no hay macroindustrias registradas."
                    : "No macro industries recorded yet."}
                </p>
              )}
              {activeStage > 0 && options.length === 0 && (
                <p className="acq-muted">
                  {locale === "es"
                    ? `Todavía no hay ${currentStageName.toLowerCase()} bajo esta rama. El mapa no demuestra que esté agotada.`
                    : `No ${currentStageName.toLowerCase()} recorded under this branch yet. The map does not prove it is exhausted.`}
                </p>
              )}
              <div
                className="acq-zoom-options"
                role="group"
                aria-label={
                  locale === "es"
                    ? `Opciones de ${currentStageName}`
                    : `${currentStageName} options`
                }
              >
                {options.map((node) => (
                  <div className="acq-exploration-option" key={node.id}>
                    <button
                      type="button"
                      aria-pressed={selected[activeStage]?.id === node.id}
                      onClick={() => choose(node)}
                    >
                      <span className="acq-market-badge">
                        {node.market === "MX"
                          ? "MX · México"
                          : "US · Estados Unidos"}
                      </span>
                      <strong>{node.label}</strong>
                      <small>
                        {optionDetail(
                          node,
                          activeStage,
                          nodes,
                          progress,
                          locale,
                        )}
                      </small>
                      {activeStage < 5 && (
                        <small>{mapState(node, locale)}</small>
                      )}
                    </button>
                    {data.marketPresence
                      .filter((item) => item.node_id === node.id)
                      .map((presence, index) => (
                        <p
                          className="acq-exploration-market-presence"
                          key={`${presence.market}:${index}`}
                        >
                          <strong>{presence.market}</strong> ·{" "}
                          <span
                            className={`acq-presence-status acq-presence-${presence.status.toLowerCase()}`}
                          >
                            {presenceStatus(presence.status, locale)}
                          </span>{" "}
                          · {presence.relation}
                          {safeHttpUrl(presence.source_url) && (
                            <>
                              {" "}
                              ·{" "}
                              <a
                                href={safeHttpUrl(presence.source_url)!.href}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {locale === "es" ? "Fuente" : "Source"}:{" "}
                                {safeHttpUrl(presence.source_url)!.hostname}
                              </a>
                            </>
                          )}
                        </p>
                      ))}
                    {activeStage === 3 &&
                      equivalencesForChain(node.id).map((equivalence) => {
                        const counterpartId =
                          equivalence.chain_id === node.id
                            ? equivalence.counterpart_id
                            : equivalence.chain_id
                        const counterpart = byId.get(counterpartId)
                        return (
                          <p
                            className="acq-exploration-equivalence"
                            key={counterpartId}
                          >
                            {locale === "es"
                              ? "Cadena equivalente explícita"
                              : "Explicit equivalent chain"}
                            :{" "}
                            <strong>
                              {counterpart?.market ?? ""} ·{" "}
                              {counterpart?.label ?? counterpartId}
                            </strong>
                            {equivalence.reason
                              ? ` · ${equivalence.reason}`
                              : ""}
                          </p>
                        )
                      })}
                    {activeStage === 3 && coverageForChain(node)}
                    {nodeDecision(node)}
                    {decisionControls(node)}
                  </div>
                ))}
              </div>
            </div>

            <aside className="acq-zoom-company">
              {company ? (
                <>
                  <span className="acq-eyebrow">
                    {locale === "es"
                      ? "Ficha de empresa · pista"
                      : "Company brief · lead"}
                  </span>
                  <h4>{company.label}</h4>
                  <span className="acq-market-badge">
                    {company.market === "MX"
                      ? "MX · México"
                      : "US · Estados Unidos"}
                  </span>
                  {data.marketPresence
                    .filter((item) => item.node_id === company.id)
                    .map((presence, index) => (
                      <p
                        className="acq-exploration-market-presence"
                        key={`${presence.market}:${index}`}
                      >
                        <strong>{presence.market}</strong> ·{" "}
                        {presence.status.replaceAll("_", " ")} ·{" "}
                        {presence.relation}
                      </p>
                    ))}
                  {nodeDecision(company)}
                  {decisionControls(company)}
                  <dl>
                    <div>
                      <dt>{locale === "es" ? "Qué hace" : "What it does"}</dt>
                      <dd>
                        {field(company, "activity") ??
                          (locale === "es" ? "Por investigar" : "To research")}
                      </dd>
                    </div>
                    <div>
                      <dt>{locale === "es" ? "Escala" : "Scale"}</dt>
                      <dd>
                        {field(company, "scaleSignal") ??
                          (locale === "es" ? "Por investigar" : "To research")}
                      </dd>
                    </div>
                    <div>
                      <dt>
                        {locale === "es" ? "Vía de acceso" : "Access route"}
                      </dt>
                      <dd>
                        {field(company, "accessRoute") ??
                          (locale === "es" ? "Por investigar" : "To research")}
                      </dd>
                    </div>
                  </dl>
                  <p className="acq-zoom-caution">
                    {locale === "es"
                      ? "Su relación con este eslabón es una hipótesis; no se ha probado un contrato ni una necesidad comercial."
                      : "Its relationship to this link is a hypothesis; no contract or commercial need has been proven."}
                  </p>
                  {sourceLinks(company).length > 0 && (
                    <div className="acq-zoom-sources">
                      <span className="acq-eyebrow">
                        {locale === "es" ? "Fuentes" : "Sources"}
                      </span>
                      {sourceLinks(company).map((url) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {new URL(url).hostname}
                        </a>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="acq-muted">
                  {locale === "es"
                    ? "Elige una empresa en el último nivel para ver su ficha aquí. Esta tarjeta permanecerá visible mientras revisas las demás empresas."
                    : "Choose a company at the last level to see its brief here. This card stays visible as you review other companies."}
                </p>
              )}
            </aside>
          </div>
          {decisionNotice && (
            <p role="status" className="acq-muted">
              {decisionNotice}
            </p>
          )}
        </>
      )}
      {data && data.directives.length > 0 && (
        <details className="acq-zoom-other">
          <summary>
            {locale === "es"
              ? "Historial de trabajo y reanudación"
              : "Work and resumption history"}
          </summary>
          <ul>
            {data.directives.map((item) => (
              <li key={item.id}>
                {item.target_kind.replaceAll("_", " ").toLowerCase()} ·{" "}
                {item.status.toLowerCase()} · {item.result_count}{" "}
                {locale === "es" ? "hallazgos" : "findings"}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
