export const DEFAULT_POSTHOG_HOST = "https://us.i.posthog.com"

export const ANALYTICS_EVENTS = {
  pageview: "$pageview",
  pageleave: "$pageleave",
  hireCtaClicked: "hire_cta_clicked",
  contactOpened: "contact_opened",
  contactClosed: "contact_closed",
  contactSubmitted: "contact_submitted",
  contactFailed: "contact_failed",
  outboundSocial: "outbound_social",
  outboundOrg: "outbound_org",
} as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

export const CONTACT_SUBMITTED_OUTCOMES = [
  "sent",
  "honeypot",
  "rejected",
  "rate_limited",
  "send_failed",
  "not_configured",
] as const

export type ContactSubmittedOutcome = (typeof CONTACT_SUBMITTED_OUTCOMES)[number]

export const CONTACT_FAILED_OUTCOMES = [
  "send_failed",
  "rate_limited",
  "not_configured",
  "turnstile",
  "encrypt_failed",
] as const

export type ContactFailedOutcome = (typeof CONTACT_FAILED_OUTCOMES)[number]

const LOCKED_EVENTS = new Set<string>(Object.values(ANALYTICS_EVENTS))

export function isAnalyticsEvent(value: string): value is AnalyticsEvent {
  return LOCKED_EVENTS.has(value)
}
