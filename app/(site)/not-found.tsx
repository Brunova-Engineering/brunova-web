import type { Metadata } from "next"
import { NotFoundPageView } from "@/components/pages/not-found-page"
export const metadata: Metadata = {
  title: "Page not found",
  alternates: { canonical: null },
  robots: { index: false, follow: false },
}
export default function NotFound() {
  return <NotFoundPageView locale="en" />
}
