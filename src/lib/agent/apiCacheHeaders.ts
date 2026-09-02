import { CDN_SWR_CACHE_CONTROL } from "../security/siteSecurityHeaders.mjs"
import { ACCEPT_VARY } from "./accept"

export const API_NO_STORE = "private, no-store"
export const CDN_SWR_CACHE: string = CDN_SWR_CACHE_CONTROL

export function applyApiNoStoreHeaders(pathname: string, headers: Headers): void {
  const path = (pathname.split("?")[0] || "/").replace(/\/+$/, "") || "/"
  if (path === "/api/github-stats") return
  if (path === "/api" || path.startsWith("/api/")) {
    headers.set("Cache-Control", API_NO_STORE)
    headers.set("Vercel-CDN-Cache-Control", API_NO_STORE)
  }
}

export function applyGitHubStatsCacheHeaders(headers: Headers, status: number): void {
  const value = status === 200 ? CDN_SWR_CACHE : API_NO_STORE
  headers.set("Cache-Control", value)
  headers.set("Vercel-CDN-Cache-Control", value)
}

export function applyNegotiatedResponseHeaders(
  headers: Headers,
  opts: { vary: boolean; status: number },
): void {
  if (opts.vary) {
    headers.set("Vary", ACCEPT_VARY)
  }
  if (!opts.vary || opts.status !== 200) return
  const existing = headers.get("Cache-Control") ?? ""
  if (/\bno-store\b/i.test(existing)) return
  headers.set("Cache-Control", CDN_SWR_CACHE)
  headers.set("Vercel-CDN-Cache-Control", CDN_SWR_CACHE)
}
