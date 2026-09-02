import { getHeroRoot } from "../../domSignals"
import type { HeroAsciiSession } from "./session"
import type { ThreeModule } from "./three"

export const VIDEO_ZOOM = {
  default: 1.08,
  min: 1.0,
  max: 1.22,
  centerBonus: 0.06,
  wheelStep: 0.0008,
  parallaxPx: 18,
  bleedPercent: 118,
} as const

export const FOV = 50
export const PLANE_W = 16
export const PLANE_H = 9
export const SAMPLE_COLS = 96
export const SAMPLE_ROWS = 54
export const EXTRUDE = 2.4
export const CENTER_THRESHOLD = 0.3

export function cameraDistance(aspect: number): number {
  const vFov = (FOV * Math.PI) / 180
  const bleed = VIDEO_ZOOM.bleedPercent / 100
  const zFitH = PLANE_H / 2 / Math.tan(vFov / 2)
  const zFitW = PLANE_W / 2 / Math.tan(vFov / 2) / aspect
  return Math.min(zFitH, zFitW) / bleed
}

export function createAsciiScene(three: ThreeModule, video: HTMLVideoElement) {
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
  } = three

  let renderer: InstanceType<typeof WebGLRenderer>
  try {
    renderer = new WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    })
  } catch {
    return null
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

  return { renderer, scene, camera, videoTexture, plane, points, pointsGeometry, positions, colors }
}

export function applyCamera(session: HeroAsciiSession) {
  const hovering = (() => {
    const root = getHeroRoot(document)
    if (performance.now() - session.lastPointerAt < 800) return true
    return root ? root.matches(":hover") : true
  })()
  const inCenter =
    hovering &&
    Math.abs(session.mouseX) < CENTER_THRESHOLD &&
    Math.abs(session.mouseY) < CENTER_THRESHOLD
  const activeZoom = inCenter
    ? Math.min(session.zoom + VIDEO_ZOOM.centerBonus, VIDEO_ZOOM.max)
    : session.zoom
  session.camera.zoom = activeZoom
  session.camera.updateProjectionMatrix()

  const width = session.host.clientWidth || window.innerWidth
  const height = session.host.clientHeight || window.innerHeight
  const vFov = (FOV * Math.PI) / 180
  const visibleH = (2 * Math.tan(vFov / 2) * session.camera.position.z) / activeZoom
  const visibleW = visibleH * session.camera.aspect
  session.camera.position.x = -session.mouseX * VIDEO_ZOOM.parallaxPx * (visibleW / width)
  session.camera.position.y = session.mouseY * VIDEO_ZOOM.parallaxPx * (visibleH / height)
  session.camera.lookAt(0, 0, 0)
}

export function cameraDirty(session: HeroAsciiSession): boolean {
  return (
    session.zoom !== session.appliedZoom ||
    session.mouseX !== session.appliedMouseX ||
    session.mouseY !== session.appliedMouseY
  )
}

export function applyCameraIfNeeded(session: HeroAsciiSession) {
  if (!cameraDirty(session)) return
  applyCamera(session)
  session.appliedZoom = session.zoom
  session.appliedMouseX = session.mouseX
  session.appliedMouseY = session.mouseY
}

export function resizeAsciiView(
  session: HeroAsciiSession,
  width: number,
  height: number,
  cols: number,
  rows: number,
) {
  const aspect = width / Math.max(height, 1)
  session.camera.aspect = aspect
  session.camera.position.z = cameraDistance(aspect)
  session.camera.updateProjectionMatrix()
  session.renderer.setPixelRatio(1)
  session.renderer.setSize(cols, rows)
  session.asciiSample.width = cols
  session.asciiSample.height = rows
  session.displayCanvas.width = width
  session.displayCanvas.height = height
  session.cellW = width / cols
  session.cellH = height / rows
}

export function disposeAsciiScene(session: HeroAsciiSession) {
  session.videoTexture.dispose()
  session.plane.geometry.dispose()
  session.plane.material.dispose()
  session.pointsGeometry.dispose()
  session.points.material.dispose()
  session.renderer.dispose()
}
