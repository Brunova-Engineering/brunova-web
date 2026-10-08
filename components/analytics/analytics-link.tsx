"use client"

import Link from "next/link"
import type { PropsWithChildren } from "react"

import {
  actionLinkClassName,
  type ActionLinkVariant,
} from "@/components/ui/action-link"
import { trackEvent } from "@/lib/analytics"
import type {
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/events"

export function AnalyticsLink({
  children,
  className,
  eventName,
  eventProperties,
  href,
  variant = "text",
}: PropsWithChildren<{
  className?: string
  eventName: AnalyticsEventName
  eventProperties?: AnalyticsProperties
  href: string
  variant?: ActionLinkVariant
}>) {
  return (
    <Link
      className={actionLinkClassName(variant, className)}
      href={href}
      onClick={() => trackEvent(eventName, eventProperties)}
    >
      {children}
    </Link>
  )
}
