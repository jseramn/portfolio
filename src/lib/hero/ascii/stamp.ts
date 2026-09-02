export function rgbaOffset(
  x: number,
  y: number,
  cols: number,
  rows: number,
  flipY: boolean,
): number {
  const gy = flipY ? rows - 1 - y : y
  return (gy * cols + x) * 4
}

export function cellDestRect(
  x: number,
  y: number,
  cellW: number,
  cellH: number,
  destW: number,
  destH: number,
): { dx: number; dy: number; dw: number; dh: number } {
  const dx = Math.min(destW, Math.max(0, Math.floor(x * cellW)))
  const dy = Math.min(destH, Math.max(0, Math.floor(y * cellH)))
  const right = Math.min(destW, Math.max(dx, Math.floor((x + 1) * cellW)))
  const bottom = Math.min(destH, Math.max(dy, Math.floor((y + 1) * cellH)))
  return { dx, dy, dw: right - dx, dh: bottom - dy }
}

export function stampGlyphAlpha(
  dest: Uint8ClampedArray,
  destW: number,
  destH: number,
  glyph: Uint8ClampedArray,
  gw: number,
  gh: number,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  alpha: number,
) {
  if (dw <= 0 || dh <= 0 || gw <= 0 || gh <= 0) return
  const a = Math.max(0, Math.min(1, alpha))
  for (let y = 0; y < dh; y++) {
    const destY = dy + y
    if (destY < 0 || destY >= destH) continue
    const sy = Math.min(gh - 1, Math.floor((y * gh) / dh))
    for (let x = 0; x < dw; x++) {
      const destX = dx + x
      if (destX < 0 || destX >= destW) continue
      const sx = Math.min(gw - 1, Math.floor((x * gw) / dw))
      const si = (sy * gw + sx) * 4
      const srcA = glyph[si + 3] / 255
      if (srcA < 0.01) continue
      const di = (destY * destW + destX) * 4
      dest[di] = 255
      dest[di + 1] = 255
      dest[di + 2] = 255
      dest[di + 3] = Math.round(srcA * a * 255)
    }
  }
}

export function shouldContinueStamp(cursor: number, rows: number): boolean {
  return cursor >= 0 && cursor < rows
}
