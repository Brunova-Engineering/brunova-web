"use client"

import "@/app/core-routes.css"

import { useCallback } from "react"

import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { ActionLink } from "@/components/ui/action-link"
import { localizedContent } from "@/content/locales"
import { useExclusiveDisclosure } from "@/hooks/use-exclusive-disclosure"
import { localizedPath, type Locale } from "@/lib/i18n"

const capabilityHashes = {
  "01": "systems-architecture",
  "02": "data-integration",
  "03": "financial-automation",
  "04": "process-engineering",
  "05": "automation-modernization",
} as const

export function CapabilitiesPageView({ locale }: { locale: Locale }) {
  const { capabilities, workCases } = localizedContent[locale]
  const getWorkCase = (slug: string) =>
    workCases.find((work) => work.slug === slug)
  const es = locale === "es"
  const resolveHash = useCallback(
    (hash: string) => {
      const value = decodeURIComponent(hash.replace(/^#/, ""))
      return (
        capabilities.find(
          (capability) =>
            capability.slug === value ||
            capabilityHashes[capability.index] === value,
        )?.slug ?? null
      )
    },
    [capabilities],
  )

  const canonicalHash = useCallback(
    (slug: string) => {
      const capability = capabilities.find((item) => item.slug === slug)
      return capability ? capabilityHashes[capability.index] : slug
    },
    [capabilities],
  )
  const {
    activeId: activeSlug,
    handleNavigationClick,
    select: selectCapability,
    setTriggerRef,
  } = useExclusiveDisclosure({ canonicalHash, resolveHash })

  return (
    <main
      className="route-page capability-page"
      id="main-content"
      tabIndex={-1}
    >
      <RouteContext
        ariaLabel={es ? "Contexto de página" : "Page context"}
        items={[
          { href: es ? "/es" : "/", label: es ? "Nosotros" : "Us" },
          { label: es ? "Capacidades" : "Capabilities" },
        ]}
      />
      <header className="route-intro capability-intro">
        <Container className="capability-intro__inner">
          <Heading level={1}>
            {es
              ? "Disciplinas de ingeniería para sistemas operacionales."
              : "Engineering disciplines for operational systems."}
          </Heading>
          <div className="route-intro__lede">
            <p>
              {es
                ? "Cinco disciplinas de ingeniería que Brunova integra en un sistema operacional."
                : "Five engineering disciplines Brunova combines into one operational system."}
            </p>
          </div>
        </Container>
      </header>

      <Container className="capability-field">
        <nav
          aria-label={es ? "Secciones de capacidades" : "Capability sections"}
          className="capability-field__map"
        >
          <p>
            {es
              ? "Un sistema operacional, cinco disciplinas"
              : "One operational system, five disciplines"}
          </p>
          <ol>
            {capabilities.map((capability) => (
              <li key={capability.slug}>
                <a
                  aria-controls={`${canonicalHash(capability.slug)}-panel`}
                  aria-current={
                    activeSlug === capability.slug ? "location" : undefined
                  }
                  aria-expanded={activeSlug === capability.slug}
                  data-active={
                    activeSlug === capability.slug ? "true" : undefined
                  }
                  href={`#${canonicalHash(capability.slug)}`}
                  onClick={(event) =>
                    handleNavigationClick(event, capability.slug)
                  }
                >
                  <span>{capability.index}</span>
                  <span>{capability.navigationLabel}</span>
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="capability-field__details">
          {capabilities.map((capability) => {
            const relatedWork = capability.relatedWork
              .map(getWorkCase)
              .filter((work): work is NonNullable<typeof work> => Boolean(work))

            const hash = canonicalHash(capability.slug)
            const isOpen = activeSlug === capability.slug

            return (
              <article
                className="capability-spread capability-disclosure"
                data-open={isOpen ? "true" : undefined}
                id={hash}
                key={capability.slug}
              >
                <button
                  aria-controls={`${hash}-panel`}
                  aria-expanded={isOpen}
                  className="capability-spread__title"
                  id={`${hash}-trigger`}
                  onClick={() => selectCapability(capability.slug)}
                  ref={(node) => {
                    setTriggerRef(capability.slug, node)
                  }}
                  type="button"
                >
                  <span>{capability.index}</span>
                  <span className="capability-spread__summary-copy">
                    <Heading level={2}>{capability.name}</Heading>
                    <span>{capability.shortDescription}</span>
                  </span>
                  <span aria-hidden="true" className="disclosure-mark" />
                </button>

                <div
                  aria-hidden={!isOpen}
                  aria-labelledby={`${hash}-trigger`}
                  className="capability-spread__reveal"
                  id={`${hash}-panel`}
                  inert={!isOpen}
                  role="region"
                >
                  <div className="capability-spread__body">
                    <div className="capability-spread__problem">
                      <Heading level={3}>
                        {es ? "Problema que resuelve" : "The class of problem"}
                      </Heading>
                      <p>{capability.problemClass}</p>
                    </div>

                    <div className="capability-spread__approach">
                      <Heading level={3}>
                        {es
                          ? "Enfoque de Brunova"
                          : "How Brunova approaches it"}
                      </Heading>
                      <p>{capability.approach}</p>
                    </div>

                    <div className="capability-spread__outcomes">
                      <Heading level={3}>
                        {es
                          ? "Resultados habituales"
                          : "Typical system outcomes"}
                      </Heading>
                      <ul>
                        {capability.outcomes.map((outcome) => (
                          <li key={outcome}>{outcome}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="capability-spread__concerns">
                      <Heading level={3}>
                        {es ? "Aspectos operativos" : "Operational concerns"}
                      </Heading>
                      <ul>
                        {capability.operationalConcerns.map((concern) => (
                          <li key={concern}>{concern}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="capability-spread__work">
                      <Heading level={3}>
                        {es ? "Sistemas relacionados" : "Related systems"}
                      </Heading>
                      <ul>
                        {relatedWork.map((work) => (
                          <li key={work.slug}>
                            <span>{work.homepageTitle}</span>
                            <ActionLink
                              href={localizedPath(locale, `/work/${work.slug}`)}
                              variant="text"
                            >
                              {es ? "Ver sistema" : "View system"}
                            </ActionLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </Container>

      <section aria-labelledby="capability-next" className="route-cta">
        <Container className="route-cta__inner">
          <div>
            <Heading id="capability-next" level={2}>
              {es ? "Empiece por la operación." : "Start with the operation."}
            </Heading>
            <p>
              {es
                ? "Brunova define qué disciplinas necesita el sistema."
                : "Brunova defines the disciplines the system requires."}
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
  )
}
