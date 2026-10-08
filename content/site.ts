import type { SiteConfig } from "@/content/types"

export const siteConfig = {
  name: "Brunova",
  description:
    "Brunova is a systems engineering consultancy that designs and builds reliable systems connecting data, automation, software and AI for complex business operations.",
  descriptor: "Systems Engineering · Operational Intelligence",
  primaryAction: {
    label: "Start a conversation",
    href: "/contact",
    analyticsEvent: "cta_start_conversation",
  },
} as const satisfies SiteConfig
