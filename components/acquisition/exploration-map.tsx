"use client"

import {useEffect,useMemo,useState} from "react"
import {acquisitionApi} from "@/lib/acquisition-api"
import type {Locale} from "@/lib/i18n"

type MapData=Awaited<ReturnType<typeof acquisitionApi.explorationMap>>
type Node=MapData["nodes"][number]
const rank:Record<string,number>={MACRO_INDUSTRY:0,SPECIALTY:1,ACTIVITY:2,SUPPLY_CHAIN:3,LINK:4,COMPANY_LEAD:5}

export function ExplorationMap({cycleId,locale}:{cycleId:string;locale:Locale}){
 const [data,setData]=useState<MapData|null>(null)
 const [error,setError]=useState(false)
 useEffect(()=>{let live=true;acquisitionApi.explorationMap(cycleId).then(value=>{
  if(live){setData(value);setError(false)}
 }).catch(()=>{if(live)setError(true)});return()=>{live=false}},[cycleId])
 const byId=useMemo(()=>new Map((data?.nodes??[]).map(node=>[node.id,node])),[data])
 const path=(node:Node)=>{
  const steps:Node[]=[node],seen=new Set([node.id]);let cursor=node
  while(cursor.parents.length){const parent=byId.get(cursor.parents[0]!.parentId)
   if(!parent||seen.has(parent.id))break;steps.unshift(parent);seen.add(parent.id);cursor=parent}
  return steps.map(step=>step.label).join(" → ")
 }
 return <section className="acq-panel" aria-label={locale==="es"?"Mapa de exploración":"Exploration map"}>
  <h2>{locale==="es"?"Mapa de industrias y cadenas":"Industry and supply-chain map"}</h2>
  {error&&<p className="acq-muted">{locale==="es"?"No se pudo leer el mapa actual.":"The current map could not be loaded."}</p>}
  {!error&&!data&&<p className="acq-muted">{locale==="es"?"Cargando mapa…":"Loading map…"}</p>}
  {data&&!data.nodes.length&&<p className="acq-muted">{locale==="es"?"Todavía no hay una exploración dirigida registrada.":"No directed exploration has been recorded yet."}</p>}
  {data&&data.nodes.length>0&&<>
   <p className="acq-muted">{locale==="es"?"El mapa conserva pistas aunque una fuente no responda. Solo las relaciones corroboradas se muestran como observadas.":"The map retains leads when a source fails. Only corroborated relationships appear as observed."}</p>
   <h3>{locale==="es"?"Entrega por cadena":"Delivery by chain"}</h3>
   <p className="acq-muted">{locale==="es"?"Estos conteos son pistas preliminares. Listo para revisar no significa cliente verificado ni autoriza contacto.":"These counts are preliminary leads. Ready for review does not mean a verified customer or authorize contact."}</p>
   {data.chainProgress.length===0&&<p className="acq-muted">{locale==="es"?"Aún no se ha descubierto una cadena.":"No supply chain has been discovered yet."}</p>}
   <ul>{data.chainProgress.map(chain=><li key={chain.chain_id}>
    <strong>{chain.chain_label}</strong> · {chain.market}
    {chain.focused&&<> · {locale==="es"?"foco actual":"current focus"}</>}
    {' · '}{chain.delivery_status==='READY_FOR_REVIEW'
     ?locale==="es"?"lista para revisar":"ready for review"
     :locale==="es"?"en investigación":"in progress"}
    <div className="acq-muted">{locale==="es"
     ?`${chain.link_count} eslabones · ${chain.anchor_hint_count} anclas posibles · ${chain.prospect_hint_count} empresas con señales de escala y acceso · ${chain.company_lead_count} pistas de empresas`
     :`${chain.link_count} links · ${chain.anchor_hint_count} possible anchors · ${chain.prospect_hint_count} firms with scale and access hints · ${chain.company_lead_count} company leads`}</div>
   </li>)}</ul>
   {data.headers.map(header=><section key={header.market}>
    <h3>{header.market==="MX"?locale==="es"?"México":"Mexico":locale==="es"?"Estados Unidos":"United States"}</h3>
    <ul>
     {data.nodes.filter(node=>node.market===header.market).sort((a,b)=>(rank[a.kind]??9)-(rank[b.kind]??9)||a.label.localeCompare(b.label)).map(node=>{
      const uncertain=node.claims.every(claim=>claim.status==="UNVERIFIED")
      return <li key={node.id}>
       <strong>{node.label}</strong> · {node.kind.replaceAll("_"," ").toLowerCase()} · {node.state.toLowerCase()}
       {uncertain&&<> · {locale==="es"?"Pista por verificar":"Lead to verify"}</>}
       <div className="acq-muted">{path(node)}</div>
       {node.kind==="COMPANY_LEAD"&&<div className="acq-muted">
        {[node.attributes.activity,node.attributes.scaleSignal,node.attributes.accessRoute].filter(Boolean).join(" · ")}
       </div>}
      </li>
     })}
    </ul>
   </section>)}
   {data.directives.length>0&&<details><summary>{locale==="es"?"Trabajo y reanudación":"Work and resumption"}</summary>
    <ul>{data.directives.map(item=><li key={item.id}>{item.target_kind.replaceAll("_"," ").toLowerCase()} · {item.status.toLowerCase()} · {item.result_count} {locale==="es"?"hallazgos":"findings"}
     {item.last_error_code&&<> · {locale==="es"?"pendiente de revisar":"needs review"}</>}</li>)}</ul>
   </details>}
  </>}
 </section>
}
