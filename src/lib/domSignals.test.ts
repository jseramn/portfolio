import { describe, expect, it } from "vitest"
import {
  ASCII_PAINT_ATTR,
  ASCII_PAINT_SELECTOR,
  BOOT_FALLBACK_ATTR,
  BOOT_FALLBACK_SELECTOR,
  CONTACT_MODAL_OPEN_SELECTOR,
  DIALOG_MODAL_SELECTOR,
  HERO_ASCII_CANVAS_SELECTOR,
  HERO_ASCII_DISPLAY_CLASS,
  HERO_ROOT_ATTR,
  HERO_ROOT_SELECTOR,
  getAsciiCanvas,
  getHeroRoot,
  isAsciiReadyForGlass,
  isUiBlockingOverlayOpen,
  readGlassBox,
  readGlassGen,
} from "./domSignals"

function fakeRoot(hits: Record<string, unknown>) {
  return { querySelector: (selector: string) => hits[selector] ?? null }
}

describe("domSignals", () => {
  it("owns selectors and overlay/glass predicates", () => {
    expect(HERO_ROOT_SELECTOR).toBe(`[${HERO_ROOT_ATTR}]`)
    expect(HERO_ASCII_CANVAS_SELECTOR).toBe(`${HERO_ROOT_SELECTOR} > .${HERO_ASCII_DISPLAY_CLASS}`)
    expect(ASCII_PAINT_SELECTOR).toBe(`canvas.${HERO_ASCII_DISPLAY_CLASS}[${ASCII_PAINT_ATTR}]`)
    expect(BOOT_FALLBACK_SELECTOR).toBe(`[${BOOT_FALLBACK_ATTR}]`)
    const root = { id: "hero" }
    const canvas = { width: 8, height: 8, dataset: { glassGen: "1", glassBox: "1,2,3,4" } }
    expect(getHeroRoot(fakeRoot({ [HERO_ROOT_SELECTOR]: root }))).toBe(root)
    expect(getAsciiCanvas(fakeRoot({ [HERO_ASCII_CANVAS_SELECTOR]: canvas }))).toBe(canvas)
    expect(isUiBlockingOverlayOpen(fakeRoot({}))).toBe(false)
    expect(isUiBlockingOverlayOpen(fakeRoot({ [CONTACT_MODAL_OPEN_SELECTOR]: {} }))).toBe(true)
    expect(isUiBlockingOverlayOpen(fakeRoot({ [DIALOG_MODAL_SELECTOR]: {} }))).toBe(true)
    expect(isAsciiReadyForGlass(null)).toBe(false)
    expect(isAsciiReadyForGlass({ width: 8, height: 8 })).toBe(false)
    expect(isAsciiReadyForGlass(canvas)).toBe(true)
    expect(readGlassGen(canvas)).toBe("1")
    expect(readGlassBox(canvas)).toBe("1,2,3,4")
  })
})
