import { NextRequest, NextResponse } from "next/server"
import { getSiteUrl } from "@/lib/env"
import {
  portalReturnCookie,
  portalReturnCookiePath,
  validPortalReturn,
} from "@/lib/portal-navigation"
export function proxy(request: NextRequest) {
  const pending = request.cookies.get(portalReturnCookie)
  if (!pending) return NextResponse.next()
  const path = validPortalReturn(pending.value)
  const response =
    path === request.nextUrl.pathname
      ? NextResponse.next()
      : NextResponse.redirect(new URL(path, getSiteUrl()))
  response.cookies.set(portalReturnCookie, "", {
    path: portalReturnCookiePath,
    maxAge: 0,
  })
  response.headers.set("cache-control", "private, no-store")
  return response
}
export const config = { matcher: ["/portal/acquisition"] }
