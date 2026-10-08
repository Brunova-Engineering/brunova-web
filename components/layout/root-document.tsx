import { IBM_Plex_Sans, Manrope } from "next/font/google"
import type { PropsWithChildren } from "react"

import { AttributionCapture } from "@/components/analytics/attribution-capture"
import { SiteFooter } from "@/components/layout/site-footer"
import { SiteHeader } from "@/components/layout/site-header"
import { BackToTop } from "@/components/preferences/back-to-top"
import { SiteUtilities } from "@/components/preferences/site-utilities"
import { ThemeProvider } from "@/components/theme/theme-provider"
import type { Locale } from "@/lib/i18n"

const displayFont = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "optional",
})

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "optional",
})

export function RootDocument({
  children,
  locale,
}: PropsWithChildren<{ locale: Locale }>) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable}`}>
        <ThemeProvider>
          <AttributionCapture />
          <SiteHeader locale={locale} />
          <div className="site-shell__content">{children}</div>
          <SiteFooter locale={locale} />
          <SiteUtilities locale={locale} placement="shell" />
          <BackToTop locale={locale} />
        </ThemeProvider>
      </body>
    </html>
  )
}
