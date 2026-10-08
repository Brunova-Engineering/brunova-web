"use client"
import { ErrorPageView } from "@/components/pages/error-page"
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <ErrorPageView locale="es" reset={reset} />
}
