import { notFound } from "next/navigation"
import Link from "next/link"
import { ContactWorkspace } from "@/components/acquisition/contact-workspace"
import type { acquisitionApi, PortalSession } from "@/lib/acquisition-api"
import "@/app/acquisition.css"

export const dynamic = "force-dynamic"
export const metadata = { title: "Vista local · C.7", robots: { index: false, follow: false } }

type Map = Awaited<ReturnType<typeof acquisitionApi.explorationMap>>
const timestamp = "2026-10-22T16:00:00Z"
const profile = (id: string, name: string, stage: "SELECTED" | "CONTACTED", methods: number) => ({
  companyId: id,
  displayName: name,
  links: [{ linkId: "link-demo", market: "MX" }],
  attention: id === "negativo-demo" || id === "baja-demo" ? {
    status: "OPEN", primaryReasonCode: id === "baja-demo" ? "CONTACT_OPT_OUT" : "CONTACT_NEGATIVE_REPLY",
    reasons: [{code: id === "baja-demo" ? "CONTACT_OPT_OUT" : "CONTACT_NEGATIVE_REPLY",
      replyId: `reply-${id}`, summary: id === "baja-demo"
        ? "La empresa pidió no recibir más mensajes."
        : "La respuesta negativa requiere una decisión de Jorge."}],
  } : null,
  contactMethods: methods ? [{
    methodId: `${id}-email`, channelType: "EMAIL", channelValue: `contacto@${id}.example`,
    contactName: null, sourceUrl: `https://${id}.example/contacto`,
    attribution: "Medio de muestra con fuente de muestra", stageVersion: 1, recordedAt: timestamp,
  }] : [],
  whatsappChecks: [],
  fitReviews: [],
  enrichment: {
    stage, version: 5, discoveredAt: timestamp, lastTouchedAt: timestamp,
    contactedAt: stage === "CONTACTED" ? timestamp : null,
    closedAt: null, closureReason: null, stageHistory: [], attempts: [],
  },
})
const previewMap = { companyProfiles: [
  profile("frigorifico-demo", "Frigorífico del Norte · ejemplo", "SELECTED", 1),
  profile("operador-demo", "Operador Frío · ejemplo", "SELECTED", 0),
  profile("conservadora-demo", "Conservadora del Bajío · ejemplo", "SELECTED", 1),
  profile("almacen-demo", "Almacén Central · ejemplo", "CONTACTED", 1),
  profile("pendiente-demo", "Cadena Fría · ejemplo", "SELECTED", 1),
  profile("conciliar-demo", "Transporte Polar · ejemplo", "SELECTED", 1),
  profile("confirmado-demo", "Grupo Glaciar · ejemplo", "SELECTED", 1),
  profile("positivo-demo", "Red Fría · ejemplo", "CONTACTED", 1),
  profile("calificado-demo", "Servicios Boreales · ejemplo", "CONTACTED", 1),
  profile("crm-incierto-demo", "Operadora Andina · ejemplo", "CONTACTED", 1),
  profile("retomar-demo", "Puente Frío · ejemplo", "CONTACTED", 1),
  profile("negativo-demo", "Logística del Sur · ejemplo", "CONTACTED", 1),
  profile("baja-demo", "Almacén Pacífico · ejemplo", "CONTACTED", 1),
] } as unknown as Map
const previewPreparations = [{
  companyId: "frigorifico-demo", linkId: "link-demo", preparationId: "prep-demo",
  methodId: "frigorifico-demo-email", stageVersion: 5, channelType: "EMAIL" as const,
  recipientLabel: "Frigorífico del Norte · ejemplo", subject: "Una pregunta sobre el relevo frío",
  messageText: "¿Cómo registran hoy el estado y las excepciones del producto al pasar de congelación a almacenamiento?",
  rationale: "El proceso observado sugiere una conversación sobre trazabilidad, pendiente de validar con la empresa.",
  evidenceRefs: ["https://frigorifico-demo.example/contacto"], recordedAt: timestamp,
  sendAuthorized: false as const,
}]
const previewAttempts = ([
  ["pendiente-demo", null, null],
  ["conciliar-demo", "OUTCOME_UNKNOWN", null],
  ["confirmado-demo", "SEND_CONFIRMED", "receipt-example"],
  ["positivo-demo", "SEND_CONFIRMED", "receipt-positive"],
  ["calificado-demo", "SEND_CONFIRMED", "receipt-qualified"],
  ["crm-incierto-demo", "SEND_CONFIRMED", "receipt-crm-uncertain"],
  ["retomar-demo", "SEND_CONFIRMED", "receipt-returned"],
  ["negativo-demo", "SEND_CONFIRMED", "receipt-negative"],
  ["baja-demo", "SEND_CONFIRMED", "receipt-opt-out"],
] as const).map(([companyId,outcome,providerReceiptId])=>({
  companyId,linkId:"link-demo",methodId:`${companyId}-email`,stageVersion:5,
  preparationId:`prep-${companyId}`,intentId:`intent-${companyId}`,channelType:"EMAIL" as const,
  authorizedAt:timestamp,expiresAt:"2026-10-23T16:00:00Z",outcome,
  providerReceiptId,outcomeAt:outcome ? timestamp : null,
}))
const previewReplies = ([
  ["positivo-demo", "POSITIVE", "Sí, nos interesa conversar sobre los relevos en nuestra operación."],
  ["calificado-demo", "POSITIVE", "Sí, nos interesa conversar sobre cómo mejorar esos relevos."],
  ["crm-incierto-demo", "POSITIVE", "Sí, podemos conversar sobre la operación de frío."],
  ["retomar-demo", "NEGATIVE", "Ahora no es el momento; podemos retomar la conversación más adelante."],
  ["negativo-demo", "NEGATIVE", "Gracias, por ahora no nos interesa esta propuesta."],
  ["baja-demo", "OPT_OUT", "Por favor no vuelvan a contactarnos."],
] as const).map(([companyId,classification,originalText])=>({
  companyId,linkId:"link-demo",methodId:`${companyId}-email`,stageVersion:5,
  preparationId:`prep-${companyId}`,intentId:`intent-${companyId}`,replyId:`reply-${companyId}`,
  channelType:"EMAIL" as const,providerMessageId:`provider-${companyId}`,
  originalText,receivedAt:timestamp,recordedAt:timestamp,classification,
  interestSummary:classification === "POSITIVE"
    ? "Propone conversar sobre el relevo operativo." : "Respuesta que requiere una decisión de Jorge.",
  rationale:"La clasificación se limita al contenido del mensaje original.",interpretedAt:timestamp,
  attentionAction:companyId === "retomar-demo" ? "RETURN_TO_CONTACT" as const : null,
  attentionDecidedAt:companyId === "retomar-demo" ? "2026-10-22T16:05:00Z" : null,
}))
const previewCrmOutcomes = ([
  ["calificado-demo", "CONFIRMED", "54321"],
  ["crm-incierto-demo", "OUTCOME_UNKNOWN", null],
] as const).map(([companyId,outcome,providerCompanyId])=>({
  companyId,replyId:"reply-"+companyId,intentId:"crm-"+companyId,
  decisionKind:"QUALIFY" as const,requestedLeadStatus:"CONNECTED",
  requestedLifecycleStage:"salesqualifiedlead",outcome,providerCompanyId,
  outcomeAt:"2026-10-22T16:08:00Z",
}))
const previewSession: PortalSession = {
  authenticated: true,
  actor: {email: "preview@local.example", capabilities: ["MANAGE_CYCLE"]},
  csrfToken: "preview-only", expiresAt: "2099-01-01T00:00:00Z",
}

export default function Page() {
  if (process.env.LOCAL_C6_PREVIEW_ENABLED !== "true") notFound()
  return <main className="acq" data-authenticated="true" style={{maxWidth: 1240, margin: "2.5rem auto", padding: "1rem"}}>
    <p className="acq-eyebrow">VISTA LOCAL C.7 · DATOS DE MUESTRA · SIN ENVÍOS</p>
    <p className="acq-muted">Las dos respuestas que requieren decisión de Jorge salen de Contacto y pertenecen exclusivamente a Necesita tu atención.</p>
    <Link href="/es/portal/c7-attention-preview">Revisar esas decisiones en Atención</Link>
    <ContactWorkspace cycleId="preview" locale="es" session={previewSession} previewMap={previewMap}
      previewPreparations={previewPreparations} previewAttempts={previewAttempts}
      previewReplies={previewReplies} previewCrmOutcomes={previewCrmOutcomes}/>
  </main>
}
