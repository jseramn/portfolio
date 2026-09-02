import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { site } from "../../config/site"
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
} from "../../lib/music/state"
import { Shuffle, SkipBack, SkipForward, Volume2, VolumeX } from "../icons"
import { GlassSurface } from "../GlassSurface"
import { GLOW, TAP_TARGET } from "./chrome"

const YT_TRACKS = site.tracks

export function HeroMusic({
  mouseContainer,
}: {
  mouseContainer: RefObject<HTMLDivElement | null>
}) {
  const [musicStatus, setMusicStatus] = useState<MusicStatus>("idle")
  const [musicMuted, setMusicMuted] = useState(true)
  const [trackIndex, setTrackIndex] = useState(() => Math.floor(Math.random() * YT_TRACKS.length))
  const playerRef = useRef<YtPlayer | null>(null)
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

  const transportOff = !musicTransportEnabled(musicStatus)
  const audible = musicStatus === "playing" && !musicMuted

  return (
    <div
      data-hud-region="now-playing"
      data-music-status={musicStatus}
      className="relative z-10 hud:absolute hud:inset-x-auto hud:right-8 hud:top-24 short:shrink-0"
    >
      <GlassSurface
        preset="pill"
        mouseContainer={mouseContainer}
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
  )
}
