import { localizedPath, type Locale } from "@/lib/i18n"
export const portalReturnCookie = "brunova-portal-return"
export const portalReturnCookiePath = "/portal"
export const portalAuthReturnPath = (locale: Locale) =>
  localizedPath(locale, "/portal")
export const validPortalReturn = (value: string | undefined) =>
  value === "/es/portal" ? value : "/portal"
