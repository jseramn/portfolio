import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

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
    identify = vi.fn()
    alias = vi.fn()
    groupIdentify = vi.fn()
  },
}))

import { captureNode } from "./captureNode"
import { ANALYTICS_EVENTS, DEFAULT_POSTHOG_HOST } from "./events"

const UUID = "11111111-1111-4111-8111-111111111111"

describe("captureNode", () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
    capture.mockReset()
    shutdown.mockReset().mockResolvedValue(undefined)
    ctor.mockReset()
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(UUID)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("no-ops when the project key is missing", async () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "")
    await captureNode("sent")
    expect(ctor).not.toHaveBeenCalled()
    expect(capture).not.toHaveBeenCalled()
    expect(shutdown).not.toHaveBeenCalled()
  })

  it("captures contact_submitted with a random UUID, no PII, and shuts down", async () => {
    vi.stubEnv("PUBLIC_POSTHOG_KEY", "phc_test")
    vi.stubEnv("PUBLIC_POSTHOG_HOST", "")
    await captureNode("honeypot")

    expect(ctor).toHaveBeenCalledWith("phc_test", {
      host: DEFAULT_POSTHOG_HOST,
      disableGeoip: true,
      personProfiles: "identified_only",
    })
    expect(capture).toHaveBeenCalledWith({
      distinctId: UUID,
      event: ANALYTICS_EVENTS.contactSubmitted,
      properties: {
        outcome: "honeypot",
        $process_person_profile: false,
      },
      disableGeoip: true,
    })
    const payload = capture.mock.calls[0][0] as {
      properties: Record<string, unknown>
    }
    expect(Object.keys(payload.properties)).toEqual(["outcome", "$process_person_profile"])
    expect(JSON.stringify(payload.properties)).not.toMatch(
      /email|passphrase|envelope|ciphertext|@|1\.2\.3/,
    )
    expect(shutdown).toHaveBeenCalledOnce()
  })
})
