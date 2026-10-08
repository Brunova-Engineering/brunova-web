import { describe, expect, it } from "vitest"

import { contactRequestSchema } from "@/lib/contact/schema"

const validRequest = {
  name: "  Ada Lovelace  ",
  email: "  ADA@EXAMPLE.COM ",
  company: "  Analytical Engines  ",
  role: "  Chief Operating Officer  ",
  problemCategory: "fragmented_systems",
  problemDescription:
    "Our operating data is fragmented across systems and manual handoffs.",
  pagePath: "/contact",
  utm: {
    source: "referral",
    medium: null,
    campaign: null,
    term: null,
    content: null,
  },
  website: "",
  formStartedAt: 1,
}

describe("contact request schema", () => {
  it("normalizes accepted public fields", () => {
    const parsed = contactRequestSchema.parse(validRequest)

    expect(parsed).toMatchObject({
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: "Analytical Engines",
      role: "Chief Operating Officer",
    })
  })

  it("accepts only approved categories", () => {
    expect(
      contactRequestSchema.safeParse({
        ...validRequest,
        problemCategory: "sales_demo",
      }).success,
    ).toBe(false)
  })

  it("rejects short, oversized and unknown input", () => {
    expect(
      contactRequestSchema.safeParse({
        ...validRequest,
        problemDescription: "Too short",
      }).success,
    ).toBe(false)

    expect(
      contactRequestSchema.safeParse({
        ...validRequest,
        utm: { ...validRequest.utm, source: "x".repeat(201) },
      }).success,
    ).toBe(false)

    expect(
      contactRequestSchema.safeParse({
        ...validRequest,
        budget: "$100,000",
      }).success,
    ).toBe(false)
  })
})
