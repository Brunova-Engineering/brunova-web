import { describe, expect, it } from "vitest"

import { GET } from "@/app/api/health/route"

describe("health route", () => {
  it("reports application health without external dependencies", async () => {
    const response = GET()

    await expect(response.json()).resolves.toEqual({ status: "ok" })
    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("no-store")
  })
})
