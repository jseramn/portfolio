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
    expect(snippet).toContain("autocapture: false")
    expect(snippet).toContain("disable_session_recording: true")
    expect(snippet).toContain("disable_surveys: true")
    expect(snippet).toContain("advanced_disable_feature_flags: true")
    expect(snippet).toContain("capture_exceptions: true")
    expect(snippet).toContain('person_profiles: "identified_only"')
    expect(snippet).toContain("2026-05-30")
    expect(snippet).toContain("https://us.i.posthog.com")
  })

  it("is mounted in Layout beside Vercel Analytics; posthog-node stays off Edge middleware", () => {
    expect(layout).toMatch(/posthog\.astro/)
    expect(layout).toContain("<Analytics />")
    expect(middleware).not.toMatch(/posthog-node|captureNode|lib\/analytics/)
    expect(captureNodeSource).toContain('from "posthog-node"')
  })
})
