import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react"
import {
  Github,
  Linkedin,
  Twitter,
  Mail,
  Instagram,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Shuffle,
  type LucideIcon,
} from "lucide-react"
import { TextLoop } from "./TextLoop"
import { InfiniteSlider } from "./InfiniteSlider"
import { GlassSurface } from "./GlassSurface"
import { site } from "../config/site"
import {
  onHireCtaClicked,
  onOutboundOrg,
  onOutboundSocial,
} from "../lib/analytics/productCapture"
import type { GitHubStats } from "../lib/githubStats"

const HeroAsciiBackground = lazy(() => import("./HeroAsciiBackground"))
const ContactModal = lazy(() =>
  import("./ContactModal").then((mod) => ({ default: mod.ContactModal })),
)

const YT_TRACKS = site.tracks
const PROFESSIONS = site.roles
const DESC = site.tagline.en
const CHARS = "!@#$%^&*()_+-=[]{}|;:,./<>?`~abcdefghijklmnopqrstuvwxyz0123456789"
const GLOW =
  "transition-all duration-300 hover:drop-shadow-[0_0_14px_rgba(0,0,0,0.75)] hover:text-[var(--hero-ink-hover)]"

const SOCIAL_ICONS: Record<string, LucideIcon> = {
  Github,
  Twitter,
  Linkedin,
  Instagram,
  Mail,
}

function useScramble(text: string, { autoStart = false }: { autoStart?: boolean } = {}) {
  const [display, setDisplay] = useState(autoStart ? ".".repeat(text.length) : text)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    let iteration = 0
    intervalRef.current = setInterval(() => {
      const keepCount = Math.floor(iteration / 2)
      let newText = ""
      for (let i = 0; i < text.length; i++) {
        if (text[i] === " " || text[i] === "·" || text[i] === "." || text[i] === "&" || text[i] === "'" || text[i] === "\n") {
          newText += text[i]
        } else if (i < keepCount) {
          newText += text[i]
        } else {
          newText += CHARS[Math.floor(Math.random() * CHARS.length)]
        }
      }
      setDisplay(newText)
      iteration++
      if (iteration >= text.length * 2) {
        if (intervalRef.current) clearInterval(intervalRef.current)
        intervalRef.current = null
        setDisplay(text)
      }
    }, 30)
  }, [text])

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setDisplay(text)
  }, [text])

  useEffect(() => {
    if (autoStart) start()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [])

  return { display, start, stop }
}

function useGitHubStats() {
  const [stats, setStats] = useState<GitHubStats | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch("/api/github-stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: GitHubStats | null) => {
        if (!cancelled && data) setStats(data)
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [])

  return stats
}

export default function Hero() {
  const desc = useScramble(DESC)
  const ghStats = useGitHubStats()
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const [contactOpen, setContactOpen] = useState(false)
  const [asciiReady, setAsciiReady] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const activeRole = PROFESSIONS[roleIndex] ?? PROFESSIONS[0]
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const heroRootRef = useRef<HTMLDivElement>(null)
  const asciiPaintRef = useRef<HTMLCanvasElement>(null)
  const trackIndexRef = useRef(trackIndex)
  trackIndexRef.current = trackIndex

  useEffect(() => {
    let cancelled = false
    let idleId = 0
    let timer = 0
    const arm = () => {
      if (!cancelled) setAsciiReady(true)
    }
    const idleArm = () => {
      if (cancelled) return
      if (typeof requestIdleCallback === "function") {
        idleId = requestIdleCallback(arm, { timeout: 0 })
        return
      }
      timer = window.setTimeout(arm, 0)
    }
    const afterFirstPaint = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(idleArm)
      })
    }
    const fonts = document.fonts?.ready
    if (fonts) {
      void fonts.then(afterFirstPaint)
    } else {
      afterFirstPaint()
    }
    return () => {
      cancelled = true
      if (idleId) cancelIdleCallback(idleId)
      if (timer) window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [])

  const ensureYtPlayer = useCallback((index: number) => {
    const startPlayer = () => {
      if (playerRef.current) return
      const YT = (window as Window & { YT?: { Player: new (id: string, opts: unknown) => any } }).YT
      if (!YT?.Player) return
      const track = YT_TRACKS[index]
      playerRef.current = new YT.Player("yt-player", {
        videoId: track.id,
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          start: track.start,
          loop: 1,
          playlist: track.id,
        },
        events: {
          onReady: (e: { target: { unMute: () => void; setVolume: (n: number) => void; playVideo: () => void } }) => {
            e.target.unMute()
            e.target.setVolume(100)
            e.target.playVideo()
            setMusicPlaying(true)
          },
        },
      })
    }

    if ((window as Window & { YT?: { Player?: unknown } }).YT?.Player) {
      startPlayer()
      return
    }
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      document.head.appendChild(tag)
    }
    const previous = (window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady
    ;(window as Window & { onYouTubeIframeAPIReady?: () => void }).onYouTubeIframeAPIReady = () => {
      previous?.()
      startPlayer()
    }
  }, [])

  const loadTrack = useCallback((index: number) => {
    setTrackIndex(index)
    trackIndexRef.current = index
    if (!playerRef.current?.loadVideoById) {
      ensureYtPlayer(index)
      return
    }
    const track = YT_TRACKS[index]
    playerRef.current.loadVideoById({ videoId: track.id, startSeconds: track.start })
    playerRef.current.unMute()
    playerRef.current.setVolume(100)
    setMusicPlaying(true)
  }, [ensureYtPlayer])

  const nextTrack = useCallback(() => {
    loadTrack((trackIndex + 1) % YT_TRACKS.length)
  }, [trackIndex, loadTrack])

  const prevTrack = useCallback(() => {
    loadTrack((trackIndex - 1 + YT_TRACKS.length) % YT_TRACKS.length)
  }, [trackIndex, loadTrack])

  const randomTrack = useCallback(() => {
    let next: number
    do { next = Math.floor(Math.random() * YT_TRACKS.length) } while (next === trackIndex && YT_TRACKS.length > 1)
    loadTrack(next)
  }, [trackIndex, loadTrack])

  const toggleMusic = useCallback(() => {
    if (!playerRef.current) {
      ensureYtPlayer(trackIndexRef.current)
      return
    }
    if (musicPlaying) {
      playerRef.current.mute()
      setMusicPlaying(false)
    } else {
      playerRef.current.unMute()
      setMusicPlaying(true)
    }
  }, [ensureYtPlayer, musicPlaying])

  useEffect(() => {
    const root = heroRootRef.current
    if (!root) return
    let smoothRaf = 0
    let settleRaf = 0
    let pressed = false
    let curX = 0
    let curY = 0
    let tgtX = 0
    let tgtY = 0
    let seeded = false
    const emit = (x: number, y: number) => {
      root.dispatchEvent(
        new MouseEvent("mousemove", {
          clientX: x,
          clientY: y,
          bubbles: true,
        }),
      )
    }
    const hosts = () =>
      [...root.querySelectorAll("[data-glass-host]")] as HTMLElement[]
    const stopSettle = () => {
      if (settleRaf) {
        cancelAnimationFrame(settleRaf)
        settleRaf = 0
      }
      delete root.dataset.glassSettling
      for (const host of hosts()) host.classList.remove("is-settling")
    }
    const tick = () => {
      smoothRaf = 0
      curX += (tgtX - curX) * 0.15
      curY += (tgtY - curY) * 0.15
      emit(curX, curY)
      if (Math.hypot(tgtX - curX, tgtY - curY) > 0.5) {
        smoothRaf = requestAnimationFrame(tick)
        return
      }
      curX = tgtX
      curY = tgtY
      emit(curX, curY)
    }
    const aim = (x: number, y: number) => {
      tgtX = x
      tgtY = y
      if (!seeded) {
        curX = x
        curY = y
        seeded = true
      }
      if (!smoothRaf) smoothRaf = requestAnimationFrame(tick)
    }
    const rest = () => {
      if (smoothRaf) {
        cancelAnimationFrame(smoothRaf)
        smoothRaf = 0
      }
      stopSettle()
      const origins = hosts().map((el) => {
        const cs = getComputedStyle(el)
        return {
          el,
          x: Number.parseFloat(cs.left) || 0,
          y: Number.parseFloat(cs.top) || 0,
          sx: Number.parseFloat(cs.getPropertyValue("--glass-sx")) || 1,
          sy: Number.parseFloat(cs.getPropertyValue("--glass-sy")) || 1,
        }
      })
      if (origins.every((o) => Math.abs(o.x) < 0.5 && Math.abs(o.y) < 0.5)) {
        const box = root.getBoundingClientRect()
        tgtX = box.left + box.width / 2
        tgtY = box.top - 2000
        curX = tgtX
        curY = tgtY
        seeded = false
        emit(tgtX, tgtY)
        return
      }
      root.dataset.glassSettling = "1"
      for (const host of hosts()) host.classList.add("is-settling")
      const started = performance.now()
      const tickSettle = (now: number) => {
        const t = Math.min(1, (now - started) / 220)
        const ease = 1 - (1 - t) ** 3
        for (const origin of origins) {
          const x = origin.x * (1 - ease)
          const y = origin.y * (1 - ease)
          const sx = 1 + (origin.sx - 1) * (1 - ease)
          const sy = 1 + (origin.sy - 1) * (1 - ease)
          origin.el.style.left = `${x.toFixed(2)}px`
          origin.el.style.top = `${y.toFixed(2)}px`
          origin.el.style.setProperty("--glass-ex", `${x.toFixed(2)}px`)
          origin.el.style.setProperty("--glass-ey", `${y.toFixed(2)}px`)
          origin.el.style.setProperty("--glass-sx", sx.toFixed(4))
          origin.el.style.setProperty("--glass-sy", sy.toFixed(4))
        }
        if (t < 1) {
          settleRaf = requestAnimationFrame(tickSettle)
          return
        }
        settleRaf = 0
        stopSettle()
        const box = root.getBoundingClientRect()
        tgtX = box.left + box.width / 2
        tgtY = box.top - 2000
        curX = tgtX
        curY = tgtY
        seeded = false
        emit(tgtX, tgtY)
      }
      settleRaf = requestAnimationFrame(tickSettle)
    }
    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      pressed = true
      stopSettle()
      const onControl =
        event.target instanceof Element &&
        Boolean(event.target.closest("a,button,input,textarea,label,[role='dialog']"))
      if (!onControl) {
        try {
          root.setPointerCapture(event.pointerId)
        } catch {
          /* Safari may reject capture on a non-element target */
        }
      }
      seeded = true
      curX = tgtX = event.clientX
      curY = tgtY = event.clientY
      emit(curX, curY)
    }
    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      if (!pressed) return
      aim(event.clientX, event.clientY)
    }
    const onPointerUp = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return
      if (!pressed) return
      pressed = false
      try {
        root.releasePointerCapture(event.pointerId)
      } catch {
        /* capture may already be released */
      }
      rest()
    }
    root.addEventListener("pointerdown", onPointerDown, { passive: true })
    root.addEventListener("pointermove", onPointerMove, { passive: true })
    root.addEventListener("pointerup", onPointerUp, { passive: true })
    root.addEventListener("pointercancel", onPointerUp, { passive: true })
    return () => {
      cancelAnimationFrame(smoothRaf)
      cancelAnimationFrame(settleRaf)
      delete root.dataset.glassSettling
      root.removeEventListener("pointerdown", onPointerDown)
      root.removeEventListener("pointermove", onPointerMove)
      root.removeEventListener("pointerup", onPointerUp)
      root.removeEventListener("pointercancel", onPointerUp)
    }
  }, [])

  return (
    <>
      {asciiReady ? (
        <Suspense fallback={null}>
          <HeroAsciiBackground paintCanvasRef={asciiPaintRef} />
        </Suspense>
      ) : null}
      <div
        ref={heroRootRef}
        className="relative z-10 flex h-dvh max-h-dvh flex-col overflow-hidden md:block"
        data-hero-root
      >
      <canvas
        ref={asciiPaintRef}
        className="hero-ascii-display pointer-events-none absolute inset-0 z-[1] h-full w-full"
        aria-hidden
      />
      <div
        className="hero-scrim-top pointer-events-none absolute inset-x-0 top-0 z-0"
        aria-hidden
      />
      <div
        className="hero-scrim-bottom pointer-events-none absolute inset-x-0 bottom-0 z-0"
        aria-hidden
      />
      <div
        className="hero-scrim-social pointer-events-none absolute inset-y-0 inset-x-0 z-0"
        aria-hidden
      />
      <div className="relative z-10 flex flex-col gap-2 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] md:absolute md:inset-x-0 md:top-0 md:block md:px-0 md:pt-8">
        <GlassSurface preset="bar" mouseContainer={heroRootRef} className="w-full">
        <InfiniteSlider gap={32} speed={50} speedOnHover={20}>
          <span className="hero-on-video font-mono text-xs md:text-base whitespace-nowrap">
            Hi, I am {site.name} — {site.locationLine}
          </span>
          <span className="hero-ink-muted font-mono">·</span>
          {site.marqueeOrgs.flatMap((org) => [
            "href" in org && org.href ? (
              <a
                key={org.label}
                href={org.href}
                target={org.href.startsWith("http") ? "_blank" : undefined}
                rel={org.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`hero-on-video font-mono text-xs md:text-base ${GLOW} whitespace-nowrap`}
                onClick={() => onOutboundOrg(org.label)}
              >
                {org.label}
              </a>
            ) : (
              <span
                key={org.label}
                className="hero-on-video font-mono text-xs md:text-base whitespace-nowrap"
              >
                {org.label}
              </span>
            ),
            <span key={`${org.label}-sep`} className="hero-ink-muted font-mono">·</span>,
          ])}
          {ghStats && (
            <span className="hero-on-video font-mono text-xs md:text-base whitespace-nowrap">
              {ghStats.today} contributions today · {ghStats.month} this month · {ghStats.year} this year · {ghStats.total} all-time
            </span>
          )}
          {ghStats && <span className="hero-ink-muted font-mono">·</span>}
          {ghStats?.lastCommit && (
            <a
              href={ghStats.lastCommit.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`hero-on-video font-mono text-xs md:text-base whitespace-nowrap ${GLOW}`}
            >
              last commit: {ghStats.lastCommit.message} ({ghStats.lastCommit.repo})
            </a>
          )}
          {ghStats?.lastCommit && <span className="hero-ink-muted font-mono">·</span>}
        </InfiniteSlider>
        </GlassSurface>
      <div className="md:absolute md:inset-x-auto md:right-8 md:top-24">
        <GlassSurface preset="pill" mouseContainer={heroRootRef} className="w-full md:w-fit md:ml-auto">
        <div className="font-mono text-xs md:text-sm flex items-center justify-center md:justify-end gap-3 px-4 md:px-0">
        {musicPlaying ? (
          <a
            href={`https://www.youtube.com/watch?v=${YT_TRACKS[trackIndex].id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hero-on-video whitespace-nowrap transition-all duration-300 max-w-[60vw] md:max-w-none overflow-hidden text-ellipsis"
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            <span className="sound-bars"><span /><span /><span /><span /></span>
            now playing: {YT_TRACKS[trackIndex].title}
          </a>
        ) : (
          <button
            onClick={toggleMusic}
            className={`hero-on-video whitespace-nowrap cursor-pointer ${GLOW}`}
            style={{ animation: "glow-pulse 2s ease-in-out infinite" }}
          >
            click to listen <span className="sound-bars"><span /><span /><span /><span /></span>
          </button>
        )}
        <div className="flex items-center gap-2 md:gap-3">
          <button onClick={prevTrack} className={`hero-ink ${GLOW} hover:scale-125`} aria-label="Previous track">
            <SkipBack size={16} className="md:w-5 md:h-5" />
          </button>
          <button onClick={toggleMusic} className={`hero-ink ${GLOW} hover:scale-125`} aria-label={musicPlaying ? "Mute music" : "Play music"}>
            {musicPlaying ? <Volume2 size={18} className="md:w-[22px] md:h-[22px]" /> : <VolumeX size={18} className="md:w-[22px] md:h-[22px]" />}
          </button>
          <button onClick={nextTrack} className={`hero-ink ${GLOW} hover:scale-125`} aria-label="Next track">
            <SkipForward size={16} className="md:w-5 md:h-5" />
          </button>
          <button onClick={randomTrack} className={`hero-ink ${GLOW} hover:scale-125`} aria-label="Random track">
            <Shuffle size={16} className="md:w-5 md:h-5" />
          </button>
        </div>
        </div>
        </GlassSurface>
      </div>
      </div>
      <div className="relative z-[1] min-h-0 flex-1 pointer-events-none md:hidden" aria-hidden />
      <div className="relative z-10 mt-auto flex flex-col gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:contents">
      <div className="flex justify-center z-10 md:absolute md:left-8 md:top-24 md:bottom-auto md:right-auto md:translate-x-0 md:justify-start">
        <GlassSurface preset="dock" mouseContainer={heroRootRef}>
        <div className="flex flex-row items-center gap-4 md:gap-5">
        {site.socials.map((social) => {
          const Icon = SOCIAL_ICONS[social.icon]
          if (!Icon) return null
          const external = social.href.startsWith("http")
          return (
            <a
              key={social.id}
              href={social.href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              className={`hero-ink drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${GLOW} hover:scale-125`}
              aria-label={social.id}
              onClick={() => onOutboundSocial(social.id)}
            >
              <Icon size={24} className="md:w-[26px] md:h-[26px]" />
            </a>
          )
        })}
        </div>
        </GlassSurface>
      </div>
      <div className="flex flex-col gap-3 md:absolute md:inset-x-0 md:bottom-0 md:flex-row md:items-end md:justify-between md:px-16 md:pb-12 md:gap-0">
        <GlassSurface preset="button" mouseContainer={heroRootRef} className="self-start">
        <button
          type="button"
          onClick={() => {
            onHireCtaClicked()
            setContactOpen(true)
          }}
          className={`hero-on-video group font-sans text-2xl md:text-3xl font-semibold tracking-tight text-left cursor-pointer md:w-[30%] ${GLOW} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-ink)]`}
          aria-label={`Open contact form — current role: ${activeRole}`}
        >
          <span aria-hidden="true">
          <TextLoop
            interval={2.5}
            transition={{ duration: 0.4 }}
            onIndexChange={setRoleIndex}
            paused={contactOpen}
          >
            {PROFESSIONS.map((p) => (
              <span key={p} className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] group-hover:decoration-[var(--hero-ink)]/50">
                {p}
              </span>
            ))}
          </TextLoop>
          </span>
        </button>
        </GlassSurface>
        <GlassSurface preset="card" mouseContainer={heroRootRef} className="w-full md:w-auto">
        <p
          className={`hero-on-video font-sans text-base md:text-xl font-normal leading-relaxed md:max-w-md text-left md:text-right cursor-default ${GLOW} whitespace-pre-line`}
          onMouseEnter={desc.start}
          onMouseLeave={desc.stop}
        >
          {desc.display}
        </p>
        </GlassSurface>
      </div>
      </div>
      <div className="absolute w-0 h-0 overflow-hidden">
        <div id="yt-player" ref={playerContainerRef} />
      </div>
      {contactOpen ? (
        <Suspense fallback={null}>
          <ContactModal
            open={contactOpen}
            onClose={() => setContactOpen(false)}
            contextRole={activeRole}
            mouseContainer={heroRootRef}
          />
        </Suspense>
      ) : null}
      </div>
    </>
  )
}
