import { describe, expect, it, vi } from "vitest"
import { observeElementSize, readElementSize } from "./useElementWidth"

function box(width: number, height: number) {
  return {
    getBoundingClientRect: () => ({ width, height }),
  }
}

class FakeObserver {
  static instances: FakeObserver[] = []
  cb: () => void
  observed: unknown[] = []
  disconnected = 0

  constructor(cb: () => void) {
    this.cb = cb
    FakeObserver.instances.push(this)
  }

  observe(target: unknown) {
    this.observed.push(target)
  }

  disconnect() {
    this.disconnected += 1
  }

  fire() {
    this.cb()
  }
}

describe("readElementSize", () => {
  it("reads width and height from getBoundingClientRect", () => {
    expect(readElementSize(box(480, 24))).toEqual({ width: 480, height: 24 })
    expect(readElementSize(box(0, 0))).toEqual({ width: 0, height: 0 })
  })
})

describe("observeElementSize", () => {
  it("reports the initial rect, observes, and disconnects on cleanup", () => {
    FakeObserver.instances = []
    const el = box(240, 12)
    const onSize = vi.fn()
    const stop = observeElementSize(el, onSize, FakeObserver)
    expect(onSize).toHaveBeenCalledTimes(1)
    expect(onSize).toHaveBeenCalledWith({ width: 240, height: 12 })
    expect(FakeObserver.instances).toHaveLength(1)
    expect(FakeObserver.instances[0]?.observed).toEqual([el])
    FakeObserver.instances[0]?.fire()
    expect(onSize).toHaveBeenCalledTimes(2)
    stop()
    expect(FakeObserver.instances[0]?.disconnected).toBe(1)
  })

  it("still reports the initial rect when ResizeObserver is missing", () => {
    const onSize = vi.fn()
    const stop = observeElementSize(box(64, 8), onSize, null)
    expect(onSize).toHaveBeenCalledWith({ width: 64, height: 8 })
    expect(() => stop()).not.toThrow()
  })
})
