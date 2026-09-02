import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const src = join(root, "src")

function readHeroIsland(): string {
  const heroDir = join(src, "components/hero")
  const files = existsSync(heroDir)
    ? readdirSync(heroDir)
        .filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes(".test."))
        .sort()
    : []
  return [
    readFileSync(join(root, "src/components/Hero.tsx"), "utf8"),
    ...files.map((name) => readFileSync(join(heroDir, name), "utf8")),
  ].join("\n")
}

describe("homepage viewport lock", () => {
  it("uses dynamic viewport height on the hero, not 100vh h-screen", () => {
    const hero = readHeroIsland()
    expect(hero).toContain("h-dvh")
    expect(hero).toContain("max-h-dvh")
    expect(hero).not.toMatch(/h-screen/)
  })

  it("locks html/body scroll only when Layout lockScroll is set", () => {
    const layout = readFileSync(join(root, "src/layouts/Layout.astro"), "utf8")
    expect(layout).toContain("lockScroll")
    expect(layout).toContain("overflow-hidden")
    expect(layout).toContain("overscroll-none")
    expect(layout).toContain("viewport-fit=cover")

    const home = readFileSync(join(root, "src/pages/index.astro"), "utf8")
    expect(home).toContain("lockScroll")
    expect(home).toContain('id="main"')
    expect(home).toContain("h-dvh")
    expect(home).toContain("max-h-dvh")
    expect(home).toContain("min-h-0")
    expect(home).toContain("overflow-hidden")
    expect(home).not.toContain('class="contents"')
    expect(home.indexOf("<main")).toBeLessThan(home.indexOf("<h1>"))
    expect(home.indexOf("</main>")).toBeGreaterThan(home.indexOf("<Hero client:load"))

    const about = readFileSync(join(root, "src/pages/about.astro"), "utf8")
    expect(about).not.toContain("lockScroll")

    const tinity = readFileSync(join(root, "src/pages/tinity/index.astro"), "utf8")
    expect(tinity).toContain("lockScroll")

    const legal = readFileSync(join(root, "src/components/LegalDocument.astro"), "utf8")
    expect(legal).not.toContain("lockScroll")
  })

  it("clips horizontal overflow and falls back to dvh on the hero root", () => {
    const css = readFileSync(join(root, "src/styles/globals.css"), "utf8")
    expect(css).toContain("overflow-x: clip")
    expect(css).toContain("[data-hero-root]")
    expect(css).toContain("height: 100dvh")
    expect(css).toContain("max-height: 100dvh")
    expect(css).toContain(":focus-visible")
    expect(css).toContain("outline: 2px solid var(--vesper-accent)")
    expect(css).toContain("outline-offset: 2px")
    expect(css).toContain("outline-color: var(--hero-ink)")
    expect(css).toContain(".skip-link")
  })

  it("gates four-corner HUD on width and height, not width alone", () => {
    const hero = readHeroIsland()
    const tw = readFileSync(join(root, "tailwind.config.ts"), "utf8")
    expect(tw).toContain("(min-width: 768px) and (min-height: 700px)")
    expect(tw).toContain("(max-height: 499px)")
    expect(tw).toContain("(min-width: 768px) and (max-height: 699px)")
    expect(hero).toContain("hud:block")
    expect(hero).toContain("hud:contents")
    expect(hero).toContain("md:shrink-0")
    expect(hero).toContain("h-dvh")
    expect(hero).toContain("max-h-dvh")
    expect(hero).toContain("env(safe-area-inset-top)")
    expect(hero).toContain("env(safe-area-inset-bottom)")
    expect(hero).not.toMatch(/overflow-hidden md:block"/)
    for (const region of ["marquee", "now-playing", "socials", "roles", "tagline"]) {
      expect(hero).toContain(`data-hud-region="${region}"`)
    }
  })

  it("keeps the social icon dock on short viewports and fades marquee clip edges", () => {
    const socials = readFileSync(join(src, "components/hero/HeroSocials.tsx"), "utf8")
    expect(socials).toContain("site.socials.map")
    expect(socials).not.toMatch(/short:hidden/)

    const slider = readFileSync(join(src, "components/heroMotionStatic.tsx"), "utf8")
    expect(slider).toContain("data-marquee-fade")
    expect(slider).toContain("MARQUEE_TRACK")

    const live = readFileSync(join(src, "components/InfiniteSlider.tsx"), "utf8")
    expect(live).toContain("data-marquee-fade")
    expect(live).toContain("MARQUEE_TRACK")

    const chrome = readFileSync(join(src, "components/hero/chrome.ts"), "utf8")
    expect(chrome).toContain("marquee-edge-fade")

    const css = readFileSync(join(root, "src/styles/globals.css"), "utf8")
    expect(css).toContain(".marquee-edge-fade")
    expect(css).toMatch(/mask-image/)
  })
})
