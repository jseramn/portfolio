import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const src = join(root, "src")

function read(rel: string): string {
  return readFileSync(join(src, rel), "utf8")
}

function presetBlock(glass: string, name: string): string {
  const match = glass.match(new RegExp(`\\b${name}: \\{[\\s\\S]*?\\n  \\},`))
  expect(match, `missing preset ${name}`).toBeTruthy()
  return match![0]
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
    expect(hero).not.toContain("mode=\"shader\"")
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
    expect(css).toContain("blur(4px) saturate(1)")
    expect(css).toContain("blur(7px) saturate(1)")
    expect(css).not.toContain("blur(12px) saturate(1.8)")
    expect(glass).toContain('new Set<GlassPreset>(["bar", "card", "modal"])')
    expect(glass).toContain("glass-fallback-card")
    expect(glass).toContain("glass-fallback-button")
    const fallback = glass.slice(glass.indexOf("const fallback"), glass.indexOf("if (!useLiveGlass)"))
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
    expect(css).toContain("[data-glass-host]")
    expect(css).toContain("transform: none !important")
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
    expect(hero).toContain("flex flex-col items-center gap-4 md:flex-row md:gap-5")
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
})
