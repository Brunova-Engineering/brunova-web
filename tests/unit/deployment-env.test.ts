import { describe, expect, it } from "vitest"

import { validateProductionEnvironment } from "../../scripts/validate-production-env.mjs"

const validEnvironment = {
  BIND_ADDRESS: "127.0.0.1",
  PORT: "3000",
  SEO_INDEXING_ENABLED: "true",
  SITE_URL: "https://brunova.example",
}

describe("production deployment environment", () => {
  it("accepts the public site with optional integrations disabled", () => {
    expect(validateProductionEnvironment(validEnvironment)).toEqual({
      contactEnabled: false,
      portalEnabled: false,
      siteOrigin: "https://brunova.example",
    })
  })

  it("accepts complete HTTPS contact and portal configuration", () => {
    expect(
      validateProductionEnvironment({
        ...validEnvironment,
        CONTACT_RATE_LIMIT_SALT: "safe-example-salt-value",
        N8N_CONTACT_BASIC_AUTH_PASSWORD: "safe-example-password",
        N8N_CONTACT_BASIC_AUTH_USER: "safe-example-user",
        N8N_CONTACT_WEBHOOK_URL: "https://automation.example/webhook/contact",
        PORTAL_URL: "https://portal.example/client",
      }),
    ).toMatchObject({ contactEnabled: true, portalEnabled: true })
  })

  it("rejects non-canonical or non-HTTPS production origins", () => {
    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        SITE_URL: "http://brunova.example/path",
      }),
    ).toThrow("SITE_URL")
  })

  it("rejects partially configured contact delivery", () => {
    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        N8N_CONTACT_WEBHOOK_URL: "https://automation.example/webhook/contact",
      }),
    ).toThrow("rate-limit salt")
  })

  it("rejects partial or ambiguous Basic Auth configuration", () => {
    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        CONTACT_RATE_LIMIT_SALT: "safe-example-salt-value",
        N8N_CONTACT_BASIC_AUTH_USER: "safe-example-user",
        N8N_CONTACT_WEBHOOK_URL: "https://automation.example/webhook/contact",
      }),
    ).toThrow("both username and password")

    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        CONTACT_RATE_LIMIT_SALT: "safe-example-salt-value",
        N8N_CONTACT_BASIC_AUTH_PASSWORD: "safe-example-password",
        N8N_CONTACT_BASIC_AUTH_USER: "safe-example-user",
        N8N_CONTACT_WEBHOOK_SECRET: "safe-example-secret",
        N8N_CONTACT_WEBHOOK_URL: "https://automation.example/webhook/contact",
      }),
    ).toThrow("mutually exclusive")
  })

  it("retains complete legacy Bearer configuration", () => {
    expect(
      validateProductionEnvironment({
        ...validEnvironment,
        CONTACT_RATE_LIMIT_SALT: "safe-example-salt-value",
        N8N_CONTACT_WEBHOOK_SECRET: "safe-example-secret",
        N8N_CONTACT_WEBHOOK_URL: "https://automation.example/webhook/contact",
      }),
    ).toMatchObject({ contactEnabled: true })
  })

  it("rejects public exposure of the application port", () => {
    expect(() =>
      validateProductionEnvironment({
        ...validEnvironment,
        BIND_ADDRESS: "0.0.0.0",
      }),
    ).toThrow("127.0.0.1")
  })
})
