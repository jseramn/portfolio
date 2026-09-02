import type {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  Scene,
  VideoTexture,
  WebGLRenderer,
} from "three"

export type HeroAsciiMountOpts = {
  samplerWebm: string
  samplerMp4: string
}

export type HeroAsciiSession = {
  host: HTMLElement
  ownsPaintCanvas: boolean
  displayCanvas: HTMLCanvasElement
  displayCtx: CanvasRenderingContext2D | null
  video: HTMLVideoElement
  renderer: WebGLRenderer
  scene: Scene
  camera: PerspectiveCamera
  videoTexture: VideoTexture
  plane: Mesh<PlaneGeometry, MeshBasicMaterial>
  points: Points<BufferGeometry, PointsMaterial>
  pointsGeometry: BufferGeometry
  positions: Float32Array
  colors: Float32Array
  sample: HTMLCanvasElement
  sampleCtx: CanvasRenderingContext2D | null
  asciiSample: HTMLCanvasElement
  asciiCtx: CanvasRenderingContext2D | null
  cellLuma: Float32Array
  cellOccupied: Uint8Array
  occupiedLumaScratch: Float32Array
  cellGlyphIdx: Uint8Array
  cellAlpha: Float32Array
  glyphBits: Uint8ClampedArray[]
  glyphAtlasW: number
  glyphAtlasH: number
  displayPixels: Uint8ClampedArray<ArrayBuffer>
  displayImage: ImageData
  glPixels: Uint8Array
  glFlipY: boolean
  cellW: number
  cellH: number
  mouseX: number
  mouseY: number
  zoom: number
  lastPointerAt: number
  dragZoom: boolean
  lastDragY: number
  raf: number
  alive: boolean
  lastSampleAt: number
  lastVideoTime: number
  pausedForModal: boolean
  stampCursor: number
  stampMinGX: number
  stampMinGY: number
  stampMaxGX: number
  stampMaxGY: number
  appliedZoom: number
  appliedMouseX: number
  appliedMouseY: number
  lastRasterMs: number
  rastersCompleted: number
  rasterBusy: boolean
  skipNextSample: boolean
  mountedAt: number
  samplerFailed: boolean
}
