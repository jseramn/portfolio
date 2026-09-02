import { CHARSET, createGlyphBuffers, PAPER_LUMA, prepareCellGlyphs } from "./hero/ascii/glyphs"
import { SAMPLE_COLS, SAMPLE_ROWS, VIDEO_ZOOM } from "./hero/ascii/scene"

export const FALLBACK_COLS = SAMPLE_COLS
export const FALLBACK_ROWS = SAMPLE_ROWS
export const ASCII_FALLBACK_SRC = "/ascii-fallback.svg"
export const ASCII_FALLBACK_MAX_BYTES = 30_000

export function rgb24ToRgba(rgb: Uint8Array): Uint8Array {
  const pixels = Math.floor(rgb.length / 3)
  const rgba = new Uint8Array(pixels * 4)
  for (let i = 0; i < pixels; i++) {
    rgba.set([rgb[i * 3], rgb[i * 3 + 1], rgb[i * 3 + 2], 255], i * 4)
  }
  return rgba
}

export function rgb24MeanLuma(rgb: Uint8Array): number {
  const pixels = Math.floor(rgb.length / 3)
  if (pixels <= 0) return 0
  let sum = 0
  for (let i = 0; i < pixels; i++) {
    sum += 0.3 * rgb[i * 3] + 0.59 * rgb[i * 3 + 1] + 0.11 * rgb[i * 3 + 2]
  }
  return sum / pixels / 255
}

export function firstNonBlackRgbFrame(
  raw: Uint8Array,
  cols = FALLBACK_COLS,
  rows = FALLBACK_ROWS,
  threshold = PAPER_LUMA,
): Uint8Array {
  const frameSize = cols * rows * 3
  if (raw.length < frameSize) throw new Error("ascii fallback: no rgb frames")
  const count = Math.floor(raw.length / frameSize)
  for (let i = 0; i < count; i++) {
    const slice = raw.subarray(i * frameSize, (i + 1) * frameSize)
    if (rgb24MeanLuma(slice) > threshold) return Uint8Array.from(slice)
  }
  return Uint8Array.from(raw.subarray((count - 1) * frameSize, count * frameSize))
}

export function asciiLinesFromRgba(
  data: Uint8Array | Uint8ClampedArray,
  cols: number,
  rows: number,
  refine = true,
): string[] {
  const buffers = {
    ...createGlyphBuffers(),
    stampMinGX: 0,
    stampMinGY: 0,
    stampMaxGX: 0,
    stampMaxGY: 0,
  }
  prepareCellGlyphs(data, cols, rows, false, refine, buffers)
  const lines: string[] = []
  for (let y = 0; y < rows; y++) {
    let line = ""
    for (let x = 0; x < cols; x++) line += CHARSET[buffers.cellGlyphIdx[y * cols + x]] ?? " "
    lines.push(line)
  }
  return lines
}

export function svgFromLines(lines: string[], cols: number, rows: number): string {
  const fontSize = 9 / Math.max(rows, 1)
  const tspans = lines
    .map((line, index) => {
      const cells = line.length >= cols ? line.slice(0, cols) : line.padEnd(cols, " ")
      return `<tspan x="0" y="${fontSize * (index + 1)}" textLength="16" lengthAdjust="spacingAndGlyphs">${cells.replaceAll("&", "&amp;").replaceAll("<", "&lt;")}</tspan>`
    })
    .join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9" preserveAspectRatio="xMidYMid slice"><rect width="16" height="9" fill="#000"/><g transform="translate(8 4.5) scale(${VIDEO_ZOOM.default}) translate(-8 -4.5)"><text fill="#fff" font-family="ui-monospace,'Courier New',monospace" font-size="${fontSize}" xml:space="preserve">${tspans}</text></g></svg>`
}

export function svgFromRgbaFrame(
  rgba: Uint8Array | Uint8ClampedArray,
  cols = FALLBACK_COLS,
  rows = FALLBACK_ROWS,
): string {
  return svgFromLines(asciiLinesFromRgba(rgba, cols, rows), cols, rows)
}
