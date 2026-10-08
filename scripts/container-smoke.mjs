const applicationOrigin = "http://127.0.0.1:3000"
const publicRoutes = [
  "/",
  "/capabilities",
  "/process",
  "/work",
  "/work/multi-tenant-financial-integration-platform",
  "/about",
  "/contact",
  "/privacy",
  "/portal",
  "/es",
]

async function expectStatus(path, expectedStatus) {
  const response = await fetch(new URL(path, applicationOrigin), {
    redirect: "manual",
  })
  if (response.status !== expectedStatus) {
    throw new Error(
      `${path} returned ${response.status}; expected ${expectedStatus}`,
    )
  }
  return response
}

for (const route of publicRoutes) await expectStatus(route, 200)
await expectStatus("/this-route-must-not-exist", 404)

const health = await expectStatus("/api/health", 200)
if ((await health.json()).status !== "ok")
  throw new Error("Health payload is invalid")
if (health.headers.get("cache-control") !== "no-store") {
  throw new Error("Health endpoint must remain no-store")
}

const homepage = await expectStatus("/", 200)
for (const header of [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
]) {
  if (!homepage.headers.has(header))
    throw new Error(`Missing security header: ${header}`)
}

const portal = await expectStatus("/portal", 200)
if (!portal.headers.get("x-robots-tag")?.includes("noindex")) {
  throw new Error("Portal must remain noindex")
}

const robots = await expectStatus("/robots.txt", 200)
const robotsBody = await robots.text()
if (!robotsBody.includes("Allow: /") || robotsBody.includes("Disallow: /\n")) {
  throw new Error("Production robots policy is not indexable")
}

const sitemap = await expectStatus("/sitemap.xml", 200)
const sitemapBody = await sitemap.text()
if (!sitemapBody.includes(process.env.SITE_URL)) {
  throw new Error("Sitemap does not use SITE_URL")
}

const configured = (value) =>
  typeof value === "string" && value.trim().length > 0
const bearerConfigured = configured(process.env.N8N_CONTACT_WEBHOOK_SECRET)
const basicConfigured =
  configured(process.env.N8N_CONTACT_BASIC_AUTH_USER) &&
  configured(process.env.N8N_CONTACT_BASIC_AUTH_PASSWORD)
const contactConfigured =
  configured(process.env.N8N_CONTACT_WEBHOOK_URL) &&
  configured(process.env.CONTACT_RATE_LIMIT_SALT) &&
  (bearerConfigured || basicConfigured) &&
  !(bearerConfigured && basicConfigured)

if (!contactConfigured) {
  const contact = await fetch(new URL("/api/contact", applicationOrigin), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": "00000000-0000-4000-8000-000000000001",
      Origin: new URL(process.env.SITE_URL).origin,
      "Sec-Fetch-Site": "same-origin",
    },
    body: JSON.stringify({
      name: "Production Check",
      email: "operations@example.com",
      company: "Brunova Verification",
      role: "Operator",
      problemCategory: "fragmented_systems",
      problemDescription:
        "Controlled deployment verification with no downstream delivery configured.",
      pagePath: "/contact",
      locale: "en",
      utm: {
        source: null,
        medium: null,
        campaign: null,
        term: null,
        content: null,
      },
      website: "",
      formStartedAt: Date.now() - 10_000,
    }),
  })
  if (contact.status !== 503) {
    throw new Error(
      `Unconfigured contact endpoint returned ${contact.status}; expected 503`,
    )
  }
}

console.log(
  `Container smoke passed (contact delivery: ${contactConfigured ? "configured; submission skipped" : "disabled; fail-closed verified"}).`,
)
