import { describe, expect, it, vi } from "vitest"

import { N8N_TIMEOUT_MS, sendContactToN8n } from "@/lib/contact/n8n"
import type { ContactEnvelope } from "@/lib/contact/types"

const envelope: ContactEnvelope = {
  request_id: "22222222-2222-4222-8222-222222222222",
  idempotency_key: "11111111-1111-4111-8111-111111111111",
  source: "brunova_website",
  form: "contact_v1",
  submitted_at: "2026-08-16T18:00:00.000Z",
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  role: "COO",
  problem_category: "fragmented_systems",
  problem_description:
    "Our operating data is fragmented across systems and manual handoffs.",
  page_path: "/contact",
  utm: {
    source: null,
    medium: null,
    campaign: null,
    term: null,
    content: null,
  },
}

const configuration = {
  webhookUrl: new URL("https://automation.example.test/contact"),
  webhookAuthorization: {
    type: "basic" as const,
    username: "server-user",
    password: "server-password",
  },
}

describe("n8n contact adapter", () => {
  it("retains the bounded eight-second upstream timeout", () => {
    expect(N8N_TIMEOUT_MS).toBe(8_000)
  })

  it("sends authentication and correlation only through headers", async () => {
    let capturedInit: RequestInit | undefined
    const fetchImplementation = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        capturedInit = init
        return new Response("not-json", { status: 202 })
      },
    ) as typeof fetch

    expect(
      await sendContactToN8n({
        configuration,
        envelope,
        fetchImplementation,
      }),
    ).toBe(true)

    const headers = new Headers(capturedInit?.headers)
    expect(headers.get("authorization")).toBe(
      `Basic ${Buffer.from("server-user:server-password").toString("base64")}`,
    )
    expect(headers.get("idempotency-key")).toBe(envelope.idempotency_key)
    expect(headers.get("x-brunova-request-id")).toBe(envelope.request_id)
    expect(capturedInit?.redirect).toBe("manual")
    expect(capturedInit?.body).not.toContain("server-user")
    expect(capturedInit?.body).not.toContain("server-password")
  })

  it("retains explicit legacy Bearer compatibility", async () => {
    let capturedInit: RequestInit | undefined
    const fetchImplementation = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) => {
        capturedInit = init
        return new Response(null, { status: 204 })
      },
    ) as typeof fetch

    expect(
      await sendContactToN8n({
        configuration: {
          webhookUrl: configuration.webhookUrl,
          webhookAuthorization: {
            type: "bearer",
            secret: "legacy-server-secret",
          },
        },
        envelope,
        fetchImplementation,
      }),
    ).toBe(true)
    expect(new Headers(capturedInit?.headers).get("authorization")).toBe(
      "Bearer legacy-server-secret",
    )
  })

  it("treats rejected upstream credentials as a recoverable failure", async () => {
    expect(
      await sendContactToN8n({
        configuration,
        envelope,
        fetchImplementation: vi.fn(async () =>
          Promise.resolve(new Response("private failure", { status: 401 })),
        ),
      }),
    ).toBe(false)
  })

  it("bounds upstream requests with an abort timeout", async () => {
    vi.useFakeTimers()
    const fetchImplementation = vi.fn(
      async (_input: URL | RequestInfo, init?: RequestInit) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError")),
          )
        }),
    )

    const pending = sendContactToN8n({
      configuration,
      envelope,
      fetchImplementation,
      timeoutMs: 50,
    })
    await vi.advanceTimersByTimeAsync(60)
    await expect(pending).resolves.toBe(false)
    vi.useRealTimers()
  })
})
