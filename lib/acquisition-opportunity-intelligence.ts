import type { candidateManagementTruth } from "./acquisition-management-truth"
import type { Locale } from "./i18n"

export type CandidateView = ReturnType<typeof candidateManagementTruth>[number]

export type OpportunityMemo = {
  tldr: string
  reasons: string[]
  unproven: string[]
  route: { label: string; why: string; changeCondition: string }
  stage: string
  currentDimension: string
  nextDimension: string
  nextStep: {
    action: string
    purpose: string
    decisionChange: string
    stopCondition: string
  }
  recommendation: {
    label: string
    reason: string
    kind: "CONTINUE" | "HOLD" | "WAIT" | "REVIEW" | "ARCHIVE"
  }
  conversation: null | {
    worthHaving: boolean
    thesis: string
    learningQuestion: string
    whyNow: string
    buyer: string
    readiness: string
    nextStep: string
  }
}

const includes = (value: string, ...needles: string[]) =>
  needles.some((needle) => value.includes(needle))

const evidenceText = (candidate: CandidateView) =>
  [
    candidate.known,
    candidate.unknown,
    candidate.nextAction,
    candidate.discoveryReason,
    candidate.sourceHypothesis,
    candidate.target?.why,
    candidate.target?.learningGoal,
    candidate.target?.hypothesis,
    candidate.target?.falsifier,
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase()

const genericIdentityMemo = (
  candidate: CandidateView,
  es: boolean,
): OpportunityMemo => {
  const market =
    candidate.searchMarkets.join(" / ") ||
    (es ? "mercado aún no corroborado" : "market not yet corroborated")
  const collision = candidate.nameCollision
  return {
    tldr: es
      ? `${candidate.name} es una candidata encontrada en contexto ${market}; su identidad organizacional y actividad exacta aún requieren corroboración.`
      : `${candidate.name} is a candidate surfaced in a ${market} context; its exact organization identity and activity still need corroboration.`,
    reasons: [
      es
        ? `La exploración produjo un registro atribuible al nombre ${candidate.name}.`
        : `Discovery produced a record attributable to the name ${candidate.name}.`,
      es
        ? "La incertidumbre puede probarse con evidencia pública acotada; no demuestra incompatibilidad."
        : "The uncertainty can be tested with bounded public evidence; it is not evidence of non-fit.",
    ],
    unproven: [
      collision
        ? es
          ? "Si los registros homónimos representan la misma organización, establecimientos relacionados o entidades distintas."
          : "Whether the same-name records represent one organization, related establishments, or separate entities."
        : es
          ? "La entidad legal u operador exacto detrás del registro."
          : "The exact legal entity or operator behind the record.",
      es
        ? "Una señal de intervención actual y atribuible a esa organización."
        : "A current intervention signal attributable to that organization.",
    ],
    route: {
      label: es
        ? "Resolver identidad → evidencia de empresa"
        : "Resolve identity → company evidence",
      why: es
        ? "El nombre por sí solo no permite unir registros ni atribuir señales comerciales."
        : "A name alone cannot merge records or support commercial attribution.",
      changeCondition: es
        ? "La ruta avanza sólo si dominio, nombre y ubicación u operador se corroboran de forma independiente; un conflicto conserva la ambigüedad."
        : "The route advances only when domain, name, and location or operator are independently corroborated; a conflict preserves ambiguity.",
    },
    stage: es ? "Resolución de identidad" : "Identity resolution",
    currentDimension: es ? "Identidad organizacional" : "Organization identity",
    nextDimension: es ? "Evidencia de empresa" : "Company evidence",
    nextStep: {
      action: collision
        ? es
          ? "Contrastar cada registro por separado con su dominio, dirección, nombre legal y sitio oficial existentes."
          : "Corroborate each record separately against its existing domain, address, legal name, and official site."
        : es
          ? "Corroborar el registro con una fuente independiente y el sitio oficial de la organización."
          : "Corroborate the record with an independent source and the organization’s official site.",
      purpose: es
        ? "Atribuir la evidencia a una organización concreta sin fusionar por nombre."
        : "Attribute evidence to one concrete organization without merging by name.",
      decisionChange: es
        ? "Una identidad respaldada abre investigación de empresa; evidencia contradictoria mantiene la ambigüedad."
        : "A supported identity opens company research; contradictory evidence keeps AMBIGUOUS.",
      stopCondition: es
        ? "Detener si las fuentes baratas no corroboran la relación o presentan un conflicto."
        : "Stop if inexpensive sources cannot corroborate the relationship or expose a conflict.",
    },
    recommendation: {
      kind: collision ? "REVIEW" : "CONTINUE",
      label: collision
        ? es
          ? "Revisión acotada de identidad"
          : "Bounded identity review"
        : es
          ? "Continuar investigación"
          : "Continue research",
      reason: es
        ? "Queda una prueba pública barata; no justifica contacto, fusión ni archivo automático."
        : "One inexpensive public test remains; it does not justify outreach, merging, or automatic archiving.",
    },
    conversation: null,
  }
}

export function opportunityMemo(
  candidate: CandidateView,
  locale: Locale,
  archiveEligible = false,
): OpportunityMemo {
  const es = locale === "es"
  const evidence = evidenceText(candidate)
  const candidateName = candidate.name.toLocaleLowerCase()
  const base = genericIdentityMemo(candidate, es)

  if (candidate.archived)
    return {
      ...base,
      stage: es ? "Archivada" : "Archived",
      route: {
        label: es ? "Sin investigación activa" : "No active research",
        why:
          candidate.workspaceReason ||
          (es
            ? "La organización fue retirada del espacio activo con historia preservada."
            : "The organization was removed from the active workspace with history preserved."),
        changeCondition: es
          ? "Sólo evidencia material nueva y una restauración gobernada reabren la ruta."
          : "Only materially new evidence and a governed restore reopen the route.",
      },
      recommendation: {
        kind: "ARCHIVE",
        label: es ? "Archivada" : "Archived",
        reason: es
          ? "No consume capacidad activa; toda la evidencia permanece disponible."
          : "It consumes no active capacity; all evidence remains available.",
      },
    }

  if (
    includes(
      evidence,
      "eleven bays",
      "once bays",
      "15 units per day",
      "13.6 million",
      "tijuana move",
    )
  ) {
    const memo: OpportunityMemo = {
      tldr: es
        ? "Operación de Scania en Tijuana con expansión reportada de 3 a 11 bahías, capacidad declarada de 15 unidades diarias, almacén de refacciones e inversión de MXN 13.6 millones."
        : "Scania’s Tijuana operation reports an expansion from 3 to 11 bays, stated capacity of 15 units per day, a parts warehouse, and MXN 13.6 million in investment.",
      reasons: es
        ? [
            "La expansión física y operativa está fechada y cuantificada.",
            "El flujo servicio–agenda–refacciones ofrece una frontera concreta para aprender, sin presumir dolor.",
          ]
        : [
            "The physical and operational expansion is dated and quantified.",
            "The service–scheduling–parts flow is a concrete learning boundary without presuming pain.",
          ],
      unproven: es
        ? [
            "Rendimiento real frente a capacidad declarada.",
            "Una responsabilidad no cubierta en agenda o refacciones y su propietario.",
            "Necesidad de intervención externa o presupuesto.",
          ]
        : [
            "Actual throughput versus stated capacity.",
            "An uncovered scheduling or parts responsibility and its owner.",
            "External intervention need or budget.",
          ],
      route: {
        label: candidate.contacted
          ? es
            ? "Contactada → esperar respuesta"
            : "Contacted → wait for response"
          : es
            ? "Validar intervención → resolver responsable"
            : "Validate intervention → resolve owner",
        why: candidate.contacted
          ? es
            ? "El primer mensaje ya fue aceptado por el proveedor; repetir contacto no produciría aprendizaje legítimo."
            : "The first message was accepted by the provider; repeating outreach would not produce legitimate learning."
          : es
            ? "La capacidad desplegada está sustentada; falta saber si existe una responsabilidad residual."
            : "Deployed capacity is supported; an uncovered residual responsibility is not.",
        changeCondition: es
          ? "Una respuesta material cambia la ruta a revisión o transferencia comercial; el silencio no autoriza seguimiento."
          : "A material reply changes the route to review/handoff; silence does not authorize follow-up.",
      },
      stage: candidate.contacted
        ? es
          ? "Contactada / en espera"
          : "Contacted / waiting"
        : es
          ? "Validación de intervención"
          : "Intervention validation",
      currentDimension: candidate.contacted
        ? es
          ? "Respuesta"
          : "Response"
        : es
          ? "Responsabilidad operativa"
          : "Operational ownership",
      nextDimension: candidate.contacted
        ? es
          ? "Respuesta o revisión gobernada"
          : "Response or governed review"
        : es
          ? "Responsable / contacto"
          : "Buyer / contact",
      nextStep: {
        action: candidate.contacted
          ? es
            ? "Esperar la respuesta al único mensaje enviado; no ejecutar un segundo intento."
            : "Wait for a reply to the single sent message; do not execute Attempt 2."
          : es
            ? "Precisar una responsabilidad post-mudanza no cubierta en agenda–refacciones."
            : "Establish one uncovered post-move responsibility in the scheduling–parts handoff.",
        purpose: es
          ? "Saber si la capacidad instalada se traduce en operación efectiva y si queda una tarea comercialmente relevante."
          : "Learn whether installed capacity translates into effective operation and whether a commercially relevant task remains.",
        decisionChange: es
          ? "Una respuesta confirma, falsifica o redirige la hipótesis; sin respuesta el estado no progresa."
          : "A reply confirms, falsifies, or redirects the hypothesis; without one the state does not progress.",
        stopCondition: es
          ? "No enviar seguimiento sin nueva autoridad exacta; una solicitud de no contacto, cualquier respuesta o una transferencia comercial detienen la progresión autónoma."
          : "Do not follow up without new exact authority; DNC, any response, or handoff stops autonomous progression.",
      },
      recommendation: {
        kind: "WAIT",
        label: es ? "Esperar" : "Wait",
        reason: es
          ? "Ya existe un contacto activo; gastar investigación o contacto adicional ahora sería redundante."
          : "Active outreach already exists; more research or outreach now would be redundant.",
      },
      conversation: {
        worthHaving: true,
        thesis: es
          ? "Entender si el crecimiento de capacidad dejó una responsabilidad concreta entre programación del servicio y disponibilidad de refacciones."
          : "Understand whether the capacity expansion left a concrete responsibility between service scheduling and parts availability.",
        learningQuestion: es
          ? "¿La nueva capacidad opera con una coordinación agenda–refacciones ya resuelta o queda una responsabilidad de implementación?"
          : "Is the new scheduling–parts handoff already effective, or does an implementation responsibility remain?",
        whyNow: es
          ? "La mudanza y expansión son recientes, específicas y operativamente medibles."
          : "The move and expansion are recent, specific, and operationally measurable.",
        buyer: es
          ? "Propietario de servicio/operaciones y coordinación de refacciones; rol exacto aún no corroborado."
          : "Service/operations and parts-coordination owner; exact role not yet corroborated.",
        readiness: candidate.contacted
          ? es
            ? "Contactada; en espera. Seguimiento no autorizado."
            : "Contacted; waiting. Follow-up not authorized."
          : es
            ? "Hipótesis acotada; autoridad de contacto ausente."
            : "Bounded thesis; outreach authority absent.",
        nextStep: candidate.contacted
          ? es
            ? "Esperar respuesta; no ejecutar otra acción comercial."
            : "Wait for a reply; execute no further commercial action."
          : es
            ? "Resolver responsable y punto de contacto antes de cualquier propuesta."
            : "Resolve owner and ContactPoint before any proposal.",
      },
    }
    return memo
  }

  if (
    includes(evidence, "jackson supply", "supplysync", "70,000 digital users")
  ) {
    return {
      tldr: es
        ? "Distribuidor HVAC en Estados Unidos que cerró la adquisición de Jackson Supply: 25 ubicaciones y aproximadamente USD 230 millones en ventas anualizadas reportadas, dentro de una operación con amplia adopción digital."
        : "U.S. HVAC distributor that closed the Jackson Supply acquisition: 25 locations and roughly USD 230 million in reported annualized sales, within an operation with broad digital adoption.",
      reasons: es
        ? [
            "La adquisición cerrada aporta una frontera operativa reciente y cuantificada.",
            "Las 25 ubicaciones implican integración de inventario, compras y operación distribuida.",
            "Más de 70,000 usuarios digitales y SupplySync indican capacidad existente; la hipótesis debe buscar trabajo residual, no vender digitalización genérica.",
          ]
        : [
            "The closed acquisition supplies a recent, quantified operating boundary.",
            "The 25 locations imply distributed inventory, purchasing, and operating integration.",
            "More than 70,000 digital users and SupplySync show existing capability; the thesis must seek residual work, not generic digitization.",
          ],
      unproven: es
        ? [
            "Qué responsabilidades de Jackson siguen separadas o incompletas.",
            "Cobertura y aplicabilidad de SupplySync en Jackson.",
            "Propietario interno de una eventual brecha y necesidad externa.",
          ]
        : [
            "Which Jackson responsibilities remain separate or incomplete.",
            "SupplySync coverage and applicability at Jackson.",
            "Internal owner of any gap and need for external help.",
          ],
      route: {
        label: es
          ? "Evidencia de empresa → validar integración residual"
          : "Company evidence → validate residual integration",
        why: es
          ? "Escala, adquisición y capacidad digital están sustentadas; la pregunta útil es si queda un límite específico sin cubrir."
          : "Scale, acquisition, and digital capability are supported; the useful question is whether one specific boundary remains uncovered.",
        changeCondition: es
          ? "Evidencia específica de Jackson sobre cobertura completa falsifica la tesis; una responsabilidad residual atribuible abre resolución de responsable y contacto."
          : "Jackson-specific proof of complete coverage falsifies the thesis; an attributable residual responsibility opens buyer/contact resolution.",
      },
      stage: es ? "Validación de intervención" : "Intervention validation",
      currentDimension: es ? "Integración de Jackson" : "Jackson integration",
      nextDimension: es ? "Responsable / contacto" : "Buyer / contact",
      nextStep: {
        action: es
          ? "Verificar una frontera concreta de compras o inventario de Jackson y si SupplySync ya la cubre."
          : "Verify one concrete Jackson purchasing or inventory boundary and whether SupplySync already covers it.",
        purpose: es
          ? "Distinguir una asignación de implementación real de una operación ya cubierta o deliberadamente separada."
          : "Distinguish a real implementation assignment from an already covered or intentionally separate operation.",
        decisionChange: es
          ? "Una responsabilidad residual con dueño mueve a resolución de contacto; cobertura completa mueve a espera o revisión de archivo."
          : "Residual responsibility plus owner moves to buyer/contact; complete coverage moves to HOLD or archive recommendation.",
        stopCondition: es
          ? "Detener si una fuente atribuible demuestra cobertura completa o si no queda una prueba barata y específica de Jackson."
          : "Stop if attributable evidence shows complete coverage or no inexpensive Jackson-specific test remains.",
      },
      recommendation: {
        kind: "HOLD",
        label: es ? "Conservar para validación" : "Retain for validation",
        reason: es
          ? "La señal es material, pero no existe autoridad de contacto ni intervención independiente probada."
          : "The signal is material, but no outreach authority or independently proven intervention exists.",
      },
      conversation: {
        worthHaving: true,
        thesis: es
          ? "Probar si la integración de Jackson dejó una responsabilidad acotada de compras o inventario que Watsco aún deba implementar."
          : "Test whether Jackson integration left a bounded purchasing or inventory responsibility Watsco still needs to implement.",
        learningQuestion: es
          ? "¿SupplySync y los procesos actuales ya cubren Jackson por completo, o queda una responsabilidad de integración con dueño claro?"
          : "Do SupplySync and current processes fully cover Jackson, or is there an owned integration responsibility left?",
        whyNow: es
          ? "La adquisición cerró recientemente y tiene escala material y límites operativos identificables."
          : "The acquisition closed recently and has material scale with identifiable operating boundaries.",
        buyer: es
          ? "Responsable de integración de Jackson en compras/inventario; título y persona aún no resueltos."
          : "Owner of Jackson purchasing/inventory integration; title and Person remain unresolved.",
        readiness: es
          ? "Tesis conversacional sustentada; responsable, punto de contacto y autorización pendientes."
          : "Conversation thesis supported; buyer, ContactPoint, and authorization pending.",
        nextStep: es
          ? "Resolver responsable y persona sólo después de corroborar la responsabilidad residual."
          : "Resolve owner/Person only after corroborating the residual responsibility.",
      },
    }
  }

  if (
    includes(
      evidence,
      "190 centers",
      "wexford",
      "upmc",
      "completed acquisitions",
    )
  ) {
    return {
      tldr: es
        ? "Red estadounidense de imagen ambulatoria con más de 190 centros y 5,000 empleados reportados; anunció dos adquisiciones completadas, dos aperturas y alianzas como UPMC, incluida la conexión Wexford–UPMC."
        : "U.S. outpatient-imaging network reporting more than 190 centers and 5,000 employees; it announced two completed acquisitions, two openings, and partnerships including the Wexford–UPMC connection.",
      reasons: es
        ? [
            "Adquisiciones y centros abiertos demuestran cambio operativo reciente, no sólo intención.",
            "La escala multi-sitio sustenta complejidad organizacional.",
            "Wexford–UPMC ofrece una frontera concreta entre derivación y programación para falsificar o sostener una conversación.",
          ]
        : [
            "Completed acquisitions and opened centers show recent operating change, not just intent.",
            "The multi-site footprint supports organizational complexity.",
            "Wexford–UPMC provides a concrete referral-to-scheduling boundary to falsify or support a conversation.",
          ],
      unproven: es
        ? [
            "Qué operador legal corresponde a cada registro Lumexa homónimo.",
            "Desempeño real de derivaciones y programación en Wexford.",
            "Trabajo residual de puesta en operación, responsable y necesidad de intervención externa.",
          ]
        : [
            "Which legal operator corresponds to each same-name Lumexa record.",
            "Actual referral and scheduling performance at Wexford.",
            "Residual onboarding work, owner, and external intervention need.",
          ],
      route: {
        label: es
          ? "Corroborar operador → validar responsabilidad Wexford"
          : "Corroborate operator → validate Wexford responsibility",
        why: es
          ? "La señal comercial es específica, pero el homónimo impide atribuirla con seguridad a ambos registros."
          : "The commercial signal is specific, but the same-name collision prevents safely attributing it to both records.",
        changeCondition: es
          ? "Una relación legal/operativa corroborada permite avanzar; conflicto mantiene separados los registros. Evidencia de un flujo ya resuelto falsifica intervención."
          : "A corroborated legal/operating relationship allows progression; conflict keeps the records separate. Evidence of an already-effective workflow falsifies intervention.",
      },
      stage: es ? "Resolución de identidad" : "Identity resolution",
      currentDimension: es
        ? "Operador legal / centro"
        : "Legal operator / center",
      nextDimension: es
        ? "Validación de intervención"
        : "Intervention validation",
      nextStep: {
        action: es
          ? "Vincular cada registro con operador, dominio, ubicación y centro mediante fuentes independientes; después probar sólo la responsabilidad Wexford–UPMC."
          : "Bind each record to operator, domain, location, and center using independent sources; then test only the Wexford–UPMC responsibility.",
        purpose: es
          ? "Evitar atribuir la señal correcta a la entidad equivocada y acotar el aprendizaje a un flujo observable."
          : "Avoid attributing the right signal to the wrong entity and bound learning to an observable workflow.",
        decisionChange: es
          ? "Identidad corroborada abre validación de intervención; conflicto conserva ambigüedad; un flujo efectivo mueve a espera o revisión de archivo."
          : "Corroborated identity opens intervention validation; conflict preserves ambiguity; an effective workflow moves to HOLD/archive review.",
        stopCondition: es
          ? "Detener si operador y centro no pueden atribuirse de forma barata o si no queda responsabilidad residual demostrable."
          : "Stop if operator and center cannot be inexpensively attributed or no residual responsibility can be demonstrated.",
      },
      recommendation: {
        kind: "REVIEW",
        label: es
          ? "Resolver identidad antes de contacto"
          : "Resolve identity before outreach",
        reason: es
          ? "La señal merece conservarse, pero no debe transferirse entre homónimos ni convertirse en contacto."
          : "The signal merits retention, but it must not transfer across namesakes or become outreach.",
      },
      conversation: {
        worthHaving: true,
        thesis: es
          ? "Determinar si el vínculo Wexford–UPMC deja una responsabilidad discreta entre derivación y programación tras la apertura y puesta en operación."
          : "Determine whether the Wexford–UPMC relationship leaves a discrete referral-to-scheduling responsibility after opening/onboarding.",
        learningQuestion: es
          ? "¿El centro opera la derivación a programación de forma efectiva o queda una responsabilidad de implementación con dueño identificable?"
          : "Does the center run referral-to-scheduling effectively, or does an owned implementation responsibility remain?",
        whyNow: es
          ? "Las aperturas y adquisiciones se completaron; la pregunta puede anclarse a un centro y socio concretos."
          : "The openings and acquisitions completed; the question can be anchored to one concrete center and partner.",
        buyer: es
          ? "Responsable de operaciones, puesta en marcha o programación del centro; persona aún no resuelta."
          : "Center operations/onboarding or scheduling owner; Person unresolved.",
        readiness: es
          ? "Tesis sustentada, pero la identidad exacta y el responsable bloquean cualquier propuesta."
          : "Thesis supported, but exact identity and buyer block any proposal.",
        nextStep: es
          ? "Resolver el operador de Wexford y luego su responsable; no contactar mientras persista el homónimo."
          : "Resolve Wexford’s operator, then its owner; do not contact while the namesake ambiguity remains.",
      },
    }
  }

  if (
    candidateName.includes("piedmont") &&
    includes(
      evidence,
      "diagnostic",
      "outpatient imaging openings",
      "aperturas fechadas",
    )
  ) {
    return {
      ...base,
      tldr: es
        ? "Organización estadounidense de imagen diagnóstica ambulatoria detectada por una hipótesis de aperturas de centros; la apertura concreta y el cambio operativo aún no quedaron atribuidos."
        : "U.S. outpatient diagnostic-imaging organization surfaced through a center-opening hypothesis; the specific opening and operating change remain unattributed.",
      reasons: es
        ? [
            "Las aperturas fechadas podrían crear coordinación multi-sitio verificable.",
            "La hipótesis es falsable con una fuente exacta y no presume que exista dolor.",
          ]
        : [
            "Dated openings could create verifiable multi-site coordination.",
            "The hypothesis is falsifiable with one exact source and does not presume pain.",
          ],
      unproven: es
        ? [
            "Una apertura reciente atribuible a Piedmont.",
            "Cambio de integración o proceso producido por esa apertura.",
            "Responsable interno, comprador y necesidad externa.",
          ]
        : [
            "A recent opening attributable to Piedmont.",
            "An integration or process change caused by that opening.",
            "Owner, buyer, and external need.",
          ],
      route: {
        label: es
          ? "Evidencia de empresa → validar apertura"
          : "Company evidence → validate opening",
        why: es
          ? "La clase de señal es plausible, pero la última ejecución no produjo aprendizaje semántico atribuible."
          : "The signal class is plausible, but the last execution produced no attributable semantic learning.",
        changeCondition: es
          ? "Una apertura fechada y atribuible abre validación de intervención; ausencia o evidencia desactualizada devuelve a espera."
          : "A dated, attributable opening opens intervention validation; absence or stale evidence returns to HOLD.",
      },
      stage: es ? "Evidencia de empresa" : "Company evidence",
      currentDimension: es
        ? "Cambio operativo atribuible"
        : "Attributable operating change",
      nextDimension: es
        ? "Validación de intervención"
        : "Intervention validation",
      nextStep: {
        action: es
          ? "Buscar una fuente exacta que vincule a Piedmont con una apertura reciente y su cambio operativo observable."
          : "Find one exact source linking Piedmont to a recent opening and its observable operating change.",
        purpose: es
          ? "Distinguir una señal específica de la empresa de una hipótesis genérica de sector."
          : "Distinguish a company-specific signal from a generic sector hypothesis.",
        decisionChange: es
          ? "Evidencia atribuible permite probar intervención; rendimiento informativo nulo y repetido conserva la espera y evita más gasto de capacidad."
          : "Attributable evidence permits intervention testing; repeated zero yield keeps HOLD and avoids more capacity.",
        stopCondition: es
          ? "Detener tras una prueba exacta sin evidencia material; no repetir búsquedas amplias equivalentes."
          : "Stop after one exact test with no material evidence; do not repeat equivalent broad searches.",
      },
      recommendation: {
        kind: "HOLD",
        label: es ? "En espera · una prueba exacta" : "HOLD · one exact test",
        reason: es
          ? "La hipótesis todavía puede cambiar con poco costo, pero el último trabajo no justificó progresión."
          : "The hypothesis can still change at low cost, but the last work did not justify progression.",
      },
      conversation: null,
    }
  }

  if (
    candidateName.includes("3 cg group") &&
    includes(evidence, "warehouse operators", "smartlogistics", "denue")
  ) {
    return {
      ...base,
      tldr: es
        ? "Registro mexicano asociado a una búsqueda de operadores de almacén; el trabajo ejecutado no atribuyó Smart Logistics ni otra identidad organizacional al establecimiento."
        : "Mexican record surfaced in a warehouse-operator search; executed work did not attribute Smart Logistics or another organization identity to the establishment.",
      reasons: es
        ? [
            "El contexto de almacén/distribución justifica una prueba de identidad acotada.",
            "Existe un dominio sugerido que puede corroborarse o falsificarse sin investigación amplia.",
          ]
        : [
            "The warehouse/distribution context justifies one bounded identity test.",
            "An existing domain hint can be corroborated or falsified without broad research.",
          ],
      unproven: es
        ? [
            "Relación entre el establecimiento DENUE y smartlogistics.com.mx.",
            "Si los dos registros 3 CG pertenecen al mismo operador.",
            "Capacidad, cambio operativo e intervención atribuibles.",
          ]
        : [
            "Relationship between the DENUE establishment and smartlogistics.com.mx.",
            "Whether the two 3 CG records belong to the same operator.",
            "Attributable capacity, operating change, and intervention.",
          ],
      nextStep: {
        ...base.nextStep,
        action: es
          ? "Leer una sola vez el sitio oficial ya señalado y contrastar nombre legal, dominio, dirección y operador con cada registro DENUE."
          : "Read the already identified official site once and compare legal name, domain, address, and operator with each DENUE record.",
        purpose: es
          ? "Resolver o falsificar el puente establecimiento–organización sin repetir DENUE."
          : "Resolve or falsify the establishment–organization bridge without repeating DENUE.",
        decisionChange: es
          ? "Coincidencia independiente permite reconciliar; conflicto o ausencia conserva ambos registros separados."
          : "Independent agreement permits reconciliation; conflict or absence keeps both records separate.",
        stopCondition: es
          ? "No repetir la lectura si falla o no contiene evidencia organizacional atribuible; deferir en lugar de consumir otra unidad."
          : "Do not repeat the read if it fails or lacks attributable organization evidence; defer instead of consuming another unit.",
      },
      recommendation: {
        kind: "REVIEW",
        label: es
          ? "Resolución barata de identidad"
          : "Cheap identity resolution",
        reason: es
          ? "Queda una prueba exacta; el éxito técnico sin evidencia atribuible no cuenta como progreso."
          : "One exact test remains; technical success without attributable evidence does not count as progress.",
      },
    }
  }

  if (archiveEligible || candidate.screen === "SUPPORTED_DISMISSAL")
    return {
      ...base,
      stage: es ? "Archivo recomendado" : "Archive recommended",
      recommendation: {
        kind: "ARCHIVE",
        label: es ? "Recomendar archivo" : "Recommend archive",
        reason: es
          ? "No queda una ruta barata con probabilidad razonable de cambiar la decisión; archivar requiere una acción gobernada separada."
          : "No inexpensive path has a reasonable chance of changing the decision; archiving requires a separate governed action.",
      },
    }

  if (candidate.identity === "RESOLVED")
    return {
      ...base,
      tldr: es
        ? `${candidate.name} tiene identidad organizacional respaldada; todavía no hay evidencia suficiente de una intervención concreta.`
        : `${candidate.name} has a supported organization identity; evidence for a concrete intervention is still insufficient.`,
      stage: es ? "Evidencia de empresa" : "Company evidence",
      currentDimension: es ? "Señal de intervención" : "Intervention signal",
      nextDimension: es
        ? "Validación de intervención"
        : "Intervention validation",
      route: {
        label: es
          ? "Evidencia de empresa → intervención"
          : "Company evidence → intervention",
        why: es
          ? "La identidad ya no es el cuello de botella; la oportunidad sí."
          : "Identity is no longer the bottleneck; the opportunity is.",
        changeCondition: es
          ? "Una señal actual y falsable abre investigación profunda; ausencia de valor marginal conserva la espera."
          : "A current, falsifiable signal opens deeper research; lack of marginal value keeps HOLD.",
      },
    }

  return base
}

export function opportunityQuality(
  candidates: CandidateView[],
  locale: Locale,
  archiveIds = new Set<string>(),
) {
  const memos = candidates.map((candidate) =>
    opportunityMemo(candidate, locale, archiveIds.has(candidate.id)),
  )
  return {
    identity: memos.filter((memo) =>
      memo.stage.includes(locale === "es" ? "identidad" : "Identity"),
    ).length,
    intervention: memos.filter((memo) =>
      memo.stage.includes(locale === "es" ? "intervención" : "Intervention"),
    ).length,
    waiting: memos.filter((memo) => memo.recommendation.kind === "WAIT").length,
    review: memos.filter((memo) => memo.recommendation.kind === "REVIEW")
      .length,
    archive: memos.filter((memo) => memo.recommendation.kind === "ARCHIVE")
      .length,
    conversationReady: memos.filter((memo) => memo.conversation?.worthHaving)
      .length,
  }
}
