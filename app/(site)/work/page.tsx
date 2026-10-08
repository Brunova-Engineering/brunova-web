import type { Metadata } from "next"
import { WorkPageView } from "@/components/pages/work-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Selected engineering experience",
  description:
    "A selection of systems from our founder's prior engineering work on complex operational problems.",
  path: "/work",
})
export default function Page() {
  return <WorkPageView locale="en" />
}
