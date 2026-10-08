import type { Metadata } from "next"
import { languageAlternates, localizedPath, type Locale } from "@/lib/i18n"

type PageMetadataInput = {
  title: string
  description: string
  path: `/${string}`
  noIndex?: boolean
  followWhenNoIndex?: boolean
  locale?: Locale
}

export function createPageMetadata({
  title,
  description,
  path,
  noIndex = false,
  followWhenNoIndex = true,
  locale = "en",
}: PageMetadataInput): Metadata {
  const localized = localizedPath(locale, path)
  return {
    title,
    description,
    alternates: { canonical: localized, languages: languageAlternates(path) },
    openGraph: {
      type: "website",
      siteName: "Brunova",
      title,
      description,
      url: localized,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    ...(noIndex
      ? {
          robots: {
            index: false,
            follow: followWhenNoIndex,
          },
        }
      : {}),
  }
}
