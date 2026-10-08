"use client"

import { BrunovaLogo } from "@/components/brand/brunova-logo"

export default function GlobalError({ reset }: { reset: () => void }) {
  const spanish =
    typeof window !== "undefined" &&
    (window.location.pathname === "/es" ||
      window.location.pathname.startsWith("/es/"))
  return (
    <html lang={spanish ? "es" : "en"}>
      <body>
        <main className="system-state">
          <BrunovaLogo location="header" />
          <p className="system-state__code">
            {spanish ? "Sitio interrumpido" : "Site interrupted"}
          </p>
          <h1>
            {spanish
              ? "El sitio no pudo terminar de cargar."
              : "The site could not finish loading."}
          </h1>
          <p>
            {spanish
              ? "Intente cargar Brunova de nuevo."
              : "Try loading Brunova once more."}
          </p>
          <button onClick={reset} type="button">
            {spanish ? "Recargar" : "Reload"}
          </button>
        </main>
      </body>
    </html>
  )
}
