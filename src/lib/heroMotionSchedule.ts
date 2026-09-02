import { isHeroBootReady, BOOT_READY_EVENT } from "./bootLoader"

export const HERO_MOTION_IDLE_TIMEOUT_MS = 2_000

export type HeroMotionScheduleHost = {
  requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number
  cancelIdleCallback?: (id: number) => void
  setTimeout: (handler: () => void, timeout?: number) => number
  clearTimeout: (id: number) => void
  addEventListener: (type: string, listener: () => void) => void
  removeEventListener: (type: string, listener: () => void) => void
  document?: { querySelector: (selector: string) => unknown }
}

export function scheduleHeroMotionChrome(
  arm: () => void,
  host: HeroMotionScheduleHost = globalThis as unknown as HeroMotionScheduleHost,
): () => void {
  let done = false
  let idleId = 0
  let timeoutId = 0
  const stop = () => {
    host.removeEventListener(BOOT_READY_EVENT, run)
    if (idleId) host.cancelIdleCallback?.(idleId)
    if (timeoutId) host.clearTimeout(timeoutId)
  }
  const run = () => {
    if (done) return
    done = true
    stop()
    arm()
  }
  const root = host.document ?? (typeof document === "undefined" ? undefined : document)
  if (root && isHeroBootReady(root)) {
    run()
    return () => {
      done = true
    }
  }
  host.addEventListener(BOOT_READY_EVENT, run)
  if (typeof host.requestIdleCallback === "function") {
    idleId = host.requestIdleCallback(run, { timeout: HERO_MOTION_IDLE_TIMEOUT_MS })
  } else {
    timeoutId = host.setTimeout(run, HERO_MOTION_IDLE_TIMEOUT_MS)
  }
  return () => {
    done = true
    stop()
  }
}
