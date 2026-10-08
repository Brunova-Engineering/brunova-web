import type {
  Capability,
  Differentiator,
  HomepageSymptom,
  OperationalIntelligenceElement,
  ProcessStage,
  WorkCase,
  WorkDetail,
} from "@/content/types"

export const esHomepage = {
  hero: {
    title:
      "Sistemas para operaciones que han crecido más allá de sus herramientas.",
    description:
      "Brunova diseña y construye sistemas operacionales confiables que integran procesos, datos y automatizaciones hoy fragmentados, para que operaciones complejas puedan crecer con control.",
    primaryAction: "Hablemos",
    secondaryAction: "Explorar sistemas",
  },
  category:
    "Ingeniería de sistemas para operaciones cuya complejidad ya no se resuelve sumando herramientas.",
  problem: {
    title:
      "Cuando el crecimiento convierte la operación en un problema de sistemas.",
    description:
      "El crecimiento revela problemas que ninguna herramienta aislada puede resolver: la operación necesita un sistema detrás.",
    transition:
      "La respuesta no es sumar otra herramienta, sino diseñar mejor el sistema.",
  },
  operationalIntelligence: {
    title:
      "La inteligencia operativa aporta visibilidad y control sobre procesos, datos y sistemas.",
    description:
      "Conectamos cómo fluye el trabajo, qué significan los datos y dónde se toman las decisiones, para que los equipos entiendan mejor la operación y actúen con mayor control. El software, la automatización y la IA apoyan ese modelo donde pueden hacerlo de forma segura.",
  },
  architecture: {
    question: "No empezamos por «¿qué automatizamos?»",
    answer: "Primero definimos «¿cómo debe funcionar la operación?»",
  },
  workTitle: "Experiencia de ingeniería seleccionada",
  process: {
    title: "Cómo trabaja Brunova",
    entryTitle: "Empezamos donde el sistema lo necesita.",
    entryDescription:
      "Cuando el problema aún no está claro, podemos empezar con un diagnóstico; si ya existe claridad suficiente, avanzamos desde ahí.",
  },
  differentiatorsTitle: "Principios que guían nuestro trabajo",
} as const

export const esHomepageSymptoms = [
  {
    name: "Sistemas desconectados",
    consequence:
      "La información crítica queda atrapada entre herramientas, reduciendo la confianza en reportes y decisiones.",
  },
  {
    name: "Operaciones dependientes de hojas de cálculo",
    consequence:
      "La lógica de la operación queda dispersa en archivos, fuera del sistema.",
  },
  {
    name: "Automatizaciones frágiles",
    consequence:
      "Un cambio en el origen provoca fallas silenciosas que consumen la atención de la dirección.",
  },
  {
    name: "Reportes poco confiables",
    consequence: "Los equipos primero deben acordar qué cifra es correcta.",
  },
  {
    name: "Transferencias manuales",
    consequence:
      "El estado y la responsabilidad se diluyen entre equipos, dificultando el control de entregas y excepciones.",
  },
  {
    name: "Dependencia de personas clave",
    consequence:
      "La operación depende de conocimiento que no está institucionalizado.",
  },
  {
    name: "Excepciones que rompen el proceso",
    consequence:
      "El flujo funciona en condiciones normales, pero pierde control ante las excepciones.",
  },
  {
    name: "Datos sin confianza operativa",
    consequence: "La información existe, pero no es confiable para operar.",
  },
] as const satisfies readonly HomepageSymptom[]

export const esOperationalIntelligenceElements = [
  {
    name: "Operaciones",
    role: "marcan el trabajo real y sus restricciones",
  },
  { name: "Datos", role: "dan un significado común al estado operativo" },
  { name: "Sistemas", role: "definen límites, controles y gobernanza" },
  {
    name: "Automatización",
    role: "ejecuta rutas conocidas con mecanismos de recuperación",
  },
  {
    name: "Software",
    role: "convierte el modelo en una capacidad operativa duradera",
  },
  {
    name: "IA",
    role: "asiste donde el criterio tiene límites y controles claros",
  },
] as const satisfies readonly OperationalIntelligenceElement[]

export const esArchitectureInputs = [
  "Operación",
  "Límites del sistema",
  "Datos",
  "Decisiones",
  "Escenarios de falla",
  "Gobernanza",
] as const

export const esDifferentiators = [
  {
    title: "Arquitectura antes que herramientas",
    description:
      "Primero definimos el sistema; después elegimos las herramientas.",
  },
  {
    title: "Sistemas, no automatizaciones aisladas.",
    description:
      "Construimos capacidades que la empresa puede operar y mantener, no automatizaciones que solo logran ejecutarse.",
  },
  {
    title: "Con la operación en el centro",
    description:
      "Trabajamos sobre el proceso real para entender excepciones, responsables, relevos y puntos de falla.",
  },
] as const satisfies readonly Differentiator[]

export const esCapabilities = [
  {
    slug: "systems-architecture-internal-platforms",
    index: "01",
    name: "Arquitectura de sistemas y plataformas internas",
    navigationLabel: "Arquitectura",
    shortDescription:
      "Para operaciones críticas que crecieron sin responsables claros ni un sistema diseñado para sostenerlas.",
    problemClass:
      "Las operaciones críticas crecieron sin límites compartidos ni una gobernanza clara.",
    approach:
      "Definimos el modelo operativo, los servicios y la plataforma alrededor de la operación.",
    operationalConcerns: [
      "Límites del sistema",
      "Gobernanza de servicios",
      "Mantenibilidad",
    ],
    outcomes: [
      "Servicios internos reutilizables",
      "Plataformas internas",
      "Arquitectura más clara",
    ],
    relatedWork: ["multi-tenant-financial-integration-platform"],
  },
  {
    slug: "data-integration-engineering",
    index: "02",
    name: "Ingeniería de datos e integraciones",
    navigationLabel: "Datos e integraciones",
    shortDescription:
      "Para reportes y trabajo diario que dependen de datos dispersos entre sistemas sin una fuente confiable.",
    problemClass:
      "Los datos distribuidos carecen de significado, recorrido y gobernanza consistentes.",
    approach:
      "Definimos la semántica y gobernanza de los datos antes de conectar sus fuentes dentro de un límite controlado.",
    operationalConcerns: [
      "Fuentes y gobernanza definidas",
      "Resolución de referencias",
      "Sincronización y recuperación",
    ],
    outcomes: [
      "Sincronización confiable",
      "Flujos de datos",
      "Bases confiables para reportes",
    ],
    relatedWork: [
      "multi-tenant-financial-integration-platform",
      "operational-finance-data-infrastructure",
    ],
  },
  {
    slug: "financial-operational-automation",
    index: "03",
    name: "Automatización financiera y operativa",
    navigationLabel: "Automatización financiera",
    shortDescription:
      "Para trabajo financiero y operativo que aún depende de conciliaciones manuales, relevos y automatizaciones desconectadas.",
    problemClass:
      "El trabajo financiero crítico depende de relevos manuales y automatizaciones desconectadas.",
    approach:
      "Integramos reglas, conciliaciones, excepciones y gobernanza en un sistema controlado.",
    operationalConcerns: [
      "Conciliación",
      "Manejo de excepciones",
      "Gobernanza operativa",
    ],
    outcomes: [
      "Flujos financieros controlados",
      "Infraestructura de conciliación",
      "Integraciones contables confiables",
    ],
    relatedWork: [
      "multi-tenant-financial-integration-platform",
      "operational-finance-data-infrastructure",
    ],
  },
  {
    slug: "workflow-process-engineering",
    index: "04",
    name: "Ingeniería de flujos y procesos",
    navigationLabel: "Ingeniería de procesos",
    shortDescription:
      "Para procesos que pierden control cuando cambian de manos, aparecen excepciones o se requiere criterio.",
    problemClass:
      "Un proceso pierde control cuando cambia de manos, aparecen excepciones o se requiere criterio.",
    approach:
      "Definimos estados, responsables, aprobaciones, excepciones y revisión humana antes de automatizar.",
    operationalConcerns: [
      "Estados y relevos",
      "Aprobaciones y escalamiento",
      "Rutas de excepción",
    ],
    outcomes: [
      "Relevos más claros",
      "Estado explícito",
      "Automatización que resiste excepciones reales",
    ],
    relatedWork: ["document-intelligence-workflow"],
  },
  {
    slug: "modernization-fragile-automations",
    index: "05",
    name: "Modernización de automatizaciones frágiles",
    navigationLabel: "Modernización",
    shortDescription:
      "Para automatizaciones que aún funcionan, pero son difíciles de entender, recuperar o modificar con seguridad.",
    problemClass:
      "Automatizaciones útiles se han vuelto frágiles, opacas o dependientes de una persona.",
    approach:
      "Conservamos el comportamiento útil e incorporamos los controles necesarios para operarlo y hacerlo evolucionar.",
    operationalConcerns: [
      "Observabilidad",
      "Recuperación e idempotencia",
      "Disciplina de despliegue",
    ],
    outcomes: ["Observabilidad", "Recuperación", "Mantenibilidad"],
    relatedWork: ["fragile-automation-modernization"],
  },
] as const satisfies readonly Capability[]

export const esProcessStages = [
  {
    index: "01",
    verb: "Diagnosticar",
    name: "Diagnóstico del sistema",
    description:
      "Convertimos una situación operativa poco clara en un problema de sistema definido.",
    timeline: "1–2 semanas",
    price: "USD 999",
    preview:
      "Para una situación operativa poco clara; produce un problema de sistema definido y un siguiente paso recomendado.",
    problemSolved:
      "El problema de sistema, sus límites y el origen de la falla no están claros.",
    entryKnowledge:
      "Se conocen la operación y las consecuencias de su funcionamiento actual.",
    establishes: [
      "Evidencia sobre la operación actual",
      "Un problema y límites sustentados en evidencia",
      "Un siguiente paso concreto",
    ],
    nextStep:
      "Con el problema definido, el trabajo puede avanzar al Diseño de arquitectura.",
  },
  {
    index: "02",
    verb: "Diseñar",
    name: "Diseño de arquitectura",
    description:
      "Convertimos un problema definido en un diseño operativo y técnico listo para implementar.",
    timeline: "2–4 semanas",
    price: "Desde USD 1,999",
    preview:
      "Para un problema conocido; produce un diseño operativo y técnico listo para implementar.",
    problemSolved:
      "El problema está claro, pero el sistema aún no está suficientemente definido para construirlo.",
    entryKnowledge:
      "El problema y los límites deseados están claros por el Diagnóstico o por trabajo previo.",
    establishes: [
      "Límites del sistema listos para implementar",
      "Decisiones de diseño técnico y operativo",
      "Una ruta de implementación definida",
    ],
    nextStep:
      "Con la arquitectura definida, el trabajo puede avanzar al Sprint de implementación.",
  },
  {
    index: "03",
    verb: "Construir",
    name: "Sprint de implementación",
    description:
      "Construimos y ponemos en operación una capacidad definida del sistema.",
    timeline: "4–8 semanas por alcance definido",
    price: "Desde USD 2,999",
    preview:
      "Para una arquitectura aprobada; produce una capacidad operable en producción.",
    problemSolved:
      "El diseño debe convertirse en un sistema operable en producción.",
    entryKnowledge:
      "La arquitectura, el alcance y la gobernanza operativa están definidos.",
    establishes: [
      "La capacidad acordada en producción",
      "Gobernanza operativa y transferencia",
      "Los controles requeridos por el alcance definido",
    ],
    nextStep:
      "El sistema puede transferirse al equipo responsable o continuar en Evolución continua.",
  },
  {
    index: "04",
    verb: "Evolucionar",
    name: "Evolución continua",
    description:
      "Mejoramos la confiabilidad, arquitectura y capacidad de sistemas críticos en producción.",
    timeline: "Colaboración mensual continua",
    price: "Desde USD 1,999/mes",
    preview:
      "Para un sistema crítico existente; produce mejoras priorizadas de confiabilidad y arquitectura.",
    commitment: "Mínimo 3 meses",
    problemSolved:
      "Un sistema en producción debe evolucionar cuando cambian la operación y los riesgos.",
    entryKnowledge:
      "Existe un sistema en producción y su equipo puede identificar la presión actual.",
    establishes: [
      "Un alcance claro de mejora continua",
      "Trabajo priorizado de confiabilidad y arquitectura",
      "Contexto operativo cercano al trabajo",
    ],
    nextStep:
      "La evolución continúa mientras el sistema sea crítico y el trabajo aporte valor.",
  },
] as const satisfies readonly ProcessStage[]

export const esWorkCases = [
  {
    slug: "multi-tenant-financial-integration-platform",
    homepageTitle:
      "Plataforma de integración financiera para múltiples entidades",
    title:
      "Integración financiera compartida para múltiples entidades operativas",
    summary:
      "Una plataforma reutilizable que centraliza el ciclo de OAuth, las operaciones contables, la resolución de referencias y los reportes recurrentes para múltiples entidades.",
    systemsClass: "Plataforma financiera para múltiples entidades",
    systemsTitle:
      "Acceso compartido a operaciones financieras para múltiples entidades",
    systemsSummary:
      "Conecta a varias entidades para que puedan consultar y actualizar información contable y generar reportes recurrentes mediante un mismo sistema reutilizable, en lugar de administrar una conexión distinta para cada una.",
    systemType: "Operaciones financieras",
    focus: ["Contabilidad multi-entidad", "Reportes financieros recurrentes"],
    capabilitySignals: [
      "Arquitectura de sistemas",
      "Automatización financiera",
      "Ingeniería de APIs e integraciones",
      "Confiabilidad",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
  {
    slug: "operational-finance-data-infrastructure",
    homepageTitle: "Infraestructura de datos para finanzas operativas",
    title:
      "Reportes financieros recurrentes convertidos en infraestructura compartida",
    summary:
      "Flujos automatizados de extracción y reporte conectan sistemas contables y operativos con un almacén de datos y las hojas de cálculo que usan los equipos, para dar acceso consistente a la información financiera.",
    systemsClass: "Sistema de reportes financieros",
    systemsTitle:
      "Reportes financieros actualizados desde una fuente compartida de información",
    systemsSummary:
      "Conecta información contable y operativa para preparar reportes recurrentes de forma consistente en las hojas de cálculo que ya usan los equipos, sin reconstruir los mismos datos en cada tarea de reporte.",
    systemType: "Reportes operativos",
    focus: ["Reportes financieros", "Acceso a datos del negocio"],
    capabilitySignals: [
      "Ingeniería de datos",
      "Inteligencia operativa",
      "Infraestructura de reportes",
      "Ingeniería de integraciones",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
  {
    slug: "document-intelligence-workflow",
    homepageTitle: "Flujo de inteligencia documental",
    title: "Procesamiento documental con IA y controles explícitos",
    summary:
      "Un sistema que combina clasificación, extracción estructurada, validación y revisión humana para procesar documentos sensibles sin perder control operativo.",
    systemsClass: "Sistema controlado de procesamiento documental",
    systemsTitle:
      "Procesamiento documental asistido por IA con revisión humana incorporada",
    systemsSummary:
      "Clasifica y extrae información de documentos sensibles para la operación, y exige validación y revisión humana antes de incorporarla al siguiente proceso operativo.",
    systemType: "Procesamiento documental",
    focus: [
      "Clasificación y extracción documental",
      "Validación y revisión humana",
      "Procesos posteriores",
    ],
    capabilitySignals: [
      "Ingeniería de flujos",
      "IA aplicada con control",
      "Revisión humana",
      "Confiabilidad",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
  {
    slug: "fragile-automation-modernization",
    homepageTitle: "Modernización de automatizaciones frágiles",
    title: "De automatizaciones dependientes de personas a sistemas operables",
    summary:
      "Modernización de conjuntos de automatizaciones mediante límites más claros, observabilidad, recuperación, idempotencia, disciplina de despliegue y documentación operativa, sin reescribir innecesariamente el comportamiento que funciona.",
    systemsClass: "Modernización de automatizaciones operativas",
    systemsTitle:
      "Automatizaciones críticas más fáciles de operar, recuperar y modificar",
    systemsSummary:
      "Conserva las automatizaciones que aún funcionan e incorpora una gobernanza más clara, controles de recuperación, disciplina de despliegue y documentación operativa.",
    systemType: "Operación de automatizaciones",
    focus: [
      "Automatizaciones existentes",
      "Recuperación y observabilidad",
      "Despliegues gestionados",
    ],
    capabilitySignals: [
      "Modernización",
      "Arquitectura de sistemas",
      "Confiabilidad",
      "Ingeniería operativa",
    ],
    publicationStatus: "approved-summary",
    detailStatus: "publication-review-required",
  },
] as const satisfies readonly WorkCase[]

export const esAboutNarrative = {
  observation:
    "Al crecer una empresa, sus operaciones críticas suelen repartirse entre hojas de cálculo, herramientas SaaS, scripts y automatizaciones antes de que alguien diseñe el sistema que debe sostenerlas.",
  boundary:
    "Brunova trabaja donde convergen procesos, datos, software y automatización para construir sistemas confiables, operables y capaces de evolucionar.",
} as const

export const esCompanyModel = [
  {
    title: "Arquitectura liderada por el fundador",
    description:
      "Jorge Vera, fundador y arquitecto principal de sistemas, dirige el sistema y participa en las decisiones de arquitectura críticas.",
  },
  {
    title: "Ingeniería según las necesidades del sistema",
    description:
      "La ejecución se organiza alrededor de las disciplinas que requiere cada sistema, mientras la arquitectura y los compromisos técnicos relevantes permanecen bajo revisión senior.",
  },
  {
    title: "Vinculados a la operación",
    description:
      "El trabajo se mantiene cerca del proceso real, sus excepciones, traspasos y puntos de falla.",
  },
] as const

export const esOperationalLens = {
  title: "Inteligencia operativa",
  description:
    "La inteligencia operativa conecta procesos, datos, sistemas y automatización para dar a los equipos mayor visibilidad, control y soporte para decidir.",
} as const

export const esPrivacyContent = {
  reviewStatus: "approved-controller-information-2026-08-25",
  updatedLabel:
    "Aviso de Privacidad · Vigente desde el 24 de agosto de 2026 · Última actualización: 25 de agosto de 2026",
  introduction:
    "Este Aviso de Privacidad integral explica cómo Jorge Alfredo Vera Fuentes, quien opera bajo el nombre comercial Brunova, trata los datos personales recabados mediante el sitio web de Brunova.",
  sections: [
    {
      id: "controller",
      title: "Responsable del tratamiento",
      paragraphs: [
        "Jorge Alfredo Vera Fuentes, persona física establecida en México que opera bajo el nombre comercial Brunova, es responsable del tratamiento de los datos personales a través de este sitio web.",
        "Domicilio de privacidad: Calle Poniente 1 #16, Centro, C.P. 94730, Río Blanco, Veracruz, México. Contacto de privacidad: brunova@brunova.mx.",
      ],
    },
    {
      id: "data-collected",
      title: "Datos personales recabados",
      paragraphs: [
        "El formulario de contacto recaba su nombre, correo electrónico de trabajo, empresa, cargo, categoría del problema y la descripción que proporcione sobre un problema operativo. También incluye la ruta y el idioma del envío, un identificador de solicitud, un identificador de idempotencia y la hora del envío.",
        "Durante una visita ininterrumpida a la página, el sitio conserva en la memoria temporal de la página un registro limitado de primer contacto: ruta e idioma de llegada, hora de captura, nombre de host referente cuando está disponible, clasificación limitada de la fuente y valores UTM de fuente, medio, campaña, término y contenido incluidos en la URL de llegada. No conserva la URL referente completa ni su cadena de consulta. El registro no se escribe en cookies, localStorage ni sessionStorage y se pierde al recargar o cerrar la página. Conforme al contrato de contacto actualmente desplegado, con el formulario se incluyen únicamente los valores UTM disponibles, no los demás campos de primer contacto.",
        "El sitio usa una dirección de red sin procesar únicamente de forma transitoria para derivar una clave seudónima en memoria destinada al control de abuso. La dirección sin procesar, el campo señuelo y la información de tiempo del formulario no se conservan en el flujo operativo de Brunova, y el sitio no crea una huella del navegador.",
        "Brunova no solicita intencionalmente datos personales sensibles. No incluya en la descripción libre información de salud, biométrica, genética, religiosa, política, de orientación sexual ni otros datos personales sensibles.",
      ],
    },
    {
      id: "purposes",
      title: "Finalidades del tratamiento",
      paragraphs: [
        "Brunova usa la información enviada únicamente para revisar una consulta y su contexto de negocio; determinar si Brunova es una opción adecuada y qué siguiente paso puede ser útil; responder la consulta; mantener el seguimiento operativo y comercial necesario; conservar la correspondencia empresarial necesaria; y mantener registros razonables relacionados con la relación comercial o posible relación.",
        "La información técnica de la solicitud se trata únicamente en la medida necesaria para operar y proteger el sitio, validar los envíos, prevenir abuso, mantener la integridad de las solicitudes y diagnosticar fallas de entrega sin registrar el contenido del formulario.",
        "No existen finalidades secundarias. Brunova no usa actualmente la información enviada para boletines, campañas publicitarias, publicidad conductual, elaboración de perfiles ni correos promocionales ajenos a la consulta. Una nueva finalidad fuera de este Aviso requerirá una revisión de privacidad previa y, cuando corresponda, un nuevo consentimiento.",
      ],
    },
    {
      id: "processing",
      title: "Tratamiento y proveedores de servicios",
      paragraphs: [
        "El navegador envía el formulario al servidor de Brunova. El servidor valida y limita el envío antes de reenviar únicamente los campos de contacto aceptados y los valores UTM disponibles al flujo operativo privado de Brunova para revisión interna y seguimiento.",
        "Los proveedores de tecnología y servicios pueden tratar datos personales por cuenta de Brunova cuando sea necesario para prestar servicios de alojamiento del sitio, comunicaciones, automatización de flujos y sistemas de negocio. Según su infraestructura, el tratamiento o almacenamiento puede ocurrir en México o en otros países. Brunova no afirma que el tratamiento ocurra exclusivamente en México.",
        "Brunova no pretende actualmente comunicar datos personales a terceros independientes para fines propios de éstos. Si una transferencia futura requiere aviso o consentimiento conforme a la legislación aplicable, Brunova lo proporcionará antes de que ocurra.",
      ],
    },
    {
      id: "retention",
      title: "Conservación y disposición",
      paragraphs: [
        "Para una consulta que no se convierta en una relación con un cliente, la política operativa de Brunova es conservar la información por un máximo de 24 meses después de la última interacción comercial significativa, salvo que sea necesario un plazo mayor por una obligación legal aplicable o por un requisito legítimo de controversia o conservación de registros. El plazo de 24 meses es una política de Brunova; no es un plazo de conservación establecido por la legislación mexicana.",
        "Para una consulta que se convierta en una relación con un cliente, los datos personales se conservan durante la relación comercial o contractual y posteriormente sólo durante los plazos requeridos por obligaciones legales, contractuales, fiscales, contables, de resolución de controversias u otras obligaciones legítimas de conservación.",
        "Cuando concluyan la finalidad y el periodo aplicable de conservación o bloqueo, Brunova eliminará, desechará de forma segura, anonimizará o disociará la información, según corresponda. Puede aplicar un periodo de bloqueo exigido por la ley antes de la eliminación.",
      ],
    },
    {
      id: "rights",
      title: "Derechos ARCO, limitación y revocación",
      paragraphs: [
        "Puede solicitar el acceso, rectificación o cancelación de sus datos personales, u oponerse a su tratamiento —derechos ARCO— mediante un correo a brunova@brunova.mx. Puede usar la misma dirección para limitar el uso o divulgación o para revocar el consentimiento. La revocación no tendrá efectos retroactivos y puede estar sujeta a obligaciones legales de conservación.",
        "La solicitud deberá incluir su nombre; un domicilio u otro medio para recibir notificaciones; la documentación razonablemente necesaria para verificar su identidad o, cuando corresponda, la identidad y representación de su representante; una descripción clara de los datos personales involucrados; el derecho ARCO o la acción solicitada; y cualquier información razonablemente útil para localizar los datos. Una solicitud de rectificación también deberá identificar la corrección solicitada e incluir la documentación de respaldo que corresponda.",
        "Brunova acusará recibo por correo electrónico. La determinación se comunicará dentro del plazo legal máximo de 20 días hábiles contados desde la recepción. Si la solicitud resulta procedente, se hará efectiva dentro de los 15 días hábiles siguientes. Cualquiera de los plazos podrá ampliarse una sola vez por un periodo igual cuando las circunstancias lo justifiquen. La respuesta se enviará por correo electrónico o por el medio de comunicación proporcionado por la persona solicitante. El ejercicio de los derechos ARCO es gratuito, salvo los costos de reproducción, copias o envío permitidos por la ley.",
      ],
    },
    {
      id: "preferences",
      title: "Preferencias, analítica y publicidad",
      paragraphs: [
        "El almacenamiento local del navegador se usa únicamente después de que usted elige una preferencia de apariencia o idioma, para proporcionar esa configuración solicitada. El sitio no establece cookies actualmente.",
        "El sitio actual utiliza un adaptador de analítica sin operación y no incluye proveedor de analítica, rastreador publicitario ni publicidad conductual. No hay almacenamiento no esencial de analítica o publicidad activo, por lo que no se muestra un aviso de consentimiento.",
      ],
    },
    {
      id: "changes",
      title: "Cambios al Aviso",
      paragraphs: [
        "Las versiones vigentes de este Aviso se publican en /privacy y /es/privacy. Los cambios se comunicarán mediante la publicación del Aviso actualizado en esas direcciones con una fecha revisada. Si la legislación aplicable exige una forma adicional de aviso o consentimiento para un cambio material específico, Brunova la proporcionará en ese momento.",
        "Este Aviso se publicó por primera vez con el sitio de producción el 24 de agosto de 2026. Esta revisión aprobada se actualizó por última vez el 25 de agosto de 2026.",
      ],
    },
  ],
} as const

export const esWorkDetails = [
  {
    slug: "multi-tenant-financial-integration-platform",
    context:
      "Varias entidades operativas necesitaban una misma forma de consultar información contable y reportes financieros recurrentes.",
    operationalProblem:
      "Las conexiones, las actualizaciones contables y los reportes se administraban sin un sistema compartido entre entidades.",
    systemApproach:
      "Un sistema reutilizable permite a cada entidad consultar y actualizar información contable y generar reportes recurrentes mediante un mismo punto controlado.",
    systemBoundary: {
      summary:
        "Un mismo punto controla cómo se conectan las entidades con las operaciones contables y los reportes.",
      steps: [
        {
          label: "Entidades operativas",
          role: "Entidades que requieren un acceso contable consistente",
        },
        {
          label: "Ciclo de conexión",
          role: "Conexiones de cuenta (OAuth) y coincidencia de registros centralizadas",
        },
        {
          label: "Operaciones financieras",
          role: "Consulta y actualización de información contable, además de reportes recurrentes",
        },
        {
          label: "Acceso operativo",
          role: "Servicios compartidos disponibles para otros sistemas",
        },
      ],
    },
    engineeringDecisions: [
      "Centralizar las conexiones de cuenta y la coincidencia de registros en una capa de integración compartida.",
      "Permitir la consulta y actualización de información contable dentro del mismo límite controlado.",
      "Ofrecer reportes recurrentes y acceso operativo mediante servicios reutilizables de la plataforma.",
    ],
    outcome:
      "Varias entidades pueden trabajar con información financiera mediante un sistema consistente y reutilizable.",
    capabilities: [
      {
        label: "Arquitectura de sistemas",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
      {
        label: "Automatización financiera",
        capabilitySlug: "financial-operational-automation",
      },
      {
        label: "Ingeniería de APIs e integraciones",
        capabilitySlug: "data-integration-engineering",
      },
    ],
  },
  {
    slug: "operational-finance-data-infrastructure",
    context:
      "Los reportes financieros recurrentes dependían de información distribuida entre sistemas contables y operativos.",
    operationalProblem:
      "Cada tarea de reporte reunía la información por separado, lo que dificultaba un acceso consistente para los equipos del negocio.",
    systemApproach:
      "Un sistema compartido recopila y prepara la información antes de entregarla en las hojas de cálculo que ya usan los equipos.",
    systemBoundary: {
      summary:
        "La información contable y operativa se prepara una sola vez en una base compartida antes de llegar a los reportes del negocio.",
      steps: [
        {
          label: "Sistemas de origen",
          role: "Información contable y operativa",
        },
        {
          label: "Flujo de extracción",
          role: "Recopilación y preparación automatizada de información de origen",
        },
        { label: "Almacén de datos", role: "Base compartida para reportes" },
        {
          label: "Acceso del negocio",
          role: "Información consistente en herramientas conocidas por los equipos",
        },
      ],
    },
    engineeringDecisions: [
      "Integrar las fuentes contables y operativas mediante un solo flujo de reportes.",
      "Usar el almacén como infraestructura compartida y no como interfaz final.",
      "Conservar el acceso mediante hojas de cálculo para equipos no técnicos.",
    ],
    outcome:
      "Los equipos del negocio acceden de forma consistente a información financiera recurrente desde hojas de cálculo conocidas.",
    capabilities: [
      {
        label: "Ingeniería de datos",
        capabilitySlug: "data-integration-engineering",
      },
      {
        label: "Automatización financiera",
        capabilitySlug: "financial-operational-automation",
      },
      {
        label: "Arquitectura de sistemas",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
    ],
  },
  {
    slug: "document-intelligence-workflow",
    context:
      "Los documentos sensibles para la operación requerían un procesamiento consistente sin eliminar la supervisión humana.",
    operationalProblem:
      "La clasificación y extracción automatizadas no garantizaban por sí solas que la información estuviera lista para el siguiente proceso operativo.",
    systemApproach:
      "Un proceso asistido por IA exige validación y revisión humana antes de permitir que la información avance.",
    systemBoundary: {
      summary:
        "La IA prepara información estructurada; la validación y la revisión humana determinan si puede avanzar.",
      steps: [
        {
          label: "Ingreso de documentos",
          role: "Documentos fuente sensibles para la operación",
        },
        {
          label: "Clasificación y extracción",
          role: "Procesamiento estructurado asistido por IA",
        },
        {
          label: "Validación y revisión",
          role: "Control explícito basado en criterio humano",
        },
        {
          label: "Proceso siguiente",
          role: "La información validada avanza al proceso operativo",
        },
      ],
    },
    engineeringDecisions: [
      "Separar la clasificación y la extracción estructurada de la validación.",
      "Incorporar la revisión humana al sistema como un control explícito, no como una excepción externa.",
      "Integrar la información validada con el siguiente proceso operativo.",
    ],
    safeguards: [
      "Validación estructurada antes de continuar",
      "Revisión humana para documentos sensibles",
      "Entrega controlada al siguiente proceso",
    ],
    outcome:
      "Los documentos pueden procesarse con asistencia de IA mientras el criterio humano permanece dentro de la operación.",
    capabilities: [
      {
        label: "Ingeniería de flujos",
        capabilitySlug: "workflow-process-engineering",
      },
      {
        label: "Arquitectura de sistemas",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
    ],
  },
  {
    slug: "fragile-automation-modernization",
    context:
      "Las automatizaciones existentes seguían sosteniendo la operación, pero eran frágiles, difíciles de entender y dependientes de una persona.",
    operationalProblem:
      "Una gobernanza poco clara y controles operativos débiles hacían riesgosos los cambios y la recuperación.",
    scalingConstraint:
      "No se justificaba reescribir lo que aún funcionaba, pero el modelo operativo existente ya no soportaba nuevos cambios.",
    systemApproach:
      "Brunova conservó el comportamiento funcional e incorporó los controles necesarios para operar, recuperar y modificar la automatización con menos riesgo.",
    systemBoundary: {
      summary:
        "La automatización se conserva, con gobernanza y controles explícitos para fallas, recuperación y despliegue.",
      steps: [
        {
          label: "Comportamiento funcional",
          role: "Automatización existente que vale la pena conservar",
        },
        {
          label: "Límites claros",
          role: "Alcance y gobernanza definidos",
        },
        {
          label: "Controles de operabilidad",
          role: "Monitoreo, recuperación y prevención de procesamiento duplicado (idempotencia)",
        },
        {
          label: "Sistema gestionado",
          role: "Despliegues disciplinados y documentación operativa",
        },
      ],
    },
    engineeringDecisions: [
      "Conservar el comportamiento funcional en vez de reescribirlo sin causa.",
      "Aclarar los límites del sistema antes de ampliar sus capacidades.",
      "Incorporar la disciplina de despliegue y la documentación al propio sistema.",
    ],
    safeguards: [
      "Observabilidad",
      "Recuperación",
      "Prevención de procesamiento duplicado (idempotencia)",
      "Documentación operativa",
    ],
    outcome:
      "La operación conserva el valor de sus automatizaciones con una gobernanza más clara y un sistema más fácil de mantener.",
    capabilities: [
      {
        label: "Modernización",
        capabilitySlug: "modernization-fragile-automations",
      },
      {
        label: "Arquitectura de sistemas",
        capabilitySlug: "systems-architecture-internal-platforms",
      },
    ],
  },
] as const satisfies readonly WorkDetail[]
