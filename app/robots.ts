import type { MetadataRoute } from "next"

import { getSiteUrl, isSeoIndexingEnabled } from "@/lib/env"
import { createRobots } from "@/lib/seo"

export default function robots(): MetadataRoute.Robots {
  return createRobots({
    indexingEnabled: isSeoIndexingEnabled(),
    siteUrl: getSiteUrl(),
  })
}
