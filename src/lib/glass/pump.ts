import { ASCII_FPS } from "../capabilities"
import {
  ARIA_MODAL_ATTR,
  CONTACT_MODAL_OPEN_ATTR,
  GLASS_GEN_ATTR,
  getAsciiCanvas,
  getHeroRoot,
  isAsciiReadyForGlass,
  isUiBlockingOverlayOpen,
} from "../domSignals"

const GLASS_MS = 1000 / ASCII_FPS
const glassJobs = new Set<() => void>()
let glassPump = 0
let glassPumpAt = 0
let pumpAscii: HTMLCanvasElement | null = null
let pumpAsciiRect: DOMRect | null = null
let glassResumeBound = false
let glassAsciiWaitBound = false
let glassResumeObserver: MutationObserver | null = null
let glassResumeOnVis: (() => void) | null = null
let glassAsciiWaitObserver: MutationObserver | null = null

function glassDocument(): Document | undefined {
  if (!("document" in globalThis) || globalThis.document == null) return undefined
  return globalThis.document
}

function glassShouldPause() {
  const document = glassDocument()
  if (!document) return true
  if (document.hidden) return true
  return isUiBlockingOverlayOpen(document)
}

function asciiReadyForGlass(): HTMLCanvasElement | null {
  const document = glassDocument()
  if (!document) return null
  const ascii = getAsciiCanvas(document)
  return isAsciiReadyForGlass(ascii) ? ascii : null
}

function unbindGlassAsciiWait() {
  glassAsciiWaitObserver?.disconnect()
  glassAsciiWaitObserver = null
  glassAsciiWaitBound = false
}

function unbindGlassResume() {
  const document = glassDocument()
  if (glassResumeOnVis && document) {
    document.removeEventListener("visibilitychange", glassResumeOnVis)
    glassResumeOnVis = null
  }
  glassResumeObserver?.disconnect()
  glassResumeObserver = null
  glassResumeBound = false
}

function bindGlassAsciiWait() {
  const document = glassDocument()
  if (glassAsciiWaitBound || !document) return
  glassAsciiWaitBound = true
  glassAsciiWaitObserver = new MutationObserver(() => {
    if (!asciiReadyForGlass()) return
    unbindGlassAsciiWait()
    ensureGlassPump()
  })
  const root = getHeroRoot(document) ?? document.documentElement
  glassAsciiWaitObserver.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [GLASS_GEN_ATTR],
  })
}

function bindGlassResume() {
  const document = glassDocument()
  if (glassResumeBound || !document) return
  glassResumeBound = true
  glassResumeOnVis = () => {
    if (glassShouldPause()) return
    ensureGlassPump()
  }
  document.addEventListener("visibilitychange", glassResumeOnVis)
  glassResumeObserver = new MutationObserver(glassResumeOnVis)
  glassResumeObserver.observe(document.documentElement, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [CONTACT_MODAL_OPEN_ATTR, ARIA_MODAL_ATTR, "hidden"],
  })
}

function ensureGlassPump() {
  if (glassPump) return
  if (glassShouldPause()) {
    bindGlassResume()
    return
  }
  if (!asciiReadyForGlass()) {
    bindGlassAsciiWait()
    return
  }
  const document = glassDocument()
  const step = (now: number) => {
    if (glassJobs.size === 0) {
      stopGlassPumpIfIdle()
      return
    }
    if (glassShouldPause()) {
      cancelAnimationFrame(glassPump)
      glassPump = 0
      bindGlassResume()
      return
    }
    glassPump = requestAnimationFrame(step)
    if (now - glassPumpAt < GLASS_MS) return
    glassPumpAt = now
    pumpAscii = document ? getAsciiCanvas(document) : null
    pumpAsciiRect = pumpAscii?.getBoundingClientRect() ?? null
    for (const job of glassJobs) job()
  }
  glassPump = requestAnimationFrame(step)
}

function stopGlassPumpIfIdle() {
  if (glassJobs.size > 0) return
  cancelAnimationFrame(glassPump)
  glassPump = 0
  unbindGlassResume()
  unbindGlassAsciiWait()
}

export function getPumpAscii(): {
  canvas: HTMLCanvasElement | null
  rect: DOMRect | null
} {
  return { canvas: pumpAscii, rect: pumpAsciiRect }
}

export function registerGlassJob(job: () => void): () => void {
  glassJobs.add(job)
  ensureGlassPump()
  return () => {
    glassJobs.delete(job)
    stopGlassPumpIfIdle()
  }
}
