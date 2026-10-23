"use client"

import { useEffect, useRef, useState } from "react"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type Readback = Awaited<ReturnType<typeof acquisitionApi.candidateContactChannelPolicy>>
const channelOrder = ["EMAIL", "WHATSAPP", "FACEBOOK", "INSTAGRAM", "LINKEDIN"] as const
const labels: Record<(typeof channelOrder)[number], string> = {
  EMAIL: "Correo", WHATSAPP: "WhatsApp", FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram", LINKEDIN: "LinkedIn",
}

export function ContactChannelPolicyControl({cycleId, locale, session}:{
  cycleId:string;locale:Locale;session:PortalSession
}) {
  const es=locale==="es"
  const dialog=useRef<HTMLDialogElement>(null)
  const [readback,setReadback]=useState<Readback|null>(null)
  const [selected,setSelected]=useState<string[]>([])
  const [reason,setReason]=useState("")
  const [revokeReason,setRevokeReason]=useState("")
  const [validDays,setValidDays]=useState(30)
  const [pending,setPending]=useState(false)
  const [message,setMessage]=useState("")
  const canManage=session.actor.capabilities.includes("MANAGE_CYCLE")
  const load=async()=>{
    const value=await acquisitionApi.candidateContactChannelPolicy(cycleId)
    setReadback(value)
    setSelected(value.revisions.find(revision=>revision.current)?.allowedChannels??
      value.baseline?.allowedChannels??[])
  }
  useEffect(()=>{
    if(!canManage)return
    let live=true
    acquisitionApi.candidateContactChannelPolicy(cycleId).then(value=>{
      if(!live)return
      setReadback(value)
      setSelected(value.revisions.find(revision=>revision.current)?.allowedChannels??
        value.baseline?.allowedChannels??[])
    }).catch(()=>{if(live)setMessage(es?"No se pudo leer la política.":"Policy could not be read.")})
    return ()=>{live=false}
  },[cycleId,canManage,es])
  if(!canManage)return null
  const current=readback?.revisions.find(revision=>revision.current)
  const displayed=current?.allowedChannels??readback?.baseline?.allowedChannels??[]
  const toggle=(channel:string)=>setSelected(previous=>previous.includes(channel)
    ?previous.filter(item=>item!==channel):channelOrder.filter(item=>previous.includes(item)||item===channel))
  const publish=async()=>{
    if(!readback?.baseline?.current||pending||selected.length===0||reason.trim().length<20||
      !Number.isInteger(validDays)||validDays<1||validDays>90)return
    setPending(true);setMessage("")
    try{
      await acquisitionApi.publishCandidateContactChannelPolicy(
        "contact-channels-"+crypto.randomUUID(),{
          cycleId,expectedMandateId:readback.baseline.mandateId,
          expectedPolicyHash:readback.baseline.policyHash,
          allowedChannels:channelOrder.filter(channel=>selected.includes(channel)),
          reason:reason.trim(),expiresAt:new Date(Date.now()+validDays*86_400_000).toISOString(),
        },session.csrfToken)
      setReason("")
      setMessage(es?"Canales publicados para la siguiente sesión.":
        "Channels published for the next session.")
      dialog.current?.close()
      try{await load()}catch{
        setMessage(es?"Canales publicados. Actualiza la vista para consultar la versión vigente.":
          "Channels published. Refresh to read the current version.")
      }
    }catch{
      setMessage(es?"No se publicaron los canales. Revisa el ciclo y la sesión activa.":
        "Channels were not published. Review the cycle and active session.")
    }finally{setPending(false)}
  }
  const revoke=async()=>{
    if(!current||pending||revokeReason.trim().length<10)return
    setPending(true);setMessage("")
    try{
      await acquisitionApi.revokeCandidateContactChannelPolicy(current.revisionId,
        revokeReason.trim(),session.csrfToken)
      setRevokeReason("")
      setMessage(es?"Revisión revocada. Rige el mandato base.":
        "Revision revoked. The baseline mandate applies.")
      dialog.current?.close()
      try{await load()}catch{
        setMessage(es?"Revisión revocada. Actualiza la vista para consultar el mandato base.":
          "Revision revoked. Refresh to read the baseline mandate.")
      }
    }catch{
      setMessage(es?"No se pudo revocar. Vuelve a comprobar el estado.":
        "Revocation failed. Check the current state again.")
    }finally{setPending(false)}
  }
  return <section className="acq-contact-policy" aria-label={es?"Política de canales":"Channel policy"}>
    <div>
      <span className="acq-eyebrow">{es?"CONTACTO · POLÍTICA":"OUTREACH · POLICY"}</span>
      <h3>{es?"Canales permitidos":"Allowed channels"}</h3>
      <p>{readback
        ?displayed.map(channel=>labels[channel as keyof typeof labels]??channel).join(" · ")
        :(es?"Consultando…":"Loading…")}</p>
    </div>
    <button type="button" disabled={!readback?.baseline?.current} onClick={()=>dialog.current?.showModal()}>
      {es?"Revisar canales":"Review channels"}
    </button>
    {message&&<span role="status">{message}</span>}
    <dialog ref={dialog} className="acq-dialog acq-contact-policy-dialog"
      aria-labelledby="acq-contact-policy-title" onCancel={event=>{if(pending)event.preventDefault()}}>
      <h2 id="acq-contact-policy-title">{es?"Política de canales":"Channel policy"}</h2>
      <p className="acq-muted">{es
        ?"Publicar cambia los canales elegibles en la siguiente sesión. Cada envío sigue necesitando un permiso exacto; publicar no envía mensajes."
        :"Publishing changes eligible channels in the next session. Every send still needs an exact grant; publishing sends nothing."}</p>
      <div className="acq-contact-policy-options">
        {channelOrder.map(channel=><label key={channel}>
          <input type="checkbox" checked={selected.includes(channel)} disabled={pending}
            onChange={()=>toggle(channel)}/>
          <span>{labels[channel]}</span>
        </label>)}
      </div>
      <label className="acq-contact-policy-field">
        <span>{es?"Vigencia (días)":"Validity (days)"}</span>
        <input type="number" min={1} max={90} value={validDays} disabled={pending}
          onChange={event=>setValidDays(Number(event.target.value))}/>
      </label>
      <label className="acq-contact-policy-field">
        <span>{es?"Motivo de la revisión":"Reason for revision"}</span>
        <textarea value={reason} minLength={20} maxLength={1000} disabled={pending}
          onChange={event=>setReason(event.target.value)}/>
      </label>
      {current&&<div className="acq-contact-policy-revoke">
        <label className="acq-contact-policy-field">
          <span>{es?"Motivo para revocar la revisión vigente":"Reason to revoke current revision"}</span>
          <input value={revokeReason} minLength={10} maxLength={500} disabled={pending}
            onChange={event=>setRevokeReason(event.target.value)}/>
        </label>
        <button type="button" disabled={pending||revokeReason.trim().length<10} onClick={revoke}>
          {es?"Revocar revisión":"Revoke revision"}
        </button>
      </div>}
      <div className="acq-actions">
        <button type="button" disabled={pending} onClick={()=>dialog.current?.close()}>
          {es?"Cancelar":"Cancel"}</button>
        <button type="button" disabled={pending||selected.length===0||reason.trim().length<20||
          !Number.isInteger(validDays)||validDays<1||validDays>90} onClick={publish}>
          {pending?(es?"Guardando…":"Saving…"):(es?"Publicar":"Publish")}</button>
      </div>
      {message&&<p role="alert">{message}</p>}
    </dialog>
  </section>
}
