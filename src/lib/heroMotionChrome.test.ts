import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, it, vi } from "vitest"
import { TextLoop } from "../components/TextLoop"
import {
  HeroMotionSlider,
  InfiniteSliderStatic,
  TextLoopStatic,
} from "../components/heroMotionStatic"
import { site } from "../config/site"
import { ASCII_PAINT_SELECTOR } from "./domSignals"
import { scheduleHeroMotionChrome } from "./heroMotionSchedule"

const motionPrefs = vi.hoisted(() => ({ reducedMotion: false }))

vi.mock("./capabilities", () => ({
  getCapabilities: () => ({ reducedMotion: motionPrefs.reducedMotion }),
}))

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}))

const roles = site.roles.map((role) => createElement("span", { key: role }, role))

afterEach(() => {
  motionPrefs.reducedMotion = false
})

describe("hero motion static fallbacks", () => {
  it("arms immediately when ASCII has already painted", () => {
    const arm = vi.fn()
    scheduleHeroMotionChrome(arm, {
      document: { querySelector: (s) => (s === ASCII_PAINT_SELECTOR ? {} : null) },
      setTimeout: () => 0,
      clearTimeout: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
    })
    expect(arm).toHaveBeenCalledTimes(1)
  })

  it("SSR markup equals the hydrated TextLoop freeze state and duplicates the marquee", () => {
    expect(renderToStaticMarkup(createElement(TextLoopStatic, null, roles))).toBe(
      renderToStaticMarkup(createElement(TextLoop, null, roles)),
    )
    const pending = renderToStaticMarkup(
      createElement(InfiniteSliderStatic, { gap: 32 }, createElement("span", null, "Hi")),
    )
    expect(pending.split("Hi").length).toBe(3)
    expect(pending).toContain("data-marquee-fade")
    expect(pending).toContain("marquee-edge-fade")
  })

  it("ready+reduced-motion keeps the static ticker box, not InfiniteSlider wrap-freeze", () => {
    motionPrefs.reducedMotion = true
    const child = createElement("span", null, "Hi")
    const pending = renderToStaticMarkup(createElement(InfiniteSliderStatic, { gap: 32 }, child))
    const ready = renderToStaticMarkup(createElement(HeroMotionSlider, { ready: true }, child))
    expect(ready).toContain("data-marquee-static")
    expect(ready).toContain("flex w-max")
    expect(ready).not.toContain("flex-wrap")
    expect(ready).not.toContain("max-w-full")
    expect(ready.split("Hi").length).toBe(3)
    expect(ready.replaceAll("data-marquee-static", "data-marquee-pending")).toBe(pending)
  })
})
