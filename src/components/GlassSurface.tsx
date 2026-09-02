import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react"
import { ASCII_FPS, getCapabilities } from "../lib/capabilities"
import {
  ARIA_MODAL_ATTR,
  CONTACT_MODAL_OPEN_ATTR,
  GLASS_GEN_ATTR,
  getAsciiCanvas,
  getHeroRoot,
  isAsciiReadyForGlass,
  isUiBlockingOverlayOpen,
  readGlassBox,
  readGlassGen,
} from "../lib/domSignals"

export type GlassPreset = "bar" | "pill" | "dock" | "button" | "card" | "modal"

const PRESETS: Record<
  GlassPreset,
  {
    padding: string
    borderRadius: string
    cornerRadius: number
    elasticity: number
    displacementScale: number
    blurAmount: number
    saturation: number
    aberrationIntensity: number
  }
> = {
  bar: {
    padding: "8px 12px",
    borderRadius: "15px",
    cornerRadius: 15,
    elasticity: 0.75,
    displacementScale: 88,
    blurAmount: 0,
    saturation: 100,
    aberrationIntensity: 3,
  },
  pill: {
    padding: "6px 10px",
    borderRadius: "999px",
    cornerRadius: 999,
    elasticity: 0.05,
    displacementScale: 0,
    blurAmount: 0.1,
    saturation: 100,
    aberrationIntensity: 20,
  },
  dock: {
    padding: "8px",
    borderRadius: "999px",
    cornerRadius: 999,
    elasticity: 0.05,
    displacementScale: 0,
    blurAmount: 0.1,
    saturation: 100,
    aberrationIntensity: 20,
  },
  button: {
    padding: "4px 8px",
    borderRadius: "10px",
    cornerRadius: 10,
    elasticity: 0.05,
    displacementScale: 0,
    blurAmount: 0.1,
    saturation: 100,
    aberrationIntensity: 20,
  },
  card: {
    padding: "12px 16px",
    borderRadius: "15px",
    cornerRadius: 15,
    elasticity: 0.75,
    displacementScale: 88,
    blurAmount: 0,
    saturation: 100,
    aberrationIntensity: 3,
  },
  modal: {
    padding: "0",
    borderRadius: "15px",
    cornerRadius: 15,
    elasticity: 0.75,
    displacementScale: 88,
    blurAmount: 0,
    saturation: 100,
    aberrationIntensity: 3,
  },
}

const STRETCH_PRESETS = new Set<GlassPreset>(["bar", "modal"])
const CARD_FAMILY = new Set<GlassPreset>(["bar", "card", "modal"])

type CssBox = { left: number; top: number; width: number; height: number }

/** Map a pane's on-screen box onto the ASCII bitmap that sits behind it. */
export function behindRect(
  asciiW: number,
  asciiH: number,
  asciiCss: CssBox,
  hostCss: CssBox,
  mag = 1,
  occupied?: CssBox,
) {
  const scaleX = asciiW / Math.max(asciiCss.width, 1)
  const scaleY = asciiH / Math.max(asciiCss.height, 1)
  let sw = Math.max(1, (hostCss.width * scaleX) / mag)
  let sh = Math.max(1, (hostCss.height * scaleY) / mag)
  if (sw > asciiW) {
    sh *= asciiW / sw
    sw = asciiW
  }
  if (sh > asciiH) {
    sw *= asciiH / sh
    sh = asciiH
  }
  const cx = (hostCss.left + hostCss.width / 2 - asciiCss.left) * scaleX
  const cy = (hostCss.top + hostCss.height / 2 - asciiCss.top) * scaleY
  let sx = Math.min(Math.max(0, cx - sw / 2), Math.max(0, asciiW - sw))
  let sy = Math.min(Math.max(0, cy - sh / 2), Math.max(0, asciiH - sh))
  if (occupied && occupied.width >= 2 && occupied.height >= 2) {
    const ox = occupied.left
    const oy = occupied.top
    const ow = occupied.width
    const oh = occupied.height
    if (sw > ow) {
      sh *= ow / sw
      sw = ow
    }
    if (sh > oh) {
      sw *= oh / sh
      sh = oh
    }
    const padX = Math.min(ow / 2, Math.max(sw / 2, ow * 0.22))
    const padY = Math.min(oh / 2, Math.max(sh / 2, oh * 0.22))
    const ncx = Math.min(Math.max(cx, ox + padX), ox + ow - padX)
    const ncy = Math.min(Math.max(cy, oy + padY), oy + oh - padY)
    sx = Math.min(Math.max(ox, ncx - sw / 2), Math.max(ox, ox + ow - sw))
    sy = Math.min(Math.max(oy, ncy - sh / 2), Math.max(oy, oy + oh - sh))
  }
  return { sx, sy, sw, sh }
}

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

const LiquidGlass = lazy(() => import("liquid-glass-react"))

function glassShouldPause() {
  if (typeof document === "undefined") return true
  if (document.hidden) return true
  return isUiBlockingOverlayOpen(document)
}

function asciiReadyForGlass(): HTMLCanvasElement | null {
  if (typeof document === "undefined") return null
  const ascii = getAsciiCanvas(document)
  return isAsciiReadyForGlass(ascii) ? ascii : null
}

function unbindGlassAsciiWait() {
  glassAsciiWaitObserver?.disconnect()
  glassAsciiWaitObserver = null
  glassAsciiWaitBound = false
}

function unbindGlassResume() {
  if (glassResumeOnVis) {
    document.removeEventListener("visibilitychange", glassResumeOnVis)
    glassResumeOnVis = null
  }
  glassResumeObserver?.disconnect()
  glassResumeObserver = null
  glassResumeBound = false
}

function bindGlassAsciiWait() {
  if (glassAsciiWaitBound || typeof document === "undefined") return
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
  if (glassResumeBound || typeof document === "undefined") return
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
    pumpAscii = getAsciiCanvas(document)
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

type GlassSurfaceProps = {
  preset: GlassPreset
  mouseContainer: RefObject<HTMLDivElement | null>
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function GlassSurface({
  preset,
  mouseContainer,
  children,
  className,
  style,
}: GlassSurfaceProps) {
  const [useLiveGlass, setUseLiveGlass] = useState(false)
  const hostRef = useRef<HTMLDivElement | null>(null)
  const refractionRef = useRef<HTMLCanvasElement | null>(null)
  const cfg = PRESETS[preset]
  const stretch = STRETCH_PRESETS.has(preset)
  const frostPx = 4 + cfg.blurAmount * 32

  useEffect(() => {
    let cancelled = false
    const arm = () => {
      if (cancelled) return
      setUseLiveGlass(getCapabilities().liveGlass)
    }
    if (typeof requestIdleCallback === "function") {
      const id = requestIdleCallback(arm, { timeout: 2000 })
      return () => {
        cancelled = true
        cancelIdleCallback(id)
      }
    }
    const timer = window.setTimeout(arm, 2000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [preset])

  useEffect(() => {
    if (!useLiveGlass || stretch) return
    const container = mouseContainer.current
    const host = hostRef.current
    if (!container || !host) return
    const onMove = (event: MouseEvent) => {
      if (container.dataset.glassSettling === "1") return
      const rect = host.getBoundingClientRect()
      const dx = event.clientX - (rect.left + rect.width / 2)
      const dy = event.clientY - (rect.top + rect.height / 2)
      const edgeX = Math.max(0, Math.abs(dx) - rect.width / 2)
      const edgeY = Math.max(0, Math.abs(dy) - rect.height / 2)
      const edge = Math.hypot(edgeX, edgeY)
      const fade = edge > 1600 ? 0 : 1 - edge / 1600
      const x = dx * cfg.elasticity * 0.1 * fade
      const y = dy * cfg.elasticity * 0.1 * fade
      const dist = Math.hypot(dx, dy) || 1
      const stretchIntensity = Math.min(Math.hypot(dx, dy) / 300, 1) * cfg.elasticity * fade
      const scaleX = Math.max(
        0.8,
        1 +
          Math.abs(dx / dist) * stretchIntensity * 0.3 -
          Math.abs(dy / dist) * stretchIntensity * 0.15,
      )
      const scaleY = Math.max(
        0.8,
        1 +
          Math.abs(dy / dist) * stretchIntensity * 0.3 -
          Math.abs(dx / dist) * stretchIntensity * 0.15,
      )
      host.style.setProperty("--glass-ex", `${x.toFixed(2)}px`)
      host.style.setProperty("--glass-ey", `${y.toFixed(2)}px`)
      host.style.setProperty("--glass-sx", scaleX.toFixed(4))
      host.style.setProperty("--glass-sy", scaleY.toFixed(4))
      host.style.left = `${x.toFixed(2)}px`
      host.style.top = `${y.toFixed(2)}px`
    }
    container.addEventListener("pointermove", onMove)
    container.addEventListener("mousemove", onMove)
    return () => {
      container.removeEventListener("pointermove", onMove)
      container.removeEventListener("mousemove", onMove)
    }
  }, [useLiveGlass, stretch, mouseContainer, cfg.elasticity])

  useEffect(() => {
    const host = hostRef.current
    const dest = refractionRef.current
    if (!host || !dest) return
    let cancelled = false
    let boot = 0
    let tries = 0
    let lastGen = ""
    let lastPos = ""

    const bindFilter = () => {
      const filterEl = host.querySelector("filter")
      const rect = host.getBoundingClientRect()
      host.style.setProperty("--glass-frost", `${frostPx}px`)
      const svg = filterEl?.closest("svg")
      if (svg) {
        svg.style.overflow = "visible"
        svg.style.width = `${rect.width}px`
        svg.style.height = `${rect.height}px`
      }
      return Boolean(filterEl?.id)
    }

    const paint = () => {
      if (cancelled) return
      const ascii = pumpAscii
      const ar = pumpAsciiRect
      const ready = Boolean(ascii && ar && isAsciiReadyForGlass(ascii))
      if (!ready) {
        return
      }
      if (!ascii || !ar) return
      const hr = host.getBoundingClientRect()
      const w = Math.max(1, Math.round(hr.width))
      const h = Math.max(1, Math.round(hr.height))
      if (w < 1 || h < 1) return
      const gen = readGlassGen(ascii)
      const pos = `${Math.round(hr.left)},${Math.round(hr.top)}`
      if (gen === lastGen && dest.width === w && dest.height === h && pos === lastPos) {
        return
      }
      lastGen = gen
      lastPos = pos
      if (dest.width !== w) dest.width = w
      if (dest.height !== h) dest.height = h
      const ctx = dest.getContext("2d")
      if (!ctx) return
      const boxRaw = readGlassBox(ascii)
      const boxParts = boxRaw.split(",").map(Number)
      const occupied =
        boxParts.length === 4 &&
        boxParts.every((n) => Number.isFinite(n) && n >= 0) &&
        boxParts[2] >= 2 &&
        boxParts[3] >= 2
          ? { left: boxParts[0], top: boxParts[1], width: boxParts[2], height: boxParts[3] }
          : undefined
      const lens = behindRect(ascii.width, ascii.height, ar, hr, 1.25, occupied)
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(ascii, lens.sx, lens.sy, lens.sw, lens.sh, 0, 0, w, h)
    }

    const waitForFilter = () => {
      if (cancelled) return
      if (bindFilter() || tries++ > 90) return
      boot = requestAnimationFrame(waitForFilter)
    }

    glassJobs.add(paint)
    ensureGlassPump()
    let ro: ResizeObserver | undefined
    if (useLiveGlass) {
      boot = requestAnimationFrame(waitForFilter)
      ro = new ResizeObserver(() => {
        if (!cancelled) bindFilter()
      })
      ro.observe(host)
    } else {
      host.style.setProperty("--glass-frost", `${frostPx}px`)
    }
    return () => {
      cancelled = true
      cancelAnimationFrame(boot)
      glassJobs.delete(paint)
      stopGlassPumpIfIdle()
      ro?.disconnect()
    }
  }, [useLiveGlass, preset, frostPx])

  const familyClass = CARD_FAMILY.has(preset) ? "glass-fallback-card" : "glass-fallback-button"
  const shellClassName = ["glass-fallback", familyClass, className].filter(Boolean).join(" ")
  const shellStyle: CSSProperties = {
    padding: cfg.padding,
    borderRadius: cfg.borderRadius,
    ...style,
  }

  const fallback = (
    <div className={shellClassName} style={shellStyle}>
      {children}
    </div>
  )

  if (!useLiveGlass) {
    return (
      <div ref={hostRef} className={shellClassName} style={shellStyle}>
        <canvas ref={refractionRef} className="glass-refraction" aria-hidden />
        {children}
      </div>
    )
  }

  const pane = stretch ? <div className="min-w-0 w-full overflow-hidden">{children}</div> : children

  return (
    <div
      ref={hostRef}
      data-glass-host=""
      data-glass-preset={preset}
      className={["relative", className].filter(Boolean).join(" ")}
      style={{ borderRadius: cfg.borderRadius, ...style }}
    >
      <canvas ref={refractionRef} className="glass-refraction" aria-hidden />
      <Suspense fallback={fallback}>
        <LiquidGlass
          mode="standard"
          mouseContainer={mouseContainer}
          padding={cfg.padding}
          cornerRadius={cfg.cornerRadius}
          elasticity={cfg.elasticity}
          displacementScale={cfg.displacementScale}
          blurAmount={cfg.blurAmount}
          saturation={cfg.saturation}
          aberrationIntensity={cfg.aberrationIntensity}
          style={stretch ? { width: "100%", maxWidth: "100%" } : undefined}
        >
          {pane}
        </LiquidGlass>
      </Suspense>
    </div>
  )
}
