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
      lang: string
      id: string
      scope: string
      icons: { src: string; sizes: string }[]
    }
    expect(manifest.short_name).toBe("jseramn")
    expect(manifest.theme_color).toBe("#000000")
    expect(manifest.lang).toBe("en")
    expect(manifest.id).toBe("/")
    expect(manifest.scope).toBe("/")
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
      'name="twitter:url"',
      'name="twitter:image:alt"',
      'property="og:locale:alternate"',
      "es_CO",
      'rel="alternate"',
      "application/json+oembed",
      "/oembed.json?url=",
      "encodeURIComponent(canonical)",
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
    expect(PREVIEW_ASSET_SOURCE).toContain("oembed.json")
  })
})

describe("generate-preview-assets script", () => {
  const scriptPath = join(root, "scripts/generate-preview-assets.sh")
  const script = () => readFileSync(scriptPath, "utf8")

  it("exists and is executable", () => {
    expect(existsSync(scriptPath)).toBe(true)
    expect(Boolean(readFileSync(scriptPath).length)).toBe(true)
  })

  it("recaptures production and rejects dirty local Hero chrome", () => {
    const source = script()
    expect(source).toContain('capture_url="${CAPTURE_URL:-https://jseramn.tech/}"')
    expect(source).toContain('querySelector(".hero-ascii-display")')
    expect(source).not.toContain("/home/jseramn/portfolio")
    expect(source).not.toContain("localhost")
    expect(source).not.toContain("127.0.0.1")
    expect(source).not.toContain('PNG32:"$public/favicon.svg"')
    expect(source).not.toMatch(/cat > "\$public\/favicon\.svg"/)
  })

  it("boosts contrast only on 16/32/48 ICO frames and the 32px PNG", () => {
    const source = script()
    expect(source).toContain(
      'magick "$tmp/portrait-sq.png" -resize 32x32! -sigmoidal-contrast 3x50% -strip PNG32:"$public/favicon.png"',
    )
    expect(source).toContain("-resize 16x16 -sigmoidal-contrast 3x50%")
    expect(source).toContain("-resize 32x32 -sigmoidal-contrast 3x50%")
    expect(source).toContain("-resize 48x48 -sigmoidal-contrast 3x50%")
    const ogBlock = source.slice(
      source.indexOf("# Open Graph / Twitter"),
      source.indexOf("# ASCII portrait square"),
    )
    expect(ogBlock).toContain("thumbnail.png")
    expect(ogBlock).not.toContain("sigmoidal-contrast")
    expect(source).not.toContain("-resize 180x180! -sigmoidal-contrast")
    expect(source).not.toContain("-resize 192x192! -sigmoidal-contrast")
    expect(source).not.toContain("-resize 512x512! -sigmoidal-contrast")
    expect(source).toContain(
      'magick "$tmp/portrait-sq.png" -resize 180x180! -strip PNG32:"$public/apple-touch-icon.png"',
    )
    expect(source).toContain(
      'magick "$tmp/portrait-sq.png" -resize 192x192! -strip PNG32:"$public/android-chrome-192x192.png"',
    )
    expect(source).toContain(
      'magick "$tmp/portrait-sq.png" -resize 512x512! -strip PNG32:"$public/android-chrome-512x512.png"',
    )
    expect(source).toContain("-resize 1200x630! -strip PNG32:\"$tmp/thumbnail.png\"")
  })

  it("writes lang, id, and scope from the heredoc so public-only fields cannot survive", () => {
    const source = script()
    expect(source).toContain('cat > "$public/site.webmanifest" <<\'EOF\'')
    const heredoc = source.slice(source.indexOf("<<'EOF'"), source.indexOf("\nEOF"))
    expect(heredoc).toContain('"lang": "en"')
    expect(heredoc).toContain('"id": "/"')
    expect(heredoc).toContain('"scope": "/"')
  })
})
