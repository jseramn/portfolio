import { describe, expect, it } from "vitest"
import {
  CHARSET,
  contrast01,
  createGlyphBuffers,
  OCCUPIED_IDX_MIN,
  OPACITY_FLOOR,
  PAPER_LUMA,
  prepareCellGlyphs,
} from "./glyphs"

function buffers() {
  return {
    ...createGlyphBuffers(),
    stampMinGX: 0,
    stampMinGY: 0,
    stampMaxGX: 0,
    stampMaxGY: 0,
  }
}

describe("hero ASCII cell mapping", () => {
  it("leaves paper-black cells empty and does not expand the stamp box", () => {
    const data = new Uint8Array(2 * 2 * 4)
    const state = buffers()
    prepareCellGlyphs(data, 2, 2, false, false, state)
    expect(state.cellOccupied[0]).toBe(0)
    expect(state.cellGlyphIdx[0]).toBe(0)
    expect(state.stampMinGX).toBe(2)
    expect(state.stampMaxGX).toBe(0)
    expect(PAPER_LUMA).toBe(0.12)
  })

  it("maps uniform white cells to a mid charset glyph with full alpha", () => {
    const data = new Uint8Array(2 * 2 * 4).fill(255)
    const state = buffers()
    prepareCellGlyphs(data, 2, 2, false, false, state)
    expect(state.cellOccupied[0]).toBe(1)
    expect(state.cellGlyphIdx[0]).toBe(OCCUPIED_IDX_MIN)
    expect(CHARSET[state.cellGlyphIdx[0]]).toBe(":")
    expect(state.cellAlpha[0]).toBeCloseTo(1)
    expect(state.stampMinGX).toBe(0)
    expect(state.stampMinGY).toBe(0)
    expect(state.stampMaxGX).toBe(1)
    expect(state.stampMaxGY).toBe(1)
    expect(OPACITY_FLOOR).toBe(0.16)
  })

  it("reads WebGL bottom-origin rows when flipY is set", () => {
    const data = new Uint8Array(2 * 2 * 4)
    data.set([255, 255, 255, 255], 8)
    const flipped = buffers()
    const unflipped = buffers()
    prepareCellGlyphs(data, 2, 2, true, false, flipped)
    prepareCellGlyphs(data, 2, 2, false, false, unflipped)
    expect(flipped.cellOccupied[0]).toBe(1)
    expect(flipped.cellOccupied[2]).toBe(0)
    expect(unflipped.cellOccupied[0]).toBe(0)
    expect(unflipped.cellOccupied[2]).toBe(1)
  })

  it("compresses contrast toward the ends without leaving 0.5", () => {
    expect(contrast01(0, 2.6)).toBe(0)
    expect(contrast01(1, 2.6)).toBe(1)
    expect(contrast01(0.5, 2.6)).toBeCloseTo(0.5)
    expect(contrast01(0.75, 2.6)).toBeGreaterThan(0.75)
  })
})
