import type { Metadata } from "next"
import { CapabilitiesPageView } from "@/components/pages/capabilities-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Disciplinas de ingeniería para sistemas operacionales",
  description:
    "Cinco disciplinas de ingeniería que Brunova integra en sistemas operacionales para operaciones complejas.",
  path: "/capabilities",
  locale: "es",
})
export default function Page() {
  return <CapabilitiesPageView locale="es" />
}
