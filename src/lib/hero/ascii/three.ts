type ThreeNs = typeof import("three")

export type ThreeModule = Pick<
  ThreeNs,
  | "BufferAttribute"
  | "BufferGeometry"
  | "Mesh"
  | "MeshBasicMaterial"
  | "PerspectiveCamera"
  | "PlaneGeometry"
  | "Points"
  | "PointsMaterial"
  | "Scene"
  | "SRGBColorSpace"
  | "VideoTexture"
  | "WebGLRenderer"
>

export async function loadThree(): Promise<ThreeModule> {
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
  return {
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
  }
}
