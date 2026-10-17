"use client"

import { useEffect, useMemo, useRef, useState } from "react"
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

const candidateStageNames: Record<string, [string, string]> = {
  DISCOVERY: ["Descubierta", "Discovered"],
  ENRICHMENT: ["En enriquecimiento", "In research"],
  BRUNOVA_FIT: ["Evaluar conexión con Brunova", "Assess Brunova fit"],
  FILTERING: ["En selección", "In selection"],
  SELECTED: ["Seleccionada", "Selected"],
  CONTACTED: ["Primer contacto confirmado", "First contact confirmed"],
  CLOSED: ["Cerrada", "Closed"],
}
function candidateDate(value: string | null | undefined, locale: Locale) {
  if (!value) return locale === "es" ? "Pendiente" : "Pending"
  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? locale === "es"
      ? "Pendiente"
      : "Pending"
    : new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
        dateStyle: "medium",
        timeZone: "America/Mexico_City",
      }).format(date)
}

function field(node: MapNode, key: string): string | null {
  const value = node.attributes[key]
  return typeof value === "string" && value.trim() ? value : null
}

function conceptKey(node: MapNode) {
  return node.concept_id ?? node.id
}

function displayLabel(node: MapNode) {
  return node.kind === "COMPANY_LEAD"
    ? node.label
    : (node.concept_label ?? node.label)
}

function isGeneratedRoleTag(tag: string) {
  return (
    tag === "Papel en el mapa: actor ancla" ||
    tag === "Papel en el mapa: empresa candidata"
  )
}

function normalizeText(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
}

function cleanExplorationText(
  value: string | null | undefined,
  locale: Locale,
) {
  if (!value) return ""
  if (normalizeText(value) === "possible relationship pending research")
    return ""
  if (/legacy discovery market/i.test(value))
    return locale === "es"
      ? "Registro heredado de descubrimiento; presencia pendiente de verificación."
      : "Legacy discovery record; market presence still requires verification."
  if (/discovered in this market; operating presence remains/i.test(value))
    return locale === "es"
      ? "Pista encontrada en este mercado; falta confirmar su operación."
      : "Lead found in this market; operating presence remains unconfirmed."
  const replacements: Record<string, string> = {
    UNVERIFIED: "",
    PROSPECT: locale === "es" ? "Empresa candidata" : "Candidate company",
    READY_FOR_REVIEW: "",
    TRAVERSED: "",
  }
  return value
    .replace(
      /\b(UNVERIFIED|PROSPECT|READY_FOR_REVIEW|TRAVERSED)\b/gi,
      (token) => replacements[token.toUpperCase()] ?? "",
    )
    .replace(/[|·•]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .replace(/^[\s:;,.-]+|[\s:;,.-]+$/g, "")
    .trim()
}

function nextQuestionForField(
  key: string,
  storedQuestion: string | null,
  locale: Locale,
) {
  const questions: Record<string, [string, string]> = {
    canonicalName: [
      "¿Cuál es el nombre legal o comercial confirmado?",
      "What legal or trade name can be confirmed?",
    ],
    alternateNames: [
      "¿Qué otros nombres comerciales o razones sociales utiliza?",
      "What other trade names or legal names does it use?",
    ],
    websiteOrRegistry: [
      "¿Qué sitio oficial o registro confirma su identidad?",
      "Which official website or registry confirms its identity?",
    ],
    disambiguation: [
      "¿Qué evidencia la distingue de otras empresas con nombre similar?",
      "What evidence distinguishes it from similarly named companies?",
    ],
    activity: [
      "¿Qué procesos o servicios ofrece exactamente?",
      "Which processes or services does it offer?",
    ],
    function: [
      "¿Qué función desempeña en este eslabón?",
      "What role does it perform in this link?",
    ],
    markets: [
      "¿En qué mercados opera directamente?",
      "Which markets does it operate in directly?",
    ],
    locations: [
      "¿Qué ubicaciones operativas pueden verificarse?",
      "Which operating locations can be verified?",
    ],
    scaleSignal: [
      "¿Qué señal verificable permite estimar su escala?",
      "What verifiable signal indicates its scale?",
    ],
    fitProcess: [
      "¿Qué proceso específico podría atender?",
      "Which specific process could it support?",
    ],
    fitHypothesis: [
      "¿Qué evidencia conecta a la empresa con esta necesidad?",
      "What evidence connects the company to this need?",
    ],
    channel: [
      "¿Cuál es el canal público apropiado para contactarla?",
      "What public channel is appropriate for contacting it?",
    ],
    interlocutorRole: [
      "¿Qué cargo suele evaluar esta solución?",
      "Which role typically evaluates this solution?",
    ],
    priorContact: [
      "¿Hay algún contacto previo registrado?",
      "Is any prior contact recorded?",
    ],
    restrictions: [
      "¿Qué restricciones aplican antes de contactarla?",
      "Which restrictions apply before contacting it?",
    ],
    accessRoute: [
      "¿Cuál es la vía pública adecuada para iniciar contacto?",
      "What public route is appropriate for initial contact?",
    ],
  }
  const mapped = questions[key]
  if (mapped) return mapped[locale === "es" ? 0 : 1]
  return (
    cleanExplorationText(storedQuestion, locale) ||
    (locale === "es" ? "Por definir" : "To be defined")
  )
}

function marketPresenceNote(relation: string, locale: Locale) {
  return cleanExplorationText(relation, locale)
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
  if (status === "READY_FOR_REVIEW")
    return locale === "es" ? "Lista para revisión" : "Ready for review"
  if (status === "TRAVERSED")
    return locale === "es"
      ? "Recorrida · cobertura sin confirmar"
      : "Reviewed · coverage unconfirmed"
  return status.replaceAll("_", " ")
}

function evidenceLabel(status: string, locale: Locale) {
  const labels: Record<string, [string, string]> = {
    OBSERVED: ["Observada", "Observed"],
    INFERRED: ["Inferida", "Inferred"],
    UNVERIFIED: ["Sin verificar", "Unverified"],
    KNOWN: ["Registrada", "Recorded"],
    HYPOTHESIS: ["Hipótesis", "Hypothesis"],
    PENDING: ["Pendiente", "Pending"],
  }
  const label = labels[status]
  return label ? label[locale === "es" ? 0 : 1] : status.replaceAll("_", " ")
}

function identityLabel(status: string, locale: Locale) {
  const labels: Record<string, [string, string]> = {
    RESOLVED: ["Identidad conciliada", "Identity resolved"],
    PROVISIONAL: ["Identidad provisional", "Provisional identity"],
    AMBIGUOUS: ["Identidad por conciliar", "Identity needs review"],
    UNRESOLVED: ["Identidad por resolver", "Unresolved identity"],
  }
  const label = labels[status]
  return label ? label[locale === "es" ? 0 : 1] : status.replaceAll("_", " ")
}

function dispositionScopeLabel(scope: string, locale: Locale) {
  const labels: Record<string, [string, string]> = {
    LINK: ["Eslabón", "Link"],
    CHAIN: ["Cadena", "Chain"],
    GLOBAL: ["Empresa completa", "Whole company"],
  }
  const label = labels[scope]
  return label ? label[locale === "es" ? 0 : 1] : scope
}

function observedDate(value: string | null, locale: Locale) {
  if (!value) return locale === "es" ? "Sin fecha" : "No date"
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return (
    new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(parsed) + " UTC"
  )
}

const companyFieldNames: Record<string, [string, string]> = {
  canonicalName: ["Nombre canónico", "Canonical name"],
  alternateNames: ["Otros nombres", "Other names"],
  websiteOrRegistry: ["Sitio o registro", "Website or registry"],
  disambiguation: ["Distinción de homónimos", "Namesake distinction"],
  activity: ["Qué hace", "What it does"],
  function: ["Función en el eslabón", "Role in this link"],
  markets: ["Mercados", "Markets"],
  locations: ["Ubicaciones", "Locations"],
  scaleSignal: ["Indicios de escala", "Scale signals"],
  fitProcess: [
    "Proceso que Brunova podría atender",
    "Potential service process",
  ],
  fitHypothesis: ["Hipótesis de encaje", "Fit hypothesis"],
  channel: ["Canal", "Channel"],
  interlocutorRole: ["Función del interlocutor", "Contact role"],
  priorContact: ["Contacto previo", "Prior contact"],
  restrictions: ["Restricciones conocidas", "Known restrictions"],
}

function companyFieldLabel(key: string, locale: Locale) {
  const names = companyFieldNames[key]
  if (names) return names[locale === "es" ? 0 : 1]
  return key
    .replaceAll(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
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
  marketFilter: "ALL" | "MX" | "US",
  mode: "exploration" | "opportunities" | "attention" = "exploration",
) {
  if (stage === 5)
    if (mode === "opportunities" || mode === "attention")
      return locale === "es"
        ? mode === "attention"
          ? "Decisión de Dirección pendiente"
          : "Tesis comercial registrada"
        : mode === "attention"
          ? "Management decision pending"
          : "Commercial thesis recorded"
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
  const members = nodes.filter(
    (item) =>
      conceptKey(item) === conceptKey(node) &&
      (marketFilter === "ALL" || item.market === marketFilter),
  )
  const children = members
    .flatMap((member) => childrenOf(nodes, member, nextKind))
    .filter((child) => marketFilter === "ALL" || child.market === marketFilter)
  const count = new Set(children.map(conceptKey)).size
  if (stage === 3) {
    const leads =
      mode !== "exploration"
        ? [
            ...new Set(
              children.flatMap((link) =>
                childrenOf(nodes, link, "COMPANY_LEAD").map((lead) => lead.id),
              ),
            ),
          ].length
        : members.reduce(
            (total, member) =>
              total + (progress.get(member.id)?.company_lead_count ?? 0),
            0,
          )
    return locale === "es"
      ? mode !== "exploration"
        ? `${count} ${count === 1 ? "función" : "funciones"} · ${leads} ${leads === 1 ? "empresa" : "empresas"}`
        : `${count} ${count === 1 ? "función registrada" : "funciones registradas"} · ${leads} pistas de empresas · cobertura sin confirmar`
      : mode !== "exploration"
        ? `${count} ${count === 1 ? "function" : "functions"} · ${leads} ${leads === 1 ? "company" : "companies"}`
        : `${count} recorded ${count === 1 ? "function" : "functions"} · ${leads} company leads · coverage unconfirmed`
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
  mode = "exploration",
}: {
  cycleId: string
  locale: Locale
  session: PortalSession
  mode?: "exploration" | "opportunities" | "attention"
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
  const [companyQuery, setCompanyQuery] = useState("")
  const [globalQuery, setGlobalQuery] = useState("")
  const [globalSearchOpen, setGlobalSearchOpen] = useState(true)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [marketFilter, setMarketFilter] = useState<"ALL" | "MX" | "US">("ALL")
  const [showClosedHistory, setShowClosedHistory] = useState(false)
  const [dispositionScopeSelection, setDispositionScopeSelection] = useState<{
    contextKey: string
    scope: "LINK" | "CHAIN" | "GLOBAL"
  } | null>(null)
  const [dispositionReason, setDispositionReason] = useState("")
  const [dispositionPending, setDispositionPending] = useState(false)
  const [dispositionNotice, setDispositionNotice] = useState("")
  const [contactDraftCompanyId, setContactDraftCompanyId] = useState<
    string | null
  >(null)
  const [contactType, setContactType] = useState<
    "EMAIL" | "FACEBOOK" | "INSTAGRAM" | "WHATSAPP"
  >("EMAIL")
  const [contactValue, setContactValue] = useState("")
  const [contactSource, setContactSource] = useState("")
  const [contactAttribution, setContactAttribution] = useState("")
  const [contactPending, setContactPending] = useState(false)
  const [contactRecorded, setContactRecorded] = useState(false)
  const [contactNotice, setContactNotice] = useState("")
  const [researchActionCode, setResearchActionCode] = useState<string | null>(
    null,
  )
  const [researchDraftCompanyId, setResearchDraftCompanyId] = useState<
    string | null
  >(null)
  const [researchQuestion, setResearchQuestion] = useState("")
  const [researchMinutes, setResearchMinutes] = useState(10)
  const [researchPending, setResearchPending] = useState(false)
  const [researchNotice, setResearchNotice] = useState("")
  const [closeDraftCompanyId, setCloseDraftCompanyId] = useState<string | null>(
    null,
  )
  const [closeReason, setCloseReason] = useState("")
  const [closeSource, setCloseSource] = useState("")
  const [closeScope, setCloseScope] = useState<"LINK" | "COMPANY">("COMPANY")
  const [closePending, setClosePending] = useState(false)
  const [closeNotice, setCloseNotice] = useState("")
  const [resolutionDraft, setResolutionDraft] = useState<{
    companyId: string
    actionCode:
      | "CONFIRM_IDENTITY"
      | "KEEP_IDENTITIES_SEPARATE"
      | "KEEP_SEPARATE"
      | "CORRECT_FIT_THESIS"
  } | null>(null)
  const [resolutionText, setResolutionText] = useState("")
  const [resolutionEvidence, setResolutionEvidence] = useState("")
  const [resolutionPending, setResolutionPending] = useState(false)
  const [resolutionNotice, setResolutionNotice] = useState("")
  const resolutionCommand = useRef<{
    companyId: string
    actionCode: string
    commandId: string
  } | null>(null)
  const closeCommand = useRef<{ companyId: string; commandId: string } | null>(
    null,
  )
  const researchCommand = useRef<{
    companyId: string
    actionCode: string
    commandId: string
  } | null>(null)
  const contactCommand = useRef<{
    companyId: string
    commandId: string
    methodId: string | null
    resolveCommandId: string | null
  } | null>(null)

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

  const visibleProfiles = useMemo(
    () =>
      (data?.companyProfiles ?? []).filter((profile) => {
        const stage = profile.enrichment?.stage ?? "DISCOVERY"
        const inCommercialStage = [
          "FILTERING",
          "SELECTED",
          "CONTACTED",
        ].includes(stage)
        const needsAttention =
          profile.attention?.status === "OPEN" &&
          profile.attention.reasons.length > 0
        return mode === "attention"
          ? inCommercialStage && needsAttention
          : mode === "opportunities"
            ? inCommercialStage && !needsAttention
            : ["DISCOVERY", "ENRICHMENT", "BRUNOVA_FIT"].includes(stage) ||
              (showClosedHistory && stage === "CLOSED")
      }),
    [data, mode, showClosedHistory],
  )
  const nodes = useMemo(() => {
    if (!data) return []
    if (mode === "exploration") {
      const allowedLeads = new Set(
        visibleProfiles.flatMap((profile) => profile.leadNodeIds),
      )
      const profiledLeads = new Set(
        data.companyProfiles?.flatMap((profile) => profile.leadNodeIds) ?? [],
      )
      return data.nodes.filter(
        (node) =>
          node.kind !== "COMPANY_LEAD" ||
          allowedLeads.has(node.id) ||
          !profiledLeads.has(node.id),
      )
    }
    const rawById = new Map(data.nodes.map((node) => [node.id, node]))
    const allowed = new Set<string>()
    const pending = visibleProfiles.flatMap((profile) => profile.leadNodeIds)
    while (pending.length) {
      const id = pending.pop()!
      if (allowed.has(id)) continue
      allowed.add(id)
      const node = rawById.get(id)
      for (const parent of node?.parents ?? []) pending.push(parent.parentId)
    }
    return data.nodes.filter((node) => allowed.has(node.id))
  }, [data, mode, visibleProfiles])
  const byId = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes],
  )
  const conceptMembers = useMemo(() => {
    const grouped = new Map<string, MapNode[]>()
    for (const node of nodes) {
      const key = conceptKey(node)
      grouped.set(key, [...(grouped.get(key) ?? []), node])
    }
    return grouped
  }, [nodes])
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
    const parentMembers = parent
      ? (conceptMembers.get(conceptKey(parent)) ?? [parent])
      : []
    const allowedParentIds =
      activeStage === 4 && parent
        ? new Set(
            parentMembers.flatMap((member) => [
              member.id,
              ...equivalentChainIds(member.id),
            ]),
          )
        : parent
          ? new Set(parentMembers.map((member) => member.id))
          : new Set<string>()
    const candidates = nodes.filter((node) => {
      if (node.kind !== stages[activeStage]) return false
      if (marketFilter !== "ALL" && node.market !== marketFilter) return false
      if (activeStage === 0) return node.parents.length === 0
      return parent
        ? node.parents.some((item) => allowedParentIds.has(item.parentId))
        : false
    })
    const deduplicated = [
      ...new Map(
        candidates.map((node) => [
          activeStage === 5 ? node.id : conceptKey(node),
          node,
        ]),
      ).values(),
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
      return displayLabel(a).localeCompare(displayLabel(b), locale)
    })
  })()
  const company = selected[5]
  const companyProfile = visibleProfiles.find((profile) =>
    profile.leadNodeIds.includes(company?.id ?? ""),
  )
  const selectedLinkProfile = companyProfile?.links.find(
    (link) => link.linkId === selected[4]?.id,
  )
  const selectedLinkRoles = [
    ...new Map(
      (selectedLinkProfile?.functions?.length
        ? selectedLinkProfile.functions
        : [selectedLinkProfile?.function ?? ""]
      )
        .map((role) => cleanExplorationText(role, locale))
        .filter(Boolean)
        .map((role) => [normalizeText(role), role]),
    ).values(),
  ]
  const selectedObservedFunction =
    selectedLinkProfile?.contexts
      ?.filter(
        (context) =>
          context.status === "OBSERVED" && safeHttpUrl(context.sourceUrl),
      )
      .map((context) => cleanExplorationText(context.statement, locale))
      .find(Boolean) ?? ""
  const selectedFunctionSummary =
    selectedLinkRoles.join(" / ") || selectedObservedFunction
  // The legacy company-level role can describe a different link. The selected
  // link above is the sole source for a role attributed to this route.
  const visibleCompanyFields =
    companyProfile?.fields.filter(
      (item) => item.key !== "function" || !selectedLinkProfile,
    ) ?? []
  const selectedLinkObservations = (() => {
    const contexts = selectedLinkProfile?.contexts ?? []
    const roleTexts = [selectedFunctionSummary]
      .filter(Boolean)
      .map(normalizeText)
    const grouped = new Map<
      string,
      { statement: string; sources: typeof contexts }
    >()
    for (const context of contexts) {
      const statement = cleanExplorationText(context.statement, locale)
      if (!statement) continue
      const key = normalizeText(statement)
      const group = grouped.get(key) ?? { statement, sources: [] }
      group.sources.push(context)
      grouped.set(key, group)
    }
    return [...grouped.values()].map((group) => ({
      ...group,
      repeatsRole: roleTexts.includes(normalizeText(group.statement)),
    }))
  })()
  const selectedEnrichmentAttempts = (
    companyProfile?.enrichment?.attempts ?? []
  )
    .filter((attempt) => attempt.linkId === selected[4]?.id)
    .slice(-4)
    .reverse()
  const selectedMinimums = selected[4]
    ? companyProfile?.enrichment?.minimumsByLink?.[selected[4].id]
    : undefined
  const minimumChecklist = selectedMinimums
    ? ([
        [
          "identity",
          locale === "es" ? "Identidad distinguible" : "Distinct identity",
        ],
        [
          "operation",
          locale === "es" ? "Operación comprobada" : "Verified operation",
        ],
        [
          "functionInLink",
          locale === "es" ? "Función en este eslabón" : "Role in this link",
        ],
        [
          "operatingMarket",
          locale === "es" ? "Mercado donde opera" : "Operating market",
        ],
        ["scaleSignal", locale === "es" ? "Señal de escala" : "Scale signal"],
        [
          "accessRoute",
          locale === "es"
            ? "Vía de acceso plausible"
            : "Plausible access route",
        ],
      ] as const)
    : []
  const nextEnrichmentQuestion = companyProfile?.fields.find(
    (item) => item.status !== "KNOWN" && item.nextQuestion,
  )?.nextQuestion
  const companyCrossLinks = companyProfile
    ? [
        ...new Map(
          companyProfile.links
            .filter((link) => {
              const node = byId.get(link.linkId)
              return (
                node?.kind === "LINK" &&
                node.id !== selected[4]?.id &&
                companyProfile.leadNodeIds.some((leadId) =>
                  isDescendantOf(leadId, node.id),
                )
              )
            })
            .map((link) => [link.linkId, link] as const),
        ).values(),
      ]
    : []
  const companyProfiles = visibleProfiles
  const selectedFitReview = companyProfile?.fitReviews?.find(
    (review) =>
      review.linkId === selected[4]?.id && review.decision === "ADVANCE",
  )
  const profileByLead = new Map(
    companyProfiles.flatMap((profile) =>
      profile.leadNodeIds.map((leadId) => [leadId, profile] as const),
    ),
  )
  const allTags = [
    ...new Set(
      companyProfiles.flatMap((profile) =>
        profile.tags.filter((tag) => !isGeneratedRoleTag(tag)),
      ),
    ),
  ].sort()
  const globalSearchTerm = normalizeText(globalQuery)
  const globalResults = (() => {
    if (globalSearchTerm.length < 2) return []
    const matchingProfiles = new Set(
      companyProfiles
        .filter((profile) =>
          normalizeText(
            [
              profile.displayName,
              ...profile.aliases,
              ...profile.tags.filter((tag) => !isGeneratedRoleTag(tag)),
              ...profile.leadNodeIds.map((id) => byId.get(id)?.label ?? ""),
            ].join(" "),
          ).includes(globalSearchTerm),
        )
        .map((profile) => profile.companyId),
    )
    const results = new Map<string, { lead: MapNode; path: MapNode[] }>()
    for (const lead of nodes) {
      if (lead.kind !== "COMPANY_LEAD") continue
      if (marketFilter !== "ALL" && lead.market !== marketFilter) continue
      const profile = profileByLead.get(lead.id)
      if (
        !(profile && matchingProfiles.has(profile.companyId)) &&
        !normalizeText(lead.label).includes(globalSearchTerm)
      )
        continue
      for (const relation of lead.parents) {
        const path = pathForLead(lead, relation.parentId)
        if (!path) continue
        const key = `${profile?.companyId ?? lead.id}:${relation.parentId}`
        if (!results.has(key)) results.set(key, { lead, path })
      }
    }
    return [...results.values()].sort(
      (a, b) =>
        displayLabel(a.lead).localeCompare(displayLabel(b.lead), locale) ||
        a.lead.market.localeCompare(b.lead.market) ||
        displayLabel(a.path[4]!).localeCompare(
          displayLabel(b.path[4]!),
          locale,
        ),
    )
  })()
  const filteredOptions =
    activeStage === 5 && (companyQuery || selectedTags.length)
      ? options.filter((node) => {
          const profile = profileByLead.get(node.id)
          const haystack = [
            node.label,
            ...(profile?.aliases ?? []),
            ...(profile?.tags ?? []),
          ]
            .join(" ")
            .toLocaleLowerCase(locale)
          return (
            haystack.includes(companyQuery.trim().toLocaleLowerCase(locale)) &&
            selectedTags.every((tag) => profile?.tags.includes(tag))
          )
        })
      : options
  const currentStageName =
    activeStage === 5 && mode !== "exploration"
      ? locale === "es"
        ? "Empresa"
        : "Company"
      : (stageNames[locale][activeStage] ?? "")

  function choose(node: MapNode) {
    if (activeStage === 5 && selected[4]) {
      const memberIds = new Set(
        (conceptMembers.get(conceptKey(selected[4])) ?? [selected[4]]).map(
          (item) => item.id,
        ),
      )
      const matchingLink = node.parents
        .map((relation) => relation.parentId)
        .find((id) => memberIds.has(id))
      if (matchingLink) {
        const path = pathForLead(node, matchingLink)
        if (path) {
          setSelectedIds(path.map((item) => item.id))
          return
        }
      }
    }
    setSelectedIds((previous) =>
      previous.map((id, index) =>
        index < activeStage ? id : index === activeStage ? node.id : null,
      ),
    )
    if (activeStage < stages.length - 1) setActiveStage(activeStage + 1)
  }

  function navigateToCompanyLink(
    linkId: string,
    profile: NonNullable<typeof companyProfile>,
  ) {
    const targetLink = byId.get(linkId)
    const linkedLead = profile.leadNodeIds
      .map((leadId) => byId.get(leadId))
      .find(
        (lead) => lead?.kind === "COMPANY_LEAD" && pathForLead(lead, linkId),
      )
    if (!targetLink || targetLink.kind !== "LINK" || !linkedLead) return
    const path = pathForLead(linkedLead, linkId)
    if (!path) return
    setSelectedIds(path.map((node) => node.id))
    setActiveStage(5)
  }

  async function recordContactMethod() {
    const profile = companyProfile
    const attention = profile?.attention
    const reason = attention?.reasons.find(
      (item) => item.code === "NO_VERIFIED_CONTACT",
    )
    const linkId = reason?.linkId ?? selected[4]?.id
    if (
      !profile ||
      !attention ||
      !reason ||
      !linkId ||
      contactPending ||
      !session.actor.capabilities.includes("MANAGE_CYCLE")
    )
      return
    const value = contactValue.trim()
    const sourceUrl = contactSource.trim()
    const attribution = contactAttribution.trim()
    if (
      value.length < 3 ||
      !sourceUrl.startsWith("https://") ||
      attribution.length < 20
    ) {
      setContactNotice(
        locale === "es"
          ? "Completa el medio, su fuente HTTPS y cómo se atribuye a esta empresa."
          : "Provide the contact method, its HTTPS source, and how it belongs to this company.",
      )
      return
    }
    setContactPending(true)
    setContactNotice("")
    const command =
      contactCommand.current?.companyId === profile.companyId
        ? contactCommand.current
        : {
            companyId: profile.companyId,
            commandId: crypto.randomUUID(),
            methodId: null,
            resolveCommandId: null,
          }
    contactCommand.current = command
    try {
      if (!command.methodId) {
        const receipt = await acquisitionApi.candidateContactMethod(
          command.commandId,
          {
            cycleId,
            companyId: profile.companyId,
            expectedStageVersion: attention.stageVersion,
            channelType: contactType,
            channelValue: value,
            sourceUrl,
            attribution,
          },
          session.csrfToken,
        )
        command.methodId = receipt.methodId
        setContactRecorded(true)
      }
      command.resolveCommandId ??= crypto.randomUUID()
      await acquisitionApi.candidateAttentionCommand(
        command.resolveCommandId,
        {
          cycleId,
          companyId: profile.companyId,
          linkId,
          expectedStageVersion: attention.stageVersion,
          action: "RESOLVE",
          reasonCode: "NO_VERIFIED_CONTACT",
          summary: reason.summary,
          evidenceRefs: [sourceUrl],
          resolution: attribution,
          resolutionAction: "REGISTER_CONTACT",
          contactMethodId: command.methodId,
        },
        session.csrfToken,
      )
      contactCommand.current = null
      setContactRecorded(false)
      setContactDraftCompanyId(null)
      setContactValue("")
      setContactSource("")
      setContactAttribution("")
      setContactNotice(
        locale === "es"
          ? "Medio registrado y motivo resuelto. Se actualizó la sección de la empresa."
          : "Contact method recorded and reason resolved. The company section has been updated.",
      )
      await acquisitionApi
        .explorationMap(cycleId)
        .then(setData)
        .catch(() => undefined)
    } catch {
      setContactNotice(
        locale === "es"
          ? "No se pudo completar la decisión. Revisa los datos o actualiza la ficha antes de intentar de nuevo."
          : "The decision could not be completed. Review the details or refresh the brief before retrying.",
      )
    } finally {
      setContactPending(false)
    }
  }

  async function requestAttentionResearch() {
    const profile = companyProfile
    const attention = profile?.attention
    const code =
      researchActionCode === "REQUEST_CONTACT_RESEARCH"
        ? "NO_VERIFIED_CONTACT"
        : researchActionCode === "REQUEST_RECONCILIATION"
          ? "IDENTITY_CONFLICT"
          : researchActionCode === "REQUEST_HISTORY_REVIEW"
            ? "PRIOR_RELATIONSHIP_CONFLICT"
            : researchActionCode === "REQUEST_FIT_CONTRAST"
              ? "FIT_EVIDENCE_CONFLICT"
              : null
    const reason = attention?.reasons.find((item) => item.code === code)
    const linkId = reason?.linkId ?? selected[4]?.id
    if (
      !profile ||
      !attention ||
      !code ||
      !researchActionCode ||
      !linkId ||
      researchPending ||
      !session.actor.capabilities.includes("MANAGE_CYCLE")
    )
      return
    const question = researchQuestion.trim()
    if (
      question.length < 12 ||
      question.length > 500 ||
      researchMinutes < 1 ||
      researchMinutes > 30
    ) {
      setResearchNotice(
        locale === "es"
          ? "Define una pregunta concreta y un límite de 1 a 30 minutos."
          : "Provide a specific question and a 1–30 minute limit.",
      )
      return
    }
    const command =
      researchCommand.current?.companyId === profile.companyId &&
      researchCommand.current.actionCode === researchActionCode
        ? researchCommand.current
        : {
            companyId: profile.companyId,
            actionCode: researchActionCode,
            commandId: crypto.randomUUID(),
          }
    researchCommand.current = command
    setResearchPending(true)
    setResearchNotice("")
    try {
      await acquisitionApi.candidateAttentionResearchRequest(
        command.commandId,
        {
          cycleId,
          companyId: profile.companyId,
          linkId,
          expectedStageVersion: attention.stageVersion,
          reasonCode: code,
          question,
          maxMinutes: researchMinutes,
        },
        session.csrfToken,
      )
      researchCommand.current = null
      setResearchActionCode(null)
      setResearchQuestion("")
      setResearchNotice(
        locale === "es"
          ? "Encargo registrado en cola; la decisión sigue pendiente hasta recibir y revisar su resultado."
          : "Research queued; the decision remains open until its result is received and reviewed.",
      )
      await acquisitionApi
        .explorationMap(cycleId)
        .then(setData)
        .catch(() => undefined)
    } catch {
      setResearchNotice(
        locale === "es"
          ? "No se pudo registrar el encargo. Revisa la ficha antes de reintentarlo."
          : "The research request could not be queued. Review the brief before retrying.",
      )
    } finally {
      setResearchPending(false)
    }
  }

  async function recordAttentionClose() {
    const profile = companyProfile
    const linkId = selected[4]?.id
    if (
      !profile ||
      !linkId ||
      profile.enrichment?.stage !== "FILTERING" ||
      closePending ||
      !session.actor.capabilities.includes("MANAGE_CYCLE")
    )
      return
    const reason = closeReason.trim()
    const sourceUrl = closeSource.trim()
    if (
      reason.length < 20 ||
      reason.length > 1000 ||
      !sourceUrl.startsWith("https://")
    ) {
      setCloseNotice(
        locale === "es"
          ? "Explica el cierre con al menos 20 caracteres y cita una fuente HTTPS de este eslabón."
          : "Give a reason of at least 20 characters and cite an HTTPS source for this link.",
      )
      return
    }
    const command =
      closeCommand.current?.companyId === profile.companyId
        ? closeCommand.current
        : { companyId: profile.companyId, commandId: crypto.randomUUID() }
    closeCommand.current = command
    setClosePending(true)
    setCloseNotice("")
    try {
      await acquisitionApi.candidateFilteringDecision(
        command.commandId,
        {
          cycleId,
          companyId: profile.companyId,
          linkId,
          expectedStageVersion: profile.enrichment.version,
          decision: "CLOSE",
          reason,
          sourceUrl,
          scope: closeScope,
        },
        session.csrfToken,
      )
      closeCommand.current = null
      setCloseDraftCompanyId(null)
      setCloseNotice(
        locale === "es"
          ? "Decisión de cierre registrada. El Engine debe aplicarla y actualizar la etapa; aún no se cuenta como cerrada."
          : "Closure decision recorded. The Engine must apply it before the company is considered closed.",
      )
      await acquisitionApi
        .explorationMap(cycleId)
        .then(setData)
        .catch(() => undefined)
    } catch {
      setCloseNotice(
        locale === "es"
          ? "No se pudo registrar el cierre. Verifica la fuente y la versión actual de la ficha."
          : "The closure could not be recorded. Check the source and current brief version.",
      )
    } finally {
      setClosePending(false)
    }
  }

  async function resolveMaterialAttention() {
    const profile = companyProfile
    const attention = profile?.attention
    const draft = resolutionDraft
    if (
      !profile ||
      !attention ||
      !draft ||
      draft.companyId !== profile.companyId ||
      resolutionPending ||
      !session.actor.capabilities.includes("MANAGE_CYCLE")
    )
      return
    const reasonCode =
      draft.actionCode === "KEEP_SEPARATE"
        ? "PRIOR_RELATIONSHIP_CONFLICT"
        : draft.actionCode === "CORRECT_FIT_THESIS"
          ? "FIT_EVIDENCE_CONFLICT"
          : "IDENTITY_CONFLICT"
    const reason = attention.reasons.find((item) => item.code === reasonCode)
    const action = attention.actions.find(
      (item) => item.code === draft.actionCode,
    )
    const linkId = reason?.linkId ?? selected[4]?.id
    if (!reason || !action || action.enabled !== true || !linkId) return
    const supportingActionId = action.supportingActionId ?? undefined
    if (draft.actionCode !== "KEEP_SEPARATE" && !supportingActionId) return
    if (draft.actionCode === "KEEP_SEPARATE" && !reason.relatedRecordRef) return
    const resolution = resolutionText.trim()
    const evidence = resolutionEvidence.trim()
    if (
      resolution.length < 20 ||
      resolution.length > 1000 ||
      evidence.length < 8 ||
      evidence.length > 500
    ) {
      setResolutionNotice(
        locale === "es"
          ? "Explica la decisión con al menos 20 caracteres y cita evidencia verificable."
          : "Explain the decision in at least 20 characters and cite verifiable evidence.",
      )
      return
    }
    const command =
      resolutionCommand.current?.companyId === profile.companyId &&
      resolutionCommand.current.actionCode === draft.actionCode
        ? resolutionCommand.current
        : {
            companyId: profile.companyId,
            actionCode: draft.actionCode,
            commandId: crypto.randomUUID(),
          }
    resolutionCommand.current = command
    setResolutionPending(true)
    setResolutionNotice("")
    try {
      await acquisitionApi.candidateAttentionCommand(
        command.commandId,
        {
          cycleId,
          companyId: profile.companyId,
          linkId,
          expectedStageVersion: attention.stageVersion,
          action: "RESOLVE",
          reasonCode,
          summary: reason.summary,
          evidenceRefs: [evidence],
          resolution,
          resolutionAction: draft.actionCode,
          ...(supportingActionId ? { supportingActionId } : {}),
          ...(reason.relatedRecordRef
            ? { relatedRecordRef: reason.relatedRecordRef }
            : {}),
        },
        session.csrfToken,
      )
      resolutionCommand.current = null
      setResolutionDraft(null)
      setResolutionText("")
      setResolutionEvidence("")
      setResolutionNotice(
        locale === "es"
          ? "Decisión registrada con su corrección previa; la ficha se actualizó."
          : "Decision recorded with its prior correction; the brief is updated.",
      )
      await acquisitionApi
        .explorationMap(cycleId)
        .then(setData)
        .catch(() => undefined)
    } catch {
      setResolutionNotice(
        locale === "es"
          ? "La resolución no fue aceptada. Comprueba la corrección previa y la versión de la ficha."
          : "Resolution rejected. Check the prior correction and current brief version.",
      )
    } finally {
      setResolutionPending(false)
    }
  }

  function isDescendantOf(nodeId: string, ancestorId: string): boolean {
    const pending = [byId.get(nodeId)].filter((node): node is MapNode => !!node)
    const visited = new Set<string>()
    while (pending.length) {
      const current = pending.shift()!
      if (current.id === ancestorId) return true
      if (visited.has(current.id)) continue
      visited.add(current.id)
      for (const relation of current.parents) {
        const parentNode = byId.get(relation.parentId)
        if (parentNode) pending.push(parentNode)
      }
    }
    return false
  }

  function pathForLead(lead: MapNode, linkId: string): MapNode[] | null {
    function walk(node: MapNode, stage: number): MapNode[] | null {
      if (node.kind !== stages[stage]) return null
      if (stage === 4 && node.id !== linkId) return null
      if (stage === 0) return node.parents.length === 0 ? [node] : null
      for (const relation of node.parents) {
        const parentNode = byId.get(relation.parentId)
        if (!parentNode) continue
        const prefix = walk(parentNode, stage - 1)
        if (prefix) return [...prefix, node]
      }
      return null
    }
    return walk(lead, 5)
  }

  const dispositions = companyProfile?.disposition ?? []
  const dispositionContextKey = `${companyProfile?.companyId ?? ""}:${selected[3]?.id ?? ""}:${selected[4]?.id ?? ""}`
  const effectiveDisposition =
    dispositions.find((item) => item.scope === "GLOBAL") ??
    dispositions.find(
      (item) => item.scope === "CHAIN" && item.branchId === selected[3]?.id,
    ) ??
    dispositions.find(
      (item) => item.scope === "LINK" && item.branchId === selected[4]?.id,
    )
  const dispositionScope =
    dispositionScopeSelection?.contextKey === dispositionContextKey
      ? (dispositionScopeSelection?.scope ?? "LINK")
      : (effectiveDisposition?.scope ?? "LINK")
  const dispositionBranchId =
    dispositionScope === "LINK"
      ? selected[4]?.id
      : dispositionScope === "CHAIN"
        ? selected[3]?.id
        : null
  const scopedDisposition = dispositions.find(
    (item) =>
      item.scope === dispositionScope &&
      (dispositionScope === "GLOBAL" || item.branchId === dispositionBranchId),
  )
  async function saveCompanyDisposition() {
    if (!companyProfile || !session || !canManage || dispositionPending) return
    const reason = dispositionReason.trim()
    if (reason.length < 8) {
      setDispositionNotice(
        locale === "es"
          ? "Escribe un motivo de al menos 8 caracteres."
          : "Enter a reason of at least 8 characters.",
      )
      return
    }
    if (dispositionScope !== "GLOBAL" && !dispositionBranchId) return
    const markets = new Set<"MX" | "US">([
      ...companyProfile.links.map((link) => link.market),
      ...companyProfile.leadNodeIds
        .map((leadId) => byId.get(leadId)?.market)
        .filter(
          (market): market is "MX" | "US" => market === "MX" || market === "US",
        ),
    ])
    const expectedVersions = Object.fromEntries(
      (data?.headers ?? [])
        .filter((header) => markets.has(header.market))
        .map((header) => [header.market, header.version]),
    ) as Partial<Record<"MX" | "US", number>>
    if (
      markets.size === 0 ||
      Object.keys(expectedVersions).length !== markets.size
    ) {
      setDispositionNotice(
        locale === "es"
          ? "No hay versiones vigentes para esta empresa."
          : "No current map versions are available for this company.",
      )
      return
    }
    setDispositionPending(true)
    setDispositionNotice("")
    try {
      await acquisitionApi.explorationCompanyDisposition(
        `company-disposition-${crypto.randomUUID()}`,
        {
          cycleId,
          operation: scopedDisposition ? "REOPEN" : "DISCARD",
          companyId: companyProfile.companyId,
          scope: dispositionScope,
          ...(dispositionScope === "GLOBAL"
            ? {}
            : { branchId: dispositionBranchId! }),
          reason,
          expectedVersions,
        },
        session.csrfToken,
      )
      const updated = await acquisitionApi.explorationMap(cycleId)
      setData(updated)
      setDispositionReason("")
      setDispositionNotice(
        locale === "es" ? "Disposición registrada." : "Disposition recorded.",
      )
    } catch {
      setDispositionNotice(
        locale === "es"
          ? "No se pudo registrar. Actualiza el mapa e inténtalo de nuevo."
          : "Could not record the disposition. Refresh the map and try again.",
      )
    } finally {
      setDispositionPending(false)
    }
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
      aria-label={
        mode === "attention"
          ? locale === "es"
            ? "Mapa de candidatas que necesitan tu atención"
            : "Candidates needing your attention map"
          : mode === "opportunities"
            ? locale === "es"
              ? "Mapa de oportunidades"
              : "Opportunities map"
            : locale === "es"
              ? "Mapa de exploración"
              : "Exploration map"
      }
    >
      <span className="acq-eyebrow">
        {mode === "attention"
          ? locale === "es"
            ? "Decisión pendiente"
            : "Pending decision"
          : mode === "opportunities"
            ? locale === "es"
              ? "Oportunidades"
              : "Opportunities"
            : locale === "es"
              ? "Exploración dirigida"
              : "Directed exploration"}
      </span>
      <h2>
        {mode === "attention"
          ? locale === "es"
            ? "Necesita tu atención"
            : "Needs your attention"
          : mode === "opportunities"
            ? locale === "es"
              ? "De la industria al encaje comercial"
              : "From industry to commercial fit"
            : locale === "es"
              ? "De la industria a la empresa"
              : "From industry to company"}
      </h2>
      <p className="acq-muted">
        {mode === "attention"
          ? locale === "es"
            ? "Cada empresa aparece una sola vez aquí mientras tenga un motivo abierto. La razón y las opciones disponibles preceden a la hipótesis comercial."
            : "Each company appears here once while a reason remains open. The reason and available options precede its commercial hypothesis."
          : mode === "opportunities"
            ? locale === "es"
              ? "Recorre las empresas que avanzaron con una tesis de encaje sustentada. Cada ficha conserva su eslabón y sus fuentes."
              : "Explore companies advanced with a sourced fit thesis. Each brief retains its supply chain link and sources."
            : locale === "es"
              ? "Selecciona una rama en cada nivel para ver todas sus vertientes registradas. Una entrega de cadena no demuestra que se hayan encontrado todos sus eslabones."
              : "Select a branch at each level to see all recorded alternatives. A chain delivery does not prove that all its links have been found."}
      </p>
      {mode === "exploration" && (
        <button
          type="button"
          className="acq-global-search-return"
          aria-pressed={showClosedHistory}
          onClick={() => setShowClosedHistory((current) => !current)}
        >
          {showClosedHistory
            ? locale === "es"
              ? "Ocultar historial cerrado"
              : "Hide closed history"
            : locale === "es"
              ? "Consultar historial cerrado"
              : "View closed history"}
        </button>
      )}
      <div
        className="acq-market-filter"
        role="group"
        aria-label={
          locale === "es" ? "Mercado de exploración" : "Exploration market"
        }
      >
        {(["ALL", "MX", "US"] as const).map((market) => (
          <button
            key={market}
            type="button"
            aria-pressed={marketFilter === market}
            onClick={() => {
              setMarketFilter(market)
              setSelectedIds((current) =>
                current.map((id, index) => {
                  if (index !== stages.length - 1 || market === "ALL") return id
                  return byId.get(id ?? "")?.market === market ? id : null
                }),
              )
            }}
          >
            {market === "ALL"
              ? locale === "es"
                ? "Todos"
                : "All"
              : market === "MX"
                ? locale === "es"
                  ? "México"
                  : "Mexico"
                : locale === "es"
                  ? "Estados Unidos"
                  : "United States"}
          </button>
        ))}
      </div>
      <div className="acq-global-search">
        <label htmlFor={`acq-global-company-search-${mode}`}>
          {locale === "es"
            ? "Buscar empresa en todo el mapa"
            : "Search companies across the map"}
        </label>
        <input
          id={`acq-global-company-search-${mode}`}
          type="search"
          value={globalQuery}
          onChange={(event) => {
            setGlobalQuery(event.target.value)
            setGlobalSearchOpen(true)
          }}
          placeholder={
            locale === "es"
              ? "Nombre, alias o metadato"
              : "Name, alias, or metadata"
          }
        />
        {globalSearchTerm.length >= 2 && !globalSearchOpen && (
          <button
            type="button"
            className="acq-global-search-return"
            onClick={() => setGlobalSearchOpen(true)}
          >
            {locale === "es" ? "Volver a resultados" : "Back to results"}
          </button>
        )}
        {globalSearchTerm.length >= 2 && globalSearchOpen && (
          <div
            className="acq-global-results"
            role="group"
            aria-label={
              locale === "es"
                ? "Resultados de búsqueda global"
                : "Global search results"
            }
          >
            <p className="acq-muted">
              {locale === "es"
                ? `${globalResults.length} ${globalResults.length === 1 ? "ubicación encontrada" : "ubicaciones encontradas"}`
                : `${globalResults.length} ${globalResults.length === 1 ? "location found" : "locations found"}`}
            </p>
            {globalResults.slice(0, 50).map(({ lead, path }) => (
              <button
                type="button"
                key={`${lead.id}:${path[4]!.id}`}
                onClick={() => {
                  setSelectedIds(path.map((node) => node.id))
                  setActiveStage(5)
                  setGlobalSearchOpen(false)
                }}
              >
                <strong>{displayLabel(lead)}</strong>
                <span>
                  {lead.market === "MX" ? "MX · México" : "US · Estados Unidos"}
                </span>
                <small>
                  {displayLabel(path[3]!)} › {displayLabel(path[4]!)}
                </small>
              </button>
            ))}
            {globalResults.length > 50 && (
              <p className="acq-muted">
                {locale === "es"
                  ? "Afina la búsqueda para ver más ubicaciones."
                  : "Refine your search to see more locations."}
              </p>
            )}
          </div>
        )}
      </div>
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
      {data && mode === "attention" && visibleProfiles.length === 0 && (
        <p className="acq-muted">
          {locale === "es"
            ? "No hay candidatas con decisiones comerciales pendientes."
            : "No candidates have pending commercial decisions."}
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
                    {selected[index]
                      ? displayLabel(selected[index])
                      : locale === "es"
                        ? "Por elegir"
                        : "Choose a branch"}
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
                    : `${filteredOptions.length} recorded ${filteredOptions.length === 1 ? "option" : "options"}`}
                </span>
              </div>
              {parent && <p className="acq-muted">{displayLabel(parent)}</p>}
              {activeStage === 5 && (
                <div className="acq-company-filters">
                  <label>
                    {locale === "es"
                      ? "Buscar empresa o metadatos"
                      : "Search company or metadata"}
                    <input
                      type="search"
                      value={companyQuery}
                      onChange={(event) => setCompanyQuery(event.target.value)}
                      placeholder={
                        locale === "es"
                          ? "Nombre, alias o etiqueta"
                          : "Name, alias, or tag"
                      }
                    />
                  </label>
                  {allTags.length > 0 && (
                    <div
                      className="acq-company-tags"
                      aria-label={
                        locale === "es"
                          ? "Filtrar por etiqueta"
                          : "Filter by tag"
                      }
                    >
                      {allTags.map((tag) => {
                        const active = selectedTags.includes(tag)
                        return (
                          <button
                            type="button"
                            key={tag}
                            aria-pressed={active}
                            onClick={() =>
                              setSelectedTags((current) =>
                                active
                                  ? current.filter((item) => item !== tag)
                                  : [...current, tag],
                              )
                            }
                          >
                            {tag}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
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
                {filteredOptions.map((node) => (
                  <div className="acq-exploration-option" key={node.id}>
                    <button
                      type="button"
                      aria-pressed={selected[activeStage]?.id === node.id}
                      onClick={() => choose(node)}
                    >
                      <span className="acq-market-badge">
                        {activeStage === 5
                          ? node.market === "MX"
                            ? "MX · México"
                            : "US · Estados Unidos"
                          : marketFilter !== "ALL"
                            ? marketFilter
                            : [
                                ...new Set(
                                  (
                                    conceptMembers.get(conceptKey(node)) ?? [
                                      node,
                                    ]
                                  ).map((member) => member.market),
                                ),
                              ]
                                .sort()
                                .join(" · ")}
                      </span>
                      <strong>{displayLabel(node)}</strong>
                      <small>
                        {optionDetail(
                          node,
                          activeStage,
                          nodes,
                          progress,
                          locale,
                          marketFilter,
                          mode,
                        )}
                      </small>
                      {mode === "exploration" &&
                        activeStage < 5 &&
                        (marketFilter !== "ALL" ||
                          (conceptMembers.get(conceptKey(node))?.length ??
                            1) === 1) && (
                          <small>{mapState(node, locale)}</small>
                        )}
                    </button>
                    {mode === "exploration" &&
                      data.marketPresence
                        .filter(
                          (item) =>
                            (
                              conceptMembers.get(conceptKey(node)) ?? [node]
                            ).some((member) => member.id === item.node_id) &&
                            (marketFilter === "ALL" ||
                              item.market === marketFilter),
                        )
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
                            {marketPresenceNote(presence.relation, locale) && (
                              <>
                                {" "}
                                ·{" "}
                                {marketPresenceNote(presence.relation, locale)}
                              </>
                            )}
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
                    {mode === "exploration" &&
                      activeStage === 3 &&
                      coverageForChain(node)}
                    {mode === "exploration" &&
                      (marketFilter !== "ALL" ||
                      (conceptMembers.get(conceptKey(node))?.length ?? 1) ===
                        1 ? (
                        <>
                          {nodeDecision(node)}
                          {decisionControls(node)}
                        </>
                      ) : (
                        <p className="acq-muted">
                          {locale === "es"
                            ? "Elige México o Estados Unidos para decidir sobre esa rama en un mercado."
                            : "Choose Mexico or the United States to decide on this branch in one market."}
                        </p>
                      ))}
                  </div>
                ))}
              </div>
            </div>

            <aside className="acq-zoom-company">
              {company ? (
                <>
                  <span className="acq-eyebrow">
                    {mode !== "exploration"
                      ? locale === "es"
                        ? "Ficha de oportunidad · hipótesis"
                        : "Opportunity brief · hypothesis"
                      : locale === "es"
                        ? "Ficha de empresa · pista"
                        : "Company brief · lead"}
                  </span>
                  <h4>{companyProfile?.displayName ?? company.label}</h4>
                  {mode === "opportunities" &&
                    companyProfile?.contactScreenRequired && (
                      <p className="acq-company-contact-screen">
                        {locale === "es"
                          ? "Pendiente revisar correo, Facebook, Instagram y WhatsApp con fuentes atribuibles. Esto no significa que no exista un medio: solo una revisión completa puede determinarlo."
                          : "Email, Facebook, Instagram, and WhatsApp still need a sourced review. This does not mean no channel exists; only a complete review can establish that."}
                      </p>
                    )}
                  {mode === "attention" &&
                    companyProfile?.attention?.status === "OPEN" && (
                      <section
                        className="acq-company-attention"
                        aria-label={
                          locale === "es"
                            ? "Motivos y opciones de atención"
                            : "Attention reasons and options"
                        }
                      >
                        <span className="acq-eyebrow">
                          {locale === "es"
                            ? "Decisión requerida"
                            : "Decision required"}
                        </span>
                        {[...companyProfile.attention.reasons]
                          .sort(
                            (a, b) =>
                              Number(
                                b.code ===
                                  companyProfile.attention?.primaryReasonCode,
                              ) -
                              Number(
                                a.code ===
                                  companyProfile.attention?.primaryReasonCode,
                              ),
                          )
                          .map((reason) => (
                            <article
                              key={`${reason.code}:${reason.linkId ?? "company"}`}
                            >
                              <h5>{reason.summary}</h5>
                              <p className="acq-muted">
                                {reason.linkId
                                  ? reason.linkId === selected[4]?.id
                                    ? locale === "es"
                                      ? "Este eslabón"
                                      : "This link"
                                    : locale === "es"
                                      ? "Otro eslabón de esta empresa"
                                      : "Another company link"
                                  : locale === "es"
                                    ? "Toda la empresa"
                                    : "Whole company"}
                              </p>
                              {reason.checkedChannels?.length ? (
                                <p>
                                  <strong>
                                    {locale === "es"
                                      ? "Medios revisados"
                                      : "Channels checked"}
                                    :
                                  </strong>{" "}
                                  {reason.checkedChannels.join(", ")}
                                </p>
                              ) : null}
                              {reason.evidenceRefs?.length ? (
                                <details>
                                  <summary>
                                    {locale === "es"
                                      ? "Evidencia revisada"
                                      : "Reviewed evidence"}
                                  </summary>
                                  <ul>
                                    {reason.evidenceRefs.map((ref) => (
                                      <li key={ref}>{ref}</li>
                                    ))}
                                  </ul>
                                </details>
                              ) : null}
                            </article>
                          ))}
                        <h5>
                          {locale === "es"
                            ? "Opciones disponibles"
                            : "Available options"}
                        </h5>
                        <div className="acq-attention-actions">
                          {companyProfile.attention.actions.map((action) => (
                            <article key={action.code}>
                              <strong>{action.label}</strong>
                              <span>
                                {action.actor === "MANAGEMENT"
                                  ? locale === "es"
                                    ? "Lo hago yo"
                                    : "I do it"
                                  : locale === "es"
                                    ? "Encargar a Panky"
                                    : "Ask Panky"}
                              </span>
                              <p>{action.resultHint}</p>
                              {action.enabled === false && (
                                <small className="acq-muted">
                                  {locale === "es"
                                    ? "Requiere primero una corrección comprobada en el expediente."
                                    : "A verified underlying record change is required first."}
                                </small>
                              )}
                              {action.code === "REGISTER_CONTACT" &&
                                action.enabled !== false &&
                                companyProfile.attention?.reasons.some(
                                  (reason) =>
                                    reason.code === "NO_VERIFIED_CONTACT",
                                ) &&
                                session.actor.capabilities.includes(
                                  "MANAGE_CYCLE",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (
                                        contactDraftCompanyId !==
                                        companyProfile.companyId
                                      ) {
                                        contactCommand.current = null
                                        setContactRecorded(false)
                                      }
                                      setContactDraftCompanyId(
                                        companyProfile.companyId,
                                      )
                                      setContactNotice("")
                                    }}
                                  >
                                    {locale === "es"
                                      ? "Registrar medio con fuente"
                                      : "Record sourced contact method"}
                                  </button>
                                )}
                              {action.actor === "PANKY" &&
                                action.enabled !== false &&
                                session.actor.capabilities.includes(
                                  "MANAGE_CYCLE",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      researchCommand.current = null
                                      setResearchActionCode(action.code)
                                      setResearchDraftCompanyId(
                                        companyProfile.companyId,
                                      )
                                      setResearchNotice("")
                                    }}
                                  >
                                    {locale === "es"
                                      ? "Preparar encargo acotado"
                                      : "Prepare bounded research"}
                                  </button>
                                )}
                              {(action.code === "CLOSE_CANDIDATE" ||
                                action.code === "CLOSE_NO_FIT") &&
                                action.enabled !== false &&
                                companyProfile.enrichment?.stage ===
                                  "FILTERING" &&
                                session.actor.capabilities.includes(
                                  "MANAGE_CYCLE",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      closeCommand.current = null
                                      setCloseDraftCompanyId(
                                        companyProfile.companyId,
                                      )
                                      setCloseSource(
                                        selectedFitReview?.companySourceUrl ??
                                          "",
                                      )
                                      setCloseNotice("")
                                    }}
                                  >
                                    {locale === "es"
                                      ? "Preparar decisión de cierre"
                                      : "Prepare closure decision"}
                                  </button>
                                )}
                              {(
                                [
                                  "CONFIRM_IDENTITY",
                                  "KEEP_IDENTITIES_SEPARATE",
                                  "KEEP_SEPARATE",
                                  "CORRECT_FIT_THESIS",
                                ] as const
                              ).some((code) => code === action.code) &&
                                action.enabled === true &&
                                (action.code === "KEEP_SEPARATE"
                                  ? companyProfile.attention?.reasons.some(
                                      (reason) =>
                                        reason.code ===
                                          "PRIOR_RELATIONSHIP_CONFLICT" &&
                                        !!reason.relatedRecordRef,
                                    )
                                  : !!action.supportingActionId) &&
                                session.actor.capabilities.includes(
                                  "MANAGE_CYCLE",
                                ) && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      resolutionCommand.current = null
                                      setResolutionDraft({
                                        companyId: companyProfile.companyId,
                                        actionCode: action.code as
                                          | "CONFIRM_IDENTITY"
                                          | "KEEP_IDENTITIES_SEPARATE"
                                          | "KEEP_SEPARATE"
                                          | "CORRECT_FIT_THESIS",
                                      })
                                      setResolutionNotice("")
                                    }}
                                  >
                                    {locale === "es"
                                      ? "Registrar resolución sustentada"
                                      : "Record supported resolution"}
                                  </button>
                                )}
                            </article>
                          ))}
                        </div>
                        {researchActionCode &&
                          researchDraftCompanyId ===
                            companyProfile.companyId && (
                            <form
                              className="acq-attention-contact-form"
                              onSubmit={(event) => {
                                event.preventDefault()
                                void requestAttentionResearch()
                              }}
                            >
                              <h5>
                                {locale === "es"
                                  ? "Encargar investigación a Panky"
                                  : "Request Panky research"}
                              </h5>
                              <label>
                                {locale === "es"
                                  ? "Pregunta concreta"
                                  : "Specific question"}
                                <textarea
                                  required
                                  minLength={12}
                                  maxLength={500}
                                  value={researchQuestion}
                                  disabled={researchPending}
                                  onChange={(event) => {
                                    researchCommand.current = null
                                    setResearchQuestion(event.target.value)
                                  }}
                                />
                              </label>
                              <label>
                                {locale === "es"
                                  ? "Límite en minutos"
                                  : "Time limit in minutes"}
                                <input
                                  required
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={researchMinutes}
                                  disabled={researchPending}
                                  onChange={(event) => {
                                    researchCommand.current = null
                                    setResearchMinutes(
                                      Number(event.target.value),
                                    )
                                  }}
                                />
                              </label>
                              <button type="submit" disabled={researchPending}>
                                {researchPending
                                  ? locale === "es"
                                    ? "Registrando…"
                                    : "Queuing…"
                                  : locale === "es"
                                    ? "Poner encargo en cola"
                                    : "Queue research"}
                              </button>
                              <p className="acq-muted">
                                {locale === "es"
                                  ? "El encargo queda en cola; esta acción no acredita datos ni resuelve el motivo."
                                  : "This queues research; it does not prove a fact or resolve the reason."}
                              </p>
                            </form>
                          )}
                        {companyProfile.attention.researchRequests?.length ? (
                          <details>
                            <summary>
                              {locale === "es"
                                ? "Encargos registrados"
                                : "Recorded requests"}
                            </summary>
                            <ul>
                              {companyProfile.attention.researchRequests.map(
                                (request, index) => (
                                  <li
                                    key={`${request.reasonCode}:${request.requestedAt}:${index}`}
                                  >
                                    {request.question} · {request.status}
                                  </li>
                                ),
                              )}
                            </ul>
                          </details>
                        ) : null}
                        {researchNotice && (
                          <p role="status">{researchNotice}</p>
                        )}
                        {closeDraftCompanyId === companyProfile.companyId && (
                          <form
                            className="acq-attention-contact-form"
                            onSubmit={(event) => {
                              event.preventDefault()
                              void recordAttentionClose()
                            }}
                          >
                            <h5>
                              {locale === "es"
                                ? "Decisión de cierre"
                                : "Closure decision"}
                            </h5>
                            <label>
                              {locale === "es" ? "Alcance" : "Scope"}
                              <select
                                value={closeScope}
                                disabled={closePending}
                                onChange={(event) => {
                                  closeCommand.current = null
                                  setCloseScope(
                                    event.target.value as typeof closeScope,
                                  )
                                }}
                              >
                                <option value="COMPANY">
                                  {locale === "es"
                                    ? "Toda la empresa"
                                    : "Whole company"}
                                </option>
                                <option value="LINK">
                                  {locale === "es"
                                    ? "Este eslabón"
                                    : "This link"}
                                </option>
                              </select>
                            </label>
                            <label>
                              {locale === "es"
                                ? "Motivo sustentado"
                                : "Evidence-based reason"}
                              <textarea
                                required
                                minLength={20}
                                maxLength={1000}
                                value={closeReason}
                                disabled={closePending}
                                onChange={(event) => {
                                  closeCommand.current = null
                                  setCloseReason(event.target.value)
                                }}
                              />
                            </label>
                            <label>
                              {locale === "es"
                                ? "Fuente observada en este eslabón"
                                : "Source observed in this link"}
                              <input
                                required
                                type="url"
                                pattern="https://.*"
                                value={closeSource}
                                disabled={closePending}
                                onChange={(event) => {
                                  closeCommand.current = null
                                  setCloseSource(event.target.value)
                                }}
                              />
                            </label>
                            <button type="submit" disabled={closePending}>
                              {closePending
                                ? locale === "es"
                                  ? "Registrando…"
                                  : "Recording…"
                                : locale === "es"
                                  ? "Registrar decisión para el Engine"
                                  : "Record decision for the Engine"}
                            </button>
                            <p className="acq-muted">
                              {locale === "es"
                                ? "La decisión queda pendiente de aplicación por el Engine. No inicia contacto externo."
                                : "The Engine must apply this decision. It does not initiate outreach."}
                            </p>
                          </form>
                        )}
                        {closeNotice && <p role="status">{closeNotice}</p>}
                        {resolutionDraft?.companyId ===
                          companyProfile.companyId && (
                          <form
                            className="acq-attention-contact-form"
                            onSubmit={(event) => {
                              event.preventDefault()
                              void resolveMaterialAttention()
                            }}
                          >
                            <h5>
                              {locale === "es"
                                ? "Registrar resolución con respaldo"
                                : "Record supported resolution"}
                            </h5>
                            <p className="acq-muted">
                              {locale === "es"
                                ? "La corrección subyacente ya debe constar en el expediente; esta decisión únicamente resuelve el motivo de atención."
                                : "The underlying correction must already be in the record; this decision only resolves the attention reason."}
                            </p>
                            <label>
                              {locale === "es"
                                ? "Evidencia revisada (URL o recibo)"
                                : "Reviewed evidence (URL or receipt)"}
                              <input
                                required
                                minLength={8}
                                maxLength={500}
                                value={resolutionEvidence}
                                disabled={resolutionPending}
                                onChange={(event) => {
                                  resolutionCommand.current = null
                                  setResolutionEvidence(event.target.value)
                                }}
                              />
                            </label>
                            <label>
                              {locale === "es"
                                ? "Explicación de la decisión"
                                : "Decision explanation"}
                              <textarea
                                required
                                minLength={20}
                                maxLength={1000}
                                value={resolutionText}
                                disabled={resolutionPending}
                                onChange={(event) => {
                                  resolutionCommand.current = null
                                  setResolutionText(event.target.value)
                                }}
                              />
                            </label>
                            <button type="submit" disabled={resolutionPending}>
                              {resolutionPending
                                ? locale === "es"
                                  ? "Guardando…"
                                  : "Saving…"
                                : locale === "es"
                                  ? "Resolver motivo con evidencia"
                                  : "Resolve reason with evidence"}
                            </button>
                          </form>
                        )}
                        {resolutionNotice && (
                          <p role="status">{resolutionNotice}</p>
                        )}
                        {contactDraftCompanyId === companyProfile.companyId &&
                          companyProfile.attention.reasons.some(
                            (reason) => reason.code === "NO_VERIFIED_CONTACT",
                          ) && (
                            <form
                              className="acq-attention-contact-form"
                              onSubmit={(event) => {
                                event.preventDefault()
                                void recordContactMethod()
                              }}
                            >
                              <h5>
                                {locale === "es"
                                  ? "Acreditar un medio de contacto"
                                  : "Verify a contact method"}
                              </h5>
                              <label>
                                {locale === "es"
                                  ? "Tipo de medio"
                                  : "Channel type"}
                                <select
                                  value={contactType}
                                  disabled={contactPending || contactRecorded}
                                  onChange={(event) => {
                                    contactCommand.current = null
                                    setContactRecorded(false)
                                    setContactType(
                                      event.target.value as typeof contactType,
                                    )
                                  }}
                                >
                                  <option value="EMAIL">Email</option>
                                  <option value="FACEBOOK">Facebook</option>
                                  <option value="INSTAGRAM">Instagram</option>
                                  <option value="WHATSAPP">WhatsApp</option>
                                </select>
                              </label>
                              <label>
                                {locale === "es"
                                  ? "Correo, perfil o número"
                                  : "Address, profile, or number"}
                                <input
                                  required
                                  minLength={3}
                                  maxLength={500}
                                  value={contactValue}
                                  disabled={contactPending || contactRecorded}
                                  onChange={(event) => {
                                    contactCommand.current = null
                                    setContactRecorded(false)
                                    setContactValue(event.target.value)
                                  }}
                                />
                              </label>
                              <label>
                                {locale === "es"
                                  ? "Fuente original HTTPS"
                                  : "Original HTTPS source"}
                                <input
                                  required
                                  type="url"
                                  pattern="https://.*"
                                  value={contactSource}
                                  disabled={contactPending || contactRecorded}
                                  onChange={(event) => {
                                    contactCommand.current = null
                                    setContactRecorded(false)
                                    setContactSource(event.target.value)
                                  }}
                                />
                              </label>
                              <label>
                                {locale === "es"
                                  ? "Cómo se atribuye a esta empresa"
                                  : "How this belongs to the company"}
                                <textarea
                                  required
                                  minLength={20}
                                  maxLength={1000}
                                  value={contactAttribution}
                                  disabled={contactPending || contactRecorded}
                                  onChange={(event) => {
                                    contactCommand.current = null
                                    setContactRecorded(false)
                                    setContactAttribution(event.target.value)
                                  }}
                                />
                              </label>
                              <button type="submit" disabled={contactPending}>
                                {contactPending
                                  ? locale === "es"
                                    ? "Guardando…"
                                    : "Saving…"
                                  : locale === "es"
                                    ? "Guardar y resolver este motivo"
                                    : "Save and resolve this reason"}
                              </button>
                              <p className="acq-muted">
                                {locale === "es"
                                  ? "Registrar el medio no envía mensajes ni autoriza contacto externo."
                                  : "Recording the method sends no messages and does not authorize outreach."}
                              </p>
                            </form>
                          )}
                        {contactNotice && <p role="status">{contactNotice}</p>}
                      </section>
                    )}
                  {mode !== "exploration" && (
                    <section
                      className="acq-company-fit"
                      aria-label={
                        locale === "es" ? "Encaje propuesto" : "Proposed fit"
                      }
                    >
                      <span className="acq-eyebrow">
                        {locale === "es"
                          ? "Hipótesis comercial · este eslabón"
                          : "Commercial hypothesis · this link"}
                      </span>
                      {selectedFitReview ? (
                        <>
                          <h5>{selectedFitReview.proposedOffer}</h5>
                          <p>
                            <strong>
                              {locale === "es"
                                ? "Por qué conversar"
                                : "Why discuss"}
                              :
                            </strong>{" "}
                            {selectedFitReview.fitHypothesis}
                          </p>
                          <p className="acq-fit-question">
                            <strong>
                              {locale === "es"
                                ? "Pregunta para validar"
                                : "Question to validate"}
                              :
                            </strong>{" "}
                            {selectedFitReview.commercialQuestion}
                          </p>
                          <details>
                            <summary>
                              {locale === "es"
                                ? "Evidencia, límites y fuentes"
                                : "Evidence, limits and sources"}
                            </summary>
                            <p>
                              <strong>
                                {locale === "es"
                                  ? "Proceso observado"
                                  : "Observed process"}
                                :
                              </strong>{" "}
                              {selectedFitReview.process}
                            </p>
                            <p>
                              <strong>
                                {locale === "es"
                                  ? "Capacidad de Brunova"
                                  : "Brunova capability"}
                                :
                              </strong>{" "}
                              {selectedFitReview.brunovaCapability}
                            </p>
                            <p>
                              <strong>
                                {locale === "es"
                                  ? "Incertidumbre"
                                  : "Uncertainty"}
                                :
                              </strong>{" "}
                              {selectedFitReview.uncertainty}
                            </p>
                            <p>
                              <strong>
                                {locale === "es"
                                  ? "Contraevidencia"
                                  : "Counterevidence"}
                                :
                              </strong>{" "}
                              {selectedFitReview.counterevidence}
                            </p>
                            <a
                              href={selectedFitReview.companySourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {locale === "es"
                                ? "Fuente de la empresa"
                                : "Company source"}
                            </a>
                            {" · "}
                            <a
                              href={selectedFitReview.brunovaSourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {locale === "es"
                                ? "Capacidad de Brunova"
                                : "Brunova capability"}
                            </a>
                          </details>
                        </>
                      ) : (
                        <p>
                          {locale === "es"
                            ? "No hay tesis aprobada para este eslabón. Revisa las otras rutas de la empresa."
                            : "No approved thesis for this link. Review the company's other routes."}
                        </p>
                      )}
                    </section>
                  )}
                  {companyProfile?.enrichment && (
                    <section
                      className="acq-company-enrichment-status"
                      aria-label={
                        locale === "es"
                          ? "Etapa de la empresa"
                          : "Company stage"
                      }
                    >
                      <span className="acq-eyebrow">
                        {locale === "es" ? "Etapa global" : "Global stage"}
                      </span>
                      <strong>
                        {candidateStageNames[companyProfile.enrichment.stage]?.[
                          locale === "es" ? 0 : 1
                        ] ?? companyProfile.enrichment.stage}
                      </strong>
                      {companyProfile.enrichment.stage === "CLOSED" && (
                        <p>
                          {companyProfile.enrichment.closedBy ===
                          "ENGINE_WORKER"
                            ? locale === "es"
                              ? "Cerrada por el Engine"
                              : "Closed by the Engine"
                            : locale === "es"
                              ? "Origen del cierre no disponible"
                              : "Closure origin unavailable"}
                        </p>
                      )}
                      <dl>
                        <div>
                          <dt>
                            {locale === "es" ? "Descubierta" : "Discovered"}
                          </dt>
                          <dd>
                            {candidateDate(
                              companyProfile.enrichment.discoveredAt,
                              locale,
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt>
                            {locale === "es"
                              ? "Última actividad"
                              : "Last activity"}
                          </dt>
                          <dd>
                            {candidateDate(
                              companyProfile.enrichment.lastTouchedAt,
                              locale,
                            )}
                          </dd>
                        </div>
                        {companyProfile.enrichment.contactedAt && (
                          <div>
                            <dt>
                              {locale === "es"
                                ? "Primer contacto"
                                : "First contact"}
                            </dt>
                            <dd>
                              {candidateDate(
                                companyProfile.enrichment.contactedAt,
                                locale,
                              )}
                            </dd>
                          </div>
                        )}
                        {companyProfile.enrichment.closedAt && (
                          <div>
                            <dt>{locale === "es" ? "Cierre" : "Closed"}</dt>
                            <dd>
                              {candidateDate(
                                companyProfile.enrichment.closedAt,
                                locale,
                              )}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {companyProfile.enrichment.closureReason && (
                        <p>
                          {locale === "es"
                            ? "Motivo de cierre"
                            : "Closure reason"}
                          :{" "}
                          {companyProfile.enrichment.closureReason ===
                          "INSUFFICIENT_INFORMATION"
                            ? locale === "es"
                              ? "Información insuficiente tras investigar las vías pertinentes"
                              : "Insufficient information after pertinent research"
                            : companyProfile.enrichment.closureReason ===
                                "EARLY_NO_ATTRIBUTED_PRESENCE"
                              ? locale === "es"
                                ? "La búsqueda inicial revisada no acreditó identidad ni vía de acceso; se detuvo el gasto de investigación"
                                : "The reviewed first search established neither identity nor access route; research spending stopped"
                              : companyProfile.enrichment.closureReason ===
                                  "NO_BRUNOVA_FIT"
                                ? locale === "es"
                                  ? "Sin encaje defendible con Brunova en el eslabón revisado"
                                  : "No defensible Brunova fit in the reviewed link"
                                : companyProfile.enrichment.closureReason}
                        </p>
                      )}
                    </section>
                  )}
                  {companyProfile &&
                    companyProfile.identityStatus !== "RESOLVED" && (
                      <p className="acq-company-identity-state">
                        <span className="acq-status-chip">
                          {identityLabel(companyProfile.identityStatus, locale)}
                        </span>{" "}
                        {companyProfile.aliases.length > 0
                          ? `${locale === "es" ? "También conocida como" : "Also known as"}: ${companyProfile.aliases
                              .map((alias) =>
                                cleanExplorationText(alias, locale),
                              )
                              .filter(Boolean)
                              .join(", ")}`
                          : ""}
                      </p>
                    )}
                  <span className="acq-market-badge">
                    {company.market === "MX"
                      ? "MX · México"
                      : "US · Estados Unidos"}
                  </span>
                  {selected[3] && selected[4] && (
                    <section
                      className="acq-company-selected-link"
                      aria-label={
                        locale === "es"
                          ? "Contexto del eslabón seleccionado"
                          : "Selected link context"
                      }
                    >
                      <span className="acq-eyebrow">
                        {locale === "es"
                          ? "En este eslabón"
                          : "In this supply chain link"}
                      </span>
                      <strong>
                        {displayLabel(selected[3])} ›{" "}
                        {displayLabel(selected[4])}
                      </strong>
                      {selectedLinkProfile && (
                        <>
                          <p className="acq-company-current-function">
                            <strong>
                              {locale === "es" ? "Función" : "Function"}
                            </strong>{" "}
                            {selectedFunctionSummary ||
                              (locale === "es" ? "Por confirmar" : "Pending")}
                            <span className="acq-status-chip">
                              {evidenceLabel(
                                selectedLinkProfile.evidenceStatus,
                                locale,
                              )}
                            </span>
                          </p>
                          {selectedLinkRoles.length > 1 && (
                            <p>
                              {locale === "es"
                                ? "Funciones en conflicto para este eslabón; revisar las fuentes."
                                : "Conflicting roles for this link; review the sources."}
                            </p>
                          )}
                          {selectedLinkObservations.length > 0 && (
                            <details className="acq-company-link-evidence">
                              <summary>
                                {locale === "es"
                                  ? `Observaciones y fuentes (${selectedLinkObservations.reduce((count, item) => count + item.sources.length, 0)})`
                                  : `Observations and sources (${selectedLinkObservations.reduce((count, item) => count + item.sources.length, 0)})`}
                              </summary>
                              {selectedLinkObservations.map((observation) => (
                                <div
                                  className="acq-company-link-observation"
                                  key={normalizeText(observation.statement)}
                                >
                                  <p>
                                    {observation.repeatsRole
                                      ? locale === "es"
                                        ? "La función indicada también aparece en estas fuentes."
                                        : "The stated function also appears in these sources."
                                      : cleanExplorationText(
                                          observation.statement,
                                          locale,
                                        )}
                                  </p>
                                  {observation.sources.map((context, index) => (
                                    <small
                                      key={`${context.sourceUrl ?? "source"}:${index}`}
                                    >
                                      <span className="acq-status-chip acq-status-chip--subtle">
                                        {evidenceLabel(context.status, locale)}
                                      </span>{" "}
                                      {safeHttpUrl(context.sourceUrl) ? (
                                        <a
                                          href={
                                            safeHttpUrl(context.sourceUrl)!.href
                                          }
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          {locale === "es"
                                            ? "Abrir fuente"
                                            : "Open source"}
                                        </a>
                                      ) : null}
                                      {context.observedAt
                                        ? ` · ${observedDate(context.observedAt, locale)}`
                                        : ""}
                                    </small>
                                  ))}
                                </div>
                              ))}
                            </details>
                          )}
                        </>
                      )}
                    </section>
                  )}
                  {selectedMinimums && (
                    <section
                      className="acq-company-minimums"
                      aria-label={
                        locale === "es"
                          ? "Mínimos para avanzar"
                          : "Minimums to advance"
                      }
                    >
                      <span className="acq-eyebrow">
                        {locale === "es"
                          ? "Mínimos para avanzar"
                          : "Minimums to advance"}
                      </span>
                      <strong>
                        {
                          minimumChecklist.filter(
                            ([key]) => selectedMinimums[key],
                          ).length
                        }{" "}
                        / {minimumChecklist.length}{" "}
                        {locale === "es" ? "sustentados" : "supported"}
                      </strong>
                      <ul>
                        {minimumChecklist.map(([key, label]) => (
                          <li
                            key={key}
                            className={
                              selectedMinimums[key]
                                ? "is-supported"
                                : "is-missing"
                            }
                          >
                            <span aria-hidden="true">
                              {selectedMinimums[key] ? "✓" : "○"}
                            </span>
                            <span>{label}</span>
                            <small>
                              {selectedMinimums[key]
                                ? locale === "es"
                                  ? "Con fuente"
                                  : "Sourced"
                                : locale === "es"
                                  ? "Falta sustento"
                                  : "Needs evidence"}
                            </small>
                          </li>
                        ))}
                      </ul>
                      {nextEnrichmentQuestion && (
                        <p>
                          {locale === "es"
                            ? "Siguiente pregunta registrada"
                            : "Recorded next question"}
                          :{" "}
                          {cleanExplorationText(nextEnrichmentQuestion, locale)}
                        </p>
                      )}
                    </section>
                  )}
                  {selectedEnrichmentAttempts.length > 0 && (
                    <section
                      className="acq-company-enrichment-attempts"
                      aria-label={
                        locale === "es"
                          ? "Investigación de este eslabón"
                          : "Research for this link"
                      }
                    >
                      <span className="acq-eyebrow">
                        {locale === "es"
                          ? "Investigación de este eslabón"
                          : "Research for this link"}
                      </span>
                      <p>
                        {locale === "es"
                          ? "Las respuestas de IA son pistas; cada fuente original se revisa por separado."
                          : "AI answers are leads; every original source is reviewed separately."}
                      </p>
                      {selectedEnrichmentAttempts.map((attempt) => (
                        <details key={attempt.attemptId}>
                          <summary>
                            {attempt.dimension.replaceAll("_", " ")} ·{" "}
                            {attempt.fieldKey.replaceAll("_", " ")} ·{" "}
                            {candidateDate(attempt.recordedAt, locale)}
                          </summary>
                          {attempt.question && <p>{attempt.question}</p>}
                          <ul>
                            {attempt.sourceReceipts.length > 0 ? (
                              attempt.sourceReceipts.map((source, index) => (
                                <li
                                  key={`${source.uri ?? "unavailable"}-${index}`}
                                >
                                  {safeHttpUrl(source.uri) ? (
                                    <a
                                      href={safeHttpUrl(source.uri)!.href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {locale === "es"
                                        ? "Fuente original"
                                        : "Original source"}
                                    </a>
                                  ) : locale === "es" ? (
                                    "Fuente no disponible"
                                  ) : (
                                    "Source unavailable"
                                  )}
                                  {` · ${source.outcome === "READ" ? (locale === "es" ? "Leída" : "Read") : locale === "es" ? "No disponible" : "Unavailable"}`}
                                  {source.excerpt && (
                                    <small>
                                      {cleanExplorationText(
                                        source.excerpt,
                                        locale,
                                      )}
                                    </small>
                                  )}
                                </li>
                              ))
                            ) : (
                              <li>
                                {locale === "es"
                                  ? "Sin páginas originales leídas en este intento"
                                  : "No original pages read in this attempt"}
                              </li>
                            )}
                          </ul>
                        </details>
                      ))}
                    </section>
                  )}
                  {companyCrossLinks.length > 0 && (
                    <div className="acq-company-crosslinks">
                      <h5>
                        {locale === "es"
                          ? "Referencias en otros eslabones"
                          : "References in other supply chain links"}
                      </h5>
                      {companyCrossLinks.map((link) => {
                        const node = byId.get(link.linkId)!
                        const chain = node.parents
                          .map((relation) => byId.get(relation.parentId))
                          .find(
                            (parentNode) => parentNode?.kind === "SUPPLY_CHAIN",
                          )
                        const linkFunction =
                          cleanExplorationText(link.function, locale) ||
                          cleanExplorationText(
                            link.functions?.join(" / "),
                            locale,
                          )
                        const contextSummary = cleanExplorationText(
                          link.contexts?.[0]?.statement,
                          locale,
                        )
                        const roleNames = [
                          link.function,
                          ...(link.functions ?? []),
                        ]
                          .filter((value): value is string => !!value)
                          .map(normalizeText)
                        return (
                          <button
                            type="button"
                            key={link.linkId}
                            onClick={() =>
                              navigateToCompanyLink(
                                link.linkId,
                                companyProfile!,
                              )
                            }
                          >
                            <span>
                              {node.market === "MX"
                                ? "MX · México"
                                : "US · Estados Unidos"}{" "}
                              · {chain ? displayLabel(chain) : ""} ·{" "}
                              {displayLabel(node)} ·{" "}
                              {linkFunction ||
                                (locale === "es"
                                  ? "Por confirmar"
                                  : "Pending")}{" "}
                              · {evidenceLabel(link.evidenceStatus, locale)}
                            </span>
                            {contextSummary &&
                              !roleNames.includes(
                                normalizeText(contextSummary),
                              ) && <small>{contextSummary}</small>}
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {effectiveDisposition && (
                    <p className="acq-company-disposition-state" role="status">
                      <span className="acq-status-chip">
                        {effectiveDisposition.scope === "GLOBAL"
                          ? locale === "es"
                            ? "Cerrada por dirección"
                            : "Closed by management"
                          : locale === "es"
                            ? "Descartada"
                            : "Discarded"}{" "}
                        ·{" "}
                        {dispositionScopeLabel(
                          effectiveDisposition.scope,
                          locale,
                        )}
                      </span>{" "}
                      {effectiveDisposition.reason}
                    </p>
                  )}
                  {canManage && companyProfile && (
                    <details className="acq-company-disposition">
                      <summary>
                        {locale === "es"
                          ? "Tomar una decisión sobre esta empresa"
                          : "Decide on this company"}
                      </summary>
                      <div className="acq-company-disposition-content">
                        <label>
                          {locale === "es"
                            ? "¿Dónde aplicar este cambio?"
                            : "Where should this change apply?"}
                          <select
                            value={dispositionScope}
                            onChange={(event) =>
                              setDispositionScopeSelection({
                                contextKey: dispositionContextKey,
                                scope: event.target
                                  .value as typeof dispositionScope,
                              })
                            }
                            disabled={dispositionPending}
                          >
                            <option value="LINK">
                              {locale === "es" ? "Eslabón" : "Link"} ·{" "}
                              {selected[4]?.label}
                            </option>
                            <option value="CHAIN">
                              {locale === "es" ? "Cadena" : "Chain"} ·{" "}
                              {selected[3]?.label}
                            </option>
                            <option value="GLOBAL">
                              {locale === "es"
                                ? "Empresa completa"
                                : "Whole company"}{" "}
                              · {companyProfile.displayName}
                            </option>
                          </select>
                        </label>
                        <p className="acq-company-disposition-impact">
                          {scopedDisposition
                            ? dispositionScope === "LINK"
                              ? locale === "es"
                                ? "Al reabrir, este eslabón volverá a estar disponible; el estado de la empresa en otras apariciones no cambia."
                                : "Reopening makes this link available again; the company’s status in other appearances does not change."
                              : dispositionScope === "CHAIN"
                                ? locale === "es"
                                  ? "Al reabrir, esta empresa volverá a estar disponible en todos los eslabones de esta cadena."
                                  : "Reopening makes this company available again in every link in this chain."
                                : locale === "es"
                                  ? "Al reabrir, esta empresa volverá a estar disponible en todas sus apariciones del mapa."
                                  : "Reopening makes this company available again in all its map appearances."
                            : dispositionScope === "LINK"
                              ? locale === "es"
                                ? "Solo se descartará este eslabón; las demás apariciones de la empresa seguirán disponibles."
                                : "Only this link will be discarded; the company remains available in its other appearances."
                              : dispositionScope === "CHAIN"
                                ? locale === "es"
                                  ? "Se descartarán todos los eslabones de esta cadena para esta empresa; otras cadenas seguirán disponibles."
                                  : "All links for this company in this chain will be discarded; other chains remain available."
                                : locale === "es"
                                  ? "Se descartarán todas las apariciones de esta empresa en el mapa."
                                  : "All appearances of this company in the map will be discarded."}
                        </p>
                        <label>
                          {locale === "es"
                            ? "Motivo (8 caracteres mínimo)"
                            : "Reason (at least 8 characters)"}
                          <textarea
                            value={dispositionReason}
                            onChange={(event) =>
                              setDispositionReason(event.target.value)
                            }
                            minLength={8}
                            maxLength={500}
                            rows={2}
                            disabled={dispositionPending}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={saveCompanyDisposition}
                          disabled={
                            dispositionPending ||
                            dispositionReason.trim().length < 8
                          }
                        >
                          {dispositionPending
                            ? locale === "es"
                              ? "Registrando…"
                              : "Recording…"
                            : `${scopedDisposition ? (locale === "es" ? "Reabrir" : "Reopen") : locale === "es" ? "Descartar" : "Discard"} ${dispositionScopeLabel(dispositionScope, locale).toLowerCase()}`}
                        </button>
                        {dispositionNotice && (
                          <p role="status">{dispositionNotice}</p>
                        )}
                      </div>
                    </details>
                  )}
                  {mode === "exploration" &&
                    data.marketPresence
                      .filter((item) => item.node_id === company.id)
                      .map((presence, index) => (
                        <p
                          className="acq-exploration-market-presence"
                          key={`${presence.market}:${index}`}
                        >
                          <strong>
                            {presence.market === "MX"
                              ? "MX · México"
                              : "US · Estados Unidos"}
                          </strong>{" "}
                          · {presenceStatus(presence.status, locale)}
                          {marketPresenceNote(presence.relation, locale) && (
                            <>
                              {" "}
                              · {marketPresenceNote(presence.relation, locale)}
                            </>
                          )}
                        </p>
                      ))}
                  <p className="acq-company-profile-scope">
                    <strong>
                      {locale === "es"
                        ? "Datos de la empresa"
                        : "Company information"}
                    </strong>{" "}
                    {locale === "es"
                      ? "Datos de identidad y empresa consolidados; no confirman por sí solos su función en el eslabón seleccionado."
                      : "Consolidated identity and company research; these fields alone do not confirm its role in the selected link."}
                  </p>
                  {companyProfile && (
                    <div
                      className="acq-company-profile-summary"
                      aria-label={
                        locale === "es"
                          ? "Estado de las cinco dimensiones"
                          : "Five dimension status"
                      }
                    >
                      <span>
                        <strong>
                          {
                            visibleCompanyFields.filter(
                              (item) =>
                                item.status === "KNOWN" && !item.conflict,
                            ).length
                          }
                        </strong>{" "}
                        {locale === "es"
                          ? "datos registrados"
                          : "recorded fields"}
                      </span>
                      <span>
                        <strong>
                          {
                            visibleCompanyFields.filter(
                              (item) =>
                                item.status === "HYPOTHESIS" || item.conflict,
                            ).length
                          }
                        </strong>{" "}
                        {locale === "es"
                          ? "hipótesis o conflictos"
                          : "hypotheses or conflicts"}
                      </span>
                      <span>
                        <strong>
                          {
                            visibleCompanyFields.filter(
                              (item) => item.status === "PENDING",
                            ).length
                          }
                        </strong>{" "}
                        {locale === "es" ? "pendientes" : "pending"}
                      </span>
                    </div>
                  )}
                  <div className="acq-company-profile">
                    {(
                      [
                        [
                          "identity",
                          locale === "es" ? "Identidad" : "Identity",
                        ],
                        [
                          "activity",
                          locale === "es" ? "Actividad" : "Activity",
                        ],
                        [
                          "presence",
                          locale === "es"
                            ? "Presencia y escala"
                            : "Presence and scale",
                        ],
                        ["fit", locale === "es" ? "Encaje" : "Fit"],
                        ["outreach", locale === "es" ? "Contacto" : "Outreach"],
                      ] as const
                    ).map(([dimension, title]) => {
                      const profileFields = companyProfile
                        ? visibleCompanyFields.filter(
                            (item) =>
                              item.dimension.toLowerCase() === dimension,
                          )
                        : dimension === "activity"
                          ? [
                              {
                                key: "activity",
                                dimension,
                                value: field(company, "activity"),
                                status: "PENDING" as const,
                                sourceUrl: null,
                                observedAt: null,
                                nextQuestion: null,
                              },
                            ]
                          : dimension === "presence"
                            ? [
                                {
                                  key: "scaleSignal",
                                  dimension,
                                  value: field(company, "scaleSignal"),
                                  status: "PENDING" as const,
                                  sourceUrl: null,
                                  observedAt: null,
                                  nextQuestion: null,
                                },
                              ]
                            : dimension === "outreach"
                              ? [
                                  {
                                    key: "accessRoute",
                                    dimension,
                                    value: field(company, "accessRoute"),
                                    status: "PENDING" as const,
                                    sourceUrl: null,
                                    observedAt: null,
                                    nextQuestion: null,
                                  },
                                ]
                              : []
                      const knownFields = profileFields.filter(
                        (item) => item.status === "KNOWN" && !item.conflict,
                      ).length
                      const pendingFields = profileFields.filter(
                        (item) => item.status === "PENDING",
                      ).length
                      const hypothesisFields =
                        profileFields.length - knownFields - pendingFields
                      return (
                        <details
                          className="acq-company-dimension"
                          key={`${company.id}:${dimension}`}
                          open={dimension === "activity"}
                        >
                          <summary>
                            <span className="acq-company-dimension-title">
                              {title}
                            </span>
                            <span className="acq-company-dimension-status">
                              {knownFields > 0 && (
                                <span>
                                  {knownFields}{" "}
                                  {locale === "es" ? "registrados" : "recorded"}
                                </span>
                              )}
                              {hypothesisFields > 0 && (
                                <span>
                                  {hypothesisFields}{" "}
                                  {locale === "es"
                                    ? "por confirmar"
                                    : "to confirm"}
                                </span>
                              )}
                              {pendingFields > 0 && (
                                <span>
                                  {pendingFields}{" "}
                                  {locale === "es" ? "pendientes" : "pending"}
                                </span>
                              )}
                            </span>
                          </summary>
                          <div className="acq-company-dimension-fields">
                            {profileFields.length ? (
                              profileFields.map((item) => (
                                <article key={item.key}>
                                  <strong>
                                    {companyFieldLabel(item.key, locale)}
                                  </strong>
                                  <p>
                                    {cleanExplorationText(item.value, locale) ||
                                      (locale === "es"
                                        ? "Pendiente"
                                        : "Pending")}
                                  </p>
                                  <small className="acq-company-field-state">
                                    {item.conflict
                                      ? locale === "es"
                                        ? "En conflicto · provisional"
                                        : "Conflicting · provisional"
                                      : item.status === "KNOWN"
                                        ? locale === "es"
                                          ? "Conocido"
                                          : "Known"
                                        : item.status === "HYPOTHESIS"
                                          ? locale === "es"
                                            ? "Hipótesis"
                                            : "Hypothesis"
                                          : locale === "es"
                                            ? "Pendiente"
                                            : "Pending"}
                                  </small>
                                  {item.conflict && (
                                    <details className="acq-company-field-conflict">
                                      <summary>
                                        {locale === "es"
                                          ? "Datos en conflicto"
                                          : "Conflicting data"}
                                      </summary>
                                      <ul>
                                        {(item.conflictValues ?? []).map(
                                          (candidate, index) => (
                                            <li
                                              key={`${candidate.companyId}:${index}`}
                                            >
                                              <span>
                                                {cleanExplorationText(
                                                  candidate.value,
                                                  locale,
                                                ) ||
                                                  (locale === "es"
                                                    ? "Valor pendiente"
                                                    : "Pending value")}
                                              </span>
                                              {candidate.status === "KNOWN" && (
                                                <small>
                                                  {locale === "es"
                                                    ? " · discrepancia sin resolver"
                                                    : " · disagreement unresolved"}
                                                </small>
                                              )}
                                              {safeHttpUrl(
                                                candidate.sourceUrl,
                                              ) && (
                                                <a
                                                  href={
                                                    safeHttpUrl(
                                                      candidate.sourceUrl,
                                                    )!.href
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                >
                                                  {locale === "es"
                                                    ? "Fuente"
                                                    : "Source"}
                                                </a>
                                              )}
                                              <small>
                                                {observedDate(
                                                  candidate.observedAt,
                                                  locale,
                                                )}
                                              </small>
                                            </li>
                                          ),
                                        )}
                                      </ul>
                                    </details>
                                  )}
                                  {(item.observedAt ||
                                    safeHttpUrl(item.sourceUrl)) && (
                                    <small className="acq-company-field-source">
                                      {item.observedAt
                                        ? observedDate(item.observedAt, locale)
                                        : null}
                                      {safeHttpUrl(item.sourceUrl) && (
                                        <>
                                          {" "}
                                          ·{" "}
                                          <a
                                            href={
                                              safeHttpUrl(item.sourceUrl)!.href
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            {locale === "es"
                                              ? "Fuente"
                                              : "Source"}
                                          </a>
                                        </>
                                      )}
                                    </small>
                                  )}
                                  <p className="acq-record-next">
                                    {locale === "es"
                                      ? "Siguiente pregunta"
                                      : "Next question"}
                                    :{" "}
                                    {nextQuestionForField(
                                      item.key,
                                      item.nextQuestion,
                                      locale,
                                    )}
                                  </p>
                                </article>
                              ))
                            ) : (
                              <p className="acq-muted">
                                {locale === "es"
                                  ? "Pendiente de investigar"
                                  : "Pending research"}
                              </p>
                            )}
                          </div>
                        </details>
                      )
                    })}
                  </div>
                  <p className="acq-zoom-caution">
                    {mode !== "exploration"
                      ? locale === "es"
                        ? "La tesis comercial es una hipótesis; no se ha probado un contrato ni una necesidad declarada."
                        : "The commercial thesis is a hypothesis; no contract or stated need has been proven."
                      : locale === "es"
                        ? "Su relación con este eslabón es una hipótesis; no se ha probado un contrato ni una necesidad comercial."
                        : "Its relationship to this link is a hypothesis; no contract or commercial need has been proven."}
                  </p>
                  {sourceLinks(company).length > 0 && (
                    <div className="acq-zoom-sources">
                      <span className="acq-eyebrow">
                        {locale === "es"
                          ? "Fuentes generales de la empresa"
                          : "General company sources"}
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
