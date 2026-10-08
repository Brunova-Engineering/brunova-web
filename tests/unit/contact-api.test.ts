import { describe, expect, it, vi } from "vitest"

import {
  CONTACT_BODY_LIMIT_BYTES,
  createContactPostHandler,
} from "@/app/api/contact/route"
import { createSubmissionIntentRegistry } from "@/lib/contact/abuse"
import { createInMemoryRateLimiter } from "@/lib/contact/rate-limit"
import type { ContactEnvelope } from "@/lib/contact/types"
import type { ContactRuntimeConfiguration } from "@/lib/env"

type ContactSend = (input: {
  configuration: ContactRuntimeConfiguration
  envelope: ContactEnvelope
}) => Promise<boolean>

const now = Date.parse("2026-08-16T18:00:00.000Z")
const key = "11111111-1111-4111-8111-111111111111"

const validRequest = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  role: "Chief Operating Officer",
  problemCategory: "fragmented_systems",
  problemDescription:
    "Our operating data is fragmented across systems and manual handoffs.",
  pagePath: "/contact",
  utm: {
    source: "referral",
    medium: null,
    campaign: "br-017",
    term: null,
    content: null,
  },
  website: "",
  formStartedAt: now - 1_000,
}

const configuration: ContactRuntimeConfiguration = {
  siteUrl: new URL("http://localhost:3000"),
  webhookUrl: new URL("https://automation.example.test/contact"),
  webhookAuthorization: {
    type: "basic",
    username: "test-user",
    password: "test-password",
  },
  rateLimitSalt: "contact-test-salt-value",
}

function contactRequest(
  body: unknown = validRequest,
  headers: Record<string, string> = {},
) {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "http://localhost:3000",
      "Sec-Fetch-Site": "same-origin",
      "Idempotency-Key": key,
      "X-Real-IP": "192.0.2.10",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

function testHandler({
  accepted = true,
  configured = true,
  limit = 5,
  send,
}: {
  accepted?: boolean
  configured?: boolean
  limit?: number
  send?: ContactSend
} = {}) {
  const sendImplementation = send ?? (async () => accepted)
  return {
    handler: createContactPostHandler({
      getSiteUrl: () => configuration.siteUrl,
      getConfiguration: () =>
        configured ? { ready: true, configuration } : { ready: false as const },
      now: () => now,
      randomUUID: () => "22222222-2222-4222-8222-222222222222",
      rateLimiter: createInMemoryRateLimiter({ limit, now: () => now }),
      intentRegistry: createSubmissionIntentRegistry(),
      send: sendImplementation,
    }),
    send: sendImplementation,
  }
}

describe("POST /api/contact", () => {
  it("preserves the browser key and forwards only the sanitized envelope", async () => {
    const send = vi.fn<ContactSend>(async () => true)
    const { handler } = testHandler({ send })
    const response = await handler(contactRequest())

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
    expect(await response.json()).toEqual({ ok: true })
    expect(send).toHaveBeenCalledTimes(1)

    const envelope = send.mock.calls[0]?.[0]?.envelope as ContactEnvelope
    expect(envelope).toEqual({
      request_id: "22222222-2222-4222-8222-222222222222",
      idempotency_key: key,
      source: "brunova_website",
      form: "contact_v1",
      submitted_at: "2026-08-16T18:00:00.000Z",
      locale: "en",
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: "Analytical Engines",
      role: "Chief Operating Officer",
      problem_category: "fragmented_systems",
      problem_description:
        "Our operating data is fragmented across systems and manual handoffs.",
      page_path: "/contact",
      utm: validRequest.utm,
    })
    expect(JSON.stringify(envelope)).not.toContain("formStartedAt")
    expect(envelope).not.toHaveProperty("website")
    expect(JSON.stringify(envelope)).not.toContain("192.0.2.10")
  })

  it("allows a legitimate rapid submission", async () => {
    const { handler } = testHandler()
    const response = await handler(contactRequest())
    expect(response.status).toBe(200)
  })

  it("rejects honeypot and combined timing/idempotency abuse", async () => {
    const first = testHandler()
    expect(
      (await first.handler(contactRequest({ ...validRequest, website: "bot" })))
        .status,
    ).toBe(403)

    const second = testHandler()
    expect((await second.handler(contactRequest())).status).toBe(200)
    expect(
      (
        await second.handler(
          contactRequest({
            ...validRequest,
            problemDescription:
              "A different rapid intent is being reused with the same browser key.",
          }),
        )
      ).status,
    ).toBe(403)
  })

  it("rejects cross-origin, non-JSON, malformed and oversized requests", async () => {
    const { handler } = testHandler()

    expect(
      (
        await handler(
          contactRequest(validRequest, { Origin: "https://attacker.test" }),
        )
      ).status,
    ).toBe(403)

    expect(
      (
        await handler(
          contactRequest(validRequest, { "Content-Type": "text/plain" }),
        )
      ).status,
    ).toBe(400)

    expect((await handler(contactRequest("{"))).status).toBe(400)
    expect(
      (await handler(contactRequest("x".repeat(CONTACT_BODY_LIMIT_BYTES + 1))))
        .status,
    ).toBe(400)
  })

  it("returns stable validation errors for invalid fields and keys", async () => {
    const { handler } = testHandler()
    const response = await handler(
      contactRequest(
        { ...validRequest, name: "A", unknown: "not-forwarded" },
        { "Idempotency-Key": "not-a-uuid" },
      ),
    )
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      fieldErrors: {
        name: expect.any(Array),
        idempotencyKey: expect.any(Array),
      },
    })
  })

  it("localizes validation errors while preserving normalized fields", async () => {
    const { handler } = testHandler()
    const response = await handler(
      contactRequest(
        {
          ...validRequest,
          locale: "es",
          pagePath: "/es/contact",
          name: "A",
        },
        { "Idempotency-Key": "not-a-uuid" },
      ),
    )
    const body = await response.json()

    expect(body).toMatchObject({
      ok: false,
      code: "VALIDATION_ERROR",
      message: "Revise los campos resaltados e inténtelo de nuevo.",
      fieldErrors: {
        name: ["El nombre debe tener entre 2 y 100 caracteres."],
        idempotencyKey: ["Se requiere una clave de envío válida."],
      },
    })
  })

  it("enforces the per-instance rate limit with Retry-After", async () => {
    const { handler } = testHandler({ limit: 1 })
    expect((await handler(contactRequest())).status).toBe(200)

    const limited = await handler(
      contactRequest(validRequest, {
        "Idempotency-Key": "33333333-3333-4333-8333-333333333333",
      }),
    )
    expect(limited.status).toBe(429)
    expect(limited.headers.get("retry-after")).toBe("900")
  })

  it("fails closed for unavailable configuration and upstream failure", async () => {
    const missing = testHandler({ configured: false })
    expect((await missing.handler(contactRequest())).status).toBe(503)

    const failed = testHandler({ accepted: false })
    const response = await failed.handler(contactRequest())
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      ok: false,
      code: "SERVICE_UNAVAILABLE",
    })
  })
})
