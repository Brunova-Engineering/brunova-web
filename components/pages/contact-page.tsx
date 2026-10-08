import "@/app/contact.css"
import "@/app/core-routes.css"

import { ContactForm } from "@/components/contact/contact-form"
import { Container } from "@/components/layout/container"
import { RouteContext } from "@/components/layout/route-context"
import { Heading } from "@/components/layout/section-heading"
import type { Locale } from "@/lib/i18n"

export function ContactPageView({ locale }: { locale: Locale }) {
  const es = locale === "es"
  const expectations = es
    ? [
        {
          title: "Describa la operación.",
          description:
            "Señale qué cuesta ejecutar hoy y dónde aparece la fricción.",
        },
        {
          title: "Revisamos si existe un buen ajuste.",
          description:
            "Brunova revisa la situación operativa y determina si parece corresponder con el tipo de problemas que resolvemos.",
        },
        {
          title: "Si existe ajuste, nos enfocamos en el problema.",
          description:
            "La primera conversación busca entender la situación y definir un siguiente paso útil. No necesita elegir una oferta ni una etapa antes de escribirnos.",
        },
      ]
    : [
        {
          title: "Start with the operation.",
          description:
            "Name what is becoming difficult to run and where the friction appears.",
        },
        {
          title: "We review whether it fits.",
          description:
            "Brunova reviews the operating situation and whether it appears to match the problems we solve.",
        },
        {
          title: "If it fits, we focus on the problem.",
          description:
            "The first conversation is for understanding the situation and determining a useful next step. You do not need to choose an offer or stage before contacting us.",
        },
      ]
  return (
    <main className="route-page contact-page" id="main-content" tabIndex={-1}>
      <RouteContext
        ariaLabel={es ? "Contexto de página" : "Page context"}
        items={[
          { href: es ? "/es" : "/", label: "Brunova" },
          { label: es ? "Contacto" : "Contact" },
        ]}
      />
      <Container className="contact-studio">
        <section className="contact-studio__context">
          <div className="contact-studio__opening">
            <Heading level={1}>
              <span>{es ? "Hablemos de su" : "Start a"}</span>{" "}
              <span>{es ? "operación." : "conversation."}</span>
            </Heading>
            <p>
              {es
                ? "Cuéntenos qué se ha vuelto difícil de ejecutar, dónde aparece la fricción y qué información tiene hasta ahora."
                : "Tell us what operation is becoming difficult to run, where the friction shows up, and what you already know about the problem."}
            </p>
          </div>

          <ol className="contact-expectations">
            {expectations.map((expectation) => (
              <li key={expectation.title}>
                <strong>{expectation.title}</strong>
                <p>{expectation.description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-label={
            es
              ? "Formulario de consulta sobre sistemas operacionales"
              : "Operational systems conversation form"
          }
          className="contact-studio__form"
        >
          <ContactForm locale={locale} />
        </section>
      </Container>
    </main>
  )
}
