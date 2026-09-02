import { site } from "../config/site"
import { allowedSiteOrigins } from "./security/headers"

export const OEMBED_PATHS = [
  "/",
  "/about",
  "/contact",
  "/tinity",
  "/policy",
  "/terms",
  "/data-deletion",
] as const

export type OEmbedRich = {
  version: "1.0"
  type: "rich"
  title: string
  author_name: string
  provider_name: string
  provider_url: string
  html: string
  width: number
  height: number
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
}

const OEMBED_WIDTH = 480
const OEMBED_HEIGHT = 320

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/"
}

export function resolveOEmbed(
  url: string | null,
  origins: string[] = allowedSiteOrigins(),
): OEmbedRich | null {
  if (!url) return null

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }

  if (!origins.includes(parsed.origin)) return null

  const path = normalizePath(parsed.pathname)
  if (path === "/api" || path.startsWith("/api/")) return null
  if (!(OEMBED_PATHS as readonly string[]).includes(path)) return null

  const embedUrl = `${parsed.origin}${path === "/" ? "/" : path}`

  return {
    version: "1.0",
    type: "rich",
    title: site.seo.title,
    author_name: site.name,
    provider_name: site.brand,
    provider_url: site.url,
    html: `<iframe src="${embedUrl}" width="${OEMBED_WIDTH}" height="${OEMBED_HEIGHT}"></iframe>`,
    width: OEMBED_WIDTH,
    height: OEMBED_HEIGHT,
    thumbnail_url: site.seo.ogImage,
    thumbnail_width: 1200,
    thumbnail_height: 630,
  }
}
