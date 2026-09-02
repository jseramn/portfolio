import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { captureClient } from "./captureClient"
import * as captureClientModule from "./captureClient"
import { ANALYTICS_EVENTS } from "./events"

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

describe("captureClient", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it("no-ops when the project key is missing", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "")
    const posthog = mockPosthog()
    captureClient(ANALYTICS_EVENTS.hireCtaClicked)
    expect(posthog.capture).not.toHaveBeenCalled()
    expect(posthog.identify).not.toHaveBeenCalled()
  })

  it("does not invoke identify, alias, or group", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    captureClient(ANALYTICS_EVENTS.hireCtaClicked, { network: "github" })
    expect(posthog.capture).toHaveBeenCalledOnce()
    expect(posthog.identify).not.toHaveBeenCalled()
    expect(posthog.alias).not.toHaveBeenCalled()
    expect(posthog.group).not.toHaveBeenCalled()
    expect(captureClientModule).not.toHaveProperty("identify")
    expect(captureClientModule).not.toHaveProperty("alias")
    expect(captureClientModule).not.toHaveProperty("group")
  })

  it("strips contact PII from event properties", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    captureClient(ANALYTICS_EVENTS.contactFailed, {
      outcome: "send_failed",
      name: "Ada",
      email: "ada@example.com",
      subject: "Hire",
      message: "Hello",
      passphrase: "secret-phrase",
      ciphertext: "-----BEGIN AGE-----",
      envelopeId: "env_123",
      ip: "1.2.3.4",
    })
    expect(posthog.capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.contactFailed, {
      outcome: "send_failed",
    })
    const [, properties] = posthog.capture.mock.calls[0]
    expect(JSON.stringify(properties)).not.toMatch(
      /Ada|ada@example.com|secret-phrase|BEGIN AGE|env_123|1\.2\.3\.4/,
    )
  })

  it("sends only outcome on contact_submitted", () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    const posthog = mockPosthog()
    captureClient(ANALYTICS_EVENTS.contactSubmitted, {
      outcome: "sent",
      email: "ada@example.com",
      extra: "nope",
    })
    expect(posthog.capture).toHaveBeenCalledWith(ANALYTICS_EVENTS.contactSubmitted, {
      outcome: "sent",
    })
  })
})
