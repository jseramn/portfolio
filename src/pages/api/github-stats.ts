import type { APIRoute } from "astro"
import { site } from "../../config/site"
import { API_NO_STORE } from "../../lib/agent/apiCacheHeaders"
import { fetchGitHubStats, type GitHubStats } from "../../lib/githubStats"

export const prerender = false

const CACHE_MS = 5 * 60 * 1000

const noStoreHeaders = {
  "Cache-Control": API_NO_STORE,
  "Vercel-CDN-Cache-Control": API_NO_STORE,
}

let memoryCache: { data: GitHubStats; at: number } | null = null

export const GET: APIRoute = async () => {
  const now = Date.now()
  if (memoryCache && now - memoryCache.at < CACHE_MS) {
    return Response.json(memoryCache.data, {
      headers: noStoreHeaders,
    })
  }

  const token = import.meta.env.GITHUB_TOKEN

  try {
    const data = await fetchGitHubStats(site.githubUser, token)
    memoryCache = { data, at: now }
    return Response.json(data, {
      headers: noStoreHeaders,
    })
  } catch {
    if (memoryCache) {
      return Response.json(memoryCache.data, {
        headers: noStoreHeaders,
      })
    }
    return Response.json({ error: "unavailable" }, {
      status: 503,
      headers: noStoreHeaders,
    })
  }
}
