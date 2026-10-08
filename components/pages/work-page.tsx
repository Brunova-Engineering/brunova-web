import "@/app/core-routes.css"

import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { localizedContent } from "@/content/locales"
import { localizedPath, type Locale } from "@/lib/i18n"

export function WorkPageView({ locale }: { locale: Locale }) {
  const { workCases, workDetails } = localizedContent[locale]
  const getWorkDetail = (slug: string) =>
    workDetails.find((detail) => detail.slug === slug)
  const es = locale === "es"

  return (
    <main className="route-page work-page" id="main-content" tabIndex={-1}>
      <RouteContext
        ariaLabel={es ? "Contexto de página" : "Page context"}
        items={[
          { href: es ? "/es" : "/", label: es ? "Nosotros" : "Us" },
          { label: es ? "Sistemas" : "Systems" },
        ]}
      />
      <header className="route-intro work-intro">
        <Container className="work-intro__inner">
          <Heading level={1}>
            {es
              ? "Experiencia de ingeniería seleccionada."
              : "Selected engineering experience."}
          </Heading>
          <div className="route-intro__lede">
            <p>
              {es
                ? "Una selección de sistemas diseñados y construidos durante la experiencia profesional previa de nuestro fundador frente a problemas operativos complejos."
                : "A selection of systems designed and built through our founder’s prior engineering work on complex operational problems."}
            </p>
          </div>
        </Container>
      </header>

      <Container className="work-folio">
        <ol
          aria-label={es ? "Sistemas seleccionados" : "Selected systems"}
          className="work-ledger"
        >
          {workCases.map((work, index) => (
            <li key={work.slug}>
              <article className="work-record">
                <AnalyticsLink
                  className="work-record__link"
                  eventName="case_study_opened"
                  eventProperties={{ case_slug: work.slug }}
                  href={localizedPath(locale, `/work/${work.slug}`)}
                  variant="text"
                >
                  <span className="work-record__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="work-record__identity">
                    <span className="work-record__class">
                      {work.systemsClass}
                    </span>
                    <Heading level={2}>{work.systemsTitle}</Heading>
                    <span className="work-record__signal">
                      {work.systemsSummary}
                    </span>
                  </span>

                  <span
                    aria-label={`${es ? "Capacidades aplicadas en" : "Capabilities in"} ${work.systemsClass}`}
                    className="work-record__capabilities"
                    role="list"
                  >
                    {getWorkDetail(work.slug)?.capabilities.map(
                      (capability) => (
                        <span key={capability.label} role="listitem">
                          {capability.label}
                        </span>
                      ),
                    )}
                  </span>

                  <span aria-hidden="true" className="work-record__arrow">
                    →
                  </span>
                </AnalyticsLink>
              </article>
            </li>
          ))}
        </ol>
      </Container>
    </main>
  )
}
