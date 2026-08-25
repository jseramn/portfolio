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
import { shouldUseLiquidGlass } from "../lib/shouldUseLiquidGlass"
import { prefersReducedMotion } from "../lib/webgl"

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

type PortraitBox = { x: number; y: number; w: number; h: number }

function readPortraitBox(ascii: HTMLCanvasElement): PortraitBox {
  const raw = ascii.dataset.glassBox
  if (raw) {
    const [x, y, w, h] = raw.split(",").map(Number)
    if (w > 1 && h > 1) return { x, y, w, h }
  }
  return { x: 0, y: 0, w: ascii.width, h: ascii.height }
}

function lensRect(box: PortraitBox, destW: number, destH: number) {
  const aspect = destW / Math.max(destH, 1)
  let srcH = box.h
  let srcW = srcH * aspect
  if (srcW > box.w) {
    srcW = box.w
    srcH = srcW / aspect
  }
  const sx = box.x + (box.w - srcW) / 2
  const maxSy = Math.max(0, box.h - srcH)
  const sy = box.y + Math.min(maxSy, Math.max(0, box.h * 0.32 - srcH / 2))
  return { sx, sy, sw: srcW, sh: srcH }
}

const GLASS_MS = 1000 / 12
const glassJobs = new Set<() => void>()
let glassPump = 0
let glassPumpAt = 0
let glassPaintN = 0
let glassSkipN = 0
let glassTickN = 0
let glassPaintMs = 0
let glassLogAt = 0

const LiquidGlass = lazy(() => import("liquid-glass-react"))

// #region agent log
function dbg(
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>,
) {
  fetch("http://127.0.0.1:7586/ingest/00af1405-f462-421b-a094-07596f9f5fa4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "2d62cf",
    },
    body: JSON.stringify({
      sessionId: "2d62cf",
      runId: "post-fix",
      hypothesisId,
      location,
      message,
      data,
      timestamp: Date.now(),
    }),
  }).catch(() => {})
}
// #endregion

function reportGlassPump(now: number) {
  glassTickN++
  if (now - glassLogAt < 1000) return
  const payload = {
    jobs: glassJobs.size,
    ticks: glassTickN,
    paints: glassPaintN,
    skips: glassSkipN,
    avgTickMs: Number((glassPaintMs / Math.max(glassTickN, 1)).toFixed(3)),
    hz: 12,
    dpr: 1,
  }
  // #region agent log
  dbg("Q", "GlassSurface.tsx:pump", "shared glass pump 1s", payload)
  document.documentElement.setAttribute("data-glass-perf", JSON.stringify(payload))
  // #endregion
  glassTickN = 0
  glassPaintN = 0
  glassSkipN = 0
  glassPaintMs = 0
  glassLogAt = now
}

function ensureGlassPump() {
  if (glassPump) return
  const step = (now: number) => {
    glassPump = requestAnimationFrame(step)
    if (now - glassPumpAt < GLASS_MS) return
    glassPumpAt = now
    const t0 = performance.now()
    for (const job of glassJobs) job()
    glassPaintMs += performance.now() - t0
    reportGlassPump(now)
  }
  glassPump = requestAnimationFrame(step)
}

function stopGlassPumpIfIdle() {
  if (glassJobs.size > 0) return
  cancelAnimationFrame(glassPump)
  glassPump = 0
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
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent
    const reducedMotion = typeof window === "undefined" ? false : prefersReducedMotion()
    const live = shouldUseLiquidGlass(userAgent, reducedMotion)
    // #region agent log
    dbg("A", "GlassSurface.tsx:gate", "liquid-glass gate", {
      preset,
      live,
      reducedMotion,
      ua: userAgent.slice(0, 120),
      href: typeof location === "undefined" ? "" : location.href,
    })
    // #endregion
    setUseLiveGlass(live)
  }, [preset])

  useEffect(() => {
    if (!useLiveGlass) return
    let cancelled = false
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return
        const host = hostRef.current
        const warp = host?.querySelector(".glass__warp") as HTMLElement | null
        const glass = host?.querySelector(".glass") as HTMLElement | null
        const rel = host?.querySelector(":scope > .relative") as HTMLElement | null
        const svgFilter = host?.querySelector("filter")
        const warpCs = warp ? getComputedStyle(warp) : null
        const overlays = host
          ? [...host.querySelectorAll(":scope > .bg-black")].map((el) => {
              const cs = getComputedStyle(el)
              return {
                opacity: cs.opacity,
                bg: cs.backgroundColor,
                pe: cs.pointerEvents,
              }
            })
          : []
        // #region agent log
        dbg("B", "GlassSurface.tsx:host-lock", "host transform lock", {
          preset,
          hostTransform: host ? getComputedStyle(host).transform : "no-host",
          relTransform: rel ? getComputedStyle(rel).transform : "no-rel",
          mouseContainer: Boolean(mouseContainer.current),
        })
        dbg("C", "GlassSurface.tsx:warp", "glass warp computed", {
          preset,
          hasWarp: Boolean(warp),
          warpFilter: warpCs?.filter ?? "none",
          warpBackdrop: warpCs?.webkitBackdropFilter || warpCs?.backdropFilter || "none",
          warpW: warp ? Math.round(warp.getBoundingClientRect().width) : 0,
          warpH: warp ? Math.round(warp.getBoundingClientRect().height) : 0,
          glassOverflow: glass ? getComputedStyle(glass).overflow : "no-glass",
          filterId: svgFilter?.id ?? "",
          asciiTag: document.querySelector(".hero-ascii-display")?.tagName ?? "missing",
          asciiInHeroRoot: Boolean(
            document.querySelector("[data-hero-root] > .hero-ascii-display"),
          ),
          canvasZ: (() => {
            const el = document.querySelector("[data-hero-root] > .hero-ascii-display")
            return el ? getComputedStyle(el).zIndex : "missing"
          })(),
          scrimZ: [...document.querySelectorAll("[class*='hero-scrim']")].map(
            (el) => getComputedStyle(el).zIndex,
          ),
          glassBg: glass ? getComputedStyle(glass).backgroundColor : "no-glass",
          spanMix: host
            ? [...host.querySelectorAll(":scope > span")].map(
                (el) => getComputedStyle(el).mixBlendMode,
              )
            : [],
          heroBg: (() => {
            const root = document.querySelector("[data-hero-root]")
            return root instanceof HTMLElement
              ? root.style.backgroundImage.slice(0, 32) || "none"
              : "no-root"
          })(),
        })
        dbg("D", "GlassSurface.tsx:overlays", "bg-black overlay paint", {
          preset,
          overlayCount: overlays.length,
          overlays,
        })
        dbg("E", "GlassSurface.tsx:mouse", "mouse container for elasticity", {
          preset,
          mouseContainer: Boolean(mouseContainer.current),
          elasticity: cfg.elasticity,
          displacementScale: cfg.displacementScale,
        })
        // #endregion
      })
    })
    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [useLiveGlass, preset, mouseContainer, cfg.elasticity, cfg.displacementScale])

  useEffect(() => {
    if (!useLiveGlass || stretch) return
    const container = mouseContainer.current
    const host = hostRef.current
    if (!container || !host) return
    let loggedMove = false
    const onMove = (event: MouseEvent) => {
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
        1 + Math.abs(dx / dist) * stretchIntensity * 0.3 - Math.abs(dy / dist) * stretchIntensity * 0.15,
      )
      const scaleY = Math.max(
        0.8,
        1 + Math.abs(dy / dist) * stretchIntensity * 0.3 - Math.abs(dx / dist) * stretchIntensity * 0.15,
      )
      host.style.setProperty("--glass-ex", `${x.toFixed(2)}px`)
      host.style.setProperty("--glass-ey", `${y.toFixed(2)}px`)
      host.style.setProperty("--glass-sx", scaleX.toFixed(4))
      host.style.setProperty("--glass-sy", scaleY.toFixed(4))
      if (!loggedMove) {
        loggedMove = true
        // #region agent log
        dbg("K", "GlassSurface.tsx:elasticity", "first mouse elasticity", {
          preset,
          ex: x,
          ey: y,
          scaleX,
          scaleY,
          fade,
        })
        // #endregion
      }
    }
    container.addEventListener("mousemove", onMove)
    return () => container.removeEventListener("mousemove", onMove)
  }, [useLiveGlass, stretch, mouseContainer, cfg.elasticity])

  useEffect(() => {
    if (!useLiveGlass) return
    const host = hostRef.current
    const dest = refractionRef.current
    if (!host || !dest) return
    let cancelled = false
    let boot = 0
    let tries = 0
    let loggedBind = false
    let loggedPaint = false
    let lastGen = ""
    let hostW = 0
    let hostH = 0

    const bindFilter = () => {
      const svg = host.querySelector("svg")
      const filterEl = host.querySelector("filter")
      const warp = host.querySelector(".glass__warp") as HTMLElement | null
      const rect = host.getBoundingClientRect()
      hostW = Math.max(0, Math.round(rect.width))
      hostH = Math.max(0, Math.round(rect.height))
      host.style.setProperty("--glass-frost", `${frostPx}px`)
      if (svg) {
        svg.style.overflow = "visible"
        svg.style.width = `${rect.width}px`
        svg.style.height = `${rect.height}px`
      }
      if (filterEl?.id && !loggedBind) {
        loggedBind = true
        // #region agent log
        dbg("I", "GlassSurface.tsx:refraction", "ascii clone filter bind", {
          preset,
          filterId: filterEl.id,
          cloneFilter: getComputedStyle(dest).filter,
          svgW: svg ? Math.round(svg.getBoundingClientRect().width) : 0,
          hostW: Math.round(rect.width),
          hostH: Math.round(rect.height),
          warpBF: warp ? getComputedStyle(warp).backdropFilter : "no-warp",
        })
        dbg("J", "GlassSurface.tsx:svg-size", "svg vs host after bind", {
          preset,
          svgStyleW: svg instanceof SVGElement ? svg.style.width : "",
          svgOverflow: svg ? getComputedStyle(svg).overflow : "no-svg",
        })
        // #endregion
      }
      return Boolean(filterEl?.id)
    }

    const paint = () => {
      if (cancelled) return
      const ascii = document.querySelector(
        "[data-hero-root] > .hero-ascii-display",
      ) as HTMLCanvasElement | null
      if (!ascii || ascii.width < 800) return
      const gen = ascii.dataset.glassGen ?? ""
      const w = hostW
      const h = hostH
      if (w < 1 || h < 1) return
      if (gen === lastGen && dest.width === w && dest.height === h) {
        glassSkipN++
        return
      }
      lastGen = gen
      glassPaintN++
      if (dest.width !== w) dest.width = w
      if (dest.height !== h) dest.height = h
      const ctx = dest.getContext("2d")
      if (!ctx) return
      const box = readPortraitBox(ascii)
      const lens = lensRect(box, w, h)
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, w, h)
      ctx.drawImage(ascii, lens.sx, lens.sy, lens.sw, lens.sh, 0, 0, w, h)
      if (!loggedPaint && dest.width > 0) {
        loggedPaint = true
        // #region agent log
        dbg("P", "GlassSurface.tsx:refraction-paint", "shared 12fps css frost", {
          preset,
          destW: dest.width,
          destH: dest.height,
          asciiW: ascii.width,
          asciiH: ascii.height,
          box,
          lens,
          frostPx,
          hz: 12,
        })
        host.setAttribute(
          "data-glass-debug",
          JSON.stringify({
            preset,
            destW: dest.width,
            destH: dest.height,
            box,
            lens,
            hz: 12,
          }),
        )
        // #endregion
      }
    }

    const waitForFilter = () => {
      if (cancelled) return
      if (bindFilter() || tries++ > 90) {
        glassJobs.add(paint)
        ensureGlassPump()
        return
      }
      boot = requestAnimationFrame(waitForFilter)
    }

    boot = requestAnimationFrame(waitForFilter)
    const ro = new ResizeObserver(() => {
      if (!cancelled) bindFilter()
    })
    ro.observe(host)
    return () => {
      cancelled = true
      cancelAnimationFrame(boot)
      glassJobs.delete(paint)
      stopGlassPumpIfIdle()
      ro.disconnect()
    }
  }, [useLiveGlass, preset, frostPx])

  const familyClass = CARD_FAMILY.has(preset)
    ? "glass-fallback-card"
    : "glass-fallback-button"
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

  if (!useLiveGlass) return fallback

  const pane = stretch ? (
    <div className="min-w-0 w-full overflow-hidden">{children}</div>
  ) : (
    children
  )

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
