"use client"

import "@/app/core-routes.css"

import { useCallback } from "react"

import { AnalyticsLink } from "@/components/analytics/analytics-link"
import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import { localizedContent } from "@/content/locales"
import { useExclusiveDisclosure } from "@/hooks/use-exclusive-disclosure"
import { localizedPath, type Locale } from "@/lib/i18n"

const processHashes = {
  "01": "systems-discovery",
  "02": "architecture-blueprint",
  "03": "implementation-sprint",
  "04": "managed-evolution",
} as const

export function ProcessPageView({ locale }: { locale: Locale }) {
  const { processStages } = localizedContent[locale]
  const es = locale === "es"
  const lateralEntries = es
    ? [
        { known: "Problema definido", enter: "Diseño" },
        { known: "Arquitectura definida", enter: "Implementación" },
        {
          known: "Sistema existente en producción",
          enter: "Evolución continua",
        },
      ]
    : [
        { known: "Known problem", enter: "Blueprint" },
        { known: "Defined architecture", enter: "Implementation" },
        { known: "Existing production system", enter: "Managed Evolution" },
      ]
  const stateOutputs = es
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
  const resolveHash = useCallback(
    (hash: string) => {
      const value = decodeURIComponent(hash.replace(/^#/, ""))
      return (
        processStages.find(
          (stage) =>
            processHashes[stage.index] === value ||
            stage.name.toLowerCase().replaceAll(" ", "-") === value,
        )?.index ?? null
      )
    },
    [processStages],
  )
  const canonicalHash = useCallback(
    (index: string) =>
      processHashes[index as keyof typeof processHashes] ?? index,
    [],
  )
  const {
    activeId: activeStage,
    handleNavigationClick,
    select: selectStage,
    setTriggerRef,
  } = useExclusiveDisclosure({ canonicalHash, resolveHash })

  return (
    <main className="route-page process-page" id="main-content" tabIndex={-1}>
      <RouteContext
        ariaLabel={es ? "Contexto de página" : "Page context"}
        items={[
          { href: es ? "/es" : "/", label: es ? "Nosotros" : "Us" },
          { label: es ? "Proceso" : "Process" },
        ]}
      />
      <header className="route-intro process-intro">
        <Container className="process-intro__inner">
          <Heading level={1}>
            {es
              ? "Partimos del estado actual del sistema."
              : "Start with what you already know."}
          </Heading>
          <div className="route-intro__lede">
            <p>
              {es
                ? "Un enfoque que parte del estado real del sistema, no de una secuencia rígida. El Diagnóstico está disponible cuando el problema aún no está claro."
                : "An approach based on the system’s actual state, not a rigid sequence. Discovery is available when the problem is still unclear."}
            </p>
          </div>
        </Container>
      </header>

      <section aria-labelledby="lateral-entry-title" className="entry-map">
        <Container className="entry-map__inner">
          <div>
            <Heading id="lateral-entry-title" level={2}>
              {es
                ? "No siempre hay que empezar desde cero."
                : "You don’t always have to start from the beginning."}
            </Heading>
            <p>
              {es
                ? "Iniciamos en la etapa que corresponde con lo que su equipo ya sabe."
                : "Brunova begins at the stage that matches what is already known."}
            </p>
          </div>
          <div className="entry-map__matrix">
            <div className="entry-map__labels">
              <span>{es ? "Lo que ya tiene" : "What you have"}</span>
              <span>{es ? "Entrar en" : "Enter at"}</span>
            </div>
            <dl>
              {lateralEntries.map((entry) => (
                <div key={entry.known}>
                  <dt>{entry.known}</dt>
                  <dd>
                    <span aria-hidden="true">→</span>
                    <strong>{entry.enter}</strong>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Container>
      </section>

      <nav aria-label={es ? "Etapas del proceso" : "Process stages"}>
        <Container className="process-map-wrap">
          <ol className="process-state-map">
            {processStages.map((stage, index) => {
              const hash = canonicalHash(stage.index)
              const isOpen = activeStage === stage.index

              return (
                <li key={stage.index}>
                  <a
                    aria-controls={`${hash}-panel`}
                    aria-current={isOpen ? "step" : undefined}
                    aria-expanded={isOpen}
                    data-active={isOpen ? "true" : undefined}
                    href={`#${hash}`}
                    onClick={(event) =>
                      handleNavigationClick(event, stage.index)
                    }
                  >
                    <span>{stage.index}</span>
                    <strong>{stage.verb}</strong>
                    <small>{stage.name}</small>
                    <p>{stateOutputs[index]}</p>
                  </a>
                </li>
              )
            })}
          </ol>
        </Container>
      </nav>

      <Container className="process-path">
        {processStages.map((stage) => {
          const hash = canonicalHash(stage.index)
          const isOpen = activeStage === stage.index

          return (
            <article
              className="process-stage process-disclosure"
              data-open={isOpen ? "true" : undefined}
              id={hash}
              key={stage.index}
            >
              <button
                aria-controls={`${hash}-panel`}
                aria-expanded={isOpen}
                className="process-stage__summary"
                id={`${hash}-trigger`}
                onClick={() => selectStage(stage.index)}
                ref={(node) => setTriggerRef(stage.index, node)}
                type="button"
              >
                <span>{stage.index}</span>
                <span>
                  <Heading level={2}>{stage.name}</Heading>
                  <span className="process-stage__terms">
                    <small>{stage.timeline}</small>
                    <small className="process-stage__price">
                      {stage.price}
                    </small>
                    {"commitment" in stage && stage.commitment ? (
                      <small>{stage.commitment}</small>
                    ) : null}
                  </span>
                  <span className="process-stage__preview">
                    {stage.preview}
                  </span>
                </span>
                <span aria-hidden="true" className="disclosure-mark" />
              </button>

              <div
                aria-hidden={!isOpen}
                aria-labelledby={`${hash}-trigger`}
                className="process-stage__reveal"
                id={`${hash}-panel`}
                inert={!isOpen}
                role="region"
              >
                <div className="process-stage__body">
                  <p className="process-stage__description">
                    {stage.description}
                  </p>

                  <div className="process-stage__transformation">
                    <section className="process-stage__territory process-stage__input">
                      <Heading level={3}>
                        {es ? "Lo que ya tiene" : "What you have"}
                      </Heading>
                      <p>{stage.entryKnowledge}</p>
                      <p>{stage.problemSolved}</p>
                    </section>

                    <section className="process-stage__territory process-stage__establishes">
                      <Heading level={3}>
                        {es
                          ? "Lo que establece Brunova"
                          : "What Brunova establishes"}
                      </Heading>
                      <ul>
                        {stage.establishes.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    </section>

                    <section className="process-stage__territory process-stage__result">
                      <Heading level={3}>
                        {es ? "Estado resultante" : "Resulting state"}
                      </Heading>
                      <p>{stage.nextStep}</p>
                    </section>
                  </div>
                </div>
              </div>
            </article>
          )
        })}
        <p className="process-pricing-note">
          {es
            ? "Puntos de partida para alcances definidos. El precio final refleja el contexto operativo, la complejidad del sistema y el alcance acordado."
            : "Starting points for defined scopes. Final pricing reflects the operating context, system complexity and agreed scope."}
        </p>
      </Container>

      <section aria-labelledby="process-next" className="route-cta">
        <Container className="route-cta__inner">
          <div>
            <Heading id="process-next" level={2}>
              {es
                ? "¿No está claro por dónde empezar?"
                : "Not sure where to begin?"}
            </Heading>
            <p>
              {es
                ? "Cuéntenos cómo funciona hoy la operación y qué información ya tiene. Nosotros determinamos un punto de entrada útil."
                : "Tell us how the operation works today and what you already know. We’ll determine a useful entry point."}
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
