import { redirect } from "next/navigation"
import Link from "next/link"
import { AcquisitionPortal } from "@/components/acquisition/portal"
import { readPortalSession } from "@/lib/portal-session"
import { localizedPath, type Locale } from "@/lib/i18n"
import "@/app/acquisition.css"
export async function AcquisitionPageView({ locale }: { locale: Locale }) {
  const { session, unavailable } = await readPortalSession()
  const es = locale === "es"
  if (!session && !unavailable) redirect(localizedPath(locale, "/"))
  if (!session)
    return (
      <main id="main-content" className="acq" lang={locale}>
        <h1>{es ? "Portal de Adquisición" : "Acquisition Portal"}</h1>
        <p role="alert">
          {es
            ? "No se pudo verificar la sesión. Intenta cargar esta página de nuevo."
            : "Your session could not be verified. Try loading this page again."}
        </p>
      </main>
    )
  if (!session.actor.capabilities.includes("VIEW_ACQUISITION"))
    return (
      <main id="main-content" className="acq" lang={locale}>
        <h1>{es ? "Acceso restringido" : "Access restricted"}</h1>
        <p>
          {es
            ? "Tu identidad no tiene acceso a Adquisición."
            : "Your identity does not have Acquisition access."}
        </p>
        <Link href={localizedPath(locale, "/portal")}>
          {es ? "Volver al Portal" : "Return to Portal"}
        </Link>
      </main>
    )
  return <AcquisitionPortal session={session} locale={locale} />
}
