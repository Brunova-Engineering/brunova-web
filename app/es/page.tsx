import type { Metadata } from "next"

import { HomePageView } from "@/components/pages/home-page"
import { SiteJsonLd } from "@/components/seo/organization-json-ld"
import { languageAlternates } from "@/lib/i18n"

export const metadata: Metadata = {
  alternates: { canonical: "/es", languages: languageAlternates("/") },
}

export default function Page() {
  return (
    <>
      <SiteJsonLd />
      <HomePageView locale="es" />
    </>
  )
}
