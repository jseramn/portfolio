import { MAX_CELLS } from "../../heroAsciiBudget"
import { rgbaOffset } from "./stamp"

export const CHARSET = " .:-=+*#%@"
export const PAPER_LUMA = 0.12
export const OPACITY_FLOOR = 0.16
export const OCCUPIED_IDX_MIN = 2
export const RIM_LUMA_DELTA = 0.09
export const STRETCH_LO = 0.02
export const STRETCH_HI = 0.98
export const LUMA_CONTRAST = 2.6
export const OCCUPANCY_MIN_NEIGHBORS = 2
export const CHARSET_LAST = CHARSET.length - 1
export const OCCUPIED_IDX_SPAN = CHARSET_LAST - OCCUPIED_IDX_MIN

export type GlyphBuffers = {
  cellLuma: Float32Array
  cellOccupied: Uint8Array
  occupiedLumaScratch: Float32Array
  cellGlyphIdx: Uint8Array
  cellAlpha: Float32Array
  stampMinGX: number
  stampMinGY: number
  stampMaxGX: number
  stampMaxGY: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function contrast01(value: number, amount: number): number {
  const t = clamp(value, 0, 1)
  const denom = Math.tanh(0.5 * amount)
  if (denom < 1e-6) return t
  return clamp(0.5 + (Math.tanh((t - 0.5) * amount) / denom) * 0.5, 0, 1)
}

export function createGlyphBuffers(): Pick<
  GlyphBuffers,
  "cellLuma" | "cellOccupied" | "occupiedLumaScratch" | "cellGlyphIdx" | "cellAlpha"
> {
  return {
    cellLuma: new Float32Array(MAX_CELLS),
    cellOccupied: new Uint8Array(MAX_CELLS),
    occupiedLumaScratch: new Float32Array(MAX_CELLS),
    cellGlyphIdx: new Uint8Array(MAX_CELLS),
    cellAlpha: new Float32Array(MAX_CELLS),
  }
}

export function rebuildGlyphAtlas(
  displayCtx: CanvasRenderingContext2D,
  cellW: number,
  cellH: number,
): { glyphBits: Uint8ClampedArray[]; glyphAtlasW: number; glyphAtlasH: number } {
  displayCtx.font = `${Math.ceil(cellH)}px courier new, monospace`
  displayCtx.textBaseline = "top"
  displayCtx.textAlign = "left"
  const glyphAtlasW = Math.max(1, Math.ceil(cellW))
  const glyphAtlasH = Math.max(1, Math.ceil(cellH))
  const atlas = document.createElement("canvas")
  atlas.width = glyphAtlasW * CHARSET.length
  atlas.height = glyphAtlasH
  const atlasCtx = atlas.getContext("2d", { willReadFrequently: true })
  const glyphBits: Uint8ClampedArray[] = []
  if (atlasCtx) {
    atlasCtx.font = displayCtx.font
    atlasCtx.textBaseline = "top"
    atlasCtx.textAlign = "left"
    atlasCtx.fillStyle = "#fff"
    for (let i = 0; i < CHARSET.length; i++) {
      const glyph = CHARSET[i]
      if (glyph) atlasCtx.fillText(glyph, i * glyphAtlasW, 0)
      glyphBits.push(atlasCtx.getImageData(i * glyphAtlasW, 0, glyphAtlasW, glyphAtlasH).data)
    }
  }
  return { glyphBits, glyphAtlasW, glyphAtlasH }
}

export function prepareCellGlyphs(
  data: Uint8Array | Uint8ClampedArray,
  cols: number,
  rows: number,
  flipY: boolean,
  refine: boolean,
  buffers: GlyphBuffers,
) {
  const cellCount = Math.min(cols * rows, MAX_CELLS)

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      if (i >= cellCount) continue
      const p = rgbaOffset(x, y, cols, rows, flipY)
      const luma = (0.3 * data[p] + 0.59 * data[p + 1] + 0.11 * data[p + 2]) / 255
      buffers.cellLuma[i] = luma
      buffers.cellOccupied[i] = luma < PAPER_LUMA ? 0 : 1
      buffers.cellGlyphIdx[i] = 0
      buffers.cellAlpha[i] = 0
    }
  }

  const occupiedAt = (nx: number, ny: number): number => {
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return 0
    const ni = ny * cols + nx
    if (ni >= cellCount) return 0
    return buffers.cellOccupied[ni]
  }

  let occupiedN = 0
  if (refine) {
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        if (i >= cellCount || buffers.cellOccupied[i] === 0) continue
        const n =
          occupiedAt(x - 1, y) + occupiedAt(x + 1, y) + occupiedAt(x, y - 1) + occupiedAt(x, y + 1)
        buffers.occupiedLumaScratch[i] = n < OCCUPANCY_MIN_NEIGHBORS ? 1 : 0
      }
    }
    for (let i = 0; i < cellCount; i++) {
      if (buffers.cellOccupied[i] !== 0 && buffers.occupiedLumaScratch[i] === 1) {
        buffers.cellOccupied[i] = 0
      }
      if (buffers.cellOccupied[i] !== 0) {
        buffers.occupiedLumaScratch[occupiedN++] = buffers.cellLuma[i]
      }
    }
  } else {
    for (let i = 0; i < cellCount; i++) {
      if (buffers.cellOccupied[i] !== 0) {
        buffers.occupiedLumaScratch[occupiedN++] = buffers.cellLuma[i]
      }
    }
  }

  let p10 = 0
  let p90 = 1
  let skipStretch = !refine || occupiedN < 2
  if (!skipStretch) {
    const sorted = buffers.occupiedLumaScratch.subarray(0, occupiedN)
    sorted.sort((a, b) => a - b)
    const last = occupiedN - 1
    p10 = sorted[clamp(Math.round(last * STRETCH_LO), 0, last)]
    p90 = sorted[clamp(Math.round(last * STRETCH_HI), 0, last)]
    skipStretch = p90 - p10 < 1e-6
  }
  const stretchRange = p90 - p10

  const neighborLuma = (nx: number, ny: number): number => {
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return 0
    const ni = ny * cols + nx
    if (ni >= cellCount || buffers.cellOccupied[ni] === 0) return 0
    return buffers.cellLuma[ni]
  }

  buffers.stampMinGX = cols
  buffers.stampMinGY = rows
  buffers.stampMaxGX = 0
  buffers.stampMaxGY = 0

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      if (i >= cellCount || buffers.cellOccupied[i] === 0) continue

      const luma = buffers.cellLuma[i]
      const stretched = skipStretch ? luma : clamp((luma - p10) / stretchRange, 0, 1)
      const contrasted = contrast01(stretched, LUMA_CONTRAST)
      const alpha = OPACITY_FLOOR + contrasted * (1 - OPACITY_FLOOR)
      const baseIdx = clamp(
        OCCUPIED_IDX_MIN + Math.round((1 - contrasted) * OCCUPIED_IDX_SPAN),
        OCCUPIED_IDX_MIN,
        CHARSET_LAST,
      )
      const maxDelta = refine
        ? Math.max(
            Math.abs(luma - neighborLuma(x - 1, y)),
            Math.abs(luma - neighborLuma(x + 1, y)),
            Math.abs(luma - neighborLuma(x, y - 1)),
            Math.abs(luma - neighborLuma(x, y + 1)),
          )
        : 0
      const rimStep = maxDelta >= RIM_LUMA_DELTA * 2 ? 2 : maxDelta >= RIM_LUMA_DELTA ? 1 : 0
      const idx = Math.min(CHARSET_LAST, baseIdx + rimStep)
      const glyph = CHARSET[idx]
      if (glyph === undefined || glyph === " ") continue
      buffers.cellGlyphIdx[i] = idx
      buffers.cellAlpha[i] = alpha
      if (x < buffers.stampMinGX) buffers.stampMinGX = x
      if (y < buffers.stampMinGY) buffers.stampMinGY = y
      if (x > buffers.stampMaxGX) buffers.stampMaxGX = x
      if (y > buffers.stampMaxGY) buffers.stampMaxGY = y
    }
  }
}
