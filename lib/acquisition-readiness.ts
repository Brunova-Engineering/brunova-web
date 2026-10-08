import type { Locale } from "@/lib/i18n"

// Presentation only: never infer readiness or turn an unknown code into success.
const reasons: Record<string, readonly [string, string]> = {
  SUPPORTED_NONFIT: [
    "La evidencia actual respalda un no-fit. Conserva su historial; nueva evidencia material puede justificar reconsiderarla.",
    "Current evidence supports non-fit. History is retained; material new evidence may justify reconsideration.",
  ],
  MANAGEMENT_HOLD: [
    "Management puso esta oportunidad en espera. Revisa el motivo y solicita más investigación si corresponde; no está rechazada.",
    "Management placed this opportunity on hold. Review the reason and request further research if appropriate; it is not rejected.",
  ],
  RESEARCH_EVIDENCE_REQUIRED: [
    "Se necesita más evidencia antes de avanzar.",
    "More evidence is needed before progressing.",
  ],
  RECONSIDERATION_IN_PROGRESS: [
    "La investigación se está revisando; conserva su historia.",
    "Research is being reconsidered; its history is preserved.",
  ],
  CYCLE_PROGRESSION_HALTED: [
    "El Cycle está pausado. No se permite avanzar.",
    "The Cycle is paused. Progression is not permitted.",
  ],
  EVIDENCE_REVALIDATION: [
    "La evidencia necesita actualización.",
    "Evidence needs refreshing.",
  ],
  PRIORITY_REVALIDATION: [
    "Se necesita revisar la prioridad actual.",
    "Current priority needs review.",
  ],
  BUYER_REVALIDATION: [
    "Falta resolver o actualizar la evidencia del responsable.",
    "Problem-owner evidence needs resolution or refreshing.",
  ],
  BUYER_UNRESOLVED: [
    "Todavía no hay un responsable suficientemente respaldado.",
    "A sufficiently supported problem owner has not yet been resolved.",
  ],
  NO_EXECUTABLE_CHANNEL: [
    "No hay un email respaldado para contactar. La oportunidad se conserva.",
    "There is no supported email contact path. The opportunity is retained.",
  ],
  MESSAGE_REVALIDATION: [
    "El mensaje y sus afirmaciones requieren validación.",
    "The message and its claims need validation.",
  ],
  CRM_SYNC_REQUIRED: [
    "Falta reconciliar la Company y el Contact en HubSpot.",
    "The Company and Contact still need HubSpot reconciliation.",
  ],
  SUPPRESSED: [
    "No contactar: existe una supresión aplicable.",
    "Do not contact: an applicable suppression exists.",
  ],
  HANDOFF_ACCEPTED: [
    "El seguimiento comercial ya pertenece a Management en HubSpot.",
    "Commercial follow-up now belongs to Management in HubSpot.",
  ],
  EXECUTABLE_CANDIDATE: [
    "Cumple la preparación requerida; sólo puede ejecutarse con aprobación y gates vigentes.",
    "Meets preparation requirements; execution still requires current approval and safety gates.",
  ],
  MANAGEMENT_RETAINED: [
    "Management decidió conservarla para después, sin rechazarla.",
    "Management retained this opportunity for later, without rejecting it.",
  ],
}

export function readinessText(code: string, locale: Locale): string {
  return (
    reasons[code]?.[locale === "es" ? 0 : 1] ??
    (locale === "es"
      ? "Este estado necesita revisión antes de avanzar. Consulta el detalle técnico."
      : "This state needs review before progressing. Consult the technical detail.")
  )
}
