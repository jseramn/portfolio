import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { ASCII_FPS } from "../capabilities"
import {
  CONTACT_MODAL_OPEN_SELECTOR,
  HERO_ASCII_CANVAS_SELECTOR,
  HERO_ROOT_SELECTOR,
} from "../domSignals"

const GLASS_MS = 1000 / ASCII_FPS

type RafCb = (now: number) => void

function makeAscii(ready = true) {
  return {
    width: ready ? 8 : 0,
    height: ready ? 8 : 0,
    dataset: ready ? { glassGen: "1" } : {},
    getBoundingClientRect: () => ({
      left: 0,
      top: 0,
      width: 8,
      height: 8,
      right: 8,
      bottom: 8,
      x: 0,
      y: 0,
      toJSON() {
        return {}
      },
    }),
  }
}

async function loadPump() {
  vi.resetModules()
  return import("./pump")
}

describe("registerGlassJob", () => {
  let rafQueue: { id: number; cb: RafCb }[]
  let nextId: number
  let now: number
  let hidden: boolean
  let nodes: Record<string, unknown>
  let visListeners: Set<() => void>
  let observers: { cb: () => void; disconnect: ReturnType<typeof vi.fn> }[]

  function flush(dt = GLASS_MS) {
    now += dt
    const batch = rafQueue.splice(0)
    for (const frame of batch) frame.cb(now)
  }

  beforeEach(() => {
    rafQueue = []
    nextId = 1
    now = 0
    hidden = false
    visListeners = new Set()
    observers = []
    nodes = {
      [HERO_ROOT_SELECTOR]: { id: "hero" },
      [HERO_ASCII_CANVAS_SELECTOR]: makeAscii(true),
    }

    vi.stubGlobal("requestAnimationFrame", (cb: RafCb) => {
      const id = nextId++
      rafQueue.push({ id, cb })
      return id
    })
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      rafQueue = rafQueue.filter((frame) => frame.id !== id)
    })
    vi.stubGlobal(
      "MutationObserver",
      class {
        cb: () => void
        disconnect: ReturnType<typeof vi.fn>
        constructor(cb: () => void) {
          this.cb = cb
          this.disconnect = vi.fn()
          observers.push(this)
        }
        observe() {}
      },
    )

    const document = {
      get hidden() {
        return hidden
      },
      querySelector(selector: string) {
        return nodes[selector] ?? null
      },
      addEventListener(type: string, listener: () => void) {
        if (type === "visibilitychange") visListeners.add(listener)
      },
      removeEventListener(_type: string, listener: () => void) {
        visListeners.delete(listener)
      },
      documentElement: { id: "html" },
    }
    vi.stubGlobal("document", document)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("runs registered jobs on the shared rAF pump once ASCII is ready", async () => {
    const { registerGlassJob, getPumpAscii } = await loadPump()
    const job = vi.fn()
    const unregister = registerGlassJob(job)

    expect(rafQueue).toHaveLength(1)
    flush()
    expect(job).toHaveBeenCalledTimes(1)
    expect(getPumpAscii().canvas).toBe(nodes[HERO_ASCII_CANVAS_SELECTOR])
    expect(getPumpAscii().rect).toEqual(expect.objectContaining({ width: 8, height: 8 }))

    unregister()
  })

  it("throttles to ASCII_FPS so a short frame does not run jobs", async () => {
    const { registerGlassJob } = await loadPump()
    const job = vi.fn()
    const unregister = registerGlassJob(job)

    flush(GLASS_MS)
    expect(job).toHaveBeenCalledTimes(1)
    flush(1)
    expect(job).toHaveBeenCalledTimes(1)
    flush(GLASS_MS)
    expect(job).toHaveBeenCalledTimes(2)

    unregister()
  })

  it("shares one rAF loop across jobs and stops after the last unregister", async () => {
    const { registerGlassJob } = await loadPump()
    const a = vi.fn()
    const b = vi.fn()
    const stopA = registerGlassJob(a)
    const stopB = registerGlassJob(b)

    expect(rafQueue).toHaveLength(1)
    flush()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)

    stopA()
    flush()
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(2)

    stopB()
    expect(rafQueue).toHaveLength(0)
    const queued = rafQueue.length
    flush()
    expect(rafQueue).toHaveLength(queued)
    expect(b).toHaveBeenCalledTimes(2)
  })

  it("waits for ASCII readiness then starts after the observer fires", async () => {
    nodes[HERO_ASCII_CANVAS_SELECTOR] = makeAscii(false)
    const { registerGlassJob } = await loadPump()
    const job = vi.fn()
    const unregister = registerGlassJob(job)

    expect(rafQueue).toHaveLength(0)
    expect(observers).toHaveLength(1)
    flush()
    expect(job).not.toHaveBeenCalled()

    nodes[HERO_ASCII_CANVAS_SELECTOR] = makeAscii(true)
    observers[0]?.cb()
    expect(rafQueue).toHaveLength(1)
    flush()
    expect(job).toHaveBeenCalledTimes(1)

    unregister()
  })

  it("pauses while the document is hidden and resumes on visibilitychange", async () => {
    hidden = true
    const { registerGlassJob } = await loadPump()
    const job = vi.fn()
    const unregister = registerGlassJob(job)

    expect(rafQueue).toHaveLength(0)
    expect(visListeners.size).toBe(1)
    flush()
    expect(job).not.toHaveBeenCalled()

    hidden = false
    for (const listener of visListeners) listener()
    expect(rafQueue).toHaveLength(1)
    flush()
    expect(job).toHaveBeenCalledTimes(1)

    unregister()
  })

  it("pauses while a contact overlay is open and unbinds resume when idle", async () => {
    nodes[CONTACT_MODAL_OPEN_SELECTOR] = {}
    const { registerGlassJob } = await loadPump()
    const job = vi.fn()
    const unregister = registerGlassJob(job)

    expect(rafQueue).toHaveLength(0)
    expect(visListeners.size).toBe(1)

    delete nodes[CONTACT_MODAL_OPEN_SELECTOR]
    for (const listener of visListeners) listener()
    expect(rafQueue).toHaveLength(1)
    flush()
    expect(job).toHaveBeenCalledTimes(1)

    unregister()
    expect(visListeners.size).toBe(0)
    expect(observers.some((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true)
  })
})
