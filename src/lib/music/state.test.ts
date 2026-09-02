import { describe, expect, it } from "vitest"
import {
  MUSIC_VOLUME_START,
  musicNowPlayingText,
  musicTransportEnabled,
  musicVolumeSteps,
  reduceMusicStatus,
  type MusicStatus,
} from "./state"

const FLOW: MusicStatus[] = ["idle", "loading", "playing", "error"]

describe("ambient music status", () => {
  it("walks idle → loading → playing → error → retry, and ignores stale events", () => {
    expect(reduceMusicStatus("idle", "start")).toBe("loading")
    expect(reduceMusicStatus("loading", "playing")).toBe("playing")
    expect(reduceMusicStatus("playing", "failed")).toBe("error")
    expect(reduceMusicStatus("error", "start")).toBe("loading")
    expect(reduceMusicStatus("loading", "start")).toBe("loading")
    expect(reduceMusicStatus("error", "playing")).toBe("error")
    expect(reduceMusicStatus("idle", "failed")).toBe("idle")
    expect(reduceMusicStatus("playing", "start")).toBe("loading")
  })

  it("names the pill, gates transport, and ramps volume instead of jumping", () => {
    expect(FLOW.map((s) => musicNowPlayingText(s, "Aria"))).toEqual([
      "click to listen",
      "loading…",
      "now playing: Aria",
      "audio unavailable",
    ])
    expect(FLOW.map(musicTransportEnabled)).toEqual([true, false, true, false])
    const steps = musicVolumeSteps()
    expect(steps[0]).toBeGreaterThan(MUSIC_VOLUME_START)
    expect(steps).toEqual([65, 70, 75, 80, 85, 90, 95, 100])
  })
})
