import {
  MAX_CELLS,
  shouldRefineOccupancy,
  shouldSkipSample,
  stampSliceEnd,
  yieldToMain,
} from "../../heroAsciiBudget"
import { signalHeroBootReady, takeFirstAsciiPaint } from "../../bootLoader"
import { applyCameraIfNeeded, EXTRUDE, PLANE_H, PLANE_W, SAMPLE_COLS, SAMPLE_ROWS } from "./scene"
import { prepareCellGlyphs } from "./glyphs"
import { cellDestRect, shouldContinueStamp, stampGlyphAlpha } from "./stamp"
import type { HeroAsciiSession } from "./session"

export function sampleLuminance(session: HeroAsciiSession) {
  if (!session.sampleCtx || session.video.readyState < 2) return
  session.sampleCtx.drawImage(session.video, 0, 0, SAMPLE_COLS, SAMPLE_ROWS)
  const pixels = session.sampleCtx.getImageData(0, 0, SAMPLE_COLS, SAMPLE_ROWS).data
  for (let row = 0; row < SAMPLE_ROWS; row++) {
    for (let col = 0; col < SAMPLE_COLS; col++) {
      const i = row * SAMPLE_COLS + col
      const p = i * 4
      const r = pixels[p] / 255
      const g = pixels[p + 1] / 255
      const b = pixels[p + 2] / 255
      const lum = 0.299 * r + 0.587 * g + 0.114 * b
      const i3 = i * 3
      session.positions[i3] = ((col + 0.5) / SAMPLE_COLS - 0.5) * PLANE_W
      session.positions[i3 + 1] = (0.5 - (row + 0.5) / SAMPLE_ROWS) * PLANE_H
      session.positions[i3 + 2] = lum * EXTRUDE
      session.colors[i3] = r
      session.colors[i3 + 1] = g
      session.colors[i3 + 2] = b
    }
  }
  session.pointsGeometry.getAttribute("position").needsUpdate = true
  session.pointsGeometry.getAttribute("color").needsUpdate = true
}

export function captureGlPixels(session: HeroAsciiSession): boolean {
  const t = session.video.currentTime
  if (t !== session.lastVideoTime) {
    session.lastVideoTime = t
    sampleLuminance(session)
    session.videoTexture.needsUpdate = true
  }
  applyCameraIfNeeded(session)
  session.renderer.render(session.scene, session.camera)
  const cols = session.asciiSample.width
  const rows = session.asciiSample.height
  const need = cols * rows * 4
  if (session.glPixels.length < need) session.glPixels = new Uint8Array(need)
  let flipY = true
  try {
    const gl = session.renderer.getContext()
    if (!gl || cols <= 0 || rows <= 0) throw new Error("no-gl")
    gl.readPixels(0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, session.glPixels)
  } catch {
    if (!session.asciiCtx) return false
    session.asciiCtx.drawImage(session.renderer.domElement, 0, 0)
    session.glPixels.set(session.asciiCtx.getImageData(0, 0, cols, rows).data)
    flipY = false
  }
  session.glFlipY = flipY
  return true
}

export function stampRow(session: HeroAsciiSession, y: number) {
  const cols = session.asciiSample.width
  const cssW = session.displayCanvas.width
  const cssH = session.displayCanvas.height
  const cellCount = Math.min(cols * session.asciiSample.height, MAX_CELLS)
  for (let x = 0; x < cols; x++) {
    const i = y * cols + x
    if (i >= cellCount) continue
    const idx = session.cellGlyphIdx[i]
    if (idx === 0) continue
    const bits = session.glyphBits[idx]
    if (!bits) continue
    const rect = cellDestRect(x, y, session.cellW, session.cellH, cssW, cssH)
    stampGlyphAlpha(
      session.displayPixels,
      cssW,
      cssH,
      bits,
      session.glyphAtlasW,
      session.glyphAtlasH,
      rect.dx,
      rect.dy,
      rect.dw,
      rect.dh,
      session.cellAlpha[i],
    )
  }
}

export function finishStamp(session: HeroAsciiSession) {
  if (session.stampMaxGX >= session.stampMinGX && session.stampMaxGY >= session.stampMinGY) {
    session.displayCanvas.dataset.glassBox = `${session.stampMinGX * session.cellW},${session.stampMinGY * session.cellH},${(session.stampMaxGX - session.stampMinGX + 1) * session.cellW},${(session.stampMaxGY - session.stampMinGY + 1) * session.cellH}`
  }
  session.displayCanvas.dataset.glassGen = String(
    (Number(session.displayCanvas.dataset.glassGen) || 0) + 1,
  )
  if (takeFirstAsciiPaint(session.displayCanvas.dataset)) signalHeroBootReady()
  session.stampCursor = -1
  session.rastersCompleted += 1
  session.rasterBusy = false
}

export function stampSlice(session: HeroAsciiSession) {
  if (!session.alive) {
    session.rasterBusy = false
    session.stampCursor = -1
    return
  }
  const rows = session.asciiSample.height
  if (!shouldContinueStamp(session.stampCursor, rows)) {
    finishStamp(session)
    return
  }
  const started = performance.now()
  let y = session.stampCursor
  let end = stampSliceEnd(y, rows, started, started)
  while (y < end) {
    stampRow(session, y)
    y += 1
    end = stampSliceEnd(session.stampCursor, rows, started, performance.now())
  }
  session.stampCursor = y
  session.lastRasterMs = performance.now() - started
  session.skipNextSample = shouldSkipSample(session.lastRasterMs)
  if (session.displayCtx) session.displayCtx.putImageData(session.displayImage, 0, 0)
  if (takeFirstAsciiPaint(session.displayCanvas.dataset)) signalHeroBootReady()
  if (shouldContinueStamp(session.stampCursor, rows)) {
    session.rasterBusy = true
    return
  }
  finishStamp(session)
}

export async function runRasterPass(session: HeroAsciiSession) {
  const splitStartup = session.rastersCompleted === 0
  if (!captureGlPixels(session)) return
  if (splitStartup) await yieldToMain()
  if (!session.alive) return
  prepareCellGlyphs(
    session.glPixels,
    session.asciiSample.width,
    session.asciiSample.height,
    session.glFlipY,
    shouldRefineOccupancy(performance.now(), session.mountedAt),
    session,
  )
  if (splitStartup) await yieldToMain()
  if (!session.alive) return
  session.displayPixels.fill(0)
  session.stampCursor = 0
  stampSlice(session)
}
