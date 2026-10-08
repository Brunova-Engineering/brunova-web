import { NextRequest, NextResponse } from "next/server"
import { getSiteUrl } from "@/lib/env"
import {
  portalReturnCookie,
  portalReturnCookiePath,
  portalAuthReturnPath,
} from "@/lib/portal-navigation"
// Bounded one-time return path, not another locale preference or auth system.
export function GET(request: NextRequest) {
  const locale =
    request.nextUrl.searchParams.get("locale") === "es" ? "es" : "en"
  const response = NextResponse.redirect(
    new URL("/api/acquisition/v1/auth/login", getSiteUrl()),
  )
  response.cookies.set(portalReturnCookie, portalAuthReturnPath(locale), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: portalReturnCookiePath,
    maxAge: 600,
  })
  response.headers.set("cache-control", "private, no-store")
  return response
}
