import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { basename, dirname, join } from "node:path"
import {
  AGENT_FILES_SOURCE,
  TINIT_AGENT_FILES_SOURCE,
  TINIT_PUBLIC_ASSET_SOURCE,
  WELL_KNOWN_SOURCE,
  agentReadableFileHeaderGroup,
  buildLegalContentSecurityPolicy,
  buildSecurityHeaderEntries,
  githubStatsApiHeaderGroup,
  hashedAstroAssetHeaderGroup,
} from "../src/lib/security/siteSecurityHeaders.mjs"

export { ASTRO_ASSET_SOURCE } from "../src/lib/security/siteSecurityHeaders.mjs"

export const PREVIEW_ASSET_SOURCE =
  "/(thumbnail.png|favicon.ico|favicon.png|favicon.svg|apple-touch-icon.png|site.webmanifest|android-chrome-192x192.png|android-chrome-512x512.png|oembed.json)"

export const VIDEO_BG_ASSET_SOURCE = "/videobg(.*)"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const vercelPath = join(root, "vercel.json")

export function buildVercelHeaderRules() {
  const securityHeaders = buildSecurityHeaderEntries(false)

  return [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
    {
      source: PREVIEW_ASSET_SOURCE,
      headers: [
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
    {
      source: TINIT_PUBLIC_ASSET_SOURCE,
      headers: [
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        { key: "Access-Control-Allow-Origin", value: "*" },
        {
          key: "Cache-Control",
          value: "public, max-age=86400, stale-while-revalidate=604800",
        },
      ],
    },
    {
      source: VIDEO_BG_ASSET_SOURCE,
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    hashedAstroAssetHeaderGroup(),
    agentReadableFileHeaderGroup(AGENT_FILES_SOURCE),
    agentReadableFileHeaderGroup(WELL_KNOWN_SOURCE),
    agentReadableFileHeaderGroup(TINIT_AGENT_FILES_SOURCE),
    {
      source: "/(policy|terms|data-deletion)",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        {
          key: "Content-Security-Policy",
          value: buildLegalContentSecurityPolicy(),
        },
      ],
    },
    {
      source: "/(.*).map",
      headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    },
    {
      source: "/api/(.*)",
      headers: [
        { key: "Cache-Control", value: "no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow" },
      ],
    },
    githubStatsApiHeaderGroup(),
  ]
}

export function buildVercelRedirects() {
  return [
    { source: "/privacy", destination: "/policy", permanent: true },
    {
      source: "/security.txt",
      destination: "/.well-known/security.txt",
      permanent: true,
    },
  ]
}

export function syncVercelJson() {
  const vercel = JSON.parse(readFileSync(vercelPath, "utf8"))
  vercel.headers = buildVercelHeaderRules()
  vercel.redirects = buildVercelRedirects()
  writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`)
  console.log("[sync-vercel-security-headers] updated vercel.json")
}

const invoked = process.argv[1] && basename(process.argv[1]) === "sync-vercel-security-headers.mjs"
if (invoked) {
  syncVercelJson()
}
