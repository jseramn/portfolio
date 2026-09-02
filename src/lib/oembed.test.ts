import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"
import { site } from "../config/site"
import { OEMBED_PATHS, resolveOEmbed } from "./oembed"
import { GET } from "../pages/oembed.json"

const root = join(dirname(fileURLToPath(import.meta.url)), "../..")
const origins = ["https://jseramn.tech", "https://www.jseramn.tech"]

async function getOEmbed(target: string | null): Promise<Response> {
  const requestUrl = new URL("https://jseramn.tech/oembed.json")
  if (target !== null) requestUrl.searchParams.set("url", target)
  return GET({ url: requestUrl } as Parameters<typeof GET>[0])
}

describe("resolveOEmbed", () => {
  it("returns photo payloads using the OG image that CSP allows", () => {
    for (const path of OEMBED_PATHS) {
      const target = path === "/" ? "https://jseramn.tech/" : `https://jseramn.tech${path}`
      const payload = resolveOEmbed(target, origins)
      expect(payload).not.toBeNull()
      expect(payload).toMatchObject({
        version: "1.0",
        type: "photo",
        url: site.seo.ogImage,
        title: site.seo.title,
        author_name: site.name,
        author_url: site.url,
        provider_name: site.brand,
        provider_url: site.url,
        thumbnail_url: site.seo.ogImage,
        thumbnail_width: 1200,
        thumbnail_height: 630,
        width: 1200,
        height: 630,
      })
      expect(payload).not.toHaveProperty("html")
    }
  })

  it("returns null for missing url, foreign host, /api/*, and unknown path", () => {
    expect(resolveOEmbed(null, origins)).toBeNull()
    expect(resolveOEmbed("", origins)).toBeNull()
    expect(resolveOEmbed("https://evil.example/", origins)).toBeNull()
    expect(resolveOEmbed("https://jseramn.tech/api/contact", origins)).toBeNull()
    expect(resolveOEmbed("https://jseramn.tech/unknown", origins)).toBeNull()
  })
})

describe("GET /oembed.json", () => {
  it("returns 200 photo JSON for allowlisted urls and 400 JSON otherwise", async () => {
    const ok = await getOEmbed("https://jseramn.tech/about")
    expect(ok.status).toBe(200)
    expect(ok.headers.get("content-type") ?? "").toMatch(/application\/json/)
    const body = (await ok.json()) as { type: string; url: string; width: number; height: number }
    expect(body.type).toBe("photo")
    expect(body.url).toBe(site.seo.ogImage)
    expect(body.width).toBe(1200)
    expect(body.height).toBe(630)
    expect(body).not.toHaveProperty("html")

    const missing = await getOEmbed(null)
    expect(missing.status).toBe(400)
    expect(missing.headers.get("content-type") ?? "").toMatch(/application\/json/)
    await expect(missing.json()).resolves.toEqual({ error: "url_required" })
    expect((await getOEmbed("https://evil.example/")).status).toBe(400)
    expect((await getOEmbed("https://jseramn.tech/api/contact")).status).toBe(400)
    expect((await getOEmbed("https://jseramn.tech/unknown")).status).toBe(400)
  })

  it("stays dynamic and does not flip home, about, contact, or 404 to prerender true", () => {
    const oembed = readFileSync(join(root, "src/pages/oembed.json.ts"), "utf8")
    expect(oembed).toMatch(/export const prerender = false/)
    for (const rel of [
      "src/pages/index.astro",
      "src/pages/about.astro",
      "src/pages/contact.astro",
      "src/pages/404.astro",
    ]) {
      const source = readFileSync(join(root, rel), "utf8")
      expect(source).toMatch(/export const prerender = false/)
      expect(source).not.toMatch(/export const prerender = true/)
    }
  })
})
