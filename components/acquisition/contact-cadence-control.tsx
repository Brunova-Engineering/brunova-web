"use client"

import { useEffect, useRef, useState } from "react"
import { acquisitionApi, type PortalSession } from "@/lib/acquisition-api"
import type { Locale } from "@/lib/i18n"

type Policy = Awaited<ReturnType<typeof acquisitionApi.candidateContactCadencePolicy>>
const mexicoDate = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value
  return `${value("year")}-${value("month")}-${value("day")}`
}
const shiftYear = (day: string, years: number) => {
  const date = new Date(day.slice(0, 10) + "T12:00:00Z")
  date.setUTCFullYear(date.getUTCFullYear() + years)
  return date.toISOString().slice(0, 10)
}

/** One small management control; timing changes never dispatch a message. */
export function ContactCadenceControl({cycleId, locale, session,preview=false}:{
  cycleId:string;locale:Locale;session?:PortalSession;preview?:boolean
}) {
  const es=locale==="es"
  const dialog=useRef<HTMLDialogElement>(null)
  const [policy,setPolicy]=useState<Policy|null>(preview?{
    cycleId,version:"c7-cadence-v1",coverageStart:null,coverageEnd:null,closedDates:[],
    secondAfterFirstBusinessDays:3,thirdAfterSecondBusinessDays:5,
    closeAfterThirdBusinessDays:7,policyReason:null,recordedAt:null,
  }:null)
  const [days,setDays]=useState<[number,number,number]>([3,5,7])
  const [reason,setReason]=useState("")
  const [pending,setPending]=useState(false)
  const [message,setMessage]=useState("")
  useEffect(()=>{
    if(!session?.actor.capabilities.includes("MANAGE_CYCLE")||preview)return
    let live=true
    acquisitionApi.candidateContactCadencePolicy(cycleId).then(value=>{
      if(!live)return
      setPolicy(value)
      setDays([value.secondAfterFirstBusinessDays,
        value.thirdAfterSecondBusinessDays,value.closeAfterThirdBusinessDays])
    }).catch(()=>{if(live)setMessage(es?"No se pudo leer la cadencia.":"Cadence could not be read.")})
    return ()=>{live=false}
  },[cycleId,session,es,preview])
  if(!session?.actor.capabilities.includes("MANAGE_CYCLE"))return null
  const publish=async()=>{
    if(!policy||pending||preview)return
    setPending(true);setMessage("")
    try{
      const today=mexicoDate()
      const commandId="candidate-cadence-"+crypto.randomUUID()
      await acquisitionApi.publishCandidateContactCadence(commandId,{
        cycleId,version:"c7-cadence-"+Date.now(),
        coverageStart:policy.coverageStart?.slice(0,10)??shiftYear(today,-1),
        coverageEnd:policy.coverageEnd?.slice(0,10)??shiftYear(today,2),
        closedDates:policy.closedDates.map(day=>day.slice(0,10)),
        secondAfterFirstBusinessDays:days[0],
        thirdAfterSecondBusinessDays:days[1],
        closeAfterThirdBusinessDays:days[2],policyReason:reason.trim(),
      },session.csrfToken)
      const updated=await acquisitionApi.candidateContactCadencePolicy(cycleId)
      setPolicy(updated);setReason("")
      setMessage(es?"Cadencia publicada":"Cadence published")
      dialog.current?.close()
    }catch{
      setMessage(es?"No se publicaron los cambios. Revisa los datos y vuelve a intentar.":"Changes were not published. Review the values and try again.")
    }finally{setPending(false)}
  }
  return <>
    <div className="acq-contact-cadence-action">
      <button type="button" disabled={!policy} onClick={()=>dialog.current?.showModal()}>
        {es?"Cadencia":"Cadence"}
      </button>
      {message&&<span role="status">{message}</span>}
    </div>
    <dialog ref={dialog} className="acq-dialog acq-contact-cadence-dialog"
      aria-labelledby="acq-contact-cadence-title"
      onCancel={event=>{if(pending)event.preventDefault()}}>
      <h2 id="acq-contact-cadence-title">{es?"Cadencia de seguimiento":"Follow-up cadence"}</h2>
      <p className="acq-muted">{es
        ?"Estos son días hábiles mínimos para revisar otro intento. Publicar no envía mensajes."
        :"These are minimum business days before another attempt is reviewed. Publishing sends no messages."}</p>
      {preview&&<p className="acq-muted" role="note">{es?"Vista de muestra: no se publica.":
        "Sample view: nothing is published."}</p>}
      <div className="acq-contact-cadence-fields">
        {([0,1,2] as const).map((index)=><label key={index}>
          <span>{(es?["Segundo intento","Tercer intento","Revisar cierre"]:
            ["Second attempt","Third attempt","Review closure"])[index]}</span>
          <input type="number" min={1} max={30} required value={days[index]}
            onChange={event=>setDays(previous=>{
              const next=[...previous] as [number,number,number]
              next[index]=Number(event.target.value)
              return next
            })}/>
          <small>{es?"días hábiles":"business days"}</small>
        </label>)}
      </div>
      <label className="acq-contact-cadence-reason">
        <span>{es?"Motivo del cambio":"Reason for change"}</span>
        <textarea minLength={20} maxLength={1000} required value={reason}
          onChange={event=>setReason(event.target.value)}
          placeholder={es?"Explica por qué cambia la cadencia de este ciclo.":"Explain why this cycle's cadence changes."}/>
      </label>
      <div className="acq-actions">
        <button type="button" disabled={pending} onClick={()=>dialog.current?.close()}>
          {es?"Cancelar":"Cancel"}
        </button>
        <button type="button" disabled={preview||pending||reason.trim().length<20||
          days.some(value=>!Number.isInteger(value)||value<1||value>30)}
          onClick={publish}>{pending?(es?"Publicando…":"Publishing…"):(es?"Publicar":"Publish")}</button>
      </div>
      {message&&<p role="alert">{message}</p>}
    </dialog>
  </>
}
