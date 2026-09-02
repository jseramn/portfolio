import { describe, expect, it } from "vitest"
import {
  FALLBACK_FROST_BLACK_ALPHA,
  HERO_INK_RGB,
  compositeSrcOver,
  contrastRatio,
} from "./heroContrast"

const BLACK = [0, 0, 0] as const
const WHITE = [255, 255, 255] as const

describe("hero contrast", () => {
  it("matches C-04 bone-on-black vs bone-on-white", () => {
    expect(contrastRatio(HERO_INK_RGB, BLACK)).toBeCloseTo(16.53, 1)
    expect(contrastRatio(HERO_INK_RGB, WHITE)).toBeCloseTo(1.27, 2)
  })

  it("keeps fallback frost ≥ 4.5:1 over worst-case white glyphs", () => {
    const frosted = compositeSrcOver(BLACK, WHITE, FALLBACK_FROST_BLACK_ALPHA)
    expect(contrastRatio(HERO_INK_RGB, frosted)).toBeGreaterThanOrEqual(4.5)
    expect(contrastRatio(HERO_INK_RGB, compositeSrcOver(BLACK, WHITE, 0.4))).toBeLessThan(4.5)
  })
})
