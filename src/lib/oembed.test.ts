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
  it("returns rich iframe payloads for allowlisted paths", () => {
    for (const path of OEMBED_PATHS) {
      const target = path === "/" ? "https://jseramn.tech/" : `https://jseramn.tech${path}`
      const payload = resolveOEmbed(target, origins)
      expect(payload).not.toBeNull()
      expect(payload).toMatchObject({
        version: "1.0",
        type: "rich",
        title: site.seo.title,
        author_name: site.name,
        provider_name: site.brand,
        provider_url: site.url,
        thumbnail_url: site.seo.ogImage,
        thumbnail_width: 1200,
        thumbnail_height: 630,
        width: 480,
        height: 320,
      })
      expect(payload?.html).toContain(
        `src="${target === "https://jseramn.tech/" ? "https://jseramn.tech/" : `https://jseramn.tech${path}`}"`,
      )
      expect(payload?.html).toContain('width="480"')
      expect(payload?.html).toContain('height="320"')
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
  it("returns 200 rich JSON for allowlisted urls and 404 otherwise", async () => {
    const ok = await getOEmbed("https://jseramn.tech/about")
    expect(ok.status).toBe(200)
    const body = (await ok.json()) as { type: string; html: string; width: number; height: number }
    expect(body.type).toBe("rich")
    expect(body.html).toContain("https://jseramn.tech/about")
    expect(body.width).toBe(480)
    expect(body.height).toBe(320)

    expect((await getOEmbed(null)).status).toBe(404)
    expect((await getOEmbed("https://evil.example/")).status).toBe(404)
    expect((await getOEmbed("https://jseramn.tech/api/contact")).status).toBe(404)
    expect((await getOEmbed("https://jseramn.tech/unknown")).status).toBe(404)
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
