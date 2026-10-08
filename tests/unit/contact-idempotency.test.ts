import { describe, expect, it } from "vitest"

import {
  applyMaterialEdit,
  completeSubmission,
  createIdempotencyState,
  markSubmissionAttempt,
} from "@/lib/contact/idempotency"

describe("contact idempotency state", () => {
  it("preserves one key through recoverable retries", () => {
    const state = createIdempotencyState(() => "key-one")
    const attempted = markSubmissionAttempt(state, "same-intent")
    const retry = markSubmissionAttempt(attempted, "same-intent")

    expect(retry.key).toBe("key-one")
  })

  it("rotates only after a material post-attempt edit", () => {
    const attempted = markSubmissionAttempt(
      createIdempotencyState(() => "key-one"),
      "first-intent",
    )

    expect(
      applyMaterialEdit(attempted, "first-intent", () => "key-two").key,
    ).toBe("key-one")
    expect(
      applyMaterialEdit(attempted, "edited-intent", () => "key-two").key,
    ).toBe("key-two")
  })

  it("rotates after confirmed success", () => {
    const state = createIdempotencyState(() => "key-one")
    expect(completeSubmission(state, () => "key-two").key).toBe("key-two")
  })
})
