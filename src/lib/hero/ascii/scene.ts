import { getHeroRoot } from "../../domSignals"
import type { HeroAsciiSession } from "./session"

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
export const CENTER_THRESHOLD = 0.3
const NEAR = 0.1
const FAR = 100

export type AsciiCamera = {
  aspect: number
  zoom: number
  position: { x: number; y: number; z: number }
}

export function cameraDistance(aspect: number): number {
  const vFov = (FOV * Math.PI) / 180
  const bleed = VIDEO_ZOOM.bleedPercent / 100
  const zFitH = PLANE_H / 2 / Math.tan(vFov / 2)
  const zFitW = PLANE_W / 2 / Math.tan(vFov / 2) / aspect
  return Math.min(zFitH, zFitW) / bleed
}

export function createAsciiCamera(): AsciiCamera {
  return { aspect: 1, zoom: VIDEO_ZOOM.default, position: { x: 0, y: 0, z: cameraDistance(1) } }
}

export function activeSamplerZoom(
  zoom: number,
  mouseX: number,
  mouseY: number,
  hovering: boolean,
): number {
  const inCenter =
    hovering && Math.abs(mouseX) < CENTER_THRESHOLD && Math.abs(mouseY) < CENTER_THRESHOLD
  return inCenter ? Math.min(zoom + VIDEO_ZOOM.centerBonus, VIDEO_ZOOM.max) : zoom
}

export function cameraPanOffset(
  mouseX: number,
  mouseY: number,
  visibleW: number,
  visibleH: number,
  width: number,
  height: number,
): { x: number; y: number } {
  return {
    x: -mouseX * VIDEO_ZOOM.parallaxPx * (visibleW / width),
    y: mouseY * VIDEO_ZOOM.parallaxPx * (visibleH / height),
  }
}

export function visiblePlaneSize(aspect: number, zoom: number, z: number) {
  const visibleH = (2 * Math.tan((FOV * Math.PI) / 180 / 2) * z) / zoom
  return { visibleW: visibleH * aspect, visibleH }
}

function mul4(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] +
        a[4 + r] * b[c * 4 + 1] +
        a[8 + r] * b[c * 4 + 2] +
        a[12 + r] * b[c * 4 + 3]
    }
  }
  return out
}

export function samplerMvp(camera: AsciiCamera): Float32Array {
  const f = camera.zoom / Math.tan((FOV * Math.PI) / 180 / 2)
  const proj = new Float32Array(16)
  proj[0] = f / Math.max(camera.aspect, 1e-6)
  proj[5] = f
  proj[10] = (FAR + NEAR) / (NEAR - FAR)
  proj[11] = -1
  proj[14] = (2 * FAR * NEAR) / (NEAR - FAR)

  const { x: ex, y: ey, z: ez } = camera.position
  let zx = ex
  let zy = ey
  let zz = ez
  const zlen = Math.hypot(zx, zy, zz) || 1
  zx /= zlen
  zy /= zlen
  zz /= zlen
  let xx = zz
  let xy = 0
  let xz = -zx
  const xlen = Math.hypot(xx, xy, xz) || 1
  xx /= xlen
  xy /= xlen
  xz /= xlen
  const yx = zy * xz - zz * xy
  const yy = zz * xx - zx * xz
  const yz = zx * xy - zy * xx
  const view = new Float32Array(16)
  view[0] = xx
  view[1] = yx
  view[2] = zx
  view[4] = xy
  view[5] = yy
  view[6] = zy
  view[8] = xz
  view[9] = yz
  view[10] = zz
  view[12] = -(xx * ex + xy * ey + xz * ez)
  view[13] = -(yx * ex + yy * ey + yz * ez)
  view[14] = -(zx * ex + zy * ey + zz * ez)
  view[15] = 1
  return mul4(proj, view)
}

export function clipFromMvp(m: Float32Array, x: number, y: number, z: number) {
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15]
  return {
    x: (m[0] * x + m[4] * y + m[8] * z + m[12]) / cw,
    y: (m[1] * x + m[5] * y + m[9] * z + m[13]) / cw,
  }
}

export function applyCamera(session: HeroAsciiSession) {
  const hovering = (() => {
    const root = getHeroRoot(document)
    if (performance.now() - session.lastPointerAt < 800) return true
    return root ? root.matches(":hover") : true
  })()
  const activeZoom = activeSamplerZoom(session.zoom, session.mouseX, session.mouseY, hovering)
  session.camera.zoom = activeZoom

  const width = session.host.clientWidth || window.innerWidth
  const height = session.host.clientHeight || window.innerHeight
  const { visibleW, visibleH } = visiblePlaneSize(
    session.camera.aspect,
    activeZoom,
    session.camera.position.z,
  )
  const pan = cameraPanOffset(session.mouseX, session.mouseY, visibleW, visibleH, width, height)
  session.camera.position.x = pan.x
  session.camera.position.y = pan.y
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
  session.sampler.resize(cols, rows)
  session.asciiSample.width = cols
  session.asciiSample.height = rows
  session.displayCanvas.width = width
  session.displayCanvas.height = height
  session.cellW = width / cols
  session.cellH = height / rows
}

export function disposeAsciiScene(session: HeroAsciiSession) {
  session.sampler.dispose()
}
