import { lazy, Suspense, useEffect, useRef, useState } from "react"
import { site } from "../config/site"
import { scheduleHeroMotionChrome } from "../lib/heroMotionSchedule"
import { HeroContactLayer, HeroHire } from "./hero/HeroHire"
import { HeroMarquee } from "./hero/HeroMarquee"
import { HeroMusic } from "./hero/HeroMusic"
import { HeroSocials, HeroTinity } from "./hero/HeroSocials"
import { HeroTagline } from "./hero/HeroTagline"

const HeroAsciiBackground = lazy(() => import("./HeroAsciiBackground"))

export default function Hero() {
  const heroRootRef = useRef<HTMLDivElement>(null)
  const asciiPaintRef = useRef<HTMLCanvasElement>(null)
  const [motionChrome, setMotionChrome] = useState(false)
  const [contactOpen, setContactOpen] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const activeRole = site.roles[roleIndex] ?? site.roles[0]

  useEffect(() => scheduleHeroMotionChrome(() => setMotionChrome(true)), [])

  return (
    <>
      <Suspense fallback={null}>
        <HeroAsciiBackground paintCanvasRef={asciiPaintRef} />
      </Suspense>
      <div
        ref={heroRootRef}
        className="relative z-10 flex h-dvh max-h-dvh flex-col gap-2 overflow-hidden hud:block hud:gap-0"
        data-hero-root
      >
        <canvas
          ref={asciiPaintRef}
          className="hero-ascii-display pointer-events-none absolute inset-0 z-[1] h-full w-full"
          aria-hidden
        />
        <div
          className="hero-scrim-top pointer-events-none absolute inset-x-0 top-0 z-[2]"
          aria-hidden
        />
        <div
          className="hero-scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 z-[2]"
          aria-hidden
        />
        <div
          className="hero-scrim-social pointer-events-none absolute inset-y-0 inset-x-0 z-[2]"
          aria-hidden
        />
        <HeroMarquee motionChrome={motionChrome} />
        <div className="relative z-10 mt-auto flex min-h-0 flex-1 flex-col gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] hud:contents short:mt-auto short:flex-none short:flex-row short:flex-nowrap short:items-end short:gap-2">
          <HeroMusic />
          <div
            className="relative z-[1] min-h-0 flex-1 pointer-events-none hud:hidden short:hidden"
            aria-hidden
          />
          <HeroSocials />
          <HeroTinity />
          <div className="relative z-10 flex flex-col gap-3 hud:absolute hud:inset-x-0 hud:bottom-0 hud:flex-row hud:items-end hud:justify-between hud:px-16 hud:pb-12 hud:gap-0 short:min-w-0 short:flex-1 short:gap-1">
            <HeroHire
              motionChrome={motionChrome}
              contactOpen={contactOpen}
              onOpenContact={() => setContactOpen(true)}
              onRoleIndexChange={setRoleIndex}
            />
            <HeroTagline />
          </div>
        </div>
        <div className="absolute w-0 h-0 overflow-hidden">
          <div id="yt-player" />
        </div>
        <HeroContactLayer
          open={contactOpen}
          onClose={() => setContactOpen(false)}
          contextRole={activeRole}
        />
      </div>
    </>
  )
}
