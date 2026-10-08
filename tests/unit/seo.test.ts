import { describe, expect, it } from "vitest"

import { workCases } from "@/content/work"
import {
  createBreadcrumbStructuredData,
  createRobots,
  createSitemap,
  createSiteStructuredData,
  getSitemapPaths,
  routeIndexingPolicy,
} from "@/lib/seo"
import { localizedPath } from "@/lib/i18n"

const productionUrl = new URL("https://brunova.example")

describe("technical SEO contracts", () => {
  it("builds the sitemap from approved routes and typed work slugs", () => {
    const paths = getSitemapPaths()
    const sitemap = createSitemap(productionUrl)

    expect(paths).toContain("/")
    expect(paths).toContain("/privacy")
    expect(paths).not.toContain("/portal")
    expect(paths).not.toContain("/api/health")
    expect(paths.filter((path) => path.startsWith("/work/"))).toEqual(
      workCases.map((work) => `/work/${work.slug}`),
    )
    expect(sitemap).toHaveLength(paths.length * 2)
    expect(sitemap.map(({ url }) => url)).toEqual(
      paths.flatMap((path) =>
        (["en", "es"] as const).map(
          (locale) => new URL(localizedPath(locale, path), productionUrl).href,
        ),
      ),
    )
    expect(sitemap[0]?.alternates?.languages).toEqual({
      "x-default": "https://brunova.example/",
      en: "https://brunova.example/",
      es: "https://brunova.example/es",
    })
  })

  it("allows production crawling while excluding runtime boundaries", () => {
    const robots = createRobots({
      indexingEnabled: true,
      siteUrl: productionUrl,
    })

    expect(robots).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: "/api/",
      },
      sitemap: "https://brunova.example/sitemap.xml",
      host: "https://brunova.example",
    })
  })

  it("disallows crawling by default outside canonical production", () => {
    const robots = createRobots({
      indexingEnabled: false,
      siteUrl: new URL("http://localhost:3000"),
    })

    expect(robots.rules).toEqual({ userAgent: "*", disallow: "/" })
    expect(robots.sitemap).toBe("http://localhost:3000/sitemap.xml")
    expect(robots).not.toHaveProperty("host")
  })

  it("records privacy as public and the portal as noindex", () => {
    expect(
      routeIndexingPolicy.find(({ path }) => path === "/privacy"),
    ).toMatchObject({ index: true, follow: true, sitemap: true })
    expect(
      routeIndexingPolicy.find(({ path }) => path === "/portal"),
    ).toMatchObject({ index: false, follow: true, sitemap: false })
  })

  it("emits a minimal linked WebSite, Organization and founder graph", () => {
    const structuredData = createSiteStructuredData(productionUrl)
    const [website, organization, founder] = structuredData["@graph"]

    expect(website).toMatchObject({
      "@type": "WebSite",
      "@id": "https://brunova.example/#website",
      publisher: { "@id": "https://brunova.example/#organization" },
      inLanguage: ["en", "es"],
    })
    expect(organization).toMatchObject({
      "@type": "Organization",
      "@id": "https://brunova.example/#organization",
      name: "Brunova",
      founder: { "@id": "https://brunova.example/#jorge-vera" },
    })
    expect(founder).toEqual({
      "@type": "Person",
      "@id": "https://brunova.example/#jorge-vera",
      name: "Jorge Vera",
      jobTitle: "Founder and Principal Systems Architect",
      worksFor: { "@id": "https://brunova.example/#organization" },
    })
    expect(JSON.stringify(structuredData)).not.toContain("sameAs")
    expect(JSON.stringify(structuredData)).not.toContain("address")
  })

  it("mirrors the visible Systems dossier breadcrumb hierarchy", () => {
    expect(
      createBreadcrumbStructuredData({
        siteUrl: productionUrl,
        locale: "es",
        currentName: "Automatización operativa",
        currentPath: "/work/fragile-automation-modernization",
      }),
    ).toMatchObject({
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          position: 1,
          name: "Sistemas",
          item: "https://brunova.example/es/work",
        },
        {
          position: 2,
          name: "Automatización operativa",
          item: "https://brunova.example/es/work/fragile-automation-modernization",
        },
      ],
    })
  })
})
