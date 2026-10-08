import { describe, expect, it } from "vitest"

import {
  apiBoundaryHeaders,
  createContentSecurityPolicy,
  createSecurityHeaders,
  portalBoundaryHeaders,
} from "@/lib/security"

describe("production security headers", () => {
  it("keeps the production CSP narrow without unsafe-eval", () => {
    const policy = createContentSecurityPolicy({ production: true })

    expect(policy).toContain("default-src 'self'")
    expect(policy).toContain("frame-ancestors 'none'")
    expect(policy).toContain("object-src 'none'")
    expect(policy).toContain("base-uri 'self'")
    expect(policy).toContain("form-action 'self'")
    expect(policy).toContain("connect-src 'self'")
    expect(policy).not.toContain("'unsafe-eval'")
    expect(policy).not.toContain("https://*")
  })

  it("limits unsafe-eval to the development policy", () => {
    expect(createContentSecurityPolicy({ production: false })).toContain(
      "'unsafe-eval'",
    )
    expect(createContentSecurityPolicy({ production: false })).toContain(
      "connect-src 'self' ws:",
    )
  })

  it("adds HSTS only to production and preserves boundary headers", () => {
    const production = createSecurityHeaders({ production: true })
    const development = createSecurityHeaders({ production: false })

    expect(production).toContainEqual({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains",
    })
    expect(development.map(({ key }) => key)).not.toContain(
      "Strict-Transport-Security",
    )
    expect(apiBoundaryHeaders).toContainEqual({
      key: "Cache-Control",
      value: "no-store",
    })
    expect(portalBoundaryHeaders).toContainEqual({
      key: "X-Robots-Tag",
      value: "noindex, follow",
    })
  })
})
