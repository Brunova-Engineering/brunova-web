import type { Metadata } from "next"
import { PortalPageView } from "@/components/pages/portal-page"
import { createPageMetadata } from "@/lib/metadata"
import { readPortalSession } from "@/lib/portal-session"
export const dynamic = "force-dynamic"
export function generateMetadata(): Metadata {
  return createPageMetadata({
    title: "Brunova Portal",
    description:
      "A secure workspace for the systems and operations available to you.",
    path: "/portal",
    noIndex: true,
  })
}
export default async function Page() {
  return <PortalPageView locale="en" {...await readPortalSession()} />
}
