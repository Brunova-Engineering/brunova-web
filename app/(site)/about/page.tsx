import type { Metadata } from "next"
import { AboutPageView } from "@/components/pages/about-page"
import { createPageMetadata } from "@/lib/metadata"

export const metadata: Metadata = createPageMetadata({
  title: "Systems Engineering Leadership & Operating Model",
  description:
    "How Brunova’s founder-led systems engineering model keeps architecture close to real operations and critical technical decisions.",
  path: "/about",
  locale: "en",
})
export default function AboutPage() {
  return <AboutPageView locale="en" />
}
