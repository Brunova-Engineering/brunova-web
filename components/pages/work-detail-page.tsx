import { notFound } from "next/navigation"

import "@/app/core-routes.css"

import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld"
import { DossierIndex } from "@/components/work/dossier-index"
import { SystemFlow } from "@/components/work/system-flow"
import { localizedContent } from "@/content/locales"
import type { WorkDetail } from "@/content/types"
import { localizedPath, type Locale } from "@/lib/i18n"

export function WorkDetailPageView({
  locale,
  slug,
}: {
  locale: Locale
  slug: string
}) {
  const { workCases, workDetails } = localizedContent[locale]
  const work = workCases.find((candidate) => candidate.slug === slug)
  const detail = workDetails.find((candidate) => candidate.slug === slug) as
    WorkDetail | undefined
  const es = locale === "es"

  if (!work || !detail) notFound()

  const relatedWork = workCases
    .filter((candidate) => candidate.slug !== work.slug)
    .filter((candidate) =>
      workDetails
        .find((item) => item.slug === candidate.slug)
        ?.capabilities.some((candidateCapability) =>
          detail.capabilities.some(
            (capability) =>
              capability.capabilitySlug === candidateCapability.capabilitySlug,
          ),
        ),
    )
    .slice(0, 2)
  const dossierSections = [
    {
      id: "overview",
      label: es ? "Resumen" : "Overview",
    },
    {
      id: "technical-detail",
      label: es ? "Detalle técnico" : "Technical detail",
      disclosure: true,
    },
    ...(relatedWork.length > 0
      ? [
          {
            id: "related-systems",
            label: es ? "Sistemas relacionados" : "Related systems",
          },
        ]
      : []),
  ] as const

  return (
    <>
      <BreadcrumbJsonLd
        locale={locale}
        name={work.systemsClass}
        path={`/work/${work.slug}`}
      />
      <main className="route-page case-page" id="main-content" tabIndex={-1}>
        <RouteContext
          ariaLabel={es ? "Contexto del sistema" : "Dossier context"}
          items={[
            {
              href: localizedPath(locale, "/work"),
              label: es ? "Sistemas" : "Systems",
            },
            { label: work.systemsClass },
          ]}
        />
        <header className="case-intro">
          <Container className="case-intro__inner">
            <div className="case-intro__identity">
              <p>{work.systemsClass}</p>
              <Heading level={1}>{work.systemsTitle}</Heading>
            </div>
            <p className="case-intro__summary">{work.systemsSummary}</p>
          </Container>
        </header>

        <Container className="case-dossier">
          <DossierIndex
            backHref={localizedPath(locale, "/work")}
            backLabel={es ? "← Volver a Sistemas" : "← Back to Systems"}
            engineering={detail.capabilities.map(
              (capability) => capability.label,
            )}
            engineeringLabel={es ? "Ingeniería" : "Engineering"}
            focus={work.focus}
            focusLabel={es ? "Enfoque" : "Focus"}
            label={es ? "En este sistema" : "On this system"}
            navigationLabel={es ? "En este sistema" : "On this system"}
            sections={dossierSections}
            systemType={work.systemType}
            systemTypeLabel={es ? "Tipo de sistema" : "System type"}
            title={work.homepageTitle}
          />

          <div className="case-dossier__body">
            <section
              className="case-evidence"
              id="overview"
              aria-label={
                es ? "Descripción general del sistema" : "System overview"
              }
            >
              <div className="case-evidence__territory case-evidence__context">
                <Heading level={2}>
                  {es ? "Qué estaba ocurriendo" : "What was happening"}
                </Heading>
                <p>{detail.context}</p>
                <div className="case-evidence__pressure">
                  <Heading level={3}>
                    {es ? "El problema operativo" : "The operational problem"}
                  </Heading>
                  <p>{detail.operationalProblem}</p>
                </div>
                {detail.scalingConstraint ? (
                  <p className="case-evidence__constraint">
                    {detail.scalingConstraint}
                  </p>
                ) : null}
              </div>

              <div className="case-evidence__territory case-evidence__system">
                <Heading level={2}>
                  {es ? "Enfoque del sistema" : "System approach"}
                </Heading>
                <p>{detail.systemApproach}</p>
                <div className="case-evidence__boundary">
                  <Heading level={3}>
                    {es
                      ? "Qué controla el sistema"
                      : "What the system controls"}
                  </Heading>
                  <p>{detail.systemBoundary.summary}</p>
                </div>
              </div>

              <div className="case-evidence__territory case-evidence__capability">
                <Heading level={2}>
                  {es ? "Qué cambió" : "What changed"}
                </Heading>
                <p>{detail.outcome}</p>
              </div>
            </section>

            <details className="case-technical" id="technical-detail">
              <summary className="case-technical__summary">
                <span>
                  <strong>{es ? "Detalle técnico" : "Technical detail"}</strong>
                  <span>
                    {es
                      ? "Cómo funciona el sistema, sus decisiones y salvaguardas"
                      : "How the system works, its decisions and safeguards"}
                  </span>
                </span>
                <span aria-hidden="true" className="disclosure-mark" />
              </summary>

              <div className="case-technical__reveal">
                <div className="case-technical__body">
                  <section className="case-boundary case-boundary--technical">
                    <Heading level={2}>
                      {es ? "Arquitectura del sistema" : "System architecture"}
                    </Heading>
                    <SystemFlow
                      description={detail.systemBoundary.summary}
                      id={`flow-${work.slug}`}
                      steps={detail.systemBoundary.steps}
                    />
                  </section>

                  <section className="case-decisions">
                    <div>
                      <Heading level={2}>
                        {es
                          ? "Decisiones clave de ingeniería"
                          : "Key engineering decisions"}
                      </Heading>
                      <ul>
                        {detail.engineeringDecisions.map((decision) => (
                          <li key={decision}>{decision}</li>
                        ))}
                      </ul>
                    </div>
                    {detail.safeguards ? (
                      <div>
                        <Heading level={2}>
                          {es
                            ? "Confiabilidad y salvaguardas"
                            : "Reliability and safeguards"}
                        </Heading>
                        <ul>
                          {detail.safeguards.map((safeguard) => (
                            <li key={safeguard}>{safeguard}</li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </section>

                  <section className="case-outcome__capabilities">
                    <Heading level={2}>
                      {es
                        ? "Capacidades involucradas"
                        : "Capabilities involved"}
                    </Heading>
                    <ul>
                      {detail.capabilities.map((capability) => (
                        <li key={capability.label}>
                          <a
                            href={`${localizedPath(locale, "/capabilities")}#${capability.capabilitySlug}`}
                          >
                            {capability.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </section>
                </div>
              </div>
            </details>

            {relatedWork.length > 0 ? (
              <section className="case-related" id="related-systems">
                <Heading level={2}>
                  {es ? "Explore otros sistemas" : "Explore other systems"}
                </Heading>
                <ul>
                  {relatedWork.map((related) => (
                    <li key={related.slug}>
                      <AnalyticsLink
                        className="case-related__link"
                        eventName="case_study_opened"
                        eventProperties={{ case_slug: related.slug }}
                        href={localizedPath(locale, `/work/${related.slug}`)}
                        variant="text"
                      >
                        <span>
                          {String(
                            workCases.findIndex(
                              (candidate) => candidate.slug === related.slug,
                            ) + 1,
                          ).padStart(2, "0")}
                        </span>
                        <strong>{related.systemsClass}</strong>
                        <span aria-hidden="true">→</span>
                      </AnalyticsLink>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </Container>

        <section aria-labelledby="case-next" className="route-cta">
          <Container className="route-cta__inner">
            <div>
              <Heading id="case-next" level={2}>
                {es
                  ? "¿Su operación enfrenta un reto similar?"
                  : "Facing a similar operational problem?"}
              </Heading>
              <p>
                {es
                  ? "Cuéntenos qué resulta difícil de operar, controlar o modificar."
                  : "Tell us what is difficult to operate, control or change."}
              </p>
            </div>
            <AnalyticsLink
              eventName="cta_start_conversation"
              href={localizedPath(locale, "/contact")}
              variant="primary"
            >
              {es ? "Hablemos" : "Start a conversation"}
            </AnalyticsLink>
          </Container>
        </section>
      </main>
    </>
  )
}
