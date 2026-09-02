import { describe, expect, it } from "vitest"
import { cellDestRect, rgbaOffset, shouldContinueStamp, stampGlyphAlpha } from "./heroAsciiStamp"

describe("hero ASCII stamp", () => {
  it("reads WebGL pixels from the bottom-left origin", () => {
    expect(rgbaOffset(0, 0, 2, 2, true)).toBe(8)
    expect(rgbaOffset(0, 0, 2, 2, false)).toBe(0)
    expect(rgbaOffset(1, 1, 2, 2, true)).toBe(4)
  })

  it("packs cell rectangles without gaps or overflow", () => {
    const a = cellDestRect(0, 0, 6.7, 13.4, 390, 844)
    const b = cellDestRect(1, 0, 6.7, 13.4, 390, 844)
    expect(a.dx).toBe(0)
    expect(b.dx).toBe(a.dx + a.dw)
    expect(a.dw).toBeGreaterThan(0)
    expect(a.dh).toBeGreaterThan(0)
    const last = cellDestRect(57, 62, 390 / 58, 844 / 63, 390, 844)
    expect(last.dx + last.dw).toBeLessThanOrEqual(390)
    expect(last.dy + last.dh).toBeLessThanOrEqual(844)
  })

  it("stamps a white glyph with alpha into destination pixels", () => {
    const dest = new Uint8ClampedArray(4 * 4 * 4)
    const glyph = new Uint8ClampedArray([255, 255, 255, 255])
    stampGlyphAlpha(dest, 4, 4, glyph, 1, 1, 1, 1, 1, 1, 0.5)
    expect(dest[20]).toBe(255)
    expect(dest[23]).toBe(128)
    expect(dest[0]).toBe(0)
    expect(shouldContinueStamp(0, 10)).toBe(true)
    expect(shouldContinueStamp(10, 10)).toBe(false)
    expect(shouldContinueStamp(-1, 10)).toBe(false)
  })
})
