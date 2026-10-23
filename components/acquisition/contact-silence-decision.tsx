"use client"

import { useRef, useState, type FormEvent } from "react"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

/** A silence review remains a Human decision; three sends never close a lead automatically. */
export function ContactSilenceDecision({cycleId,companyId,lastIntentId,stageVersion,
  locale,session,preview,onSaved}:{
  cycleId:string;companyId:string;lastIntentId:string;stageVersion:number;
  locale:Locale;session:PortalSession;preview:boolean;onSaved:()=>Promise<void>
}) {
  const es=locale==="es"
  const [action,setAction]=useState<"CONFIRM_CLOSE"|"KEEP_OPEN"|"">("")
  const [reason,setReason]=useState("")
  const [pending,setPending]=useState(false)
  const [notice,setNotice]=useState("")
  const command=useRef<{action:string;reason:string;id:string}|null>(null)
  const submit=async(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault()
    if(preview||pending||!action||reason.trim().length<20||
      !session.actor.capabilities.includes("MANAGE_CYCLE"))return
    const selected=command.current?.action===action&&command.current.reason===reason.trim()
      ?command.current:{action,reason:reason.trim(),id:crypto.randomUUID()}
    command.current=selected
    setPending(true);setNotice("")
    let recorded=false
    try{
      await acquisitionApi.candidateContactSilenceDecision(selected.id,{
        cycleId,companyId,lastIntentId,expectedStageVersion:stageVersion,
        action,reason:reason.trim(),
      },session.csrfToken)
      recorded=true
      await onSaved()
      setAction("");setReason("");command.current=null
      setNotice(es?"Decisión registrada; la ficha se actualizó.":"Decision recorded; the company view is updated.")
    }catch{
      setNotice(recorded
        ?es?"Decisión registrada; actualiza la ficha para ver el resultado.":
          "Decision recorded; refresh the company view to see the result."
        :es?"No se pudo registrar la decisión. Revisa la ficha actual.":
          "The decision could not be recorded. Review the current company view.")
    }finally{setPending(false)}
  }
  return <form className="acq-attention-contact-form" onSubmit={submit}>
    <label className="acq-contact-attention-choice">
      {es?"Decisión por falta de respuesta":"Decision after no reply"}
      <select value={action} disabled={pending} onChange={event=>{
        setAction(event.target.value as typeof action);command.current=null;setNotice("")}}>
        <option value="" disabled hidden>—</option>
        <option value="CONFIRM_CLOSE">{es?"Confirmar cierre":"Confirm closure"}</option>
        <option value="KEEP_OPEN">{es?"Mantener en Contacto":"Keep in Contact"}</option>
      </select>
    </label>
    {action&&<>
      <label>{es?"Motivo de la decisión":"Decision reason"}
        <textarea required minLength={20} maxLength={1000} value={reason} disabled={pending}
          onChange={event=>{setReason(event.target.value);command.current=null}}/>
      </label>
      {preview&&<p className="acq-muted" role="note">{es?"Vista de muestra: no se guarda la decisión.":
        "Sample view: the decision is not saved."}</p>}
      <button type="submit" disabled={preview||pending||reason.trim().length<20}>
        {pending?es?"Guardando…":"Saving…":es?"Confirmar decisión":"Confirm decision"}
      </button>
    </>}
    {notice&&<p role="status">{notice}</p>}
  </form>
}
