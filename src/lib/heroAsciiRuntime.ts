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
const CHARSET = " .:-=+*#%@" // idx 8 = "%", idx 9 = "@"
const ASCII_FPS = 12
const PAPER_LUMA = 0.12
const OPACITY_FLOOR = 0.16
const OCCUPIED_IDX_MIN = 2
const RIM_LUMA_DELTA = 0.09
const STRETCH_LO = 0.02
const STRETCH_HI = 0.98
const LUMA_CONTRAST = 2.6
const OCCUPANCY_MIN_NEIGHBORS = 2
const MAX_CELLS = 12_000
const GL_RESOLUTION = 0.15
const SAMPLE_MS = 1000 / ASCII_FPS
const CHARSET_LAST = CHARSET.length - 1
const OCCUPIED_IDX_SPAN = CHARSET_LAST - OCCUPIED_IDX_MIN

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function contrast01(value: number, amount: number): number {
  const t = clamp(value, 0, 1)
  const denom = Math.tanh(0.5 * amount)
  if (denom < 1e-6) return t
  return clamp(0.5 + (Math.tanh((t - 0.5) * amount) / denom) * 0.5, 0, 1)
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

function pickGrid(cssW: number, cssH: number) {
  let cols = Math.max(1, Math.floor(cssW * GL_RESOLUTION))
  let rows = Math.max(1, Math.floor((cssH * GL_RESOLUTION) / 2))
  const cells = cols * rows
  if (cells > MAX_CELLS) {
    const scale = Math.sqrt(MAX_CELLS / cells)
    cols = Math.max(1, Math.floor(cols * scale))
    rows = Math.max(1, Math.floor(rows * scale))
    if (cols * rows > MAX_CELLS) {
      rows = Math.max(1, Math.floor(MAX_CELLS / cols))
    }
  }
  return { cols, rows }
}

export function mountHeroAscii(
  host: HTMLElement,
  opts: HeroAsciiMountOpts,
  paintCanvas?: HTMLCanvasElement | null,
): () => void {
  const video = document.createElement("video")
  video.muted = true
  video.defaultMuted = true
  video.loop = true
  video.playsInline = true
  video.controls = false
  video.preload = "auto"
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
  videoTexture.update = () => {}

  const plane = new Mesh(
    new PlaneGeometry(PLANE_W, PLANE_H),
    new MeshBasicMaterial({ map: videoTexture }),
  )
  scene.add(plane)

  const pointCount = SAMPLE_COLS * SAMPLE_ROWS
  const positions = new Float32Array(pointCount * 3)
  const colors = new Float32Array(pointCount * 3)
  const cellLuma = new Float32Array(MAX_CELLS)
  const cellOccupied = new Uint8Array(MAX_CELLS)
  const occupiedLumaScratch = new Float32Array(MAX_CELLS)
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

  const asciiSample = document.createElement("canvas")
  const asciiCtx = asciiSample.getContext("2d", { willReadFrequently: true })

  const ownsPaintCanvas = !paintCanvas
  const displayCanvas = paintCanvas ?? document.createElement("canvas")
  if (ownsPaintCanvas) {
    displayCanvas.className = "hero-ascii-display"
    displayCanvas.setAttribute("aria-hidden", "true")
    host.appendChild(displayCanvas)
  }
  const displayCtx = displayCanvas.getContext("2d")
  if (displayCtx) {
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)
  }
  // #region agent log
  fetch("http://127.0.0.1:7586/ingest/00af1405-f462-421b-a094-07596f9f5fa4", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "2d62cf",
    },
    body: JSON.stringify({
      sessionId: "2d62cf",
      runId: "post-fix",
      hypothesisId: "F",
      location: "heroAsciiRuntime.ts:mount",
      message: "ascii paint canvas parent",
      data: {
        ownsPaintCanvas,
        parentIsHeroRoot: displayCanvas.parentElement?.hasAttribute("data-hero-root") ?? false,
        parentClass: displayCanvas.parentElement?.className ?? "",
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {})
  // #endregion

  let mouseX = 0
  let mouseY = 0
  let zoom: number = VIDEO_ZOOM.default
  let raf = 0
  let alive = true
  let lastSampleAt = 0
  let lastVideoTime = Number.NaN
  let pausedForModal = false
  let cellW = 1
  let cellH = 1

  const applySize = () => {
    const sizeHost =
      displayCanvas.parentElement instanceof HTMLElement
        ? displayCanvas.parentElement
        : host
    const width = sizeHost.clientWidth || host.clientWidth || window.innerWidth
    const height = sizeHost.clientHeight || host.clientHeight || window.innerHeight
    const aspect = width / Math.max(height, 1)
    camera.aspect = aspect
    camera.position.z = cameraDistance(aspect)
    camera.updateProjectionMatrix()

    const { cols, rows } = pickGrid(width, height)
    renderer.setPixelRatio(1)
    renderer.setSize(cols, rows)
    asciiSample.width = cols
    asciiSample.height = rows
    displayCanvas.width = width
    displayCanvas.height = height
    cellW = width / cols
    cellH = height / rows
    if (displayCtx) {
      displayCtx.clearRect(0, 0, width, height)
      displayCtx.font = `${Math.ceil(cellH)}px courier new, monospace`
      displayCtx.textBaseline = "top"
      displayCtx.textAlign = "left"
    }
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

  const rasterGlyphs = (image: ImageData) => {
    if (!displayCtx) return
    const cols = asciiSample.width
    const rows = asciiSample.height
    const cssW = displayCanvas.width
    const cssH = displayCanvas.height
    displayCtx.clearRect(0, 0, cssW, cssH)
    const data = image.data
    const cellCount = Math.min(cols * rows, MAX_CELLS)

    let occupiedN = 0
    for (let i = 0; i < cellCount; i++) {
      const p = i * 4
      const luma = (0.3 * data[p] + 0.59 * data[p + 1] + 0.11 * data[p + 2]) / 255
      cellLuma[i] = luma
      cellOccupied[i] = luma < PAPER_LUMA ? 0 : 1
    }

    const occupiedAt = (nx: number, ny: number): number => {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return 0
      const ni = ny * cols + nx
      if (ni >= cellCount) return 0
      return cellOccupied[ni]
    }

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        if (i >= cellCount || cellOccupied[i] === 0) continue
        const n =
          occupiedAt(x - 1, y) +
          occupiedAt(x + 1, y) +
          occupiedAt(x, y - 1) +
          occupiedAt(x, y + 1)
        if (n < OCCUPANCY_MIN_NEIGHBORS) occupiedLumaScratch[i] = 1
        else occupiedLumaScratch[i] = 0
      }
    }
    for (let i = 0; i < cellCount; i++) {
      if (cellOccupied[i] !== 0 && occupiedLumaScratch[i] === 1) cellOccupied[i] = 0
      if (cellOccupied[i] !== 0) occupiedLumaScratch[occupiedN++] = cellLuma[i]
    }

    let p10 = 0
    let p90 = 1
    let skipStretch = occupiedN < 2
    if (!skipStretch) {
      const sorted = occupiedLumaScratch.subarray(0, occupiedN)
      sorted.sort((a, b) => a - b)
      const last = occupiedN - 1
      p10 = sorted[clamp(Math.round(last * STRETCH_LO), 0, last)]
      p90 = sorted[clamp(Math.round(last * STRETCH_HI), 0, last)]
      skipStretch = p90 - p10 < 1e-6
    }
    const stretchRange = p90 - p10

    const neighborLuma = (nx: number, ny: number): number => {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return 0
      const ni = ny * cols + nx
      if (ni >= cellCount || cellOccupied[ni] === 0) return 0
      return cellLuma[ni]
    }

    let minGX = cols
    let minGY = rows
    let maxGX = 0
    let maxGY = 0

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        if (i >= cellCount || cellOccupied[i] === 0) continue

        const luma = cellLuma[i]
        const stretched = skipStretch
          ? luma
          : clamp((luma - p10) / stretchRange, 0, 1)
        const contrasted = contrast01(stretched, LUMA_CONTRAST)
        const alpha = OPACITY_FLOOR + contrasted * (1 - OPACITY_FLOOR)
        displayCtx.fillStyle = `rgba(255,255,255,${alpha})`

        const baseIdx = clamp(
          OCCUPIED_IDX_MIN + Math.round((1 - contrasted) * OCCUPIED_IDX_SPAN),
          OCCUPIED_IDX_MIN,
          CHARSET_LAST,
        )
        const maxDelta = Math.max(
          Math.abs(luma - neighborLuma(x - 1, y)),
          Math.abs(luma - neighborLuma(x + 1, y)),
          Math.abs(luma - neighborLuma(x, y - 1)),
          Math.abs(luma - neighborLuma(x, y + 1)),
        )
        const rimStep =
          maxDelta >= RIM_LUMA_DELTA * 2 ? 2 : maxDelta >= RIM_LUMA_DELTA ? 1 : 0
        const idx = Math.min(CHARSET_LAST, baseIdx + rimStep)
        const glyph = CHARSET[idx]
        if (glyph !== undefined && glyph !== " ") {
          displayCtx.fillText(glyph, x * cellW, y * cellH)
          if (x < minGX) minGX = x
          if (y < minGY) minGY = y
          if (x > maxGX) maxGX = x
          if (y > maxGY) maxGY = y
        }
      }
    }

    if (maxGX >= minGX && maxGY >= minGY) {
      displayCanvas.dataset.glassBox = `${minGX * cellW},${minGY * cellH},${(maxGX - minGX + 1) * cellW},${(maxGY - minGY + 1) * cellH}`
    }
    displayCanvas.dataset.glassGen = String((Number(displayCanvas.dataset.glassGen) || 0) + 1)
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

  const tick = (now: number) => {
    if (!alive) return
    raf = requestAnimationFrame(tick)

    if (isContactModalOpen()) {
      if (!pausedForModal) {
        video.pause()
        pausedForModal = true
      }
      return
    }
    if (pausedForModal) {
      pausedForModal = false
      tryPlay(video)
    }

    if (now - lastSampleAt >= SAMPLE_MS) {
      lastSampleAt = now
      const t = video.currentTime
      if (t !== lastVideoTime) {
        lastVideoTime = t
        sampleLuminance()
        videoTexture.needsUpdate = true
      }
    }

    applyCamera()
    renderer.render(scene, camera)
    if (!asciiCtx) return
    asciiCtx.drawImage(renderer.domElement, 0, 0)
    rasterGlyphs(asciiCtx.getImageData(0, 0, asciiSample.width, asciiSample.height))
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
      video.pause()
      return
    }
    tryPlay(video)
    if (alive && raf === 0) raf = requestAnimationFrame(tick)
  }

  applySize()
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("wheel", onWheel, { passive: false })
  window.addEventListener("resize", applySize)
  document.addEventListener("visibilitychange", onVisibility)
  if (!document.hidden) raf = requestAnimationFrame(tick)
  else video.pause()

  return () => {
    alive = false
    cancelAnimationFrame(raf)
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("wheel", onWheel)
    window.removeEventListener("resize", applySize)
    document.removeEventListener("visibilitychange", onVisibility)
    video.removeEventListener("error", onVideoError)
    video.pause()
    video.removeAttribute("src")
    video.load()
    video.remove()
    if (ownsPaintCanvas) displayCanvas.remove()
    else if (displayCtx) displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height)
    videoTexture.dispose()
    plane.geometry.dispose()
    plane.material.dispose()
    pointsGeometry.dispose()
    points.material.dispose()
    renderer.dispose()
  }
}
