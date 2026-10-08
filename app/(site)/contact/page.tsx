import type { Metadata } from "next"
import { ContactPageView } from "@/components/pages/contact-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Start a conversation",
  description:
    "Tell Brunova what operation is becoming difficult to run and where the friction shows up.",
  path: "/contact",
})
export default function Page() {
  return <ContactPageView locale="en" />
}
