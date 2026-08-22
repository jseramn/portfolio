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
import { ContactModal } from "./ContactModal"
import { InfiniteSlider } from "./InfiniteSlider"
import { site } from "../config/site"
import type { GitHubStats } from "../lib/githubStats"

const HeroAsciiBackground = lazy(() => import("./HeroAsciiBackground"))

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
  const desc = useScramble(DESC, { autoStart: true })
  const ghStats = useGitHubStats()
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const [contactOpen, setContactOpen] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const activeRole = PROFESSIONS[roleIndex] ?? PROFESSIONS[0]
  const playerRef = useRef<any>(null)
  const playerContainerRef = useRef<HTMLDivElement>(null)

  // YouTube IFrame Player API — start muted, unmute on first interaction
  useEffect(() => {
    const tag = document.createElement("script")
    tag.src = "https://www.youtube.com/iframe_api"
    document.head.appendChild(tag)

    ;(window as any).onYouTubeIframeAPIReady = () => {
      const track = YT_TRACKS[trackIndex]
      playerRef.current = new (window as any).YT.Player("yt-player", {
        videoId: track.id,
        playerVars: { autoplay: 1, start: track.start, loop: 1, playlist: track.id },
        events: {
          onReady: (e: any) => {
            e.target.mute()
            e.target.playVideo()
          },
        },
      })
    }

    return () => {
      if (playerRef.current?.destroy) playerRef.current.destroy()
    }
  }, [])

  // Unmute on first user interaction (click/tap/keypress)
  useEffect(() => {
    const events = ["click", "touchstart", "keydown", "pointerdown"] as const
    const unmute = () => {
      if (playerRef.current?.unMute) {
        playerRef.current.unMute()
        playerRef.current.setVolume(100)
        setMusicPlaying(true)
      }
      events.forEach(e => window.removeEventListener(e, unmute))
    }
    events.forEach(e => window.addEventListener(e, unmute, { once: true }))
    return () => {
      events.forEach(e => window.removeEventListener(e, unmute))
    }
  }, [])

  const loadTrack = useCallback((index: number) => {
    setTrackIndex(index)
    if (!playerRef.current?.loadVideoById) return
    const track = YT_TRACKS[index]
    playerRef.current.loadVideoById({ videoId: track.id, startSeconds: track.start })
    playerRef.current.unMute()
    playerRef.current.setVolume(100)
    setMusicPlaying(true)
  }, [])

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
    if (!playerRef.current) return
    if (musicPlaying) {
      playerRef.current.mute()
      setMusicPlaying(false)
    } else {
      playerRef.current.unMute()
      setMusicPlaying(true)
    }
  }, [musicPlaying])

  return (
    <>
      <Suspense fallback={<div className="fixed inset-0 z-0 bg-black" aria-hidden />}>
        <HeroAsciiBackground />
      </Suspense>
      <div
        className="relative z-10 h-screen overflow-hidden"
        data-hero-root
      >
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
      <div className="absolute inset-x-0 top-0 z-10 pt-6 md:pt-8">
        <InfiniteSlider gap={32} speed={50} speedOnHover={20}>
          <span className="hero-on-video font-mono text-xs md:text-base whitespace-nowrap">
            Hi, I am {site.name} — {site.locationLine}
          </span>
          <span className="hero-ink-muted font-mono">·</span>
          {site.marqueeOrgs.flatMap((org) => [
            <a
              key={org.label}
              href={org.href}
              target={org.href.startsWith("http") ? "_blank" : undefined}
              rel={org.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className={`hero-on-video font-mono text-xs md:text-base ${GLOW} whitespace-nowrap`}
            >
              {org.label}
            </a>,
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
      </div>
      <div className="absolute inset-x-0 z-10 md:inset-x-auto md:right-8 top-14 md:top-24 font-mono text-xs md:text-sm flex items-center justify-center md:justify-end gap-3 px-4 md:px-0">
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
      <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col md:flex-row md:items-end md:justify-between px-4 md:px-16 pb-8 md:pb-12 gap-4 md:gap-0">
        <button
          type="button"
          onClick={() => setContactOpen(true)}
          className={`hero-on-video group font-sans text-2xl md:text-3xl font-semibold tracking-tight text-left cursor-pointer md:w-[30%] ${GLOW} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-ink)]`}
          aria-label={`Open contact form — current role: ${activeRole}`}
        >
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
        </button>
        <p
          className={`hero-on-video font-sans text-base md:text-xl font-normal leading-relaxed md:max-w-md text-left md:text-right cursor-default ${GLOW} whitespace-pre-line`}
          onMouseEnter={desc.start}
          onMouseLeave={desc.stop}
        >
          {desc.display}
        </p>
      </div>
      <div className="absolute w-0 h-0 overflow-hidden">
        <div id="yt-player" ref={playerContainerRef} />
      </div>
      <div className="absolute right-4 top-1/2 z-10 -translate-y-1/2 flex flex-col items-center gap-4 md:left-8 md:right-auto md:top-24 md:translate-y-0 md:flex-row md:gap-5">
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
            >
              <Icon size={24} className="md:w-[26px] md:h-[26px]" />
            </a>
          )
        })}
      </div>
      </div>
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        contextRole={activeRole}
      />
    </>
  )
}
