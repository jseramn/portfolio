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

export type OEmbedPhoto = {
  version: "1.0"
  type: "photo"
  title: string
  author_name: string
  author_url: string
  provider_name: string
  provider_url: string
  url: string
  width: number
  height: number
  thumbnail_url: string
  thumbnail_width: number
  thumbnail_height: number
}

const OEMBED_WIDTH = 1200
const OEMBED_HEIGHT = 630

function normalizePath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/"
}

export function resolveOEmbed(
  url: string | null,
  origins: string[] = allowedSiteOrigins(),
): OEmbedPhoto | null {
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

  return {
    version: "1.0",
    type: "photo",
    title: site.seo.title,
    author_name: site.name,
    author_url: site.url,
    provider_name: site.brand,
    provider_url: site.url,
    url: site.seo.ogImage,
    width: OEMBED_WIDTH,
    height: OEMBED_HEIGHT,
    thumbnail_url: site.seo.ogImage,
    thumbnail_width: 1200,
    thumbnail_height: 630,
  }
}
