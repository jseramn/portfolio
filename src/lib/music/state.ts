export const MUSIC_API_TIMEOUT_MS = 5_000
export const MUSIC_VOLUME_START = 60
export const MUSIC_VOLUME_STEP_MS = 100
export const YT_STATE_PLAYING = 1

export type MusicStatus = "idle" | "loading" | "playing" | "error"
export type MusicEvent = "start" | "playing" | "failed"

export type YtPlayer = {
  destroy: () => void
  loadVideoById: (opts: { videoId: string; startSeconds: number }) => void
  mute: () => void
  unMute: () => void
  setVolume: (n: number) => void
  playVideo: () => void
}

export type YtWindow = Window & {
  YT?: { Player: new (id: string, options: unknown) => YtPlayer }
  onYouTubeIframeAPIReady?: () => void
}

export function reduceMusicStatus(status: MusicStatus, event: MusicEvent): MusicStatus {
  if (event === "start") return "loading"
  if (event === "playing") return status === "loading" || status === "playing" ? "playing" : status
  return status === "idle" ? "idle" : "error"
}

export function musicNowPlayingText(status: MusicStatus, title: string): string {
  if (status === "idle") return "click to listen"
  if (status === "loading") return "loading…"
  if (status === "playing") return `now playing: ${title}`
  return "audio unavailable"
}

export function musicTransportEnabled(status: MusicStatus): boolean {
  return status === "idle" || status === "playing"
}

export function musicVolumeSteps(
  start = MUSIC_VOLUME_START,
  target = 100,
  ms = 800,
  step = MUSIC_VOLUME_STEP_MS,
): number[] {
  const count = Math.max(1, Math.round(ms / step))
  return Array.from({ length: count }, (_, i) =>
    Math.round(start + ((target - start) * (i + 1)) / count),
  )
}

export function startMusicVolumeRamp(
  setVolume: (n: number) => void,
  isMuted: () => boolean,
): () => void {
  if (isMuted()) return () => {}
  try {
    setVolume(MUSIC_VOLUME_START)
  } catch {
    return () => {}
  }
  const steps = musicVolumeSteps()
  let i = 0
  const id = setInterval(() => {
    const next = steps[i++]
    if (next === undefined) {
      clearInterval(id)
      return
    }
    if (isMuted()) return
    try {
      setVolume(next)
    } catch {
      clearInterval(id)
    }
  }, MUSIC_VOLUME_STEP_MS)
  return () => clearInterval(id)
}
