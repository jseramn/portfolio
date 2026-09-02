import type { APIRoute } from "astro"
import { site } from "../../config/site"
import { applyGitHubStatsCacheHeaders } from "../../lib/agent/apiCacheHeaders"
import { fetchGitHubStats, type GitHubStats } from "../../lib/githubStats"

export const prerender = false

const methodNotAllowed = () =>
  Response.json({ error: "method_not_allowed" }, { status: 405, headers: { Allow: "GET" } })

export const POST: APIRoute = () => methodNotAllowed()

export const OPTIONS: APIRoute = () => methodNotAllowed()

const CACHE_MS = 5 * 60 * 1000

let memoryCache: { data: GitHubStats; at: number } | null = null

function jsonWithCache(data: unknown, status = 200): Response {
  const headers = new Headers()
  applyGitHubStatsCacheHeaders(headers, status)
  return Response.json(data, { status, headers })
}

export const GET: APIRoute = async () => {
  const now = Date.now()
  if (memoryCache && now - memoryCache.at < CACHE_MS) {
    return jsonWithCache(memoryCache.data)
  }

  const token = import.meta.env.GITHUB_TOKEN

  try {
    const data = await fetchGitHubStats(site.githubUser, token)
    memoryCache = { data, at: now }
    return jsonWithCache(data)
  } catch {
    if (memoryCache) {
      return jsonWithCache(memoryCache.data)
    }
    return jsonWithCache({ error: "unavailable" }, 503)
  }
}
