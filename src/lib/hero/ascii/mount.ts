import { cellBudget, pickGrid, yieldToMain } from "../../heroAsciiBudget"
import { signalHeroBootReady } from "../../bootLoader"
import { getCapabilities } from "../../capabilities"
import { HERO_ASCII_DISPLAY_CLASS, getHeroRoot, isUiBlockingOverlayOpen } from "../../domSignals"
import { applyHeroSamplerFailure } from "../../heroAsciiSamplerFailure"
import { createGlyphBuffers, rebuildGlyphAtlas, clamp } from "./glyphs"
import { createLoopState, onVisibility, startLoop, stopLoop } from "./loop"
import {
  VIDEO_ZOOM,
  createAsciiScene,
  disposeAsciiScene,
  resizeAsciiView,
  SAMPLE_COLS,
  SAMPLE_ROWS,
} from "./scene"
import type { HeroAsciiMountOpts, HeroAsciiSession } from "./session"
import { loadThree } from "./three"
import { bindSamplerReady, createSamplerVideo, disposeSamplerVideo, tryPlay } from "./video"

export type { HeroAsciiMountOpts }

function eventInsideHero(event: Event): boolean {
  const root = getHeroRoot(document)
  if (!root || !(event.target instanceof Node)) return false
  return root.contains(event.target)
}

function attachControls(session: HeroAsciiSession): () => void {
  const onMouseMove = (event: MouseEvent) => {
    session.mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    session.mouseY = (event.clientY / window.innerHeight - 0.5) * 2
    session.lastPointerAt = performance.now()
  }
  const onPointerMove = (event: PointerEvent) => {
    session.mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    session.mouseY = (event.clientY / window.innerHeight - 0.5) * 2
    session.lastPointerAt = performance.now()
    if (session.dragZoom) {
      session.zoom = clamp(
        session.zoom + (event.clientY - session.lastDragY) * VIDEO_ZOOM.wheelStep * 3,
        VIDEO_ZOOM.min,
        VIDEO_ZOOM.max,
      )
      session.lastDragY = event.clientY
    }
  }
  const onPointerDown = (event: PointerEvent) => {
    const target = event.target
    const onControl =
      target instanceof Element &&
      Boolean(target.closest("a,button,input,textarea,[role='dialog']"))
    session.dragZoom = event.pointerType !== "mouse" && !onControl
    session.lastDragY = event.clientY
    session.lastPointerAt = performance.now()
  }
  const onPointerUp = () => {
    session.dragZoom = false
  }
  const onWheel = (event: WheelEvent) => {
    if (isUiBlockingOverlayOpen(document)) return
    const root = getHeroRoot(document)
    if (root) {
      if (!eventInsideHero(event)) return
      event.preventDefault()
    }
    session.zoom = clamp(
      session.zoom + event.deltaY * VIDEO_ZOOM.wheelStep,
      VIDEO_ZOOM.min,
      VIDEO_ZOOM.max,
    )
  }
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("pointermove", onPointerMove, { passive: true })
  window.addEventListener("pointerdown", onPointerDown, { passive: true })
  window.addEventListener("pointerup", onPointerUp, { passive: true })
  window.addEventListener("pointercancel", onPointerUp, { passive: true })
  window.addEventListener("wheel", onWheel, { passive: false })
  return () => {
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerdown", onPointerDown)
    window.removeEventListener("pointerup", onPointerUp)
    window.removeEventListener("pointercancel", onPointerUp)
    window.removeEventListener("wheel", onWheel)
  }
}

export async function mountHeroAscii(
  host: HTMLElement,
  opts: HeroAsciiMountOpts,
  paintCanvas?: HTMLCanvasElement | null,
): Promise<() => void> {
  const ownsPaintCanvas = !paintCanvas
  const displayCanvas = paintCanvas ?? document.createElement("canvas")
  if (ownsPaintCanvas) {
    displayCanvas.className = HERO_ASCII_DISPLAY_CLASS
    displayCanvas.setAttribute("aria-hidden", "true")
    host.appendChild(displayCanvas)
  }
  await yieldToMain()
  const three = await loadThree()
  await yieldToMain()

  const video = createSamplerVideo(host, opts)
  const bundle = createAsciiScene(three, video)
  if (!bundle) {
    video.pause()
    video.remove()
    signalHeroBootReady()
    return () => {}
  }
  await yieldToMain()

  const sample = document.createElement("canvas")
  sample.width = SAMPLE_COLS
  sample.height = SAMPLE_ROWS
  const asciiSample = document.createElement("canvas")
  const displayCtx =
    displayCanvas.getContext("2d", { alpha: true, desynchronized: true }) ??
    displayCanvas.getContext("2d", { alpha: true }) ??
    displayCanvas.getContext("2d")

  const session: HeroAsciiSession = {
    host,
    ownsPaintCanvas,
    displayCanvas,
    displayCtx,
    video,
    ...bundle,
    sample,
    sampleCtx: sample.getContext("2d", { willReadFrequently: true }),
    asciiSample,
    asciiCtx: asciiSample.getContext("2d", { willReadFrequently: true }),
    ...createGlyphBuffers(),
    ...createLoopState(),
  }

  const applySize = () => {
    const sizeHost =
      displayCanvas.parentElement instanceof HTMLElement ? displayCanvas.parentElement : host
    const width = sizeHost.clientWidth || host.clientWidth || window.innerWidth
    const height = sizeHost.clientHeight || host.clientHeight || window.innerHeight
    const { cols, rows } = pickGrid(
      width,
      height,
      cellBudget(width, getCapabilities().pointerCoarse),
    )
    resizeAsciiView(session, width, height, cols, rows)
    if (displayCtx) {
      if (session.rastersCompleted > 0) displayCtx.clearRect(0, 0, width, height)
      const atlas = rebuildGlyphAtlas(displayCtx, session.cellW, session.cellH)
      session.glyphBits = atlas.glyphBits
      session.glyphAtlasW = atlas.glyphAtlasW
      session.glyphAtlasH = atlas.glyphAtlasH
      session.displayPixels = new Uint8ClampedArray(width * height * 4)
      session.displayImage = new ImageData(session.displayPixels, width, height)
      session.glPixels = new Uint8Array(cols * rows * 4)
      session.stampCursor = -1
    }
  }

  const onVideoError = () => {
    if (session.samplerFailed) return
    session.samplerFailed = true
    applyHeroSamplerFailure(host, () => stopLoop(session))
    signalHeroBootReady()
  }
  const onVideoReady = () => {
    tryPlay(video)
    startLoop(session)
  }
  const handleVisibility = () => onVisibility(session)

  applySize()
  await yieldToMain()
  const detachControls = attachControls(session)
  window.addEventListener("resize", applySize)
  document.addEventListener("visibilitychange", handleVisibility)
  video.addEventListener("error", onVideoError)
  if (video.error) onVideoError()
  const unbindReady = bindSamplerReady(video, onVideoReady)

  return () => {
    stopLoop(session)
    detachControls()
    unbindReady()
    window.removeEventListener("resize", applySize)
    document.removeEventListener("visibilitychange", handleVisibility)
    video.removeEventListener("error", onVideoError)
    disposeSamplerVideo(video)
    if (ownsPaintCanvas) displayCanvas.remove()
    else if (displayCtx) displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)
    disposeAsciiScene(session)
  }
}
