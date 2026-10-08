import { getSiteUrl } from "@/lib/env"
import { createSiteStructuredData } from "@/lib/seo"

export function SiteJsonLd() {
  const structuredData = createSiteStructuredData(getSiteUrl())

  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c"),
      }}
      type="application/ld+json"
    />
  )
}
