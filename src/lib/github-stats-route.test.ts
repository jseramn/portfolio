import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { API_NO_STORE, CDN_SWR_CACHE } from "./agent/apiCacheHeaders"

const { fetchGitHubStats } = vi.hoisted(() => ({
  fetchGitHubStats: vi.fn(),
}))

vi.mock("./githubStats", () => ({
  fetchGitHubStats,
}))

const SAMPLE = {
  today: 1,
  month: 10,
  year: 100,
  total: 1000,
  lastCommit: { message: "fix", repo: "portfolio", url: "https://github.com/jseramn/portfolio" },
}

const CACHE_MS = 5 * 60 * 1000

async function loadGET() {
  const { GET } = await import("../pages/api/github-stats")
  return GET
}

function expectCdnSwr(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe(CDN_SWR_CACHE)
  expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(CDN_SWR_CACHE)
}

function expectNoStore(response: Response) {
  expect(response.headers.get("Cache-Control")).toBe(API_NO_STORE)
  expect(response.headers.get("Vercel-CDN-Cache-Control")).toBe(API_NO_STORE)
}

describe("GET /api/github-stats", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-08-22T12:00:00.000Z"))
    fetchGitHubStats.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("sets CDN SWR headers on a fresh fetch", async () => {
    fetchGitHubStats.mockResolvedValue(SAMPLE)
    const GET = await loadGET()
    const response = await GET({} as never)
    expect(response.status).toBe(200)
    expectCdnSwr(response)
    expect(fetchGitHubStats).toHaveBeenCalledOnce()
  })

  it("reuses memory within CACHE_MS and does not refetch", async () => {
    fetchGitHubStats.mockResolvedValue(SAMPLE)
    const GET = await loadGET()
    const first = await GET({} as never)
    const second = await GET({} as never)
    expectCdnSwr(first)
    expectCdnSwr(second)
    expect(fetchGitHubStats).toHaveBeenCalledOnce()
  })

  it("returns stale JSON with CDN SWR when fetch fails after CACHE_MS", async () => {
    fetchGitHubStats.mockResolvedValueOnce(SAMPLE)
    const GET = await loadGET()
    await GET({} as never)
    vi.advanceTimersByTime(CACHE_MS)
    fetchGitHubStats.mockRejectedValueOnce(new Error("upstream"))
    const stale = await GET({} as never)
    expect(stale.status).toBe(200)
    expectCdnSwr(stale)
    await expect(stale.json()).resolves.toEqual(SAMPLE)
    expect(fetchGitHubStats).toHaveBeenCalledTimes(2)
  })

  it("returns 503 JSON with no-store when fetch fails with empty cache", async () => {
    fetchGitHubStats.mockRejectedValueOnce(new Error("upstream"))
    const GET = await loadGET()
    const response = await GET({} as never)
    expect(response.status).toBe(503)
    expectNoStore(response)
    await expect(response.json()).resolves.toEqual({ error: "unavailable" })
  })
})

describe("non-GET /api/github-stats", () => {
  it.each(["POST", "OPTIONS"] as const)(
    "answers %s with JSON 405 and Allow: GET",
    async (method) => {
      vi.resetModules()
      fetchGitHubStats.mockReset()
      const handler = (await import("../pages/api/github-stats"))[method]
      const response = await handler({
        request: new Request("https://jseramn.tech/api/github-stats", { method }),
      } as never)
      expect(response.status).toBe(405)
      expect(response.headers.get("Allow")).toBe("GET")
      await expect(response.json()).resolves.toEqual({ error: "method_not_allowed" })
      expect(fetchGitHubStats).not.toHaveBeenCalled()
    },
  )
})

describe("fetchGitHubStats public events", () => {
  it("always requests /events/public even when a token is set", async () => {
    const ok = (body: unknown) => ({ ok: true, json: async () => body })
    const fetchMock = vi.fn(async (input: RequestInfo, _init?: RequestInit) => {
      const url = String(input)
      if (url.includes("github-contributions-api")) return ok({ contributions: [], total: {} })
      if (url.includes("/events/public")) return ok([])
      return { ok: false, json: async () => ({}) }
    })
    vi.stubGlobal("fetch", fetchMock)
    const { fetchGitHubStats: fetchStats } =
      await vi.importActual<typeof import("./githubStats")>("./githubStats")
    await fetchStats("jseramn", "ghs_test_token")
    const urls = fetchMock.mock.calls.map(([input]) => String(input))
    expect(urls.some((u) => u.includes("/users/jseramn/events/public?per_page=30"))).toBe(true)
    expect(urls.some((u) => /\/events\?per_page=/.test(u))).toBe(false)
    const headers = fetchMock.mock.calls.find(([input]) =>
      String(input).includes("/events/public"),
    )?.[1]?.headers as Record<string, string> | undefined
    expect(headers?.Authorization).toBe("Bearer ghs_test_token")
    vi.unstubAllGlobals()
  })
})
