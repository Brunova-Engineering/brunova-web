import { describe, expect, it } from "vitest"

import {
  equivalentLocalePath,
  languageAlternates,
  localizedPath,
  pathLocale,
} from "@/lib/i18n"

describe("localized public routing", () => {
  it("keeps English canonical and prefixes Spanish", () => {
    expect(localizedPath("en", "/work/example")).toBe("/work/example")
    expect(localizedPath("es", "/work/example")).toBe("/es/work/example")
    expect(localizedPath("es", "/")).toBe("/es")
  })

  it("preserves equivalent routes in both directions", () => {
    expect(equivalentLocalePath("/work/example", "es")).toBe("/es/work/example")
    expect(equivalentLocalePath("/es/work/example", "en")).toBe("/work/example")
    expect(pathLocale("/es/contact")).toBe("es")
  })

  it("emits canonical hreflang mappings", () => {
    expect(languageAlternates("/privacy")).toEqual({
      "x-default": "/privacy",
      en: "/privacy",
      es: "/es/privacy",
    })
  })
})
