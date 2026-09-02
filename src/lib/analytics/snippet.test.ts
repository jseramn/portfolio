import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const here = dirname(fileURLToPath(import.meta.url))
const snippet = readFileSync(join(here, "../../components/posthog.astro"), "utf8")
const layout = readFileSync(join(here, "../../layouts/Layout.astro"), "utf8")
const middleware = readFileSync(join(here, "../../middleware.ts"), "utf8")
const captureNodeSource = readFileSync(join(here, "captureNode.ts"), "utf8")

describe("posthog.astro snippet", () => {
  it("uses the official inline snippet, skips a missing key, and stays cookieless", () => {
    expect(snippet).toContain("is:inline")
    expect(snippet).toContain("PUBLIC_POSTHOG_KEY")
    expect(snippet).toMatch(/posthogKey \?/)
    expect(snippet).toContain("e.__SV")
    expect(snippet).toContain('cookieless_mode: "always"')
    expect(snippet).toContain("capture_pageview: true")
    expect(snippet).toContain("capture_pageleave: true")
    expect(snippet).toContain("autocapture: true")
    expect(snippet).toContain("capture_exceptions: true")
    expect(snippet).toContain("capture_performance: true")
    expect(snippet).toContain("enable_recording_console_log: true")
    expect(snippet).toContain("maskAllInputs: true")
    expect(snippet).not.toContain("disable_session_recording")
    expect(snippet).not.toContain("disable_surveys")
    expect(snippet).not.toContain("advanced_disable_feature_flags")
    expect(snippet).toContain('person_profiles: "identified_only"')
    expect(snippet).toContain("2026-05-30")
    expect(snippet).toContain("https://us.i.posthog.com")
    expect(snippet).toContain("posthog.init")
    expect(snippet).toContain("setTimeout(arm,6000)")
    expect(snippet).not.toContain("requestIdleCallback")
  })

  it("is mounted in Layout; product events stay on PostHog; posthog-node stays off middleware", () => {
    expect(layout).toMatch(/posthog\.astro/)
    expect(layout).not.toMatch(/VercelAnalytics/)
    expect(layout).not.toMatch(/SpeedInsights/)
    expect(layout).not.toMatch(/@vercel\//)
    expect(readFileSync(join(here, "captureClient.ts"), "utf8")).not.toMatch(/@vercel\//)
    expect(readFileSync(join(here, "productCapture.ts"), "utf8")).not.toMatch(/@vercel\//)
    expect(middleware).not.toMatch(/posthog-node|captureNode|lib\/analytics/)
    expect(captureNodeSource).toContain('from "posthog-node"')
  })
})
