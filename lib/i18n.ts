export const locales = ["en", "es"] as const

export type Locale = (typeof locales)[number]

export function localizedPath(locale: Locale, path: string): string {
  const normalized =
    path === "" ? "/" : path.startsWith("/") ? path : `/${path}`

  if (locale === "es") {
    return normalized === "/" ? "/es" : `/es${normalized}`
  }

  return normalized
}

export function pathLocale(pathname: string): Locale {
  return pathname === "/es" || pathname.startsWith("/es/") ? "es" : "en"
}

export function equivalentLocalePath(pathname: string, locale: Locale): string {
  const englishPath =
    pathname === "/es"
      ? "/"
      : pathname.startsWith("/es/")
        ? pathname.slice(3)
        : pathname

  return localizedPath(locale, englishPath)
}

export function languageAlternates(path: string) {
  return {
    "x-default": localizedPath("en", path),
    en: localizedPath("en", path),
    es: localizedPath("es", path),
  }
}
