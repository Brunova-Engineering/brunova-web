"use client"
import { useState } from "react"
import { acquisitionApi, AcquisitionError } from "@/lib/acquisition-api"
import { localizedPath, type Locale } from "@/lib/i18n"
export function PortalLogout({
  locale,
  csrfToken,
}: {
  locale: Locale
  csrfToken: string
}) {
  const [pending, setPending] = useState(false)
  const [failed, setFailed] = useState(false)
  return (
    <div>
      <button
        className="action-link"
        disabled={pending}
        onClick={async () => {
          setPending(true)
          setFailed(false)
          try {
            await acquisitionApi.logout(csrfToken)
            window.location.assign(localizedPath(locale, "/portal"))
          } catch (failure) {
            if (failure instanceof AcquisitionError && failure.status === 401)
              window.location.replace(localizedPath(locale, "/"))
            else {
              setFailed(true)
              setPending(false)
            }
          }
        }}
      >
        {locale === "es" ? "Cerrar sesión" : "Logout"}
      </button>
      {failed && (
        <p role="alert">
          {locale === "es"
            ? "No se pudo cerrar la sesión. Intenta de nuevo."
            : "Logout could not be completed. Try again."}
        </p>
      )}
    </div>
  )
}
