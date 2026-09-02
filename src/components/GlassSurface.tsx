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
import { getCapabilities } from "../lib/capabilities"
import { attachGlassRefraction } from "../lib/glass/refractionJob"

export { behindRect } from "../lib/glass/behindRect"

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

const LiquidGlass = lazy(() => import("liquid-glass-react"))

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
    return attachGlassRefraction(host, dest, frostPx, useLiveGlass)
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
