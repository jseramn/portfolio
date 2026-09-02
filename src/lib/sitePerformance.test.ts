import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { VIDEO_PRELOAD } from "./heroAsciiBudget"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const src = join(root, "src")

function read(rel: string): string {
  return readFileSync(join(root, rel), "utf8")
}

function readSrc(rel: string): string {
  return readFileSync(join(src, rel), "utf8")
}

describe("site performance chrome load", () => {
  it("keeps Astro 5 pins and does not mix Astro 7", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>
    }
    expect(pkg.dependencies.astro).toMatch(/^\^?5/)
    expect(pkg.dependencies["@astrojs/react"]).toMatch(/^\^?4/)
    expect(pkg.dependencies["@astrojs/vercel"]).toBe("^8.2.11")
    const vercelVendor = Object.keys(pkg.dependencies).filter((name) => name.startsWith("@vercel/"))
    expect(vercelVendor).toEqual([])
    expect(pkg.dependencies.astro).not.toMatch(/7/)
    expect(read("pnpm-workspace.yaml")).not.toContain("minimumReleaseAgeExclude")
  })

  it("drops unused R3F while keeping three", () => {
    const pkg = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>
    }
    expect(pkg.dependencies.three).toBeTruthy()
    expect(pkg.dependencies).not.toHaveProperty("@react-three/fiber")
    expect(pkg.dependencies).not.toHaveProperty("@react-three/postprocessing")
    expect(pkg.dependencies).not.toHaveProperty("postprocessing")
    expect(readSrc("lib/heroAsciiRuntime.ts")).toContain('import("three")')
  })

  it("compresses HTML without flipping prerender", async () => {
    const astro = await import("../../astro.config.mjs")
    expect(astro.default.compressHTML).toBe(true)
    for (const page of ["index", "about", "contact", "404", "policy", "terms", "data-deletion"]) {
      expect(readSrc(`pages/${page}.astro`)).toMatch(/export const prerender = false/)
      expect(readSrc(`pages/${page}.astro`)).not.toMatch(/prerender = true/)
    }
  })

  it("keeps one Hero client:load island and a stable hover-only tagline", () => {
    const home = readSrc("pages/index.astro")
    const hero = readSrc("components/Hero.tsx")
    expect(home.match(/<Hero client:load \/>/g)?.length).toBe(1)
    expect(home).not.toContain("client:idle")
    expect(hero).toContain("useScramble(DESC)")
    expect(hero).not.toContain("autoStart: true")
    expect(hero).toContain("onMouseEnter={desc.start}")
    expect(hero).toContain("onMouseLeave={desc.stop}")
  })

  it("preloads Geist sans woff2 without restyling ink or scrims", () => {
    const layout = readSrc("layouts/Layout.astro")
    const css = readSrc("styles/globals.css")
    expect(layout).toContain("Geist-Variable.woff2?url")
    expect(layout).not.toContain("GeistMono-Variable.woff2?url")
    expect(layout).toContain('as="font"')
    expect(layout).toContain('type="font/woff2"')
    expect(layout).toContain('fetchpriority="high"')
    expect(layout).toContain("globals.css?inline")
    expect(layout).not.toContain("site.asciiPosterSrc")
    expect(layout).not.toContain('as="image"')
    expect(layout).not.toContain('type="image/webp"')
    expect(css).toContain("GeistMono-Variable.woff2")
    expect(css).toContain("font-display: optional")
    expect(css).toContain("--hero-ink")
    expect(css).toContain(".hero-scrim-top")
    expect(css).not.toContain('url("/ascii-poster.webp")')
    expect(css).not.toContain("img.hero-ascii-poster")
    expect(css).toContain("data-ascii-paint")
    expect(css).toContain("#boot-loader")
    expect(css).toContain(".loader")
    expect(css).toContain("@keyframes l21")
    const home = readSrc("pages/index.astro")
    expect(home).not.toContain("hero-ascii-poster")
    expect(home).not.toContain("site.asciiPosterSrc")
    expect(home).toContain("<Hero client:load />")
    expect(home).not.toContain('as="video"')
    expect(home).not.toMatch(/rel=["']preload["']/)
    expect(home).not.toContain("asciiSamplerWebm")
    expect(home).toContain('id="boot-loader"')
    expect(home).not.toContain("videoSrcMp4")
    expect(home).not.toContain("videoSrcWebm")
    expect(home).not.toContain("/videobg.webm")
    expect(home).not.toContain("/videobg.mp4")
    expect(VIDEO_PRELOAD).toBe("none")
    expect(readSrc("lib/heroAsciiRuntime.ts")).toContain("video.preload = VIDEO_PRELOAD")
    expect(layout).not.toContain('as="video"')
    expect(readSrc("pages/about.astro")).not.toContain("boot-loader")
    expect(readSrc("pages/contact.astro")).not.toContain("boot-loader")
  })

  it("defers YouTube and ContactModal; ASCII stays lazy outside the Hero chrome file", () => {
    const hero = readSrc("components/Hero.tsx")
    expect(hero).not.toMatch(/import \{ ContactModal \}/)
    expect(hero).toContain('import("./ContactModal")')
    expect(hero).toContain("ensureYtPlayer")
    const ensureAt = hero.indexOf("const ensureYtPlayer")
    const firstApi = hero.indexOf("iframe_api")
    const lastApi = hero.lastIndexOf("iframe_api")
    expect(ensureAt).toBeGreaterThan(-1)
    expect(firstApi).toBeGreaterThan(ensureAt)
    expect(lastApi).toBeGreaterThan(ensureAt)
    expect(hero).not.toMatch(/useEffect\(\(\) => \{[\s\S]{0,80}iframe_api/)
    expect(hero).toContain('lazy(() => import("./HeroAsciiBackground"))')
    expect(hero).toContain("<HeroAsciiBackground paintCanvasRef={asciiPaintRef} />")
    expect(hero).not.toContain("setAsciiReady")
    expect(hero).not.toContain("requestIdleCallback")
    expect(hero).not.toContain("afterFirstPaint")
    expect(hero).not.toContain("document.fonts")
  })

  it("does not leave ingest beacons or unused three fiber imports in src", () => {
    const glass = readSrc("components/GlassSurface.tsx")
    const ascii = readSrc("lib/heroAsciiRuntime.ts")
    const hero = readSrc("components/Hero.tsx")
    const asciiBg = readSrc("components/HeroAsciiBackground.tsx")
    for (const source of [glass, ascii, hero, asciiBg]) {
      expect(source).not.toContain("127.0.0.1:7586/ingest")
      expect(source).not.toContain("@react-three/fiber")
      expect(source).not.toContain("@react-three/postprocessing")
    }
    expect(ascii).not.toMatch(/preload\s*=\s*["']auto["']/)
    expect(ascii).toContain("video.preload = VIDEO_PRELOAD")
    expect(ascii).toContain("signalHeroBootReady")
    expect(asciiBg).toContain("data-hero-boot-fallback")
    expect(asciiBg).toContain("signalHeroBootReady")
  })
})
