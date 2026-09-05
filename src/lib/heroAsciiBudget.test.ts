import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  ASCII_FPS,
  ASCII_IDLE_TIMEOUT_MS,
  ASCII_WARMUP_MS,
  COARSE_MAX_CELLS,
  MAX_CELLS,
  NARROW_VIEWPORT_PX,
  SAMPLE_MS,
  VIDEO_PRELOAD,
  cellBudget,
  pickGrid,
  planAsciiFrame,
  sampleMsForLoop,
  scheduleAsciiStart,
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

function readAsciiRuntime(): string {
  const dir = join(root, "src/lib/hero/ascii")
  return readdirSync(dir)
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .sort()
    .map((name) => readFileSync(join(dir, name), "utf8"))
    .join("\n")
}

describe("hero ASCII loop budget", () => {
  it("rasters only when the 12fps sample window elapsed", () => {
    expect(ASCII_FPS).toBe(12)
    expect(SAMPLE_MS).toBeCloseTo(1000 / ASCII_FPS)
    expect(planAsciiFrame({ now: 90, lastSampleAt: 0, cameraDirty: false })).toBe("raster")
    expect(planAsciiFrame({ now: 80, lastSampleAt: 0, cameraDirty: false })).toBe("idle")
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
    expect(planAsciiFrame({ now: 40, lastSampleAt: 0, cameraDirty: true })).toBe("camera")
    expect(planAsciiFrame({ now: 40, lastSampleAt: 0, cameraDirty: false })).toBe("idle")
    expect(planAsciiFrame({ now: 90, lastSampleAt: 0, cameraDirty: true })).toBe("raster")
  })

  it("caps coarse and narrow viewports at 4000 cells without skipping a grid", () => {
    expect(cellBudget(1920, false)).toBe(MAX_CELLS)
    expect(cellBudget(1920, true)).toBe(COARSE_MAX_CELLS)
    expect(cellBudget(NARROW_VIEWPORT_PX - 1, false)).toBe(COARSE_MAX_CELLS)

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
    expect(shouldStartLoop({ alive: true, raf: 0, hidden: false, videoReady: true })).toBe(true)
    expect(shouldStartLoop({ alive: true, raf: 0, hidden: false, videoReady: false })).toBe(false)
    expect(shouldStartLoop({ alive: true, raf: 1, hidden: false, videoReady: true })).toBe(false)
    expect(shouldStartLoop({ alive: true, raf: 0, hidden: true, videoReady: true })).toBe(false)
    expect(shouldStartLoop({ alive: false, raf: 0, hidden: false, videoReady: true })).toBe(false)
  })

  it("yields the first raster and skips the next sample after a long pass", () => {
    expect(shouldYieldToMain(0, 0)).toBe(true)
    expect(shouldYieldToMain(1, 16)).toBe(false)
    expect(shouldYieldToMain(1, 51)).toBe(true)
    expect(shouldSkipSample(16)).toBe(false)
    expect(shouldSkipSample(51)).toBe(true)
  })

  it("samples at SAMPLE_MS after the first stamp, including during warmup", () => {
    expect(sampleMsForLoop(100, 100, 0)).toBe(SAMPLE_MS)
    expect(sampleMsForLoop(1000, 0, 1)).toBe(SAMPLE_MS)
    expect(sampleMsForLoop(ASCII_WARMUP_MS - 1, 0, 1)).toBe(SAMPLE_MS)
    expect(sampleMsForLoop(ASCII_WARMUP_MS + 1, 0, 8)).toBe(SAMPLE_MS)
  })

  it("skips occupancy refine during warmup and slices stamp rows on budget", () => {
    expect(shouldRefineOccupancy(100, 100)).toBe(false)
    expect(shouldRefineOccupancy(1000, 0)).toBe(false)
    expect(sampleMsForLoop(1000, 0, 1)).toBe(SAMPLE_MS)
    expect(shouldRefineOccupancy(ASCII_WARMUP_MS, 0)).toBe(true)
    expect(stampSliceEnd(0, 40, 0, 1)).toBe(40)
    expect(stampSliceEnd(4, 40, 0, 20)).toBe(5)
  })

  it("yields the main thread without hanging if scheduler.yield never settles", async () => {
    await expect(yieldToMain()).resolves.toBeUndefined()
  })

  it("starts ASCII after first paint then idle, and cancel prevents start", () => {
    const rafs: Array<(time: number) => void> = []
    const idles: Array<() => void> = []
    const cancelledIdle: number[] = []
    let started = 0
    const host = {
      requestAnimationFrame: (cb: (time: number) => void) => {
        rafs.push(cb)
        return rafs.length
      },
      cancelAnimationFrame: () => {},
      requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => {
        expect(opts?.timeout).toBe(ASCII_IDLE_TIMEOUT_MS)
        idles.push(cb)
        return idles.length
      },
      cancelIdleCallback: (id: number) => {
        cancelledIdle.push(id)
      },
      setTimeout: () => 0,
      clearTimeout: () => {},
    }
    const stop = scheduleAsciiStart(() => {
      started += 1
    }, host)
    expect(started).toBe(0)
    rafs[0]?.(0)
    expect(started).toBe(0)
    rafs[1]?.(0)
    expect(idles).toHaveLength(1)
    expect(started).toBe(0)
    idles[0]?.()
    expect(started).toBe(1)

    started = 0
    const rafs2: Array<(time: number) => void> = []
    const idles2: Array<() => void> = []
    const host2 = {
      ...host,
      requestAnimationFrame: (cb: (time: number) => void) => {
        rafs2.push(cb)
        return rafs2.length
      },
      requestIdleCallback: (cb: () => void) => {
        idles2.push(cb)
        return 9
      },
    }
    const cancel = scheduleAsciiStart(() => {
      started += 1
    }, host2)
    rafs2[0]?.(0)
    rafs2[1]?.(0)
    cancel()
    idles2[0]?.()
    expect(started).toBe(0)
    expect(cancelledIdle).toContain(9)
    stop()
  })

  it("falls back to setTimeout(0) when requestIdleCallback is missing", () => {
    const rafs: Array<(time: number) => void> = []
    let timeoutMs: number | undefined
    let started = 0
    const host = {
      requestAnimationFrame: (cb: (time: number) => void) => {
        rafs.push(cb)
        return rafs.length
      },
      cancelAnimationFrame: () => {},
      setTimeout: (handler: () => void, timeout?: number) => {
        timeoutMs = timeout
        handler()
        return 1
      },
      clearTimeout: () => {},
    }
    scheduleAsciiStart(() => {
      started += 1
    }, host)
    rafs[0]?.(0)
    rafs[1]?.(0)
    expect(timeoutMs).toBe(0)
    expect(started).toBe(1)
  })
})

describe("hero ASCII runtime wiring", () => {
  it("keeps WebGL raster inside the 12fps gate and does not preload the sampler as auto", () => {
    const runtime = readAsciiRuntime()
    expect(VIDEO_PRELOAD).toBe("none")
    expect(runtime).toContain("video.preload = VIDEO_PRELOAD")
    expect(runtime).not.toMatch(/preload\s*=\s*["']auto["']/)
    expect(runtime).toContain("takeFirstAsciiPaint")
    expect(runtime).toContain("planAsciiFrame")
    expect(runtime).toContain("cellBudget")
    expect(runtime).toContain("startLoop")
    expect(runtime).toContain("shouldStartLoop")
    expect(runtime).not.toMatch(
      /if\s*\(\s*!document\.hidden\s*\)\s*raf\s*=\s*requestAnimationFrame\(tick\)/,
    )
    expect(runtime).toMatch(/addEventListener\(\s*["']canplay["']/)
    expect(runtime).not.toContain("renderer.render")
    expect(runtime).toContain("sampler.draw")
    expect(runtime).toContain("runRasterPass")
    expect(runtime).toContain("captureGlPixels")
    expect(runtime).toContain("readPixels")
    expect(runtime).toContain("putImageData")
    expect(runtime).toContain("stampGlyphAlpha")
    expect(runtime).toContain("stampSliceEnd")
    expect(runtime).toContain("shouldContinueStamp")
  })

  it("does not skip ASCII on coarse pointers; Hero chrome stays free of idle gates", () => {
    const runtime = readAsciiRuntime()
    const hero = readSrc("components/Hero.tsx")
    const home = readSrc("pages/index.astro")
    expect(runtime).not.toMatch(/ascii\.width\s*<\s*800/)
    expect(runtime).toContain("cellBudget")
    expect(runtime).toContain("signalHeroBootReady")
    expect(runtime).toContain("takeFirstAsciiPaint")
    expect(hero).toContain("<HeroAsciiBackground")
    expect(hero).not.toContain("timeout: 0")
    expect(hero).not.toContain("timeout: 2000")
    expect(hero).not.toContain("requestIdleCallback")
    expect(hero).not.toContain("document.fonts")
    expect(home.match(/<Hero client:load \/>/g)?.length).toBe(1)
    expect(home).toContain('id="boot-loader"')
    expect(home).toContain("installBootLoader")
  })
})
