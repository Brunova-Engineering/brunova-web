export type AnalyticsEventName =
  | "cta_start_conversation"
  | "cta_explore_work"
  | "contact_form_started"
  | "contact_form_submitted"
  | "contact_form_success"
  | "contact_form_error"
  | "portal_clicked"
  | "case_study_opened"

export type AnalyticsPrimitive = string | number | boolean | null

export type AnalyticsProperties = Readonly<
  Record<string, AnalyticsPrimitive | undefined>
>

export type AnalyticsEvent = {
  name: AnalyticsEventName
  properties: AnalyticsProperties
}
