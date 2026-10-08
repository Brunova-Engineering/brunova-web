import { describe, expect, it } from "vitest"

import {
  browserContactFieldErrors,
  type BrowserContactRequest,
} from "@/lib/contact/client-validation"

const validRequest: BrowserContactRequest = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  company: "Analytical Engines",
  role: "Chief Operating Officer",
  problemCategory: "fragmented_systems",
  problemDescription:
    "Our operating data is fragmented across systems and manual handoffs.",
  pagePath: "/contact",
  utm: {
    source: null,
    medium: null,
    campaign: null,
    term: null,
    content: null,
  },
  website: "",
  formStartedAt: 1,
}

describe("browser contact validation", () => {
  it("accepts the public valid shape without shipping the server schema", () => {
    expect(browserContactFieldErrors(validRequest)).toEqual({})
  })

  it("returns stable field messages before the authoritative server check", () => {
    expect(
      browserContactFieldErrors({
        ...validRequest,
        email: "not-an-email",
        problemCategory: "unknown",
        problemDescription: "Too short",
      }),
    ).toEqual({
      email: ["Enter a valid work email address."],
      problemCategory: ["Choose the category closest to the problem."],
      problemDescription: [
        "Describe the operational problem using 30–4,000 characters.",
      ],
    })
  })
})
