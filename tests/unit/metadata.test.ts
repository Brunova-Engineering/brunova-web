import { describe, expect, it } from "vitest"

import { createPageMetadata } from "@/lib/metadata"

describe("page metadata", () => {
  it("sets canonical, Open Graph, and social metadata", () => {
    const metadata = createPageMetadata({
      title: "Selected systems",
      description: "An anonymized portfolio.",
      path: "/work",
    })

    expect(metadata.alternates).toEqual({
      canonical: "/work",
      languages: { "x-default": "/work", en: "/work", es: "/es/work" },
    })
    expect(metadata.openGraph).toMatchObject({
      type: "website",
      title: "Selected systems",
      url: "/work",
    })
    expect(metadata.twitter).toMatchObject({
      card: "summary",
      title: "Selected systems",
    })
  })

  it("localizes canonical and social URLs without changing route semantics", () => {
    const metadata = createPageMetadata({
      title: "Sistemas seleccionados",
      description: "Un portafolio anonimizado.",
      path: "/work",
      locale: "es",
    })

    expect(metadata.alternates).toMatchObject({ canonical: "/es/work" })
    expect(metadata.openGraph).toMatchObject({ url: "/es/work" })
  })

  it("supports intentional noindex route boundaries", () => {
    const metadata = createPageMetadata({
      title: "Portal",
      description: "Controlled access.",
      path: "/portal",
      noIndex: true,
    })

    expect(metadata.robots).toEqual({ index: false, follow: true })
  })
})
