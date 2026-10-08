import { z } from "zod"

import {
  problemCategories,
  problemCategoryValues,
  type ProblemCategory,
} from "@/lib/contact/categories"
import type { ContactFieldErrors } from "@/lib/contact/types"
import type { Locale } from "@/lib/i18n"

export { problemCategories, problemCategoryValues }
export type { ProblemCategory }

const normalizedText = (minimum: number, maximum: number) =>
  z.string().trim().min(minimum).max(maximum)

const utmValueSchema = z.string().trim().max(200).nullable()

export const contactRequestSchema = z
  .object({
    name: normalizedText(2, 100),
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((value) => value.toLowerCase()),
    company: normalizedText(2, 120),
    role: normalizedText(2, 100),
    problemCategory: z.enum(problemCategoryValues),
    problemDescription: normalizedText(30, 4000),
    pagePath: z.enum(["/contact", "/es/contact"]),
    locale: z.enum(["en", "es"]).default("en"),
    utm: z
      .object({
        source: utmValueSchema,
        medium: utmValueSchema,
        campaign: utmValueSchema,
        term: utmValueSchema,
        content: utmValueSchema,
      })
      .strict(),
    website: z.string().trim().max(200),
    formStartedAt: z.number().int().nonnegative(),
  })
  .strict()

export const idempotencyKeySchema = z.string().uuid()

export type ContactRequest = z.infer<typeof contactRequestSchema>

export function contactFieldErrors(
  error: z.ZodError<ContactRequest>,
  locale: Locale = "en",
): ContactFieldErrors {
  const errors: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form"
    errors[field] ??= []
    const spanishMessages: Record<string, string> = {
      name: "El nombre debe tener entre 2 y 100 caracteres.",
      email: "Ingrese un correo corporativo válido.",
      company: "El nombre de la empresa debe tener entre 2 y 120 caracteres.",
      role: "El cargo debe tener entre 2 y 100 caracteres.",
      problemCategory: "Seleccione la opción que mejor describa la situación.",
      problemDescription:
        "La descripción debe tener entre 30 y 4.000 caracteres.",
      pagePath: "La ruta del formulario no es válida.",
      locale: "El idioma del formulario no es válido.",
      form: "La solicitud contiene campos no permitidos.",
    }
    errors[field].push(
      locale === "es"
        ? (spanishMessages[field] ?? "Revise este campo.")
        : issue.message,
    )
  }

  return errors
}
