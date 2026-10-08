import { describe, expect, it, vi } from "vitest"

import { configureAnalytics, trackEvent } from "@/lib/analytics"

describe("analytics abstraction", () => {
  it("is a no-op until an approved adapter is configured", () => {
    expect(() => trackEvent("portal_clicked")).not.toThrow()
  })

  it("forwards typed events to a configured adapter", () => {
    const track = vi.fn()
    const restore = configureAnalytics({ track })

    trackEvent("cta_start_conversation", { location: "header" })

    expect(track).toHaveBeenCalledWith({
      name: "cta_start_conversation",
      properties: { location: "header" },
    })
    restore()
  })
})
