import type {
  AnalyticsEvent,
  AnalyticsEventName,
  AnalyticsProperties,
} from "@/lib/analytics/events"

export type AnalyticsAdapter = {
  track: (event: AnalyticsEvent) => void
}

const noOpAnalyticsAdapter: AnalyticsAdapter = {
  track: () => undefined,
}

let activeAnalyticsAdapter = noOpAnalyticsAdapter

export function configureAnalytics(adapter: AnalyticsAdapter): () => void {
  const previousAdapter = activeAnalyticsAdapter
  activeAnalyticsAdapter = adapter

  return () => {
    activeAnalyticsAdapter = previousAdapter
  }
}

export function trackEvent(
  name: AnalyticsEventName,
  properties: AnalyticsProperties = {},
): void {
  activeAnalyticsAdapter.track({ name, properties })
}
