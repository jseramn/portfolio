import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { HeroAsciiSession } from "./session"

const signalHeroBootReady = vi.fn()

vi.mock("../../bootLoader", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../bootLoader")>()
  return {
    ...actual,
    signalHeroBootReady: (...args: unknown[]) => signalHeroBootReady(...args),
  }
})

function makeSession(rows: number): HeroAsciiSession {
  const cols = 2
  const cells = cols * rows
  const width = 8
  const height = rows * 2
  const dataset: { asciiPaint?: string; glassGen?: string; glassBox?: string } = {}
  return {
    alive: true,
    asciiSample: { width: cols, height: rows },
    displayCanvas: { width, height, dataset },
    displayCtx: { putImageData: vi.fn() },
    displayImage: {},
    displayPixels: new Uint8ClampedArray(width * height * 4),
    cellGlyphIdx: new Uint8Array(cells),
    cellAlpha: new Float32Array(cells),
    glyphBits: [],
    glyphAtlasW: 1,
    glyphAtlasH: 1,
    cellW: 4,
    cellH: 2,
    stampCursor: 0,
    stampMinGX: 1,
    stampMinGY: 1,
    stampMaxGX: 0,
    stampMaxGY: 0,
    rastersCompleted: 0,
    rasterBusy: false,
    lastRasterMs: 0,
    skipNextSample: false,
  } as unknown as HeroAsciiSession
}

describe("ascii boot signal", () => {
  beforeEach(() => {
    signalHeroBootReady.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("does not dismiss boot on the first partial stamp slice", async () => {
    let calls = 0
    vi.spyOn(performance, "now").mockImplementation(() => {
      calls += 1
      return calls === 1 ? 0 : 20
    })
    const { stampSlice } = await import("./raster")
    const session = makeSession(8)
    stampSlice(session)
    expect(session.stampCursor).toBeGreaterThan(0)
    expect(session.stampCursor).toBeLessThan(8)
    expect(session.displayCanvas.dataset.asciiPaint).toBeUndefined()
    expect(signalHeroBootReady).not.toHaveBeenCalled()
  })

  it("signals boot from finishStamp on the first completed raster", async () => {
    const { finishStamp } = await import("./raster")
    const session = makeSession(4)
    finishStamp(session)
    expect(session.displayCanvas.dataset.asciiPaint).toBe("1")
    expect(signalHeroBootReady).toHaveBeenCalledTimes(1)
    finishStamp(session)
    expect(signalHeroBootReady).toHaveBeenCalledTimes(1)
  })
})
