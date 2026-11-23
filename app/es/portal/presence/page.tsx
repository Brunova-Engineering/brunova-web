import { PresencePageView } from "@/components/presence/page-view"
import { readPortalSession } from "@/lib/portal-session"
import { PortalPageView } from "@/components/pages/portal-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "Presencia · Portal Brunova", robots: { index: false, follow: false } }

export default async function Page() {
  const state = await readPortalSession()
  if (!state.session?.actor.capabilities.includes("VIEW_PRESENCE")) return <PortalPageView locale="es" {...state} />
  return <PresencePageView locale="es" session={state.session} />
}
