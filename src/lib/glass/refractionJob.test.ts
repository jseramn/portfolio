import { createElement, createRef, type RefObject } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { GlassSurface } from "../../components/GlassSurface"

const registerGlassJob = vi.fn<(job: () => void) => () => void>(() => vi.fn())

vi.mock("./pump", () => ({
  registerGlassJob: (job: () => void) => registerGlassJob(job),
  getPumpAscii: () => ({ canvas: null, rect: null }),
}))

describe("attachGlassRefraction live vs fallback", () => {
  beforeEach(() => {
    registerGlassJob.mockClear()
    vi.stubGlobal(
      "requestAnimationFrame",
      vi.fn(() => 1),
    )
    vi.stubGlobal("cancelAnimationFrame", vi.fn())
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect() {}
      },
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.resetModules()
  })

  it("does not register a paint job when live glass is off", async () => {
    const { attachGlassRefraction } = await import("./refractionJob")
    const host = {
      style: { setProperty: vi.fn() },
      querySelector: () => null,
    } as unknown as HTMLElement
    const dest = {
      width: 0,
      height: 0,
      getContext: () => null,
    } as unknown as HTMLCanvasElement
    const stop = attachGlassRefraction(host, dest, 4, false)
    expect(registerGlassJob).not.toHaveBeenCalled()
    stop()
  })

  it("registers a paint job when live glass is on", async () => {
    const { attachGlassRefraction } = await import("./refractionJob")
    const host = {
      style: { setProperty: vi.fn() },
      querySelector: () => null,
      getBoundingClientRect: () => ({ width: 10, height: 10, left: 0, top: 0 }),
    } as unknown as HTMLElement
    const dest = {
      width: 0,
      height: 0,
      getContext: () => null,
    } as unknown as HTMLCanvasElement
    const stop = attachGlassRefraction(host, dest, 4, true)
    expect(registerGlassJob).toHaveBeenCalledTimes(1)
    stop()
  })

  it("renders frost fallback without a refraction canvas", () => {
    const mouseContainer = createRef<HTMLDivElement>() as RefObject<HTMLDivElement | null>
    const html = renderToStaticMarkup(
      createElement(
        GlassSurface,
        { preset: "bar", mouseContainer } as never,
        createElement("span", null, "pane"),
      ),
    )
    expect(html).toContain("glass-fallback")
    expect(html).not.toContain("glass-refraction")
    expect(html).toContain("pane")
  })
})
