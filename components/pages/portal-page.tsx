import "@/app/core-routes.css"
import Link from "next/link"
import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { localizedPath, type Locale } from "@/lib/i18n"
import type { PortalSession } from "@/lib/acquisition-api"
import { PortalLogout } from "@/components/pages/portal-logout"
export function PortalPageView({
  locale,
  session,
  unavailable = false,
}: {
  locale: Locale
  session: PortalSession | null
  unavailable?: boolean
}) {
  const es = locale === "es"
  const acquisition = session?.actor.capabilities.includes("VIEW_ACQUISITION")
  return (
    <main
      className="route-page portal-page"
      data-authenticated={session ? "true" : undefined}
      id="main-content"
      tabIndex={-1}
      lang={locale}
    >
      {!session && (
        <RouteContext
          ariaLabel={es ? "Contexto de página" : "Page context"}
          items={[
            { href: localizedPath(locale, "/"), label: "Brunova" },
            { label: "Portal" },
          ]}
        />
      )}
      <Container className="portal-threshold">
        <div className="portal-threshold__identity">
          <p>{es ? "Espacio de trabajo seguro" : "Secure workspace"}</p>
          <Heading level={1}>
            {es ? "Portal Brunova" : "Brunova Portal"}
          </Heading>
          <p>
            {es
              ? "Un espacio seguro para los sistemas y operaciones disponibles para ti."
              : "A secure workspace for the systems and operations available to you."}
          </p>
        </div>
        <div className="portal-threshold__access">
          {unavailable ? (
            <p role="alert">
              {es
                ? "No se pudo verificar el acceso. Intenta de nuevo en unos momentos."
                : "Access could not be verified. Try again shortly."}
            </p>
          ) : !session ? (
            <>
              <p>
                {es
                  ? "Inicia sesión para ver los sistemas autorizados para tu identidad."
                  : "Sign in to see the systems authorized for your identity."}
              </p>
              <a
                className="action-link action-link--primary"
                href={`/portal/login?locale=${locale}`}
              >
                {es ? "Continuar con Google" : "Continue with Google"}
              </a>
            </>
          ) : acquisition ? (
            <Link
              className="action-link action-link--primary"
              href={localizedPath(locale, "/portal/acquisition")}
            >
              {es ? "Adquisición" : "Acquisition"}
            </Link>
          ) : (
            <p>
              {es
                ? "No hay aplicaciones disponibles para tu identidad en este momento."
                : "No applications are available for your identity at this time."}
            </p>
          )}
          {session && (
            <PortalLogout locale={locale} csrfToken={session.csrfToken} />
          )}
        </div>
      </Container>
    </main>
  )
}
