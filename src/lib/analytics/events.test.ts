import { describe, expect, it } from "vitest"
import {
  ANALYTICS_EVENTS,
  CONTACT_FAILED_OUTCOMES,
  CONTACT_SUBMITTED_OUTCOMES,
  DEFAULT_POSTHOG_HOST,
  isAnalyticsEvent,
} from "./events"

describe("analytics event taxonomy", () => {
  it("locks the hire-funnel names and omits agent_markdown_served", () => {
    expect(ANALYTICS_EVENTS).toEqual({
      pageview: "$pageview",
      pageleave: "$pageleave",
      hireCtaClicked: "hire_cta_clicked",
      contactOpened: "contact_opened",
      contactClosed: "contact_closed",
      contactSubmitted: "contact_submitted",
      contactFailed: "contact_failed",
      outboundSocial: "outbound_social",
      outboundOrg: "outbound_org",
    })
    expect(Object.values(ANALYTICS_EVENTS)).not.toContain("agent_markdown_served")
    expect(isAnalyticsEvent("agent_markdown_served")).toBe(false)
    expect(DEFAULT_POSTHOG_HOST).toBe("https://us.i.posthog.com")
  })

  it("locks contact outcomes", () => {
    expect([...CONTACT_SUBMITTED_OUTCOMES]).toEqual([
      "sent",
      "honeypot",
      "rejected",
      "rate_limited",
      "send_failed",
      "not_configured",
    ])
    expect([...CONTACT_FAILED_OUTCOMES]).toEqual([
      "send_failed",
      "rate_limited",
      "not_configured",
      "turnstile",
      "encrypt_failed",
    ])
  })
})
