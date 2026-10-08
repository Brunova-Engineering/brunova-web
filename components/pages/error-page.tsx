"use client"

import { BrunovaLogo } from "@/components/brand/brunova-logo"
import type { Locale } from "@/lib/i18n"

export function ErrorPageView({
  locale,
  reset,
}: {
  locale: Locale
  reset: () => void
}) {
  const es = locale === "es"
  return (
    <main className="system-state">
      <BrunovaLogo location="header" />
      <p className="system-state__code">
        {es ? "Página interrumpida" : "Page interrupted"}
      </p>
      <h1>
        {es
          ? "Esta página no pudo terminar de cargar."
          : "This page could not finish loading."}
      </h1>
      <p>
        {es ? "Intente cargar la página de nuevo." : "Try the page once more."}
      </p>
      <button onClick={reset} type="button">
        {es ? "Intentar de nuevo" : "Try again"}
      </button>
    </main>
  )
}
