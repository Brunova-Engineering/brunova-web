import type { MetadataRoute } from "next"

import { localizedSiteConfig } from "@/content/locales"
import { workCases } from "@/content/work"
import { languageAlternates, localizedPath, type Locale } from "@/lib/i18n"

export const routeIndexingPolicy = [
  {
    path: "/",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Primary public company entry point.",
  },
  {
    path: "/capabilities",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Public description of Brunova capabilities.",
  },
  {
    path: "/process",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Public description of the engagement model.",
  },
  {
    path: "/work",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Public index of approved anonymized work.",
  },
  {
    path: "/work/[slug]",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Approved typed work records only.",
  },
  {
    path: "/about",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Public company narrative.",
  },
  {
    path: "/contact",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Public conversion route.",
  },
  {
    path: "/privacy",
    index: true,
    follow: true,
    sitemap: true,
    rationale: "Public transparency document; legal review remains required.",
  },
  {
    path: "/portal",
    index: false,
    follow: true,
    sitemap: false,
    rationale:
      "Controlled client-access boundary, not public acquisition content.",
  },
  {
    path: "/api/*",
    index: false,
    follow: false,
    sitemap: false,
    rationale: "Application interfaces are not search documents.",
  },
  {
    path: "error and internal states",
    index: false,
    follow: false,
    sitemap: false,
    rationale: "Non-content runtime states.",
  },
] as const

export const indexableStaticPaths = routeIndexingPolicy
  .filter((route) => route.index && route.sitemap && !route.path.includes("["))
  .map((route) => route.path)

export function getSitemapPaths(): string[] {
  return [
    ...indexableStaticPaths,
    ...workCases.map((work) => `/work/${work.slug}`),
  ]
}

export function createSitemap(siteUrl: URL): MetadataRoute.Sitemap {
  return getSitemapPaths().flatMap((path) =>
    (["en", "es"] as const).map((locale) => ({
      url: new URL(localizedPath(locale, path), siteUrl).href,
      alternates: {
        languages: Object.fromEntries(
          Object.entries(languageAlternates(path)).map(
            ([language, alternate]) => [
              language,
              new URL(alternate, siteUrl).href,
            ],
          ),
        ),
      },
    })),
  )
}

export function createRobots({
  indexingEnabled,
  siteUrl,
}: {
  indexingEnabled: boolean
  siteUrl: URL
}): MetadataRoute.Robots {
  return {
    rules: indexingEnabled
      ? {
          userAgent: "*",
          allow: "/",
          disallow: "/api/",
        }
      : {
          userAgent: "*",
          disallow: "/",
        },
    sitemap: new URL("/sitemap.xml", siteUrl).href,
    ...(indexingEnabled ? { host: siteUrl.origin } : {}),
  }
}

export function createSiteStructuredData(siteUrl: URL) {
  const siteConfig = localizedSiteConfig.en
  const websiteId = new URL("/#website", siteUrl).href
  const organizationId = new URL("/#organization", siteUrl).href
  const founderId = new URL("/#jorge-vera", siteUrl).href

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": websiteId,
        url: siteUrl.origin,
        name: siteConfig.name,
        inLanguage: ["en", "es"],
        publisher: { "@id": organizationId },
        about: { "@id": organizationId },
      },
      {
        "@type": "Organization",
        "@id": organizationId,
        name: siteConfig.name,
        url: siteUrl.origin,
        logo: new URL("/brand/brunova-mark.svg", siteUrl).href,
        description: siteConfig.description,
        founder: { "@id": founderId },
      },
      {
        "@type": "Person",
        "@id": founderId,
        name: "Jorge Vera",
        jobTitle: "Founder and Principal Systems Architect",
        worksFor: { "@id": organizationId },
      },
    ],
  } as const
}

export function createBreadcrumbStructuredData({
  siteUrl,
  locale,
  currentName,
  currentPath,
}: {
  siteUrl: URL
  locale: Locale
  currentName: string
  currentPath: string
}) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: locale === "es" ? "Sistemas" : "Systems",
        item: new URL(localizedPath(locale, "/work"), siteUrl).href,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: currentName,
        item: new URL(localizedPath(locale, currentPath), siteUrl).href,
      },
    ],
  } as const
}
