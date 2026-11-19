"use client"

import { useEffect, useState } from "react"
import { acquisitionApi } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type Leads = Awaited<ReturnType<typeof acquisitionApi.unplacedCompanies>>

export function UnplacedCompanyInbox({cycleId, locale}: {cycleId:string;locale:Locale}) {
  const [data,setData] = useState<Leads|null>(null)
  const [failed,setFailed] = useState(false)
  useEffect(() => {
    let live = true
    acquisitionApi.unplacedCompanies(cycleId).then(result => {
      if(live) setData(result)
    }).catch(() => {if(live) setFailed(true)})
    return () => {live = false}
  },[cycleId])
  const es = locale === "es"
  return <section className="acq-section-heading" aria-label={es ? "Empresas por ubicar" : "Companies to place"}>
    <div>
      <span className="acq-eyebrow">{es ? "Bandeja de exploración" : "Exploration inbox"}</span>
      <h2>{es ? "Empresas por ubicar" : "Companies to place"}{data ? ` (${data.leads.length}${data.truncated ? "+" : ""})` : ""}</h2>
      <p className="acq-muted">{es
        ? "Se conservan sin atribuirles un eslabón ni autorizar contacto. Una propuesta de ubicación requiere evidencia."
        : "Kept without assigning a supply-chain link or authorizing contact. Placement proposals require evidence."}</p>
      {failed && <p role="alert">{es ? "No se pudo cargar la bandeja." : "Could not load the inbox."}</p>}
      {data && data.leads.length === 0 && <p className="acq-muted">{es ? "No hay empresas pendientes." : "No pending companies."}</p>}
      {data?.leads.map(lead => <details key={lead.id}>
        <summary>{lead.name} · {lead.market} · {lead.placementStatus === "PROPOSED"
          ? (es ? "Ubicación propuesta" : "Placement proposed")
          : (es ? "Sin ubicación" : "Unplaced")}</summary>
        <p>{lead.sourceNote}</p>
        {lead.sourceUrl && <p><a href={lead.sourceUrl} target="_blank" rel="noreferrer">{es ? "Fuente" : "Source"}</a></p>}
        {lead.suggestedChain && <p>{es ? "Cadena sugerida" : "Suggested chain"}: {lead.suggestedChain}
          {lead.suggestedLink ? ` · ${lead.suggestedLink}` : ""}</p>}
        {lead.placementReason && <p>{lead.placementReason}</p>}
      </details>)}
    </div>
  </section>
}
