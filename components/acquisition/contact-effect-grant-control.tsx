"use client"

import { useEffect, useRef, useState } from "react"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type Grants = Awaited<ReturnType<typeof acquisitionApi.candidateContactEffectGrants>>
type Policy = Awaited<ReturnType<typeof acquisitionApi.candidateContactChannelPolicy>>
const effects = ["SEND_EMAIL", "SEND_WHATSAPP", "SEND_FACEBOOK", "SEND_INSTAGRAM",
  "SEND_LINKEDIN", "CRM_QUALIFY", "CRM_UPDATE"] as const
type Effect = (typeof effects)[number]
const names: Record<Effect, string> = {
  SEND_EMAIL: "Correo", SEND_WHATSAPP: "WhatsApp", SEND_FACEBOOK: "Facebook",
  SEND_INSTAGRAM: "Instagram", SEND_LINKEDIN: "LinkedIn",
  CRM_QUALIFY: "Alta en HubSpot", CRM_UPDATE: "Actualizar HubSpot",
}
const providerPattern = /^[A-Za-z0-9._:@-]{1,200}$/
const senderUrlValid=(effect:Effect,url:string)=>{
  if(effect!=="SEND_FACEBOOK"&&effect!=="SEND_INSTAGRAM")return true
  try{
    const parsed=new URL(url)
    const host=effect==="SEND_FACEBOOK"?"facebook.com":"instagram.com"
    return parsed.protocol==="https:"&&[host,`www.${host}`].includes(parsed.hostname)&&
      parsed.pathname.length>1&&!parsed.search&&!parsed.hash&&!parsed.username&&!parsed.password
  }catch{return false}
}

export function ContactEffectGrantControl({cycleId,locale,session,preview}:{
  cycleId:string;locale:Locale;session:PortalSession;
  preview?:{grants:Grants;policy:Policy}
}) {
  const es=locale==="es"
  const dialog=useRef<HTMLDialogElement>(null)
  const [grants,setGrants]=useState<Grants|null>(preview?.grants??null)
  const [policy,setPolicy]=useState<Policy|null>(preview?.policy??null)
  const [effect,setEffect]=useState<Effect>("SEND_EMAIL")
  const [provider,setProvider]=useState("")
  const [senderUrl,setSenderUrl]=useState("")
  const [reason,setReason]=useState("")
  const [revokeReason,setRevokeReason]=useState("")
  const [validDays,setValidDays]=useState(7)
  const [pending,setPending]=useState(false)
  const [message,setMessage]=useState("")
  const canManage=session.actor.capabilities.includes("MANAGE_CYCLE")
  const load=async()=>{
    const [nextGrants,nextPolicy]=await Promise.all([
      acquisitionApi.candidateContactEffectGrants(cycleId),
      acquisitionApi.candidateContactChannelPolicy(cycleId),
    ])
    setGrants(nextGrants);setPolicy(nextPolicy)
  }
  useEffect(()=>{
    if(!canManage||preview)return
    let live=true
    Promise.all([acquisitionApi.candidateContactEffectGrants(cycleId),
      acquisitionApi.candidateContactChannelPolicy(cycleId)]).then(([nextGrants,nextPolicy])=>{
      if(live){setGrants(nextGrants);setPolicy(nextPolicy)}
    }).catch(()=>{if(live)setMessage(es?"No se pudieron leer los permisos.":
      "Grants could not be read.")})
    return ()=>{live=false}
  },[cycleId,canManage,es,preview])
  if(!canManage)return null
  const allowedChannels=policy?.revisions.find(item=>item.current)?.allowedChannels??
    policy?.baseline?.allowedChannels??[]
  const eligible=effects.filter(item=>!item.startsWith("SEND_")||
    allowedChannels.includes(item.slice(5)))
  const active=grants?.grants.filter(item=>item.current)??[]
  const selectedEffect=eligible.includes(effect)?effect:eligible[0]
  const social=selectedEffect==="SEND_FACEBOOK"||selectedEffect==="SEND_INSTAGRAM"
  const canPublish=!!policy?.baseline?.current&&!!selectedEffect&&
    providerPattern.test(provider)&&reason.trim().length>=20&&
    Number.isInteger(validDays)&&validDays>=1&&validDays<=30&&
    senderUrlValid(selectedEffect,senderUrl)
  const publish=async()=>{
    if(preview||!canPublish||!selectedEffect||!policy?.baseline||pending)return
    setPending(true);setMessage("")
    try{
      await acquisitionApi.publishCandidateContactEffectGrant(
        "contact-effect-"+crypto.randomUUID(),{
          cycleId,expectedMandateId:policy.baseline.mandateId,
          expectedPolicyHash:policy.baseline.policyHash,effectKind:selectedEffect,
          providerAccountId:provider,reason:reason.trim(),
          expiresAt:new Date(Date.now()+validDays*86_400_000).toISOString(),
          ...(social?{chromeProfile:"Brunova" as const,senderUrl}:{}),
        },session.csrfToken)
      setReason("");setMessage(es?"Permiso registrado para la siguiente sesión.":
        "Grant recorded for the next session.")
      dialog.current?.close()
      try{await load()}catch{setMessage(es?"Permiso registrado. Actualiza para ver el estado vigente.":
        "Grant recorded. Refresh for current status.")}
    }catch{setMessage(es?"No se registró el permiso. Comprueba el ciclo y el canal.":
      "Grant was not recorded. Check the cycle and channel.")}
    finally{setPending(false)}
  }
  const revoke=async(grantId:string)=>{
    if(preview||pending||revokeReason.trim().length<10)return
    setPending(true);setMessage("")
    try{
      await acquisitionApi.revokeCandidateContactEffectGrant(grantId,
        revokeReason.trim(),session.csrfToken)
      setRevokeReason("");setMessage(es?"Permiso revocado.":"Grant revoked.")
      dialog.current?.close()
      try{await load()}catch{setMessage(es?"Permiso revocado. Actualiza para ver el estado vigente.":
        "Grant revoked. Refresh for current status.")}
    }catch{setMessage(es?"No se pudo revocar el permiso.":"Grant could not be revoked.")}
    finally{setPending(false)}
  }
  return <section className="acq-contact-policy" aria-label={es?"Permisos de efectos":"Effect grants"}>
    <div>
      <span className="acq-eyebrow">{es?"CONTACTO · EJECUCIÓN":"OUTREACH · EXECUTION"}</span>
      <h3>{es?"Permisos exactos":"Exact grants"}</h3>
      <p>{grants?(es?`${active.length} vigentes · cada efecto requiere su remitente`:
        `${active.length} current · each effect needs its sender`):
        (es?"Consultando…":"Loading…")}</p>
    </div>
    <button type="button" disabled={!grants||!policy?.baseline?.current}
      onClick={()=>dialog.current?.showModal()}>
      {es?"Revisar permisos":"Review grants"}
    </button>
    {message&&<span role="status">{message}</span>}
    {preview&&<span className="acq-muted">{es?"Vista local sin publicación":"Local preview without publishing"}</span>}
    <dialog ref={dialog} className="acq-dialog acq-contact-policy-dialog"
      aria-labelledby="acq-contact-effect-title" onCancel={event=>{if(pending)event.preventDefault()}}>
      <h2 id="acq-contact-effect-title">{es?"Permisos de contacto":"Outreach grants"}</h2>
      <p className="acq-muted">{es
        ?"Elige un efecto y el remitente configurado. Registrar este permiso no envía mensajes ni activa un adaptador."
        :"Choose an effect and configured sender. Recording this grant sends nothing and does not activate an adapter."}</p>
      <label className="acq-contact-policy-field">
        <span>{es?"Acción permitida":"Allowed action"}</span>
        <select value={selectedEffect??""} disabled={pending} onChange={event=>{
          setEffect(event.target.value as Effect);setSenderUrl("")}}>
          {eligible.map(item=><option key={item} value={item}>{names[item]}</option>)}
        </select>
      </label>
      <label className="acq-contact-policy-field">
        <span>{es?"Identificador del remitente configurado":"Configured sender ID"}</span>
        <input value={provider} maxLength={200} disabled={pending}
          onChange={event=>setProvider(event.target.value.trim())}/>
      </label>
      {social&&<label className="acq-contact-policy-field">
        <span>{es?"Perfil que enviará en Chrome de Brunova":"Sending profile in Brunova Chrome"}</span>
        <input type="url" value={senderUrl} maxLength={500} disabled={pending}
          placeholder={selectedEffect==="SEND_FACEBOOK"
            ?"https://www.facebook.com/...":"https://www.instagram.com/..."}
          onChange={event=>setSenderUrl(event.target.value.trim())}/>
      </label>}
      <label className="acq-contact-policy-field">
        <span>{es?"Vigencia (días)":"Validity (days)"}</span>
        <input type="number" min={1} max={30} value={validDays} disabled={pending}
          onChange={event=>setValidDays(Number(event.target.value))}/>
      </label>
      <label className="acq-contact-policy-field">
        <span>{es?"Motivo del permiso":"Reason for grant"}</span>
        <textarea value={reason} minLength={20} maxLength={1000} disabled={pending}
          onChange={event=>setReason(event.target.value)}/>
      </label>
      {active.length>0&&<details className="acq-contact-policy-revoke">
        <summary>{es?`Permisos vigentes (${active.length})`:`Current grants (${active.length})`}</summary>
        <label className="acq-contact-policy-field">
          <span>{es?"Motivo para revocar":"Reason to revoke"}</span>
          <input value={revokeReason} minLength={10} maxLength={500} disabled={pending}
            onChange={event=>setRevokeReason(event.target.value)}/>
        </label>
        {active.map(item=><div className="acq-contact-grant-row" key={item.grantId}>
          <span>{names[item.effectKind as Effect]??item.effectKind} · {item.senderUrl??item.providerAccountId}</span>
          <button type="button" disabled={!!preview||pending||revokeReason.trim().length<10}
            onClick={()=>revoke(item.grantId)}>{es?"Revocar":"Revoke"}</button>
        </div>)}
      </details>}
      <div className="acq-actions">
        <button type="button" disabled={pending} onClick={()=>dialog.current?.close()}>
          {es?"Cancelar":"Cancel"}</button>
        <button type="button" disabled={!!preview||pending||!canPublish} onClick={publish}>
          {pending?(es?"Guardando…":"Saving…"):(es?"Registrar permiso":"Record grant")}</button>
      </div>
      {message&&<p role="alert">{message}</p>}
    </dialog>
  </section>
}
