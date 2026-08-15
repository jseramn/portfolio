declare module "three/addons/effects/AsciiEffect.js" {
  import type { Camera, Scene, WebGLRenderer } from "three"

  export type AsciiEffectOptions = {
    resolution?: number
    scale?: number
    color?: boolean
    alpha?: boolean
    block?: boolean
    invert?: boolean
    strResolution?: string
  }

  export class AsciiEffect {
    constructor(
      renderer: WebGLRenderer,
      charSet?: string,
      options?: AsciiEffectOptions,
    )
    domElement: HTMLDivElement
    render(scene: Scene, camera: Camera): void
    setSize(width: number, height: number): void
  }
}
