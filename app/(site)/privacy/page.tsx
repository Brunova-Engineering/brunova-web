import type { Metadata } from "next"
import { PrivacyPageView } from "@/components/pages/privacy-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Privacy",
  description:
    "How the Brunova website handles contact information, first-touch attribution, analytics and operational follow-up.",
  path: "/privacy",
})
export default function Page() {
  return <PrivacyPageView locale="en" />
}
