import { getSiteUrl } from "@/lib/env"
import type { Locale } from "@/lib/i18n"
import { createBreadcrumbStructuredData } from "@/lib/seo"

export function BreadcrumbJsonLd({
  locale,
  name,
  path,
}: {
  locale: Locale
  name: string
  path: string
}) {
  const structuredData = createBreadcrumbStructuredData({
    siteUrl: getSiteUrl(),
    locale,
    currentName: name,
    currentPath: path,
  })

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
      }}
      type="application/ld+json"
    />
  )
}
