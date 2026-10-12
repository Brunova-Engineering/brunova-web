"use client"

import { useEffect, useMemo, useState } from "react"
import { acquisitionApi } from "@/lib/acquisition-api"
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
    if (!claim.sourceUrl) continue
    try {
      const url = new URL(claim.sourceUrl)
      if (url.protocol === "https:" || url.protocol === "http:")
        urls.add(url.href)
    } catch {
      // Malformed source text remains in the record without becoming a link.
    }
  }
  return [...urls]
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
}: {
  cycleId: string
  locale: Locale
}) {
  const [data, setData] = useState<MapData | null>(null)
  const [error, setError] = useState(false)
  const [selectedIds, setSelectedIds] = useState<(string | null)[]>(
    stages.map(() => null),
  )
  const [activeStage, setActiveStage] = useState(0)

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
  const selected = stages.map((kind, index) => {
    const node = byId.get(selectedIds[index] ?? "")
    return node?.kind === kind ? node : null
  })
  const parent = activeStage > 0 ? selected[activeStage - 1] : null
  const options = (() => {
    const candidates = nodes.filter((node) => {
      if (node.kind !== stages[activeStage]) return false
      if (activeStage === 0) return node.parents.length === 0
      return parent
        ? node.parents.some((item) => item.parentId === parent.id)
        : false
    })
    return candidates.sort((a, b) => {
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
                    ? `${options.length} opciones registradas`
                    : `${options.length} recorded`}
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
                  <button
                    type="button"
                    key={node.id}
                    aria-pressed={selected[activeStage]?.id === node.id}
                    onClick={() => choose(node)}
                  >
                    <span className="acq-eyebrow">
                      {node.market === "MX"
                        ? locale === "es"
                          ? "México"
                          : "Mexico"
                        : locale === "es"
                          ? "Estados Unidos"
                          : "United States"}
                    </span>
                    <strong>{node.label}</strong>
                    <small>
                      {optionDetail(node, activeStage, nodes, progress, locale)}
                    </small>
                    {activeStage < 5 && <small>{mapState(node, locale)}</small>}
                  </button>
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
