import { problemCategoryValues } from "@/lib/contact/categories"
import type { ContactFieldErrors, ContactUtm } from "@/lib/contact/types"
import type { Locale } from "@/lib/i18n"

export type BrowserContactRequest = {
  name: string
  email: string
  company: string
  role: string
  problemCategory: string
  problemDescription: string
  pagePath: "/contact" | "/es/contact"
  locale?: Locale
  utm: ContactUtm
  website: string
  formStartedAt: number
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function hasTrimmedLength(value: string, minimum: number, maximum: number) {
  const length = value.trim().length
  return length >= minimum && length <= maximum
}

export function browserContactFieldErrors(
  request: BrowserContactRequest,
  locale: Locale = "en",
): ContactFieldErrors {
  const es = locale === "es"
  const errors: Record<string, string[]> = {}

  if (!hasTrimmedLength(request.name, 2, 100)) {
    errors.name = [
      es
        ? "El nombre debe tener entre 2 y 100 caracteres."
        : "Enter your name using 2–100 characters.",
    ]
  }
  if (
    !hasTrimmedLength(request.email, 3, 254) ||
    !emailPattern.test(request.email.trim())
  ) {
    errors.email = [
      es
        ? "Ingrese un correo corporativo válido."
        : "Enter a valid work email address.",
    ]
  }
  if (!hasTrimmedLength(request.company, 2, 120)) {
    errors.company = [
      es
        ? "El nombre de la empresa debe tener entre 2 y 120 caracteres."
        : "Enter your company using 2–120 characters.",
    ]
  }
  if (!hasTrimmedLength(request.role, 2, 100)) {
    errors.role = [
      es
        ? "El cargo debe tener entre 2 y 100 caracteres."
        : "Enter your role using 2–100 characters.",
    ]
  }
  if (
    !problemCategoryValues.includes(
      request.problemCategory as (typeof problemCategoryValues)[number],
    )
  ) {
    errors.problemCategory = [
      es
        ? "Seleccione la opción que mejor describa la situación."
        : "Choose the category closest to the problem.",
    ]
  }
  if (!hasTrimmedLength(request.problemDescription, 30, 4000)) {
    errors.problemDescription = [
      es
        ? "La descripción debe tener entre 30 y 4.000 caracteres."
        : "Describe the operational problem using 30–4,000 characters.",
    ]
  }

  return errors
}
