import type { Metadata } from "next"
import type { PropsWithChildren } from "react"

import { RootDocument } from "@/components/layout/root-document"
import { localizedSiteConfig } from "@/content/locales"
import { getSiteUrl, isSeoIndexingEnabled } from "@/lib/env"

import "../globals.css"
import "../site-shell.css"

const site = localizedSiteConfig.en

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "Brunova — Systems Engineering & Operational Intelligence",
    template: "%s — Brunova",
  },
  description: site.description,
  icons: {
    icon: [{ url: "/brand/brunova-mark.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    type: "website",
    siteName: "Brunova",
    title: "Brunova — Systems Engineering & Operational Intelligence",
    description: site.description,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Brunova — Systems Engineering & Operational Intelligence",
    description: site.description,
  },
  robots: isSeoIndexingEnabled()
    ? { index: true, follow: true }
    : { index: false, follow: false, noarchive: true },
}

export default function SiteLayout({ children }: PropsWithChildren) {
  return <RootDocument locale="en">{children}</RootDocument>
}
