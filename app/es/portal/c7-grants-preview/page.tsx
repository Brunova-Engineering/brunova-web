import {notFound} from "next/navigation"
import {ContactEffectGrantControl} from "@/components/acquisition/contact-effect-grant-control"
import type {PortalSession} from "@/lib/acquisition-api"
import "@/app/acquisition.css"

export const dynamic="force-dynamic"
export const metadata={title:"Vista local · Permisos de contacto",robots:{index:false,follow:false}}

const session:PortalSession={authenticated:true,
  actor:{email:"vista-local@brunova.mx",capabilities:["MANAGE_CYCLE"]},
  csrfToken:"preview-only",expiresAt:"2099-01-01T00:00:00Z"}
const policy={cycleId:"ciclo-local",baseline:{mandateId:"mandate-local",
  policyHash:"preview",allowedChannels:["EMAIL","WHATSAPP","FACEBOOK","INSTAGRAM"],
  current:true},revisions:[]}
const grants={cycleId:"ciclo-local",grants:[{grantId:"preview-email",effectKind:"SEND_EMAIL",
  providerAccountId:"brunova-mail",policyHash:"preview",approvalReference:"vista-local",
  senderUrl:null,
  approvedBy:"Jorge",effectiveAt:"2026-10-23T00:00:00Z",
  expiresAt:"2026-11-01T00:00:00Z",recordedAt:"2026-10-23T00:00:00Z",
  revokedAt:null,current:true}]}

export default function Page(){
  if(process.env.LOCAL_C6_PREVIEW_ENABLED!=="true")notFound()
  return <main style={{maxWidth:1120,margin:"64px auto",padding:"0 24px"}}>
    <p className="acq-eyebrow">PORTAL / ADQUISICIÓN / ESTADO DEL SISTEMA</p>
    <h1>Centro de control</h1>
    <p className="acq-muted">Vista local de presentación. No consulta ni modifica el Engine.</p>
    <ContactEffectGrantControl cycleId="ciclo-local" locale="es" session={session}
      preview={{grants,policy}}/>
  </main>
}
