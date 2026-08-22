import { useEffect, useRef, useState } from "react"
import { site } from "../config/site"
import { canUseWebGL, prefersReducedMotion } from "../lib/webgl"

type Phase = "boot" | "ascii" | "photo"

export default function HeroAsciiBackground() {
  const hostRef = useRef<HTMLDivElement>(null)
  const [phase, setPhase] = useState<Phase>("boot")

  useEffect(() => {
    if (!canUseWebGL() || prefersReducedMotion()) {
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

    void import("../lib/heroAsciiRuntime").then(({ mountHeroAscii }) => {
      if (cancelled || !host.isConnected) return
      const dispose = mountHeroAscii(host, {
        samplerWebm: site.asciiSamplerWebm,
        samplerMp4: site.asciiSamplerMp4,
        fallbackWebm: site.videoSrcWebm,
        fallbackMp4: site.videoSrcMp4,
      })
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
  }, [phase])

  if (phase === "photo") {
    return (
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden>
        <img src={site.portraitSrc} alt="" className="h-full w-full object-cover" />
      </div>
    )
  }

  return <div ref={hostRef} className="hero-ascii-host" aria-hidden />
}
