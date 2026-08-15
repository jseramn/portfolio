import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  SRGBColorSpace,
  VideoTexture,
  WebGLRenderer,
} from "three"
import { AsciiEffect } from "three/addons/effects/AsciiEffect.js"

export type HeroAsciiMountOpts = {
  samplerWebm: string
  samplerMp4: string
  fallbackWebm: string
  fallbackMp4: string
}

const VIDEO_ZOOM = {
  default: 1.08,
  min: 1.0,
  max: 1.22,
  centerBonus: 0.06,
  wheelStep: 0.0008,
  parallaxPx: 18,
  bleedPercent: 118,
} as const

const FOV = 50
const PLANE_W = 16
const PLANE_H = 9
const SAMPLE_COLS = 96
const SAMPLE_ROWS = 54
const EXTRUDE = 2.4
const CENTER_THRESHOLD = 0.3

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function fillSources(video: HTMLVideoElement, webm: string, mp4: string) {
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

function isContactModalOpen(): boolean {
  if (document.querySelector("[data-contact-modal-open]")) return true
  return Boolean(document.querySelector('[role="dialog"][aria-modal="true"]'))
}

function eventInsideHero(event: Event): boolean {
  const root = document.querySelector("[data-hero-root]")
  if (!root || !(event.target instanceof Node)) return false
  return root.contains(event.target)
}

function cameraDistance(aspect: number): number {
  const vFov = (FOV * Math.PI) / 180
  const bleed = VIDEO_ZOOM.bleedPercent / 100
  const zFitH = PLANE_H / 2 / Math.tan(vFov / 2)
  const zFitW = PLANE_W / 2 / Math.tan(vFov / 2) / aspect
  return Math.min(zFitH, zFitW) / bleed
}

function tryPlay(video: HTMLVideoElement) {
  void video.play().catch(() => {})
}

export function mountHeroAscii(
  host: HTMLElement,
  opts: HeroAsciiMountOpts,
): () => void {
  const video = document.createElement("video")
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.preload = "metadata"
  video.setAttribute("playsinline", "")
  video.setAttribute("webkit-playsinline", "")
  video.setAttribute("muted", "")
  video.width = 1
  video.height = 1
  video.setAttribute("aria-hidden", "true")
  fillSources(video, opts.samplerWebm, opts.samplerMp4)
  host.appendChild(video)

  let usedFallback = false
  const onVideoError = () => {
    if (usedFallback) return
    usedFallback = true
    fillSources(video, opts.fallbackWebm, opts.fallbackMp4)
    tryPlay(video)
  }
  video.addEventListener("error", onVideoError)
  video.addEventListener("loadeddata", () => tryPlay(video))
  video.addEventListener("canplay", () => tryPlay(video))
  tryPlay(video)

  let renderer: WebGLRenderer
  try {
    renderer = new WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: true,
    })
  } catch {
    video.pause()
    video.remove()
    return () => {}
  }

  renderer.setPixelRatio(1)
  renderer.setClearColor(0x000000, 1)

  const scene = new Scene()
  const camera = new PerspectiveCamera(FOV, 1, 0.1, 100)
  camera.zoom = VIDEO_ZOOM.default
  camera.position.z = cameraDistance(1)
  camera.updateProjectionMatrix()

  const videoTexture = new VideoTexture(video)
  videoTexture.colorSpace = SRGBColorSpace

  const plane = new Mesh(
    new PlaneGeometry(PLANE_W, PLANE_H),
    new MeshBasicMaterial({ map: videoTexture }),
  )
  scene.add(plane)

  const pointCount = SAMPLE_COLS * SAMPLE_ROWS
  const positions = new Float32Array(pointCount * 3)
  const colors = new Float32Array(pointCount * 3)
  const pointsGeometry = new BufferGeometry()
  pointsGeometry.setAttribute("position", new BufferAttribute(positions, 3))
  pointsGeometry.setAttribute("color", new BufferAttribute(colors, 3))
  const points = new Points(
    pointsGeometry,
    new PointsMaterial({
      size: 0.14,
      vertexColors: true,
      sizeAttenuation: true,
    }),
  )
  scene.add(points)

  const sample = document.createElement("canvas")
  sample.width = SAMPLE_COLS
  sample.height = SAMPLE_ROWS
  const sampleCtx = sample.getContext("2d", { willReadFrequently: true })

  const effect = new AsciiEffect(renderer, undefined, { color: true })
  host.appendChild(effect.domElement)

  let mouseX = 0
  let mouseY = 0
  let zoom: number = VIDEO_ZOOM.default
  let raf = 0
  let alive = true

  const applySize = () => {
    const width = host.clientWidth || window.innerWidth
    const height = host.clientHeight || window.innerHeight
    const aspect = width / Math.max(height, 1)
    camera.aspect = aspect
    camera.position.z = cameraDistance(aspect)
    camera.updateProjectionMatrix()
    effect.setSize(width, height)
  }

  const applyCamera = () => {
    const hovering = (() => {
      const root = document.querySelector("[data-hero-root]")
      return root ? root.matches(":hover") : true
    })()
    const inCenter =
      hovering &&
      Math.abs(mouseX) < CENTER_THRESHOLD &&
      Math.abs(mouseY) < CENTER_THRESHOLD
    const activeZoom = inCenter
      ? Math.min(zoom + VIDEO_ZOOM.centerBonus, VIDEO_ZOOM.max)
      : zoom
    camera.zoom = activeZoom
    camera.updateProjectionMatrix()

    const width = host.clientWidth || window.innerWidth
    const height = host.clientHeight || window.innerHeight
    const vFov = (FOV * Math.PI) / 180
    const visibleH = (2 * Math.tan(vFov / 2) * camera.position.z) / activeZoom
    const visibleW = visibleH * camera.aspect
    camera.position.x = -mouseX * VIDEO_ZOOM.parallaxPx * (visibleW / width)
    camera.position.y = mouseY * VIDEO_ZOOM.parallaxPx * (visibleH / height)
    camera.lookAt(0, 0, 0)
  }

  const sampleLuminance = () => {
    if (!sampleCtx || video.readyState < 2) return
    sampleCtx.drawImage(video, 0, 0, SAMPLE_COLS, SAMPLE_ROWS)
    const pixels = sampleCtx.getImageData(0, 0, SAMPLE_COLS, SAMPLE_ROWS).data
    for (let row = 0; row < SAMPLE_ROWS; row++) {
      for (let col = 0; col < SAMPLE_COLS; col++) {
        const i = row * SAMPLE_COLS + col
        const p = i * 4
        const r = pixels[p] / 255
        const g = pixels[p + 1] / 255
        const b = pixels[p + 2] / 255
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        const i3 = i * 3
        positions[i3] = ((col + 0.5) / SAMPLE_COLS - 0.5) * PLANE_W
        positions[i3 + 1] = (0.5 - (row + 0.5) / SAMPLE_ROWS) * PLANE_H
        positions[i3 + 2] = lum * EXTRUDE
        colors[i3] = r
        colors[i3 + 1] = g
        colors[i3 + 2] = b
      }
    }
    const posAttr = pointsGeometry.getAttribute("position")
    const colorAttr = pointsGeometry.getAttribute("color")
    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
  }

  const onMouseMove = (event: MouseEvent) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2
  }

  const onWheel = (event: WheelEvent) => {
    if (isContactModalOpen()) return
    const root = document.querySelector("[data-hero-root]")
    if (root) {
      if (!eventInsideHero(event)) return
      event.preventDefault()
    }
    zoom = clamp(zoom + event.deltaY * VIDEO_ZOOM.wheelStep, VIDEO_ZOOM.min, VIDEO_ZOOM.max)
  }

  const tick = () => {
    if (!alive) return
    raf = requestAnimationFrame(tick)
    sampleLuminance()
    applyCamera()
    videoTexture.needsUpdate = true
    effect.render(scene, camera)
  }

  applySize()
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("wheel", onWheel, { passive: false })
  window.addEventListener("resize", applySize)
  raf = requestAnimationFrame(tick)

  return () => {
    alive = false
    cancelAnimationFrame(raf)
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("wheel", onWheel)
    window.removeEventListener("resize", applySize)
    video.removeEventListener("error", onVideoError)
    video.pause()
    video.removeAttribute("src")
    video.load()
    video.remove()
    videoTexture.dispose()
    plane.geometry.dispose()
    plane.material.dispose()
    pointsGeometry.dispose()
    points.material.dispose()
    renderer.dispose()
    effect.domElement.remove()
  }
}
