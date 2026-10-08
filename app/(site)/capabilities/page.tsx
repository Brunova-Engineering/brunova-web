import type { Metadata } from "next"
import { CapabilitiesPageView } from "@/components/pages/capabilities-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Engineering disciplines for operational systems",
  description:
    "Five engineering disciplines Brunova combines into operational systems for complex operations.",
  path: "/capabilities",
})
export default function Page() {
  return <CapabilitiesPageView locale="en" />
}
