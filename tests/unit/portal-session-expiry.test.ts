import { afterEach, expect, it, vi } from "vitest"
import { acquisitionApi, AcquisitionError } from "@/lib/acquisition-api"
import {
  portalSessionExpiredEvent,
  sessionExpiryDelay,
} from "@/lib/portal-session-expiry"

afterEach(() => vi.unstubAllGlobals())

it("bounds the session timer to the exact expiry and recognizes an already expired session", () => {
  const now = Date.parse("2026-09-22T01:00:00Z")
  expect(sessionExpiryDelay("2026-09-22T01:00:10Z", now)).toBe(10_000)
  expect(sessionExpiryDelay("2026-09-22T00:59:59Z", now)).toBe(0)
  expect(sessionExpiryDelay("invalid", now)).toBeNull()
})

it("signals session loss on a 401, but not on a provider outage", async () => {
  const events: string[] = []
  window.addEventListener(
    portalSessionExpiredEvent,
    () => events.push("expired"),
    {
      once: true,
    },
  )
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 401 })),
  )
  await expect(acquisitionApi.contract()).rejects.toEqual(
    new AcquisitionError(401),
  )
  expect(events).toEqual(["expired"])

  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 503 })),
  )
  await expect(acquisitionApi.contract()).rejects.toEqual(
    new AcquisitionError(503),
  )
  expect(events).toEqual(["expired"])
})
