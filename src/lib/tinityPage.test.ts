import { existsSync, readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const src = join(root, "src")

function readSrc(rel: string): string {
  return readFileSync(join(src, rel), "utf8")
}

function readHeroIsland(): string {
  const heroDir = join(src, "components/hero")
  const files = existsSync(heroDir)
    ? readdirSync(heroDir)
        .filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes(".test."))
        .sort()
    : []
  return [
    readSrc("components/Hero.tsx"),
    ...files.map((name) => readSrc(`components/hero/${name}`)),
  ].join("\n")
}

describe("Tinity subpage", () => {
  it("mounts the experience at /tinity as a React island", () => {
    const page = readSrc("pages/tinity/index.astro")
    expect(page).toMatch(/export const prerender = false/)
    expect(page).not.toMatch(/export const prerender = true/)
    expect(page).toContain("lockScroll")
    expect(page).toContain("tinity")
    expect(page).toContain('<TinityApp client:only="react" />')
    expect(page).not.toContain("boot-loader")
    expect(page).not.toContain("<Hero")
    expect(existsSync(join(src, "tinity/TinityApp.tsx"))).toBe(true)
    expect(existsSync(join(src, "tinity/components/canvasui/ForceField.tsx"))).toBe(true)
  })

  it("declares the Layout tinity prop the page passes", () => {
    const layout = readSrc("layouts/Layout.astro")
    expect(layout).toMatch(/tinity\?: boolean/)
    expect(layout).toMatch(/tinity = false/)
  })

  it("exposes a homepage Tinity control without restyling hire", () => {
    const hero = readHeroIsland()
    expect(hero).toContain("href={site.tinity.path}")
    expect(hero).toContain('aria-label="Open Tinity"')
    expect(hero).toContain("onHireCtaClicked")
    expect(hero).toContain("Hire / Contact")
  })
})
