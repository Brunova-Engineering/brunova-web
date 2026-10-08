import Link from "next/link"

import { BrunovaLogo } from "@/components/brand/brunova-logo"

import { localizedPath, type Locale } from "@/lib/i18n"

export function NotFoundPageView({ locale }: { locale: Locale }) {
  const es = locale === "es"
  return (
    <main className="system-state">
      <BrunovaLogo location="header" />
      <p className="system-state__code">404</p>
      <h1>{es ? "Página no encontrada." : "Page not found."}</h1>
      <p>
        {es
          ? "La página solicitada de Brunova no está disponible."
          : "The requested Brunova page is not available."}
      </p>
      <Link href={localizedPath(locale, "/")}>
        {es ? "Volver a Brunova" : "Return to Brunova"}
      </Link>
    </main>
  )
}
