import { existsSync, readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import {
  PREVIEW_ASSET_SOURCE,
  buildVercelHeaderRules,
} from "../../scripts/sync-vercel-security-headers.mjs"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const publicDir = join(root, "public")

function pngSize(path: string): { width: number; height: number } {
  const buf = readFileSync(path)
  expect(Array.from(buf.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10])
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe("preview assets", () => {
  it("keeps OG and icon PNGs at platform sizes", () => {
    expect(pngSize(join(publicDir, "thumbnail.png"))).toEqual({ width: 1200, height: 630 })
    expect(pngSize(join(publicDir, "apple-touch-icon.png"))).toEqual({ width: 180, height: 180 })
    expect(pngSize(join(publicDir, "favicon.png"))).toEqual({ width: 32, height: 32 })
    expect(pngSize(join(publicDir, "android-chrome-192x192.png"))).toEqual({
      width: 192,
      height: 192,
    })
    expect(pngSize(join(publicDir, "android-chrome-512x512.png"))).toEqual({
      width: 512,
      height: 512,
    })
    expect(readFileSync(join(publicDir, "thumbnail.png")).byteLength).toBeLessThan(1_000_000)
  })

  it("ships a multi-size ICO, SVG mark, and web manifest", () => {
    const ico = readFileSync(join(publicDir, "favicon.ico"))
    expect(ico.readUInt16LE(0)).toBe(0)
    expect(ico.readUInt16LE(2)).toBe(1)
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(3)

    const svg = readFileSync(join(publicDir, "favicon.svg"), "utf8")
    expect(svg).toContain("#0A0B12")
    expect(svg).toContain("#00F0FF")

    const manifest = JSON.parse(readFileSync(join(publicDir, "site.webmanifest"), "utf8")) as {
      short_name: string
      theme_color: string
      icons: { src: string; sizes: string }[]
    }
    expect(manifest.short_name).toBe("jseramn")
    expect(manifest.theme_color).toBe("#000000")
    expect(manifest.icons.map((icon) => icon.sizes).sort()).toEqual(["192x192", "512x512"])
  })

  it("declares complete preview metadata in Layout", () => {
    const layout = readFileSync(join(root, "src/layouts/Layout.astro"), "utf8")
    for (const token of [
      'rel="apple-touch-icon"',
      'rel="manifest"',
      'name="theme-color"',
      'name="color-scheme"',
      'property="og:image:alt"',
      'property="og:image:type"',
      'name="twitter:site"',
      'name="twitter:image:alt"',
      'sizes="16x16 32x32 48x48"',
      "content={canonical}",
    ]) {
      expect(layout).toContain(token)
    }
    const jsonld = readFileSync(join(root, "src/lib/agent/jsonld.ts"), "utf8")
    expect(jsonld).toContain("image: site.seo.ogImage")
    expect(jsonld).toContain("logo: site.seo.appleTouchIcon")
  })
})

describe("preview asset crawler headers", () => {
  it("overrides CORP after the global same-site rule", () => {
    const rules = buildVercelHeaderRules()
    const globalIdx = rules.findIndex((rule) => rule.source === "/(.*)")
    const previewIdx = rules.findIndex((rule) => rule.source === PREVIEW_ASSET_SOURCE)
    expect(globalIdx).toBeGreaterThanOrEqual(0)
    expect(previewIdx).toBeGreaterThan(globalIdx)

    const headers = Object.fromEntries(
      (rules[previewIdx]?.headers ?? []).map((header) => [header.key, header.value]),
    )
    expect(headers["Cross-Origin-Resource-Policy"]).toBe("cross-origin")
    expect(headers["Access-Control-Allow-Origin"]).toBe("*")
    expect(headers["Cache-Control"]).toBe(
      "public, max-age=86400, stale-while-revalidate=604800",
    )
  })
})

describe("generate-preview-assets script", () => {
  it("exists and is executable", () => {
    const script = join(root, "scripts/generate-preview-assets.sh")
    expect(existsSync(script)).toBe(true)
    expect(Boolean(readFileSync(script).length)).toBe(true)
  })
})
