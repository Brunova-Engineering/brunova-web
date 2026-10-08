import { createHmac } from "node:crypto"
import { isIP } from "node:net"

export const CONTACT_RATE_LIMIT = 5
export const CONTACT_RATE_WINDOW_MS = 15 * 60 * 1000

type RateEntry = { count: number; expiresAt: number }

export type RateLimitResult =
  { allowed: true } | { allowed: false; retryAfterSeconds: number }

export type ContactRateLimiter = {
  check: (key: string) => RateLimitResult
}

export function trustedClientAddress(headers: Headers): string {
  const realAddress = headers.get("x-real-ip")?.trim()
  if (realAddress && isIP(realAddress)) return realAddress

  const forwardedAddress = headers.get("x-forwarded-for")?.split(",")[0]?.trim()

  return forwardedAddress && isIP(forwardedAddress)
    ? forwardedAddress
    : "address-unavailable"
}

export function hashClientAddress(address: string, salt: string): string {
  return createHmac("sha256", salt).update(address).digest("hex").slice(0, 32)
}

export function createInMemoryRateLimiter({
  limit = CONTACT_RATE_LIMIT,
  now = () => Date.now(),
  windowMs = CONTACT_RATE_WINDOW_MS,
}: {
  limit?: number
  now?: () => number
  windowMs?: number
} = {}): ContactRateLimiter {
  const entries = new Map<string, RateEntry>()

  return {
    check(key) {
      const currentTime = now()
      const existing = entries.get(key)

      if (!existing || existing.expiresAt <= currentTime) {
        entries.set(key, { count: 1, expiresAt: currentTime + windowMs })
        return { allowed: true }
      }

      if (existing.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.max(
            1,
            Math.ceil((existing.expiresAt - currentTime) / 1000),
          ),
        }
      }

      existing.count += 1
      return { allowed: true }
    },
  }
}

export const contactRateLimiter = createInMemoryRateLimiter()
