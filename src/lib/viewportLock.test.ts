import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")

describe("homepage viewport lock", () => {
  it("uses dynamic viewport height on the hero, not 100vh h-screen", () => {
    const hero = readFileSync(join(root, "src/components/Hero.tsx"), "utf8")
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
    expect(home).toContain('<main class="contents">')
    expect(home.indexOf("<main")).toBeLessThan(home.indexOf("<h1>"))
    expect(home.indexOf("</main>")).toBeGreaterThan(home.indexOf("<Hero client:load"))

    const about = readFileSync(join(root, "src/pages/about.astro"), "utf8")
    expect(about).not.toContain("lockScroll")

    const legal = readFileSync(join(root, "src/components/LegalDocument.astro"), "utf8")
    expect(legal).not.toContain("lockScroll")
  })

  it("clips horizontal overflow and falls back to dvh on the hero root", () => {
    const css = readFileSync(join(root, "src/styles/globals.css"), "utf8")
    expect(css).toContain("overflow-x: clip")
    expect(css).toContain("[data-hero-root]")
    expect(css).toContain("height: 100dvh")
    expect(css).toContain("max-height: 100dvh")
  })

  it("gates four-corner HUD on width and height, not width alone", () => {
    const hero = readFileSync(join(root, "src/components/Hero.tsx"), "utf8")
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
})
