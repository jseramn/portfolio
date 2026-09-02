import { afterEach, describe, expect, it } from "vitest"
import {
  detectCapabilities,
  getCapabilities,
  probeWebGL,
  resetCapabilitiesCache,
  type CapabilityEnv,
} from "./capabilities"

const UA = {
  chrome: "Mozilla/5.0 Chrome/122 Safari/537",
  safari: "Mozilla/5.0 Version/17 Safari/605",
  firefox: "Mozilla/5.0 Firefox/123",
  crios: "Mozilla/5.0 CriOS/126 Safari/604",
}

function media(coarse: boolean, reduced: boolean) {
  return ((query: string) => ({
    matches: query.includes("coarse") ? coarse : query.includes("reduced-motion") ? reduced : false,
  })) as unknown as typeof matchMedia
}

function env(over: Partial<CapabilityEnv> & { userAgent: string }): CapabilityEnv {
  return { chromeObject: false, brands: [], matchMedia: media(false, false), ...over }
}

afterEach(resetCapabilitiesCache)

describe("capabilities", () => {
  it("composes UA, motion, pointer, chromium, and webgl into liveGlass", () => {
    const chrome = detectCapabilities(env({ userAgent: UA.chrome }))
    const crios = detectCapabilities(
      env({ userAgent: UA.crios, chromeObject: true, brands: ["Chromium"] }),
    )
    expect(chrome.liveGlass).toBe(true)
    expect(detectCapabilities(env({ userAgent: UA.safari })).liveGlass).toBe(false)
    expect(detectCapabilities(env({ userAgent: UA.firefox })).liveGlass).toBe(false)
    expect(crios.liveGlass).toBe(false)
    expect(crios.chromiumRuntime).toBe(false)
    expect(
      detectCapabilities(env({ userAgent: UA.chrome, matchMedia: media(false, true) })).liveGlass,
    ).toBe(false)
    expect(
      detectCapabilities(env({ userAgent: UA.chrome, matchMedia: media(true, false) })).liveGlass,
    ).toBe(false)
    expect(
      detectCapabilities(env({ userAgent: UA.chrome, matchMedia: media(true, false) }))
        .pointerCoarse,
    ).toBe(true)
    expect(
      detectCapabilities(env({ userAgent: UA.chrome, matchMedia: media(false, true) }))
        .reducedMotion,
    ).toBe(true)
    expect(
      detectCapabilities(env({ userAgent: UA.chrome, chromeObject: true })).chromiumRuntime,
    ).toBe(true)
    expect(chrome.webgl).toBe(false)
    expect(detectCapabilities(env({ userAgent: UA.chrome, webglProbe: () => true })).webgl).toBe(
      true,
    )
  })

  it("returns SSR defaults and memoises a single WebGL probe", () => {
    expect(getCapabilities()).toMatchObject({ liveGlass: false, webgl: false, userAgent: "" })
    let calls = 0
    const probe = () => {
      calls += 1
      return true
    }
    expect(probeWebGL(probe)).toBe(true)
    expect(probeWebGL(() => false)).toBe(true)
    expect(calls).toBe(1)
  })
})
