import { z } from "zod"

const externalHttpUrl = z
  .url()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "Expected an HTTP or HTTPS URL",
  })

const booleanEnvironmentValue = z
  .enum(["true", "false"])
  .default("false")
  .transform((value) => value === "true")

const serverEnvironmentSchema = z.object({
  SITE_URL: externalHttpUrl.default("http://localhost:3000"),
  SEO_INDEXING_ENABLED: booleanEnvironmentValue,
  N8N_CONTACT_WEBHOOK_URL: externalHttpUrl.optional(),
  N8N_CONTACT_WEBHOOK_SECRET: z.string().min(1).optional(),
  N8N_CONTACT_BASIC_AUTH_USER: z.string().min(1).optional(),
  N8N_CONTACT_BASIC_AUTH_PASSWORD: z.string().min(1).optional(),
  CONTACT_RATE_LIMIT_SALT: z.string().min(16).optional(),
  PORTAL_URL: externalHttpUrl.optional(),
})

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>

let cachedEnvironment: ServerEnvironment | undefined

function isLoopbackUrl(url: URL): boolean {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
}

function assertCanonicalSiteUrl(
  siteUrl: URL,
  indexingEnabled: boolean,
  nodeEnvironment: string | undefined,
) {
  if (
    siteUrl.username ||
    siteUrl.password ||
    siteUrl.pathname !== "/" ||
    siteUrl.search ||
    siteUrl.hash
  ) {
    throw new Error("SITE_URL must contain only the canonical site origin")
  }

  if (
    nodeEnvironment === "production" &&
    !isLoopbackUrl(siteUrl) &&
    siteUrl.protocol !== "https:"
  ) {
    throw new Error("Production SITE_URL must use HTTPS")
  }

  if (
    indexingEnabled &&
    (siteUrl.protocol !== "https:" || isLoopbackUrl(siteUrl))
  ) {
    throw new Error(
      "SEO_INDEXING_ENABLED requires a non-loopback HTTPS SITE_URL",
    )
  }
}

function assertProductionHttps(
  value: string | undefined,
  name: "N8N_CONTACT_WEBHOOK_URL" | "PORTAL_URL",
  nodeEnvironment: string | undefined,
) {
  if (!value || nodeEnvironment !== "production") return

  const url = new URL(value)
  if (!isLoopbackUrl(url) && url.protocol !== "https:") {
    throw new Error(`Production ${name} must use HTTPS`)
  }
}

export function parseServerEnvironment(
  environment: NodeJS.ProcessEnv,
): ServerEnvironment {
  const parsed = serverEnvironmentSchema.parse({
    SITE_URL: environment.SITE_URL,
    SEO_INDEXING_ENABLED: environment.SEO_INDEXING_ENABLED || undefined,
    N8N_CONTACT_WEBHOOK_URL: environment.N8N_CONTACT_WEBHOOK_URL || undefined,
    N8N_CONTACT_WEBHOOK_SECRET:
      environment.N8N_CONTACT_WEBHOOK_SECRET || undefined,
    N8N_CONTACT_BASIC_AUTH_USER:
      environment.N8N_CONTACT_BASIC_AUTH_USER || undefined,
    N8N_CONTACT_BASIC_AUTH_PASSWORD:
      environment.N8N_CONTACT_BASIC_AUTH_PASSWORD || undefined,
    CONTACT_RATE_LIMIT_SALT: environment.CONTACT_RATE_LIMIT_SALT || undefined,
    PORTAL_URL: environment.PORTAL_URL || undefined,
  })

  assertCanonicalSiteUrl(
    new URL(parsed.SITE_URL),
    parsed.SEO_INDEXING_ENABLED,
    environment.NODE_ENV,
  )

  assertProductionHttps(
    parsed.N8N_CONTACT_WEBHOOK_URL,
    "N8N_CONTACT_WEBHOOK_URL",
    environment.NODE_ENV,
  )
  assertProductionHttps(parsed.PORTAL_URL, "PORTAL_URL", environment.NODE_ENV)

  return parsed
}

export function getServerEnvironment(): ServerEnvironment {
  cachedEnvironment ??= parseServerEnvironment(process.env)

  return cachedEnvironment
}

export function getSiteUrl(): URL {
  return new URL(getServerEnvironment().SITE_URL)
}

export function getPortalUrl(): URL | undefined {
  const portalUrl = getServerEnvironment().PORTAL_URL
  return portalUrl ? new URL(portalUrl) : undefined
}

export function isSeoIndexingEnabled(): boolean {
  return getServerEnvironment().SEO_INDEXING_ENABLED
}

export type ContactRuntimeConfiguration = {
  siteUrl: URL
  webhookUrl: URL
  webhookAuthorization:
    | { type: "basic"; username: string; password: string }
    | { type: "bearer"; secret: string }
  rateLimitSalt: string
}

export function getContactRuntimeConfiguration():
  | { ready: true; configuration: ContactRuntimeConfiguration }
  | { ready: false } {
  const environment = getServerEnvironment()
  const webhookUrl = environment.N8N_CONTACT_WEBHOOK_URL
    ? new URL(environment.N8N_CONTACT_WEBHOOK_URL)
    : undefined
  const hasBasicUsername = Boolean(environment.N8N_CONTACT_BASIC_AUTH_USER)
  const hasBasicPassword = Boolean(environment.N8N_CONTACT_BASIC_AUTH_PASSWORD)
  const hasCompleteBasicAuth = hasBasicUsername && hasBasicPassword
  const hasBearerAuth = Boolean(environment.N8N_CONTACT_WEBHOOK_SECRET)

  const webhookAuthorization = hasCompleteBasicAuth
    ? {
        type: "basic" as const,
        username: environment.N8N_CONTACT_BASIC_AUTH_USER as string,
        password: environment.N8N_CONTACT_BASIC_AUTH_PASSWORD as string,
      }
    : hasBearerAuth
      ? {
          type: "bearer" as const,
          secret: environment.N8N_CONTACT_WEBHOOK_SECRET as string,
        }
      : undefined

  if (
    !webhookUrl ||
    !webhookAuthorization ||
    hasBasicUsername !== hasBasicPassword ||
    (hasCompleteBasicAuth && hasBearerAuth) ||
    !environment.CONTACT_RATE_LIMIT_SALT ||
    (webhookUrl.protocol !== "https:" && !isLoopbackUrl(webhookUrl))
  ) {
    return { ready: false }
  }

  return {
    ready: true,
    configuration: {
      siteUrl: new URL(environment.SITE_URL),
      webhookUrl,
      webhookAuthorization,
      rateLimitSalt: environment.CONTACT_RATE_LIMIT_SALT,
    },
  }
}
