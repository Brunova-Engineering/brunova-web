import type { Metadata } from "next"
import { AboutPageView } from "@/components/pages/about-page"
import { createPageMetadata } from "@/lib/metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Liderazgo y modelo de ingeniería de sistemas",
  description:
    "Cómo el modelo de ingeniería de sistemas liderado por el fundador de Brunova mantiene la arquitectura cerca de la operación y de las decisiones técnicas críticas.",
  path: "/about",
  locale: "es",
})
export default function AboutPage() {
  return <AboutPageView locale="es" />
}
