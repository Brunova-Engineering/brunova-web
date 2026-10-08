"use client"

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type SyntheticEvent,
} from "react"

import { trackEvent } from "@/lib/analytics"
import { contactAttribution } from "@/lib/attribution"
import { problemCategories } from "@/lib/contact/categories"
import { browserContactFieldErrors } from "@/lib/contact/client-validation"
import {
  applyMaterialEdit,
  completeSubmission,
  createIdempotencyState,
  markSubmissionAttempt,
  serializeSubmissionIntent,
  type IdempotencyState,
} from "@/lib/contact/idempotency"
import type { ContactFieldErrors, ContactResponse } from "@/lib/contact/types"
import type { Locale } from "@/lib/i18n"

type FormStatus =
  | "initial"
  | "validation"
  | "submitting"
  | "success"
  | "service_error"
  | "network_error"
  | "rejected"
  | "rate_limited"
  | "unexpected_error"

const englishStatusCopy: Partial<
  Record<FormStatus, { title: string; message: string }>
> = {
  validation: {
    title: "Check the highlighted fields.",
    message: "A few details need attention before this can be sent.",
  },
  service_error: {
    title: "We couldn't send this right now.",
    message: "Your information is still here—please try again.",
  },
  network_error: {
    title: "The connection was interrupted.",
    message: "Your information is still here. Check the connection and retry.",
  },
  rejected: {
    title: "This request could not be accepted.",
    message: "Review the information and try again from this page.",
  },
  rate_limited: {
    title: "Please wait before trying again.",
    message: "Too many attempts were received in a short period.",
  },
  unexpected_error: {
    title: "We couldn't complete this request.",
    message: "Your information is still here—please try again.",
  },
}

const spanishStatusCopy: typeof englishStatusCopy = {
  validation: {
    title: "Revise los campos resaltados.",
    message: "Falta completar o corregir algunos datos antes de enviar.",
  },
  service_error: {
    title: "No pudimos enviar su consulta.",
    message: "Sus datos siguen en el formulario. Inténtelo de nuevo.",
  },
  network_error: {
    title: "La conexión se interrumpió.",
    message:
      "Sus datos siguen en el formulario. Revise su conexión e inténtelo de nuevo.",
  },
  rejected: {
    title: "No se pudo aceptar esta solicitud.",
    message: "Revise la información e inténtelo de nuevo desde esta página.",
  },
  rate_limited: {
    title: "Espere antes de intentarlo de nuevo.",
    message: "Se recibieron demasiados intentos en poco tiempo.",
  },
  unexpected_error: {
    title: "No pudimos completar esta solicitud.",
    message: "Sus datos siguen en el formulario. Inténtelo de nuevo.",
  },
}

const spanishCategoryLabels: Record<string, string> = {
  fragmented_systems: "Sistemas fragmentados",
  manual_operational_process: "Proceso operativo manual",
  fragile_automation: "Automatización frágil",
  data_reporting_reliability: "Confiabilidad de datos y reportes",
  financial_operations: "Operaciones financieras",
  internal_platform: "Plataforma interna",
  something_else: "Otra situación",
}

function formValues(form: HTMLFormElement): Record<string, FormDataEntryValue> {
  return Object.fromEntries(new FormData(form).entries())
}

function createContactRequest(
  form: HTMLFormElement,
  formStartedAt: number,
  locale: Locale,
) {
  const values = formValues(form)
  const value = (name: string) => String(values[name] ?? "")
  const attribution = contactAttribution({
    landingPath: locale === "es" ? "/es/contact" : "/contact",
    locale,
  })

  return {
    name: value("name"),
    email: value("email"),
    company: value("company"),
    role: value("role"),
    problemCategory: value("problemCategory"),
    problemDescription: value("problemDescription"),
    pagePath:
      locale === "es" ? ("/es/contact" as const) : ("/contact" as const),
    locale,
    utm: attribution.utm,
    website: value("website"),
    formStartedAt,
  }
}

function publicFieldErrors(
  request: ReturnType<typeof createContactRequest>,
  locale: Locale,
): ContactFieldErrors {
  return browserContactFieldErrors(request, locale)
}

function intentSnapshot(form: HTMLFormElement): string {
  const values = formValues(form)
  delete values.website
  return serializeSubmissionIntent(values)
}

function fieldDescriptionId(name: string) {
  return `${name}-description`
}

function FieldMessage({
  error,
  helper,
  name,
}: {
  error?: readonly string[]
  helper?: string
  name: string
}) {
  return (
    <p
      className="contact-field__message"
      data-error={error ? "true" : undefined}
      id={fieldDescriptionId(name)}
    >
      {error?.[0] ?? helper ?? "\u00a0"}
    </p>
  )
}

export function ContactForm({ locale = "en" }: { locale?: Locale }) {
  const es = locale === "es"
  const statusCopy = es ? spanishStatusCopy : englishStatusCopy
  const [status, setStatus] = useState<FormStatus>("initial")
  const [errors, setErrors] = useState<ContactFieldErrors>({})
  const [idempotency, setIdempotency] = useState<IdempotencyState>(() =>
    createIdempotencyState(),
  )
  const formStartedAt = useRef(0)
  const started = useRef(false)
  const statusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    formStartedAt.current = Date.now()
  }, [])

  useEffect(() => {
    if (
      status !== "initial" &&
      status !== "submitting" &&
      status !== "validation"
    ) {
      window.requestAnimationFrame(() => statusRef.current?.focus())
    }
  }, [status])

  const handleInteraction = (event: SyntheticEvent<HTMLFormElement>) => {
    const target = event.target
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) ||
      target.name === "website" ||
      started.current
    ) {
      return
    }

    started.current = true
    if (formStartedAt.current === 0) formStartedAt.current = Date.now()
    trackEvent("contact_form_started", {
      page_path: locale === "es" ? "/es/contact" : "/contact",
    })
  }

  const handleInput = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget
    const target = event.target
    if (!(
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement ||
      target instanceof HTMLTextAreaElement
    )) {
      return
    }

    setIdempotency((current) =>
      applyMaterialEdit(current, intentSnapshot(form)),
    )

    if (errors[target.name]) {
      const nextErrors = publicFieldErrors(
        createContactRequest(form, formStartedAt.current, locale),
        locale,
      )
      setErrors((current) => ({
        ...current,
        [target.name]: nextErrors[target.name] ?? [],
      }))
    }

    if (status !== "initial" && status !== "submitting") {
      setStatus("initial")
    }
  }

  const handleBlur = (event: SyntheticEvent<HTMLFormElement, FocusEvent>) => {
    const form = event.currentTarget
    const target = event.target
    if (
      !(
        target instanceof HTMLInputElement ||
        target instanceof HTMLSelectElement ||
        target instanceof HTMLTextAreaElement
      ) ||
      target.name === "website"
    ) {
      return
    }

    const nextErrors = publicFieldErrors(
      createContactRequest(form, formStartedAt.current, locale),
      locale,
    )
    setErrors((current) => ({
      ...current,
      [target.name]: nextErrors[target.name] ?? [],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === "submitting") return

    const form = event.currentTarget
    const request = createContactRequest(
      form,
      formStartedAt.current || Date.now(),
      locale,
    )
    const nextErrors = publicFieldErrors(request, locale)

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus("validation")
      trackEvent("contact_form_error", { code: "VALIDATION_ERROR" })

      const firstInvalidField = Object.keys(nextErrors)[0]
      if (firstInvalidField) {
        const field = form.elements.namedItem(firstInvalidField)
        if (field instanceof HTMLElement) field.focus()
      }
      return
    }

    const attemptedState = markSubmissionAttempt(
      idempotency,
      intentSnapshot(form),
    )
    setIdempotency(attemptedState)
    setErrors({})
    setStatus("submitting")
    trackEvent("contact_form_submitted", {
      problem_category: request.problemCategory,
    })

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": attemptedState.key,
        },
        body: JSON.stringify(request),
      })

      let result: ContactResponse
      try {
        result = (await response.json()) as ContactResponse
      } catch {
        result = {
          ok: false,
          code: "INTERNAL_ERROR",
          message: es
            ? "No se pudo leer la respuesta."
            : "The response could not be read.",
        }
      }

      if (response.ok && result.ok) {
        setStatus("success")
        setIdempotency((current) => completeSubmission(current))
        trackEvent("contact_form_success", {
          problem_category: request.problemCategory,
        })
        return
      }

      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        const nextStatus: FormStatus =
          result.code === "RATE_LIMITED"
            ? "rate_limited"
            : result.code === "REQUEST_REJECTED"
              ? "rejected"
              : result.code === "SERVICE_UNAVAILABLE"
                ? "service_error"
                : result.code === "VALIDATION_ERROR"
                  ? "validation"
                  : "unexpected_error"

        setStatus(nextStatus)
        trackEvent("contact_form_error", { code: result.code })
      }
    } catch {
      setStatus("network_error")
      trackEvent("contact_form_error", { code: "NETWORK_ERROR" })
    }
  }

  const beginAnotherSubmission = () => {
    setStatus("initial")
    setErrors({})
    setIdempotency((current) => completeSubmission(current))
    formStartedAt.current = Date.now()
    started.current = false
    window.requestAnimationFrame(() =>
      document.querySelector<HTMLInputElement>("#name")?.focus(),
    )
  }

  if (status === "success") {
    return (
      <div
        aria-atomic="true"
        aria-live="polite"
        className="contact-result contact-result--success"
        data-state="success"
        ref={statusRef}
        role="status"
        tabIndex={-1}
      >
        <p className="contact-result__mark" aria-hidden="true">
          ✓
        </p>
        <h2>
          {es
            ? "Gracias. Recibimos su consulta."
            : "Thanks. We received your note."}
        </h2>
        <p>
          {es
            ? "Revisaremos el contexto y le responderemos con un siguiente paso concreto."
            : "We’ll review the context and get back to you with the right next step."}
        </p>
        <button onClick={beginAnotherSubmission} type="button">
          {es ? "Enviar otra consulta" : "Send another note"}
        </button>
      </div>
    )
  }

  const currentStatus = statusCopy[status]

  return (
    <form
      aria-busy={status === "submitting"}
      className="contact-form"
      data-state={status}
      noValidate
      onBlur={handleBlur}
      onFocus={handleInteraction}
      onInput={handleInput}
      onSubmit={handleSubmit}
    >
      <p
        aria-atomic="true"
        aria-live="polite"
        className="contact-form__announcement"
      >
        {status === "submitting"
          ? es
            ? "Enviando su consulta."
            : "Sending your information."
          : ""}
      </p>

      <div className="contact-form__heading">
        <div>
          <h2>
            {es
              ? "Describa la situación operativa."
              : "Describe the operating problem."}
          </h2>
          <p>
            {es
              ? "Todos los campos son obligatorios."
              : "All fields are required."}
          </p>
        </div>
        <p>
          {es
            ? "Una descripción concreta es suficiente; no hace falta preparar un documento formal."
            : "A concrete description is useful. You do not need a polished brief."}
        </p>
      </div>

      {currentStatus ? (
        <div
          aria-atomic="true"
          aria-live="polite"
          className="contact-result"
          data-state={status}
          ref={statusRef}
          role={status === "validation" ? "alert" : "status"}
          tabIndex={-1}
        >
          <strong>{currentStatus.title}</strong>
          <p>{currentStatus.message}</p>
        </div>
      ) : null}

      <fieldset className="contact-form__group">
        <legend>{es ? "Sobre usted" : "About you"}</legend>
        <div className="contact-form__fields contact-form__fields--identity">
          <div className="contact-field">
            <label htmlFor="name">{es ? "Nombre" : "Name"}</label>
            <input
              aria-describedby={fieldDescriptionId("name")}
              aria-invalid={Boolean(errors.name)}
              autoComplete="name"
              id="name"
              maxLength={100}
              name="name"
              required
              type="text"
            />
            <FieldMessage error={errors.name} name="name" />
          </div>

          <div className="contact-field">
            <label htmlFor="email">
              {es ? "Correo corporativo" : "Work email"}
            </label>
            <input
              aria-describedby={fieldDescriptionId("email")}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              id="email"
              inputMode="email"
              maxLength={254}
              name="email"
              required
              type="email"
            />
            <FieldMessage error={errors.email} name="email" />
          </div>

          <div className="contact-field">
            <label htmlFor="company">{es ? "Empresa" : "Company"}</label>
            <input
              aria-describedby={fieldDescriptionId("company")}
              aria-invalid={Boolean(errors.company)}
              autoComplete="organization"
              id="company"
              maxLength={120}
              name="company"
              required
              type="text"
            />
            <FieldMessage error={errors.company} name="company" />
          </div>

          <div className="contact-field">
            <label htmlFor="role">{es ? "Cargo" : "Role"}</label>
            <input
              aria-describedby={fieldDescriptionId("role")}
              aria-invalid={Boolean(errors.role)}
              autoComplete="organization-title"
              id="role"
              maxLength={100}
              name="role"
              required
              type="text"
            />
            <FieldMessage error={errors.role} name="role" />
          </div>
        </div>
      </fieldset>

      <fieldset className="contact-form__group">
        <legend>{es ? "La operación" : "The operation"}</legend>
        <div className="contact-form__fields">
          <div className="contact-field">
            <label htmlFor="problemCategory">
              {es ? "Tipo de situación" : "Problem category"}
            </label>
            <select
              aria-describedby={fieldDescriptionId("problemCategory")}
              aria-invalid={Boolean(errors.problemCategory)}
              defaultValue=""
              id="problemCategory"
              name="problemCategory"
              required
            >
              <option disabled value="">
                {es
                  ? "Seleccione la opción más cercana"
                  : "Choose the closest category"}
              </option>
              {problemCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {es ? spanishCategoryLabels[category.value] : category.label}
                </option>
              ))}
            </select>
            <FieldMessage
              error={errors.problemCategory}
              name="problemCategory"
            />
          </div>

          <div className="contact-field">
            <label htmlFor="problemDescription">
              {es ? "Descripción del problema" : "Problem description"}
            </label>
            <textarea
              aria-describedby={fieldDescriptionId("problemDescription")}
              aria-invalid={Boolean(errors.problemDescription)}
              id="problemDescription"
              maxLength={4000}
              name="problemDescription"
              required
              rows={8}
            />
            <FieldMessage
              error={errors.problemDescription}
              helper={
                es
                  ? "¿Qué parte de la operación cuesta ejecutar, dónde aparece la fricción y qué información tiene? No incluya datos personales sensibles."
                  : "What is difficult to operate, where does the friction show up, and what do you already know? Do not include sensitive personal data."
              }
              name="problemDescription"
            />
          </div>
        </div>
      </fieldset>

      <div aria-hidden="true" className="contact-form__trap">
        <label htmlFor="website">{es ? "Sitio web" : "Website"}</label>
        <input
          autoComplete="off"
          id="website"
          name="website"
          tabIndex={-1}
          type="text"
        />
      </div>

      <div className="contact-form__submit">
        <button
          data-state={status === "submitting" ? "loading" : "default"}
          disabled={status === "submitting"}
          type="submit"
        >
          {status === "submitting"
            ? es
              ? "Enviando…"
              : "Sending…"
            : es
              ? "Enviar consulta"
              : "Send the context"}
        </button>
        <section
          aria-labelledby="contact-privacy-title"
          className="contact-privacy"
        >
          <div className="contact-privacy__heading">
            <h3 id="contact-privacy-title">{es ? "Privacidad" : "Privacy"}</h3>
            <p>
              {es
                ? "Brunova utiliza la información que proporciona para revisar su consulta y contexto de negocio, evaluar si existe un encaje adecuado y cuál podría ser el siguiente paso, responder, mantener el seguimiento operativo y comercial necesario y conservar la correspondencia y los registros razonables de la relación actual o potencial. No existen finalidades secundarias de marketing."
                : "Brunova uses the information you provide to review your inquiry and business context, assess fit and a useful next step, respond, maintain necessary operational and commercial follow-up, and preserve necessary correspondence and reasonable records of the current or potential relationship. There are no secondary marketing purposes."}
            </p>
          </div>

          <dl className="contact-privacy__facts">
            <div>
              <dt>{es ? "Responsable" : "Responsible party"}</dt>
              <dd>
                {es
                  ? "Jorge Alfredo Vera Fuentes, quien opera como Brunova."
                  : "Jorge Alfredo Vera Fuentes, operating as Brunova."}
              </dd>
            </div>
            <div>
              <dt>{es ? "Domicilio de privacidad" : "Privacy domicile"}</dt>
              <dd>
                <address>
                  {es
                    ? "Calle Poniente 1 #16, Centro, C.P. 94730, Río Blanco, Veracruz, México."
                    : "Calle Poniente 1 #16, Centro, 94730 Río Blanco, Veracruz, Mexico."}
                </address>
              </dd>
            </div>
            <div>
              <dt>{es ? "Datos" : "Data"}</dt>
              <dd>
                {es
                  ? "Nombre, correo electrónico de trabajo, empresa, cargo, categoría del problema y descripción del problema."
                  : "Name, work email, company, role, problem category and problem description."}
              </dd>
            </div>
            <div>
              <dt>
                {es
                  ? "Limitar el uso o divulgación"
                  : "Limit use or disclosure"}
              </dt>
              <dd>
                <a href="mailto:brunova@brunova.mx">brunova@brunova.mx</a>
              </dd>
            </div>
          </dl>

          <a
            className="contact-privacy__notice-link"
            href={es ? "/es/privacy" : "/privacy"}
          >
            {es ? "Aviso de Privacidad completo" : "Full Privacy Notice"}
            <span aria-hidden="true"> →</span>
          </a>
        </section>
      </div>
    </form>
  )
}
