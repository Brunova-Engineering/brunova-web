import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

const roots = ["app", "components"]
const credentialNames = [
  "N8N_CONTACT_BASIC_AUTH_USER",
  "N8N_CONTACT_BASIC_AUTH_PASSWORD",
  "N8N_CONTACT_WEBHOOK_SECRET",
]

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.(?:ts|tsx|js|jsx)$/.test(entry.name) ? [path] : []
  })
}

describe("contact credential boundary", () => {
  it("keeps upstream credential names out of client components", () => {
    const clientSources = roots
      .flatMap(sourceFiles)
      .map((path) => ({ path, source: readFileSync(path, "utf8") }))
      .filter(({ source }) => /^\s*["']use client["']/m.test(source))

    for (const { path, source } of clientSources) {
      for (const name of credentialNames) {
        expect(source, `${name} leaked into ${path}`).not.toContain(name)
      }
      expect(source, `server environment imported by ${path}`).not.toContain(
        'from "@/lib/env"',
      )
      expect(source, `n8n adapter imported by ${path}`).not.toContain(
        'from "@/lib/contact/n8n"',
      )
    }
  })
})
