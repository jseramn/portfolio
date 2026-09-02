import {
  planAsciiFrame,
  sampleMsForLoop,
  shouldStartLoop,
  shouldYieldToMain,
  yieldToMain,
} from "../../heroAsciiBudget"
import { isUiBlockingOverlayOpen } from "../../domSignals"
import { applyCameraIfNeeded, cameraDirty, VIDEO_ZOOM } from "./scene"
import { runRasterPass, stampSlice } from "./raster"
import { shouldContinueStamp } from "./stamp"
import { tryPlay, videoReady } from "./video"
import type { HeroAsciiSession } from "./session"

export function createLoopState(): Pick<
  HeroAsciiSession,
  | "glyphBits"
  | "glyphAtlasW"
  | "glyphAtlasH"
  | "displayPixels"
  | "displayImage"
  | "glPixels"
  | "glFlipY"
  | "cellW"
  | "cellH"
  | "mouseX"
  | "mouseY"
  | "zoom"
  | "lastPointerAt"
  | "dragZoom"
  | "lastDragY"
  | "raf"
  | "alive"
  | "lastSampleAt"
  | "lastVideoTime"
  | "pausedForModal"
  | "stampCursor"
  | "stampMinGX"
  | "stampMinGY"
  | "stampMaxGX"
  | "stampMaxGY"
  | "appliedZoom"
  | "appliedMouseX"
  | "appliedMouseY"
  | "lastRasterMs"
  | "rastersCompleted"
  | "rasterBusy"
  | "skipNextSample"
  | "mountedAt"
  | "samplerFailed"
> {
  return {
    glyphBits: [],
    glyphAtlasW: 1,
    glyphAtlasH: 1,
    displayPixels: new Uint8ClampedArray(4),
    displayImage: new ImageData(1, 1),
    glPixels: new Uint8Array(4),
    glFlipY: true,
    cellW: 1,
    cellH: 1,
    mouseX: 0,
    mouseY: 0,
    zoom: VIDEO_ZOOM.default,
    lastPointerAt: 0,
    dragZoom: false,
    lastDragY: 0,
    raf: 0,
    alive: true,
    lastSampleAt: 0,
    lastVideoTime: Number.NaN,
    pausedForModal: false,
    stampCursor: -1,
    stampMinGX: 0,
    stampMinGY: 0,
    stampMaxGX: 0,
    stampMaxGY: 0,
    appliedZoom: Number.NaN,
    appliedMouseX: Number.NaN,
    appliedMouseY: Number.NaN,
    lastRasterMs: 0,
    rastersCompleted: 0,
    rasterBusy: false,
    skipNextSample: false,
    mountedAt: performance.now(),
    samplerFailed: false,
  }
}

export function startLoop(session: HeroAsciiSession) {
  if (
    !shouldStartLoop({
      alive: session.alive,
      raf: session.raf,
      hidden: document.hidden,
      videoReady: videoReady(session.video),
    })
  ) {
    return
  }
  session.raf = requestAnimationFrame((now) => tick(session, now))
}

export function stopLoop(session: HeroAsciiSession) {
  session.alive = false
  cancelAnimationFrame(session.raf)
  session.raf = 0
  session.video.pause()
}

export function onVisibility(session: HeroAsciiSession) {
  if (document.hidden) {
    cancelAnimationFrame(session.raf)
    session.raf = 0
    session.video.pause()
    return
  }
  tryPlay(session.video)
  startLoop(session)
}

export function tick(session: HeroAsciiSession, now: number) {
  if (!session.alive) return
  session.raf = requestAnimationFrame((t) => tick(session, t))

  if (isUiBlockingOverlayOpen(document)) {
    if (!session.pausedForModal) {
      session.video.pause()
      session.pausedForModal = true
    }
    return
  }
  if (session.pausedForModal) {
    session.pausedForModal = false
    tryPlay(session.video)
  }

  if (shouldContinueStamp(session.stampCursor, session.asciiSample.height)) {
    stampSlice(session)
    return
  }

  const plan = planAsciiFrame({
    now,
    lastSampleAt: session.lastSampleAt,
    cameraDirty: cameraDirty(session),
    sampleMs: sampleMsForLoop(now, session.mountedAt, session.rastersCompleted),
  })
  if (plan === "idle") return
  if (plan === "camera") {
    applyCameraIfNeeded(session)
    return
  }
  if (session.rasterBusy) return

  session.lastSampleAt = now
  if (session.skipNextSample) {
    session.skipNextSample = false
    applyCameraIfNeeded(session)
    return
  }

  const beginPass = () => {
    const go = async () => {
      try {
        if (!session.alive) {
          session.stampCursor = -1
          return
        }
        await runRasterPass(session)
      } catch {
        session.stampCursor = -1
      } finally {
        if (!shouldContinueStamp(session.stampCursor, session.asciiSample.height)) {
          session.rasterBusy = false
        }
      }
    }
    void go()
  }

  if (shouldYieldToMain(session.rastersCompleted, session.lastRasterMs)) {
    const yielded = yieldToMain()
    if (yielded) {
      session.rasterBusy = true
      void yielded.then(beginPass)
      return
    }
  }

  beginPass()
}
