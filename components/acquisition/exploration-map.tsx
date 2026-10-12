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

function lineage(node: MapNode, byId: Map<string, MapNode>): MapNode[] {
  const result = [node]
  const visited = new Set([node.id])
  let current = node
  while (current.parents.length) {
    const parent = current.parents
      .map((item) => byId.get(item.parentId))
      .find(Boolean)
    if (!parent || visited.has(parent.id)) break
    result.unshift(parent)
    visited.add(parent.id)
    current = parent
  }
  return result
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

function chainStatus(chain: Chain, locale: Locale) {
  if (chain.delivery_status === "DELIVERED")
    return locale === "es" ? "Investigada" : "Researched"
  if (chain.delivery_status === "READY_FOR_REVIEW")
    return locale === "es" ? "Lista para revisar" : "Ready to review"
  return locale === "es" ? "En investigación" : "In research"
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
  const [chainId, setChainId] = useState<string | null>(null)
  const [linkId, setLinkId] = useState<string | null>(null)
  const [companyId, setCompanyId] = useState<string | null>(null)

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

  const byId = useMemo(
    () => new Map((data?.nodes ?? []).map((node) => [node.id, node])),
    [data],
  )
  const chains = useMemo(
    () =>
      [...(data?.chainProgress ?? [])].sort((a, b) => {
        if (a.focused !== b.focused) return a.focused ? -1 : 1
        return (byId.get(b.chain_id)?.updated_at ?? "").localeCompare(
          byId.get(a.chain_id)?.updated_at ?? "",
        )
      }),
    [data, byId],
  )
  const activeChain =
    chains.find((chain) => chain.chain_id === chainId) ?? chains[0]
  const activeNode = activeChain && byId.get(activeChain.chain_id)
  const links = useMemo(
    () =>
      activeNode
        ? (data?.nodes ?? []).filter(
            (node) =>
              node.kind === "LINK" &&
              lineage(node, byId).some(
                (ancestor) => ancestor.id === activeNode.id,
              ),
          )
        : [],
    [activeNode, byId, data],
  )
  const activeLink = links.find((link) => link.id === linkId) ?? links[0]
  const companies = useMemo(
    () =>
      activeLink
        ? (data?.nodes ?? [])
            .filter(
              (node) =>
                node.kind === "COMPANY_LEAD" &&
                lineage(node, byId).some(
                  (ancestor) => ancestor.id === activeLink.id,
                ),
            )
            .sort(
              (a, b) =>
                Number(field(b, "chainRole") === "PROSPECT") -
                  Number(field(a, "chainRole") === "PROSPECT") ||
                a.label.localeCompare(b.label),
            )
        : [],
    [activeLink, byId, data],
  )
  const activeCompany =
    companies.find((company) => company.id === companyId) ?? companies[0]
  const route = activeCompany ?? activeLink ?? activeNode
  const routeByKind = new Map(
    (route ? lineage(route, byId) : []).map((node) => [node.kind, node]),
  )
  const otherRoots = (data?.nodes ?? []).filter(
    (node) => node.parents.length === 0,
  )

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
          ? "Elige una cadena, sigue sus seis niveles y revisa la función de cada empresa. Las relaciones inciertas siguen visibles como hipótesis."
          : "Choose a chain, follow its six levels, and inspect each company's role. Uncertain relationships remain visible as hypotheses."}
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
      {data && !chains.length && (
        <p className="acq-muted">
          {locale === "es"
            ? "Aún no hay cadenas descubiertas. Las ramas exploradas aparecen abajo."
            : "No chains discovered yet. Explored branches appear below."}
        </p>
      )}
      {data && chains.length > 0 && (
        <>
          <div
            className="acq-chain-picker"
            role="group"
            aria-label={locale === "es" ? "Elegir cadena" : "Choose a chain"}
          >
            {chains.map((chain) => (
              <button
                type="button"
                key={chain.chain_id}
                className="acq-chain-choice"
                aria-pressed={chain.chain_id === activeChain?.chain_id}
                onClick={() => {
                  setChainId(chain.chain_id)
                  setLinkId(null)
                  setCompanyId(null)
                }}
              >
                <span className="acq-eyebrow">
                  {chain.market === "MX"
                    ? locale === "es"
                      ? "México"
                      : "Mexico"
                    : locale === "es"
                      ? "Estados Unidos"
                      : "United States"}{" "}
                  · {chainStatus(chain, locale)}
                </span>
                <strong>{chain.chain_label}</strong>
                <small>
                  {locale === "es"
                    ? `${chain.link_count} ${chain.link_count === 1 ? "eslabón" : "eslabones"} · ${chain.prospect_hint_count} ${chain.prospect_hint_count === 1 ? "empresa plausible" : "empresas plausibles"}`
                    : `${chain.link_count} links · ${chain.prospect_hint_count} plausible firms`}
                </small>
              </button>
            ))}
          </div>
          {activeChain && activeNode && (
            <>
              <div className="acq-zoom-summary">
                <div>
                  <span className="acq-eyebrow">
                    {locale === "es" ? "Cadena seleccionada" : "Selected chain"}
                  </span>
                  <h3>{activeChain.chain_label}</h3>
                </div>
                <span className="acq-state">
                  {chainStatus(activeChain, locale)}
                </span>
              </div>
              <p className="acq-muted">
                {locale === "es"
                  ? "Este mapa organiza pistas; no prueba relaciones comerciales entre empresas ni autoriza contacto."
                  : "This map organizes leads; it does not prove commercial relationships or authorize contact."}
              </p>
              <ol
                className="acq-zoom-path"
                aria-label={
                  locale === "es"
                    ? "Recorrido de industria a empresa"
                    : "Path from industry to company"
                }
              >
                {stages.map((kind, index) => {
                  const node = routeByKind.get(kind)
                  return (
                    <li key={kind} className={node ? "" : "acq-zoom-missing"}>
                      <span>
                        {index + 1}. {stageNames[locale][index]}
                      </span>
                      <strong>
                        {node?.label ??
                          (locale === "es" ? "Por explorar" : "To explore")}
                      </strong>
                    </li>
                  )
                })}
              </ol>
              <div className="acq-zoom-grid">
                <div>
                  <h4>{locale === "es" ? "Eslabones" : "Links"}</h4>
                  {links.length === 0 && (
                    <p className="acq-muted">
                      {locale === "es"
                        ? "Aún no hay un eslabón registrado."
                        : "No link recorded yet."}
                    </p>
                  )}
                  <div className="acq-zoom-options">
                    {links.map((link) => (
                      <button
                        type="button"
                        key={link.id}
                        aria-pressed={link.id === activeLink?.id}
                        onClick={() => {
                          setLinkId(link.id)
                          setCompanyId(null)
                        }}
                      >
                        {link.label}
                      </button>
                    ))}
                  </div>
                  <h4>
                    {locale === "es"
                      ? "Empresas en este eslabón"
                      : "Companies in this link"}
                  </h4>
                  {companies.length === 0 && (
                    <p className="acq-muted">
                      {locale === "es"
                        ? "Todavía no hay empresas en este eslabón."
                        : "No companies in this link yet."}
                    </p>
                  )}
                  <div className="acq-zoom-options">
                    {companies.map((company) => (
                      <button
                        type="button"
                        key={company.id}
                        aria-pressed={company.id === activeCompany?.id}
                        onClick={() => setCompanyId(company.id)}
                      >
                        <span className="acq-eyebrow">
                          {field(company, "chainRole") === "ANCHOR"
                            ? locale === "es"
                              ? "Actor ancla"
                              : "Anchor"
                            : locale === "es"
                              ? "Empresa plausible"
                              : "Plausible firm"}
                        </span>
                        <strong>{company.label}</strong>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="acq-zoom-company">
                  {activeCompany ? (
                    <>
                      <span className="acq-eyebrow">
                        {locale === "es"
                          ? "Ficha de empresa · pista"
                          : "Company brief · lead"}
                      </span>
                      <h4>{activeCompany.label}</h4>
                      <dl>
                        <div>
                          <dt>
                            {locale === "es" ? "Qué hace" : "What it does"}
                          </dt>
                          <dd>
                            {field(activeCompany, "activity") ??
                              (locale === "es"
                                ? "Por investigar"
                                : "To research")}
                          </dd>
                        </div>
                        <div>
                          <dt>{locale === "es" ? "Escala" : "Scale"}</dt>
                          <dd>
                            {field(activeCompany, "scaleSignal") ??
                              (locale === "es"
                                ? "Por investigar"
                                : "To research")}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            {locale === "es" ? "Vía de acceso" : "Access route"}
                          </dt>
                          <dd>
                            {field(activeCompany, "accessRoute") ??
                              (locale === "es"
                                ? "Por investigar"
                                : "To research")}
                          </dd>
                        </div>
                      </dl>
                      <p className="acq-zoom-caution">
                        {locale === "es"
                          ? "Su relación con este eslabón es una hipótesis; no se ha probado un contrato ni una necesidad comercial."
                          : "Its relationship to this link is a hypothesis; no contract or commercial need has been proven."}
                      </p>
                      {sourceLinks(activeCompany).length > 0 && (
                        <div className="acq-zoom-sources">
                          <span className="acq-eyebrow">
                            {locale === "es" ? "Fuentes" : "Sources"}
                          </span>
                          {sourceLinks(activeCompany).map((url) => (
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
                        ? "Selecciona una empresa para ver su ficha."
                        : "Select a company to see its brief."}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
      {data && (
        <details className="acq-zoom-other">
          <summary>
            {locale === "es"
              ? `Otras ramas del mapa (${otherRoots.length})`
              : `Other map branches (${otherRoots.length})`}
          </summary>
          <div className="acq-zoom-other-list">
            {otherRoots.map((root) => (
              <div key={root.id}>
                <strong>{root.label}</strong>
                <small>
                  {root.market === "MX"
                    ? locale === "es"
                      ? "México"
                      : "Mexico"
                    : locale === "es"
                      ? "Estados Unidos"
                      : "United States"}
                </small>
              </div>
            ))}
          </div>
        </details>
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
