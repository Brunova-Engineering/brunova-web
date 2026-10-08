import { beforeEach, describe, expect, it } from "vitest"

import {
  captureFirstTouchAttribution,
  contactAttribution,
  resetFirstTouchAttribution,
} from "@/lib/attribution"

describe("first-touch attribution", () => {
  beforeEach(() => resetFirstTouchAttribution())

  it("captures UTM values once and preserves the original touch", () => {
    const firstTouch = captureFirstTouchAttribution({
      search: "?utm_source=brief&utm_medium=referral&utm_campaign=br-017",
      landingPath: "/?utm_source=brief",
      referrer: "https://example.com/source",
      currentHost: "brunova.mx",
      now: () => new Date("2026-08-16T12:00:00.000Z"),
    })
    const repeatedTouch = captureFirstTouchAttribution({
      search: "?utm_source=changed",
      landingPath: "/work",
      referrer: "",
      currentHost: "brunova.mx",
    })

    expect(firstTouch).toMatchObject({
      utm_source: "brief",
      utm_medium: "referral",
      utm_campaign: "br-017",
      capturedAt: "2026-08-16T12:00:00.000Z",
      firstLandingPath: "/",
      firstLandingLocale: "en",
      firstReferrerHost: "example.com",
      sourceCategory: "campaign",
    })
    expect(repeatedTouch).toEqual(firstTouch)
  })

  it("captures ordinary search and AI referrals without their full URLs", () => {
    const attribution = captureFirstTouchAttribution({
      search: "",
      landingPath: "/es/process",
      referrer: "https://www.google.com.mx/search?q=sensitive-query",
      currentHost: "brunova.mx",
    })

    expect(attribution).toMatchObject({
      firstLandingPath: "/es/process",
      firstLandingLocale: "es",
      firstReferrerHost: "www.google.com.mx",
      sourceCategory: "organic_search",
      sourceName: "google",
    })
    expect(JSON.stringify(attribution)).not.toContain("sensitive-query")
  })

  it("provides a bounded direct fallback for contact submission", () => {
    expect(
      contactAttribution({
        landingPath: "/contact",
        locale: "en",
      }),
    ).toEqual({
      firstTouch: {
        referrerHost: null,
        landingPath: "/contact",
        landingLocale: "en",
        sourceCategory: "direct",
        sourceName: null,
      },
      utm: {
        source: null,
        medium: null,
        campaign: null,
        term: null,
        content: null,
      },
    })
  })
})
