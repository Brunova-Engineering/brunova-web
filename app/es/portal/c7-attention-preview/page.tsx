import { notFound } from "next/navigation"
import Link from "next/link"
import { ExplorationMap } from "@/components/acquisition/exploration-map"
import type { acquisitionApi, PortalSession } from "@/lib/acquisition-api"
import "@/app/acquisition.css"

export const dynamic = "force-dynamic"
export const metadata = { title: "Vista local · Atención C.7", robots: { index: false, follow: false } }

type Map = Awaited<ReturnType<typeof acquisitionApi.explorationMap>>
const date = "2026-10-22T16:00:00Z"
const make = (id: string, kind: string, label: string, parentId?: string) => ({
  id, cycle_id: "preview", market: "MX", kind, label, state: "PENDING", attributes: {},
  concept_id: null, concept_label: null, concept_status: null,
  parents: parentId ? [{ parentId, relation: "registered" }] : [], claims: [],
  created_at: date, updated_at: date,
})
const nodes = [
  make("sector", "MACRO_INDUSTRY", "Logística"),
  make("specialty", "SPECIALTY", "Cadena fría", "sector"),
  make("activity", "ACTIVITY", "Conservación", "specialty"),
  make("chain", "SUPPLY_CHAIN", "Servicios en frío", "activity"),
  make("link", "LINK", "Almacenamiento", "chain"),
  make("negative", "COMPANY_LEAD", "Logística del Sur · ejemplo", "link"),
  make("optout", "COMPANY_LEAD", "Almacén Pacífico · ejemplo", "link"),
  make("silence", "COMPANY_LEAD", "Operadora Norte · ejemplo", "link"),
]
const profile = (id: "negative" | "optout") => {
  const optout = id === "optout"
  const code = optout ? "CONTACT_OPT_OUT" : "CONTACT_NEGATIVE_REPLY"
  const original = optout ? "Por favor no vuelvan a contactarnos."
    : "Gracias, por ahora no nos interesa esta propuesta."
  const actions = [
    {code: "CONFIRM_CONTACT_CLOSE", label: "Confirmar cierre", actor: "MANAGEMENT",
      enabled: true, resultHint: "Conservar respuesta y motivo de cierre"},
    ...(optout ? [] : [{code: "RETURN_TO_CONTACT", label: "Retomar en Contacto",
      actor: "MANAGEMENT", enabled: true, resultHint: "Conservar la respuesta y definir siguiente paso"}]),
  ]
  return {
    companyId: id, cycleId: "preview", displayName: nodes.find((item) => item.id === id)!.label,
    identityStatus: "RESOLVED", aliases: [], leadNodeIds: [id], fields: [], tags: [],
    links: [{linkId: "link", market: "MX", function: "Almacenamiento",
      evidenceStatus: "OBSERVED", sourceUrl: "https://example.com/servicios", observedAt: date, contexts: []}],
    fitReviews: [], filteringDecisions: [], contactMethods: [], whatsappChecks: [],
    attention: {status: "OPEN", primaryReasonCode: code, stageVersion: 6,
      reasons: [{code, replyId: `reply-${id}`, linkId: "link",
        summary: `${optout ? "La empresa pidió no recibir más mensajes" : "La respuesta negativa requiere decidir si cerrar o retomar"}: ${original}`,
        evidenceRefs: [`contact-reply:reply-${id}`], openedAt: date,
        openedBy: {type: "PANCRACIO_GATEWAY", id: "pancracio:gateway"},
        stageVersion: 6, actions}], actions},
    enrichment: {stage: "CONTACTED", version: 6, discoveredAt: date, lastTouchedAt: date,
      contactedAt: date, closedAt: null, closureReason: null, stageHistory: [], minimumsByLink: {}, attempts: []},
  }
}
const silenceProfile = {
  ...profile("negative"), companyId: "silence", displayName: "Operadora Norte · ejemplo",
  leadNodeIds: ["silence"],
  attention: {status: "OPEN", primaryReasonCode: "CONTACT_SILENCE", stageVersion: 6,
    reasons: [{code: "CONTACT_SILENCE", lastIntentId: "third-confirmed-intent", linkId: "link",
      summary: "Tres acercamientos confirmados, sin respuesta; corresponde decidir si cerrar o conservar la ficha.",
      evidenceRefs: ["contact-intent:third-confirmed-intent", "provider-receipt:third-receipt"],
      openedAt: date, openedBy: {type: "SYSTEM", id: "contact-cadence"}, stageVersion: 6,
      actions: [{code: "CONFIRM_CONTACT_CLOSE", label: "Confirmar cierre por silencio", actor: "MANAGEMENT",
        enabled: true, resultHint: "Conservar intentos y recibos"},
        {code: "KEEP_CONTACT_OPEN", label: "Mantener en Contacto", actor: "MANAGEMENT",
          enabled: true, resultHint: "Esperar sin autorizar un cuarto envío"}]}],
    actions: [{code: "CONFIRM_CONTACT_CLOSE", label: "Confirmar cierre por silencio", actor: "MANAGEMENT",
      enabled: true, resultHint: "Conservar intentos y recibos"},
      {code: "KEEP_CONTACT_OPEN", label: "Mantener en Contacto", actor: "MANAGEMENT",
        enabled: true, resultHint: "Esperar sin autorizar un cuarto envío"}]},
}
const previewMap = {cycleId: "preview", headers: [], nodes, directives: [], chainProgress: [],
  governance: [], marketPresence: [], chainEquivalences: [], chainCoverage: [],
  companyProfiles: [profile("negative"), profile("optout"), silenceProfile]} as unknown as Map
const previewReplyTexts = {
  "reply-negative": "Gracias, por ahora no nos interesa esta propuesta.",
  "reply-optout": "Por favor no vuelvan a contactarnos.",
}
const session = {authenticated: true, actor: {email: "vista-local@brunova.example",
  capabilities: ["VIEW_ACQUISITION"]}, csrfToken: "preview", expiresAt: date} as PortalSession

export default function Page() {
  if (process.env.LOCAL_C6_PREVIEW_ENABLED !== "true") notFound()
  return <main className="acq" data-authenticated="true" style={{maxWidth: 1240, margin: "2.5rem auto", padding: "1rem"}}>
    <p className="acq-eyebrow">VISTA LOCAL C.7 · DATOS DE MUESTRA · SIN DECISIONES NI ENVÍOS</p>
    <Link href="/es/portal/c7-preview">Volver a Contacto</Link>
    <ExplorationMap cycleId="preview" locale="es" mode="attention" session={session}
      previewMap={previewMap} previewReplyTexts={previewReplyTexts}/>
  </main>
}
