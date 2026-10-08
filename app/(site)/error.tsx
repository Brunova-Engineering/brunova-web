"use client"
import { ErrorPageView } from "@/components/pages/error-page"
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorPageView locale="en" reset={reset} />
}
