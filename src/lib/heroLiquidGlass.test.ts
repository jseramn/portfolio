import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { behindRect } from "../components/GlassSurface"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const src = join(root, "src")

function read(rel: string): string {
  return readFileSync(join(src, rel), "utf8")
}

function presetBlock(glass: string, name: string): string {
  const match = glass.match(new RegExp(`\\b${name}: \\{[\\s\\S]*?\\n  \\},`))
  expect(match, `missing preset ${name}`).toBeTruthy()
  if (!match) throw new Error(`missing preset ${name}`)
  return match[0]
}

function expectCardOptics(block: string) {
  expect(block).toContain('borderRadius: "15px"')
  expect(block).toContain("cornerRadius: 15")
  expect(block).toContain("elasticity: 0.75")
  expect(block).toContain("displacementScale: 88")
  expect(block).toContain("blurAmount: 0,")
  expect(block).toContain("saturation: 100")
  expect(block).toContain("aberrationIntensity: 3")
}

function expectButtonOptics(block: string) {
  expect(block).toContain("elasticity: 0.05")
  expect(block).toContain("displacementScale: 0,")
  expect(block).toContain("blurAmount: 0.1")
  expect(block).toContain("saturation: 100")
  expect(block).toContain("aberrationIntensity: 20")
}

describe("hero liquid-glass chrome wiring", () => {
  it("mounts exactly six panes with locked presets and no shader mode", () => {
    const hero = read("components/Hero.tsx")
    const modal = read("components/ContactModal.tsx")
    const glass = read("components/GlassSurface.tsx")

    expect(hero.match(/<GlassSurface /g)?.length).toBe(5)
    expect(modal.match(/<GlassSurface /g)?.length).toBe(1)
    for (const preset of ["bar", "pill", "dock", "button", "card"] as const) {
      expect(hero).toContain(`preset="${preset}"`)
    }
    expect(modal).toContain('preset="modal"')
    expect(glass).toContain('mode="standard"')
    expect(glass).not.toContain('mode="shader"')
    expect(glass).toContain("displacementScale={cfg.displacementScale}")
    expect(hero).not.toContain('mode="shader"')
  })

  it("wraps the marquee bar and hire button, not duplicated slider or loop children", () => {
    const hero = read("components/Hero.tsx")
    const barIdx = hero.indexOf('preset="bar"')
    const sliderIdx = hero.indexOf("<InfiniteSlider")
    const barClose = hero.indexOf("</GlassSurface>", barIdx)
    expect(barIdx).toBeGreaterThan(-1)
    expect(sliderIdx).toBeGreaterThan(barIdx)
    expect(sliderIdx).toBeLessThan(barClose)

    const buttonIdx = hero.indexOf('preset="button"')
    const loopIdx = hero.indexOf("<TextLoop")
    const buttonClose = hero.indexOf("</GlassSurface>", buttonIdx)
    expect(loopIdx).toBeGreaterThan(buttonIdx)
    expect(loopIdx).toBeLessThan(buttonClose)
  })

  it("keeps ContactModal inside the hero root and shares mouseContainer", () => {
    const hero = read("components/Hero.tsx")
    const rootOpen = hero.indexOf("data-hero-root")
    const rootClose = hero.lastIndexOf("</div>")
    const modalIdx = hero.indexOf("<ContactModal")
    const asciiPaint = hero.indexOf("hero-ascii-display")
    expect(rootOpen).toBeGreaterThan(-1)
    expect(modalIdx).toBeGreaterThan(rootOpen)
    expect(modalIdx).toBeLessThan(rootClose)
    expect(asciiPaint).toBeGreaterThan(rootOpen)
    expect(asciiPaint).toBeLessThan(rootClose)
    expect(hero).toContain("z-[1]")
    expect(hero).toContain("mouseContainer={heroRootRef}")
    expect(read("components/ContactModal.tsx")).toContain("mouseContainer={mouseContainer}")
  })

  it("keeps shape unchanged: pads, 999 radii, and no shader", () => {
    const glass = read("components/GlassSurface.tsx")
    expect(presetBlock(glass, "bar")).toContain('padding: "8px 12px"')
    expect(presetBlock(glass, "card")).toContain('padding: "12px 16px"')
    expect(presetBlock(glass, "modal")).toContain('padding: "0"')
    expect(presetBlock(glass, "button")).toContain('padding: "4px 8px"')
    expect(presetBlock(glass, "pill")).toContain('padding: "6px 10px"')
    expect(presetBlock(glass, "dock")).toContain('padding: "8px"')
    expect(presetBlock(glass, "pill")).toContain("cornerRadius: 999")
    expect(presetBlock(glass, "dock")).toContain("cornerRadius: 999")
    expect(presetBlock(glass, "pill")).toContain('borderRadius: "999px"')
    expect(presetBlock(glass, "dock")).toContain('borderRadius: "999px"')
    expect(glass).toContain('mode="standard"')
    expect(glass).not.toContain('mode="shader"')
  })

  it("locks Card family recipes", () => {
    const glass = read("components/GlassSurface.tsx")
    expectCardOptics(presetBlock(glass, "bar"))
    expectCardOptics(presetBlock(glass, "card"))
    expectCardOptics(presetBlock(glass, "modal"))
  })

  it("locks Button family recipes", () => {
    const glass = read("components/GlassSurface.tsx")
    const button = presetBlock(glass, "button")
    const pill = presetBlock(glass, "pill")
    const dock = presetBlock(glass, "dock")
    expectButtonOptics(button)
    expectButtonOptics(pill)
    expectButtonOptics(dock)
    expect(button).toContain('borderRadius: "10px"')
    expect(button).toContain("cornerRadius: 10")
    expect(pill).toContain("cornerRadius: 999")
    expect(dock).toContain("cornerRadius: 999")
  })

  it("uses family-split fallback frost without retinting bone ink or dropping scrims", () => {
    const css = read("styles/globals.css")
    const glass = read("components/GlassSurface.tsx")
    const hero = read("components/Hero.tsx")
    const modal = read("components/ContactModal.tsx")
    expect(css).toContain(".glass-fallback")
    expect(css).toContain(".glass-fallback-card")
    expect(css).toContain(".glass-fallback-button")
    expect(css).toContain(".glass-fallback > canvas.glass-refraction")
    expect(css).toContain("blur(4px) saturate(1)")
    expect(css).toContain("blur(7px) saturate(1)")
    expect(css).toContain(".glass-fallback:has(> canvas.glass-refraction)")
    expect(css).not.toContain("blur(12px) saturate(1.8)")
    expect(glass).toContain('new Set<GlassPreset>(["bar", "card", "modal"])')
    expect(glass).toContain("glass-fallback-card")
    expect(glass).toContain("glass-fallback-button")
    const start = glass.indexOf("const fallback")
    const liveHost = glass.indexOf('data-glass-host=""')
    const fallback = glass.slice(start, liveHost)
    expect(fallback).toContain("glass-refraction")
    expect(fallback).not.toContain("data-glass-host")
    expect(hero).toContain("hero-scrim-top")
    expect(hero).toContain("hero-scrim-bottom")
    expect(hero).toContain("hero-scrim-social")
    expect(hero).toContain("hero-on-video")
    expect(modal).toContain("backdrop-blur-[2px]")
    expect(modal).not.toContain("backdrop-blur-md")
  })

  it("keeps host transform locked", () => {
    const css = read("styles/globals.css")
    const glass = read("components/GlassSurface.tsx")
    const hero = read("components/Hero.tsx")
    expect(css).toContain("[data-glass-host]")
    expect(css).toContain("transform: none !important")
    expect(hero).toContain("is-settling")
    expect(hero).toContain("glassSettling")
    expect(hero).toContain("(1 - t) ** 3")
    expect(glass).toContain("glassSettling")
    expect(css).toContain("mix-blend-mode: screen")
    expect(css).toContain("[data-glass-host] .glass")
    expect(css).toContain("canvas.glass-refraction")
    expect(css).toContain("brightness(2.6)")
    expect(css).toContain("[data-glass-host] svg")
    expect(glass).toContain('className="glass-refraction"')
  })

  it("clones ascii on a shared 12fps pump without CPU blur or getImageData", () => {
    const glass = read("components/GlassSurface.tsx")
    const ascii = read("lib/heroAsciiRuntime.ts")
    const css = read("styles/globals.css")
    expect(glass).toContain("const GLASS_MS = 1000 / 12")
    expect(glass).not.toContain("getImageData")
    expect(glass).not.toContain("ctx.filter")
    expect(ascii).toContain("dataset.glassBox")
    expect(ascii).toContain("dataset.glassGen")
    expect(css).toContain("var(--glass-frost")
    expect(glass).toContain('--glass-frost"')
    expect(glass).toContain('filterEl?.closest("svg")')
    expect(glass).not.toContain('host.querySelector("svg")')
    expect(glass).toContain("asciiReadyForGlass")
    expect(glass).toContain("bindGlassAsciiWait")
    expect(glass).toContain("data-glass-gen")
    expect(glass).toContain("isPointerCoarse")
  })

  it("samples ascii behind each pane instead of a shared portrait box", () => {
    const glass = read("components/GlassSurface.tsx")
    const asciiCss = { left: 0, top: 0, width: 1920, height: 1080 }
    const bar = behindRect(1920, 1080, asciiCss, { left: 0, top: 0, width: 1920, height: 40 })
    const dock = behindRect(1920, 1080, asciiCss, { left: 32, top: 96, width: 226, height: 42 })
    const card = behindRect(1920, 1080, asciiCss, { left: 1400, top: 900, width: 480, height: 80 })
    expect(bar.sy).toBeLessThan(dock.sy)
    expect(dock.sx).toBeLessThan(card.sx)
    expect(bar.sw).toBeCloseTo(1920)
    expect(dock.sw).toBeCloseTo(226)
    expect(card.sh).toBeCloseTo(80)
    const occupied = { left: 700, top: 200, width: 500, height: 600 }
    const dockGlyph = behindRect(
      1920,
      1080,
      asciiCss,
      { left: 32, top: 96, width: 226, height: 42 },
      1,
      occupied,
    )
    const cardGlyph = behindRect(
      1920,
      1080,
      asciiCss,
      { left: 1400, top: 900, width: 480, height: 80 },
      1,
      occupied,
    )
    expect(dockGlyph.sx).toBeGreaterThanOrEqual(occupied.left)
    expect(dockGlyph.sx + dockGlyph.sw).toBeLessThanOrEqual(occupied.left + occupied.width + 0.01)
    expect(cardGlyph.sx).toBeGreaterThan(dockGlyph.sx)
    expect(glass).toContain("function behindRect")
    expect(glass).not.toContain("ascii.width < 800")
    expect(glass).toContain("ascii.dataset.glassGen")
    expect(glass).not.toContain("box.h * 0.32")
    expect(glass).not.toContain("readPortraitBox")
    expect(glass).not.toContain("lensRect(")
  })

  it("locks modal fill and overlay", () => {
    const modal = read("components/ContactModal.tsx")
    expect(modal).toContain("bg-black/25")
    expect(modal).toContain("rounded-[15px]")
    expect(modal).toContain("bg-black/75")
    expect(modal).not.toContain("bg-black/55")
  })

  it("hosts live panes so library centering cannot shift docked chrome", () => {
    const glass = read("components/GlassSurface.tsx")
    const hero = read("components/Hero.tsx")
    expect(glass).toContain('data-glass-host=""')
    expect(glass).toContain("data-glass-preset={preset}")
    expect(glass).toContain("min-w-0 w-full overflow-hidden")
    expect(hero).not.toContain(
      'preset="dock" mouseContainer={heroRootRef} className="flex flex-col',
    )
    expect(hero).toContain('preset="dock"')
    expect(hero).toContain("flex flex-row items-center gap-4 md:gap-5")
    expect(hero).toContain("env(safe-area-inset-top)")
    expect(hero).toContain("env(safe-area-inset-bottom)")
    expect(hero).toContain("self-start")
    expect(hero).toContain("md:contents")
    expect(hero).not.toContain("bottom-[max(11.25rem")
    expect(hero.match(/preset="dock"/g)?.length).toBe(1)
    expect(hero).toContain("pointermove")
    expect(hero).toContain("setPointerCapture")
    expect(hero).toContain("pointerup")
    expect(hero).toContain("box.top - 2000")
    expect(glass).toContain("pointermove")
    expect(glass).toContain("host.style.left")
    expect(read("lib/heroAsciiRuntime.ts")).toContain("pointermove")
    expect(hero).toContain('preset="pill"')
    expect(hero).toContain(
      "font-mono text-xs md:text-sm flex items-center justify-center md:justify-end gap-3 px-4 md:px-0",
    )
  })

  it("does not glaze legal pages or agent homepage copy", () => {
    expect(read("pages/policy.astro")).not.toContain("GlassSurface")
    expect(read("pages/terms.astro")).not.toContain("GlassSurface")
    expect(read("pages/data-deletion.astro")).not.toContain("GlassSurface")
    expect(read("pages/index.astro")).toContain("sr-only")
    expect(read("pages/index.astro")).not.toContain("GlassSurface")
  })

  it("idle-gates the live engine and keeps wrap hosts plus behindRect", () => {
    const glass = read("components/GlassSurface.tsx")
    const hero = read("components/Hero.tsx")
    expect(glass).toContain("requestIdleCallback")
    expect(glass).toContain("timeout: 2000")
    expect(glass).toContain("setUseLiveGlass")
    expect(glass).toContain("isPointerCoarse()")
    expect(glass).toContain("function behindRect")
    expect(hero.match(/<GlassSurface /g)?.length).toBe(5)
    expect(read("components/ContactModal.tsx").match(/<GlassSurface /g)?.length).toBe(1)
  })

  it("pauses the shared pump when the document is hidden or contact is open", () => {
    const glass = read("components/GlassSurface.tsx")
    expect(glass).toContain("document.hidden")
    expect(glass).toContain("[data-contact-modal-open]")
    expect(glass).toContain('[role="dialog"][aria-modal="true"]')
    expect(glass).toContain("cancelAnimationFrame")
    expect(glass).toContain("visibilitychange")
    expect(read("components/ContactModal.tsx")).toContain("data-contact-modal-open")
  })

  it("strips glass debug ingest and debug attributes", () => {
    const glass = read("components/GlassSurface.tsx")
    const ascii = read("lib/heroAsciiRuntime.ts")
    const hero = read("components/Hero.tsx")
    const asciiBg = read("components/HeroAsciiBackground.tsx")
    for (const source of [glass, ascii, hero, asciiBg]) {
      expect(source).not.toContain("127.0.0.1:7586/ingest")
    }
    expect(glass).not.toContain("data-glass-debug")
    expect(glass).not.toContain("data-glass-perf")
    expect(glass).not.toMatch(/\bdbg\(/)
  })
})
