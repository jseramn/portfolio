import { readFileSync, writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { basename, dirname, join } from "node:path"
import { buildSecurityHeaderEntries } from "../src/lib/security/siteSecurityHeaders.mjs"

const ACCEPT_VARY = "Accept, Accept-Encoding"

export const PREVIEW_ASSET_SOURCE =
  "/(thumbnail.png|favicon.ico|favicon.png|favicon.svg|apple-touch-icon.png|site.webmanifest|android-chrome-192x192.png|android-chrome-512x512.png)"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const vercelPath = join(root, "vercel.json")

export function buildVercelHeaderRules() {
  const securityHeaders = [
    ...buildSecurityHeaderEntries(false),
    { key: "Vary", value: ACCEPT_VARY },
  ]

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
      source: "/(policy|terms|data-deletion)",
      headers: [
        { key: "Access-Control-Allow-Origin", value: "*" },
        { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://vitals.vercel-insights.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors *; upgrade-insecure-requests",
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
  ]
}

export function syncVercelJson() {
  const vercel = JSON.parse(readFileSync(vercelPath, "utf8"))
  vercel.headers = buildVercelHeaderRules()
  writeFileSync(vercelPath, `${JSON.stringify(vercel, null, 2)}\n`)
  console.log("[sync-vercel-security-headers] updated vercel.json")
}

const invoked = process.argv[1] && basename(process.argv[1]) === "sync-vercel-security-headers.mjs"
if (invoked) {
  syncVercelJson()
}
