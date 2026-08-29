import { useEffect, useRef, useState, type RefObject } from "react"
import { site } from "../config/site"
import { canUseWebGL, prefersReducedMotion } from "../lib/webgl"

type Phase = "boot" | "ascii" | "photo"

type HeroAsciiBackgroundProps = {
  paintCanvasRef?: RefObject<HTMLCanvasElement | null>
}

export default function HeroAsciiBackground({
  paintCanvasRef,
}: HeroAsciiBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>("boot")

  useEffect(() => {
    const webgl = canUseWebGL()
    const reduced = prefersReducedMotion()
    if (!webgl || reduced) {
      setPhase("photo")
      return
    }
    setPhase("ascii")
  }, [])

  useEffect(() => {
    if (phase !== "ascii") return
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let unmount: (() => void) | undefined

    void import("../lib/heroAsciiRuntime").then(async ({ mountHeroAscii }) => {
      if (cancelled || !host.isConnected) return
      const dispose = await mountHeroAscii(
        host,
        {
          samplerWebm: site.asciiSamplerWebm,
          samplerMp4: site.asciiSamplerMp4,
          fallbackWebm: site.videoSrcWebm,
          fallbackMp4: site.videoSrcMp4,
        },
        paintCanvasRef?.current,
      )
      if (cancelled) {
        dispose()
        return
      }
      unmount = dispose
    })

    return () => {
      cancelled = true
      unmount?.()
    }
  }, [phase, paintCanvasRef])

  if (phase === "photo") {
    return <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden />
  }

  return <div ref={hostRef} className="hero-ascii-host" aria-hidden />
}
