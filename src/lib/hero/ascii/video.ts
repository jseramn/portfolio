import { VIDEO_PRELOAD } from "../../heroAsciiBudget"
import type { HeroAsciiMountOpts } from "./session"

export function fillSources(video: HTMLVideoElement, webm: string, mp4: string) {
  video.replaceChildren()
  const webmSource = document.createElement("source")
  webmSource.src = webm
  webmSource.type = "video/webm"
  const mp4Source = document.createElement("source")
  mp4Source.src = mp4
  mp4Source.type = "video/mp4"
  video.append(webmSource, mp4Source)
  video.load()
}

export function tryPlay(video: HTMLVideoElement) {
  void video.play().catch(() => {})
}

export function videoReady(video: HTMLVideoElement): boolean {
  return video.readyState >= 2
}

export function createSamplerVideo(host: HTMLElement, opts: HeroAsciiMountOpts): HTMLVideoElement {
  const video = document.createElement("video")
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.controls = false
  video.preload = VIDEO_PRELOAD
  video.disablePictureInPicture = true
  video.setAttribute("playsinline", "")
  video.setAttribute("webkit-playsinline", "")
  video.setAttribute("muted", "")
  video.setAttribute("controlslist", "nodownload nofullscreen noremoteplayback")
  video.setAttribute("disablepictureinpicture", "")
  video.setAttribute("aria-hidden", "true")
  video.width = 1
  video.height = 1
  video.style.cssText =
    "position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none;clip-path:inset(50%)"
  fillSources(video, opts.samplerWebm, opts.samplerMp4)
  host.appendChild(video)
  return video
}

export function bindSamplerReady(video: HTMLVideoElement, onReady: () => void): () => void {
  video.addEventListener("loadeddata", onReady)
  video.addEventListener("canplay", onReady)
  if (videoReady(video)) onReady()
  else {
    tryPlay(video)
    if (document.hidden) video.pause()
  }
  return () => {
    video.removeEventListener("loadeddata", onReady)
    video.removeEventListener("canplay", onReady)
  }
}

export function disposeSamplerVideo(video: HTMLVideoElement) {
  video.pause()
  video.removeAttribute("src")
  video.load()
  video.remove()
}
