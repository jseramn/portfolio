import { captureClient } from "./captureClient"
import {
  ANALYTICS_EVENTS,
  CONTACT_FAILED_OUTCOMES,
  type ContactFailedOutcome,
  type ContactSubmittedOutcome,
} from "./events"

/** Spec hire-funnel order. `$pageview` is snippet-owned; the rest are product hooks. */
export const HIRE_FUNNEL_EVENT_ORDER = [
  ANALYTICS_EVENTS.pageview,
  ANALYTICS_EVENTS.hireCtaClicked,
  ANALYTICS_EVENTS.contactOpened,
  ANALYTICS_EVENTS.contactSubmitted,
] as const

export function onHireCtaClicked(): void {
  captureClient(ANALYTICS_EVENTS.hireCtaClicked)
}

export function onOutboundSocial(network: string): void {
  captureClient(ANALYTICS_EVENTS.outboundSocial, { network })
}

export function onOutboundOrg(org: string): void {
  captureClient(ANALYTICS_EVENTS.outboundOrg, { org })
}

export function onContactOpened(): void {
  captureClient(ANALYTICS_EVENTS.contactOpened)
}

export function onContactDismissed(submittedSuccessfully: boolean): void {
  if (submittedSuccessfully) return
  captureClient(ANALYTICS_EVENTS.contactClosed)
}

export function onContactSubmittedClient(outcome: ContactSubmittedOutcome = "sent"): void {
  captureClient(ANALYTICS_EVENTS.contactSubmitted, { outcome })
}

export function onContactFailed(outcome: ContactFailedOutcome): void {
  captureClient(ANALYTICS_EVENTS.contactFailed, { outcome })
}

export function contactFailedOutcomeFromClientError(code: string): ContactFailedOutcome {
  if (code === "server_not_configured") return "not_configured"
  if ((CONTACT_FAILED_OUTCOMES as readonly string[]).includes(code)) {
    return code as ContactFailedOutcome
  }
  return "send_failed"
}
