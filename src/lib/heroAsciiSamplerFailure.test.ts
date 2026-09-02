import { describe, expect, it, vi } from "vitest"
import { BOOT_FALLBACK_ATTR } from "./domSignals"
import { applyHeroSamplerFailure } from "./heroAsciiSamplerFailure"

describe("hero ASCII sampler failure", () => {
  it("stops the loop and marks the boot fallback on the host", () => {
    const attrs = new Map<string, string>()
    const host = {
      setAttribute(name: string, value: string) {
        attrs.set(name, value)
      },
    }
    const stopLoop = vi.fn()
    applyHeroSamplerFailure(host, stopLoop)
    expect(stopLoop).toHaveBeenCalledTimes(1)
    expect(attrs.get(BOOT_FALLBACK_ATTR)).toBe("")
  })
})
