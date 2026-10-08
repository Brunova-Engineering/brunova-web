import { describe, expect, it, vi } from "vitest"

import { createContactPostHandler } from "@/app/api/contact/route"
import { createSubmissionIntentRegistry } from "@/lib/contact/abuse"
import { sendContactToN8n } from "@/lib/contact/n8n"
import { createInMemoryRateLimiter } from "@/lib/contact/rate-limit"
import type { ContactEnvelope } from "@/lib/contact/types"
import type { ContactRuntimeConfiguration } from "@/lib/env"

const logicalSubmissionId = "11111111-1111-4111-8111-111111111111"
const requestIds = [
  "22222222-2222-4222-8222-222222222222",
  "33333333-3333-4333-8333-333333333333",
]
const configuration: ContactRuntimeConfiguration = {
  siteUrl: new URL("http://localhost:3000"),
  webhookUrl: new URL("https://automation.example.test/contact"),
  webhookAuthorization: {
    type: "basic",
    username: "server-only-user",
    password: "server-only-password",
  },
  rateLimitSalt: "phase-seven-rate-limit-salt",
}
const browserPayload = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  role: "Chief Operating Officer",
  problemCategory: "fragmented_systems",
  problemDescription:
    "Our operating data is fragmented across systems and manual handoffs.",
  pagePath: "/contact",
  utm: {
    source: "architecture-review",
    medium: "referral",
    campaign: "br-017",
    term: null,
    content: null,
  },
  website: "",
  formStartedAt: Date.parse("2026-08-17T12:00:00.000Z"),
}

function browserRequest() {
  return new Request("http://localhost:3000/api/contact", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": logicalSubmissionId,
      Origin: "http://localhost:3000",
      "Sec-Fetch-Site": "same-origin",
      "X-Real-IP": "192.0.2.44",
    },
    body: JSON.stringify(browserPayload),
  })
}

describe("contact logical identity integration", () => {
  it("preserves browser identity through Next.js and n8n while rotating request correlation", async () => {
    const upstreamRequests: Array<{
      headers: Headers
      envelope: ContactEnvelope
    }> = []
    const fetchImplementation = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        const envelope = JSON.parse(String(init?.body)) as ContactEnvelope
        upstreamRequests.push({
          headers: new Headers(init?.headers),
          envelope,
        })
        return new Response("private upstream response", { status: 202 })
      },
    ) as typeof fetch
    let requestIndex = 0
    const handler = createContactPostHandler({
      getSiteUrl: () => configuration.siteUrl,
      getConfiguration: () => ({ ready: true, configuration }),
      now: () => Date.parse("2026-08-17T12:00:01.000Z"),
      randomUUID: () => requestIds[requestIndex++] ?? crypto.randomUUID(),
      rateLimiter: createInMemoryRateLimiter({ limit: 5 }),
      intentRegistry: createSubmissionIntentRegistry(),
      send: async ({ envelope }) =>
        sendContactToN8n({
          configuration: {
            webhookUrl: configuration.webhookUrl,
            webhookAuthorization: configuration.webhookAuthorization,
          },
          envelope,
          fetchImplementation,
        }),
    })

    const first = await handler(browserRequest())
    const second = await handler(browserRequest())

    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(upstreamRequests).toHaveLength(2)
    expect(
      upstreamRequests.map(({ headers }) => headers.get("idempotency-key")),
    ).toEqual([logicalSubmissionId, logicalSubmissionId])
    expect(
      upstreamRequests.map(({ envelope }) => envelope.idempotency_key),
    ).toEqual([logicalSubmissionId, logicalSubmissionId])
    expect(
      upstreamRequests.map(({ headers }) =>
        headers.get("x-brunova-request-id"),
      ),
    ).toEqual(requestIds)
    expect(upstreamRequests.map(({ envelope }) => envelope.request_id)).toEqual(
      requestIds,
    )
    expect(new Set(requestIds).size).toBe(2)

    for (const { headers, envelope } of upstreamRequests) {
      expect(headers.get("authorization")).toBe(
        `Basic ${Buffer.from("server-only-user:server-only-password").toString("base64")}`,
      )
      expect(JSON.stringify(envelope)).not.toContain("192.0.2.44")
      expect(envelope).not.toHaveProperty("website")
      expect(envelope).not.toHaveProperty("formStartedAt")
      expect(JSON.stringify(envelope)).not.toContain("server-only-user")
      expect(JSON.stringify(envelope)).not.toContain("server-only-password")
    }
  })

  it("rejects unknown browser fields before the operational workflow", async () => {
    const send = vi.fn(async () => true)
    const handler = createContactPostHandler({
      getSiteUrl: () => configuration.siteUrl,
      getConfiguration: () => ({ ready: true, configuration }),
      rateLimiter: createInMemoryRateLimiter({ limit: 5 }),
      intentRegistry: createSubmissionIntentRegistry(),
      send,
    })
    const request = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": logicalSubmissionId,
        Origin: "http://localhost:3000",
        "Sec-Fetch-Site": "same-origin",
      },
      body: JSON.stringify({ ...browserPayload, internalRole: "admin" }),
    })

    expect((await handler(request)).status).toBe(400)
    expect(send).not.toHaveBeenCalled()
  })

  it("does not retry an ambiguous upstream result", async () => {
    const fetchImplementation = vi.fn(async () =>
      Promise.resolve(new Response("ambiguous", { status: 502 })),
    ) as typeof fetch

    expect(
      await sendContactToN8n({
        configuration: {
          webhookUrl: configuration.webhookUrl,
          webhookAuthorization: configuration.webhookAuthorization,
        },
        envelope: {
          request_id: requestIds[0] ?? "",
          idempotency_key: logicalSubmissionId,
          source: "brunova_website",
          form: "contact_v1",
          submitted_at: "2026-08-17T12:00:01.000Z",
          name: browserPayload.name,
          email: browserPayload.email,
          company: browserPayload.company,
          role: browserPayload.role,
          problem_category: browserPayload.problemCategory,
          problem_description: browserPayload.problemDescription,
          page_path: "/contact",
          utm: browserPayload.utm,
        },
        fetchImplementation,
      }),
    ).toBe(false)
    expect(fetchImplementation).toHaveBeenCalledTimes(1)
  })
})
