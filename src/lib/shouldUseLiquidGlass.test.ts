import { describe, expect, it } from "vitest"
import { shouldUseLiquidGlass } from "./shouldUseLiquidGlass"

const CHROME =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
const FIREFOX =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
const FXI_OS =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/123.0 Mobile/15E148 Safari/605.1.15"
const EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"

describe("shouldUseLiquidGlass", () => {
  it("enables liquid glass on Chrome", () => {
    expect(shouldUseLiquidGlass(CHROME, false)).toBe(true)
  })

  it("disables liquid glass on Macintosh Safari without Chrome", () => {
    expect(shouldUseLiquidGlass(SAFARI_MAC, false)).toBe(false)
  })

  it("disables liquid glass on Firefox", () => {
    expect(shouldUseLiquidGlass(FIREFOX, false)).toBe(false)
  })

  it("disables liquid glass on iOS FxiOS", () => {
    expect(shouldUseLiquidGlass(FXI_OS, false)).toBe(false)
  })

  it("enables liquid glass on Edg", () => {
    expect(shouldUseLiquidGlass(EDGE, false)).toBe(true)
  })

  it("disables liquid glass when reduced motion is requested", () => {
    expect(shouldUseLiquidGlass(CHROME, true)).toBe(false)
  })

  it("disables liquid glass for an empty user agent", () => {
    expect(shouldUseLiquidGlass("", false)).toBe(false)
  })
})
