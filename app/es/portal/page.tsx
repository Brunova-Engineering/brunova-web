import type { Metadata } from "next"
import { PortalPageView } from "@/components/pages/portal-page"
import { createPageMetadata } from "@/lib/metadata"
import { readPortalSession } from "@/lib/portal-session"
export const dynamic = "force-dynamic"
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: "Portal Brunova",
    description:
      "Un espacio seguro para los sistemas y operaciones disponibles para ti.",
    path: "/portal",
    locale: "es",
    noIndex: true,
  })
}
export default async function Page() {
  return <PortalPageView locale="es" {...await readPortalSession()} />
}
