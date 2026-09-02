import { isPointerCoarse } from "./pointer"
import { chromiumRuntimeHint, shouldUseLiquidGlass } from "./shouldUseLiquidGlass"

export const ASCII_FPS = 12

export type CapabilityEnv = {
  userAgent: string
  matchMedia?: typeof globalThis.matchMedia
  chromeObject: boolean
  brands: readonly string[]
  webglProbe?: () => boolean
}

export type Capabilities = {
  userAgent: string
  pointerCoarse: boolean
  reducedMotion: boolean
  webgl: boolean
  chromiumRuntime: boolean
  liveGlass: boolean
}

const SSR: Capabilities = {
  userAgent: "",
  pointerCoarse: false,
  reducedMotion: false,
  webgl: false,
  chromiumRuntime: false,
  liveGlass: false,
}

let cached: Omit<Capabilities, "webgl"> | undefined
let webglMemo: boolean | undefined

function matches(mq: typeof globalThis.matchMedia | undefined, query: string): boolean {
  if (typeof mq !== "function") return false
  try {
    return Boolean(mq.call(globalThis, query).matches)
  } catch {
    return false
  }
}

export function probeWebGL(probe?: () => boolean): boolean {
  if (webglMemo !== undefined) return webglMemo
  if (probe) {
    webglMemo = probe()
    return webglMemo
  }
  if (typeof document === "undefined") {
    webglMemo = false
    return webglMemo
  }
  try {
    const canvas = document.createElement("canvas")
    webglMemo = Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"))
  } catch {
    webglMemo = false
  }
  return webglMemo
}

export function detectCapabilities(env: CapabilityEnv): Capabilities {
  const pointerCoarse = isPointerCoarse(env.matchMedia)
  const reducedMotion = matches(env.matchMedia, "(prefers-reduced-motion: reduce)")
  const chromiumRuntime = chromiumRuntimeHint(env.userAgent, env.chromeObject, env.brands)
  return {
    userAgent: env.userAgent,
    pointerCoarse,
    reducedMotion,
    chromiumRuntime,
    liveGlass: shouldUseLiquidGlass(env.userAgent, reducedMotion, chromiumRuntime, pointerCoarse),
    webgl: env.webglProbe ? env.webglProbe() : false,
  }
}

export function getCapabilities(): Capabilities {
  if (typeof window === "undefined") return SSR
  if (!cached) {
    const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }
    const detected = detectCapabilities({
      userAgent: navigator.userAgent,
      matchMedia:
        typeof window.matchMedia === "function" ? window.matchMedia.bind(window) : undefined,
      chromeObject: Boolean((window as Window & { chrome?: unknown }).chrome),
      brands: nav.userAgentData?.brands?.map((item) => item.brand) ?? [],
    })
    const { webgl, ...base } = detected
    void webgl
    cached = base
  }
  return Object.defineProperty({ ...cached }, "webgl", {
    enumerable: true,
    get: () => probeWebGL(),
  }) as Capabilities
}

export function resetCapabilitiesCache(): void {
  cached = undefined
  webglMemo = undefined
}
