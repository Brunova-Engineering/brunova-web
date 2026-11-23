import { PresencePageView } from "@/components/presence/page-view"
import { readPortalSession } from "@/lib/portal-session"
import { PortalPageView } from "@/components/pages/portal-page"

export const dynamic = "force-dynamic"
export const metadata = { title: "Presence · Brunova Portal", robots: { index: false, follow: false } }

export default async function Page() {
  const state = await readPortalSession()
  if (!state.session?.actor.capabilities.includes("VIEW_PRESENCE")) return <PortalPageView locale="en" {...state} />
  return <PresencePageView locale="en" session={state.session} />
}
