export type ResponseHeader = { key: string; value: string }

export function createContentSecurityPolicy({
  production,
}: {
  production: boolean
}): string {
  const scriptSources = ["'self'", "'unsafe-inline'"]
  const connectSources = ["'self'"]

  if (!production) {
    scriptSources.push("'unsafe-eval'")
    connectSources.push("ws:")
  }

  return [
    "default-src 'self'",
    "base-uri 'self'",
    `connect-src ${connectSources.join(" ")}`,
    "font-src 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "frame-src 'none'",
    "img-src 'self' data: blob:",
    "manifest-src 'self'",
    "media-src 'self'",
    "object-src 'none'",
    `script-src ${scriptSources.join(" ")}`,
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self' blob:",
    ...(production ? ["upgrade-insecure-requests"] : []),
  ].join("; ")
}

export function createSecurityHeaders({
  production,
}: {
  production: boolean
}): ResponseHeader[] {
  return [
    {
      key: "Content-Security-Policy",
      value: createContentSecurityPolicy({ production }),
    },
    { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
    { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "X-Frame-Options", value: "DENY" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    ...(production
      ? [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ]
      : []),
  ]
}

export const apiBoundaryHeaders: ResponseHeader[] = [
  { key: "Cache-Control", value: "no-store" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
]

export const portalBoundaryHeaders: ResponseHeader[] = [
  { key: "Cache-Control", value: "private, no-store" },
  { key: "X-Robots-Tag", value: "noindex, follow" },
]
