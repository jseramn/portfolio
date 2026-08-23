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
})
