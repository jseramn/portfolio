import { readdirSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { CONTACT_MODAL_OPEN_ATTR } from "./domSignals"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const src = join(root, "src")

function read(rel: string): string {
  return readFileSync(join(src, rel), "utf8")
}

function readAsciiRuntime(): string {
  const dir = join(src, "lib/hero/ascii")
  return readdirSync(dir)
    .filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"))
    .sort()
    .map((name) => readFileSync(join(dir, name), "utf8"))
    .join("\n")
}

function readHeroIsland(): string {
  const heroDir = join(src, "components/hero")
  const files = readdirSync(heroDir)
    .filter((name) => /\.(ts|tsx)$/.test(name) && !name.includes(".test."))
    .sort()
  return [read("components/Hero.tsx"), ...files.map((name) => read(`components/hero/${name}`))].join(
    "\n",
  )
}

describe("hero Geist chrome", () => {
  it("keeps Geist HUD without liquid-glass hosts or the live engine", () => {
    const hero = readHeroIsland()
    const modal = read("components/ContactModal.tsx")
    const css = read("styles/globals.css")
    const pkg = readFileSync(join(root, "package.json"), "utf8")

    expect(hero).not.toContain("GlassSurface")
    expect(hero).not.toContain("liquid-glass")
    expect(hero).not.toContain("data-glass-host")
    expect(hero).not.toContain("useHeroPointer")
    expect(modal).not.toContain("GlassSurface")
    expect(modal).not.toContain("mouseContainer")
    expect(pkg).not.toContain("liquid-glass-react")
    expect(css).not.toContain(".glass-fallback")
    expect(css).not.toContain("[data-glass-host]")
    expect(css).not.toContain("backdrop-filter: blur(4px)")
  })

  it("locks Geist faces, frozen hire type, and bone ink", () => {
    const css = read("styles/globals.css")
    const hero = readHeroIsland()
    expect(css).toContain('font-family: "Geist"')
    expect(css).toContain('font-family: "Geist Sans"')
    expect(css).toContain('font-family: "Geist Mono"')
    expect(css).toContain('src: url("../assets/fonts/Geist-Variable.woff2")')
    expect(css).toContain("--font-geist-sans: \"Geist\", \"Geist Sans\"")
    expect(hero).toContain("font-sans text-2xl md:text-3xl font-semibold tracking-tight")
    expect(hero).toContain("font-sans text-base md:text-xl font-normal leading-relaxed")
    expect(hero).toContain("font-mono text-sm md:text-base")
    expect(hero).toContain("hero-on-video")
    expect(hero).toContain("hero-scrim-top")
    expect(hero).toContain("hero-scrim-bottom")
    expect(hero).toContain("hero-scrim-social")
    expect(css).toContain("--hero-ink")
    expect(css).not.toContain("blur(12px) saturate(1.8)")
  })

  it("keeps ContactModal inside the hero root", () => {
    const shell = read("components/Hero.tsx")
    const hire = read("components/hero/HeroHire.tsx")
    const rootOpen = shell.indexOf("data-hero-root")
    const rootClose = shell.lastIndexOf("</div>")
    const modalLayer = shell.indexOf("<HeroContactLayer")
    const asciiPaint = shell.indexOf("hero-ascii-display")
    expect(rootOpen).toBeGreaterThan(-1)
    expect(modalLayer).toBeGreaterThan(rootOpen)
    expect(modalLayer).toBeLessThan(rootClose)
    expect(asciiPaint).toBeGreaterThan(rootOpen)
    expect(asciiPaint).toBeLessThan(rootClose)
    expect(hire).toContain("<ContactModal")
    expect(hire).toContain('import("../ContactModal")')
    expect(shell).toContain("z-[1]")
    expect(shell).not.toContain("mouseContainer")
  })

  it("locks modal overlay fill without a glass wrap", () => {
    const modal = read("components/ContactModal.tsx")
    expect(modal).toContain("bg-black/25")
    expect(modal).toContain("rounded-[15px]")
    expect(modal).toContain("bg-black/75")
    expect(modal).toContain("backdrop-blur-[2px]")
    expect(modal).not.toContain("backdrop-blur-md")
    expect(modal).not.toContain("bg-black/55")
    expect(modal).toContain(CONTACT_MODAL_OPEN_ATTR)
  })

  it("keeps HUD chrome, Tinity, and tap-sized hire without clipping hosts", () => {
    const hero = readHeroIsland()
    expect(hero).toContain('aria-label="Open Tinity"')
    expect(hero).toContain('aria-label="Hire / Contact"')
    expect(hero).toContain("min-w-[18ch]")
    expect(hero).toContain("flex flex-row items-center gap-4 md:gap-5")
    expect(hero).toContain("env(safe-area-inset-top)")
    expect(hero).toContain("env(safe-area-inset-bottom)")
    expect(hero).toContain("hud:contents")
    expect(hero).toContain(
      "font-mono text-sm flex flex-wrap items-center justify-center hud:justify-end gap-2 px-4 hud:px-0",
    )
    expect(hero).not.toContain("bottom-[max(11.25rem")
  })

  it("does not glaze legal pages or agent homepage copy", () => {
    expect(read("pages/policy.astro")).not.toContain("GlassSurface")
    expect(read("pages/terms.astro")).not.toContain("GlassSurface")
    expect(read("pages/data-deletion.astro")).not.toContain("GlassSurface")
    expect(read("pages/index.astro")).toContain("sr-only")
    expect(read("pages/index.astro")).not.toContain("GlassSurface")
  })

  it("strips glass debug ingest from remaining hero surfaces", () => {
    const ascii = readAsciiRuntime()
    const hero = readHeroIsland()
    const asciiBg = read("components/HeroAsciiBackground.tsx")
    for (const source of [ascii, hero, asciiBg]) {
      expect(source).not.toContain("127.0.0.1:7586/ingest")
      expect(source).not.toContain("data-glass-debug")
      expect(source).not.toMatch(/\bdbg\(/)
    }
    expect(ascii).not.toContain("dataset.glassBox")
    expect(ascii).not.toContain("dataset.glassGen")
  })
})
