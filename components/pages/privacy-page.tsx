import "@/app/core-routes.css"

import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { localizedContent } from "@/content/locales"
import type { Locale } from "@/lib/i18n"

export function PrivacyPageView({ locale }: { locale: Locale }) {
  const { privacyContent } = localizedContent[locale]
  const es = locale === "es"
  return (
    <main className="route-page privacy-page" id="main-content" tabIndex={-1}>
      <RouteContext
        ariaLabel={es ? "Contexto de página" : "Page context"}
        items={[
          { href: es ? "/es" : "/", label: "Brunova" },
          { label: es ? "Privacidad" : "Privacy" },
        ]}
      />
      <header className="privacy-intro">
        <Container className="privacy-intro__inner">
          <div>
            <p>{privacyContent.updatedLabel}</p>
            <Heading level={1}>{es ? "Privacidad" : "Privacy"}</Heading>
          </div>
          <p>{privacyContent.introduction}</p>
        </Container>
      </header>

      <Container className="privacy-document">
        <aside
          aria-label={es ? "Secciones de privacidad" : "Privacy sections"}
          className="privacy-document__index"
        >
          <p>{es ? "En esta página" : "On this page"}</p>
          <ol>
            {privacyContent.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.title}</a>
              </li>
            ))}
          </ol>
        </aside>

        <div className="privacy-document__body">
          {privacyContent.sections.map((section) => (
            <section id={section.id} key={section.id}>
              <Heading level={2}>{section.title}</Heading>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
        </div>
      </Container>
    </main>
  )
}
