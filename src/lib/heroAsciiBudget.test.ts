import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  ASCII_FPS,
  ASCII_WARMUP_MS,
  ASCII_WARMUP_SAMPLE_MS,
  COARSE_MAX_CELLS,
  MAX_CELLS,
  NARROW_VIEWPORT_PX,
  SAMPLE_MS,
  VIDEO_PRELOAD,
  cellBudget,
  isPointerCoarse,
  pickGrid,
  planAsciiFrame,
  sampleMsForLoop,
  shouldRefineOccupancy,
  shouldSkipSample,
  shouldStartLoop,
  shouldYieldToMain,
  stampSliceEnd,
  yieldToMain,
} from "./heroAsciiBudget"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")

function readSrc(rel: string): string {
  return readFileSync(join(root, "src", rel), "utf8")
}

describe("hero ASCII loop budget", () => {
  it("rasters only when the 12fps sample window elapsed", () => {
    expect(ASCII_FPS).toBe(12)
    expect(SAMPLE_MS).toBeCloseTo(1000 / 12)
    expect(
      planAsciiFrame({ now: 90, lastSampleAt: 0, cameraDirty: false }),
    ).toBe("raster")
    expect(
      planAsciiFrame({ now: 80, lastSampleAt: 0, cameraDirty: false }),
    ).toBe("idle")
    expect(
      planAsciiFrame({
        now: 80,
        lastSampleAt: 0,
        cameraDirty: false,
        sampleMs: 50,
      }),
    ).toBe("raster")
  })

  it("applies camera only on dirty frames between samples", () => {
    expect(
      planAsciiFrame({ now: 40, lastSampleAt: 0, cameraDirty: true }),
    ).toBe("camera")
    expect(
      planAsciiFrame({ now: 40, lastSampleAt: 0, cameraDirty: false }),
    ).toBe("idle")
    expect(
      planAsciiFrame({ now: 90, lastSampleAt: 0, cameraDirty: true }),
    ).toBe("raster")
  })

  it("caps coarse and narrow viewports at 4000 cells without skipping a grid", () => {
    expect(cellBudget(1920, false)).toBe(MAX_CELLS)
    expect(cellBudget(1920, true)).toBe(COARSE_MAX_CELLS)
    expect(cellBudget(NARROW_VIEWPORT_PX - 1, false)).toBe(COARSE_MAX_CELLS)
    expect(isPointerCoarse((() => ({ matches: true })) as unknown as typeof matchMedia)).toBe(
      true,
    )
    expect(isPointerCoarse((() => ({ matches: false })) as unknown as typeof matchMedia)).toBe(
      false,
    )

    const mobile = pickGrid(390, 844, cellBudget(390, true))
    expect(mobile.cols).toBeGreaterThan(0)
    expect(mobile.rows).toBeGreaterThan(0)
    expect(mobile.cols * mobile.rows).toBeLessThanOrEqual(COARSE_MAX_CELLS)

    const coarseWide = pickGrid(800, 1200, cellBudget(800, true))
    expect(coarseWide.cols * coarseWide.rows).toBeGreaterThan(0)
    expect(coarseWide.cols * coarseWide.rows).toBeLessThanOrEqual(COARSE_MAX_CELLS)

    const desktop = pickGrid(1920, 1080, cellBudget(1920, false))
    expect(desktop.cols * desktop.rows).toBeGreaterThan(0)
    expect(desktop.cols * desktop.rows).toBeLessThanOrEqual(MAX_CELLS)
  })

  it("does not start the loop until video has a frame and the tab is visible", () => {
    expect(
      shouldStartLoop({ alive: true, raf: 0, hidden: false, videoReady: true }),
    ).toBe(true)
    expect(
      shouldStartLoop({ alive: true, raf: 0, hidden: false, videoReady: false }),
    ).toBe(false)
    expect(
      shouldStartLoop({ alive: true, raf: 1, hidden: false, videoReady: true }),
    ).toBe(false)
    expect(
      shouldStartLoop({ alive: true, raf: 0, hidden: true, videoReady: true }),
    ).toBe(false)
    expect(
      shouldStartLoop({ alive: false, raf: 0, hidden: false, videoReady: true }),
    ).toBe(false)
  })

  it("yields the first raster and skips the next sample after a long pass", () => {
    expect(shouldYieldToMain(0, 0)).toBe(true)
    expect(shouldYieldToMain(1, 16)).toBe(false)
    expect(shouldYieldToMain(1, 51)).toBe(true)
    expect(shouldSkipSample(16)).toBe(false)
    expect(shouldSkipSample(51)).toBe(true)
  })

  it("runs the ASCII loop at 1fps during warmup then 12fps", () => {
    expect(sampleMsForLoop(100, 100, 0)).toBe(SAMPLE_MS)
    expect(sampleMsForLoop(1000, 0, 1)).toBe(ASCII_WARMUP_SAMPLE_MS)
    expect(sampleMsForLoop(ASCII_WARMUP_MS + 1, 0, 8)).toBe(SAMPLE_MS)
  })

  it("skips occupancy refine during warmup and slices stamp rows on budget", () => {
    expect(shouldRefineOccupancy(100, 100)).toBe(false)
    expect(shouldRefineOccupancy(ASCII_WARMUP_MS, 0)).toBe(true)
    expect(stampSliceEnd(0, 40, 0, 1)).toBe(40)
    expect(stampSliceEnd(4, 40, 0, 20)).toBe(5)
  })

  it("yields the main thread without hanging if scheduler.yield never settles", async () => {
    await expect(yieldToMain()).resolves.toBeUndefined()
  })
})

describe("hero ASCII runtime wiring", () => {
  it("keeps WebGL raster inside the 12fps gate and does not preload the sampler as auto", () => {
    const runtime = readSrc("lib/heroAsciiRuntime.ts")
    expect(VIDEO_PRELOAD).toBe("none")
    expect(runtime).toContain("VIDEO_PRELOAD")
    expect(runtime).not.toMatch(/preload\s*=\s*["']auto["']/)
    expect(runtime).toContain("planAsciiFrame")
    expect(runtime).toContain("cellBudget")
    expect(runtime).toContain("startLoop")
    expect(runtime).toContain("shouldStartLoop")
    expect(runtime).not.toMatch(/if\s*\(\s*!document\.hidden\s*\)\s*raf\s*=\s*requestAnimationFrame\(tick\)/)
    expect(runtime).toMatch(/addEventListener\(\s*["']canplay["']/)
    expect(runtime).toContain("renderer.render")
    const passAt = runtime.indexOf("const runRasterPass")
    const renderAt = runtime.indexOf("renderer.render", passAt)
    const rasterCallAt = runtime.indexOf("stampSlice", renderAt)
    const tickAt = runtime.indexOf("const tick")
    const planAt = runtime.indexOf("planAsciiFrame", tickAt)
    expect(passAt).toBeGreaterThan(-1)
    expect(renderAt).toBeGreaterThan(passAt)
    expect(rasterCallAt).toBeGreaterThan(renderAt)
    expect(tickAt).toBeGreaterThan(passAt)
    expect(planAt).toBeGreaterThan(tickAt)
    expect(runtime.indexOf("runRasterPass()", tickAt)).toBeGreaterThan(planAt)
    expect(runtime).toContain("readPixels")
    expect(runtime).toContain("putImageData")
    expect(runtime).toContain("stampGlyphAlpha")
    expect(runtime).toContain("stampSliceEnd")
    expect(runtime).toContain("shouldContinueStamp")
  })

  it("does not skip ASCII on coarse pointers and leaves the idle chrome gate locked", () => {
    const runtime = readSrc("lib/heroAsciiRuntime.ts")
    const hero = readSrc("components/Hero.tsx")
    const home = readSrc("pages/index.astro")
    expect(runtime).not.toMatch(/ascii\.width\s*<\s*800/)
    expect(runtime).toContain("cellBudget")
    expect(hero).toContain("<HeroAsciiBackground")
    expect(hero).toContain("timeout: 2000")
    expect(hero).toContain("requestIdleCallback")
    expect(home.match(/<Hero client:load \/>/g)?.length).toBe(1)
  })
})
