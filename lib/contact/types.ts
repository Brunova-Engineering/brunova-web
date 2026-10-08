export const contactResponseCodes = [
  "VALIDATION_ERROR",
  "RATE_LIMITED",
  "REQUEST_REJECTED",
  "SERVICE_UNAVAILABLE",
  "INTERNAL_ERROR",
] as const

export type ContactResponseCode = (typeof contactResponseCodes)[number]

export type ContactFieldErrors = Readonly<Record<string, readonly string[]>>

export type ContactResponse =
  | { ok: true }
  | {
      ok: false
      code: ContactResponseCode
      message: string
      fieldErrors?: ContactFieldErrors
    }

export type ContactUtm = {
  source: string | null
  medium: string | null
  campaign: string | null
  term: string | null
  content: string | null
}

export type ContactEnvelope = {
  request_id: string
  idempotency_key: string
  source: "brunova_website"
  form: "contact_v1"
  submitted_at: string
  locale?: "en" | "es"
  name: string
  email: string
  company: string
  role: string
  problem_category: string
  problem_description: string
  page_path: "/contact" | "/es/contact"
  utm: ContactUtm
}
