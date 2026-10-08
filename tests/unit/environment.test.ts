import { afterEach, describe, expect, it, vi } from "vitest"

describe("server environment", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it("returns a controlled HTTP portal destination", async () => {
    vi.stubEnv("PORTAL_URL", "https://portal.example.test/client")
    const { getPortalUrl } = await import("@/lib/env")

    expect(getPortalUrl()?.href).toBe("https://portal.example.test/client")
  })

  it("rejects a non-HTTP portal protocol", async () => {
    vi.stubEnv("PORTAL_URL", "ftp://portal.example.test/client")
    const { getPortalUrl } = await import("@/lib/env")

    expect(() => getPortalUrl()).toThrow("Expected an HTTP or HTTPS URL")
  })

  it("requires an origin-only canonical SITE_URL", async () => {
    const { parseServerEnvironment } = await import("@/lib/env")

    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "https://brunova.example/site?preview=true",
      }),
    ).toThrow("SITE_URL must contain only the canonical site origin")
  })

  it("requires HTTPS for non-loopback production URLs", async () => {
    const { parseServerEnvironment } = await import("@/lib/env")

    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "http://brunova.example",
      }),
    ).toThrow("Production SITE_URL must use HTTPS")
    expect(
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "http://localhost:3000",
      }).SITE_URL,
    ).toBe("http://localhost:3000")
  })

  it("allows indexing only for a canonical non-loopback HTTPS URL", async () => {
    const { parseServerEnvironment } = await import("@/lib/env")

    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "http://localhost:3000",
        SEO_INDEXING_ENABLED: "true",
      }),
    ).toThrow("SEO_INDEXING_ENABLED requires")
    expect(
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "https://brunova.example",
        SEO_INDEXING_ENABLED: "true",
      }).SEO_INDEXING_ENABLED,
    ).toBe(true)
  })

  it("rejects insecure external production portal URLs", async () => {
    const { parseServerEnvironment } = await import("@/lib/env")

    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "https://brunova.example",
        PORTAL_URL: "http://portal.example.test/client",
      }),
    ).toThrow("Production PORTAL_URL must use HTTPS")
  })

  it("rejects insecure external production webhook URLs", async () => {
    const { parseServerEnvironment } = await import("@/lib/env")

    expect(() =>
      parseServerEnvironment({
        NODE_ENV: "production",
        SITE_URL: "https://brunova.example",
        N8N_CONTACT_WEBHOOK_URL: "http://automation.example.test/contact",
      }),
    ).toThrow("Production N8N_CONTACT_WEBHOOK_URL must use HTTPS")
  })

  it.each([
    ["username", "N8N_CONTACT_BASIC_AUTH_PASSWORD"],
    ["password", "N8N_CONTACT_BASIC_AUTH_USER"],
  ])("fails closed when the Basic Auth %s is missing", async (_label, key) => {
    vi.stubEnv("N8N_CONTACT_WEBHOOK_URL", "https://automation.example/contact")
    vi.stubEnv("CONTACT_RATE_LIMIT_SALT", "safe-contact-rate-limit-salt")
    vi.stubEnv(key, key.endsWith("USER") ? "test-user" : "test-password")

    const { getContactRuntimeConfiguration } = await import("@/lib/env")
    expect(getContactRuntimeConfiguration()).toEqual({ ready: false })
  })

  it("exposes complete Basic Auth only through the server runtime contract", async () => {
    vi.stubEnv("N8N_CONTACT_WEBHOOK_URL", "https://automation.example/contact")
    vi.stubEnv("N8N_CONTACT_BASIC_AUTH_USER", "test-user")
    vi.stubEnv("N8N_CONTACT_BASIC_AUTH_PASSWORD", "test-password")
    vi.stubEnv("CONTACT_RATE_LIMIT_SALT", "safe-contact-rate-limit-salt")

    const { getContactRuntimeConfiguration } = await import("@/lib/env")
    expect(getContactRuntimeConfiguration()).toMatchObject({
      ready: true,
      configuration: {
        webhookAuthorization: {
          type: "basic",
          username: "test-user",
          password: "test-password",
        },
      },
    })
  })
})
