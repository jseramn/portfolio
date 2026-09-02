import { useEffect, useRef, useState, type RefObject } from "react"
import { site } from "../config/site"
import { signalHeroBootReady } from "../lib/bootLoader"
import { getCapabilities } from "../lib/capabilities"
import { ASCII_FALLBACK_SRC } from "../lib/heroAsciiFallback"
import { scheduleAsciiStart, type AsciiStartHost } from "../lib/heroAsciiBudget"

type Phase = "boot" | "ascii" | "static"

type HeroAsciiBackgroundProps = {
  paintCanvasRef?: RefObject<HTMLCanvasElement | null>
}

export default function HeroAsciiBackground({ paintCanvasRef }: HeroAsciiBackgroundProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>("boot")

  useEffect(() => {
    const { webgl, reducedMotion } = getCapabilities()
    if (!webgl || reducedMotion) {
      setPhase("static")
      return
    }
    return scheduleAsciiStart(() => setPhase("ascii"), window as AsciiStartHost)
  }, [])

  useEffect(() => {
    if (phase !== "ascii") return
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let unmount: (() => void) | undefined

    void import("../lib/hero/ascii/mount").then(async ({ mountHeroAscii }) => {
      if (cancelled || !host.isConnected) return
      const dispose = await mountHeroAscii(
        host,
        {
          samplerWebm: site.asciiSamplerWebm,
          samplerMp4: site.asciiSamplerMp4,
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

  useEffect(() => {
    if (phase === "static") signalHeroBootReady()
  }, [phase])

  if (phase === "static") {
    return (
      <div
        data-hero-boot-fallback
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black"
        aria-hidden
      >
        <img
          src={ASCII_FALLBACK_SRC}
          alt=""
          className="hero-ascii-display h-full w-full object-cover object-center"
          decoding="async"
        />
      </div>
    )
  }

  return <div ref={hostRef} className="hero-ascii-host" aria-hidden />
}
