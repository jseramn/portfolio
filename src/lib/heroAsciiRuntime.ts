import {
  MAX_CELLS,
  VIDEO_PRELOAD,
  cellBudget,
  coverDestRect,
  isPointerCoarse,
  pickGrid,
  planAsciiFrame,
  sampleMsForLoop,
  shouldRefineOccupancy,
  shouldSkipSample,
  shouldStartLoop,
  shouldYieldToMain,
  stampSliceEnd,
  yieldToMain,
} from "./heroAsciiBudget"
import {
  cellDestRect,
  rgbaOffset,
  shouldContinueStamp,
  stampGlyphAlpha,
} from "./heroAsciiStamp"
import { signalHeroBootReady } from "./bootLoader"

export type HeroAsciiMountOpts = {
  samplerWebm: string
  samplerMp4: string
  fallbackWebm: string
  fallbackMp4: string
  poster?: string
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
const PAPER_LUMA = 0.12
const OPACITY_FLOOR = 0.16
const OCCUPIED_IDX_MIN = 2
const RIM_LUMA_DELTA = 0.09
const STRETCH_LO = 0.02
const STRETCH_HI = 0.98
const LUMA_CONTRAST = 2.6
const OCCUPANCY_MIN_NEIGHBORS = 2
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

export function blitHeroPoster(
  canvas: HTMLCanvasElement,
  src: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = "async"
    img.onload = () => {
      const host =
        canvas.parentElement instanceof HTMLElement ? canvas.parentElement : null
      const width = host?.clientWidth || canvas.clientWidth || window.innerWidth
      const height = host?.clientHeight || canvas.clientHeight || window.innerHeight
      if (canvas.width !== width) canvas.width = width
      if (canvas.height !== height) canvas.height = height
      const ctx = canvas.getContext("2d")
      if (!ctx || img.naturalWidth < 1 || img.naturalHeight < 1) {
        resolve(false)
        return
      }
      const dest = coverDestRect(img.naturalWidth, img.naturalHeight, width, height)
      ctx.fillStyle = "#000"
      ctx.fillRect(0, 0, width, height)
      ctx.drawImage(img, dest.dx, dest.dy, dest.dw, dest.dh)
      resolve(true)
    }
    img.onerror = () => resolve(false)
    img.src = src
  })
}

export async function mountHeroAscii(
  host: HTMLElement,
  opts: HeroAsciiMountOpts,
  paintCanvas?: HTMLCanvasElement | null,
): Promise<() => void> {
  const ownsPaintCanvas = !paintCanvas
  const displayCanvas = paintCanvas ?? document.createElement("canvas")
  if (ownsPaintCanvas) {
    displayCanvas.className = "hero-ascii-display"
    displayCanvas.setAttribute("aria-hidden", "true")
    host.appendChild(displayCanvas)
  }
  if (opts.poster) {
    await blitHeroPoster(displayCanvas, opts.poster)
  }
  await yieldToMain()
  const {
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
  } = await import("three")
  await yieldToMain()

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
  if (opts.poster) video.preload = "metadata"
  host.appendChild(video)

  let usedFallback = false
  const onVideoError = () => {
    if (usedFallback) return
    usedFallback = true
    fillSources(video, opts.fallbackWebm, opts.fallbackMp4)
    tryPlay(video)
  }
  video.addEventListener("error", onVideoError)

  let renderer: InstanceType<typeof WebGLRenderer>
  try {
    renderer = new WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    })
  } catch {
    video.pause()
    video.remove()
    signalHeroBootReady()
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
  const cellGlyphIdx = new Uint8Array(MAX_CELLS)
  const cellAlpha = new Float32Array(MAX_CELLS)
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

  const displayCtx =
    displayCanvas.getContext("2d", { alpha: true, desynchronized: true }) ??
    displayCanvas.getContext("2d", { alpha: true }) ??
    displayCanvas.getContext("2d")

  let mouseX = 0
  let mouseY = 0
  let zoom: number = VIDEO_ZOOM.default
  let lastPointerAt = 0
  let dragZoom = false
  let lastDragY = 0
  let raf = 0
  let alive = true
  let lastSampleAt = 0
  let lastVideoTime = Number.NaN
  let pausedForModal = false
  let cellW = 1
  let cellH = 1
  let glyphBits: Uint8ClampedArray[] = []
  let glyphAtlasW = 1
  let glyphAtlasH = 1
  let displayPixels = new Uint8ClampedArray(4)
  let displayImage = new ImageData(displayPixels, 1, 1)
  let glPixels = new Uint8Array(4)
  let stampCursor = -1
  let stampMinGX = 0
  let stampMinGY = 0
  let stampMaxGX = 0
  let stampMaxGY = 0
  let appliedZoom = Number.NaN
  let appliedMouseX = Number.NaN
  let appliedMouseY = Number.NaN
  let lastRasterMs = 0
  let rastersCompleted = 0
  let rasterBusy = false
  let skipNextSample = false
  const mountedAt = performance.now()

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

    const { cols, rows } = pickGrid(width, height, cellBudget(width, isPointerCoarse()))
    renderer.setPixelRatio(1)
    renderer.setSize(cols, rows)
    asciiSample.width = cols
    asciiSample.height = rows
    displayCanvas.width = width
    displayCanvas.height = height
    cellW = width / cols
    cellH = height / rows
    if (displayCtx) {
      if (rastersCompleted > 0) {
        displayCtx.clearRect(0, 0, width, height)
      }
      displayCtx.font = `${Math.ceil(cellH)}px courier new, monospace`
      displayCtx.textBaseline = "top"
      displayCtx.textAlign = "left"
      glyphAtlasW = Math.max(1, Math.ceil(cellW))
      glyphAtlasH = Math.max(1, Math.ceil(cellH))
      const atlas = document.createElement("canvas")
      atlas.width = glyphAtlasW * CHARSET.length
      atlas.height = glyphAtlasH
      const atlasCtx = atlas.getContext("2d", { willReadFrequently: true })
      glyphBits = []
      if (atlasCtx) {
        atlasCtx.font = displayCtx.font
        atlasCtx.textBaseline = "top"
        atlasCtx.textAlign = "left"
        atlasCtx.fillStyle = "#fff"
        for (let i = 0; i < CHARSET.length; i++) {
          const glyph = CHARSET[i]
          if (glyph) atlasCtx.fillText(glyph, i * glyphAtlasW, 0)
          glyphBits.push(
            atlasCtx.getImageData(i * glyphAtlasW, 0, glyphAtlasW, glyphAtlasH).data,
          )
        }
      }
      displayPixels = new Uint8ClampedArray(width * height * 4)
      displayImage = new ImageData(displayPixels, width, height)
      glPixels = new Uint8Array(cols * rows * 4)
      stampCursor = -1
    }
  }

  const applyCamera = () => {
    const hovering = (() => {
      const root = document.querySelector("[data-hero-root]")
      if (performance.now() - lastPointerAt < 800) return true
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

  const prepareCellGlyphs = (data: Uint8Array | Uint8ClampedArray, flipY: boolean) => {
    const cols = asciiSample.width
    const rows = asciiSample.height
    const cellCount = Math.min(cols * rows, MAX_CELLS)
    const refine = shouldRefineOccupancy(performance.now(), mountedAt)

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        if (i >= cellCount) continue
        const p = rgbaOffset(x, y, cols, rows, flipY)
        const luma = (0.3 * data[p] + 0.59 * data[p + 1] + 0.11 * data[p + 2]) / 255
        cellLuma[i] = luma
        cellOccupied[i] = luma < PAPER_LUMA ? 0 : 1
        cellGlyphIdx[i] = 0
        cellAlpha[i] = 0
      }
    }

    const occupiedAt = (nx: number, ny: number): number => {
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) return 0
      const ni = ny * cols + nx
      if (ni >= cellCount) return 0
      return cellOccupied[ni]
    }

    let occupiedN = 0
    if (refine) {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * cols + x
          if (i >= cellCount || cellOccupied[i] === 0) continue
          const n =
            occupiedAt(x - 1, y) +
            occupiedAt(x + 1, y) +
            occupiedAt(x, y - 1) +
            occupiedAt(x, y + 1)
          occupiedLumaScratch[i] = n < OCCUPANCY_MIN_NEIGHBORS ? 1 : 0
        }
      }
      for (let i = 0; i < cellCount; i++) {
        if (cellOccupied[i] !== 0 && occupiedLumaScratch[i] === 1) cellOccupied[i] = 0
        if (cellOccupied[i] !== 0) occupiedLumaScratch[occupiedN++] = cellLuma[i]
      }
    } else {
      for (let i = 0; i < cellCount; i++) {
        if (cellOccupied[i] !== 0) occupiedLumaScratch[occupiedN++] = cellLuma[i]
      }
    }

    let p10 = 0
    let p90 = 1
    let skipStretch = !refine || occupiedN < 2
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

    stampMinGX = cols
    stampMinGY = rows
    stampMaxGX = 0
    stampMaxGY = 0

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = y * cols + x
        if (i >= cellCount || cellOccupied[i] === 0) continue

        const luma = cellLuma[i]
        const stretched = skipStretch ? luma : clamp((luma - p10) / stretchRange, 0, 1)
        const contrasted = contrast01(stretched, LUMA_CONTRAST)
        const alpha = OPACITY_FLOOR + contrasted * (1 - OPACITY_FLOOR)
        const baseIdx = clamp(
          OCCUPIED_IDX_MIN + Math.round((1 - contrasted) * OCCUPIED_IDX_SPAN),
          OCCUPIED_IDX_MIN,
          CHARSET_LAST,
        )
        const maxDelta = refine
          ? Math.max(
              Math.abs(luma - neighborLuma(x - 1, y)),
              Math.abs(luma - neighborLuma(x + 1, y)),
              Math.abs(luma - neighborLuma(x, y - 1)),
              Math.abs(luma - neighborLuma(x, y + 1)),
            )
          : 0
        const rimStep =
          maxDelta >= RIM_LUMA_DELTA * 2 ? 2 : maxDelta >= RIM_LUMA_DELTA ? 1 : 0
        const idx = Math.min(CHARSET_LAST, baseIdx + rimStep)
        const glyph = CHARSET[idx]
        if (glyph === undefined || glyph === " ") continue
        cellGlyphIdx[i] = idx
        cellAlpha[i] = alpha
        if (x < stampMinGX) stampMinGX = x
        if (y < stampMinGY) stampMinGY = y
        if (x > stampMaxGX) stampMaxGX = x
        if (y > stampMaxGY) stampMaxGY = y
      }
    }
  }

  const stampRow = (y: number) => {
    const cols = asciiSample.width
    const cssW = displayCanvas.width
    const cssH = displayCanvas.height
    const cellCount = Math.min(cols * asciiSample.height, MAX_CELLS)
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x
      if (i >= cellCount) continue
      const idx = cellGlyphIdx[i]
      if (idx === 0) continue
      const bits = glyphBits[idx]
      if (!bits) continue
      const rect = cellDestRect(x, y, cellW, cellH, cssW, cssH)
      stampGlyphAlpha(
        displayPixels,
        cssW,
        cssH,
        bits,
        glyphAtlasW,
        glyphAtlasH,
        rect.dx,
        rect.dy,
        rect.dw,
        rect.dh,
        cellAlpha[i],
      )
    }
  }

  const finishStamp = () => {
    if (stampMaxGX >= stampMinGX && stampMaxGY >= stampMinGY) {
      displayCanvas.dataset.glassBox = `${stampMinGX * cellW},${stampMinGY * cellH},${(stampMaxGX - stampMinGX + 1) * cellW},${(stampMaxGY - stampMinGY + 1) * cellH}`
    }
    displayCanvas.dataset.glassGen = String((Number(displayCanvas.dataset.glassGen) || 0) + 1)
    const firstPaint = displayCanvas.dataset.asciiPaint !== "1"
    displayCanvas.dataset.asciiPaint = "1"
    if (firstPaint) signalHeroBootReady()
    stampCursor = -1
    rastersCompleted += 1
    rasterBusy = false
  }

  const stampSlice = () => {
    if (!alive) {
      rasterBusy = false
      stampCursor = -1
      return
    }
    const rows = asciiSample.height
    if (!shouldContinueStamp(stampCursor, rows)) {
      finishStamp()
      return
    }
    const started = performance.now()
    let y = stampCursor
    let end = stampSliceEnd(y, rows, started, started)
    while (y < end) {
      stampRow(y)
      y += 1
      end = stampSliceEnd(stampCursor, rows, started, performance.now())
    }
    stampCursor = y
    lastRasterMs = performance.now() - started
    skipNextSample = shouldSkipSample(lastRasterMs)
    if (displayCtx) displayCtx.putImageData(displayImage, 0, 0)
    if (shouldContinueStamp(stampCursor, rows)) {
      rasterBusy = true
      return
    }
    finishStamp()
  }

  const runRasterPass = () => {
    const t = video.currentTime
    if (t !== lastVideoTime) {
      lastVideoTime = t
      sampleLuminance()
      videoTexture.needsUpdate = true
    }
    applyCameraIfNeeded()
    renderer.render(scene, camera)
    const cols = asciiSample.width
    const rows = asciiSample.height
    const need = cols * rows * 4
    if (glPixels.length < need) glPixels = new Uint8Array(need)
    let flipY = true
    try {
      const gl = renderer.getContext()
      if (!gl || cols <= 0 || rows <= 0) throw new Error("no-gl")
      gl.readPixels(0, 0, cols, rows, gl.RGBA, gl.UNSIGNED_BYTE, glPixels)
    } catch {
      if (!asciiCtx) return
      asciiCtx.drawImage(renderer.domElement, 0, 0)
      glPixels.set(asciiCtx.getImageData(0, 0, cols, rows).data)
      flipY = false
    }
    prepareCellGlyphs(glPixels, flipY)
    displayPixels.fill(0)
    stampCursor = 0
    stampSlice()
  }

  const onMouseMove = (event: MouseEvent) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2
    lastPointerAt = performance.now()
  }

  const onPointerMove = (event: PointerEvent) => {
    mouseX = (event.clientX / window.innerWidth - 0.5) * 2
    mouseY = (event.clientY / window.innerHeight - 0.5) * 2
    lastPointerAt = performance.now()
    if (dragZoom) {
      zoom = clamp(
        zoom + (event.clientY - lastDragY) * VIDEO_ZOOM.wheelStep * 3,
        VIDEO_ZOOM.min,
        VIDEO_ZOOM.max,
      )
      lastDragY = event.clientY
    }
  }

  const onPointerDown = (event: PointerEvent) => {
    const target = event.target
    const onControl =
      target instanceof Element && Boolean(target.closest("a,button,input,textarea,[role='dialog']"))
    dragZoom = event.pointerType !== "mouse" && !onControl
    lastDragY = event.clientY
    lastPointerAt = performance.now()
  }

  const onPointerUp = () => {
    dragZoom = false
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

  const cameraDirty = () =>
    zoom !== appliedZoom || mouseX !== appliedMouseX || mouseY !== appliedMouseY

  const applyCameraIfNeeded = () => {
    if (!cameraDirty()) return
    applyCamera()
    appliedZoom = zoom
    appliedMouseX = mouseX
    appliedMouseY = mouseY
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

    if (shouldContinueStamp(stampCursor, asciiSample.height)) {
      stampSlice()
      return
    }

    const plan = planAsciiFrame({
      now,
      lastSampleAt,
      cameraDirty: cameraDirty(),
      sampleMs: sampleMsForLoop(now, mountedAt, rastersCompleted),
    })
    if (plan === "idle") return
    if (plan === "camera") {
      applyCameraIfNeeded()
      return
    }
    if (rasterBusy) return

    lastSampleAt = now
    if (skipNextSample) {
      skipNextSample = false
      applyCameraIfNeeded()
      return
    }

    const beginPass = () => {
      try {
        if (!alive) {
          stampCursor = -1
          return
        }
        runRasterPass()
      } catch {
        stampCursor = -1
      } finally {
        if (!shouldContinueStamp(stampCursor, asciiSample.height)) rasterBusy = false
      }
    }

    if (shouldYieldToMain(rastersCompleted, lastRasterMs)) {
      const yielded = yieldToMain()
      if (yielded) {
        rasterBusy = true
        void yielded.then(beginPass)
        return
      }
    }

    beginPass()
  }

  const videoReady = () => video.readyState >= 2

  const startLoop = () => {
    if (
      !shouldStartLoop({
        alive,
        raf,
        hidden: document.hidden,
        videoReady: videoReady(),
      })
    ) {
      return
    }
    raf = requestAnimationFrame(tick)
  }

  const onVideoReady = () => {
    tryPlay(video)
    startLoop()
  }

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf)
      raf = 0
      video.pause()
      return
    }
    tryPlay(video)
    startLoop()
  }

  applySize()
  window.addEventListener("mousemove", onMouseMove)
  window.addEventListener("pointermove", onPointerMove, { passive: true })
  window.addEventListener("pointerdown", onPointerDown, { passive: true })
  window.addEventListener("pointerup", onPointerUp, { passive: true })
  window.addEventListener("pointercancel", onPointerUp, { passive: true })
  window.addEventListener("wheel", onWheel, { passive: false })
  window.addEventListener("resize", applySize)
  document.addEventListener("visibilitychange", onVisibility)
  video.addEventListener("loadeddata", onVideoReady)
  video.addEventListener("canplay", onVideoReady)
  if (videoReady()) onVideoReady()
  else {
    tryPlay(video)
    if (document.hidden) video.pause()
  }

  return () => {
    alive = false
    cancelAnimationFrame(raf)
    window.removeEventListener("mousemove", onMouseMove)
    window.removeEventListener("pointermove", onPointerMove)
    window.removeEventListener("pointerdown", onPointerDown)
    window.removeEventListener("pointerup", onPointerUp)
    window.removeEventListener("pointercancel", onPointerUp)
    window.removeEventListener("wheel", onWheel)
    window.removeEventListener("resize", applySize)
    document.removeEventListener("visibilitychange", onVisibility)
    video.removeEventListener("error", onVideoError)
    video.removeEventListener("loadeddata", onVideoReady)
    video.removeEventListener("canplay", onVideoReady)
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
