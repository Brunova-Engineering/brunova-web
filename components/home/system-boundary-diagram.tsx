import type { Locale } from "@/lib/i18n"

const diagramCopy = {
  en: {
    mobileLabel: "From fragmented inputs to a reliable operational system",
    mobile: [
      ["Fragmented operation", "Disconnected work · data · systems"],
      ["Defined boundary", "State · decisions · ownership"],
      ["Reliable operation", "Controlled · operable · scalable"],
    ],
    title: "From fragmented operations to a reliable operational system",
    description:
      "Separate processes, data and automations cross unclear manual handoffs. Brunova defines a system boundary that connects process, trusted state, decisions and ownership into a controlled operational flow.",
    groups: ["Fragmented operation", "Defined boundary", "Reliable operation"],
    fragments: ["Work", "Data", "Systems"],
    controls: ["State", "Decisions", "Ownership"],
    operatingSystem: "Operating model",
    output: ["Controlled", "Operable", "Scalable"],
    caption:
      "Brunova makes boundaries, state, decisions and ownership explicit before implementation tools are selected.",
  },
  es: {
    mobileLabel: "De una operación fragmentada a una operación confiable",
    mobile: [
      ["Operación fragmentada", "Trabajo · datos · sistemas desconectados"],
      ["Límite definido", "Estado · decisiones · gobernanza"],
      ["Operación confiable", "Controlada · operable · escalable"],
    ],
    title: "De una operación fragmentada a una operación confiable",
    description:
      "Procesos, datos y automatizaciones hoy separados se integran dentro de un límite claro. El sistema conecta proceso, estado, decisiones y gobernanza en un flujo operativo controlado.",
    groups: ["Operación fragmentada", "Límite definido", "Operación confiable"],
    fragments: ["Trabajo", "Datos", "Sistemas"],
    controls: ["Estado", "Decisiones", "Gobernanza"],
    operatingSystem: "Modelo operativo",
    output: ["Controlada", "Operable", "Escalable"],
    caption:
      "Brunova define límites, estado, decisiones y gobernanza antes de seleccionar las herramientas.",
  },
} as const

export function SystemBoundaryDiagram({ locale }: { locale: Locale }) {
  const copy = diagramCopy[locale]
  return (
    <figure className="system-diagram" data-locale={locale}>
      <ol aria-label={copy.mobileLabel} className="system-diagram__mobile">
        {copy.mobile.map(([title, detail]) => (
          <li key={title}>
            <strong>{title}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ol>
      <svg
        aria-labelledby="system-diagram-title system-diagram-description"
        className="system-diagram__svg"
        role="img"
        viewBox="0 0 720 380"
      >
        <title id="system-diagram-title">{copy.title}</title>
        <desc id="system-diagram-description">{copy.description}</desc>

        <defs>
          <marker
            id="diagram-arrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path className="system-diagram__arrowhead" d="M0 0L8 4L0 8Z" />
          </marker>
        </defs>

        <text className="system-diagram__group-label" x="18" y="30">
          {copy.groups[0]}
        </text>
        <text
          className="system-diagram__group-label"
          textAnchor="middle"
          x="380"
          y="30"
        >
          {copy.groups[1]}
        </text>
        <text
          className="system-diagram__group-label"
          textAnchor="end"
          x="702"
          y="30"
        >
          {copy.groups[2]}
        </text>

        <g className="system-diagram__fragments">
          <path d="M18 102H126" />
          <text x="18" y="90">
            {copy.fragments[0]}
          </text>
          <path d="M58 190H190" />
          <text x="58" y="178">
            {copy.fragments[1]}
          </text>
          <path d="M18 278H146" />
          <text x="18" y="266">
            {copy.fragments[2]}
          </text>
          <path
            className="system-diagram__broken-flow"
            d="M126 102L214 154M190 190L214 190M146 278L214 226"
          />
        </g>

        <path
          className="system-diagram__entry-line"
          d="M214 190H254"
          markerEnd="url(#diagram-arrow)"
        />

        <g className="system-diagram__boundary">
          <rect height="272" width="252" x="254" y="58" />
          <text
            className="system-diagram__boundary-title"
            textAnchor="middle"
            x="380"
            y="104"
          >
            {copy.operatingSystem}
          </text>
          <path className="system-diagram__model-line" d="M286 170H474" />
          {copy.controls.map((control, index) => (
            <g className="system-diagram__control" key={control}>
              <circle cx={304 + index * 76} cy="170" r="5" />
              <text textAnchor="middle" x={304 + index * 76} y="204">
                {control}
              </text>
            </g>
          ))}
          <path
            className="system-diagram__controlled-flow"
            d="M286 270H464"
            markerEnd="url(#diagram-arrow)"
          />
        </g>

        <path
          className="system-diagram__output-line"
          d="M506 190H554"
          markerEnd="url(#diagram-arrow)"
        />
        <g className="system-diagram__output">
          <path d="M554 190H702" />
          {copy.output.map((output, index) => (
            <text key={output} textAnchor="end" x="702" y={226 + index * 28}>
              {output}
            </text>
          ))}
        </g>
      </svg>
      <figcaption>{copy.caption}</figcaption>
    </figure>
  )
}
