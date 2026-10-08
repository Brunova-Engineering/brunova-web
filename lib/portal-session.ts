import { cookies } from "next/headers"
import { sessionSchema, type PortalSession } from "@/lib/acquisition-api"
export async function readPortalSession(): Promise<{
  session: PortalSession | null
  unavailable: boolean
}> {
  const sessionCookie = (await cookies()).get("__Host-brunova_portal_session")
  if (!sessionCookie) return { session: null, unavailable: false }
  const origin = process.env.PORTAL_BACKEND_INTERNAL_URL ?? "https://brunova.mx"
  try {
    const response = await fetch(`${origin}/api/acquisition/v1/auth/session`, {
      cache: "no-store",
      headers: { cookie: `${sessionCookie.name}=${sessionCookie.value}` },
      signal: AbortSignal.timeout(10000),
    })
    if (response.status === 401) return { session: null, unavailable: false }
    const parsed = sessionSchema.safeParse(
      response.ok ? await response.json() : null,
    )
    return parsed.success
      ? { session: parsed.data, unavailable: false }
      : { session: null, unavailable: true }
  } catch {
    return { session: null, unavailable: true }
  }
}
