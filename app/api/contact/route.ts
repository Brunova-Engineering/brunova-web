import { randomUUID } from "node:crypto"

import { NextResponse } from "next/server"

import {
  contactFieldErrors,
  contactRequestSchema,
  idempotencyKeySchema,
  type ContactRequest,
} from "@/lib/contact/schema"
import {
  submissionIntentRegistry,
  type SubmissionIntentRegistry,
} from "@/lib/contact/abuse"
import { sendContactToN8n } from "@/lib/contact/n8n"
import { hasAllowedOrigin } from "@/lib/contact/origin"
import {
  contactRateLimiter,
  hashClientAddress,
  trustedClientAddress,
  type ContactRateLimiter,
} from "@/lib/contact/rate-limit"
import type { ContactEnvelope, ContactResponse } from "@/lib/contact/types"
import {
  getContactRuntimeConfiguration,
  getSiteUrl,
  type ContactRuntimeConfiguration,
} from "@/lib/env"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export const CONTACT_BODY_LIMIT_BYTES = 16 * 1024

class InvalidRequestBodyError extends Error {}

type ContactHandlerDependencies = {
  getSiteUrl: () => URL
  getConfiguration: () =>
    | { ready: true; configuration: ContactRuntimeConfiguration }
    | { ready: false }
  now: () => number
  randomUUID: () => string
  rateLimiter: ContactRateLimiter
  intentRegistry: SubmissionIntentRegistry
  send: (input: {
    configuration: ContactRuntimeConfiguration
    envelope: ContactEnvelope
  }) => Promise<boolean>
}

const defaultDependencies: ContactHandlerDependencies = {
  getSiteUrl,
  getConfiguration: getContactRuntimeConfiguration,
  now: () => Date.now(),
  randomUUID,
  rateLimiter: contactRateLimiter,
  intentRegistry: submissionIntentRegistry,
  send: ({ configuration, envelope }) =>
    sendContactToN8n({
      configuration: {
        webhookUrl: configuration.webhookUrl,
        webhookAuthorization: configuration.webhookAuthorization,
      },
      envelope,
    }),
}

function contactResponse(
  body: ContactResponse,
  status: number,
  headers: HeadersInit = {},
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...headers,
    },
  })
}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0)
  if (declaredLength > CONTACT_BODY_LIMIT_BYTES) {
    throw new InvalidRequestBodyError("Request body is too large")
  }

  if (!request.body) throw new InvalidRequestBodyError("Request body is empty")

  const reader = request.body.getReader()
  const decoder = new TextDecoder("utf-8", { fatal: true })
  let received = 0
  let body = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    received += value.byteLength
    if (received > CONTACT_BODY_LIMIT_BYTES) {
      await reader.cancel()
      throw new InvalidRequestBodyError("Request body is too large")
    }

    body += decoder.decode(value, { stream: true })
  }

  body += decoder.decode()

  try {
    return JSON.parse(body) as unknown
  } catch {
    throw new InvalidRequestBodyError("Request body is not valid JSON")
  }
}

function createEnvelope({
  idempotencyKey,
  request,
  requestId,
  submittedAt,
}: {
  idempotencyKey: string
  request: ContactRequest
  requestId: string
  submittedAt: string
}): ContactEnvelope {
  return {
    request_id: requestId,
    idempotency_key: idempotencyKey,
    source: "brunova_website",
    form: "contact_v1",
    submitted_at: submittedAt,
    locale: request.locale,
    name: request.name,
    email: request.email,
    company: request.company,
    role: request.role,
    problem_category: request.problemCategory,
    problem_description: request.problemDescription,
    page_path: request.pagePath,
    utm: request.utm,
  }
}

export function createContactPostHandler(
  overrides: Partial<ContactHandlerDependencies> = {},
) {
  const dependencies = { ...defaultDependencies, ...overrides }

  return async function handleContactPost(request: Request) {
    const requestId = dependencies.randomUUID()

    try {
      if (
        request.headers.get("content-type")?.split(";", 1)[0]?.trim() !==
        "application/json"
      ) {
        return contactResponse(
          {
            ok: false,
            code: "VALIDATION_ERROR",
            message: "Send the request as JSON and try again.",
          },
          400,
        )
      }

      if (!hasAllowedOrigin(request, dependencies.getSiteUrl())) {
        return contactResponse(
          {
            ok: false,
            code: "REQUEST_REJECTED",
            message: "This request could not be accepted.",
          },
          403,
        )
      }

      let rawRequest: unknown
      try {
        rawRequest = await readBoundedJson(request)
      } catch (error) {
        if (!(error instanceof InvalidRequestBodyError)) throw error

        return contactResponse(
          {
            ok: false,
            code: "VALIDATION_ERROR",
            message: "The request could not be read. Check it and try again.",
          },
          400,
        )
      }

      const parsedRequest = contactRequestSchema.safeParse(rawRequest)
      const requestLocale =
        typeof rawRequest === "object" &&
        rawRequest !== null &&
        (("locale" in rawRequest && rawRequest.locale === "es") ||
          ("pagePath" in rawRequest && rawRequest.pagePath === "/es/contact"))
          ? "es"
          : "en"
      const parsedKey = idempotencyKeySchema.safeParse(
        request.headers.get("idempotency-key"),
      )

      if (!parsedRequest.success || !parsedKey.success) {
        return contactResponse(
          {
            ok: false,
            code: "VALIDATION_ERROR",
            message:
              requestLocale === "es"
                ? "Revise los campos resaltados e inténtelo de nuevo."
                : "Check the highlighted fields and try again.",
            fieldErrors: {
              ...(parsedRequest.success
                ? {}
                : contactFieldErrors(parsedRequest.error, requestLocale)),
              ...(parsedKey.success
                ? {}
                : {
                    idempotencyKey: [
                      requestLocale === "es"
                        ? "Se requiere una clave de envío válida."
                        : "A valid submission key is required.",
                    ],
                  }),
            },
          },
          400,
        )
      }

      const now = dependencies.now()
      const abuse = dependencies.intentRegistry.assess({
        idempotencyKey: parsedKey.data,
        request: parsedRequest.data,
        now,
      })

      if (abuse.reject) {
        return contactResponse(
          {
            ok: false,
            code: "REQUEST_REJECTED",
            message: "This request could not be accepted.",
          },
          403,
        )
      }

      const configured = dependencies.getConfiguration()
      if (!configured.ready) {
        return contactResponse(
          {
            ok: false,
            code: "SERVICE_UNAVAILABLE",
            message:
              "We couldn't send this right now. Your information is still here—please try again.",
          },
          503,
        )
      }

      const addressHash = hashClientAddress(
        trustedClientAddress(request.headers),
        configured.configuration.rateLimitSalt,
      )
      const rateLimit = dependencies.rateLimiter.check(addressHash)

      if (!rateLimit.allowed) {
        return contactResponse(
          {
            ok: false,
            code: "RATE_LIMITED",
            message:
              "Too many attempts were received in a short period. Please wait before trying again.",
          },
          429,
          { "Retry-After": String(rateLimit.retryAfterSeconds) },
        )
      }

      const envelope = createEnvelope({
        idempotencyKey: parsedKey.data,
        request: parsedRequest.data,
        requestId,
        submittedAt: new Date(now).toISOString(),
      })
      const accepted = await dependencies.send({
        configuration: configured.configuration,
        envelope,
      })

      if (!accepted) {
        return contactResponse(
          {
            ok: false,
            code: "SERVICE_UNAVAILABLE",
            message:
              "We couldn't send this right now. Your information is still here—please try again.",
          },
          503,
        )
      }

      return contactResponse({ ok: true }, 200)
    } catch {
      return contactResponse(
        {
          ok: false,
          code: "INTERNAL_ERROR",
          message:
            "We couldn't complete this request. Your information is still here—please try again.",
        },
        500,
      )
    }
  }
}

export const POST = createContactPostHandler()
