import type { Metadata } from "next"
import { ProcessPageView } from "@/components/pages/process-page"
import { createPageMetadata } from "@/lib/metadata"
export const metadata: Metadata = createPageMetadata({
  title: "Systems Discovery, Architecture & Implementation",
  description:
    "Start with what is already known. Brunova enters at the stage that matches the system’s current state and determines a useful next step.",
  path: "/process",
})
export default function Page() {
  return <ProcessPageView locale="en" />
}
