import { useState, useEffect, useRef, useCallback, lazy, Suspense } from "react"
import { TextLoop } from "./TextLoop"
import { Shuffle, SkipBack, SkipForward, SOCIAL_ICONS, Volume2, VolumeX } from "./icons"
import { InfiniteSlider } from "./InfiniteSlider"
import { GlassSurface } from "./GlassSurface"
import { site } from "../config/site"
import { onHireCtaClicked, onOutboundOrg, onOutboundSocial } from "../lib/analytics/productCapture"
import { getCapabilities } from "../lib/capabilities"
import {
  MUSIC_API_TIMEOUT_MS,
  YT_STATE_PLAYING,
  musicNowPlayingText,
  musicTransportEnabled,
  reduceMusicStatus,
  startMusicVolumeRamp,
  type MusicStatus,
  type YtPlayer,
  type YtWindow,
} from "../lib/music/state"
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
const TAP_TARGET = "inline-flex min-h-11 min-w-11 items-center justify-center"
const CHROME_FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-ink)]"
const MARQUEE_TYPE = "hero-on-video font-mono text-sm md:text-base whitespace-nowrap"
const HOME_NAV = [
  { href: "/about", label: "about" },
  { href: "/contact", label: "contact" },
] as const

function useScramble(text: string, { autoStart = false }: { autoStart?: boolean } = {}) {
  const [display, setDisplay] = useState(autoStart ? ".".repeat(text.length) : text)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    if (getCapabilities().reducedMotion) {
      setDisplay(text)
      return
    }
    if (intervalRef.current) clearInterval(intervalRef.current)
    let iteration = 0
    intervalRef.current = setInterval(() => {
      const keepCount = Math.floor(iteration / 2)
      let newText = ""
      for (let i = 0; i < text.length; i++) {
        if (
          text[i] === " " ||
          text[i] === "·" ||
          text[i] === "." ||
          text[i] === "&" ||
          text[i] === "'" ||
          text[i] === "\n"
        ) {
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
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
  const [musicStatus, setMusicStatus] = useState<MusicStatus>("idle")
  const [musicMuted, setMusicMuted] = useState(true)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const [contactOpen, setContactOpen] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const activeRole = PROFESSIONS[roleIndex] ?? PROFESSIONS[0]
  const playerRef = useRef<YtPlayer | null>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)
  const heroRootRef = useRef<HTMLDivElement>(null)
  const asciiPaintRef = useRef<HTMLCanvasElement>(null)
  const trackIndexRef = useRef(trackIndex)
  trackIndexRef.current = trackIndex
  const musicStatusRef = useRef(musicStatus)
  musicStatusRef.current = musicStatus
  const mutedRef = useRef(musicMuted)
  mutedRef.current = musicMuted
  const stopRamp = useRef(() => {})
  const apiTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const failMusic = useCallback(() => {
    if (apiTimer.current) clearTimeout(apiTimer.current)
    apiTimer.current = null
    stopRamp.current()
    setMusicStatus((status) => reduceMusicStatus(status, "failed"))
  }, [])

  useEffect(() => {
    return () => {
      if (apiTimer.current) clearTimeout(apiTimer.current)
      stopRamp.current()
      try {
        playerRef.current?.destroy()
      } catch {
        /* player already gone */
      }
    }
  }, [])

  const ensureYtPlayer = useCallback(
    (index: number) => {
      try {
        playerRef.current?.destroy()
      } catch {
        /* retry */
      }
      playerRef.current = null
      const startPlayer = () => {
        const YT = (window as YtWindow).YT
        if (playerRef.current || !YT?.Player) return
        if (apiTimer.current) clearTimeout(apiTimer.current)
        apiTimer.current = null
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
            onReady: (e: { target: YtPlayer }) => {
              try {
                if (!mutedRef.current) e.target.unMute()
                stopRamp.current()
                stopRamp.current = startMusicVolumeRamp(
                  (n) => e.target.setVolume(n),
                  () => mutedRef.current,
                )
                e.target.playVideo()
              } catch {
                failMusic()
              }
            },
            onStateChange: (e: { data: number }) => {
              if (e.data === YT_STATE_PLAYING) {
                setMusicStatus((status) => reduceMusicStatus(status, "playing"))
              }
            },
            onError: failMusic,
          },
        })
      }

      if ((window as YtWindow).YT?.Player) {
        startPlayer()
        return
      }
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement("script")
        tag.src = "https://www.youtube.com/iframe_api"
        tag.onerror = () => failMusic()
        document.head.appendChild(tag)
      }
      const ytWindow = window as YtWindow
      const previous = ytWindow.onYouTubeIframeAPIReady
      ytWindow.onYouTubeIframeAPIReady = () => {
        previous?.()
        startPlayer()
      }
      if (apiTimer.current) clearTimeout(apiTimer.current)
      apiTimer.current = setTimeout(() => {
        if (!(window as YtWindow).YT?.Player) failMusic()
      }, MUSIC_API_TIMEOUT_MS)
    },
    [failMusic],
  )

  const loadTrack = useCallback(
    (index: number) => {
      if (!musicTransportEnabled(musicStatusRef.current)) return
      setTrackIndex(index)
      trackIndexRef.current = index
      setMusicStatus((status) => reduceMusicStatus(status, "start"))
      const player = playerRef.current
      if (!player?.loadVideoById) {
        mutedRef.current = false
        setMusicMuted(false)
        ensureYtPlayer(index)
        return
      }
      try {
        const track = YT_TRACKS[index]
        player.loadVideoById({ videoId: track.id, startSeconds: track.start })
        if (!mutedRef.current) {
          player.unMute()
          stopRamp.current()
          stopRamp.current = startMusicVolumeRamp(
            (n) => player.setVolume(n),
            () => mutedRef.current,
          )
        }
      } catch {
        failMusic()
      }
    },
    [ensureYtPlayer, failMusic],
  )

  const nextTrack = useCallback(() => {
    loadTrack((trackIndex + 1) % YT_TRACKS.length)
  }, [trackIndex, loadTrack])

  const prevTrack = useCallback(() => {
    loadTrack((trackIndex - 1 + YT_TRACKS.length) % YT_TRACKS.length)
  }, [trackIndex, loadTrack])

  const randomTrack = useCallback(() => {
    let next: number
    do {
      next = Math.floor(Math.random() * YT_TRACKS.length)
    } while (next === trackIndex && YT_TRACKS.length > 1)
    loadTrack(next)
  }, [trackIndex, loadTrack])

  const toggleMusic = useCallback(() => {
    const status = musicStatusRef.current
    if (status === "loading") return
    if (status === "idle" || status === "error") {
      mutedRef.current = false
      setMusicMuted(false)
      setMusicStatus((current) => reduceMusicStatus(current, "start"))
      ensureYtPlayer(trackIndexRef.current)
      return
    }
    const player = playerRef.current
    if (!player) return
    try {
      const next = !mutedRef.current
      if (mutedRef.current) player.unMute()
      else player.mute()
      mutedRef.current = next
      setMusicMuted(next)
    } catch {
      failMusic()
    }
  }, [ensureYtPlayer, failMusic])

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
    const hosts = () => [...root.querySelectorAll("[data-glass-host]")] as HTMLElement[]
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
      const settleMs = getCapabilities().reducedMotion ? 0 : 220
      if (settleMs === 0) {
        stopSettle()
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
        const t = Math.min(1, (now - started) / settleMs)
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

  const transportOff = !musicTransportEnabled(musicStatus)
  const audible = musicStatus === "playing" && !musicMuted

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
        <div
          data-hud-region="marquee"
          className="relative z-10 flex flex-col gap-2 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] hud:absolute hud:inset-x-0 hud:top-0 hud:flex-row hud:items-center hud:gap-4 hud:px-8 hud:pt-8 short:flex-row short:items-center short:gap-3"
        >
          <a
            href="/"
            aria-current="page"
            className={`hero-on-video font-mono text-sm ${TAP_TARGET} ${GLOW} ${CHROME_FOCUS} shrink-0 self-start hud:self-center`}
          >
            {site.brand}
          </a>
          <GlassSurface
            preset="bar"
            mouseContainer={heroRootRef}
            className="w-full min-w-0 hud:flex-1 short:flex-1"
          >
            <InfiniteSlider gap={32} speed={50} speedOnHover={20}>
              <span className={MARQUEE_TYPE}>
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
                    className={`${MARQUEE_TYPE} inline-flex min-h-11 items-center ${GLOW}`}
                    onClick={() => onOutboundOrg(org.label)}
                  >
                    {org.label}
                  </a>
                ) : (
                  <span
                    key={org.label}
                    className={`${MARQUEE_TYPE} inline-flex min-h-11 items-center`}
                  >
                    {org.label}
                  </span>
                ),
                <span key={`${org.label}-sep`} className="hero-ink-muted font-mono">
                  ·
                </span>,
              ])}
              {ghStats && (
                <span className={MARQUEE_TYPE}>
                  {ghStats.today} contributions today · {ghStats.month} this month · {ghStats.year}{" "}
                  this year · {ghStats.total} all-time
                </span>
              )}
              {ghStats && <span className="hero-ink-muted font-mono">·</span>}
              {ghStats?.lastCommit && (
                <a
                  href={ghStats.lastCommit.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${MARQUEE_TYPE} inline-flex min-h-11 items-center ${GLOW}`}
                >
                  last commit: {ghStats.lastCommit.message} ({ghStats.lastCommit.repo})
                </a>
              )}
              {ghStats?.lastCommit && <span className="hero-ink-muted font-mono">·</span>}
            </InfiniteSlider>
          </GlassSurface>
        </div>
        <div className="relative z-10 mt-auto flex min-h-0 flex-1 flex-col gap-3 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] hud:contents short:mt-auto short:flex-none short:flex-row short:flex-nowrap short:items-end short:gap-2">
          <div
            data-hud-region="now-playing"
            data-music-status={musicStatus}
            className="relative z-10 hud:absolute hud:inset-x-auto hud:right-8 hud:top-24 short:shrink-0"
          >
            <GlassSurface
              preset="pill"
              mouseContainer={heroRootRef}
              className="w-full hud:ml-auto hud:w-fit short:w-auto"
            >
              <div className="font-mono text-xs md:text-sm flex flex-wrap items-center justify-center hud:justify-end gap-2 px-4 hud:px-0 short:flex-nowrap short:px-0">
                {musicStatus === "playing" ? (
                  <a
                    href={`https://www.youtube.com/watch?v=${YT_TRACKS[trackIndex].id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-on-video inline-flex min-h-11 items-center whitespace-nowrap transition-all duration-300 max-w-[60vw] md:max-w-none overflow-hidden text-ellipsis short:hidden glow-pulse"
                    aria-live="polite"
                  >
                    <span className="sound-bars">
                      <span />
                      <span />
                      <span />
                      <span />
                    </span>
                    {musicNowPlayingText(musicStatus, YT_TRACKS[trackIndex].title)}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={toggleMusic}
                    className={`hero-on-video inline-flex min-h-11 items-center whitespace-nowrap cursor-pointer ${musicStatus === "idle" ? "short:hidden" : ""} ${musicStatus === "error" ? "" : "glow-pulse"} ${GLOW}`}
                    aria-live={musicStatus === "idle" ? undefined : "polite"}
                    aria-disabled={musicStatus === "loading" ? true : undefined}
                  >
                    {musicNowPlayingText(musicStatus, YT_TRACKS[trackIndex].title)}
                    {musicStatus === "idle" ? (
                      <>
                        {" "}
                        <span className="sound-bars">
                          <span />
                          <span />
                          <span />
                          <span />
                        </span>
                      </>
                    ) : null}
                  </button>
                )}
                <div className={`flex items-center gap-2${transportOff ? " opacity-50" : ""}`}>
                  <button
                    type="button"
                    onClick={prevTrack}
                    className={`hero-ink ${GLOW} ${TAP_TARGET} hover:scale-125`}
                    aria-label="Previous track"
                    aria-disabled={transportOff ? true : undefined}
                  >
                    <SkipBack size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={transportOff ? undefined : toggleMusic}
                    className={`hero-ink ${GLOW} ${TAP_TARGET} hover:scale-125`}
                    aria-label={audible ? "Mute music" : "Play music"}
                    aria-disabled={transportOff ? true : undefined}
                  >
                    {audible ? <Volume2 size={22} /> : <VolumeX size={22} />}
                  </button>
                  <button
                    type="button"
                    onClick={nextTrack}
                    className={`hero-ink ${GLOW} ${TAP_TARGET} hover:scale-125`}
                    aria-label="Next track"
                    aria-disabled={transportOff ? true : undefined}
                  >
                    <SkipForward size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={randomTrack}
                    className={`hero-ink ${GLOW} ${TAP_TARGET} hover:scale-125`}
                    aria-label="Random track"
                    aria-disabled={transportOff ? true : undefined}
                  >
                    <Shuffle size={20} />
                  </button>
                </div>
              </div>
            </GlassSurface>
          </div>
          <div
            className="relative z-[1] min-h-0 flex-1 pointer-events-none hud:hidden short:hidden"
            aria-hidden
          />
          <div
            data-hud-region="socials"
            className="flex justify-center z-10 hud:absolute hud:left-8 hud:top-24 hud:bottom-auto hud:right-auto hud:translate-x-0 hud:justify-start short:shrink-0"
          >
            <GlassSurface preset="dock" mouseContainer={heroRootRef}>
              <div className="flex flex-col items-center gap-1 short:flex-row short:items-center">
                <div className="flex flex-row items-center gap-4 md:gap-5 short:hidden">
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
                        className={`hero-ink drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] ${GLOW} ${TAP_TARGET} hover:scale-125`}
                        aria-label={social.id}
                        onClick={() => onOutboundSocial(social.id)}
                      >
                        <Icon size={24} />
                      </a>
                    )
                  })}
                </div>
                <nav aria-label="Site" className="flex flex-row items-center gap-1">
                  {HOME_NAV.map((item, index) => (
                    <span key={item.href} className="flex items-center gap-1">
                      {index > 0 ? (
                        <span className="hero-ink-muted font-mono text-sm" aria-hidden>
                          ·
                        </span>
                      ) : null}
                      <a
                        href={item.href}
                        className={`hero-on-video font-mono text-sm ${TAP_TARGET} ${GLOW} ${CHROME_FOCUS}`}
                      >
                        {item.label}
                      </a>
                    </span>
                  ))}
                </nav>
              </div>
            </GlassSurface>
          </div>
          <div className="relative z-10 flex flex-col gap-3 hud:absolute hud:inset-x-0 hud:bottom-0 hud:flex-row hud:items-end hud:justify-between hud:px-16 hud:pb-12 hud:gap-0 short:min-w-0 short:flex-1 short:gap-1">
            <div data-hud-region="roles">
              <GlassSurface
                preset="button"
                mouseContainer={heroRootRef}
                className="self-start w-max max-w-full md:shrink-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    onHireCtaClicked()
                    setContactOpen(true)
                  }}
                  className={`hero-on-video group inline-flex min-h-11 items-center gap-3 whitespace-nowrap text-left cursor-pointer short:flex-col short:items-start short:gap-0 ${GLOW}`}
                  aria-label="Hire / Contact"
                >
                  <span className="font-mono text-sm font-normal tracking-normal">hire →</span>
                  <span
                    aria-hidden="true"
                    className="font-sans text-2xl md:text-3xl font-semibold tracking-tight"
                  >
                    <TextLoop
                      interval={2.5}
                      transition={{ duration: 0.4 }}
                      onIndexChange={setRoleIndex}
                      paused={contactOpen}
                    >
                      {PROFESSIONS.map((p) => (
                        <span
                          key={p}
                          className="underline decoration-transparent underline-offset-4 transition-[text-decoration-color] group-hover:decoration-[var(--hero-ink)]/50"
                        >
                          {p}
                        </span>
                      ))}
                    </TextLoop>
                  </span>
                </button>
              </GlassSurface>
            </div>
            <div data-hud-region="tagline" className="min-w-0 short:w-full">
              <GlassSurface
                preset="card"
                mouseContainer={heroRootRef}
                className="w-full md:w-auto short:min-w-0"
              >
                <p
                  className={`hero-on-video font-sans text-base md:text-xl font-normal leading-relaxed hud:max-w-md text-left hud:text-right cursor-default ${GLOW} whitespace-pre-line short:whitespace-normal`}
                  onMouseEnter={desc.start}
                  onMouseLeave={desc.stop}
                >
                  {desc.display}
                </p>
              </GlassSurface>
            </div>
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
