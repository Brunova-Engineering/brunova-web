import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { CapabilityFieldPreview } from "@/components/home/capability-field-preview"
import { HomeVisual } from "@/components/home/home-visual"
import { Container } from "@/components/layout/container"
import { Heading } from "@/components/layout/section-heading"
import { Section } from "@/components/layout/section"
import { ActionLink } from "@/components/ui/action-link"
import { localizedContent } from "@/content/locales"
import { localizedPath, type Locale } from "@/lib/i18n"

import "@/app/homepage.css"

export function HomePageView({ locale }: { locale: Locale }) {
  const {
    capabilities,
    differentiators,
    homepage,
    homepageSymptoms,
    processStages,
    workCases,
  } = localizedContent[locale]
  const es = locale === "es"
  const recognitionSymptoms = [
    homepageSymptoms[0],
    homepageSymptoms[2],
    homepageSymptoms[4],
  ]
  const selectedWork = workCases.slice(0, 3)
  const processOutputs = es
    ? [
        "Evidencia y límites",
        "Diseño listo para implementar",
        "Capacidad en producción",
        "Mejora continua",
      ]
    : [
        "Evidence and boundary",
        "Build-ready design",
        "Production capability",
        "Continuing improvement",
      ]
  const processInputs = es
    ? [
        "Situación por diagnosticar",
        "Problema definido",
        "Diseño aprobado",
        "Sistema activo",
      ]
    : ["Unclear problem", "Known boundary", "Ready design", "Live system"]
  return (
    <main id="main-content" tabIndex={-1}>
      <Section aria-labelledby="homepage-title" className="home-hero">
        <Container className="home-hero__inner">
          <div className="home-hero__copy">
            <Heading className="home-hero__title" id="homepage-title" level={1}>
              {homepage.hero.title}
            </Heading>
            <p className="home-hero__description">
              {homepage.hero.description}
            </p>
            <div className="home-hero__actions">
              <AnalyticsLink
                eventName="cta_start_conversation"
                href={localizedPath(locale, "/contact")}
                variant="primary"
              >
                {homepage.hero.primaryAction}
              </AnalyticsLink>
              <AnalyticsLink
                eventName="cta_explore_work"
                href={localizedPath(locale, "/work")}
                variant="secondary"
              >
                {homepage.hero.secondaryAction}
              </AnalyticsLink>
            </div>
          </div>
          <HomeVisual kind="hero" locale={locale} priority />
        </Container>
      </Section>

      <section
        aria-label={es ? "Posicionamiento" : "Positioning"}
        className="home-category"
      >
        <Container>
          <p>{homepage.category}</p>
        </Container>
      </section>

      <Section aria-labelledby="problem-title" className="home-problem">
        <Container className="home-problem__inner">
          <div className="home-section-intro home-problem__intro">
            <Heading id="problem-title" level={2}>
              {homepage.problem.title}
            </Heading>
            <p>{homepage.problem.description}</p>
          </div>
          <div
            className="problem-shift"
            role="group"
            aria-label={
              es
                ? "De fragmentación a control operativo"
                : "From fragmentation to operational control"
            }
          >
            <ol className="problem-shift__signals">
              {recognitionSymptoms.map((symptom) => (
                <li key={symptom.name}>
                  <strong>{symptom.name}</strong>
                  <span>{symptom.consequence}</span>
                </li>
              ))}
            </ol>
            <p className="problem-shift__transition">
              {homepage.problem.transition}
            </p>
            <AnalyticsLink
              className="problem-shift__case-link"
              eventName="case_study_opened"
              eventProperties={{
                case_slug: "fragile-automation-modernization",
              }}
              href={localizedPath(
                locale,
                "/work/fragile-automation-modernization",
              )}
              variant="text"
            >
              {es
                ? "Ver modernización de automatizaciones"
                : "See fragile automation modernization"}
            </AnalyticsLink>
          </div>
        </Container>
      </Section>

      <Section
        aria-labelledby="operational-intelligence-title"
        className="operational-intelligence"
      >
        <Container className="operational-intelligence__inner">
          <div className="operational-intelligence__statement">
            <Heading id="operational-intelligence-title" level={2}>
              {homepage.operationalIntelligence.title}
            </Heading>
            <p>{homepage.operationalIntelligence.description}</p>
          </div>
          <HomeVisual kind="operational-intelligence" locale={locale} />
        </Container>
      </Section>

      <Section
        aria-labelledby="capabilities-title"
        className="home-capabilities"
      >
        <Container>
          <div className="home-section-intro home-capabilities__intro">
            <Heading id="capabilities-title" level={2}>
              {es ? "Lo que construye Brunova" : "What Brunova builds"}
            </Heading>
            <p>
              {es
                ? "Cinco disciplinas de ingeniería que Brunova integra en un sistema operacional."
                : "Five engineering disciplines Brunova integrates into one operational system."}
            </p>
          </div>
          <CapabilityFieldPreview
            capabilities={capabilities}
            coreLabel={es ? "Un sistema operacional" : "One operational system"}
          />
          <ActionLink
            className="home-capabilities__action"
            href={localizedPath(locale, "/capabilities")}
            variant="text"
          >
            {es ? "Explorar capacidades" : "Explore capabilities"}
          </ActionLink>
        </Container>
      </Section>

      <Section
        aria-labelledby="architecture-title"
        className="architecture-hinge"
      >
        <Container className="architecture-hinge__inner">
          <Heading id="architecture-title" level={2}>
            <span>{homepage.architecture.question}</span>{" "}
            <span>{homepage.architecture.answer}</span>
          </Heading>
          <HomeVisual kind="architecture-boundary" locale={locale} />
        </Container>
      </Section>

      <Section aria-labelledby="selected-work-title" className="selected-work">
        <Container>
          <div className="home-section-intro selected-work__intro">
            <Heading id="selected-work-title" level={2}>
              {homepage.workTitle}
            </Heading>
            <p>
              {es
                ? "Problemas operativos distintos, resueltos con la misma disciplina de ingeniería de sistemas."
                : "Different operational problems. The same systems engineering discipline."}
            </p>
          </div>
          <ol className="selected-proof">
            {selectedWork.map((work, index) => (
              <li key={work.slug}>
                <AnalyticsLink
                  className="selected-proof__record"
                  eventName="case_study_opened"
                  eventProperties={{ case_slug: work.slug }}
                  href={localizedPath(locale, `/work/${work.slug}`)}
                  variant="utility"
                >
                  <article>
                    <div className="selected-proof__record-head">
                      <span
                        aria-hidden="true"
                        className="selected-proof__index"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="selected-proof__type">
                        {work.homepageTitle}
                      </p>
                    </div>
                    <div className="selected-proof__record-body">
                      <Heading level={3}>{work.title}</Heading>
                      <div className="selected-proof__reveal">
                        <div className="selected-proof__reveal-inner">
                          <p>{work.summary}</p>
                          <span className="selected-proof__record-action">
                            {es ? "Ver sistema" : "View system"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </article>
                </AnalyticsLink>
              </li>
            ))}
          </ol>
          <ActionLink
            className="selected-work__action"
            href={localizedPath(locale, "/work")}
            variant="text"
          >
            {es
              ? "Explorar sistemas diseñados y construidos"
              : "Explore engineered systems"}
          </ActionLink>
        </Container>
      </Section>

      <Section aria-labelledby="process-title" className="home-process">
        <Container className="home-process__inner">
          <div className="home-process__context">
            <div className="home-section-intro">
              <Heading id="process-title" level={2}>
                {homepage.process.title}
              </Heading>
              <p>
                {es
                  ? "Un enfoque que parte del estado real del sistema, no de una secuencia rígida."
                  : "An operating approach designed around the state of the system—not a fixed funnel."}
              </p>
            </div>
            <aside className="home-process__entry">
              <strong>{homepage.process.entryTitle}</strong>
            </aside>
          </div>
          <div className="home-process__model">
            <ol
              className="process-sequence"
              aria-label={homepage.process.title}
            >
              {processStages.map((stage, index) => (
                <li key={stage.index}>
                  <span className="process-sequence__input">
                    {processInputs[index]}
                  </span>
                  <strong>{stage.verb}</strong>
                  <span aria-hidden="true" className="process-sequence__arrow">
                    →
                  </span>
                  <p>{processOutputs[index]}</p>
                </li>
              ))}
            </ol>
            <div
              aria-labelledby="operating-principles-title"
              className="home-process__principles"
              role="group"
            >
              <p
                className="home-process__principles-title"
                id="operating-principles-title"
              >
                {homepage.differentiatorsTitle}
              </p>
              <ol className="principles">
                {differentiators.map((principle) => (
                  <li key={principle.title}>
                    <Heading level={3}>{principle.title}</Heading>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  )
}
