import type { Metadata } from "next"
import { WorkPageView } from "@/components/pages/work-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Sistemas seleccionados diseñados y construidos por Brunova",
  description:
    "Una selección de sistemas creados por Brunova para resolver problemas operativos complejos.",
  path: "/work",
  locale: "es",
})
export default function Page() {
  return <WorkPageView locale="es" />
}
