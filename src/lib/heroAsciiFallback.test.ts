import { describe, expect, it } from "vitest"
import { CHARSET, OCCUPIED_IDX_MIN, PAPER_LUMA } from "./hero/ascii/glyphs"
import { SAMPLE_COLS, SAMPLE_ROWS, VIDEO_ZOOM } from "./hero/ascii/scene"
import {
  asciiLinesFromRgba,
  FALLBACK_COLS,
  FALLBACK_ROWS,
  firstNonBlackRgbFrame,
  rgb24MeanLuma,
  rgb24ToRgba,
  svgFromLines,
} from "./heroAsciiFallback"

function fillRgba(cols: number, rows: number, value: number): Uint8Array {
  const data = new Uint8Array(cols * rows * 4)
  for (let i = 0; i < data.length; i += 4) data.set([value, value, value, 255], i)
  return data
}

describe("hero ASCII fallback frame", () => {
  it("maps the runtime glyph ramp and skips black rgb24 frames", () => {
    expect(FALLBACK_COLS).toBe(SAMPLE_COLS)
    expect(FALLBACK_ROWS).toBe(SAMPLE_ROWS)
    expect(asciiLinesFromRgba(fillRgba(4, 2, 0), 4, 2, false)).toEqual(["    ", "    "])
    expect(asciiLinesFromRgba(fillRgba(2, 2, 255), 2, 2, false)[0]).toBe(
      CHARSET[OCCUPIED_IDX_MIN].repeat(2),
    )
    const packed = new Uint8Array([...new Uint8Array(12), ...new Uint8Array(12).fill(255)])
    expect(rgb24MeanLuma(packed.subarray(0, 12))).toBeLessThanOrEqual(PAPER_LUMA)
    const frame = firstNonBlackRgbFrame(packed, 2, 2)
    expect(asciiLinesFromRgba(rgb24ToRgba(frame), 2, 2, false)[0]).toContain(
      CHARSET[OCCUPIED_IDX_MIN],
    )
  })

  it("emits a cover-sliced monochrome 16:9 svg", () => {
    const svg = svgFromLines(["::::", "****"], 4, 2)
    expect(svg).toContain('viewBox="0 0 16 9"')
    expect(svg).toContain('preserveAspectRatio="xMidYMid slice"')
    expect(svg).toContain(`scale(${VIDEO_ZOOM.default})`)
    expect(svg).toContain('fill="#fff"')
    expect(svg).not.toMatch(/fill="#(?!000|fff)[0-9a-fA-F]{3,8}"/)
  })
})
