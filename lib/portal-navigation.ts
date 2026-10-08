import { localizedPath, type Locale } from "@/lib/i18n"
export const portalReturnCookie = "brunova-portal-return"
export const portalReturnCookiePath = "/portal/acquisition"
export const portalAuthReturnPath = (locale: Locale) =>
  localizedPath(locale, "/portal/acquisition")
export const validPortalReturn = (value: string | undefined) =>
  value === "/es/portal/acquisition" ? value : "/portal/acquisition"
