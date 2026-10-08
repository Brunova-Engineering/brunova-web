import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/env"
import { createSitemap } from "@/lib/seo"

export default function sitemap(): MetadataRoute.Sitemap {
  return createSitemap(getSiteUrl())
}
