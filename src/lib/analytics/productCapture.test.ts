import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { captureClient } from "./captureClient"
import { captureNode } from "./captureNode"
import { ANALYTICS_EVENTS } from "./events"
import {
  HIRE_FUNNEL_EVENT_ORDER,
  contactFailedOutcomeFromClientError,
  onContactDismissed,
  onContactFailed,
  onContactOpened,
  onContactSubmittedClient,
  onHireCtaClicked,
  onOutboundOrg,
  onOutboundSocial,
} from "./productCapture"

const { capture, shutdown, ctor } = vi.hoisted(() => ({
  capture: vi.fn(),
  shutdown: vi.fn().mockResolvedValue(undefined),
  ctor: vi.fn(),
}))

vi.mock("posthog-node", () => ({
  PostHog: class {
    constructor(...args: unknown[]) {
      ctor(...args)
    }
    capture = capture
    shutdown = shutdown
  },
}))

function mockPosthog() {
  const posthog = {
    capture: vi.fn(),
    identify: vi.fn(),
    alias: vi.fn(),
    group: vi.fn(),
  }
  vi.stubGlobal("window", { posthog })
  return posthog
}

describe("product capture wiring", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
    capture.mockReset()
    shutdown.mockReset().mockResolvedValue(undefined)
    ctor.mockReset()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("emits the hire-funnel events in spec order", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    posthog.capture(ANALYTICS_EVENTS.pageview)
    onHireCtaClicked()
    onContactOpened()
    onContactSubmittedClient("sent")
    expect(posthog.capture.mock.calls.map(([event]) => event)).toEqual([
      ...HIRE_FUNNEL_EVENT_ORDER,
    ])
  })

  it("records dual contact_submitted with outcome only", async () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    onContactSubmittedClient("sent")
    await captureNode("sent")
    expect(posthog.capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.contactSubmitted, {
      outcome: "sent",
    })
    expect(capture).toHaveBeenCalledWith(
      expect.objectContaining({
        event: ANALYTICS_EVENTS.contactSubmitted,
        properties: {
          outcome: "sent",
          $process_person_profile: false,
        },
      }),
    )
    const clientProps = posthog.capture.mock.calls[0][1] as Record<string, unknown>
    expect(Object.keys(clientProps)).toEqual(["outcome"])
  })

  it("records honeypot as a non-success server outcome without form fields", async () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    await captureNode("honeypot")
    const payload = capture.mock.calls[0][0] as { properties: Record<string, unknown> }
    expect(payload.properties.outcome).toBe("honeypot")
    expect(Object.keys(payload.properties)).toEqual(["outcome", "$process_person_profile"])
    expect(JSON.stringify(payload)).not.toMatch(/email|name|subject|message|company|ada@/i)
  })

  it("records contact_failed without form fields", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    onContactFailed("send_failed")
    captureClient(ANALYTICS_EVENTS.contactFailed, {
      outcome: "encrypt_failed",
      email: "ada@example.com",
      name: "Ada",
      message: "secret",
    })
    expect(posthog.capture).toHaveBeenNthCalledWith(1, ANALYTICS_EVENTS.contactFailed, {
      outcome: "send_failed",
    })
    expect(posthog.capture).toHaveBeenNthCalledWith(2, ANALYTICS_EVENTS.contactFailed, {
      outcome: "encrypt_failed",
    })
    expect(JSON.stringify(posthog.capture.mock.calls)).not.toMatch(/Ada|ada@example.com|secret/)
  })

  it("does not emit contact_closed after success", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    onContactDismissed(true)
    expect(posthog.capture).not.toHaveBeenCalled()
    onContactDismissed(false)
    expect(posthog.capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.contactClosed, undefined)
  })

  it("captures outbound social and org properties", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    onOutboundSocial("github")
    onOutboundOrg("co-founder @ Mallanet.org")
    expect(posthog.capture).toHaveBeenNthCalledWith(1, ANALYTICS_EVENTS.outboundSocial, {
      network: "github",
    })
    expect(posthog.capture).toHaveBeenNthCalledWith(2, ANALYTICS_EVENTS.outboundOrg, {
      org: "co-founder @ Mallanet.org",
    })
  })

  it("no-ops client helpers when the project key is missing", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "")
    const posthog = mockPosthog()
    onHireCtaClicked()
    onContactOpened()
    onContactSubmittedClient("sent")
    onContactFailed("send_failed")
    expect(posthog.capture).not.toHaveBeenCalled()
  })

  it("still captures on the server when the client PostHog object is missing", async () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    vi.stubGlobal("window", {})
    onContactSubmittedClient("sent")
    await captureNode("sent")
    expect(ctor).toHaveBeenCalledOnce()
    expect(capture).toHaveBeenCalledOnce()
  })

  it("maps client API errors onto locked contact_failed outcomes", () => {
    expect(contactFailedOutcomeFromClientError("server_not_configured")).toBe("not_configured")
    expect(contactFailedOutcomeFromClientError("rate_limited")).toBe("rate_limited")
    expect(contactFailedOutcomeFromClientError("send_failed")).toBe("send_failed")
    expect(contactFailedOutcomeFromClientError("turnstile")).toBe("turnstile")
    expect(contactFailedOutcomeFromClientError("encrypt_failed")).toBe("encrypt_failed")
    expect(contactFailedOutcomeFromClientError("request_rejected")).toBe("send_failed")
  })
})
