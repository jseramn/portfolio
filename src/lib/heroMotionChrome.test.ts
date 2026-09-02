import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, it, vi } from "vitest"
import { TextLoop } from "../components/TextLoop"
import { InfiniteSliderStatic, TextLoopStatic } from "../components/heroMotionStatic"
import { site } from "../config/site"
import { ASCII_PAINT_SELECTOR } from "./domSignals"
import { scheduleHeroMotionChrome } from "./heroMotionSchedule"

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}))

const roles = site.roles.map((role) => createElement("span", { key: role }, role))

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
    expect(
      renderToStaticMarkup(
        createElement(InfiniteSliderStatic, { gap: 32 }, createElement("span", null, "Hi")),
      ).split("Hi").length,
    ).toBe(3)
  })
})
