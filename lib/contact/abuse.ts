import { createHash } from "node:crypto"

import type { ContactRequest } from "@/lib/contact/schema"

const INTENT_MEMORY_MS = 15 * 60 * 1000

type IntentEntry = { digest: string; expiresAt: number }

export type AbuseAssessment = {
  reject: boolean
  signals: readonly string[]
}

export type SubmissionIntentRegistry = {
  assess: (input: {
    idempotencyKey: string
    request: ContactRequest
    now: number
  }) => AbuseAssessment
}

function digestIntent(request: ContactRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        name: request.name,
        email: request.email,
        company: request.company,
        role: request.role,
        problemCategory: request.problemCategory,
        problemDescription: request.problemDescription,
        pagePath: request.pagePath,
        utm: request.utm,
      }),
    )
    .digest("hex")
}

export function createSubmissionIntentRegistry(): SubmissionIntentRegistry {
  const entries = new Map<string, IntentEntry>()

  return {
    assess({ idempotencyKey, request, now }) {
      const signals: string[] = []
      const elapsed = now - request.formStartedAt
      const completedQuickly = request.formStartedAt > 0 && elapsed < 3_000
      const futureTimestamp = request.formStartedAt > now + 60_000

      if (request.website) signals.push("honeypot")
      if (completedQuickly) signals.push("rapid_completion")
      if (futureTimestamp) signals.push("invalid_timing")

      const digest = digestIntent(request)
      const existing = entries.get(idempotencyKey)
      if (existing && existing.expiresAt > now && existing.digest !== digest) {
        signals.push("inconsistent_idempotency_intent")
      } else {
        entries.set(idempotencyKey, {
          digest,
          expiresAt: now + INTENT_MEMORY_MS,
        })
      }

      const score = signals.reduce((total, signal) => {
        if (signal === "honeypot") return total + 4
        if (signal === "invalid_timing") return total + 2
        if (signal === "inconsistent_idempotency_intent") return total + 2
        return total + 1
      }, 0)

      return { reject: score >= 3, signals }
    },
  }
}

export const submissionIntentRegistry = createSubmissionIntentRegistry()
