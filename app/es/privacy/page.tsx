import type { Metadata } from "next"
import { PrivacyPageView } from "@/components/pages/privacy-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Privacidad",
  description:
    "Cómo el sitio web de Brunova maneja la información de contacto, la atribución de primer contacto, la analítica y el seguimiento operativo.",
  path: "/privacy",
  locale: "es",
})
export default function Page() {
  return <PrivacyPageView locale="es" />
}
