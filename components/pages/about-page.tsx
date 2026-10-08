import "@/app/core-routes.css"

import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { localizedContent } from "@/content/locales"
import type { Locale } from "@/lib/i18n"

export function AboutPageView({ locale }: { locale: Locale }) {
  const { aboutNarrative, companyModel, operationalLens } =
    localizedContent[locale]
  const es = locale === "es"
  return (
    <main className="route-page about-page" id="main-content" tabIndex={-1}>
      <RouteContext
        ariaLabel={es ? "Contexto de página" : "Page context"}
        items={[
          { href: es ? "/es" : "/", label: es ? "Nosotros" : "Us" },
          { label: es ? "Brunova" : "About" },
        ]}
      />
      <header className="about-thesis">
        <Container className="about-thesis__inner">
          <Heading level={1}>
            {es
              ? "Donde la operación exige ingeniería."
              : "Where operations require engineering."}
          </Heading>
          <div className="about-thesis__narrative">
            <p>
              {aboutNarrative.observation} {aboutNarrative.boundary}
            </p>
          </div>
        </Container>
      </header>

      <section aria-labelledby="company-model-title" className="company-model">
        <Container className="company-model__inner">
          <div className="company-model__statement">
            <Heading id="company-model-title" level={2}>
              {es
                ? "La arquitectura no se separa de la ejecución."
                : "Architecture remains close to execution."}
            </Heading>
            <p>
              {es
                ? "Brunova es una empresa de ingeniería de sistemas."
                : "Brunova is a systems engineering company."}
            </p>
          </div>
          <ol className="company-model__sequence">
            {companyModel.map((facet, index) => (
              <li key={facet.title}>
                <span aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <Heading level={3}>{facet.title}</Heading>
                <p>{facet.description}</p>
              </li>
            ))}
          </ol>
          <div className="company-model__lens">
            <Heading level={3}>{operationalLens.title}</Heading>
            <p>{operationalLens.description}</p>
          </div>
        </Container>
      </section>
    </main>
  )
}
