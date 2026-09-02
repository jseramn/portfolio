import { ASCII_FPS } from "./capabilities"

export { ASCII_FPS }
export const SAMPLE_MS = 1000 / ASCII_FPS
export const MAX_CELLS = 12_000
export const COARSE_MAX_CELLS = 4_000
export const NARROW_VIEWPORT_PX = 800
export const GL_RESOLUTION = 0.15
export const RASTER_BUDGET_MS = 50
export const VIDEO_PRELOAD = "none" as const
export const ASCII_WARMUP_MS = 4_000
export const ASCII_WARMUP_SAMPLE_MS = 1_000
export const STAMP_SLICE_MS = 8

export type AsciiFramePlan = "raster" | "camera" | "idle"

export function cellBudget(cssWidth: number, pointerCoarse: boolean): number {
  if (pointerCoarse || cssWidth < NARROW_VIEWPORT_PX) return COARSE_MAX_CELLS
  return MAX_CELLS
}

export function pickGrid(
  cssW: number,
  cssH: number,
  maxCells: number,
  glResolution = GL_RESOLUTION,
): { cols: number; rows: number } {
  let cols = Math.max(1, Math.floor(cssW * glResolution))
  let rows = Math.max(1, Math.floor((cssH * glResolution) / 2))
  const cells = cols * rows
  if (cells > maxCells) {
    const scale = Math.sqrt(maxCells / cells)
    cols = Math.max(1, Math.floor(cols * scale))
    rows = Math.max(1, Math.floor(rows * scale))
    if (cols * rows > maxCells) {
      rows = Math.max(1, Math.floor(maxCells / cols))
    }
  }
  return { cols, rows }
}

export function sampleMsForLoop(
  now: number,
  mountedAt: number,
  rastersCompleted: number,
  sampleMs = SAMPLE_MS,
): number {
  if (rastersCompleted >= 1 && now - mountedAt < ASCII_WARMUP_MS) {
    return ASCII_WARMUP_SAMPLE_MS
  }
  return sampleMs
}

export function planAsciiFrame(opts: {
  now: number
  lastSampleAt: number
  cameraDirty: boolean
  sampleMs?: number
}): AsciiFramePlan {
  const due = opts.now - opts.lastSampleAt >= (opts.sampleMs ?? SAMPLE_MS)
  if (due) return "raster"
  if (opts.cameraDirty) return "camera"
  return "idle"
}

export function shouldStartLoop(opts: {
  alive: boolean
  raf: number
  hidden: boolean
  videoReady: boolean
}): boolean {
  return opts.alive && opts.raf === 0 && !opts.hidden && opts.videoReady
}

export function shouldSkipSample(lastRasterMs: number, budgetMs = RASTER_BUDGET_MS): boolean {
  return lastRasterMs > budgetMs
}

export function shouldYieldToMain(
  rastersCompleted: number,
  lastRasterMs: number,
  budgetMs = RASTER_BUDGET_MS,
): boolean {
  if (rastersCompleted === 0) return true
  return lastRasterMs > budgetMs
}

export function shouldRefineOccupancy(
  now: number,
  mountedAt: number,
  warmupMs = ASCII_WARMUP_MS,
): boolean {
  return now - mountedAt >= warmupMs
}

export function stampSliceEnd(
  startRow: number,
  rows: number,
  startedAt: number,
  now: number,
  sliceMs = STAMP_SLICE_MS,
): number {
  if (now - startedAt < sliceMs) return rows
  return Math.min(rows, startRow + 1)
}

export function coverDestRect(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const scale = Math.max(dstW / Math.max(srcW, 1), dstH / Math.max(srcH, 1))
  const dw = srcW * scale
  const dh = srcH * scale
  return { dx: (dstW - dw) / 2, dy: (dstH - dh) / 2, dw, dh }
}

export function yieldToMain(): Promise<void> {
  const scheduler = (globalThis as { scheduler?: { yield?: () => Promise<void> } }).scheduler
  const timeout = new Promise<void>((resolve) => setTimeout(resolve, 0))
  if (typeof scheduler?.yield === "function") {
    return Promise.race([scheduler.yield(), timeout])
  }
  return timeout
}
